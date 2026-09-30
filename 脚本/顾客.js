/* ============================================================
   脚本 / 顾客 —— 到店排队、收银台接待、兑换/购买/偷窃/抢劫、
   员工自动售卖、履历与排序
   流程：补货 → 上架 → 顾客到店排队 → 玩家（或收银员）接待 →
   顾客行为（兑换积分/购买/偷窃/抢劫，可多行为组合）。
   小卖部（1 级）不会出现偷窃与抢劫，超市 2 级起才会；
   凡偷窃抢劫由系统自动判定并执行，玩家只需看弹窗。
   ============================================================ */
window.SG = window.SG || {};
SG.Cust = (function () {
  var cfg = function () { return DATA.config; };

  function genName(state) {
    var n = DATA.names;
    var gender = SG.u.chance(0.5) ? 'male' : 'female';
    var given = gender === 'male' ? SG.u.pick(n.male) : SG.u.pick(n.female);
    return { name: SG.u.pick(n.surnames) + given, gender: gender };
  }
  function genPersona() {
    var r = Math.random();
    if (r < 0.06) return 'bad';      // 品行不端
    if (r < 0.14) return 'sick';     // 病患
    if (r < 0.22) return 'rich';     // 囤货商人
    if (r < 0.28) return 'wander';   // 拾荒者
    return 'normal';
  }
  function newCustomer(state) {
    var g = genName();
    var id = 'c' + (state.custSeq++);
    var age = SG.u.rint(14, 78);
    var c = {
      id: id, name: g.name, gender: g.gender, age: age,
      points: 0, visits: 0, history: [],
      bannedUntil: 0, blacklist: false, isEmployee: false,
      persona: genPersona(), lastVisitDay: 0
    };
    state.customers[id] = c;
    return c;
  }
  function addHistory(c, text) {
    c.history.push({ day: c.lastVisitDay || SG.State.getState().day, text: text });
    if (c.history.length > 60) c.history.shift();
  }

  /* 客流上限（结合基地人数修正） */
  function capacityOf(state) {
    var areaSum = 0;
    for (var k in state.store.areas) areaSum += (cfg().AREAS[k] || {}).cap || 0;
    var empBonus = state.employees.length * 1.5;
    var shopBonus = 0;
    if (state.store.dlc.shops.cinema) shopBonus += 2;
    if (state.store.dlc.shops.comshop) shopBonus += 2;
    if (state.store.dlc.shops.carshop) shopBonus += 3;
    var base = 4 + state.store.level * 2 + state.store.shieldLv * 2 + areaSum + shopBonus + empBonus;
    /* 基地人数修正：人多的基地客流更多 */
    if (state.bases && state.store.location) {
      var b = SG.Map.base(state);
      if (b) base *= (0.7 + b.pop / 2);
    }
    /* 尸潮未防御：客流减半 */
    if (typeof SG.Time !== 'undefined' && SG.Time.hazardDef && SG.Time.hazardDef(state) &&
        SG.Time.hazardDef(state).id === 'horde' && !SG.Time.hazardProtected(state)) {
      base *= 0.5;
    }
    return Math.max(3, Math.floor(base));
  }

  /* 每小时到店一批：顾客进入店内队列，等待接待（不立即交易） */
  function hourlyWave(state) {
    var cap = capacityOf(state);
    var lvl = state.store.level, emp = state.employees.length, sh = state.store.shieldLv;
    var areaSum = 0;
    for (var k in state.store.areas) areaSum += (cfg().AREAS[k] || {}).cap || 0;
    var n = Math.floor(SG.u.rint(2, 4) + lvl + emp + sh * 0.5 + areaSum * 0.35);
    var room = cap - state.visitors.length;
    n = Math.min(n, room, cap);
    if (n <= 0) return;
    for (var i = 0; i < n; i++) {
      if (state.ending) return;
      var regular = null;
      if (SG.u.chance(0.35)) {
        var pool = Object.keys(state.customers).map(function (k) { return state.customers[k]; })
          .filter(function (c) { return c.visits > 0 && !c.blacklist && c.bannedUntil < state.day && !c.isEmployee && state.visitors.indexOf(c.id) < 0 && SG.u.chance(0.6); });
        if (pool.length) regular = SG.u.pick(pool);
      }
      var c = regular || newCustomer(state);
      if (!regular) state.store.newCustomers += 1;
      c.lastVisitDay = state.day;
      state.visitors.push(c.id);
    }
    /* 有当班收银员 → 自动接待 */
    autoServe(state);
  }

  /* ---------- 偷窃 / 抢劫（2 级起，系统自动判定执行） ---------- */
  function moralityMod(state) {
    if (!state.bases || !state.store.location) return 0;
    var b = SG.Map.base(state);
    if (!b) return 0;
    /* 道德 0~100，低道德 → 概率上升（最多 +0.15），高道德 → 下降（最多 -0.05） */
    return (50 - b.morality) / 100 * 0.3;
  }
  function theftChance(c, state) {
    if (state.store.level < 2) return 0;
    var base = c.persona === 'bad' ? 0.16 : 0.03;
    base += Math.min(0.15, (state.store.level - 2) * 0.012);
    base += moralityMod(state);
    return Math.max(0, Math.min(0.5, base));
  }
  function robberyChance(c, state) {
    if (state.store.level < 2) return 0;
    var base = c.persona === 'bad' ? 0.045 : 0.007;
    base += Math.min(0.08, (state.store.level - 2) * 0.004);
    base += moralityMod(state) * 0.5;
    return Math.max(0, Math.min(0.25, base));
  }

  /* 系统自动处理偷窃 */
  function handleTheft(c, state) {
    var ev = { type: 'theft', text: '' };
    /* 偷走货架上一件商品（损失） */
    var stolen = null;
    var onShelf = Object.keys(state.shelf);
    if (onShelf.length) {
      var pid = SG.u.pick(onShelf);
      if ((state.shelf[pid] || 0) > 0) {
        state.shelf[pid] -= 1;
        if (state.shelf[pid] <= 0.0001) delete state.shelf[pid];
        var sp = SG.Data.product(pid);
        stolen = sp ? SG.Data.label(sp) : pid;
      }
    }
    var r = Math.random();
    if (r < 0.45) {
      ev.text = c.name + ' 试图偷窃' + (stolen ? '，被系统电击警告后交出了' + stolen : '，被电击警告后老实了');
      ev.cls = 'warn';
    } else if (r < 0.8) {
      c.bannedUntil = state.day + SG.u.rint(7, 14);
      ev.text = c.name + ' 偷窃被抓，被系统驱逐出门，' + (c.bannedUntil - state.day) + ' 天内禁入';
      ev.cls = 'warn';
    } else {
      c.blacklist = true;
      ev.text = c.name + ' 多次偷窃且态度恶劣，被拉入永久黑名单';
      ev.cls = 'warn';
    }
    SG.Player.log(state, ev.text, 'warn');
    return ev;
  }
  /* 系统自动处理抢劫 */
  function handleRobbery(c, state) {
    var ev = { type: 'robbery', text: '' };
    var r = Math.random();
    if (r < 0.6) {
      c.bannedUntil = state.day + SG.u.rint(15, 30);
      ev.text = c.name + ' 试图抢劫，被保护罩当场制服并驱逐，' + (c.bannedUntil - state.day) + ' 天内禁入';
      ev.cls = 'warn';
    } else if (r < 0.92) {
      c.blacklist = true;
      ev.text = c.name + ' 持械抢劫，被系统重创后拉入永久黑名单';
      ev.cls = 'warn';
    } else {
      c.blacklist = true;
      ev.text = c.name + ' 试图对店员实施暴力，被保护罩当场抹杀。所有顾客噤若寒蝉。';
      ev.cls = 'warn';
    }
    SG.Player.log(state, ev.text, 'warn');
    return ev;
  }

  /* ---------- 接待一位顾客 ---------- */
  function serveVisitor(cid, accept, state) {
    var c = state.customers[cid];
    if (!c) return { ok: false, msg: '找不到这位顾客' };
    var idx = state.visitors.indexOf(cid);
    if (idx < 0) return { ok: false, msg: '该顾客已经离开' };
    state.visitors.splice(idx, 1);
    c.lastVisitDay = state.day;
    var out = { ok: true, hist: [], events: [], refused: false, exchanged: 0, spent: 0, items: [], theft: null, robbery: null };
    if (c.blacklist) { out.hist.push('黑名单顾客被系统拒之门外'); addHistory(c, out.hist.join('；')); return out; }
    /* 1. 偷窃 / 抢劫：系统自动判定并执行 */
    if (SG.u.chance(theftChance(c, state))) out.theft = handleTheft(c, state);
    if (SG.u.chance(robberyChance(c, state))) out.robbery = handleRobbery(c, state);
    if (out.theft || out.robbery) out.events.push(out.theft || out.robbery);
    /* 2. 店主选择：拒绝售卖 → 顾客离开 */
    if (!accept) {
      out.refused = true;
      out.hist.push('店主拒绝了接待，' + c.name + '悻悻离开');
      addHistory(c, out.hist.join('；'));
      return out;
    }
    /* 3. 兑换（携带现金/物资/硬通货/晶核） */
    if (c.bannedUntil < state.day) {
      var pay = SG.Econ.payMix(state.day);
      var val = SG.Econ.exchange(pay, state);
      c.points += val;
      out.exchanged = val;
      out.hist.push('用' + pay.label + '兑换了 ' + SG.u.money(val) + ' 积分');
    }
    /* 4. 购物（只买货架上的商品） */
    var bought = shopFromShelf(c, state);
    if (bought.items.length) {
      c.visits += 1;
      out.spent = bought.spent;
      out.items = bought.items;
      out.hist.push('购买了：' + bought.items.map(function (x) { return x.name + '×' + x.qty; }).join('、'));
    } else if (out.exchanged > 0) {
      c.visits += 1;
      out.hist.push('兑换了积分，但货架空空，没买到东西');
    }
    if (out.hist.length) addHistory(c, out.hist.join('；'));
    return out;
  }

  /* 员工自动售卖：当班收银员自动接待当前队列 */
  function autoServe(state) {
    if (!state.visitors.length) return null;
    var cashier = null;
    for (var i = 0; i < state.employees.length; i++) {
      var e = state.employees[i];
      if (state.store.cashiers.indexOf(e.id) >= 0 && SG.Emp.onDuty(e, state)) { cashier = e; break; }
    }
    if (!cashier) return null;
    var done = 0, income = 0;
    var ids = state.visitors.slice();
    var notes = [];
    ids.forEach(function (cid) {
      var r = serveVisitor(cid, true, state);
      if (r.ok === false) return;
      done++;
      income += r.spent;
      if (r.theft) notes.push(r.theft.text);
      if (r.robbery) notes.push(r.robbery.text);
    });
    if (done > 0) {
      SG.Player.log(state, '收银员' + cashier.name + '自动接待了 ' + done + ' 位顾客，收入 ' + SG.u.money(income) + ' 积分' + (notes.length ? '。' + notes.join('；') : '。'));
      SG.State.save();
    }
    return { cashier: cashier, done: done, income: income, notes: notes };
  }

  /* 商品大类 → 偏好权重键 */
  var CATKEY = {
    '饮用水': 'water', '饮料': 'drink', '速食': 'instant', '零食': 'snack',
    '米面粮油': 'grain', '蔬菜': 'veg', '水果': 'fruit', '蛋奶': 'dairy',
    '水产': 'aquatic', '肉类': 'meat', '日用': 'daily', '药品': 'med',
    '娱乐': 'ent', '衣物': 'cloth', '枪械': 'weapon', '调料厨具': 'spice'
  };

  /* 顾客购物偏好权重（按商品大类） */
  function prefsOf(c, state) {
    var w = {
      water: 0.15, instant: 0.19, snack: 0.09, drink: 0.09, grain: 0.08,
      daily: 0.12, med: 0.05, veg: 0.05, fruit: 0.04, meat: 0.04,
      aquatic: 0.03, dairy: 0.04, ent: 0.01, cloth: 0.00, weapon: 0.00, spice: 0.02, tool: 0.01
    };
    if (c.persona === 'rich') { w.grain += 0.05; w.meat += 0.06; w.aquatic += 0.05; w.ent += 0.03; w.drink += 0.03; }
    if (c.persona === 'sick') { w.med += 0.15; w.water += 0.06; }
    if (c.persona === 'wander') { w.water += 0.08; w.instant += 0.08; w.med += 0.03; }
    if (state.store.areas.ent) w.ent += 0.05;
    if (state.store.areas.cloth) w.cloth += 0.04;
    if (state.store.areas.pharm) w.med += 0.04;
    if (state.store.areas.arms) w.weapon += 0.01;
    if (state.store.dlc.shops.cinema) w.ent += 0.04;
    if (state.store.dlc.shops.clothes) w.cloth += 0.04;
    return w;
  }

  /* 顾客购物：从货架按偏好购买（富裕值高的基地买得多） */
  function shopFromShelf(c, state) {
    var teacher = SG.Player.identityOf(state).id === 'teacher';
    var w = prefsOf(c, state);
    var stock = SG.Inv.availableOnShelf(state).filter(function (p) { return SG.Data.canStock(p, state); });
    var result = { items: [], spent: 0 };
    if (!stock.length) return result;
    var rounds = SG.u.rint(1, 4) + (teacher ? 1 : 0);
    if (state.bases && state.store.location) {
      var b = SG.Map.base(state);
      if (b) rounds = Math.ceil(rounds * (0.7 + b.wealth / 2));
    }
    var guard = 0;
    while (rounds > 0 && guard < 30) {
      guard++;
      var total = 0;
      for (var cat in w) total += w[cat];
      var r = Math.random() * total, chosen = null;
      for (var cat2 in w) { r -= w[cat2]; if (r <= 0) { chosen = cat2; break; } }
      var candidates = stock.filter(function (p) { return CATKEY[p.cat] === chosen; });
      if (!candidates.length) { rounds--; continue; }
      var p = SG.u.pick(candidates);
      var maxQty = Math.floor(c.points / p.price);
      if (maxQty < 1) { rounds--; continue; }
      var q = Math.min(SG.u.rint(1, 2), maxQty, Math.floor(state.shelf[p.id] || 0));
      if (q < 1) { rounds--; continue; }
      var cost = Math.round(p.price * q * 100) / 100;
      SG.Inv.sellFromShelf(p.id, q, state);
      c.points = Math.round((c.points - cost) * 100) / 100;
      result.items.push({ name: SG.Data.label(p), qty: q, price: cost });
      result.spent += cost;
      rounds--;
    }
    return result;
  }

  /* ---------- 顾客列表与排序 ---------- */
  function list(state) {
    return Object.keys(state.customers).map(function (k) { return state.customers[k]; });
  }
  function sorted(state, key) {
    var arr = list(state);
    var k = key || 'visits';
    if (k === 'visits') arr.sort(function (a, b) { return b.visits - a.visits; });
    else if (k === 'points') arr.sort(function (a, b) { return b.points - a.points; });
    else if (k === 'name') arr.sort(function (a, b) { return a.name.localeCompare(b.name, 'zh'); });
    else if (k === 'random') arr = SG.u.shuffle(arr);
    else if (k === 'reverse') arr.sort(function (a, b) { return a.visits - b.visits; });
    return arr;
  }
  function newCustomerCount(state) { return state.store.newCustomers; }
  function waitingList(state) {
    return state.visitors.map(function (id) { return state.customers[id]; }).filter(Boolean);
  }

  return {
    genName: genName, newCustomer: newCustomer, addHistory: addHistory,
    capacityOf: capacityOf, hourlyWave: hourlyWave, serveVisitor: serveVisitor,
    autoServe: autoServe, shop: shopFromShelf, list: list, sorted: sorted,
    newCustomerCount: newCustomerCount, waitingList: waitingList,
    theftChance: theftChance, robberyChance: robberyChance
  };
})();

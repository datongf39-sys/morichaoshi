/* ============================================================
   脚本 / 金手指
   拼夕夕系统：每日 30~50 个品类，任意商品 0.01 积分/件
   变废为宝系统：每日 40~80 个品类，外出探索捡垃圾 → 倍数奖励
   ============================================================ */
window.SG = window.SG || {};
SG.Gf = (function () {
  var cfg = function () { return DATA.config; };
  var g = function () { return DATA.golden; };

  /* 拼夕夕品类池（加权：水/速食等必需品更容易出现；蔬果肉等高级生鲜低概率） */
  function pddPoolWeighted() {
    var arr = [];
    DATA.products.forEach(function (p) {
      var w = 1;
      if (p.kind === 'water') w = 5;
      else if (p.kind === 'instant') w = 3;
      else if (p.kind === 'drink' || p.kind === 'snack' || p.kind === 'grain' || p.kind === 'daily') w = 2;
      else if (p.kind === 'med') w = 1.5;
      /* 蔬果肉类等高级生鲜（小卖部/便利店不卖）：金手指低概率流出，获得后仅能自用 */
      if (p.kind === 'veg' || p.kind === 'fruit' || p.kind === 'meat' || p.kind === 'aquatic') w = 0.15;
      for (var i = 0; i < w; i++) arr.push(p.id);
    });
    return arr;
  }
  function refresh(state) {
    if (state.gf.pddDay !== state.day) {
      var n = SG.u.rint(g().pddDaily[0], g().pddDaily[1]);
      var pool = pddPoolWeighted();
      var picked = [];
      for (var i = 0; i < n; i++) picked.push(SG.u.pick(pool));
      var items = SG.u.uniq(picked);
      /* 加权随机去重后可能不足品类下限：用全品类补足 */
      if (items.length < g().pddDaily[0]) {
        var all = SG.u.uniq(pool);
        for (var k = 0; k < all.length && items.length < g().pddDaily[0]; k++) {
          if (items.indexOf(all[k]) < 0) items.push(all[k]);
        }
      }
      state.gf.pddItems = items;
      state.gf.pddDay = state.day;
    }
    if (state.gf.wasteDay !== state.day) {
      var n2 = SG.u.rint(g().wasteDaily[0], g().wasteDaily[1]);
      var wpool = SG.Data.wastePool();
      var witems = [];
      for (var j = 0; j < n2; j++) {
        var e = SG.u.pick(wpool);
        witems.push({ pid: e.pid, mult: e.mult, name: e.name });
      }
      state.gf.wasteItems = witems;
      state.gf.wasteDay = state.day;
    }
  }
  function pddItems(state) { refresh(state); return state.gf.pddItems.map(function (pid) { return SG.Data.product(pid); }).filter(Boolean); }
  function wasteItems(state) { refresh(state); return state.gf.wasteItems; }

  /* 拼夕夕补货：进货价 = 售价的 20%（真实扣积分） */
  function restock(pid, qty, state) {
    refresh(state);
    if (state.gf.pddItems.indexOf(pid) < 0) return { ok: false, msg: '今天拼夕夕没有这个品类' };
    var p = SG.Data.product(pid);
    if (!p) return { ok: false, msg: '没有该商品' };
    var cost = Math.round(p.price * g().pddRate * qty * 100) / 100;
    if (state.points < cost) return { ok: false, msg: '积分不足（进货需 ' + SG.u.money(cost) + ' 积分）' };
    var r = SG.Inv.add(pid, qty, state);
    if (!r.ok) return r;
    state.points -= cost;
    var mins = Math.min(10, qty * 2);
    if (SG.Player.identityOf(state).id === 'coder') mins = Math.ceil(mins * 0.7);
    SG.Player.log(state, '拼夕夕进货：' + SG.Data.label(p) + ' ×' + qty + '（-' + SG.u.money(cost) + ' 积分）');
    SG.State.save();
    return { ok: true, msg: '已补货 ' + SG.Data.label(p) + ' ×' + qty + '（-' + SG.u.money(cost) + ' 积分）', minutes: mins, sta: -Math.min(12, qty) };
  }
  /* 一键补货：按预算补货，今日品类各补最多 10 件 */
  function oneClickRestock(state) {
    refresh(state);
    var budget = Math.min(state.points, 600);   // 单次一键补货花费上限
    var spent = 0, bought = 0, kinds = 0;
    state.gf.pddItems.forEach(function (pid) {
      if (spent >= budget) return;
      var p = SG.Data.product(pid);
      if (!p) return;
      var unit = Math.round(p.price * g().pddRate * 100) / 100;
      var want = 10;
      var q = Math.min(want, Math.floor((budget - spent) / unit));
      if (q < 1) return;
      var r = SG.Inv.add(pid, q, state);
      if (!r.ok) return;
      state.points -= unit * q;
      spent += unit * q;
      bought += q;
      kinds++;
    });
    if (!bought) return { ok: false, msg: '没有可补的货（积分不足或仓库已满）' };
    SG.Player.log(state, '一键补货：' + kinds + ' 个品类共补 ' + bought + ' 件（-' + SG.u.money(spent) + ' 积分）');
    SG.State.save();
    return { ok: true, msg: '一键补货完成：' + kinds + ' 个品类 ' + bought + ' 件（-' + SG.u.money(spent) + ' 积分）', minutes: Math.min(30, kinds), sta: -Math.min(15, bought) };
  }
  /* 每日自动补货：各品类补到 10 件，总预算受积分限制 */
  function autoRestock(state) {
    refresh(state);
    var budget = Math.min(state.points, 300);
    var spent = 0;
    state.gf.pddItems.forEach(function (pid) {
      if (spent >= budget) return;
      var p = SG.Data.product(pid);
      if (!p) return;
      var unit = Math.round(p.price * g().pddRate * 100) / 100;
      var cur = state.inventory[pid] || 0;
      var want = p.kind === 'water' || p.kind === 'instant' ? 12 : 10;
      var q = Math.max(0, Math.min(Math.floor(want - cur), Math.floor((budget - spent) / unit)));
      if (q < 1) return;
      var r = SG.Inv.add(pid, q, state);
      if (!r.ok) return;
      state.points -= unit * q;
      spent += unit * q;
    });
  }

  /* ---------- 变废为宝：外出探索 ---------- */
  function dangerRate(state) {
    var base = 0.15;
    if (SG.Player.identityOf(state).id === 'soldier') base *= 0.5;
    if (state.store.location === 'riverside') base *= 0.8;
    if (state.store.location === 'cityedge') base *= 1.3;
    return base;
  }
  function gainMult(state) {
    var m = 1;
    if (SG.Player.identityOf(state).id === 'soldier') m *= 1.2;
    if (state.store.location === 'wasteland') m *= 1.5;
    return m;
  }
  function explore(hours, state) {
    refresh(state);
    hours = Math.max(1, Math.min(4, hours));
    var staCost = 12 * hours;
    if (SG.Player.identityOf(state).id === 'courier') staCost = Math.ceil(staCost * 0.75);
    if (state.stamina < staCost) return { ok: false, msg: '体力不足，需要至少 ' + staCost + ' 体力' };
    state.stamina = SG.u.clamp(state.stamina - staCost, 0, 140);
    state.gf = state.gf || {};
    state.gf.exploreCount = (state.gf.exploreCount || 0) + 1;
    var finds = [], events = [], crystals = [];
    var stage = SG.Econ.stageOf(state.day);
    var cryChance = stage === 'late' ? 0.12 : (stage === 'mid' ? 0.08 : (SG.Econ.monthOf(state.day) > 6 ? 0.03 : 0));
    for (var h = 0; h < hours; h++) {
      var n = SG.u.rint(1, 3);
      for (var i = 0; i < n; i++) {
        var w = SG.u.pick(state.gf.wasteItems);
        var qty = Math.round(w.mult * gainMult(state));
        SG.Inv.add(w.pid, qty, state);
        finds.push({ name: w.name, pid: w.pid, qty: qty });
      }
      if (SG.u.chance(cryChance)) {
        var tier = SG.u.pick(cfg().CRYSTAL_TIERS[stage === 'early' ? 'low' : (stage === 'mid' ? 'mid' : 'high')]);
        var cq = SG.u.rint(1, 2);
        SG.Econ.addCrystal(tier, cq, state);
        crystals.push({ tier: tier, qty: cq });
      }
      /* 危险事件 */
      if (SG.u.chance(dangerRate(state))) {
        var armor = SG.Inv.has('wp08', 1, state);
        var dmg = armor ? 7 : 15;
        SG.Player.addStat(state, 'hp', -dmg);
        events.push({ text: '遭遇劫匪，受了伤（生命值 -' + dmg + '）', cls: 'warn' });
        /* 处理伤口 */
        var handled = false;
        if (SG.Inv.has('md13', 0.2, state) || SG.Inv.has('md14', 0.25, state)) {
          if (SG.Inv.has('md13', 0.2, state)) SG.Inv.take('md13', 0.2, state); else SG.Inv.take('md14', 0.25, state);
          handled = true;
          events.push({ text: '用消毒液处理了伤口。', cls: '' });
        } else if (SG.Inv.has('md12', 0.25, state)) {
          SG.Inv.take('md12', 0.25, state);
          SG.Player.addStat(state, 'hp', 20);
          handled = true;
          events.push({ text: '用绷带包扎了伤口（+20 生命值）。', cls: '' });
        }
        if (!handled) {
          events.push({ text: '没有消毒/包扎用品，伤口有感染风险。', cls: 'warn' });
          if (SG.u.chance(0.35)) SG.Player.gainDisease(state, 'infection', '探索途中伤口未处理');
        } else {
          events.push({ text: '及时处理了伤口，暂无感染风险。', cls: '' });
        }
      }
    }
    var minutes = hours * 60 + 30;
    SG.Player.log(state, '外出探索 ' + hours + ' 小时，捡到 ' + finds.length + ' 件垃圾' +
      (crystals.length ? '，收获晶核 ' + crystals.map(function (c) { return cfg().CRYSTAL_LABEL[c.tier] + '×' + c.qty; }).join('、') : '') + '。');
    SG.State.save();
    return { ok: true, minutes: minutes, sta: -staCost, finds: finds, events: events, crystals: crystals };
  }

  return {
    refresh: refresh, pddItems: pddItems, wasteItems: wasteItems,
    restock: restock, oneClickRestock: oneClickRestock, autoRestock: autoRestock,
    explore: explore, dangerRate: dangerRate, gainMult: gainMult
  };
})();

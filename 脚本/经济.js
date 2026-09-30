/* ============================================================
   脚本 / 经济 —— 积分、支付方式混合、汇率、晶核
   积分与商品的兑换比例不随游戏进程变化，始终唯一；
   顾客能兑换到的积分则与游戏进程有关。
   ============================================================ */
window.SG = window.SG || {};
SG.Econ = (function () {
  var cfg = function () { return DATA.config; };

  function stageOf(day) { return SG.u.dayInfo(day).stage; }
  function monthOf(day) { return SG.u.dayInfo(day).month; }

  /* 现金逐月贬值 */
  function cashRate(month) {
    var c = cfg().CASH_DECAY;
    return c['m' + month] != null ? c['m' + month] : c.m6;
  }
  /* 物品逐月损耗与过期 */
  function goodsRate(month) {
    return Math.max(0.05, Math.pow(cfg().GOODS_DECAY_BASE, month - 1));
  }

  /* 支付方式混合：按末日月数决定顾客携带的兑换物 */
  function payMix(day) {
    var stage = stageOf(day);
    var month = monthOf(day);
    var r = Math.random();
    if (stage === 'early') {
      var total; var cashW, goodsW, hardW, cryW;
      if (month === 1) { cashW = 1, goodsW = 0, hardW = 0, cryW = 0; }
      else if (month === 2) { cashW = 0.25, goodsW = 0.65, hardW = 0.10, cryW = 0; }
      else if (month === 3) { cashW = 0.04, goodsW = 0.66, hardW = 0.25, cryW = 0.05; }
      else if (month <= 6) { cashW = 0.03, goodsW = 0.47, hardW = 0.30, cryW = 0.20; }
      else if (month <= 12) { cashW = 0, goodsW = 0.40, hardW = 0.32, cryW = 0.28; }
      else { cashW = 0, goodsW = 0.35, hardW = 0.35, cryW = 0.30; }
      total = cashW + goodsW + hardW + cryW;
      r = r * total;
      if (r < cashW) return makeCash(month);
      r -= cashW;
      if (r < goodsW) return makeGoods(month);
      r -= goodsW;
      if (r < hardW) return makeHard();
      return makeCrystal('early');
    }
    if (stage === 'mid') return makeCrystal('mid');
    return makeCrystal('late');
  }

  function makeCash(month) {
    var amount = SG.u.rint(10, 120);
    return { type: 'cash', label: '现金 ¥' + amount, value: Math.round(amount * cashRate(month) * 100) / 100 };
  }
  /* 顾客拿来换积分的"旧物"池：只收非生活必需品（末日前家里的闲置），
     绝不出现食物/水/药品/米面粮油等必需品——顾客自己也要活命。
     这些东西顾客直接折算成积分，实物不进玩家仓库。 */
  function exchangePool(state) {
    if (!SG.Econ._exPool) {
      var nonEss = ['cloth', 'ent', 'book', 'stationery', 'kitchen', 'tool', 'coffee', 'tea', 'candy', 'bakery'];
      SG.Econ._exPool = SG.Data.products.filter(function (p) {
        return nonEss.indexOf(p.kind) >= 0 && p.price >= 20;
      });
    }
    return SG.Econ._exPool;
  }
  function makeGoods(month) {
    var pool = exchangePool();
    var n = SG.u.rint(1, 2), items = [], val = 0;
    for (var i = 0; i < n; i++) {
      var p = SG.u.pick(pool);
      /* 旧物折价：1~2 件，高价物品通常只带 1 件 */
      var q = p.price >= 200 ? SG.u.rint(1, 1) : SG.u.rint(1, 2);
      items.push({ name: '旧' + SG.Data.label(p), qty: q, pid: p.id });
      val += p.price * q;
    }
    val = Math.round(val * goodsRate(month) * 100) / 100;
    var head = n === 1 ? '闲置旧物' : '一批旧物';
    return { type: 'goods', label: head + '：' + items.map(function (x) { return x.name + '×' + x.qty; }).join('、'), items: items, value: val };
  }
  function makeHard() {
    var keys = Object.keys(cfg().HARD_GOODS);
    var k = SG.u.pick(keys), g = cfg().HARD_GOODS[k];
    var q;
    if (k === 'gold') q = Math.round(SG.u.rand(0.5, 5) * 10) / 10;
    else if (k === 'cigarette') q = SG.u.rint(1, 3);
    else q = SG.u.rint(1, 2);
    var value = Math.round(g.rate * q * 100) / 100;
    return { type: 'hard', label: g.name + '×' + q + g.unit, kind: k, qty: q, value: value };
  }
  function makeCrystal(stage) {
    var tiers;
    if (stage === 'early') tiers = [1, 2, 3];
    else if (stage === 'mid') {
      var r = Math.random();
      tiers = r < 0.72 ? [1, 2, 3] : [4, 5, 6];
    } else {
      var r2 = Math.random();
      if (r2 < 0.10) tiers = [1, 2, 3];
      else if (r2 < 0.75) tiers = [4, 5, 6];
      else tiers = [7, 8, 9];
    }
    var tier = SG.u.pick(tiers);
    var q = SG.u.rint(1, 3);
    var value = cfg().CRYSTAL_RATE[tier] * q;
    return { type: 'crystal', label: cfg().CRYSTAL_LABEL[tier] + '×' + q, tier: tier, qty: q, value: value };
  }

  /* 顾客兑换 → 其个人积分（积分由此产生）；晶核实体由超市收取 */
  function exchange(pay, state) {
    if (pay.type === 'crystal') {
      addCrystal(pay.tier, pay.qty, state);
    }
    return pay.value;
  }
  function addCrystal(tier, qty, state) {
    state.crystals[tier] = (state.crystals[tier] || 0) + qty;
  }
  function crystalTotal(state) {
    var t = 0;
    for (var k in state.crystals) t += state.crystals[k];
    return t;
  }
  /* 玩家可把晶核按固定汇率兑换回积分（战略选择：升星 or 兑现） */
  function convertCrystals(tier, qty, state) {
    var rate = cfg().CRYSTAL_RATE[tier];
    if (!rate) return 0;
    if ((state.crystals[tier] || 0) < qty) return 0;
    state.crystals[tier] -= qty;
    state.points += rate * qty;
    return rate * qty;
  }
  function crystalValue(tier, qty) { return cfg().CRYSTAL_RATE[tier] * qty; }

  /* 点餐：每日随机 10 道菜（与厨房可做的菜品同源），花费积分直接兑换餐品 */
  function refreshOrderMenu(state) {
    var dishes = DATA.dishes;
    var n = Math.min(10, dishes.length);
    var menu = SG.u.shuffle(dishes).slice(0, n).map(function (d) { return d.id; });
    state.orderMenu = menu;
    state.orderDay = state.day;
  }
  function orderMeal(dishId, state) {
    var d = SG.Data.dish(dishId);
    if (!d) return { ok: false, msg: '没有这道菜' };
    if (state.points < d.price) return { ok: false, msg: '积分不足' };
    state.points -= d.price;
    return { ok: true, dish: d };
  }
  function orderMenu(state) { return state.orderMenu || []; }

  return {
    stageOf: stageOf, monthOf: monthOf, cashRate: cashRate, goodsRate: goodsRate,
    payMix: payMix, exchange: exchange, addCrystal: addCrystal,
    crystalTotal: crystalTotal, convertCrystals: convertCrystals, crystalValue: crystalValue,
    refreshOrderMenu: refreshOrderMenu, orderMeal: orderMeal, orderMenu: orderMenu
  };
})();

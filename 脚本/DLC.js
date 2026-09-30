/* ============================================================
   脚本 / DLC —— 餐馆（L3）、酒店（L6）、网络店铺（L7）
   升级逻辑与超市一致：分等级、花积分、指数增长
   ============================================================ */
window.SG = window.SG || {};
SG.Dlc = (function () {
  var cfg = function () { return DATA.config; };

  /* ---------- 餐馆 ---------- */
  function restaurantDef(state) {
    var lv = state.store.dlc.restaurant.lv;
    return lv ? cfg().RESTAURANT[lv - 1] : null;
  }
  function restaurantNext(state) { return cfg().RESTAURANT[state.store.dlc.restaurant.lv] || null; }
  function restaurantUnlocked(state) { return state.store.level >= 3; }
  function unlockRestaurant(state) {
    if (!restaurantUnlocked(state)) return { ok: false, msg: '需要超市 3 级才能解锁餐馆 DLC' };
    if (state.store.dlc.restaurant.lv) return { ok: false, msg: '已经解锁了' };
    var cost = cfg().RESTAURANT[0].cost;
    if (state.points < cost) return { ok: false, msg: '积分不足（需要 ' + SG.u.money(cost) + '）' };
    state.points -= cost;
    state.store.dlc.restaurant.lv = 1;
    SG.Player.log(state, 'DLC 解锁：餐馆「' + cfg().RESTAURANT[0].name + '」开业了！', '');
    SG.State.save();
    return { ok: true, msg: '餐馆「' + cfg().RESTAURANT[0].name + '」开业了！' };
  }
  function upgradeRestaurant(state) {
    var nxt = restaurantNext(state);
    if (!nxt) return { ok: false, msg: '餐馆已满级' };
    if (state.points < nxt.cost) return { ok: false, msg: '积分不足（需要 ' + SG.u.money(nxt.cost) + '）' };
    state.points -= nxt.cost;
    state.store.dlc.restaurant.lv += 1;
    SG.Player.log(state, '餐馆升级：' + nxt.name + '。', '');
    SG.State.save();
    return { ok: true, msg: '餐馆升级为「' + nxt.name + '」！' };
  }
  function setMenu(state, dishIds) {
    state.store.dlc.restaurant.menu = dishIds;
    SG.State.save();
  }
  function restaurantDaily(state) {
    var def = restaurantDef(state);
    if (!def) return;
    var menu = state.store.dlc.restaurant.menu.length ? state.store.dlc.restaurant.menu.slice()
      : DATA.dishes.slice().sort(function () { return Math.random() - 0.5; }).slice(0, 5).map(function (d) { return d.id; });
    var served = 0, income = 0;
    for (var i = 0; i < def.portions; i++) {
      var did = SG.u.pick(menu);
      var d = SG.Data.dish(did);
      if (!d) continue;
      var ok = true;
      for (var pid in d.ing) {
        if (!SG.Inv.has(pid, d.ing[pid], state)) { ok = false; break; }
      }
      if (!ok) continue;
      for (var pid2 in d.ing) SG.Inv.take(pid2, d.ing[pid2], state);
      income += d.price;
      served++;
    }
    if (served > 0) {
      state.points += income;
      state.cumPoints += income;
      state.dayIncome = (state.dayIncome || 0) + income;
      SG.Player.log(state, '餐馆今日售出 ' + served + ' 份餐品，收入 ' + SG.u.money(income) + ' 积分。');
    }
  }

  /* ---------- 酒店 ---------- */
  function hotelDef(state) {
    var lv = state.store.dlc.hotel.lv;
    return lv ? cfg().HOTEL[lv - 1] : null;
  }
  function hotelNext(state) { return cfg().HOTEL[state.store.dlc.hotel.lv] || null; }
  function hotelUnlocked(state) { return state.store.level >= 6; }
  function unlockHotel(state) {
    if (!hotelUnlocked(state)) return { ok: false, msg: '需要超市 6 级才能解锁酒店 DLC' };
    if (state.store.dlc.hotel.lv) return { ok: false, msg: '已经解锁了' };
    var cost = cfg().HOTEL[0].cost;
    if (state.points < cost) return { ok: false, msg: '积分不足（需要 ' + SG.u.money(cost) + '）' };
    state.points -= cost;
    state.store.dlc.hotel.lv = 1;
    SG.Player.log(state, 'DLC 解锁：酒店「' + cfg().HOTEL[0].name + '」开门迎客。', '');
    SG.State.save();
    return { ok: true, msg: '酒店「' + cfg().HOTEL[0].name + '」开门迎客！' };
  }
  function upgradeHotel(state) {
    var nxt = hotelNext(state);
    if (!nxt) return { ok: false, msg: '酒店已满级' };
    if (state.points < nxt.cost) return { ok: false, msg: '积分不足（需要 ' + SG.u.money(nxt.cost) + '）' };
    state.points -= nxt.cost;
    state.store.dlc.hotel.lv += 1;
    SG.Player.log(state, '酒店升级：' + nxt.name + '。', '');
    SG.State.save();
    return { ok: true, msg: '酒店升级为「' + nxt.name + '」！' };
  }
  function hotelDaily(state) {
    var def = hotelDef(state);
    if (!def) return;
    var income = def.income;
    if (SG.Player.waterCount(state) < 6) {
      income = Math.floor(income * 0.5);
    } else {
      SG.Player.takeWater(state, 6);
      if (SG.Inv.has('dl09', 0.2, state)) SG.Inv.take('dl09', 0.2, state);
    }
    state.points += income;
    state.cumPoints += income;
    state.dayIncome = (state.dayIncome || 0) + income;
    SG.Player.log(state, '酒店今日收入 ' + SG.u.money(income) + ' 积分。');
  }

  /* ---------- 网络店铺（L7 + 网络专区） ---------- */
  function shopsUnlocked(state) { return state.store.level >= 7 && !!state.store.areas.network; }
  function buyShop(shopId, state) {
    if (!shopsUnlocked(state)) return { ok: false, msg: '需要超市 7 级并解锁网络专区' };
    var shop = cfg().SHOPS.filter(function (s) { return s.id === shopId; })[0];
    if (!shop) return { ok: false, msg: '没有这个店铺' };
    if (state.store.dlc.shops[shopId]) return { ok: false, msg: '已经开了' };
    if (state.points < shop.cost) return { ok: false, msg: '积分不足（需要 ' + SG.u.money(shop.cost) + '）' };
    state.points -= shop.cost;
    state.store.dlc.shops[shopId] = true;
    SG.Player.log(state, '网络店铺开业：' + shop.name + '。' + shop.fx, '');
    SG.State.save();
    return { ok: true, msg: shop.name + '开业了！' + shop.fx };
  }
  function shopDaily(state) {
    for (var sid in state.store.dlc.shops) {
      var shop = cfg().SHOPS.filter(function (s) { return s.id === sid; })[0];
      if (!shop) continue;
      state.points += shop.income;
      state.cumPoints += shop.income;
      state.dayIncome = (state.dayIncome || 0) + shop.income;
    }
  }

  function daily(state) {
    restaurantDaily(state);
    hotelDaily(state);
    shopDaily(state);
  }

  return {
    restaurantDef: restaurantDef, restaurantNext: restaurantNext, restaurantUnlocked: restaurantUnlocked,
    unlockRestaurant: unlockRestaurant, upgradeRestaurant: upgradeRestaurant, setMenu: setMenu,
    hotelDef: hotelDef, hotelNext: hotelNext, hotelUnlocked: hotelUnlocked,
    unlockHotel: unlockHotel, upgradeHotel: upgradeHotel,
    shopsUnlocked: shopsUnlocked, buyShop: buyShop, daily: daily
  };
})();

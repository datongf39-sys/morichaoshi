/* ============================================================
   脚本 / 界面 / DLC界面 —— 餐馆、酒店、网络店铺
   ============================================================ */
window.SG = window.SG || {};
SG.Screens.dlc = function (body, state) {
  var cfg = DATA.config;
  var h = '';

  /* ---------- 餐馆 ---------- */
  h += '<div class="panel"><h3>餐馆 DLC <span class="chip">超市 3 级解锁</span></h3>';
  if (state.store.level < 3) {
    h += '<p class="muted">末日里的一口热饭，比黄金更珍贵。超市 3 级后，可解锁餐馆——用你库存里的食材做饭卖给顾客。</p>';
  } else if (!state.store.dlc.restaurant.lv) {
    var r0 = cfg.RESTAURANT[0];
    h += '<p class="muted">' + r0.desc + '</p>' + SG.UI.btn('解锁餐馆（' + SG.u.money(r0.cost) + ' 积分）', 'UI.unlockRestaurant', [], 'primary');
  } else {
    var rd = SG.Dlc.restaurantDef(state);
    var rn = SG.Dlc.restaurantNext(state);
    h += '<div class="cols"><div style="flex:1"><b>' + rd.name + '</b>（' + rd.lv + ' 级）<div class="small muted">' + rd.desc + '</div>' +
      '<div class="small">每日售出 ' + rd.portions + ' 份 · 菜单中的菜品</div></div>' +
      (rn ? SG.UI.btn('升级为' + rn.name + '（' + SG.u.money(rn.cost) + '）', 'UI.upgradeRestaurant', [], 'sm') : '<span class="chip ok">已满级</span>') + '</div>';
    /* 菜单编辑 */
    h += '<div class="mt"><h4>餐馆菜单（每日按菜单做菜，消耗库存食材）</h4><div class="menu-editor">';
    DATA.dishes.forEach(function (d) {
      var checked = state.store.dlc.restaurant.menu.indexOf(d.id) >= 0;
      h += '<label class="menu-item"><input type="checkbox" value="' + d.id + '"' + (checked ? ' checked' : '') + '> ' + d.name + ' <span class="muted">(' + d.cuisine + ' · ' + SG.u.money(d.price) + ' 积分/份)</span></label>';
    });
    h += '</div>' + SG.UI.btn('保存菜单', 'UI.saveMenu', [], 'sm primary') + '</div>';
  }
  h += '</div>';

  /* ---------- 酒店 ---------- */
  h += '<div class="panel"><h3>酒店 DLC <span class="chip">超市 6 级解锁</span></h3>';
  if (state.store.level < 6) {
    h += '<p class="muted">末日里最奢侈的愿望，是睡一个安稳觉。超市 6 级后，解锁酒店——提供住宿，每日稳定营收。</p>';
  } else if (!state.store.dlc.hotel.lv) {
    var h0 = cfg.HOTEL[0];
    h += '<p class="muted">' + h0.desc + '</p>' + SG.UI.btn('解锁酒店（' + SG.u.money(h0.cost) + ' 积分）', 'UI.unlockHotel', [], 'primary');
  } else {
    var hd = SG.Dlc.hotelDef(state);
    var hn = SG.Dlc.hotelNext(state);
    h += '<div class="cols"><div style="flex:1"><b>' + hd.name + '</b>（' + hd.lv + ' 级）<div class="small muted">' + hd.desc + '</div>' +
      '<div class="small">每日收入 ' + SG.u.money(hd.income) + ' 积分（需保障供水）</div></div>' +
      (hn ? SG.UI.btn('升级为' + hn.name + '（' + SG.u.money(hn.cost) + '）', 'UI.upgradeHotel', [], 'sm') : '<span class="chip ok">已满级</span>') + '</div>';
  }
  h += '</div>';

  /* ---------- 网络店铺 ---------- */
  h += '<div class="panel"><h3>网络店铺 <span class="chip">超市 7 级 + 网络专区</span></h3>';
  if (!SG.Dlc.shopsUnlocked(state)) {
    h += '<p class="muted">末日第 7 年网络重连后，解锁网络专区即可开设服装店、电影院、通讯店、车行等具体店铺。</p>';
  } else {
    h += '<div class="shop-grid">';
    cfg.SHOPS.forEach(function (s) {
      var owned = !!state.store.dlc.shops[s.id];
      h += '<div class="shop-card' + (owned ? ' owned' : '') + '"><div class="shop-name">' + s.name + (owned ? ' <span class="chip ok">营业中</span>' : '') + '</div>' +
        '<div class="small muted">' + s.desc + '</div><div class="small">' + s.fx + '</div><div class="small">每日收入 ' + SG.u.money(s.income) + '</div>';
      if (!owned) h += SG.UI.btn('开店（' + SG.u.money(s.cost) + '）', 'UI.buyShop', [s.id], 'sm primary');
      h += '</div>';
    });
    h += '</div>';
  }
  h += '</div>';

  body.innerHTML = h;
};

/* ---------- 行动 ---------- */
SG.A.unlockRestaurant = function () { var s = SG.State.getState(); return SG.Dlc.unlockRestaurant(s); };
SG.A.upgradeRestaurant = function () { var s = SG.State.getState(); return SG.Dlc.upgradeRestaurant(s); };
SG.A.saveMenu = function () {
  var s = SG.State.getState();
  var ids = [];
  document.querySelectorAll('.menu-item input:checked').forEach(function (cb) { ids.push(cb.value); });
  SG.Dlc.setMenu(s, ids);
  SG.Player.log(s, '更新了餐馆菜单（' + ids.length + ' 道菜）。');
  SG.State.save();
  return { ok: true, msg: '餐馆菜单已更新：' + ids.length + ' 道菜。' };
};
SG.A.unlockHotel = function () { var s = SG.State.getState(); return SG.Dlc.unlockHotel(s); };
SG.A.upgradeHotel = function () { var s = SG.State.getState(); return SG.Dlc.upgradeHotel(s); };
SG.A.buyShop = function (id) { var s = SG.State.getState(); return SG.Dlc.buyShop(id, s); };

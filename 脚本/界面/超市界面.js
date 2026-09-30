/* ============================================================
   脚本 / 界面 / 超市界面 —— 等级、升级条件、区域、保护罩、搬迁、布局
   ============================================================ */
window.SG = window.SG || {};
SG.Screens.store = function (body, state) {
  var cfg = DATA.config;
  var def = SG.Store.levelDef(state);
  var nxt = SG.Store.nextDef(state);
  var h = '';

  /* 等级卡 + 升级 */
  h += '<div class="panel"><div class="cols">';
  h += '<div style="flex:1.2"><h3>' + def.lv + ' 级 · ' + def.name + ' <span class="chip">' + def.area + '</span></h3>' +
    '<p class="muted">' + SG.Decor.scene(state) + '</p>' +
    '<div class="small muted">阶段：' + cfg.STAGES[SG.Store.stage(state)].name + '（当前阶段最高 ' + SG.Store.maxLevel(state) + ' 级）</div></div>';
  h += '<div class="store-stat"><div class="big">' + SG.u.money(state.cumPoints) + '</div><div class="small">累计赚取积分</div></div>';
  h += '</div>';
  if (nxt) {
    var chk = SG.Store.checkConditions(state);
    h += '<div class="mt"><h4>升级到 ' + nxt.lv + ' 级 · ' + nxt.name + '（' + nxt.area + '）</h4>';
    h += '<div class="cond-list">';
    var conds = [
      ['累计赚取积分', state.cumPoints, nxt.cond.cum, '积分'],
      ['商品种类', SG.Inv.typesStocked(state), nxt.cond.types, '种'],
      ['新顾客', state.store.newCustomers, nxt.cond.newCust, '人'],
      ['员工', state.employees.length, nxt.cond.emp, '人'],
      ['收取晶核', SG.Econ.crystalTotal(state), nxt.cond.crys, '个']
    ];
    conds.forEach(function (c) {
      if (c[3] === '个' && c[2] <= 0) return;
      var ok = c[1] >= c[2];
      h += '<div class="cond-row ' + (ok ? 'ok' : '') + '"><span class="mark">' + (ok ? '✓' : '·') + '</span>' +
        c[0] + ' <b>' + SG.u.money(c[1]) + ' / ' + SG.u.money(c[2]) + '</b> ' + c[3] + '</div>';
    });
    h += '<div class="cond-row ' + (state.points >= SG.Store.upgradeCost(state) ? 'ok' : '') + '"><span class="mark">' + (state.points >= SG.Store.upgradeCost(state) ? '✓' : '·') + '</span>积分 ' +
      SG.u.money(state.points) + ' / ' + SG.u.money(SG.Store.upgradeCost(state)) + '</div>';
    h += '</div>';
    h += '<div class="mt">' + SG.UI.btn('花费 ' + SG.u.money(SG.Store.upgradeCost(state)) + ' 积分升级', 'UI.upgradeStore', [], 'primary') + '</div>';
  } else {
    h += '<div class="mt small muted">已达到满级。超市的样子，就是庇护所的样子。</div>';
  }
  h += '</div>';

  /* 区域解锁 */
  h += '<div class="panel"><h3>区域解锁</h3><div class="area-grid">';
  var areaSum = SG.Store.areaSummary(state);
  cfg.AREAS_ORDER.forEach(function (id) {
    var a = cfg.AREAS[id];
    var owned = !!state.store.areas[id];
    var can = state.store.level >= a.lv;
    h += '<div class="area-card' + (owned ? ' owned' : '') + '">';
    h += '<div class="area-name">' + a.name + (owned ? ' <span class="chip ok">已解锁</span>' : '') + '</div>';
    h += '<div class="small muted">' + a.desc + '</div>';
    h += '<div class="small">等级要求 ' + a.lv + ' · ' + a.fx + '</div>';
    if (!owned) {
      h += '<div class="small">' + SG.u.money(a.cost) + ' 积分</div>' +
        (can ? SG.UI.btn('解锁', 'UI.unlockArea', [id], 'sm primary') : '<div class="small muted">超市 ' + a.lv + ' 级解锁</div>');
    }
    h += '</div>';
  });
  h += '</div></div>';

  /* 保护罩 */
  var sh = SG.Store.shieldDef(state);
  var shN = SG.Store.shieldNext(state);
  h += '<div class="panel"><h3>保护罩</h3><div class="cols">';
  h += '<div style="flex:1"><div class="big">' + sh.r + '</div><div class="small muted">当前保护范围。罩内禁止暴力、抢劫、偷窃，情节严重者将被系统电击警告、驱逐、拉黑，甚至抹杀。</div></div>';
  if (shN) {
    h += '<div style="text-align:right">' + SG.UI.btn('扩大至 ' + shN.r + '（' + SG.u.money(shN.cost) + '）', 'UI.upgradeShield', [], 'sm') + '</div>';
  } else {
    h += '<div class="small muted">保护罩已到最大范围，方圆 50 公里再无黑暗。</div>';
  }
  h += '</div></div>';

  /* 搬迁 */
  var curBase = SG.Map.base(state);
  h += '<div class="panel"><h3>超市选址</h3>';
  if (curBase) {
    h += '<div class="cond-row"><span class="mark">✓</span>现址：「' + curBase.name + '」附近（' + SG.Map.desc(curBase) + '）</div>';
    h += '<div class="small muted mt">搬去别的基地附近经营，客流与风险都会随之改变。可在「地图」页查看基地情报并搬迁。</div>';
  } else if (!SG.Store.canRelocate(state)) {
    h += '<div class="muted small">超市 5 级后可搬迁超市位置，搬到基地附近能获得更多客流。</div>';
  } else {
    h += '<div class="muted small">你还在荒野落脚。去「地图」页向顾客打听基地情报，然后挑选一处安家。</div>';
  }
  h += '</div>';

  /* 布局示意（分区与设施，按当前等级实景生成） */
  h += '<div class="panel"><h3>超市布局</h3><div class="shopmap">';
  var zoneArr = SG.Fac.zoneList(state);
  if (state.store.level < 3) {
    zoneArr[0].facs.forEach(function (f) {
      h += '<div class="map-cell"><span class="map-icon">▦</span><span>' + DATA.facility.TYPES[f.type].name + '</span></div>';
    });
    h += '<div class="map-cell"><span class="map-icon">◇</span><span>收银台</span></div>';
    h += '<div class="map-cell"><span class="map-icon">♨</span><span>店主住处</span></div>';
  } else {
    zoneArr.forEach(function (z) {
      var zn = (DATA.facility.ZONES[z.id] || {}).name || z.id;
      h += '<div class="map-cell zone"><span class="map-icon">▣</span><span>' + zn + '</span><div class="small muted">' + z.facs.length + ' 组设施</div></div>';
    });
  }
  h += '</div><div class="small muted mt">' + SG.Decor.brief(state) + ' · 具体上货请到「库存」页操作。外部是荒芜的末日旷野，保护罩内是暖黄的灯光。</div></div>';

  body.innerHTML = h;
};

/* ---------- 行动 ---------- */
SG.A.upgradeStore = function () {
  var state = SG.State.getState();
  return SG.Store.upgrade(state);
};
SG.A.unlockArea = function (areaId) {
  var state = SG.State.getState();
  return SG.Store.unlockArea(areaId, state);
};
SG.A.upgradeShield = function () {
  var state = SG.State.getState();
  return SG.Store.upgradeShield(state);
};
SG.A.relocate = function (id) {
  var state = SG.State.getState();
  return SG.Store.relocate(id, state);
};

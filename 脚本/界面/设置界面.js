/* ============================================================
   脚本 / 界面 / 设置界面 —— 档案、主题、自动补货、快进、存档
   ============================================================ */
window.SG = window.SG || {};
SG.Screens.settings = function (body, state) {
  var cfg = DATA.config;
  var id = SG.Player.identityOf(state);
  var col = cfg.COLORS.filter(function (c) { return c.id === state.created.colorId; })[0];
  var sty = cfg.STYLES.filter(function (s) { return s.id === state.created.styleId; })[0];
  var h = '';

  /* 档案 */
  h += '<div class="panel"><h3>店主档案</h3><div class="profile-card">';
  h += '<div class="avatar lg">' + SG.u.esc(state.created.name.charAt(0)) + '</div>';
  h += '<div style="flex:1"><b>' + SG.u.esc(state.created.name) + '</b> <span class="chip">' + (state.created.gender === 'male' ? '男' : '女') + ' ' + state.created.age + ' 岁</span>' +
    '<div class="small muted">末日前身份：' + id.name + '（' + id.perk + '）</div>' +
    '<div class="small muted">金手指：' + (state.created.goldenFinger === 'pdd' ? '拼夕夕系统（0.01 积分/件）' : '变废为宝系统（探索捡垃圾）') + ' · ' +
    (state.created.cook ? '会做饭（小厨房已解锁）' : '不会做饭') + '</div>' +
    '<div class="small muted">主题：' + (col ? col.name : '') + ' · ' + (sty ? sty.name : '') + '</div></div>';
  h += '</div></div>';

  /* 主题调整 */
  h += '<div class="panel"><h3>主题</h3><div class="small muted">喜欢的颜色（店铺、住处与网页配色）</div><div class="opt-grid">';
  cfg.COLORS.forEach(function (c) {
    h += '<button class="opt-card' + (state.created.colorId === c.id ? ' sel' : '') + '" data-act="UI.setThemeColor" data-args=' + SG.UI.attJson([c.id]) + '>' +
      '<span class="swatch" style="background:' + c.c + '"></span>' + c.name + '</button>';
  });
  h += '</div><div class="small muted mt">风格（整体 UI 与店主专属区域）</div><div class="opt-grid">';
  cfg.STYLES.forEach(function (s) {
    h += '<button class="opt-card' + (state.created.styleId === s.id ? ' sel' : '') + '" data-act="UI.setThemeStyle" data-args=' + SG.UI.attJson([s.id]) + '>' +
      '<b>' + s.name + '</b><div class="muted small">' + s.desc + '</div></button>';
  });
  h += '</div></div>';

  /* 自动补货 */
  h += '<div class="panel"><h3>经营偏好</h3><div class="cols">';
  h += '<div style="flex:1"><b>自动补货</b><div class="small muted">每天早晨，拼夕夕自动把今日品类补到安全库存（需积分≥0.01/件）。</div></div>';
  h += state.store.autoRestock ?
    SG.UI.btn('关闭自动补货', 'UI.toggleAutoRestock', [], 'sm') :
    SG.UI.btn('开启自动补货', 'UI.toggleAutoRestock', [], 'sm primary');
  h += '</div><div class="mt"><h4>快进时间</h4><div class="action-grid">';
  h += SG.UI.btn('快进 1 天', 'UI.fastForwardDays', [1], '');
  h += SG.UI.btn('快进 3 天', 'UI.fastForwardDays', [3], '');
  h += SG.UI.btn('快进 7 天', 'UI.fastForwardDays', [7], '');
  h += '</div><div class="small muted">建议开启自动补货后再快进。每日结算会检查店主与店员生存。</div></div></div>';

  /* 存档与重开 */
  h += '<div class="panel"><h3>存档与重开</h3>' +
    '<div class="small muted">游戏自动存档于浏览器本地（每次重要操作后保存）。清除浏览器数据或更换设备会丢失存档。</div>' +
    '<div class="mt">' + SG.UI.btn('重新开始（清空存档）', 'UI.newGameConfirm', [], 'warn') + '</div></div>';

  /* 玩法速览 */
  h += '<div class="panel"><h3>玩法速览</h3><div class="small muted" style="line-height:1.9">' +
    '· 每天营业 08:00~22:00，所有行为花费时间与体力。<br>' +
    '· 每日结算：店主与所有店员五项数值（饱食/口渴/生命/娱乐/卫生）须全部 > 60。<br>' +
    '· 营养 4 日一结算（碳水60/蛋白30/脂肪25/维15 克/日），缺一类即营养不良（每日 -5 生命）。<br>' +
    '· 卫生：男性下降加倍；女性月经期需卫生巾；衣物按季节更换（夏1/春秋2/冬3 天），超期每日 -10 卫生。<br>' +
    '· 收入：售价固定。进货靠拼夕夕（0.01/件）或探索捡垃圾。<br>' +
    '· 升级：超市 1~10 级（前期上限 3 / 中期 6 / 后期 10），条件含累计积分、商品种类、新顾客、员工、晶核。<br>' +
    '· 顾客用现金/物品/硬通货/晶核兑换积分购物；保护罩内禁止暴力偷窃，违者被系统惩戒。</div></div>';

  body.innerHTML = h;
};

/* ---------- 行动 ---------- */
SG.UI.setThemeColor = function (id) {
  var s = SG.State.getState();
  s.created.colorId = id;
  SG.Data.applyTheme(id, s.created.styleId);
  SG.State.save();
  SG.UI.toast('主题颜色已切换');
  SG.UI.refresh();
};
SG.UI.setThemeStyle = function (id) {
  var s = SG.State.getState();
  s.created.styleId = id;
  SG.Data.applyTheme(s.created.colorId, id);
  SG.State.save();
  SG.UI.toast('风格已切换');
  SG.UI.refresh();
};
SG.A.toggleAutoRestock = function () {
  var s = SG.State.getState();
  s.store.autoRestock = !s.store.autoRestock;
  SG.State.save();
  return { ok: true, msg: '自动补货已' + (s.store.autoRestock ? '开启' : '关闭') };
};
SG.A.fastForwardDays = function (n) {
  var s = SG.State.getState();
  if (s.ending) return { ok: false, msg: '旅程已结束' };
  var done = SG.Time.fastForward(n, s);
  return { ok: true, msg: '时间快进 ' + done + ' 天' };
};
SG.A.newGameConfirm = function () {
  SG.UI.confirm('重新开始？', '将清空当前存档与所有进度，末日从头来过。', '清空并重开', function () {
    SG.UI.newGame();
    return { ok: true };
  });
};

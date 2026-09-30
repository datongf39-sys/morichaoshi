/* ============================================================
   脚本 / 界面 / 探索界面 —— 变废为宝：外出捡垃圾、晶核、遇险
   ============================================================ */
window.SG = window.SG || {};
SG.Screens.explore = function (body, state) {
  var cfg = DATA.config;
  var gfId = state.created.goldenFinger;

  if (gfId !== 'waste') {
    body.innerHTML = '<div class="panel"><h3>探索</h3>' +
      '<p class="muted">你选择的是「拼夕夕系统」，没有变废为宝的捡垃圾加成。荒原凶险，还是守店比较稳妥。</p></div>';
    return;
  }

  var hours = SG.UI._exploreHours || 1;
  var h = '';
  h += '<div class="panel hero" style="background:linear-gradient(var(--panel), var(--panel2))"><div><h3>变废为宝 · 外出探索</h3>' +
    '<p class="muted">走进保护罩外的苍凉荒野，把废墟里别人不要的东西，变成货架上的希望。<br>今日随机品类：' + SG.Gf.wasteItems(state).length + ' 个（可重复）。</p>' +
    '<div class="small">遇险概率 <b>' + Math.round(SG.Gf.dangerRate(state) * 100) + '%</b>/小时 · 收益倍率 <b>×' + SG.Gf.gainMult(state) + '</b> · 体力消耗 12/小时（快递员 -25%）</div></div></div>';

  /* 时长选择 */
  h += '<div class="panel"><h3>探索时长</h3><div class="chip-row">';
  [1, 2, 3, 4].forEach(function (x) {
    h += '<button class="chip-btn' + (hours === x ? ' on' : '') + '" data-act="UI.setExploreHours" data-args=' + SG.UI.attJson([x]) + '>' + x + ' 小时</button>';
  });
  h += '</div><div class="mt">' + SG.UI.btn('出发探索（约 ' + (hours * 60 + 30) + ' 分钟）', 'UI.exploreAct', [hours], 'primary lg') + '</div></div>';

  /* 今日品类 */
  var waste = SG.Gf.wasteItems(state);
  h += '<div class="panel"><h3>今日可捡品类（' + waste.length + ' 种）</h3><div class="pdd-grid">';
  var shown = waste.slice(0, 24);
  shown.forEach(function (w) {
    var p = SG.Data.product(w.pid);
    h += '<div class="pdd-chip"><div><b>' + w.name + '</b></div><div class="small muted">奖励 ×' + w.mult + (p ? ' · ' + p.brand : '') + '</div></div>';
  });
  if (waste.length > shown.length) h += '<div class="muted">……还有 ' + (waste.length - shown.length) + ' 种，等你亲自去翻。</div>';
  h += '</div></div>';

  /* 上次探索结果 */
  var last = SG.UI._exploreResult;
  if (last) {
    h += '<div class="panel"><h3>上次探索</h3><div class="log-list">';
    last.finds.forEach(function (f) {
      h += '<div class="log-item"><span class="log-day">捡到</span><span>' + f.name + ' ×' + f.qty + '</span></div>';
    });
    last.crystals.forEach(function (c) {
      h += '<div class="log-item"><span class="log-day">晶核</span><span>' + cfg.CRYSTAL_LABEL[c.tier] + ' ×' + c.qty + '</span></div>';
    });
    last.events.forEach(function (e) {
      h += '<div class="log-item"><span class="log-day">事件</span><span class="' + e.cls + '">' + e.text + '</span></div>';
    });
    if (!last.finds.length && !last.crystals.length) h += '<div class="log-item"><span class="log-day">结果</span><span>风很大，收获寥寥。</span></div>';
    h += '</div></div>';
  }

  body.innerHTML = h;
};

SG.UI.setExploreHours = function (x) { SG.UI._exploreHours = x; SG.UI.refresh(); };
SG.A.exploreAct = function (hours) {
  var state = SG.State.getState();
  var r = SG.Gf.explore(hours || 1, state);
  if (!r.ok) return r;
  SG.UI._exploreResult = r;
  var msg = '探索归来：捡到 ' + r.finds.length + ' 件物资' +
    (r.crystals.length ? '，收获晶核 ' + r.crystals.map(function (c) { return DATA.config.CRYSTAL_LABEL[c.tier] + '×' + c.qty; }).join('、') : '') +
    (r.events.length ? '，途中遭遇 ' + r.events.length + ' 起事件' : '');
  return { ok: true, msg: msg, minutes: r.minutes };
};

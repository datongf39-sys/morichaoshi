/* ============================================================
   脚本 / 界面 / 记录界面 —— 阶段时间轴、收入趋势、日志
   ============================================================ */
window.SG = window.SG || {};
SG.Screens.record = function (body, state) {
  var cfg = DATA.config;
  var h = '';

  /* 三阶段时间轴 */
  h += '<div class="panel"><h3>末日进程</h3><div class="tl3">';
  var keys = ['early', 'mid', 'late'];
  keys.forEach(function (k, i) {
    var st = cfg.STAGES[k];
    var cur = SG.u.dayInfo(state.day).stage === k;
    h += '<div class="tl3-col">' +
      '<div class="tl3-dot' + (cur ? ' cur' : '') + '">' + (cur ? '●' : '○') + '</div>' +
      '<div class="tl3-name">' + st.name + '</div>' +
      '<div class="small muted">' + st.years + '</div>' +
      '<div class="small muted">' + st.desc + '</div></div>';
    if (i < keys.length - 1) h += '<div class="tl3-line"></div>';
  });
  h += '</div><div class="small muted mt">末日前期：现金（首月 1:1，逐月贬值，3 个月后仅 1%~5%，6 个月后归零）、物品（按月损耗）、硬通货（恒定）、6 个月后晶核（≤30% 顾客）。<br>' +
    '末日中期：仅晶核，低阶为主、少量中阶；末日后期：中阶为主、高阶现身。</div></div>';

  /* 收入趋势 */
  var hist = state.incomeHistory || [];
  h += '<div class="panel"><h3>收入趋势（每日）</h3>';
  if (hist.length < 2) {
    h += '<div class="muted">数据积累中……睡一觉再来看看。</div>';
  } else {
    var max = Math.max.apply(null, hist.map(function (x) { return x.income; }));
    max = Math.max(max, 50);
    var w = 600, hh = 200, pad = 10;
    var n = hist.length;
    var bw = Math.max(3, (w - pad * 2) / n - 4);
    var bars = hist.map(function (x, i) {
      var bh = Math.max(4, x.income / max * (hh - 40));
      var x0 = pad + i * ((w - pad * 2) / n) + 2;
      var y0 = hh - 30 - bh;
      return '<rect x="' + x0 + '" y="' + y0 + '" width="' + bw + '" height="' + bh + '" rx="2" fill="var(--accent)"/>' +
        (n <= 30 && i % Math.ceil(n / 12) === 0 ? '<text x="' + (x0 + bw / 2) + '" y="' + (hh - 8) + '" font-size="9" fill="var(--muted)" text-anchor="middle">第' + x.day + '天</text>' : '');
    }).join('');
    h += '<svg viewBox="0 0 ' + w + ' ' + hh + '" style="width:100%;height:auto">' + bars + '</svg>';
  }
  h += '</div>';

  /* 关键统计 */
  var totalVisits = 0;
  SG.Cust.list(state).forEach(function (c) { totalVisits += c.visits; });
  h += '<div class="panel"><h3>经营统计</h3><div class="stat-cards">';
  h += '<div class="stat-card"><div class="big">' + SG.u.money(state.cumPoints) + '</div><div>累计赚取积分</div></div>';
  h += '<div class="stat-card"><div class="big">' + SG.Inv.typesStocked(state) + '</div><div>货架商品种类</div></div>';
  h += '<div class="stat-card"><div class="big">' + Object.keys(state.customers).length + '</div><div>录入顾客数</div></div>';
  h += '<div class="stat-card"><div class="big">' + totalVisits + '</div><div>累计到店购物次数</div></div>';
  h += '<div class="stat-card"><div class="big">' + state.employees.length + '</div><div>店员</div></div>';
  h += '<div class="stat-card"><div class="big">' + SG.u.fmtCrystal(SG.Econ.crystalTotal(state)) + '</div><div>晶核</div></div>';
  h += '</div></div>';

  /* 日志 */
  h += '<div class="panel"><h3>经营日志</h3><div class="log-list">';
  var logs = state.logs.slice(-80).reverse();
  if (!logs.length) h += '<div class="muted">还没有记录。</div>';
  logs.forEach(function (l) {
    h += '<div class="log-item"><span class="log-day">第' + l.day + '天 ' + SG.u.fmtClock(l.minute) + '</span><span class="' + l.cls + '">' + SG.u.esc(l.text) + '</span></div>';
  });
  h += '</div></div>';

  body.innerHTML = h;
};

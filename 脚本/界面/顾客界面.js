/* ============================================================
   脚本 / 界面 / 顾客界面 —— 顾客名录、排序、履历
   ============================================================ */
window.SG = window.SG || {};
SG.Screens.cust = function (body, state) {
  var sortKey = SG.UI._custSort || 'visits';
  var kw = (SG.UI._custKw || '').toLowerCase();
  var h = '';

  h += '<div class="panel"><h3>顾客系统</h3>' +
    '<div class="cols" style="align-items:end">' +
    '<div class="field" style="flex:1"><label>排序方式</label><select id="cust-sort">' +
    '<option value="visits"' + (sortKey === 'visits' ? ' selected' : '') + '>访问次数（多→少）</option>' +
    '<option value="points"' + (sortKey === 'points' ? ' selected' : '') + '>积分数（多→少）</option>' +
    '<option value="name"' + (sortKey === 'name' ? ' selected' : '') + '>姓名（首字母）</option>' +
    '<option value="random"' + (sortKey === 'random' ? ' selected' : '') + '>随机</option>' +
    '<option value="reverse"' + (sortKey === 'reverse' ? ' selected' : '') + '>逆序（访问少→多）</option>' +
    '</select></div>' +
    '<div class="field" style="flex:1"><label>按姓名搜索</label><input id="cust-kw" type="text" value="' + SG.u.esc(kw) + '" placeholder="输入姓名…"></div>' +
    '</div></div>';

  var list = SG.Cust.sorted(state, sortKey);
  if (kw) list = list.filter(function (c) { return c.name.toLowerCase().indexOf(kw) >= 0; });
  var today = Object.keys(state.customers).filter(function (k) { return state.customers[k].lastVisitDay === state.day; }).length;
  var banned = SG.Cust.list(state).filter(function (c) { return c.blacklist || c.bannedUntil >= state.day; }).length;

  h += '<div class="panel"><h3>顾客名录 <span class="chip">共 ' + Object.keys(state.customers).length + ' 人</span>' +
    '<span class="chip">今日到店 ' + today + ' 人</span><span class="chip">黑名单/禁入 ' + banned + ' 人</span></h3>';
  h += '<div class="cust-table">';
  if (!list.length) {
    h += '<div class="muted">还没有顾客。开门营业，就会有人来。</div>';
  }
  list.forEach(function (c) {
    var ptag = c.persona === 'bad' ? '<span class="chip bad">品行不端</span>' :
      (c.persona === 'sick' ? '<span class="chip">病患</span>' :
        (c.persona === 'rich' ? '<span class="chip">囤货商人</span>' :
          (c.persona === 'wander' ? '<span class="chip">拾荒者</span>' : '')));
    var status = c.blacklist ? '<span class="chip bad">黑名单</span>' :
      (c.bannedUntil >= state.day ? '<span class="chip bad">禁入至第' + c.bannedUntil + '天</span>' :
        (c.isEmployee ? '<span class="chip ok">店员</span>' : ''));
    h += '<div class="cust-row' + (c.blacklist ? ' black' : '') + '">';
    h += '<div class="avatar">' + SG.u.esc(c.name.charAt(0)) + '</div>';
    h += '<div style="flex:1"><b>' + SG.u.esc(c.name) + '</b> ' + ptag + status +
      '<div class="small muted">' + (c.gender === 'male' ? '男' : '女') + ' · ' + c.age + ' 岁 · 积分 ' + SG.u.money(c.points) + ' · 访问 ' + c.visits + ' 次</div></div>';
    h += SG.UI.btn('履历', 'UI.openCustDetail', [c.id], 'sm');
    h += '</div>';
  });
  h += '</div></div>';

  body.innerHTML = h;
  var sel = document.getElementById('cust-sort');
  if (sel) sel.addEventListener('change', function () { SG.UI._custSort = sel.value; SG.UI.refresh(); });
  var inp = document.getElementById('cust-kw');
  if (inp) inp.addEventListener('input', function () { SG.UI._custKw = inp.value; SG.UI.refresh(); });
};

/* 履历弹窗 */
SG.UI.openCustDetail = function (cid) {
  var state = SG.State.getState();
  var c = state.customers[cid];
  if (!c) { SG.UI.toast('找不到这位顾客'); return; }
  var h = '<div class="m-body">';
  h += '<div class="cols"><div class="avatar lg">' + SG.u.esc(c.name.charAt(0)) + '</div>' +
    '<div style="flex:1"><h3>' + SG.u.esc(c.name) + '</h3>' +
    '<div class="small muted">' + (c.gender === 'male' ? '男' : '女') + ' · ' + c.age + ' 岁 · 积分 ' + SG.u.money(c.points) + ' · 到店购物 ' + c.visits + ' 次</div></div></div>';
  h += '<div class="timeline mt">';
  var hist = c.history.slice(-20).reverse();
  if (!hist.length) h += '<div class="muted">还没有履历。</div>';
  hist.forEach(function (en) {
    h += '<div class="tl-item"><span class="tl-day">第' + en.day + '天</span><span>' + SG.u.esc(en.text) + '</span></div>';
  });
  h += '</div></div>';
  SG.UI.modal('<div class="m-head"><h3>顾客履历</h3><button class="btn sm ghost" data-act="UI.closeModal" data-args="[]">关闭</button></div>' + h, true);
};

/* ============================================================
   脚本 / 界面 / 员工界面 —— 招募、属性、照料
   ============================================================ */
window.SG = window.SG || {};
SG.Screens.emp = function (body, state) {
  var cfg = DATA.config;
  var h = '';
  var cap = SG.Emp.capOf(state);
  var slots = SG.Emp.slots(state);

  h += '<div class="panel"><h3>员工系统</h3>';
  h += '<div class="cols"><div style="flex:1">' +
    (cap > 0 ? '超市 ' + state.store.level + ' 级，可招募 ' + cap + ' 名员工，当前 ' + state.employees.length + ' 人。' :
      '超市 2 级解锁员工系统。') + '</div>' +
    (SG.Emp.dormOk(state) ? '<span class="chip ok">员工宿舍已解锁</span>' : '<span class="chip">需要先解锁员工宿舍（超市 2 级）</span>') + '</div>';
  h += '<div class="small muted mt">员工无需工资，但要保障他们的基础生存（五项数值每日结算需 > 60）。招募需从老客（到店购物 5 次以上）中选。<br>' +
    '班次：早班 08~16 点 / 晚班 14~22 点（8 小时制）。安排员工站收银台，当班时会自动接待顾客。</div></div>';

  /* 招募候选 */
  var cands = SG.Emp.candidates(state);
  h += '<div class="panel"><h3>可招募的老客 <span class="chip">' + cands.length + ' 人</span></h3><div class="cust-table">';
  if (slots <= 0) h += '<div class="muted">员工名额已满。升级超市可解锁更多名额。</div>';
  if (!cands.length) h += '<div class="muted">还没有足够的老客。让更多顾客多来几次吧。</div>';
  cands.forEach(function (c) {
    h += '<div class="cust-row"><div class="avatar">' + SG.u.esc(c.name.charAt(0)) + '</div>' +
      '<div style="flex:1"><b>' + SG.u.esc(c.name) + '</b><div class="small muted">' +
      (c.gender === 'male' ? '男' : '女') + ' · ' + c.age + ' 岁 · 到店 ' + c.visits + ' 次 · 积分 ' + SG.u.money(c.points) + '</div></div>' +
      (slots > 0 && SG.Emp.dormOk(state) ? SG.UI.btn('招募', 'UI.recruitEmp', [c.id], 'sm primary') :
        SG.UI.btn('招募', 'UI.recruitEmp', [c.id], 'sm')) + '</div>';
  });
  h += '</div></div>';

  /* 员工列表 */
  h += '<div class="panel"><h3>店员</h3>';
  if (!state.employees.length) {
    h += '<div class="muted">还没有店员。一个人守店的日子，也还行。</div>';
  }
  state.employees.forEach(function (e) {
    var s = e.stats;
    var onCashier = (state.store.cashiers || []).indexOf(e.id) >= 0;
    var onDutyNow = SG.Emp.onDuty(e, state);
    h += '<div class="emp-card"><div class="cols">';
    h += '<div style="flex:1"><b>' + SG.u.esc(e.name) + '</b> <span class="chip">入职第 ' + (state.day - e.hiredDay) + ' 天</span>' +
      '<span class="chip">' + SG.Emp.shiftLabel(e.shift) + (onDutyNow ? ' · 当班中' : ' · 休息中') + '</span>' +
      (onCashier ? ' <span class="chip ok">收银台</span>' : '') +
      '<div class="small muted">' + (e.gender === 'male' ? '男' : '女') + ' · ' + e.age + ' 岁</div></div>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap">' +
      SG.UI.btn(e.shift === 'morning' ? '换晚班' : '换早班', 'UI.empShift', [e.id], 'sm') +
      SG.UI.btn(onCashier ? '撤下收银台' : '派往收银台', 'UI.empCashier', [e.id], 'sm' + (onCashier ? '' : ' primary')) +
      SG.UI.btn('辞退', 'UI.fireEmp', [e.id], 'sm ghost') + '</div></div>';
    h += '<div class="stat-list">';
    h += SG.UI.statBar('饱食度', s.sat, 'c1');
    h += SG.UI.statBar('口渴度', s.thirst, 'c2');
    h += SG.UI.statBar('生命值', s.hp, 'c3');
    h += SG.UI.statBar('娱乐值', s.ent, 'c4');
    h += SG.UI.statBar('卫生值', s.hyg, 'c5');
    h += '</div></div>';
  });
  h += '</div>';

  body.innerHTML = h;
};

/* ---------- 行动 ---------- */
SG.A.recruitEmp = function (cid) {
  var state = SG.State.getState();
  return SG.Emp.recruit(cid, state);
};
SG.A.fireEmp = function (cid) {
  var state = SG.State.getState();
  return SG.Emp.fire(cid, state);
};
SG.A.empShift = function (cid) {
  var state = SG.State.getState();
  var e = null;
  state.employees.forEach(function (x) { if (x.id === cid) e = x; });
  if (!e) return { ok: false, msg: '找不到该员工' };
  var to = e.shift === 'morning' ? 'evening' : 'morning';
  return SG.Emp.setShift(cid, to, state);
};
SG.A.empCashier = function (cid) {
  var state = SG.State.getState();
  return SG.Emp.toggleCashier(cid, state);
};

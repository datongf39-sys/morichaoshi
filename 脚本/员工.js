/* ============================================================
   脚本 / 员工 —— 招募、属性、每日照料（无需工资，保障基础生存）
   ============================================================ */
window.SG = window.SG || {};
SG.Emp = (function () {
  var cfg = function () { return DATA.config; };

  function capOf(state) {
    return cfg().EMP_CAP[state.store.level] || 0;
  }
  function dormOk(state) { return !!state.store.areas.dorm; }
  function slots(state) { return capOf(state) - state.employees.length; }

  /* 班次：早班 08:00~16:00，晚班 14:00~22:00（8 小时制，14~16 点交接重叠） */
  function shiftLabel(shift) { return shift === 'evening' ? '晚班 14~22 点' : '早班 08~16 点'; }
  function onDuty(e, state) {
    var m = state.minute;
    if (e.shift === 'evening') return m >= 14 * 60 && m < 22 * 60;
    return m >= 8 * 60 && m < 16 * 60;
  }

  /* 可招募对象：到店购买过 5 次以上的老客 */
  function candidates(state) {
    var teacher = SG.Player.identityOf(state).id === 'teacher';
    var arr = [];
    var custs = SG.Cust.list(state);
    for (var i = 0; i < custs.length; i++) {
      var c = custs[i];
      if (c.isEmployee || c.blacklist || c.bannedUntil >= state.day) continue;
      var needVisits = teacher ? 3 : 5;
      if (c.visits >= needVisits) arr.push(c);
    }
    return arr;
  }
  function recruit(cid, state) {
    if (!dormOk(state)) return { ok: false, msg: '还没有员工宿舍，无法招募员工。请在超市页解锁员工宿舍。' };
    if (capOf(state) <= 0) return { ok: false, msg: '员工系统尚未解锁：超市 2 级后可招募员工。' };
    if (slots(state) <= 0) return { ok: false, msg: '员工名额已满（超市 ' + state.store.level + ' 级最多 ' + capOf(state) + ' 人）' };
    var c = state.customers[cid];
    if (!c) return { ok: false, msg: '找不到这位老客' };
    if (c.isEmployee) return { ok: false, msg: '已经是店员了' };
    var e = {
      id: c.id, name: c.name, gender: c.gender, age: c.age,
      hiredDay: state.day,
      shift: 'morning',       // 早班 08~16 / 晚班 14~22
      stats: {
        sat: SG.u.rint(62, 80), thirst: SG.u.rint(62, 80), hp: SG.u.rint(68, 88),
        ent: SG.u.rint(58, 72), hyg: SG.u.rint(60, 75)
      }
    };
    c.isEmployee = true;
    state.employees.push(e);
    SG.Player.log(state, '招募了老客「' + c.name + '」成为店员。', '');
    return { ok: true, msg: c.name + ' 加入了你的超市！', emp: e };
  }
  function fire(cid, state) {
    for (var i = 0; i < state.employees.length; i++) {
      if (state.employees[i].id === cid) {
        var e = state.employees[i];
        var c = state.customers[cid];
        if (c) c.isEmployee = false;
        state.employees.splice(i, 1);
        SG.Player.log(state, '店员' + e.name + '离开了超市。', '');
        return { ok: true, msg: e.name + ' 已离开。' };
      }
    }
    return { ok: false, msg: '找不到该员工' };
  }

  /* 每日照料：员工自动吃喝、洗漱、娱乐（消耗库存），保障基础生存 */
  function care(state) {
    if (!state.employees.length) return;
    var dec = cfg().DECAY;
    for (var i = 0; i < state.employees.length; i++) {
      var e = state.employees[i];
      var s = e.stats;
      s.sat = SG.u.clamp(s.sat - 20, 0, 100);
      s.thirst = SG.u.clamp(s.thirst - 26, 0, 100);
      s.ent = SG.u.clamp(s.ent - 16, 0, 100);
      s.hyg = SG.u.clamp(s.hyg - (e.gender === 'male' ? dec.hygMale * 16 : dec.hygFemale * 16), 0, 100);
      s.hp = SG.u.clamp(s.hp - 2, 0, 100);
      /* 进食 */
      feed(e, state);
      /* 饮水 */
      drink(e, state);
      /* 娱乐 */
      var entItem = null;
      for (var pid in state.inventory) {
        var p = SG.Data.product(pid);
        if (p && p.kind === 'ent' && SG.Inv.has(pid, 1, state)) { entItem = pid; break; }
      }
      if (entItem && s.ent < 62) s.ent = SG.u.clamp(s.ent + 20, 0, 100);
      /* 洗漱 */
      if (s.hyg < 62 && SG.Player.waterCount(state) >= 4) {
        SG.Player.takeWater(state, 4);
        s.hyg = SG.u.clamp(s.hyg + 45, 0, 100);
      }
    }
  }
  function feed(e, state) {
    var tries = 0;
    while (e.stats.sat < 62 && tries < 8) {
      tries++;
      var found = null;
      for (var pid in state.inventory) {
        var p = SG.Data.product(pid);
        if (!p || p.eff.sat < 8) continue;
        if (p.kind === 'veg' || p.kind === 'meat' || p.kind === 'aquatic' || p.kind === 'dairy') continue; // 生食风险
        if (SG.Inv.isExpired(pid, state)) continue;
        if (SG.Inv.has(pid, 1 / (p.sv || 1), state)) { found = { p: p, pid: pid }; break; }
      }
      if (!found) break;
      SG.Player.consumeServing(found.pid, state);
      e.stats.sat = SG.u.clamp(e.stats.sat + found.p.eff.sat, 0, 100);
    }
  }
  function drink(e, state) {
    var tries = 0;
    while (e.stats.thirst < 62 && tries < 6) {
      tries++;
      var found = null;
      for (var pid in state.inventory) {
        var p = SG.Data.product(pid);
        if (!p || (p.kind !== 'water' && p.kind !== 'drink')) continue;
        if (SG.Inv.has(pid, 1 / (p.sv || 1), state)) { found = { p: p, pid: pid }; break; }
      }
      if (!found) break;
      SG.Player.consumeServing(found.pid, state);
      e.stats.thirst = SG.u.clamp(e.stats.thirst + found.p.eff.thirst, 0, 100);
    }
  }

  function setShift(cid, shift, state) {
    for (var i = 0; i < state.employees.length; i++) {
      if (state.employees[i].id === cid) {
        state.employees[i].shift = shift;
        SG.State.save();
        return { ok: true, msg: state.employees[i].name + ' 已改为' + shiftLabel(shift) };
      }
    }
    return { ok: false, msg: '找不到该员工' };
  }
  function toggleCashier(cid, state) {
    var found = null;
    for (var i = 0; i < state.employees.length; i++) {
      if (state.employees[i].id === cid) { found = state.employees[i]; break; }
    }
    if (!found) return { ok: false, msg: '找不到该员工' };
    var arr = state.store.cashiers = state.store.cashiers || [];
    var idx = arr.indexOf(cid);
    if (idx >= 0) {
      arr.splice(idx, 1);
      SG.Player.log(state, found.name + ' 离开了收银台。');
      SG.State.save();
      return { ok: true, msg: found.name + ' 已离开收银台，顾客需店主亲自接待' };
    }
    arr.push(cid);
    SG.Player.log(state, found.name + ' 站到了收银台前，当班时自动接待顾客。');
    SG.State.save();
    return { ok: true, msg: found.name + ' 已安排到收银台（当班时自动接待顾客）' };
  }

  return { capOf: capOf, dormOk: dormOk, slots: slots, candidates: candidates, recruit: recruit, fire: fire, care: care,
    shiftLabel: shiftLabel, onDuty: onDuty, setShift: setShift, toggleCashier: toggleCashier };
})();

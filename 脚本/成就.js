/* ============================================================
   脚本 / 成就 —— 成就点累计（跨周目）、成就检查与发放、身份兑换校验
   成就点保存在 localStorage，不随存档清空；
   解锁身份需消耗成就点，兑换在创建界面进行。
   ============================================================ */
window.SG = window.SG || {};
SG.Ach = (function () {
  var KEY = 'doomsday_achievement_v1';
  var data = null;

  function load() {
    if (data) return data;
    try {
      var raw = localStorage.getItem(KEY);
      data = raw ? JSON.parse(raw) : { points: 0, done: {} };
    } catch (e) { data = { points: 0, done: {} }; }
    return data;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { }
  }
  function points() { return load().points; }
  function isDone(id) { return !!load().done[id]; }
  function doneList() { return Object.keys(load().done); }

  /* 身份兑换价格 */
  function identityCost(id) { return DATA.achievements.identityCost[id] || 0; }
  function identityUnlocked(id) { return identityCost(id) <= points(); }
  function identityLockedText(id) {
    var c = identityCost(id);
    return c > 0 ? ('需成就点 ' + c + '（当前 ' + points() + '）') : '免费';
  }

  /* 当前状态对应的各成就进度值 */
  function progressOf(state, type) {
    switch (type) {
      case 'cumPoints': return state.cumPoints || 0;
      case 'customers': return Object.keys(state.customers).length;
      case 'employees': return state.employees.length;
      case 'explore':   return (state.gf && state.gf.exploreCount) || 0;
      case 'cook':      return (state.gf && state.gf.cookCount) || 0;
      case 'storeLv':   return state.store.level;
      case 'days':      return state.day;
      case 'crystals':  return SG.Econ.crystalTotal(state);
      case 'dlc':       return (state.store.dlc.restaurant.lv ? 1 : 0) +
                             (state.store.dlc.hotel.lv ? 1 : 0) +
                             Object.keys(state.store.dlc.shops).length;
      case 'shieldLv':  return state.store.shieldLv;
      case 'hazard':    return (state.gf && state.gf.hazardCount) || 0;
      default: return 0;
    }
  }

  /* 检查并发放新达成成就；返回本次新达成列表 */
  function check(state) {
    var d = load();
    var earned = [];
    DATA.achievements.list.forEach(function (a) {
      if (d.done[a.id]) return;
      if (progressOf(state, a.type) >= a.target) {
        d.done[a.id] = true;
        d.points += a.points;
        earned.push(a);
      }
    });
    if (earned.length) save();
    return earned;
  }

  /* 创建界面校验：所选身份是否已解锁 */
  function canSelect(identityId) { return identityCost(identityId) <= points(); }

  return {
    load: load, save: save, points: points, isDone: isDone, doneList: doneList,
    identityCost: identityCost, identityUnlocked: identityUnlocked, identityLockedText: identityLockedText,
    progressOf: progressOf, check: check, canSelect: canSelect
  };
})();

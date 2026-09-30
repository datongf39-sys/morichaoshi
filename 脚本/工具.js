/* ============================================================
   脚本 / 工具 —— 随机、格式化、DOM 辅助
   ============================================================ */
window.SG = window.SG || {};
SG.u = (function () {
  function rand(a, b) { return a + Math.random() * (b - a); }
  function rint(a, b) { return Math.floor(rand(a, b + 1)); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function chance(p) { return Math.random() < p; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function shuffle(arr) { var a = arr.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function uniq(arr) { var s = {}; arr.forEach(function (x) { s[x] = 1; }); return Object.keys(s); }
  function seq(n) { var a = []; for (var i = 0; i < n; i++) a.push(i); return a; }
  function round1(n) { return Math.round(n * 10) / 10; }

  /* 分钟 → 时钟文本 */
  function fmtClock(min) {
    var m = Math.floor(min % 1440); if (m < 0) m += 1440;
    var h = Math.floor(m / 60), mm = m % 60;
    return (h < 10 ? '0' : '') + h + ':' + (mm < 10 ? '0' : '') + mm;
  }
  /* 天 → 末日纪年 */
  function dayInfo(day) {
    var cfg = DATA.config;
    var year = Math.floor((day - 1) / cfg.DAYS_PER_YEAR) + 1;
    var rem = (day - 1) % cfg.DAYS_PER_YEAR;
    var month = Math.floor(rem / cfg.DAYS_PER_MONTH) + 1;
    var dayOfMonth = rem % cfg.DAYS_PER_MONTH + 1;
    var stage = day >= cfg.STAGES.late.dayStart ? 'late' : (day >= cfg.STAGES.mid.dayStart ? 'mid' : 'early');
    var season = (month === 12 || month <= 2) ? 'winter' : (month <= 5 ? 'spring' : (month <= 8 ? 'summer' : 'autumn'));
    return { year: year, month: month, dayOfMonth: dayOfMonth, stage: stage, season: season };
  }
  function fmtDate(day) {
    var d = dayInfo(day);
    return '末日第' + d.year + '年 ' + d.month + '月' + d.dayOfMonth + '日';
  }
  function fmtMonth(day) {
    var d = dayInfo(day);
    return '第' + d.year + '年' + d.month + '月';
  }
  function money(n) {
    n = Math.round(n * 100) / 100;
    return String(n).replace(/(\.\d)$/, '$10').replace(/\.0$/, '');
  }

  /* DOM 辅助 */
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined && html !== null) e.innerHTML = html;
    return e;
  }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function clear(e) { while (e.firstChild) e.removeChild(e.firstChild); }
  function fmtCrystal(n) { return n >= 10000 ? (n / 10000).toFixed(1) + '万' : String(n); }

  return {
    rand: rand, rint: rint, pick: pick, chance: chance, clamp: clamp,
    shuffle: shuffle, uniq: uniq, seq: seq, round1: round1,
    fmtClock: fmtClock, dayInfo: dayInfo, fmtDate: fmtDate, fmtMonth: fmtMonth,
    money: money, el: el, esc: esc, clear: clear, fmtCrystal: fmtCrystal
  };
})();

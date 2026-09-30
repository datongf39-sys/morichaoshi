/* ============================================================
   脚本 / 地图 —— 基地生成、打听解锁、搬迁、每日骚扰/攻打事件
   末日前期（第 1~3 年）不开放；中期起可向顾客打听基地信息，
   超市 5 级后可在已发现的基地附近搬迁经营。
   基地属性影响客流（人数）、购买力（富裕）、偷抢骚扰概率（道德），
   低道德大型基地可能派出军械攻打超市，需升级保护罩防御。
   ============================================================ */
window.SG = window.SG || {};
SG.Map = (function () {
  var cfg = function () { return DATA.map; };

  function mapOpen(state) { return SG.Econ.stageOf(state.day) === 'mid' || SG.Econ.stageOf(state.day) === 'late'; }

  /* 每局随机生成基地（惰性：首次访问时生成并固化到存档） */
  function init(state) {
    if (state.bases && state.bases.length) return state.bases;
    var names = SG.u.shuffle(cfg().names);
    var n = SG.u.rint(6, 9);
    var bases = [];
    var sizes = Object.keys(cfg().sizes);
    for (var i = 0; i < n; i++) {
      var sizeKey = SG.u.pick(sizes);
      var size = cfg().sizes[sizeKey];
      bases.push({
        id: 'b' + (i + 1),
        name: names[i] || ('无名营地' + (i + 1)),
        size: sizeKey,
        sizeName: size.name,
        pop: SG.u.rint(size.pop[0], size.pop[1]),
        morality: SG.u.rint(15, 95),      // 道德 0~100：低 → 骚扰/偷抢概率高
        wealth: SG.u.rint(10, 95),        // 富裕 0~100：高 → 顾客买得多
        discovered: false
      });
    }
    state.bases = bases;
    SG.State.save();
    return bases;
  }
  function list(state) {
    init(state);
    return state.bases;
  }
  function base(state) {
    if (!state.bases || !state.store.location) return null;
    for (var i = 0; i < state.bases.length; i++) {
      if (state.bases[i].id === state.store.location) return state.bases[i];
    }
    return null;
  }
  function known(state) {
    return list(state).filter(function (b) { return b.discovered; });
  }

  /* 向顾客打听：花 30 分钟，随机解锁一个未发现的基地 */
  function ask(state) {
    if (!mapOpen(state)) return { ok: false, msg: '地图功能末日前期不开放，中期（第 4 年起）才能向顾客打听基地' };
    init(state);
    var unknown = state.bases.filter(function (b) { return !b.discovered; });
    if (!unknown.length) return { ok: false, msg: '所有基地都已打听到了' };
    var b = SG.u.pick(unknown);
    b.discovered = true;
    SG.Player.log(state, '向顾客打听，得知了「' + b.name + '」（' + b.sizeName + '）的情报。', '');
    SG.State.save();
    return { ok: true, msg: '打听到「' + b.name + '」：' + b.sizeName + '，约 ' + b.pop + ' 人。', minutes: 30, sta: -5, base: b };
  }

  /* 基地描述 */
  function desc(b) {
    if (!b) return '';
    var m = b.morality >= 70 ? '民风淳朴' : (b.morality >= 40 ? '人心尚可' : '鱼龙混杂');
    var w = b.wealth >= 70 ? '富得流油' : (b.wealth >= 40 ? '日子将就' : '一贫如洗');
    return m + ' · ' + w + (b.pop >= 800 ? ' · 人山人海' : (b.pop >= 250 ? ' · 人来人往' : ' · 人烟稀少'));
  }

  /* 道德带来的骚扰/偷抢修正（供顾客系统使用） */
  function moralityMod(state) {
    var b = base(state);
    if (!b) return 0;
    return (50 - b.morality) / 100 * 0.3;
  }

  /* 每日事件：骚扰与军械攻打（只发生在已搬迁到基地附近时） */
  function daily(state) {
    var b = base(state);
    if (!b) return;
    var evs = [];
    /* 骚扰：低道德基地骚扰店主（损失少量积分或商品） */
    var harassP = Math.max(0, (50 - b.morality) / 100 * cfg().harassmentBase);
    if (SG.u.chance(harassP)) {
      var lost = Math.max(5, Math.round(state.points * SG.u.rand(0.01, 0.04)));
      state.points = Math.max(0, state.points - lost);
      evs.push('「' + b.name + '」的混混上门骚扰，抢走了 ' + lost + ' 积分。');
    }
    /* 军械攻打：低道德 + 大基地概率更高；需保护罩等级防御 */
    var size = cfg().sizes[b.size];
    var attackP = size.attackBase * (1 + Math.max(0, (50 - b.morality) / 50));
    if (SG.u.chance(attackP)) {
      var need = size.attackShield;
      if (state.store.shieldLv >= need) {
        evs.push('「' + b.name + '」派出的武装分子进攻超市，被 ' + state.store.shieldLv + ' 级保护罩挡在门外。');
      } else {
        var lostP = Math.max(20, Math.round(state.points * SG.u.rand(0.03, 0.08)));
        state.points = Math.max(0, state.points - lostP);
        var shelfLoss = 0;
        for (var pid in state.shelf) {
          var q = Math.min(state.shelf[pid], SG.u.rint(1, 3));
          shelfLoss += SG.Inv.shelfTake(pid, q, state);
        }
        SG.Player.addStat(state, 'hp', -8);
        evs.push('「' + b.name + '」武装攻打！保护罩（' + state.store.shieldLv + ' 级）不足以防御，被抢走 ' + lostP + ' 积分、' + shelfLoss + ' 件商品，店主受伤。请升级保护罩！');
      }
    }
    if (evs.length) {
      evs.forEach(function (t) { SG.Player.log(state, t, 'warn'); });
      SG.State.save();
    }
  }

  return { mapOpen: mapOpen, init: init, list: list, base: base, known: known, ask: ask, desc: desc, moralityMod: moralityMod, daily: daily };
})();

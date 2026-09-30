/* ============================================================
   脚本 / 玩家 —— 属性、饮食、睡眠、卫生、衣物、月经、疾病、营养
   ============================================================ */
window.SG = window.SG || {};
SG.Player = (function () {
  var cfg = function () { return DATA.config; };

  function identityOf(state) {
    return cfg().IDENTITIES.filter(function (x) { return x.id === state.created.identityId; })[0] || cfg().IDENTITIES[0];
  }
  function log(state, text, cls) {
    state.logs.push({ day: state.day, minute: state.minute, text: text, cls: cls || '' });
    if (state.logs.length > 500) state.logs.shift();
  }
  function addStat(state, k, v) {
    var s = state.stats;
    if (k === 'sat') s.sat = SG.u.clamp(s.sat + v, 0, 100);
    if (k === 'thirst') s.thirst = SG.u.clamp(s.thirst + v, 0, 100);
    if (k === 'hp') s.hp = SG.u.clamp(s.hp + v, 0, 100);
    if (k === 'ent') s.ent = SG.u.clamp(s.ent + v, 0, 100);
    if (k === 'hyg') s.hyg = SG.u.clamp(s.hyg + v, 0, 100);
  }
  function getNutrEntry(state) {
    if (!state.nutrDays.length || state.nutrDays[state.nutrDays.length - 1].day !== state.day) {
      state.nutrDays.push({ day: state.day, carb: 0, prot: 0, fat: 0, vit: 0, water: 0 });
      if (state.nutrDays.length > 4) state.nutrDays.shift();
    }
    return state.nutrDays[state.nutrDays.length - 1];
  }
  function applyNutr(state, nut) {
    var e = getNutrEntry(state);
    e.carb += nut.carb; e.prot += nut.prot; e.fat += nut.fat; e.vit += nut.vit; e.water += nut.water;
  }
  function applyMeal(state, eff, nut) {
    addStat(state, 'sat', eff.sat);
    addStat(state, 'thirst', eff.thirst);
    addStat(state, 'hp', eff.hp);
    addStat(state, 'ent', eff.ent);
    addStat(state, 'hyg', eff.hyg);
    applyNutr(state, nut);
    state.stamina = SG.u.clamp(state.stamina + 5, 0, 140);
  }
  /* 消耗某商品 1 份（一份 = 1/sv 件） */
  function consumeServing(pid, state) {
    var p = SG.Data.product(pid);
    if (!p) return false;
    var qty = 1 / (p.sv || 1);
    return SG.Inv.take(pid, qty, state);
  }
  /* 取一瓶水（用于泡速食/洗澡等） */
  function takeWater(state, n) {
    var ids = ['wt01', 'wt02', 'wt03', 'wt04', 'wt05', 'wt07'];
    var got = 0;
    for (var i = 0; i < ids.length && got < n; i++) {
      var q = Math.min(n - got, state.inventory[ids[i]] || 0);
      if (q > 0) { SG.Inv.take(ids[i], q, state); got += q; }
    }
    return got;
  }
  function waterCount(state) {
    var ids = ['wt01', 'wt02', 'wt03', 'wt04', 'wt05', 'wt07'];
    var t = 0;
    ids.forEach(function (i) { t += state.inventory[i] || 0; });
    return t;
  }

  /* ---------- 进食 ---------- */
  function eatItem(pid, state) {
    var p = SG.Data.product(pid);
    if (!p) return { ok: false, msg: '没有该商品' };
    if (!SG.Inv.has(pid, 1 / (p.sv || 1), state)) return { ok: false, msg: '库存不足' };
    if (p.kind !== 'food' && !p.eff.sat && p.kind !== 'instant' && p.kind !== 'snack' && p.kind !== 'grain' && p.kind !== 'veg' && p.kind !== 'fruit' && p.kind !== 'aquatic' && p.kind !== 'meat' && p.kind !== 'dairy' && p.kind !== 'drink' && p.kind !== 'water')
      return { ok: false, msg: '这个不能直接吃' };
    if (p.waterNeed > 0 && waterCount(state) < 1) return { ok: false, msg: '需要水来泡/煮，库存里没有水了' };
    var minutes = 10, sta = -5;
    if (SG.Inv.isExpired(pid, state)) {
      consumeServing(pid, state);
      addStat(state, 'hp', -10);
      gainDisease(state, 'foodpoison', '吃了过期的东西');
      return { ok: true, msg: '吃下了过期的' + p.name + '……肚子开始翻江倒海。', minutes: minutes, sta: sta };
    }
    consumeServing(pid, state);
    if (p.waterNeed > 0) takeWater(state, 1);
    applyMeal(state, p.eff, p.nut);
    /* 生食生病（三文鱼等可生食的除外） */
    if (p.fx && p.fx.raw && !p.fx.rawSafe && SG.u.chance(0.35)) {
      gainDisease(state, 'foodpoison', '生吃了' + p.name);
      return { ok: true, msg: '吃下了' + p.name + '，但生食让肠胃罢工了。', minutes: minutes, sta: sta };
    }
    return { ok: true, msg: '吃下了' + SG.Data.label(p) + '。', minutes: minutes, sta: sta };
  }

  function drinkItem(pid, state) {
    var p = SG.Data.product(pid);
    if (!p) return { ok: false, msg: '没有该商品' };
    if (p.kind !== 'water' && p.kind !== 'drink') return { ok: false, msg: '这个不能喝' };
    if (!SG.Inv.has(pid, 1 / (p.sv || 1), state)) return { ok: false, msg: '库存不足' };
    consumeServing(pid, state);
    applyMeal(state, p.eff, p.nut);
    return { ok: true, msg: '喝下了' + SG.Data.label(p) + '。', minutes: 5, sta: -2 };
  }

  function eatCooked(dishId, state) {
    var d = SG.Data.dish(dishId);
    if (!d) return { ok: false, msg: '没有这道菜' };
    if ((state.cooked && state.cooked[dishId] > 0)) {
      state.cooked[dishId] -= 1;
      applyMeal(state, d.eff, d.nut);
      return { ok: true, msg: '吃了一份' + d.name + '，热乎的。', minutes: 15, sta: -5 };
    }
    return { ok: false, msg: '没有做好的' + d.name };
  }

  /* 点餐：花费积分兑换随机餐品，不消耗超市产品 */
  function orderAndEat(dishId, state) {
    var r = SG.Econ.orderMeal(dishId, state);
    if (!r.ok) return r;
    applyMeal(state, r.dish.eff, r.dish.nut);
    log(state, '点餐：兑换了「' + r.dish.name + '」（-' + r.dish.price + ' 积分）');
    return { ok: true, msg: '系统配送了一份' + r.dish.name + '。', minutes: 15, sta: -3 };
  }

  /* ---------- 睡眠 / 休息 ---------- */
  function sleep(state) {
    var start = state.minute;
    var duration;
    if (start <= 8 * 60) duration = 8 * 60 - start;
    else duration = 1440 - start + 8 * 60;
    var staGain = 100 - state.stamina;
    state.stamina = 100;
    addStat(state, 'hp', 6);
    addStat(state, 'ent', 5);
    addStat(state, 'sat', -8);
    addStat(state, 'thirst', -14);
    log(state, '睡了一觉，体力恢复。', '');
    return { ok: true, msg: '一夜无梦。', minutes: duration, sta: 0, staminaGain: staGain };
  }
  function rest(minutes, state) {
    var mult = identityOf(state).id === 'coach' ? 1.2 : 1;
    state.stamina = SG.u.clamp(state.stamina + 12 * mult * minutes / 60, 0, 140);
    addStat(state, 'ent', 2 * minutes / 60);
    return { ok: true, msg: '靠在躺椅上歇了一会儿。', minutes: minutes, sta: 0 };
  }

  /* ---------- 洗澡（卫生值） ---------- */
  function shower(state) {
    if (waterCount(state) < 4) return { ok: false, msg: '需要 4 瓶水才能洗澡，库存不足' };
    if (SG.Inv.has('dl04', 0.1, state)) SG.Inv.take('dl04', 0.1, state);
    takeWater(state, 4);
    addStat(state, 'hyg', 55);
    state.stamina = SG.u.clamp(state.stamina - 10, 0, 140);
    log(state, '洗了个热水澡，浑身清爽。');
    return { ok: true, msg: '洗了个热水澡，卫生值大涨。', minutes: 30, sta: -10 };
  }

  /* ---------- 衣物 ---------- */
  function changeClothes(pid, state) {
    var p = SG.Data.product(pid);
    if (!p || p.kind !== 'cloth') return { ok: false, msg: '这不是衣物' };
    var set = state.clothes.sets[pid];
    if (!set || set.clean < 1) return { ok: false, msg: '这件衣服没有干净的可以换' };
    if (state.clothes.current) {
      var old = state.clothes.sets[state.clothes.current];
      if (old) old.dirty += 1;
    }
    set.clean -= 1;
    state.clothes.current = pid;
    state.clothes.lastChangeDay = state.day;
    return { ok: true, msg: '换上了干净的' + p.name + '。', minutes: 10, sta: -3 };
  }
  function washClothes(pid, state) {
    var p = SG.Data.product(pid);
    var set = state.clothes.sets[pid];
    if (!set || set.dirty < 1) return { ok: false, msg: '没有需要洗的这件衣服' };
    if (waterCount(state) < 4) return { ok: false, msg: '洗衣需要 4 瓶水' };
    if (!SG.Inv.has('dl01', 0.02, state) && !SG.Inv.has('dl02', 0.02, state)) return { ok: false, msg: '没有洗衣液/洗衣粉' };
    takeWater(state, 4);
    if (SG.Inv.has('dl01', 0.02, state)) SG.Inv.take('dl01', 0.02, state); else SG.Inv.take('dl02', 0.02, state);
    set.dirty -= 1; set.clean += 1;
    return { ok: true, msg: '洗好了' + p.name + '，晾在阳光下。', minutes: 60, sta: -15 };
  }
  function clothSets(state) {
    var out = [];
    for (var pid in state.clothes.sets) {
      var p = SG.Data.product(pid);
      if (p) out.push({ pid: pid, name: p.name, set: state.clothes.sets[pid], wearing: state.clothes.current === pid });
    }
    return out;
  }

  /* ---------- 娱乐 ---------- */
  function entertain(pid, minutes, state) {
    var p = SG.Data.product(pid);
    if (!p || p.kind !== 'ent') return { ok: false, msg: '这不是娱乐品' };
    if (!SG.Inv.has(pid, 1, state)) return { ok: false, msg: '库存里没有这件娱乐品' };
    var gain = p.eff.ent * minutes / 60 * 0.8;
    addStat(state, 'ent', gain);
    if (p.eff.hp > 0) addStat(state, 'hp', p.eff.hp * minutes / 60 * 0.5);
    state.stamina = SG.u.clamp(state.stamina - 2 * minutes / 60, 0, 140);
    return { ok: true, msg: '玩了会儿' + p.name + '，心情好多了。', minutes: minutes, sta: -2 * minutes / 60 };
  }

  /* ---------- 用药 ---------- */
  function takeMed(pid, state) {
    var p = SG.Data.product(pid);
    if (!p || p.kind !== 'med') return { ok: false, msg: '这不是药品' };
    if (!SG.Inv.has(pid, 1 / (p.sv || 1), state)) return { ok: false, msg: '库存不足' };
    consumeServing(pid, state);
    var mult = identityOf(state).id === 'doctor' ? 1.25 : 1;
    if (p.fx && p.fx.treat) {
      if (state.diseases[p.fx.treat]) {
        delete state.diseases[p.fx.treat];
        state.hpRegenUntil = state.day + 3;
        log(state, '服药：' + p.name + '治好了' + cfg().DISEASES[p.fx.treat].name + '。');
        return { ok: true, msg: cfg().DISEASES[p.fx.treat].name + '痊愈了，身体开始慢慢恢复。', minutes: 10, sta: -2 };
      }
      return { ok: true, msg: '没有相关病症，吃了也无妨。', minutes: 10, sta: -2 };
    }
    if (p.fx && p.fx.heal) {
      addStat(state, 'hp', p.fx.heal * mult);
      return { ok: true, msg: '处理了伤口，生命值恢复。', minutes: 15, sta: -4 };
    }
    if (p.fx && p.fx.disinfect) {
      addStat(state, 'hp', 2);
      log(state, '消毒处理完成。');
      return { ok: true, msg: '伤口消毒完成，感染风险降低。', minutes: 10, sta: -2 };
    }
    addStat(state, 'hp', 1);
    return { ok: true, msg: '服用了' + p.name + '。', minutes: 5, sta: -1 };
  }

  /* ---------- 疾病 ---------- */
  function gainDisease(state, id, why) {
    var d = cfg().DISEASES[id];
    if (!d || state.diseases[id]) return;
    state.diseases[id] = { startDay: state.day, days: 0 };
    log(state, '生病了：' + d.name + '（' + why + '）。' + d.desc, 'warn');
  }
  function isSick(state) { return Object.keys(state.diseases).length > 0; }

  /* ---------- 每小时属性衰减 ---------- */
  function decayHours(state, hours) {
    var cfgx = cfg();
    var id = identityOf(state);
    var entMult = id.id === 'student' ? 0.7 : 1;
    /* 末日轮换修正 */
    var hz = (typeof SG.Time !== 'undefined' && SG.Time.hazardDef) ? SG.Time.hazardDef(state) : null;
    var hzUnprotected = hz && (typeof SG.Time.hazardProtected === 'function') && !SG.Time.hazardProtected(state);
    var thirstMult = (hz && hz.id === 'heat' && hzUnprotected) ? 2 : 1;
    var satMult = (hz && hz.id === 'cold' && hzUnprotected) ? 1.6 : 1;
    for (var i = 0; i < hours; i++) {
      var sat = state.stats.sat, thirst = state.stats.thirst;
      addStat(state, 'sat', -cfgx.DECAY.sat * satMult);
      addStat(state, 'thirst', -cfgx.DECAY.thirst * thirstMult);
      addStat(state, 'ent', -cfgx.DECAY.ent * entMult);
      var hygRate = state.created.gender === 'male' ? cfgx.DECAY.hygMale : cfgx.DECAY.hygFemale;
      addStat(state, 'hyg', -hygRate);
      addStat(state, 'hp', -cfgx.DECAY.hp);
      if (sat < cfgx.HUNGRY_THRESHOLD) addStat(state, 'hp', -1.5);
      if (thirst < cfgx.HUNGRY_THRESHOLD) addStat(state, 'hp', -1.5);
      if (state.stats.hp <= 0) { state.stats.hp = 0; return; }
    }
  }

  /* ---------- 生存判定（每日结算：所有数值须 > 60） ---------- */
  function checkSurvival(state) {
    var min = cfg().SURVIVE_MIN;
    var name = state.created.name;
    var bad = [];
    var s = state.stats;
    if (s.hp <= 0) return { end: true, title: '生命终结', text: name + '倒在了柜台后面。最后一刻，货架上的灯还亮着。' };
    if (s.sat <= min) bad.push(['饥饿', '你已经很多天没吃上一顿像样的饭了。胃里空荡荡的，眼前发黑。']);
    if (s.thirst <= min) bad.push(['干渴', '喉咙像砂纸一样。末日的水，比黄金还贵。']);
    if (s.ent <= min) bad.push(['精神崩塌', '日复一日的沉默与重复，终于压垮了你。你望着窗外苍凉的废墟，再也笑不出来。']);
    if (s.hyg <= min) bad.push(['卫生崩溃', '污垢与疾病缠上了你。在末日的诊所里，干净意味着活着。']);
    if (bad.length) {
      return { end: true, title: '生存失败 · ' + bad[0][0], text: bad[0][1] + ' 第' + state.day + '天，' + name + '的旅程到此为止。' };
    }
    /* 员工检查 */
    for (var i = 0; i < state.employees.length; i++) {
      var e = state.employees[i];
      var es = e.stats;
      if (es.sat <= min || es.thirst <= min || es.hp <= min || es.ent <= min || es.hyg <= min) {
        return { end: true, title: '员工倒下', text: '店员' + e.name + '倒在了岗位上。你没能照顾好他们——这间超市，只剩下你一个人了。' };
      }
    }
    return { end: false };
  }

  return {
    identityOf: identityOf, log: log, addStat: addStat, applyNutr: applyNutr, applyMeal: applyMeal,
    consumeServing: consumeServing, takeWater: takeWater, waterCount: waterCount,
    eatItem: eatItem, drinkItem: drinkItem, eatCooked: eatCooked, orderAndEat: orderAndEat,
    sleep: sleep, rest: rest, shower: shower,
    changeClothes: changeClothes, washClothes: washClothes, clothSets: clothSets,
    entertain: entertain, takeMed: takeMed,
    gainDisease: gainDisease, isSick: isSick,
    decayHours: decayHours, checkSurvival: checkSurvival, getNutrEntry: getNutrEntry
  };
})();

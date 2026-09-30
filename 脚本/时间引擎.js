/* ============================================================
   脚本 / 时间引擎 —— 按小时推进、顾客到店、每日结算、快进
   ============================================================ */
window.SG = window.SG || {};
SG.Time = (function () {
  var cfg = function () { return DATA.config; };
  var DAY_END = 8 * 60 + 1440;   // 次日 08:00 = 一天结束

  function advanceTime(min, state) {
    if (state.ending) return;
    var fromMin = state.minute;
    var target = state.minute + min;
    var startHour = Math.floor(fromMin / 60), endHour = Math.floor(target / 60);
    var hours = endHour - startHour;
    if (hours > 0) SG.Player.decayHours(state, hours);
    state.minute = target;
    /* 跨越营业时段整点 → 顾客到店 */
    for (var h = startHour; h < endHour; h++) {
      var hh = ((h % 24) + 24) % 24;
      if (hh >= cfg().OPEN_START / 60 && hh < cfg().OPEN_END / 60) {
        SG.Cust.hourlyWave(state);
        if (state.ending) return;
      }
    }
    if (state.minute >= DAY_END) {
      state.minute = 8 * 60;
      endDay(state);
    }
  }

  function endDay(state) {
    state.day += 1;
    var u = SG.u;
    /* 1. 新一天营养窗口 */
    SG.Player.getNutrEntry(state);
    /* 2. 4 日营养结算 */
    nutritionCheck(state);
    /* 3. 月经（女性） */
    periodCheck(state);
    /* 4. 衣物更换检查 */
    clothCheck(state);
    /* 5. 疾病演进 */
    diseaseCheck(state);
    /* 6. 生命值恢复：疾病治愈后加速恢复；状态良好时每日缓慢回血 */
    if (state.stats.hp < 100) {
      if (state.hpRegenUntil >= state.day) {
        SG.Player.addStat(state, 'hp', 10);
        if (state.stats.hp >= 100) state.hpRegenUntil = 0;
      } else if (!state.malnutrition && state.stats.sat >= 50 && state.stats.thirst >= 50) {
        SG.Player.addStat(state, 'hp', 6);
      }
    }
    /* 7. 员工照料 */
    SG.Emp.care(state);
    /* 8. DLC 每日营收 */
    SG.Dlc.daily(state);
    /* 9. 金手指刷新 + 点餐菜单刷新 */
    SG.Gf.refresh(state);
    if (state.orderDay !== state.day) SG.Econ.refreshOrderMenu(state);
    /* 9.5 末日轮换（第 2 个月起） */
    rollHazard(state);
    applyHazard(state);
    /* 9.6 基地每日事件（骚扰 / 武装攻打） */
    SG.Map.daily(state);
    /* 9.7 成就检查 */
    var earned = SG.Ach.check(state);
    if (earned.length) {
      earned.forEach(function (a) {
        SG.Player.log(state, '成就达成：「' + a.name + '」+ ' + a.points + ' 成就点！', '');
      });
    }
    /* 10. 自动补货 */
    if (state.store.autoRestock) SG.Gf.autoRestock(state);
    /* 11. 生存判定 */
    var surv = SG.Player.checkSurvival(state);
    if (surv.end) {
      state.ending = surv;
      SG.State.save();
      return;
    }
    /* 12. 存档 + 早晨日志 */
    SG.State.save();
    morningLog(state);
  }

  function nutritionCheck(state) {
    var need = cfg().NUTR_NEED;
    var sum = { carb: 0, prot: 0, fat: 0, vit: 0 };
    state.nutrDays.forEach(function (e) { sum.carb += e.carb; sum.prot += e.prot; sum.fat += e.fat; sum.vit += e.vit; });
    var deficient = sum.carb < need.carb * cfg().NUTR_CHECK_DAYS ||
      sum.prot < need.prot * cfg().NUTR_CHECK_DAYS ||
      sum.fat < need.fat * cfg().NUTR_CHECK_DAYS ||
      sum.vit < need.vit * cfg().NUTR_CHECK_DAYS;
    if (deficient && !state.malnutrition) {
      state.malnutrition = true;
      SG.Player.log(state, '营养结算：近 4 日摄入不足，患上了营养不良（每日 -5 生命值）。多吃点蔬菜水果和肉！', 'warn');
    } else if (!deficient && state.malnutrition) {
      state.malnutrition = false;
      SG.Player.log(state, '营养结算：近 4 日营养均衡，营养不良痊愈。');
    }
  }

  function periodCheck(state) {
    if (state.created.gender !== 'female') return;
    if (!state.period.active && state.day >= state.period.nextDay) {
      state.period.active = true;
      state.period.daysLeft = SG.u.rint(cfg().PERIOD.min, cfg().PERIOD.max);
      state.period.nextDay = state.day + cfg().PERIOD.cycle;
      SG.Player.log(state, '月经来了（约' + state.period.daysLeft + '天）。每天需要使用卫生巾，否则卫生值会加速下降。', 'warn');
    }
    if (state.period.active) {
      var pad = null;
      if (SG.Inv.has('dl11', 1 / (SG.Data.product('dl11').sv || 1), state)) pad = 'dl11';
      else if (SG.Inv.has('dl12', 1 / (SG.Data.product('dl12').sv || 1), state)) pad = 'dl12';
      if (pad) {
        SG.Inv.take(pad, 1 / (SG.Data.product(pad).sv || 1), state);
      } else {
        SG.Player.addStat(state, 'hyg', -12);
        SG.Player.log(state, '没有卫生巾可用，卫生值加速下降！', 'warn');
      }
      state.period.daysLeft -= 1;
      if (state.period.daysLeft <= 0) {
        state.period.active = false;
        SG.Player.log(state, '月经结束了。');
      }
    }
  }

  function clothCheck(state) {
    var season = SG.u.dayInfo(state.day).season;
    var interval = cfg().CLOTH_INTERVAL[season];
    var overdue = state.day - state.clothes.lastChangeDay - interval;
    if (overdue > 0) {
      SG.Player.addStat(state, 'hyg', -cfg().CLOTH_PENALTY * overdue);
      SG.Player.log(state, '已经 ' + (interval + overdue) + ' 天没换衣服了，卫生值 -' + (cfg().CLOTH_PENALTY * overdue) + '。', 'warn');
    }
  }

  function diseaseCheck(state) {
    var doc = SG.Player.identityOf(state).id === 'doctor';
    for (var k in state.diseases) {
      var d = state.diseases[k];
      var info = cfg().DISEASES[k];
      d.days += 1;
      SG.Player.addStat(state, 'hp', -info.hpPerDay);
      var auto = doc ? info.autoDays - 1 : info.autoDays;
      if (d.days >= auto) {
        delete state.diseases[k];
        state.hpRegenUntil = state.day + 3;
        SG.Player.log(state, info.name + '自愈了，身体慢慢恢复。');
      }
    }
    if (state.malnutrition) SG.Player.addStat(state, 'hp', -cfg().MALNUTRITION_HP_LOSS);
  }

  function morningLog(state) {
    var day = state.day - 1;
    state.incomeHistory = state.incomeHistory || [];
    state.incomeHistory.push({ day: day, income: Math.round(state.dayIncome || 0) });
    if (state.incomeHistory.length > 90) state.incomeHistory.shift();
    state.dayIncome = 0;
    SG.Player.log(state, '第' + day + '天结束。目前累计赚取 ' + SG.u.money(state.cumPoints) + ' 积分，余额 ' + SG.u.money(state.points) + '。');
  }

  /* 快进 N 天（自动补货开启时推荐） */
  function fastForward(days, state) {
    var done = 0;
    while (done < days && !state.ending) {
      advanceTime(DAY_END - state.minute, state);
      done++;
    }
    return done;
  }

  /* ---------- 末日轮换危害 ---------- */
  function hazardDef(state) {
    if (!state.hazard || state.hazard.day !== state.day) return null;
    return cfg().HAZARDS[state.hazard.id];
  }
  function hazardProtected(state) {
    var hz = hazardDef(state);
    if (!hz) return true;
    return state.store.shieldLv >= hz.needShield;
  }
  function rollHazard(state) {
    state.gf = state.gf || {};
    if (state.day < cfg().HAZARD_START_DAY) { state.hazard = null; return; }
    var month = SG.u.dayInfo(state.day).month;
    var p = Math.min(0.75, cfg().HAZARD_CHANCE + month * 0.02);
    if (SG.u.chance(p)) {
      var ids = Object.keys(cfg().HAZARDS);
      var hid = SG.u.pick(ids);
      var hz = cfg().HAZARDS[hid];
      state.hazard = { id: hid, day: state.day };
      state.gf.hazardCount = (state.gf.hazardCount || 0) + 1;
      var protectedOk = state.store.shieldLv >= hz.needShield;
      SG.Player.log(state, '末日轮换：今日出现「' + hz.name + '」！' + hz.desc + (protectedOk ? '' : ' 你的保护罩（' + state.store.shieldLv + ' 级）不足以完全防范！'), 'warn');
    } else {
      state.hazard = null;
    }
  }
  function applyHazard(state) {
    var hz = hazardDef(state);
    if (!hz || hazardProtected(state)) return;
    if (hz.id === 'acid') {
      for (var pid in state.shelf) {
        var lose = Math.max(1, Math.floor(state.shelf[pid] * 0.05));
        state.shelf[pid] -= lose;
        if (state.shelf[pid] <= 0.0001) delete state.shelf[pid];
      }
      SG.Player.log(state, '酸雨腐蚀了货架上的商品（约 5% 受损）。', 'warn');
    }
    if (hz.id === 'horde') {
      SG.Player.addStat(state, 'hp', -10);
      SG.Player.log(state, '尸潮冲破防线，你受了伤（生命 -10）。保护罩升到 4 级才能抵御。', 'warn');
    }
  }

  return { advanceTime: advanceTime, endDay: endDay, fastForward: fastForward,
    hazardDef: hazardDef, hazardProtected: hazardProtected };
})();

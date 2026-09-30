/* ============================================================
   脚本 / 超市 —— 等级、升级条件、区域解锁、保护罩、搬迁
   ============================================================ */
window.SG = window.SG || {};
SG.Store = (function () {
  var cfg = function () { return DATA.config; };

  function levelDef(state) { return cfg().LEVELS[state.store.level - 1]; }
  function nextDef(state) { return cfg().LEVELS[state.store.level] || null; }
  function stage(state) { return SG.Econ.stageOf(state.day); }
  function maxLevel(state) { return cfg().LEVEL_CAP[stage(state)]; }
  function empCap(state) { return SG.Emp.capOf(state); }

  function upgradeCost(state) {
    var def = nextDef(state);
    if (!def) return 0;
    var cost = def.cost;
    if (SG.Player.identityOf(state).id === 'coder') cost = Math.ceil(cost * 0.9);
    return cost;
  }
  function checkConditions(state) {
    var def = nextDef(state);
    if (!def) return { ok: false, missing: ['已满级'] };
    var s = state, c = def.cond;
    var missing = [];
    if (s.cumPoints < c.cum) missing.push('累计赚取积分 ' + SG.u.money(s.cumPoints) + ' / ' + SG.u.money(c.cum));
    if (SG.Inv.typesStocked(s) < c.types) missing.push('商品种类 ' + SG.Inv.typesStocked(s) + ' / ' + c.types);
    if (s.store.newCustomers < c.newCust) missing.push('新顾客 ' + s.store.newCustomers + ' / ' + c.newCust);
    if (s.employees.length < c.emp) missing.push('员工 ' + s.employees.length + ' / ' + c.emp);
    if (c.crys > 0 && SG.Econ.crystalTotal(s) < c.crys) missing.push('收取晶核 ' + SG.Econ.crystalTotal(s) + ' / ' + c.crys);
    var maxLv = maxLevel(state);
    if (state.store.level >= maxLv) missing.push('当前阶段（' + cfg().STAGES[stage(state)].name + '）最高只能升到 ' + maxLv + ' 级');
    if (s.points < upgradeCost(state)) missing.push('积分 ' + SG.u.money(s.points) + ' / ' + SG.u.money(upgradeCost(state)));
    return { ok: missing.length === 0, missing: missing };
  }
  function upgrade(state) {
    if (state.ending) return { ok: false, msg: '游戏已结束' };
    var chk = checkConditions(state);
    if (!chk.ok) return { ok: false, msg: '条件未满足：' + chk.missing[0] };
    var cost = upgradeCost(state);
    state.points -= cost;
    state.store.level += 1;
    /* 扩建：按新等级重建设施，原货架商品收回仓库（玩家重新上货） */
    SG.Fac.applyPlan(state);
    SG.Player.log(state, '超市升级：升至 ' + cfg().LEVELS[state.store.level - 1].lv + ' 级「' + cfg().LEVELS[state.store.level - 1].name + '」！' + (state.store.level >= 3 ? ' 店内划分出多个分区，设施随面积扩张。' : ' 货架增加了，还添了新设施。'), '');
    SG.State.save();
    return { ok: true, msg: '升级成功！现在是「' + cfg().LEVELS[state.store.level - 1].name + '」（' + cfg().LEVELS[state.store.level - 1].area + '），原货架商品已收回仓库，请按新布局重新上货' };
  }

  function unlockArea(areaId, state) {
    var a = cfg().AREAS[areaId];
    if (!a) return { ok: false, msg: '没有这个区域' };
    if (state.store.areas[areaId]) return { ok: false, msg: '已经解锁了' };
    if (state.store.level < a.lv) return { ok: false, msg: '需要超市 ' + a.lv + ' 级' };
    if (areaId === 'kitchen' && !state.created.cook) return { ok: false, msg: '你不会做饭，小厨房对你没有意义' };
    if (state.points < a.cost) return { ok: false, msg: '积分不足（需要 ' + SG.u.money(a.cost) + '）' };
    state.points -= a.cost;
    state.store.areas[areaId] = true;
    SG.Player.log(state, '解锁区域：' + a.name + '。' + a.desc, '');
    SG.State.save();
    return { ok: true, msg: '解锁了「' + a.name + '」' };
  }

  function shieldDef(state) { return cfg().SHIELD[state.store.shieldLv - 1]; }
  function shieldNext(state) { return cfg().SHIELD[state.store.shieldLv] || null; }
  function upgradeShield(state) {
    var nxt = shieldNext(state);
    if (!nxt) return { ok: false, msg: '保护罩已到最大范围' };
    if (state.points < nxt.cost) return { ok: false, msg: '积分不足（需要 ' + SG.u.money(nxt.cost) + '）' };
    state.points -= nxt.cost;
    state.store.shieldLv += 1;
    SG.Player.log(state, '保护罩升级：范围扩大至 ' + nxt.r + '。', '');
    SG.State.save();
    return { ok: true, msg: '保护罩范围扩大至 ' + nxt.r + '。' };
  }

  /* 搬迁（超市 5 级解锁；搬迁到已发现的基地附近） */
  function canRelocate(state) { return state.store.level >= 5; }
  function relocate(baseId, state) {
    if (!canRelocate(state)) return { ok: false, msg: '需要超市 5 级才能搬迁超市位置' };
    var b = null;
    if (state.bases) {
      for (var i = 0; i < state.bases.length; i++) {
        if (state.bases[i].id === baseId) { b = state.bases[i]; break; }
      }
    }
    if (!b) return { ok: false, msg: '没有这个基地' };
    if (!b.discovered) return { ok: false, msg: '还没打听到这个基地的情报' };
    var cost = DATA.map.relocateCost;
    if (state.points < cost) return { ok: false, msg: '搬迁需要 ' + SG.u.money(cost) + ' 积分' };
    state.points -= cost;
    state.store.location = b.id;
    SG.Player.log(state, '超市搬迁至「' + b.name + '」附近。' + SG.Map.desc(b), '');
    SG.State.save();
    return { ok: true, msg: '搬迁完成：超市开到了「' + b.name + '」附近。' + SG.Map.desc(b) };
  }

  function areaSummary(state) {
    var unlocked = [], locked = [];
    for (var k in cfg().AREAS) {
      if (state.store.areas[k]) unlocked.push(cfg().AREAS[k]);
      else locked.push({ id: k, def: cfg().AREAS[k] });
    }
    return { unlocked: unlocked, locked: locked };
  }

  return {
    levelDef: levelDef, nextDef: nextDef, stage: stage, maxLevel: maxLevel,
    upgradeCost: upgradeCost, checkConditions: checkConditions, upgrade: upgrade,
    unlockArea: unlockArea, shieldDef: shieldDef, shieldNext: shieldNext, upgradeShield: upgradeShield,
    canRelocate: canRelocate, relocate: relocate, areaSummary: areaSummary
  };
})();

/* ============================================================
   脚本 / 界面 / 主界面 —— 状态面板、营养、快捷行动、点餐、趋势、日志
   ============================================================ */
window.SG = window.SG || {};
SG.Screens.main = function (body, state) {
  var cfg = DATA.config;
  var d = SG.u.dayInfo(state.day);
  var stage = cfg.STAGES[d.stage];
  var st = state.stats;
  var h = '';

  /* 顶栏横幅 */
  var curBase = SG.Map.base(state);
  var locName = curBase ? curBase.name + '附近' : '荒野落脚点';
  h += '<div class="hero panel">';
  h += '<div><div class="hero-title">末日 ' + SG.u.fmtDate(state.day) + '</div>' +
    '<div class="hero-sub">' + SG.u.fmtClock(state.minute) + ' · ' + stage.name + ' · ' +
    SG.Store.levelDef(state).name + ' · ' + locName + '</div></div>';
  h += '<div class="hero-badge">保护罩 ' + state.store.shieldLv + ' 级<br><span class="small">' + SG.Store.shieldDef(state).r + ' 米</span></div>';
  h += '</div>';

  /* 提醒横幅 */
  var warns = [];
  if (state.created.gender === 'female' && state.period.active) warns.push('月经中（约剩 ' + state.period.daysLeft + ' 天），卫生值下降加速，请备好卫生巾');
  var seasonDays = DATA.config.CLOTH_INTERVAL[SG.u.dayInfo(state.day).season];
  var sinceChange = state.day - state.clothes.lastChangeDay;
  if (sinceChange > seasonDays) warns.push('已 ' + sinceChange + ' 天未更换衣物，每天卫生值 -10，请换衣并清洗');
  if (state.malnutrition) warns.push('营养不良！有一类营养 4 日未达标，生命值持续受损，请均衡饮食');
  for (var dis in state.diseases) warns.push('病症：' + cfg().DISEASES[dis].name + '（' + cfg().DISEASES[dis].desc + '）');
  var hz = SG.Time.hazardDef(state);
  if (hz) {
    var hzOk = SG.Time.hazardProtected(state);
    warns.push('今日末日轮换：「' + hz.name + '」' + hz.desc + (hzOk ? '' : ' <b>保护罩需 ' + hz.needShield + ' 级，请尽快升级！</b>'));
  }
  if (state.ending) return;
  if (warns.length) {
    h += '<div class="panel warn-banner">' + warns.map(function (w) { return '<div>' + w + '</div>'; }).join('') + '</div>';
  }

  /* 属性面板 */
  h += '<div class="grid cols-2">';
  h += '<div class="panel"><h3>店主状态</h3><div class="stat-list">';
  h += SG.UI.statBar('饱食度', st.sat, 'c1');
  h += SG.UI.statBar('口渴度', st.thirst, 'c2');
  h += SG.UI.statBar('生命值', st.hp, 'c3');
  h += SG.UI.statBar('娱乐值', st.ent, 'c4');
  h += SG.UI.statBar('卫生值', st.hyg, 'c5');
  h += SG.UI.statBar('体力', state.stamina, 'c6');
  h += '</div><div class="small muted mt">每天结算时，店主与所有店员的五项数值都需 > 60。</div></div>';

  /* 营养面板 */
  var nutr = { carb: 0, prot: 0, fat: 0, vit: 0 };
  state.nutrDays.forEach(function (e) { nutr.carb += e.carb; nutr.prot += e.prot; nutr.fat += e.fat; nutr.vit += e.vit; });
  h += '<div class="panel"><h3>营养摄入（4 日一结算）</h3><div class="stat-list">';
  h += nutrRow('碳水', nutr.carb, cfg.NUTR_NEED.carb);
  h += nutrRow('蛋白质', nutr.prot, cfg.NUTR_NEED.prot);
  h += nutrRow('脂肪', nutr.fat, cfg.NUTR_NEED.fat);
  h += nutrRow('维生素', nutr.vit, cfg.NUTR_NEED.vit);
  h += '</div><div class="small muted mt">四日累计需分别达到 ' + cfg.NUTR_NEED.carb + '/' + cfg.NUTR_NEED.prot + '/' + cfg.NUTR_NEED.fat + '/' + cfg.NUTR_NEED.vit + ' 克，缺一类即营养不良。</div>';
  h += '<div class="small muted">本轮还需 ' + Math.max(0, Math.round(cfg.NUTR_NEED.carb * 4 - nutr.carb)) + '/' + Math.max(0, Math.round(cfg.NUTR_NEED.prot * 4 - nutr.prot)) + '/' + Math.max(0, Math.round(cfg.NUTR_NEED.fat * 4 - nutr.fat)) + '/' + Math.max(0, Math.round(cfg.NUTR_NEED.vit * 4 - nutr.vit)) + ' 克</div></div>';
  h += '</div>';

  /* 快捷行动 */
  h += '<div class="panel"><h3>快捷行动</h3><div class="action-grid">';
  h += SG.UI.btn('点餐', 'UI.openOrderModal', [], 'primary');
  h += SG.UI.btn('吃饭', 'UI.openEatModal', []);
  h += SG.UI.btn('喝水', 'UI.openDrinkModal', []);
  h += SG.UI.btn('睡觉', 'UI.sleepAct', []);
  h += SG.UI.btn('休息', 'UI.openRestModal', []);
  h += SG.UI.btn('洗澡', 'UI.showerAct', []);
  h += SG.UI.btn('衣物', 'UI.openClothesModal', []);
  h += SG.UI.btn('娱乐', 'UI.openEntModal', []);
  h += SG.UI.btn('服药', 'UI.openMedModal', []);
  h += SG.UI.btn('快进 30 分', 'UI.skipTime', [30]);
  h += SG.UI.btn('快进 1 小时', 'UI.skipTime', [60]);
  h += '</div></div>';

  /* 收银台：店内顾客与接待 */
  var waiting = SG.Cust.waitingList(state);
  var cashier = null;
  for (var ei = 0; ei < state.employees.length; ei++) {
    var ee = state.employees[ei];
    if (state.store.cashiers.indexOf(ee.id) >= 0 && SG.Emp.onDuty(ee, state)) { cashier = ee; break; }
  }
  h += '<div class="panel"><h3>收银台' + (cashier ? '（收银员：' + cashier.name + ' 当班，自动接待）' : '') + '</h3>';
  if (waiting.length) {
    h += '<div class="small muted mb">店内 ' + waiting.length + ' 位顾客正在排队等候，其中 1 位正准备结账：</div>';
    var wc = waiting[0];
    h += '<div class="queue-row"><div><b>' + SG.u.esc(wc.name) + '</b> <span class="chip">' + (wc.persona === 'bad' ? '可疑人物' : (wc.persona === 'rich' ? '囤货商人' : (wc.persona === 'sick' ? '病患' : (wc.persona === 'wander' ? '拾荒者' : '普通顾客')))) + '</span>' +
      '<div class="small muted">第 ' + wc.visits + ' 次到店 · 持有 ' + SG.u.money(wc.points) + ' 积分' +
      (wc.blacklist ? ' · <span class="warn">黑名单</span>' : '') + '</div></div>' +
      (cashier ? '' : '<div style="display:flex;gap:8px">' +
        SG.UI.btn('接待交易', 'UI.serveNext', [], 'sm primary') +
        SG.UI.btn('拒绝接待', 'UI.serveRefuse', [], 'sm') + '</div>') + '</div>';
    if (cashier) {
      h += '<div class="small muted mt">收银员会自动完成全部排队顾客的结算，无需你操作。</div>';
    }
  } else {
    h += '<div class="muted small">店内暂无顾客。先把货架上好，营业时段（8~22 点）顾客会陆续到店排队。</div>';
  }
  h += '</div>';

  /* 今日点餐菜单 */
  h += '<div class="panel"><h3>今日点餐（系统直供，不消耗超市库存）</h3><div class="order-list">';
  var menu = SG.Econ.orderMenu(state);
  if (!menu.length) {
    h += '<div class="muted">系统正在采购，稍后再来。</div>';
  } else {
    menu.forEach(function (o) {
      var dish = SG.Data.dish(o.dishId);
      if (!dish) return;
      var cooked = (state.cooked && state.cooked[dish.id]) || 0;
      var canOwn = cooked > 0;
      h += '<div class="order-row"><div><b>' + dish.name + '</b> <span class="chip">' + dish.cuisine + '</span>' +
        '<div class="small muted">饱食+' + (dish.eff.sat || 55) + ' · 碳水' + (dish.nut.carb || 0) + 'g/蛋白' + (dish.nut.prot || 0) + 'g/脂肪' + (dish.nut.fat || 0) + 'g/维' + (dish.nut.vit || 0) + 'g</div></div>' +
        '<div style="text-align:right"><div class="small">' + SG.u.money(o.price) + ' 积分</div>' +
        (canOwn ? SG.UI.btn('吃自做的（库存' + cooked + '）', 'UI.eatCookedDish', [dish.id], 'sm') : '') +
        SG.UI.btn('兑换并享用', 'UI.orderDish', [dish.id], 'sm primary') + '</div></div>';
    });
  }
  h += '</div></div>';

  /* 收入趋势 + 日志 */
  h += '<div class="grid cols-2">';
  h += '<div class="panel"><h3>近 7 日收入</h3>' + incomeChart(state) + '</div>';
  h += '<div class="panel"><h3>今日记录</h3><div class="log-list">';
  var logs = state.logs.slice(-6).reverse();
  if (!logs.length) h += '<div class="muted">还没有记录。</div>';
  logs.forEach(function (l) {
    h += '<div class="log-item"><span class="log-day">第' + l.day + '天</span><span class="' + l.cls + '">' + SG.u.esc(l.text) + '</span></div>';
  });
  h += '</div></div></div>';

  body.innerHTML = h;
};
function nutrRow(label, val, need) {
  var pct = Math.min(100, Math.round(val / (need * 4) * 100));
  var ok = val >= need * 4;
  return '<div class="stat-item"><span class="lab">' + label + '</span>' +
    '<div class="bar"><div class="fill ' + (ok ? 'c1' : 'c2') + '" style="width:' + pct + '%"></div></div>' +
    '<span class="val">' + Math.round(val) + '/' + need * 4 + '</span></div>';
}
function incomeChart(state) {
  var hist = state.incomeHistory || [];
  var recent = hist.slice(-7);
  if (!recent.length) return '<div class="muted small">数据积累中……</div>';
  var max = Math.max.apply(null, recent.map(function (x) { return x.income; }));
  max = Math.max(max, 100);
  var w = 300, hh = 90, pad = 6;
  var bw = (w - pad * 2) / recent.length - 6;
  var bars = recent.map(function (x, i) {
    var bh = Math.max(3, x.income / max * (hh - 26));
    var x0 = pad + i * ((w - pad * 2) / recent.length) + 3;
    var y0 = hh - 16 - bh;
    return '<rect x="' + x0 + '" y="' + y0 + '" width="' + Math.max(4, bw) + '" height="' + bh + '" rx="2" fill="var(--accent)"/>' +
      '<text x="' + (x0 + bw / 2) + '" y="' + (hh - 3) + '" font-size="8" fill="var(--muted)" text-anchor="middle">' + (x.day % 30) + '</text>';
  }).join('');
  return '<svg viewBox="0 0 ' + w + ' ' + hh + '" style="width:100%;height:auto">' + bars + '</svg>' +
    '<div class="small muted">第' + (recent[0].day) + '~' + recent[recent.length - 1].day + '天 每日收入（积分）</div>';
}

/* ================= 行动注册 ================= */
SG.A.skipTime = function (minutes) {
  var state = SG.State.getState();
  if (state.ending) return { ok: false, msg: '旅程已结束' };
  return { ok: true, minutes: minutes };
};
SG.A.sleepAct = function () {
  var state = SG.State.getState();
  var m = SG.Player.sleep(state);
  if (!m.ok) return m;
  return { ok: true, msg: m.msg, minutes: m.minutes };
};
SG.A.restAct = function (minutes) {
  var state = SG.State.getState();
  return SG.Player.rest(minutes || 30, state);
};
SG.A.showerAct = function () {
  var state = SG.State.getState();
  return SG.Player.shower(state);
};
SG.A.eatItem = function (pid) {
  var state = SG.State.getState();
  return SG.Player.eatItem(pid, state);
};
SG.A.drinkItem = function (pid) {
  var state = SG.State.getState();
  return SG.Player.drinkItem(pid, state);
};
SG.A.entItem = function (pid) {
  var state = SG.State.getState();
  return SG.Player.entertain(pid, 30, state);
};
SG.A.medItem = function (pid) {
  var state = SG.State.getState();
  return SG.Player.takeMed(pid, state);
};
SG.A.orderDish = function (dishId) {
  var state = SG.State.getState();
  return SG.Player.orderAndEat(dishId, state);
};
SG.A.eatCookedDish = function (dishId) {
  var state = SG.State.getState();
  return SG.Player.eatCooked(dishId, state);
};

/* ================= 弹窗 ================= */
SG.UI.openEatModal = function () {
  var state = SG.State.getState();
  var h = '<div class="m-body"><div class="small muted">选择要吃的食物（速食用时更短，但会消耗物资与水）</div><div class="modal-list">';
  var cnt = 0;
  for (var pid in state.inventory) {
    var p = SG.Data.product(pid);
    if (!p) continue;
    var eff = p.eff || {};
    if (eff.sat < 8 || p.kind === 'water' || p.kind === 'drink') continue;
    if (SG.Inv.isExpired(pid, state)) continue;
    var have = state.inventory[pid];
    var qty = Math.floor(have / (p.sv || 1));
    if (qty < 1) continue;
    cnt++;
    var risk = rawRisk(p);
    var nutrTxt = nutrText(p);
    var waterTxt = p.waterNeed > 0 ? ' · 需水 ' + Math.ceil(p.waterNeed) + ' 瓶' : '';
    h += '<div class="modal-row"><div><b>' + SG.Data.label(p) + '</b> <span class="chip">' + p.cat + '</span>' +
      '<div class="small muted">库存 ' + SG.u.money(have) + ' · 饱食+' + eff.sat + ' 解渴+' + (eff.thirst || 0) + nutrTxt + waterTxt +
      (risk ? ' · <span class="warn">' + risk + '</span>' : '') + '</div></div>' +
      SG.UI.btn('吃', 'UI.eatItem', [pid], 'sm primary') + '</div>';
  }
  if (!cnt) h += '<div class="muted">没有可食用的食物，去库存页进货吧。</div>';
  h += '</div></div>';
  SG.UI.modal('<div class="m-head"><h3>吃饭</h3><button class="btn sm ghost" data-act="UI.closeModal" data-args="[]">关闭</button></div>' + h);
};
SG.UI.openDrinkModal = function () {
  var state = SG.State.getState();
  var h = '<div class="m-body"><div class="modal-list">';
  var cnt = 0;
  for (var pid in state.inventory) {
    var p = SG.Data.product(pid);
    if (!p || (p.kind !== 'water' && p.kind !== 'drink')) continue;
    if (SG.Inv.isExpired(pid, state)) continue;
    var qty = Math.floor(state.inventory[pid] / (p.sv || 1));
    if (qty < 1) continue;
    cnt++;
    h += '<div class="modal-row"><div><b>' + SG.Data.label(p) + '</b> <span class="chip">' + (p.kind === 'water' ? '饮用水' : '饮料') + '</span>' +
      '<div class="small muted">库存 ' + SG.u.money(state.inventory[pid]) + ' · 解渴+' + (p.eff.thirst || 0) + nutrText(p) + '</div></div>' +
      SG.UI.btn('喝', 'UI.drinkItem', [pid], 'sm primary') + '</div>';
  }
  if (!cnt) h += '<div class="muted">没有可饮用的水或饮料。</div>';
  h += '</div></div>';
  SG.UI.modal('<div class="m-head"><h3>喝水</h3><button class="btn sm ghost" data-act="UI.closeModal" data-args="[]">关闭</button></div>' + h);
};
SG.UI.openEntModal = function () {
  var state = SG.State.getState();
  var h = '<div class="m-body"><div class="modal-list">';
  var cnt = 0;
  for (var pid in state.inventory) {
    var p = SG.Data.product(pid);
    if (!p || p.kind !== 'ent') continue;
    if (SG.Inv.isExpired(pid, state)) continue;
    var qty = Math.floor(state.inventory[pid] / (p.sv || 1));
    if (qty < 1) continue;
    cnt++;
    h += '<div class="modal-row"><div><b>' + SG.Data.label(p) + '</b><div class="small muted">库存 ' + SG.u.money(state.inventory[pid]) + ' · 娱乐+' + (p.eff.ent || 15) + '</div></div>' +
      SG.UI.btn('玩', 'UI.entItem', [pid], 'sm primary') + '</div>';
  }
  if (!cnt) h += '<div class="muted">没有娱乐用品，可在超市升级后解锁娱乐区。</div>';
  h += '</div></div>';
  SG.UI.modal('<div class="m-head"><h3>娱乐</h3><button class="btn sm ghost" data-act="UI.closeModal" data-args="[]">关闭</button></div>' + h);
};
SG.UI.openMedModal = function () {
  var state = SG.State.getState();
  var h = '<div class="m-body"><div class="modal-list">';
  var cnt = 0;
  for (var pid in state.inventory) {
    var p = SG.Data.product(pid);
    if (!p || p.kind !== 'med') continue;
    if (SG.Inv.isExpired(pid, state)) continue;
    var qty = Math.floor(state.inventory[pid] / (p.sv || 1));
    if (qty < 1) continue;
    cnt++;
    var desc = p.medDesc ? ' · ' + p.medDesc : '';
    h += '<div class="modal-row"><div><b>' + SG.Data.label(p) + '</b><div class="small muted">库存 ' + SG.u.money(state.inventory[pid]) + desc + '</div></div>' +
      SG.UI.btn('使用', 'UI.medItem', [pid], 'sm primary') + '</div>';
  }
  if (!cnt) h += '<div class="muted">没有可用药品。</div>';
  h += '</div></div>';
  SG.UI.modal('<div class="m-head"><h3>服药 / 治疗</h3><button class="btn sm ghost" data-act="UI.closeModal" data-args="[]">关闭</button></div>' + h);
};
SG.UI.openRestModal = function () {
  SG.UI.modal('<div class="m-head"><h3>休息（恢复体力）</h3><button class="btn sm ghost" data-act="UI.closeModal" data-args="[]">关闭</button></div>' +
    '<div class="m-body"><div class="modal-list">' +
    SG.UI.btn('歇 30 分钟', 'UI.restAct', [30], 'sm primary') +
    SG.UI.btn('歇 1 小时', 'UI.restAct', [60], 'sm primary') +
    SG.UI.btn('歇 2 小时', 'UI.restAct', [120], 'sm primary') +
    '</div></div>');
};
SG.UI.openClothesModal = function () {
  var state = SG.State.getState();
  var h = '<div class="m-body"><div class="small muted">衣服脏了要清洗，否则不能再次穿戴。季节更换期限：夏 1 天 / 春秋 2 天 / 冬 3 天，超期每日卫生值 -10。</div><div class="modal-list">';
  var sets = SG.Player.clothSets(state);
  if (!sets.length) h += '<div class="muted">没有衣物。解锁服装区后可购买。</div>';
  sets.forEach(function (c) {
    var tag = c.wearing ? '（穿着中）' : '';
    h += '<div class="modal-row"><div><b>' + c.name + '</b>' + tag +
      '<div class="small muted">干净 ' + c.set.clean + ' 套 · 待洗 ' + c.set.dirty + ' 套</div></div>' +
      (c.set.clean > 0 && !c.wearing ? SG.UI.btn('换上', 'UI.changeClothes', [c.pid], 'sm primary') : '') +
      (c.set.dirty > 0 ? SG.UI.btn('清洗', 'UI.washClothes', [c.pid], 'sm') : '') + '</div>';
  });
  h += '</div></div>';
  SG.UI.modal('<div class="m-head"><h3>衣物管理</h3><button class="btn sm ghost" data-act="UI.closeModal" data-args="[]">关闭</button></div>' + h);
};
SG.A.changeClothes = function (pid) {
  var state = SG.State.getState();
  var r = SG.Player.changeClothes(pid, state);
  if (!r.ok) return r;
  SG.State.save();
  return r;
};
SG.A.washClothes = function (pid) {
  var state = SG.State.getState();
  var r = SG.Player.washClothes(pid, state);
  if (!r.ok) return r;
  SG.State.save();
  return r;
};
SG.UI.openOrderModal = function () {
  SG.UI.switchTab('main');
  /* 点餐菜单直接展示在主界面 */
};

/* ================= 收银台接待（顾客系统） ================= */
function personaLabel(c) {
  if (c.persona === 'bad') return '可疑人物';
  if (c.persona === 'rich') return '囤货商人';
  if (c.persona === 'sick') return '病患';
  if (c.persona === 'wander') return '拾荒者';
  return '普通顾客';
}
SG.UI.serveNext = function () {
  var state = SG.State.getState();
  var list = SG.Cust.waitingList(state);
  if (!list.length) { SG.UI.toast('店内没有等待的顾客', 'warn'); return; }
  var c = list[0];
  var h = '<div class="m-body"><div class="panel2" style="padding:12px 14px;border-radius:var(--radius)">';
  h += '<b>' + SG.u.esc(c.name) + '</b> <span class="chip">' + personaLabel(c) + '</span>';
  h += '<div class="small muted mt">' + c.age + ' 岁 · 第 ' + c.visits + ' 次到店 · 持有 ' + SG.u.money(c.points) + ' 积分' +
    (c.bannedUntil >= state.day ? ' · 禁入中' : '') + (c.blacklist ? ' · 黑名单' : '') + '</div>';
  if (c.persona === 'bad') h += '<div class="small warn mt">此人形迹可疑，小心偷窃抢劫（系统会自动处置）。</div>';
  h += '<div class="small muted mt">顾客可能：兑换积分、购买货架商品，也可能试图偷窃抢劫。你可以在弹窗中选择接待或拒绝。</div>';
  h += '</div></div>';
  h += '<div class="m-foot">' +
    SG.UI.btn('接待交易', 'UI.serveOk', [c.id], 'primary') +
    SG.UI.btn('拒绝接待', 'UI.serveNo', [c.id], '') +
    SG.UI.btn('关闭', 'UI.closeModal', [], 'ghost') + '</div>';
  SG.UI.modal('<div class="m-head"><h3>接待顾客 · ' + SG.u.esc(c.name) + '</h3></div>' + h);
};
SG.UI.serveRefuse = function () {
  var state = SG.State.getState();
  var list = SG.Cust.waitingList(state);
  if (!list.length) { SG.UI.toast('店内没有等待的顾客', 'warn'); return; }
  return doServe(list[0].id, false, state);
};
SG.UI.serveOk = function (cid) {
  var state = SG.State.getState();
  return doServe(cid, true, state);
};
SG.UI.serveNo = function (cid) {
  var state = SG.State.getState();
  return doServe(cid, false, state);
};
function doServe(cid, accept, state) {
  var r = SG.Cust.serveVisitor(cid, accept, state);
  if (!r.ok) return r;
  var h = '<div class="m-body"><div class="panel2" style="padding:12px 14px;border-radius:var(--radius)">';
  var c = state.customers[cid];
  h += '<b>' + SG.u.esc(c.name) + '</b> <span class="chip">' + personaLabel(c) + '</span><div class="mt" style="line-height:1.9">';
  if (r.refused) {
    h += '<div class="warn">你拒绝了接待，' + SG.u.esc(c.name) + ' 悻悻离开。</div>';
  } else {
    if (r.theft) h += '<div class="warn">【系统】' + SG.u.esc(r.theft.text) + '</div>';
    if (r.robbery) h += '<div class="warn">【系统】' + SG.u.esc(r.robbery.text) + '</div>';
    if (r.exchanged > 0) h += '<div>兑换：+ ' + SG.u.money(r.exchanged) + ' 积分</div>';
    if (r.items.length) {
      h += '<div>购买：' + r.items.map(function (x) { return SG.u.esc(x.name) + '×' + x.qty; }).join('、') +
        '（收入 ' + SG.u.money(r.spent) + ' 积分）</div>';
    } else if (r.exchanged === 0 && !r.theft && !r.robbery) {
      h += '<div class="muted">' + SG.u.esc(c.name) + ' 逛了一圈，什么都没买。</div>';
    }
    if (!r.exchanged && !r.items.length && !r.theft && !r.robbery) {
      h += '<div class="muted">' + SG.u.esc(c.name) + ' 看了看空空的货架，转身走了。</div>';
    }
  }
  h += '</div></div></div>';
  var left = SG.Cust.waitingList(state).length;
  h += '<div class="m-foot">' +
    (left ? SG.UI.btn('接待下一位（' + left + ' 人）', 'UI.serveNext', [], 'primary') : '') +
    SG.UI.btn('关闭', 'UI.closeModal', [], 'ghost') + '</div>';
  SG.UI.modal('<div class="m-head"><h3>结算完成</h3></div>' + h);
  return { ok: true, msg: r.hist.join('；'), minutes: accept ? 6 : 3, sta: accept ? -3 : -1 };
}
function nutrText(p) {
  var n = p.nut || {};
  var parts = [];
  if (n.carb) parts.push('碳水' + n.carb + 'g');
  if (n.prot) parts.push('蛋白' + n.prot + 'g');
  if (n.fat) parts.push('脂肪' + n.fat + 'g');
  if (n.vit) parts.push('维' + n.vit + 'g');
  return parts.length ? ' · ' + parts.join(' ') : '';
}
function rawRisk(p) {
  if (p.fx && p.fx.raw && !p.fx.rawSafe) return '生食可能生病';
  return '';
}

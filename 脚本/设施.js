/* ============================================================
   脚本 / 设施 —— 设施布局、上货规则、容量、分区、聚合货架
   ============================================================ */
window.SG = window.SG || {};
SG.Fac = (function () {
  var F = function () { return DATA.facility; };

  /* ---------- 商品派生属性（stor/size/zone），由数据注册 normProduct 调用 ---------- */
  function storOf(p) {
    if (p.stor) return p.stor;
    var r = F().STOR_RULES;
    if (r[p.kind]) return r[p.kind];
    if ((r.freezers || []).indexOf(p.id) >= 0) return 'freeze';
    if ((r.chillDrink || []).indexOf(p.id) >= 0) return 'chill';
    return null;
  }
  function sizeOf(p) {
    var nm = p.name || '';
    if (p.price >= 25 || /1L|1\.5L|2L|1升|1kg|1000g|950ml|500ml|500g|桶装|整条|箱装|大瓶|1斤/.test(nm)) return 'l';
    return 's';
  }
  function sizePoints(p) { return sizeOf(p) === 'l' ? 2 : 1; }

  /* ---------- 设施计划 ---------- */
  function planFor(level) { return F().PLAN[level] || F().PLAN[1]; }
  function buildFor(level) {
    var plan = planFor(level), out = {};
    for (var zone in plan) {
      var z = plan[zone], zf = out[zone] = {};
      for (var type in z) {
        for (var i = 1; i <= z[type]; i++) {
          var id = zone + '-' + type + '-' + i;
          zf[id] = { id: id, type: type, zone: zone, items: {} };
        }
      }
    }
    return out;
  }
  /* 按当前等级重建设施：旧设施中的商品全部收回仓库（扩建/改建），再建新布局 */
  function applyPlan(state) {
    var cur = state.store.facilities || {};
    var back = {};
    for (var z in cur) {
      for (var fid in cur[z]) {
        var it = cur[z][fid].items;
        for (var pid in it) back[pid] = (back[pid] || 0) + it[pid];
      }
    }
    state.store.facilities = buildFor(state.store.level);
    for (var pid2 in back) {
      state.inventory[pid2] = (state.inventory[pid2] || 0) + back[pid2];
    }
    rebuildShelf(state);
  }
  /* 开局/迁移初始化 */
  function ensure(state) {
    if (!state.store.facilities) {
      state.store.facilities = buildFor(state.store.level);
      /* 旧档平铺货架（无设施）→ 回仓库，玩家按新规则手动上货 */
      if (state.shelf) {
        for (var pid in state.shelf) {
          state.inventory[pid] = (state.inventory[pid] || 0) + state.shelf[pid];
        }
        state.shelf = {};
      }
    }
    rebuildShelf(state);
    return state.store.facilities;
  }

  /* ---------- 设施列表/分区列表 ---------- */
  function facilities(state) { ensure(state); return state.store.facilities; }
  function zoneList(state) {
    var fs = facilities(state), arr = [];
    for (var z in fs) {
      var fcs = [], t = {};
      for (var fid in fs[z]) {
        var f = fs[z][fid];
        fcs.push(f);
        t[f.type] = (t[f.type] || 0) + 1;
      }
      arr.push({ id: z, facs: fcs, summary: t });
    }
    return arr;
  }
  function facById(fid, state) {
    var fs = facilities(state);
    for (var z in fs) if (fs[z][fid]) return fs[z][fid];
    return null;
  }

  /* ---------- 容量 ---------- */
  function facCap(f) { return F().TYPES[f.type].cap; }
  function facUsed(f) {
    var t = 0;
    for (var pid in f.items) {
      var p = SG.Data.product(pid);
      if (p) t += sizePoints(p) * f.items[pid];
    }
    return t;
  }

  /* ---------- 上货校验 ---------- */
  function canPlace(p, f, state) {
    if (!p || !f) return { ok: false, msg: '参数错误' };
    if (!SG.Data.canStock(p, state)) return { ok: false, msg: '当前超市等级不能陈列「' + SG.Data.label(p) + '」（需 ' + p.lv + ' 级），仅可自用或给员工使用' };
    /* 存储兼容 */
    if (p.stor) {
      if (f.type !== p.stor) {
        var need = F().TYPES[p.stor].name;
        return { ok: false, msg: '「' + SG.Data.label(p) + '」必须放进' + need + '（' + F().TYPES[p.stor].note + '），不能直接摆货架' };
      }
    } else {
      if (f.type !== 'shelf' && !(f.type === 'chill' && (p.kind === 'drink' || p.kind === 'water'))) {
        return { ok: false, msg: '常温商品只能放货架（饮料/饮用水可选放冷藏柜）' };
      }
    }
    /* 分区：三级超市起，物品只能摆进所属分区 */
    if (state.store.level >= 3 && f.zone !== SG.Fac.zoneOf(p)) {
      var zn = F().ZONES[SG.Fac.zoneOf(p)];
      return { ok: false, msg: '「' + SG.Data.label(p) + '」属于' + (zn ? zn.name : '其他分区') + '，只能摆在该分区的设施里' };
    }
    return { ok: true };
  }

  /* ---------- 上货/下货（设施维度） ---------- */
  function shelfUp(pid, qty, fid, state) {
    var f = facById(fid, state);
    if (!f) return { ok: false, msg: '找不到这个设施' };
    var p = SG.Data.product(pid);
    var have = state.inventory[pid] || 0;
    qty = qty == null ? have : Math.min(qty, have);
    if (qty < 1) return { ok: false, msg: '仓库里没有「' + SG.Data.label(p) + '」，先补货吧' };
    var chk = canPlace(p, f, state);
    if (!chk.ok) return chk;
    var space = facCap(f) - facUsed(f);
    var need = sizePoints(p) * qty;
    if (need > space) {
      var maxN = Math.floor(space / sizePoints(p));
      return { ok: false, msg: '设施容量不足：最多还能放 ' + maxN + ' 件' + (p.size === 'l' ? '（大件）' : '') };
    }
    state.inventory[pid] -= qty;
    if (state.inventory[pid] <= 0.0001) delete state.inventory[pid];
    f.items[pid] = (f.items[pid] || 0) + qty;
    rebuildShelf(state);
    SG.Player.log(state, '上货：' + SG.Data.label(p) + ' ×' + qty + ' 摆进了' + F().TYPES[f.type].name + '。');
    SG.State.save();
    return { ok: true, msg: '上货 ' + SG.Data.label(p) + ' ×' + qty + ' → ' + F().TYPES[f.type].name, minutes: Math.max(1, Math.ceil((qty || 10) / 10)) };
  }
  function shelfDown(pid, qty, fid, state) {
    var f = facById(fid, state);
    if (!f) return { ok: false, msg: '找不到这个设施' };
    var have = f.items[pid] || 0;
    qty = qty == null ? have : Math.min(qty, have);
    if (qty < 1) return { ok: false, msg: '这个设施里没有「' + SG.Data.label(SG.Data.product(pid)) + '」' };
    f.items[pid] -= qty;
    if (f.items[pid] <= 0.0001) delete f.items[pid];
    state.inventory[pid] = (state.inventory[pid] || 0) + qty;
    rebuildShelf(state);
    SG.Player.log(state, '下架：' + SG.Data.label(SG.Data.product(pid)) + ' ×' + qty + ' 收回了仓库。');
    SG.State.save();
    return { ok: true, msg: '下架 ' + SG.Data.label(SG.Data.product(pid)) + ' ×' + qty, minutes: 1 };
  }
  /* 攻打/损耗：从任意设施扣减并同步聚合货架 */
  function shelfTake(pid, qty, state) {
    var fs = facilities(state), got = 0;
    for (var z in fs) {
      for (var fid in fs[z]) {
        if (got >= qty) break;
        var f = fs[z][fid], cur = f.items[pid] || 0;
        var d = Math.min(cur, qty - got);
        if (d > 0) { f.items[pid] -= d; if (f.items[pid] <= 0.0001) delete f.items[pid]; got += d; }
      }
      if (got >= qty) break;
    }
    if (got) rebuildShelf(state);
    return got;
  }
  /* 聚合货架视图（顾客购买/统计/类型统计统一走这里） */
  function rebuildShelf(state) {
    var shelf = {};
    var fs = state.store.facilities;
    if (fs) {
      for (var z in fs) {
        for (var fid in fs[z]) {
          var it = fs[z][fid].items;
          for (var pid in it) shelf[pid] = (shelf[pid] || 0) + it[pid];
        }
      }
    }
    state.shelf = shelf;
  }

  /* 关东煮制作：1 包家乐汤底 + 任意 2 种食材 → 3 串现煮关东煮（放进关东煮锅）
     关东煮不是独立商品：食材（萝卜/鱼丸/海带结/豆腐）各自独立进货 */
  function makeOden(state) {
    var soup = 'in26', ings = ['in27', 'in28', 'in29', 'in30'];
    if ((state.inventory[soup] || 0) < 1) return { ok: false, msg: '缺少关东煮汤底（家乐关东煮风味汤底）' };
    var avail = ings.filter(function (id) { return (state.inventory[id] || 0) >= 1; });
    if (avail.length < 2) return { ok: false, msg: '食材不足：至少需要 2 种关东煮食材（安井萝卜/鱼丸、阿一波海带结、祖名豆腐）' };
    var pot = null;
    var fs = facilities(state);
    for (var z in fs) { for (var fid in fs[z]) { if (fs[z][fid].type === 'pot') { pot = fs[z][fid]; break; } } if (pot) break; }
    if (!pot) return { ok: false, msg: '没有关东煮锅（二级便利店解锁）' };
    if (facCap(pot) - facUsed(pot) < 3) return { ok: false, msg: '关东煮锅容量不足：至少需要空出 3 点' };
    var used2 = avail.slice(0, 2);
    state.inventory[soup] -= 1;
    if (state.inventory[soup] <= 0.0001) delete state.inventory[soup];
    used2.forEach(function (id) { state.inventory[id] -= 1; if (state.inventory[id] <= 0.0001) delete state.inventory[id]; });
    state.inventory['in22'] = (state.inventory['in22'] || 0) + 3;
    var r = shelfUp('in22', 3, pot.id, state);
    var ingTxt = used2.map(function (id) { return SG.Data.label(SG.Data.product(id)); }).join('、');
    SG.Player.log(state, '制作关东煮：1 包家乐汤底 + ' + ingTxt + '，煮出 3 串现煮关东煮。', '');
    SG.State.save();
    return { ok: true, msg: '关东煮煮好了：3 串现煮关东煮已放进关东煮锅（' + ingTxt + '）', minutes: 10 };
  }

  /* 上货备选设施：某商品在当前等级下可放入哪些设施（界面“一键放到合适设施”用） */
  function suitableFacs(pid, state) {
    var p = SG.Data.product(pid);
    if (!p) return [];
    var out = [];
    zoneList(state).forEach(function (z) {
      z.facs.forEach(function (f) {
        var chk = canPlace(p, f, state);
        if (chk.ok && facCap(f) - facUsed(f) >= sizePoints(p)) out.push(f);
      });
    });
    return out;
  }

  /* 一键上货：把仓库里所有能上架的商品自动摆到合适设施（按商品种类逐个摆，容量够为止）。
     返回 {placed: pid->qty, skipped: [{pid, qty, reason}]} */
  function autoShelfUp(state) {
    var placed = {}, skipped = [];
    /* 按仓库清单遍历（stockedList 已按 cat 排序） */
    SG.Inv.stockedList(state).forEach(function (row) {
      if (row.expired) return;
      var pid = row.p.id, p = row.p, qty = row.qty;
      /* 循环往合适设施里塞，直到塞完或没地方 */
      var left = qty;
      var guard = 0;
      while (left > 0.001 && guard < 50) {
        guard++;
        var facs = suitableFacs(pid, state);
        if (!facs.length) {
          if (!placed[pid]) {
            var reason = SG.Data.canStock(p, state) ? '没有合适设施或容量已满' : '当前等级不可陈列';
            skipped.push({ pid: pid, qty: left, reason: reason });
          }
          break;
        }
        var f = facs[0];
        var space = facCap(f) - facUsed(f);
        var sp = sizePoints(p);
        var maxN = Math.floor(space / sp);
        if (maxN < 1) break;
        var put = Math.min(left, maxN);
        f.items[pid] = (f.items[pid] || 0) + put;
        state.inventory[pid] -= put;
        if (state.inventory[pid] <= 0.0001) delete state.inventory[pid];
        placed[pid] = (placed[pid] || 0) + put;
        left -= put;
      }
    });
    rebuildShelf(state);
    var placedCount = 0; for (var k in placed) placedCount += placed[k];
    return { placed: placed, placedCount: placedCount, kinds: Object.keys(placed).length, skipped: skipped };
  }

  return {
    storOf: storOf, sizeOf: sizeOf, sizePoints: sizePoints, zoneOf: DATA.facility.zoneOf,
    planFor: planFor, buildFor: buildFor, applyPlan: applyPlan, ensure: ensure,
    facilities: facilities, zoneList: zoneList, facById: facById,
    facCap: facCap, facUsed: facUsed, canPlace: canPlace,
    shelfUp: shelfUp, shelfDown: shelfDown, shelfTake: shelfTake, rebuildShelf: rebuildShelf,
    suitableFacs: suitableFacs, makeOden: makeOden, autoShelfUp: autoShelfUp
  };
})();

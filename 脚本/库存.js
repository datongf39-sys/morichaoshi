/* ============================================================
   脚本 / 库存 —— 进货、售卖、过期、清理
   ============================================================ */
window.SG = window.SG || {};
SG.Inv = (function () {
  function cap(state) {
    var base = DATA.config.INVENTORY_CAP;
    if (state.store.areas.warehouse) base += DATA.config.WAREHOUSE_BONUS;
    return base;
  }
  function used(state) {
    var t = 0;
    for (var k in state.inventory) t += state.inventory[k];
    return t;
  }
  function has(pid, qty, state) { return (state.inventory[pid] || 0) >= (qty || 1); }
  function take(pid, qty, state) {
    qty = qty || 1;
    var cur = state.inventory[pid] || 0;
    if (cur < qty) return false;
    state.inventory[pid] = cur - qty;
    if (state.inventory[pid] <= 0.0001) delete state.inventory[pid];
    return true;
  }
  function add(pid, qty, state) {
    var p = SG.Data.product(pid);
    if (!p) return { ok: false, msg: '没有该商品' };
    var space = cap(state) - used(state);
    if (space < qty) return { ok: false, msg: '仓库已满，需扩建仓库' };
    state.inventory[pid] = (state.inventory[pid] || 0) + qty;
    if (p.shelf) state.stockDay[pid] = state.day;   // 生鲜保质期从最近一次补货起算
    return { ok: true };
  }
  function isExpired(pid, state) {
    var p = SG.Data.product(pid);
    return p ? p.expired(state) : false;
  }
  function stockedList(state) {
    var arr = [];
    for (var pid in state.inventory) {
      var p = SG.Data.product(pid);
      if (!p) continue;
      arr.push({ p: p, qty: state.inventory[pid], expired: isExpired(pid, state) });
    }
    return arr.sort(function (a, b) { return (a.p.cat < b.p.cat ? -1 : 1); });
  }
  function cleanExpired(state) {
    var removed = 0;
    for (var pid in state.inventory) {
      if (isExpired(pid, state)) {
        removed += state.inventory[pid];
        delete state.inventory[pid];
        delete state.stockDay[pid];
      }
    }
    for (var pid2 in state.shelf) {
      if (isExpired(pid2, state)) {
        removed += state.shelf[pid2];
        delete state.shelf[pid2];
      }
    }
    return removed;
  }
  /* 已上架/在库的不同商品种类数（升级条件：货架 + 仓库去重） */
  function typesStocked(state) {
    var n = 0, seen = {};
    for (var pid in state.shelf) {
      var p = SG.Data.product(pid);
      if (p && !isExpired(pid, state) && !seen[pid]) { seen[pid] = 1; n++; }
    }
    for (var pid2 in state.inventory) {
      var p2 = SG.Data.product(pid2);
      if (p2 && !isExpired(pid2, state) && !seen[pid2]) { seen[pid2] = 1; n++; }
    }
    return n;
  }

  /* ---------- 货架（设施维度上货，由 SG.Fac 执行；此处保持聚合视图兼容） ---------- */
  /* 上架：facId 缺省时自动选第一个合适设施（旧接口兼容） */
  function shelfUp(pid, qty, facId, state) {
    if (state === undefined && facId && facId.store) { state = facId; facId = null; }
    if (!facId) {
      var facs = SG.Fac.suitableFacs(pid, state);
      if (!facs.length) {
        var p = SG.Data.product(pid);
        var chk = SG.Data.canStock(p, state) ? SG.Fac.canPlace(p, { type: 'shelf', zone: 'main' }, state) : { ok: false, msg: '当前超市等级不能陈列（需 ' + (p ? p.lv : '?') + ' 级），仅可自用' };
        return { ok: false, msg: chk.ok ? '没有可摆放的设施' : chk.msg };
      }
      facId = facs[0].id;
    }
    return SG.Fac.shelfUp(pid, qty, facId, state);
  }
  /* 下架：facId 缺省时从第一个有该商品的设施下架 */
  function shelfDown(pid, qty, facId, state) {
    if (state === undefined && facId && facId.store) { state = facId; facId = null; }
    if (!facId) {
      var fs = SG.Fac.facilities(state), found = null;
      for (var z in fs) {
        for (var fid in fs[z]) {
          if ((fs[z][fid].items[pid] || 0) > 0) { found = fid; break; }
        }
        if (found) break;
      }
      if (!found) return { ok: false, msg: '货架上没有「' + SG.Data.label(pid) + '」' };
      facId = found;
    }
    return SG.Fac.shelfDown(pid, qty, facId, state);
  }
  /* 攻打/损耗扣减（同步设施） */
  function shelfTake(pid, qty, state) { return SG.Fac.shelfTake(pid, qty, state); }
  function shelfList(state) {
    var arr = [];
    for (var pid in state.shelf) {
      var p = SG.Data.product(pid);
      if (!p) continue;
      arr.push({ p: p, qty: state.shelf[pid], expired: isExpired(pid, state) });
    }
    return arr.sort(function (a, b) { return (a.p.cat < b.p.cat ? -1 : 1); });
  }
  /* 货架上在售商品（未过期） */
  function availableOnShelf(state) {
    var list = [];
    for (var pid in state.shelf) {
      var p = SG.Data.product(pid);
      if (!p || isExpired(pid, state)) continue;
      list.push(p);
    }
    return list;
  }
  /* 售卖（顾客从货架购买） */
  function sellFromShelf(pid, qty, state) {
    var p = SG.Data.product(pid);
    if (!p) return 0;
    qty = Math.min(qty, state.shelf[pid] || 0);
    if (qty <= 0) return 0;
    state.shelf[pid] -= qty;
    if (state.shelf[pid] <= 0.0001) delete state.shelf[pid];
    var income = Math.round(p.price * qty * 100) / 100;
    state.points += income;
    state.cumPoints += income;
    state.dayIncome = (state.dayIncome || 0) + income;
    return income;
  }
  /* 售卖（顾客/餐厅共用）：返回实际售出与金额 */
  function sell(pid, qty, state) {
    var p = SG.Data.product(pid);
    if (!p) return 0;
    qty = Math.min(qty, state.inventory[pid] || 0);
    if (qty <= 0) return 0;
    state.inventory[pid] -= qty;
    if (state.inventory[pid] <= 0.0001) delete state.inventory[pid];
    var income = Math.round(p.price * qty * 100) / 100;
    state.points += income;
    state.cumPoints += income;
    state.dayIncome = (state.dayIncome || 0) + income;
    return income;
  }
  function totalStockValue(state) {
    var t = 0;
    for (var pid in state.inventory) {
      var p = SG.Data.product(pid);
      if (p && !isExpired(pid, state)) t += p.price * state.inventory[pid];
    }
    return Math.round(t);
  }
  function availableForSale(state) {
    var list = [];
    for (var pid in state.inventory) {
      var p = SG.Data.product(pid);
      if (!p || isExpired(pid, state)) continue;
      list.push(p);
    }
    return list;
  }

  return {
    cap: cap, used: used, has: has, take: take, add: add, isExpired: isExpired,
    stockedList: stockedList, cleanExpired: cleanExpired, typesStocked: typesStocked,
    sell: sell, totalStockValue: totalStockValue, availableForSale: availableForSale,
    shelfUp: shelfUp, shelfDown: shelfDown, shelfList: shelfList, shelfTake: shelfTake,
    availableOnShelf: availableOnShelf, sellFromShelf: sellFromShelf
  };
})();

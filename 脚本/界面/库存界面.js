/* ============================================================
   脚本 / 界面 / 库存界面 —— 仓库、设施上货（货架/冷藏柜/冷冻柜/烤肠机/关东煮/热食柜）、
   分区（三级起）、过期清理、拼夕夕进货
   顾客只买已摆上设施的商品：补货 → 手动上货到设施 → 接待。
   ============================================================ */
window.SG = window.SG || {};
SG.Screens.inv = function (body, state) {
  var cfg = DATA.config;
  var filter = SG.UI._invFilter || 'all';
  var h = '';

  /* 容量条 */
  var used = SG.Inv.used(state), cap = SG.Inv.cap(state);
  h += '<div class="panel"><h3>仓库</h3><div class="stat-item"><span class="lab">容量</span>' +
    '<div class="bar"><div class="fill c6" style="width:' + Math.min(100, used / cap * 100) + '%"></div></div>' +
    '<span class="val">' + SG.u.money(used) + '/' + cap + '</span></div>';
  var expiredCount = SG.Inv.stockedList(state).filter(function (x) { return x.expired; }).length;
  h += '<div class="mt" style="display:flex;gap:8px;flex-wrap:wrap">' +
    SG.UI.btn('一键补货（今日品类按预算扫货）', 'UI.oneClickRestock', [], 'primary') +
    SG.UI.btn('一键上货（仓库→货架）', 'UI.autoShelfUp', [], 'primary') +
    (expiredCount ? SG.UI.btn('清理过期商品（' + expiredCount + ' 种）', 'UI.cleanExpired', [], 'warn') : '') +
    '</div>';
  h += '<div class="small muted mt">进货渠道：拼夕夕系统（进货价 = 售价 2 折）与变废为宝探索。补完货记得「上货」——把商品摆进货架/冷藏柜等设施，顾客才会买。</div></div>';

  /* 设施布局（分区 / 未分区） */
  var zoneArr = SG.Fac.zoneList(state);
  var lv = state.store.level;
  h += '<div class="panel"><div class="cols"><h3>店内设施</h3>' +
    '<div class="small muted">' + (lv < 3 ? '未分区 · 多个货架与冷柜' : '三级超市起分区 · 分区内的商品只能摆在该分区设施') +
    ' · ' + SG.Decor.brief(state) + '</div></div>';
  h += '<div class="small muted mt">' + SG.Decor.scene(state) + '</div>';
  h += '<div class="zone-grid">';
  zoneArr.forEach(function (z) {
    var zn = (lv < 3) ? '店内' : ((DATA.facility.ZONES[z.id] || {}).name || z.id);
    var zd = (lv < 3) ? '' : ((DATA.facility.ZONES[z.id] || {}).desc || '');
    h += '<div class="zone-card"><div class="area-name">' + zn + '</div>' +
      (zd ? '<div class="small muted">' + zd + '</div>' : '');
    z.facs.forEach(function (f) {
      var tp = DATA.facility.TYPES[f.type];
      var fu = SG.Fac.facUsed(f), fc = SG.Fac.facCap(f);
      var items = [];
      for (var pid in f.items) {
        var p = SG.Data.product(pid);
        if (!p) continue;
        items.push({ pid: pid, p: p, qty: f.items[pid], expired: SG.Inv.isExpired(pid, state) });
      }
      items.sort(function (a, b) { return (a.p.cat < b.p.cat ? -1 : 1); });
      h += '<div class="fac-card">';
      h += '<div class="fac-head"><b>' + tp.name + '</b><span class="chip">' + tp.size + '</span>' +
        '<div class="small muted">容量 ' + fu + '/' + fc + ' 点（大件占 2 点）</div></div>';
      h += '<div class="stat-item"><div class="bar"><div class="fill c3" style="width:' + Math.min(100, fu / fc * 100) + '%"></div></div></div>';
      if (!items.length) {
        h += '<div class="small muted">空着。' + tp.note + '</div>';
      } else {
        h += '<div class="fac-items">';
        items.forEach(function (it) {
          h += '<div class="fac-row' + (it.expired ? ' expired' : '') + '"><div><b>' + SG.Data.label(it.p) + '</b> ×' + it.qty +
            (it.expired ? ' <span class="chip bad">已过期</span>' : '') +
            '<span class="small muted"> ' + (it.p.size === 'l' ? '大件' : '小件') + '</span></div>';
          if (!it.expired) {
            h += '<div style="display:flex;gap:6px">' +
              SG.UI.btn('下架 5', 'UI.shelfDown', [it.pid, 5, f.id], 'sm') +
              SG.UI.btn('全下', 'UI.shelfDown', [it.pid, 0, f.id], 'sm') + '</div>';
          }
          h += '</div>';
        });
        h += '</div>';
      }
      h += '<div class="mt" style="display:flex;gap:8px;flex-wrap:wrap">' +
        SG.UI.btn('上货', 'UI.shelfUpModal', [f.id], 'sm primary') +
        (f.type === 'pot' ? SG.UI.btn('制作关东煮', 'UI.odenModal', [f.id], 'sm warn') : '') +
        '</div>';
      h += '</div>';
    });
    h += '</div>';
  });
  h += '</div></div>';

  /* 拼夕夕今日品类（购买渠道：只进货到仓库，上货请去下方店内设施区操作） */
  var pdd = SG.Gf.pddItems(state);
  h += '<div class="panel"><h3>拼夕夕今日品类（' + pdd.length + ' 种 · 进货价 = 售价 2 折）</h3>';
  h += '<div class="small muted mb">拼夕夕只负责下单送货，买完进仓库；上架请到下方「店内设施」选对应设施点「上货」。</div>';
  h += '<div class="pdd-grid">';
  pdd.forEach(function (p) {
    var inStock = (state.inventory[p.id] || 0) > 0;
    var onShelf = (state.shelf[p.id] || 0) > 0;
    var canSell = SG.Data.canStock(p, state);
    h += '<div class="pdd-chip"><div><b>' + SG.Data.label(p) + '</b> <span class="chip">' + p.cat + '</span>' +
      (onShelf ? ' <span class="chip ok">已上货</span>' : (inStock ? ' <span class="chip">仓库有货</span>' : '')) + '</div>' +
      '<div class="small muted">售价 ' + SG.u.money(p.price) + ' · 进货 ' + SG.u.money(Math.round(p.price * DATA.golden.pddRate * 100) / 100) + '</div>' +
      (p.stor ? '<div class="small muted">需存放：' + DATA.facility.TYPES[p.stor].name + '</div>' : '') +
      (!canSell ? '<div class="small warn">当前等级不可陈列，仅可自用/员工使用</div>' : '') +
      '<div style="display:flex;gap:6px;flex-wrap:wrap">' +
      SG.UI.btn('补 20', 'UI.restockItem', [p.id, 20], 'sm') +
      SG.UI.btn('补 50', 'UI.restockItem', [p.id, 50], 'sm') +
      SG.UI.btn('补 100', 'UI.restockItem', [p.id, 100], 'sm primary') +
      '</div></div>';
  });
  h += '</div></div>';

  /* 分类筛选（仓库） */
  h += '<div class="panel"><h3>仓库明细</h3><div class="chip-row">';
  h += '<button class="chip-btn' + (filter === 'all' ? ' on' : '') + '" data-act="UI.setInvFilter" data-args=' + SG.UI.attJson(['all']) + '>全部</button>';
  SG.Data.catOrder.forEach(function (c) {
    var has = SG.Inv.stockedList(state).some(function (x) { return x.p.cat === c; });
    if (!has) return;
    h += '<button class="chip-btn' + (filter === c ? ' on' : '') + '" data-act="UI.setInvFilter" data-args=' + SG.UI.attJson([c]) + '>' + c + '</button>';
  });
  h += '</div><div class="inv-table">';
  var list = SG.Inv.stockedList(state).filter(function (x) { return filter === 'all' || x.p.cat === filter; });
  if (!list.length) h += '<div class="muted">仓库空空如也。末日里，货架就是安全感。</div>';
  list.forEach(function (x) {
    var p = x.p;
    var inPdd = state.gf.pddItems.indexOf(p.id) >= 0;
    var shelfTxt = p.shelf ? ('保质 ' + p.shelf + ' 天') : '';
    var canSell = SG.Data.canStock(p, state);
    h += '<div class="inv-row' + (x.expired ? ' expired' : '') + '">';
    h += '<div><b>' + SG.Data.label(p) + '</b> <span class="chip">' + p.cat + '</span>' +
      (x.expired ? ' <span class="chip bad">已过期</span>' : '') +
      '<div class="small muted">售价 ' + SG.u.money(p.price) + ' · 库存 ' + SG.u.money(x.qty) + (shelfTxt ? ' · ' + shelfTxt : '') +
      (p.stor ? ' · 需存放 ' + DATA.facility.TYPES[p.stor].name : ' · 常温') +
      (p.size === 'l' ? ' · 大件' : '') +
      (!canSell ? ' · <span class="warn">不可陈列（仅自用）</span>' : '') +
      '</div></div>';
    if (!x.expired) {
      h += '<div style="display:flex;gap:6px;flex-wrap:wrap">' +
        (inPdd ? SG.UI.btn('补 20', 'UI.restockItem', [p.id, 20], 'sm') + SG.UI.btn('补 50', 'UI.restockItem', [p.id, 50], 'sm') : '') +
        SG.UI.btn('上货', 'UI.shelfUpAny', [p.id], 'sm primary') +
        SG.UI.btn('下架', 'UI.shelfDownAny', [p.id], 'sm') + '</div>';
    }
    h += '</div>';
  });
  h += '</div></div>';

  body.innerHTML = h;
};

/* ---------- 行动 ---------- */
SG.UI.setInvFilter = function (f) { SG.UI._invFilter = f; SG.UI.refresh(); };
SG.A.restockItem = function (pid, qty) {
  var state = SG.State.getState();
  return SG.Gf.restock(pid, qty || 10, state);
};
SG.A.oneClickRestock = function () {
  var state = SG.State.getState();
  return SG.Gf.oneClickRestock(state);
};
SG.A.cleanExpired = function () {
  var state = SG.State.getState();
  var n = SG.Inv.cleanExpired(state);
  SG.Player.log(state, '清理了过期商品，共 ' + n + ' 件。');
  SG.State.save();
  return { ok: true, msg: '清理完成，共 ' + n + ' 件过期商品。' };
};
SG.A.autoShelfUp = function () {
  var state = SG.State.getState();
  var r = SG.Fac.autoShelfUp(state);
  if (!r.placedCount) {
    var hint = r.skipped.length ? '：' + r.skipped.slice(0, 3).map(function (s) {
      return SG.Data.label(SG.Data.product(s.pid)) + '（' + s.reason + '）';
    }).join('、') : '仓库里没有能上架的商品';
    return { ok: false, msg: '没有可上架的商品' + hint };
  }
  SG.Player.log(state, '一键上货：' + r.kinds + ' 种商品共 ' + r.placedCount + ' 件摆上货架。');
  if (r.skipped.length) {
    SG.Player.log(state, '以下商品未能上架：' + r.skipped.slice(0, 5).map(function (s) {
      return SG.Data.label(SG.Data.product(s.pid)) + '×' + Math.round(s.qty) + '（' + s.reason + '）';
    }).join('、'), 'warn');
  }
  SG.State.save();
  return { ok: true, msg: '一键上货完成：' + r.kinds + ' 种 ' + r.placedCount + ' 件' + (r.skipped.length ? '（' + r.skipped.length + ' 种未上架，见日志）' : ''), minutes: Math.min(20, r.kinds * 2) };
};
SG.A.shelfUp = function (pid, qty, facId) {
  var state = SG.State.getState();
  return SG.Inv.shelfUp(pid, qty || 0, facId, state);
};
SG.A.shelfDown = function (pid, qty, facId) {
  var state = SG.State.getState();
  return SG.Inv.shelfDown(pid, qty || 0, facId, state);
};

/* ---------- 上货弹窗（选商品 + 数量，确认走二次确认并标注耗时） ---------- */
SG.UI.shelfUpModal = function (facId) {
  var state = SG.State.getState();
  var f = SG.Fac.facById(facId, state);
  if (!f) return SG.UI.toast('找不到这个设施', 'warn');
  var tp = DATA.facility.TYPES[f.type];
  var fu = SG.Fac.facUsed(f), fc = SG.Fac.facCap(f);
  var cands = SG.Inv.stockedList(state).filter(function (x) {
    return !x.expired && x.qty > 0 && SG.Fac.canPlace(x.p, f, state).ok;
  });
  var h = '<div class="m-body"><div class="small muted">' + tp.name + '（' + tp.note + '）· 剩余容量 ' + (fc - fu) + ' 点</div>';
  if (!cands.length) {
    var stockP = SG.Inv.stockedList(state).filter(function (x) { return !x.expired && x.qty > 0; });
    h += '<div class="muted mt">仓库里没有能放进这里的商品。</div>';
    if (stockP.length) {
      h += '<div class="small muted mt">提示：' + stockP.slice(0, 3).map(function (x) {
        var c = SG.Fac.canPlace(x.p, f, state);
        return '「' + SG.Data.label(x.p) + '」' + (c.ok ? '' : c.msg);
      }).join('；') + '</div>';
    }
  } else {
    h += '<div class="mt inv-table">';
    cands.forEach(function (x) {
      var p = x.p;
      h += '<div class="inv-row"><div><b>' + SG.Data.label(p) + '</b> <span class="chip">' + p.cat + '</span>' +
        '<div class="small muted">仓库 ' + SG.u.money(x.qty) + ' 件 · ' + (p.size === 'l' ? '大件（占 2 点）' : '小件（占 1 点）') + '</div></div>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap">' +
        SG.UI.btn('上 1', 'UI.shelfUp', [p.id, 1, facId], 'sm') +
        SG.UI.btn('上 5', 'UI.shelfUp', [p.id, 5, facId], 'sm') +
        SG.UI.btn('上 10', 'UI.shelfUp', [p.id, 10, facId], 'sm') +
        SG.UI.btn('全上', 'UI.shelfUp', [p.id, 0, facId], 'sm primary') +
        '</div></div>';
    });
    h += '</div>';
  }
  h += '<div class="m-foot">' + SG.UI.btn('关闭', 'UI.closeModal', [], 'ghost') + '</div></div>';
  SG.UI.modal(h, true);
};

/* 自动选合适设施上货（拼夕夕/仓库明细的“上货”按钮） */
SG.UI.shelfUpAny = function (pid) {
  var state = SG.State.getState();
  var facs = SG.Fac.suitableFacs(pid, state);
  if (!facs.length) {
    var p = SG.Data.product(pid);
    var c = SG.Data.canStock(p, state) ? { ok: false, msg: '没有可摆放的设施（可能容量已满）' } : { ok: false, msg: '当前等级不可陈列，仅可自用或给员工使用' };
    SG.UI.toast(c.msg, 'warn');
    return;
  }
  SG.UI.shelfUpModal(facs[0].id);
};
/* 从任意设施下架（仓库明细的“下架”按钮） */
SG.UI.shelfDownAny = function (pid) {
  var state = SG.State.getState();
  return SG.Inv.shelfDown(pid, 0, null, state);
};

/* ---------- 关东煮制作 ---------- */
SG.A.makeOden = function () {
  var state = SG.State.getState();
  return SG.Fac.makeOden(state);
};
SG.UI.odenModal = function (facId) {
  var state = SG.State.getState();
  var ids = ['in26', 'in27', 'in28', 'in29', 'in30'];
  var h = '<div class="m-body"><div class="small muted">关东煮不是独立商品——把家乐汤底和独立的食材（萝卜/鱼丸/海带结/豆腐）放进关东煮锅现煮，每 1 包汤底 + 任意 2 种食材煮出 3 串。</div>';
  h += '<div class="mt inv-table">';
  ids.forEach(function (id) {
    var p = SG.Data.product(id);
    if (!p) return;
    var qty = state.inventory[id] || 0;
    h += '<div class="inv-row"><div><b>' + SG.Data.label(p) + '</b><div class="small muted">仓库 ' + qty + (p.stor ? ' · 需存放 ' + DATA.facility.TYPES[p.stor].name : '') + '</div></div></div>';
  });
  h += '</div>';
  h += '<div class="m-foot">' + SG.UI.btn('开始制作（10 分钟）', 'UI.makeOden', [], 'primary') +
    SG.UI.btn('关闭', 'UI.closeModal', [], 'ghost') + '</div></div>';
  SG.UI.modal(h, true);
};

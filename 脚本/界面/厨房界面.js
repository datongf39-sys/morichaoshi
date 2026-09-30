/* ============================================================
   脚本 / 界面 / 厨房界面 —— 烹饪搜索、菜谱卡片、锅具升级
   ============================================================ */
window.SG = window.SG || {};
SG.Screens.cook = function (body, state) {
  var cfg = DATA.config;
  var kw = (SG.UI._cookKw || '').trim();
  var h = '';

  if (!SG.Cook.hasKitchen(state)) {
    h += '<div class="panel">';
    if (state.created.cook) {
      h += '<h3>小厨房</h3><p class="muted">你会做饭。解锁小厨房后，就能自己开火——耗时更长，但更省积分、更合口味。</p>' +
        SG.UI.btn('解锁小厨房（600 积分）', 'UI.unlockKitchen', [], 'primary');
    } else {
      h += '<h3>小厨房</h3><p class="muted">你不会做饭，小厨房对你没有意义。当初要是学一手就好了。</p>';
    }
    h += '</div>';
    body.innerHTML = h;
    return;
  }

  h += '<div class="panel"><h3>小厨房</h3>' +
    '<div class="field"><label>搜索菜品（名称或菜系）</label><input id="cook-kw" type="text" value="' + SG.u.esc(kw) + '" placeholder="如：番茄炒蛋 / 川菜…"></div>' +
    '<div class="small muted mt">说明：速食 5 分钟搞定，自己做菜更久但更省。缺少食材时「烹饪」按钮会置灰。</div></div>';

  /* 厨具 */
  h += '<div class="panel"><h3>厨具与设备</h3><div class="chip-row">';
  SG.Cook.toolsOwned(state).forEach(function (t) {
    var tool = SG.Data.tool(t);
    if (tool) h += '<span class="chip ok">' + tool.name + '</span>';
  });
  h += '</div><div class="mt">';
  for (var tid in cfg.KITCHEN.tools) {
    var t = cfg.KITCHEN.tools[tid];
    if (t.base || state.store.kitchenUpgrades[tid]) continue;
    h += '<div class="cond-row"><span class="mark">·</span>' + t.name + '：' + t.desc + ' ' +
      SG.UI.btn('购置（' + SG.u.money(t.cost) + '）', 'UI.buyKitchenTool', [tid], 'sm') + '</div>';
  }
  h += '</div></div>';

  /* 菜谱 */
  var dishes = SG.Cook.search(kw);
  h += '<div class="panel"><h3>菜谱 <span class="chip">' + dishes.length + ' 道</span></h3><div class="dish-grid">';
  if (!dishes.length) {
    h += '<div class="muted">该餐品暂时还做不了哦～</div>';
  }
  dishes.forEach(function (d) {
    var missIng = SG.Cook.missingIngredients(d, state);
    var missTool = SG.Cook.missingTools(d, state);
    var can = missIng.length === 0 && missTool.length === 0;
    var nutTxt = '碳水' + (d.nut.carb || 0) + 'g 蛋白' + (d.nut.prot || 0) + 'g 脂肪' + (d.nut.fat || 0) + 'g 维' + (d.nut.vit || 0) + 'g';
    h += '<div class="dish-card' + (can ? '' : ' dim') + '">';
    h += '<div class="dish-name">' + d.name + ' <span class="chip">' + d.cuisine + '</span></div>';
    h += '<div class="small muted">耗时 ' + d.time + ' 分钟 · 饱食+' + (d.eff.sat || 0) + ' · ' + nutTxt + '</div>';
    h += '<div class="small muted">厨具：' + d.tools.map(function (t) { return SG.Data.tool(t).name; }).join('、') +
      (missTool.length ? ' <span class="warn">（缺 ' + missTool.map(function (t) { return SG.Data.tool(t).name; }).join('、') + '）</span>' : '') + '</div>';
    var ings = [];
    for (var pid in d.ing) {
      var p = SG.Data.product(pid);
      var have = state.inventory[pid] || 0;
      var ok = have >= d.ing[pid];
      ings.push((p ? SG.Data.label(p) : pid) + '×' + SG.u.money(d.ing[pid]) + (ok ? '' : ' <span class="warn">(缺)</span>'));
    }
    h += '<div class="small muted">食材：' + ings.join('、') + '</div>';
    h += '<div class="mt">' +
      (can ? SG.UI.btn('烹饪', 'UI.cookDish', [d.id], 'sm primary') : SG.UI.btn('烹饪', 'UI.cookDish', [d.id], 'sm')) +
      '</div></div>';
  });
  h += '</div></div>';

  /* 做好的菜 */
  var cooked = SG.Cook.cookedList(state);
  if (cooked.length) {
    h += '<div class="panel"><h3>做好的餐点</h3><div class="order-list">';
    cooked.forEach(function (c) {
      h += '<div class="order-row"><div><b>' + c.dish.name + '</b> <span class="chip">库存 ' + c.qty + ' 份</span></div>' +
        SG.UI.btn('吃一份', 'UI.eatCookedDish', [c.dish.id], 'sm primary') + '</div>';
    });
    h += '</div></div>';
  }

  body.innerHTML = h;
  var inp = document.getElementById('cook-kw');
  if (inp) inp.addEventListener('input', function () { SG.UI._cookKw = inp.value; SG.UI.refresh(); });
};

/* ---------- 行动 ---------- */
SG.A.unlockKitchen = function () {
  var state = SG.State.getState();
  return SG.Store.unlockArea('kitchen', state);
};
SG.A.buyKitchenTool = function (toolId) {
  var state = SG.State.getState();
  return SG.Cook.buyKitchenUpgrade(toolId, state);
};
SG.A.cookDish = function (dishId) {
  var state = SG.State.getState();
  return SG.Cook.cook(dishId, state);
};

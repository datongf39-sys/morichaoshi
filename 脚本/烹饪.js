/* ============================================================
   脚本 / 烹饪 —— 小厨房、搜索、可做判定、厨具升级
   搜索到餐品：有对应物资时「烹饪」按钮亮起可点；
   缺少物资时按钮置灰；搜索不到：该餐品暂时还做不了哦～
   ============================================================ */
window.SG = window.SG || {};
SG.Cook = (function () {
  var cfg = function () { return DATA.config; };

  function hasKitchen(state) { return !!state.store.areas.kitchen; }
  function toolsOwned(state) {
    var t = state.store.kitchenTools.slice();
    for (var k in state.store.kitchenUpgrades) {
      if (state.store.kitchenUpgrades[k]) t.push(k);
    }
    return t;
  }
  function missingTools(dish, state) {
    var own = toolsOwned(state);
    return dish.tools.filter(function (t) { return own.indexOf(t) < 0; });
  }
  function missingIngredients(dish, state) {
    var miss = [];
    for (var pid in dish.ing) {
      if (!SG.Inv.has(pid, dish.ing[pid], state)) {
        var p = SG.Data.product(pid);
        miss.push({ pid: pid, need: dish.ing[pid], have: state.inventory[pid] || 0, name: p ? p.name : pid });
      }
    }
    return miss;
  }
  function canCook(dish, state) {
    if (!hasKitchen(state)) return false;
    if (missingTools(dish, state).length) return false;
    return missingIngredients(dish, state).length === 0;
  }
  function cook(dishId, state) {
    var d = SG.Data.dish(dishId);
    if (!d) return { ok: false, msg: '没有这道菜' };
    if (!hasKitchen(state)) return { ok: false, msg: '没有小厨房，无法烹饪' };
    if (missingTools(d, state).length) {
      var t = missingTools(d, state).map(function (x) { return SG.Data.tool(x).name; }).join('、');
      return { ok: false, msg: '缺少厨具：' + t + '（可在厨房界面升级设备）' };
    }
    var miss = missingIngredients(d, state);
    if (miss.length) return { ok: false, msg: '缺少食材：' + miss.map(function (m) { return m.name + '（缺 ' + SG.u.money(m.need - m.have) + ' 件）'; }).join('、') };
    for (var pid in d.ing) SG.Inv.take(pid, d.ing[pid], state);
    state.cooked = state.cooked || {};
    state.cooked[d.id] = (state.cooked[d.id] || 0) + 1;
    state.gf = state.gf || {};
    state.gf.cookCount = (state.gf.cookCount || 0) + 1;
    var time = d.time;
    if (SG.Player.identityOf(state).id === 'chef') time = Math.ceil(time * 0.7);
    state.stamina = SG.u.clamp(state.stamina - 8, 0, 140);
    SG.Player.log(state, '烹饪：做好了「' + d.name + '」（' + d.cuisine + '）。');
    SG.State.save();
    return { ok: true, msg: '「' + d.name + '」做好了，香喷喷的。', minutes: time, sta: -8, dish: d };
  }
  function search(keyword) {
    var kw = (keyword || '').trim().toLowerCase();
    if (!kw) return DATA.dishes;
    return DATA.dishes.filter(function (d) {
      return d.name.toLowerCase().indexOf(kw) >= 0 || d.cuisine.toLowerCase().indexOf(kw) >= 0;
    });
  }
  function buyKitchenUpgrade(toolId, state) {
    var t = cfg().KITCHEN.tools[toolId];
    if (!t || t.base) return { ok: false, msg: '没有这个设备' };
    if (state.store.kitchenUpgrades[toolId]) return { ok: false, msg: '已经拥有了' };
    if (state.points < t.cost) return { ok: false, msg: '积分不足（需要 ' + SG.u.money(t.cost) + '）' };
    state.points -= t.cost;
    state.store.kitchenUpgrades[toolId] = true;
    SG.Player.log(state, '厨房升级：购置了' + t.name + '。' + (t.desc || ''), '');
    SG.State.save();
    return { ok: true, msg: '购置了' + t.name + '。' + (t.desc || '') };
  }
  function cookedList(state) {
    state.cooked = state.cooked || {};
    var arr = [];
    for (var id in state.cooked) {
      if (state.cooked[id] > 0) arr.push({ dish: SG.Data.dish(id), qty: state.cooked[id] });
    }
    return arr;
  }
  function dishIngredientsText(d) {
    var parts = [];
    for (var pid in d.ing) {
      var p = SG.Data.product(pid);
      parts.push((p ? SG.Data.label(p) : pid) + '×' + SG.u.money(d.ing[pid]));
    }
    var tools = d.tools.map(function (t) { return SG.Data.tool(t).name; }).join('、');
    return { ing: parts.join('，'), tools: tools };
  }

  return {
    hasKitchen: hasKitchen, toolsOwned: toolsOwned, missingTools: missingTools,
    missingIngredients: missingIngredients, canCook: canCook, cook: cook,
    search: search, buyKitchenUpgrade: buyKitchenUpgrade, cookedList: cookedList,
    dishIngredientsText: dishIngredientsText
  };
})();

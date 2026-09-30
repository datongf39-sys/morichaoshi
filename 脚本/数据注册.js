/* ============================================================
   脚本 / 数据注册 —— 归一化商品/菜品数据、主题注入
   ============================================================ */
window.SG = window.SG || {};
SG.Data = (function () {
  var productsById = {}, dishesById = {}, catOrder = [], toolsById = {};
  var products = [];

  function normProduct(p) {
    p.nut = p.nut || { carb: 0, prot: 0, fat: 0, vit: 0, water: 0 };
    p.eff = p.eff || { sat: 0, thirst: 0, hp: 0, ent: 0, hyg: 0 };
    if (p.waterNeed == null) p.waterNeed = 0;
    if (p.shelf == null) p.shelf = null;
    p.expired = function (state) {
      if (!p.shelf) return false;
      var d = state.stockDay[p.id];
      if (d == null) return false;
      return state.day - d > p.shelf;
    };
    /* 设施系统派生属性：存储要求 / 大小 / 分区 */
    if (window.SG && SG.Fac) {
      p.stor = SG.Fac.storOf(p);
      p.size = SG.Fac.sizeOf(p);
      p.zone = SG.Fac.zoneOf(p);
    }
    /* 现实规则：一级二级（小卖部/便利店）不贩卖蔬果肉类等生鲜 */
    if (p.kind === 'veg' || p.kind === 'fruit' || p.kind === 'meat' || p.kind === 'aquatic') {
      if (p.lv < 3) p.lv = 3;
    }
    return p;
  }
  function init() {
    DATA.products.forEach(function (p) { products.push(normProduct(p)); productsById[p.id] = p; });
    DATA.dishes.forEach(function (d) { dishesById[d.id] = d; });
    var seen = {};
    products.forEach(function (p) { if (!seen[p.cat]) { seen[p.cat] = 1; catOrder.push(p.cat); } });
    var t = DATA.config.KITCHEN.tools;
    for (var k in t) toolsById[k] = t[k];
  }
  function byCat(cat) { return products.filter(function (p) { return p.cat === cat; }); }
  function pddPool() { return products.map(function (p) { return p.id; }); }
  function wastePool() { return DATA.golden.wastePool; }
  function product(id) { return productsById[id]; }
  function dish(id) { return dishesById[id]; }
  function tool(id) { return toolsById[id]; }
  /* 商品展示名：name 已含品牌前缀时不重复拼接 */
  function label(p) {
    if (!p) return '';
    if (p.name.indexOf(p.brand) === 0) return p.name;
    return p.brand + p.name;
  }

  /* 商店当前等级是否允许陈列该商品（枪械需枪械区） */
  function canStock(p, state) {
    if (!p) return false;
    if (state.store.level < p.lv) return false;
    if (p.kind === 'weapon' && !state.store.areas.arms) return false;
    if (p.kind === 'cloth' && !state.store.areas.cloth) return false;
    return true;
  }

  /* 主题注入：玩家喜欢的颜色 + 风格 */
  function applyTheme(colorId, styleId) {
    var cfg = DATA.config;
    var c = cfg.COLORS.filter(function (x) { return x.id === colorId; })[0] || cfg.COLORS[0];
    var s = cfg.STYLES.filter(function (x) { return x.id === styleId; })[0] || cfg.STYLES[0];
    var pal = c.palette, v = s.v;
    var root = document.documentElement.style;
    root.setProperty('--bg', pal.bg);
    root.setProperty('--panel', pal.panel);
    root.setProperty('--panel2', pal.panel2);
    root.setProperty('--panel3', pal.panel3);
    root.setProperty('--accent', pal.accent);
    root.setProperty('--accent2', pal.accent2);
    root.setProperty('--accent-soft', pal.panel2);
    root.setProperty('--text', pal.text);
    root.setProperty('--muted', pal.muted);
    root.setProperty('--line', pal.line);
    root.setProperty('--radius', (v.radius * 4) + 'px');
    root.setProperty('--border-w', (v.border === 0 ? '0px' : (v.border === 2 ? '2px' : '1px')));
    root.setProperty('--shadow', v.shadow ? '0 6px 24px rgba(90,70,40,.14)' : 'none');
    root.setProperty('--head-font', v.head === 'serif' ? '"Noto Serif SC","Songti SC","SimSun",serif' : '"Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif');
    root.setProperty('--density', String(v.dens));
    document.title = c.name + ' · ' + s.name + ' · 末日超市';
  }

  /* 检查菜品配料 id 是否存在（开发期自检） */
  function checkDishIngredients() {
    var missing = [];
    DATA.dishes.forEach(function (d) {
      for (var pid in d.ing) if (!productsById[pid]) missing.push(d.id + ' -> ' + pid);
      d.tools.forEach(function (t) { if (!toolsById[t]) missing.push(d.id + ' -> tool ' + t); });
    });
    if (missing.length) console.warn('数据注册：缺失引用', missing);
    return missing;
  }

  return {
    init: init, products: products, productsById: productsById, dishesById: dishesById,
    catOrder: catOrder, toolsById: toolsById, byCat: byCat, pddPool: pddPool,
    wastePool: wastePool, product: product, dish: dish, tool: tool, label: label,
    canStock: canStock, applyTheme: applyTheme, checkDishIngredients: checkDishIngredients
  };
})();

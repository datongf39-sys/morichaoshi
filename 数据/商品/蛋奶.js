/* ============================================================
   数据 / 商品 / 蛋奶
   ============================================================ */
window.DATA = window.DATA || {};
DATA.products = DATA.products || [];
DATA.products.push(
  { id: 'eg01', brand: '正大', name: '正大鲜鸡蛋 30枚', cat: '蛋奶', price: 20.0, sv: 30, fx: { raw: true },
    nut: { carb: 1, prot: 6.5, fat: 5, vit: 3, water: 50 }, eff: { sat: 15, thirst: 0, hp: 0, ent: 0, hyg: 0 },
    shelf: 21, lv: 2, kind: 'dairy' },
  { id: 'eg02', brand: '德青源', name: '德青源谷物鸡蛋 15枚', cat: '蛋奶', price: 12.0, sv: 15, fx: { raw: true },
    nut: { carb: 1, prot: 6.5, fat: 5, vit: 3, water: 50 }, eff: { sat: 15, thirst: 0, hp: 0, ent: 0, hyg: 0 },
    shelf: 21, lv: 2, kind: 'dairy' },
  { id: 'eg03', brand: '蒙牛', name: '蒙牛特仑苏纯牛奶 250ml', cat: '蛋奶', price: 5.7, sv: 1,
    nut: { carb: 12.5, prot: 7.5, fat: 8.5, vit: 3, water: 220 }, eff: { sat: 9, thirst: 10, hp: 0, ent: 0, hyg: 0 },
    shelf: 30, lv: 2, kind: 'dairy' },
  { id: 'eg04', brand: '伊利', name: '伊利金典纯牛奶 250ml', cat: '蛋奶', price: 5.4, sv: 1,
    nut: { carb: 12.5, prot: 7.5, fat: 8.5, vit: 3, water: 220 }, eff: { sat: 9, thirst: 10, hp: 0, ent: 0, hyg: 0 },
    shelf: 30, lv: 2, kind: 'dairy' },
  { id: 'eg05', brand: '三元', name: '三元纯牛奶 250ml', cat: '蛋奶', price: 3.0, sv: 1,
    nut: { carb: 12, prot: 7, fat: 8, vit: 2, water: 220 }, eff: { sat: 8, thirst: 10, hp: 0, ent: 0, hyg: 0 },
    shelf: 21, lv: 1, kind: 'dairy' },
  { id: 'eg06', brand: '光明', name: '光明畅优酸奶 200g', cat: '蛋奶', price: 8.0, sv: 1,
    nut: { carb: 14, prot: 6, fat: 5, vit: 2, water: 150 }, eff: { sat: 12, thirst: 8, hp: 0, ent: 2, hyg: 0 },
    shelf: 21, lv: 2, kind: 'dairy' },
  { id: 'eg07', brand: '安佳', name: '安佳无盐黄油 454g', cat: '蛋奶', price: 40.0, sv: 20,
    nut: { carb: 0, prot: 0.5, fat: 10, vit: 1, water: 0 }, eff: { sat: 6, thirst: 0, hp: 0, ent: 0, hyg: 0 },
    shelf: 120, lv: 3, kind: 'dairy' },
  { id: 'eg08', brand: '安佳', name: '安佳马苏里拉芝士 500g', cat: '蛋奶', price: 55.0, sv: 20,
    nut: { carb: 2, prot: 8, fat: 8, vit: 1, water: 20 }, eff: { sat: 12, thirst: 0, hp: 0, ent: 1, hyg: 0 },
    shelf: 60, lv: 3, kind: 'dairy' },
  { id: 'eg09', brand: '雀巢', name: '雀巢淡奶油 250ml', cat: '蛋奶', price: 15.0, sv: 10,
    nut: { carb: 1, prot: 1, fat: 9, vit: 1, water: 20 }, eff: { sat: 5, thirst: 0, hp: 0, ent: 0, hyg: 0 },
    shelf: 60, lv: 3, kind: 'dairy' },
  { id: 'eg10', brand: '神丹', name: '神丹皮蛋 6枚', cat: '蛋奶', price: 10.0, sv: 6,
    nut: { carb: 2, prot: 5, fat: 4, vit: 1, water: 50 }, eff: { sat: 12, thirst: 0, hp: 0, ent: 0, hyg: 0 },
    shelf: 90, lv: 2, kind: 'dairy' },
  { id: 'eg11', brand: '安佳', name: '安佳奶油奶酪 250g', cat: '蛋奶', price: 30.0, sv: 10,
    nut: { carb: 2, prot: 5, fat: 9, vit: 1, water: 20 }, eff: { sat: 8, thirst: 0, hp: 0, ent: 0, hyg: 0 },
    shelf: 60, lv: 4, kind: 'dairy' }
);

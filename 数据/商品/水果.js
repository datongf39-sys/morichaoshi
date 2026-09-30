/* ============================================================
   数据 / 商品 / 水果（可生食）
   ============================================================ */
window.DATA = window.DATA || {};
DATA.products = DATA.products || [];
DATA.products.push(
  { id: 'fr01', brand: '都乐', name: '都乐香蕉 1kg', cat: '水果', price: 8.0, sv: 6,
    nut: { carb: 22, prot: 1.2, fat: 0.3, vit: 5, water: 90 }, eff: { sat: 18, thirst: 3, hp: 0, ent: 4, hyg: 0 },
    shelf: 7, lv: 3, kind: 'fruit' },
  { id: 'fr02', brand: '佳沛', name: '佳沛阳光金奇异果 6粒', cat: '水果', price: 25.0, sv: 6,
    nut: { carb: 14, prot: 1.2, fat: 0.5, vit: 22, water: 85 }, eff: { sat: 12, thirst: 4, hp: 0, ent: 5, hyg: 0 },
    shelf: 8, lv: 3, kind: 'fruit' },
  { id: 'fr03', brand: '新奇士', name: '新奇士甜橙 1kg', cat: '水果', price: 10.0, sv: 5,
    nut: { carb: 12, prot: 1, fat: 0.2, vit: 18, water: 90 }, eff: { sat: 12, thirst: 5, hp: 0, ent: 4, hyg: 0 },
    shelf: 10, lv: 3, kind: 'fruit' },
  { id: 'fr04', brand: '褚橙', name: '褚橙 1kg', cat: '水果', price: 18.0, sv: 5,
    nut: { carb: 13, prot: 1, fat: 0.2, vit: 20, water: 90 }, eff: { sat: 12, thirst: 5, hp: 0, ent: 5, hyg: 0 },
    shelf: 10, lv: 4, kind: 'fruit' },
  { id: 'fr05', brand: '华圣', name: '华圣红富士苹果 1kg', cat: '水果', price: 9.0, sv: 5,
    nut: { carb: 13, prot: 0.5, fat: 0.2, vit: 3, water: 90 }, eff: { sat: 14, thirst: 4, hp: 0, ent: 3, hyg: 0 },
    shelf: 20, lv: 3, kind: 'fruit' },
  { id: 'fr06', brand: '佳沃', name: '佳沃蓝莓 125g', cat: '水果', price: 15.0, sv: 2,
    nut: { carb: 14, prot: 0.8, fat: 0.3, vit: 9, water: 85 }, eff: { sat: 8, thirst: 2, hp: 0, ent: 5, hyg: 0 },
    shelf: 5, lv: 3, kind: 'fruit' },
  { id: 'fr07', brand: '佳沃', name: '佳沃智利车厘子 500g', cat: '水果', price: 45.0, sv: 4,
    nut: { carb: 16, prot: 1.2, fat: 0.2, vit: 6, water: 85 }, eff: { sat: 12, thirst: 3, hp: 0, ent: 7, hyg: 0 },
    shelf: 5, lv: 4, kind: 'fruit' },
  { id: 'fr08', brand: '百果园', name: '百果园麒麟西瓜 1个', cat: '水果', price: 25.0, sv: 8,
    nut: { carb: 7, prot: 0.6, fat: 0.2, vit: 5, water: 100 }, eff: { sat: 12, thirst: 9, hp: 0, ent: 4, hyg: 0 },
    shelf: 6, lv: 3, kind: 'fruit' },
  { id: 'fr09', brand: '百果园', name: '百果园红颜草莓 300g', cat: '水果', price: 20.0, sv: 3,
    nut: { carb: 7, prot: 0.8, fat: 0.3, vit: 15, water: 95 }, eff: { sat: 9, thirst: 3, hp: 0, ent: 6, hyg: 0 },
    shelf: 3, lv: 3, kind: 'fruit' },
  { id: 'fr10', brand: '新奇士', name: '新奇士柠檬 4个', cat: '水果', price: 8.0, sv: 4,
    nut: { carb: 8, prot: 0.8, fat: 0.2, vit: 22, water: 90 }, eff: { sat: 6, thirst: 3, hp: 0, ent: 3, hyg: 0 },
    shelf: 12, lv: 3, kind: 'fruit' },
  { id: 'fr11', brand: '百果园', name: '百果园台农芒果 500g', cat: '水果', price: 16.0, sv: 3,
    nut: { carb: 14, prot: 0.8, fat: 0.3, vit: 10, water: 85 }, eff: { sat: 12, thirst: 3, hp: 0, ent: 6, hyg: 0 },
    shelf: 5, lv: 3, kind: 'fruit' },
  { id: 'fr12', brand: '百果园', name: '百果园香梨 1kg', cat: '水果', price: 9.0, sv: 5,
    nut: { carb: 14, prot: 0.5, fat: 0.2, vit: 4, water: 90 }, eff: { sat: 13, thirst: 4, hp: 0, ent: 3, hyg: 0 },
    shelf: 15, lv: 3, kind: 'fruit' }
);

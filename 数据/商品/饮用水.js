/* ============================================================
   数据 / 商品 / 饮用水
   价格 = 积分 = 与现实人民币等价（末日首月 1:1）
   ============================================================ */
window.DATA = window.DATA || {};
DATA.products = DATA.products || [];
DATA.products.push(
  { id: 'wt01', brand: '农夫山泉', name: '农夫山泉 550ml', cat: '饮用水', price: 2.0, sv: 1,
    nut: { carb: 0, prot: 0, fat: 0, vit: 0, water: 550 }, eff: { sat: 0, thirst: 30, hp: 0, ent: 0, hyg: 0 },
    shelf: null, lv: 1, kind: 'water' },
  { id: 'wt02', brand: '怡宝', name: '怡宝 555ml', cat: '饮用水', price: 2.0, sv: 1,
    nut: { carb: 0, prot: 0, fat: 0, vit: 0, water: 555 }, eff: { sat: 0, thirst: 30, hp: 0, ent: 0, hyg: 0 },
    shelf: null, lv: 1, kind: 'water' },
  { id: 'wt03', brand: '康师傅', name: '康师傅矿物质水 550ml', cat: '饮用水', price: 1.5, sv: 1,
    nut: { carb: 0, prot: 0, fat: 0, vit: 0, water: 550 }, eff: { sat: 0, thirst: 28, hp: 0, ent: 0, hyg: 0 },
    shelf: null, lv: 1, kind: 'water' },
  { id: 'wt04', brand: '百岁山', name: '百岁山 570ml', cat: '饮用水', price: 3.0, sv: 1,
    nut: { carb: 0, prot: 0, fat: 0, vit: 0, water: 570 }, eff: { sat: 0, thirst: 31, hp: 0, ent: 0, hyg: 0 },
    shelf: null, lv: 1, kind: 'water' },
  { id: 'wt05', brand: '娃哈哈', name: '娃哈哈 596ml', cat: '饮用水', price: 2.0, sv: 1,
    nut: { carb: 0, prot: 0, fat: 0, vit: 0, water: 596 }, eff: { sat: 0, thirst: 31, hp: 0, ent: 0, hyg: 0 },
    shelf: null, lv: 1, kind: 'water' },
  { id: 'wt06', brand: '依云', name: '依云天然矿泉水 330ml', cat: '饮用水', price: 12.0, sv: 1,
    nut: { carb: 0, prot: 0, fat: 0, vit: 0, water: 330 }, eff: { sat: 0, thirst: 30, hp: 0, ent: 2, hyg: 0 },
    shelf: null, lv: 3, kind: 'water' },
  { id: 'wt07', brand: '农夫山泉', name: '农夫山泉运动盖 1.5L', cat: '饮用水', price: 4.5, sv: 1,
    nut: { carb: 0, prot: 0, fat: 0, vit: 0, water: 1500 }, eff: { sat: 0, thirst: 60, hp: 0, ent: 0, hyg: 0 },
    shelf: null, lv: 1, kind: 'water' }
);

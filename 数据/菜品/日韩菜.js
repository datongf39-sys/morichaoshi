/* ============================================================
   数据 / 菜品 / 日韩菜
   ============================================================ */
window.DATA = window.DATA || {};
DATA.dishes = DATA.dishes || [];
DATA.dishes.push(
  { id: 'j01', name: '寿喜锅', cuisine: '日式', price: 36, time: 50, tools: ['stove', 'pot', 'knife', 'board'],
    ing: { mt07: 0.5, vg27: 0.5, vg01: 0.5, vg14: 0.3, vg15: 0.3, vg24: 0.05, gr10: 0.2, gr16: 0.15, gr18: 0.2 },
    nut: { carb: 14, prot: 24, fat: 20, vit: 6, water: 80 }, eff: { sat: 56, thirst: 4, hp: 0 } },
  { id: 'j02', name: '日式咖喱饭', cuisine: '日式', price: 24, time: 50, tools: ['stove', 'pot', 'knife', 'board'],
    ing: { gr01: 0.3, ms08: 0.5, vg04: 0.4, vg03: 0.4, vg08: 0.3, mt04: 0.4 },
    nut: { carb: 48, prot: 18, fat: 14, vit: 6, water: 60 }, eff: { sat: 52, thirst: 4, hp: 0 } },
  { id: 'j03', name: '味噌汤', cuisine: '日式', price: 12, time: 20, tools: ['stove', 'pot', 'knife', 'board'],
    ing: { ms01: 0.2, vg27: 0.3, aq15: 0.2, vg24: 0.05 },
    nut: { carb: 8, prot: 8, fat: 4, vit: 3, water: 90 }, eff: { sat: 30, thirst: 5, hp: 0 } },
  { id: 'j04', name: '韩式部队锅', cuisine: '韩式', price: 30, time: 45, tools: ['stove', 'pot', 'knife', 'board'],
    ing: { vg26: 0.4, in18: 0.5, in10: 0.3, in01: 0.5, gr20: 0.4, eg08: 0.2, ms25: 0.15, gr16: 0.1 },
    nut: { carb: 40, prot: 20, fat: 20, vit: 5, water: 70 }, eff: { sat: 56, thirst: 4, hp: 0 } },
  { id: 'j05', name: '石锅拌饭', cuisine: '韩式', price: 22, time: 40, tools: ['stove', 'wok', 'knife', 'board', 'spatula'],
    ing: { gr01: 0.3, vg11: 0.3, vg13: 0.3, vg04: 0.3, vg14: 0.2, eg01: 0.15, ms25: 0.2, ms03: 0.1, ms26: 0.05 },
    nut: { carb: 46, prot: 14, fat: 10, vit: 8, water: 50 }, eff: { sat: 50, thirst: 3, hp: 0 } },
  { id: 'j06', name: '泡菜炒饭', cuisine: '韩式', price: 18, time: 20, tools: ['stove', 'wok', 'knife', 'board', 'spatula'],
    ing: { gr01: 0.3, vg26: 0.4, eg01: 0.15, in18: 0.3, vg24: 0.05, gr10: 0.05, ms03: 0.05 },
    nut: { carb: 44, prot: 14, fat: 12, vit: 4, water: 40 }, eff: { sat: 48, thirst: 3, hp: 0 } },
  { id: 'j07', name: '日式炸猪排', cuisine: '日式', price: 26, time: 45, tools: ['stove', 'wok', 'knife', 'board', 'spatula'],
    ing: { mt02: 0.5, gr06: 0.2, eg01: 0.15, gr07: 0.3, gr01: 0.3, ms05: 0.15 },
    nut: { carb: 46, prot: 26, fat: 20, vit: 3, water: 40 }, eff: { sat: 54, thirst: 3, hp: 0 } },
  { id: 'j08', name: '寿司卷', cuisine: '日式', price: 34, time: 40, tools: ['knife', 'board'],
    ing: { gr01: 0.3, aq13: 0.4, aq01: 0.3, vg07: 0.2, eg01: 0.2, gr13: 0.1, gr16: 0.05, ms06: 0.1 },
    nut: { carb: 36, prot: 22, fat: 8, vit: 4, water: 50 }, eff: { sat: 48, thirst: 3, hp: 0 } },
  { id: 'j09', name: '韩式拌冷面', cuisine: '韩式', price: 18, time: 30, tools: ['stove', 'pot', 'knife', 'board'],
    ing: { gr23: 0.3, vg26: 0.3, vg07: 0.3, eg01: 0.15, ms25: 0.15, gr13: 0.1, gr16: 0.1 },
    nut: { carb: 40, prot: 12, fat: 8, vit: 5, water: 60 }, eff: { sat: 44, thirst: 4, hp: 0 } }
);

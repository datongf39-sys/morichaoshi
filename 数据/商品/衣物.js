/* ============================================================
   数据 / 商品 / 衣物
   part: inner内衣 / upper上装 / lower下装 / socks袜 / shoes鞋 / outer外套
   season: neutral四季 / summer夏 / winter冬
   ============================================================ */
window.DATA = window.DATA || {};
DATA.products = DATA.products || [];
DATA.products.push(
  { id: 'ct01', brand: '优衣库', name: '优衣库HEATTECH保暖内衣', cat: '衣物', price: 99, sv: 1,
    nut: { carb: 0, prot: 0, fat: 0, vit: 0, water: 0 }, eff: { sat: 0, thirst: 0, hp: 0, ent: 0, hyg: 0 },
    shelf: null, lv: 7, kind: 'cloth', part: 'inner', season: 'winter' },
  { id: 'ct02', brand: '优衣库', name: '优衣库摇粒绒外套', cat: '衣物', price: 199, sv: 1,
    nut: { carb: 0, prot: 0, fat: 0, vit: 0, water: 0 }, eff: { sat: 0, thirst: 0, hp: 0, ent: 0, hyg: 0 },
    shelf: null, lv: 7, kind: 'cloth', part: 'outer', season: 'winter' },
  { id: 'ct03', brand: '李宁', name: '李宁运动T恤', cat: '衣物', price: 79, sv: 1,
    nut: { carb: 0, prot: 0, fat: 0, vit: 0, water: 0 }, eff: { sat: 0, thirst: 0, hp: 0, ent: 0, hyg: 0 },
    shelf: null, lv: 7, kind: 'cloth', part: 'upper', season: 'summer' },
  { id: 'ct04', brand: '安踏', name: '安踏运动长裤', cat: '衣物', price: 89, sv: 1,
    nut: { carb: 0, prot: 0, fat: 0, vit: 0, water: 0 }, eff: { sat: 0, thirst: 0, hp: 0, ent: 0, hyg: 0 },
    shelf: null, lv: 7, kind: 'cloth', part: 'lower', season: 'neutral' },
  { id: 'ct05', brand: '耐克', name: '耐克运动鞋', cat: '衣物', price: 499, sv: 1,
    nut: { carb: 0, prot: 0, fat: 0, vit: 0, water: 0 }, eff: { sat: 0, thirst: 0, hp: 0, ent: 0, hyg: 0 },
    shelf: null, lv: 7, kind: 'cloth', part: 'shoes', season: 'neutral' },
  { id: 'ct06', brand: '阿迪达斯', name: '阿迪达斯连帽卫衣', cat: '衣物', price: 299, sv: 1,
    nut: { carb: 0, prot: 0, fat: 0, vit: 0, water: 0 }, eff: { sat: 0, thirst: 0, hp: 0, ent: 0, hyg: 0 },
    shelf: null, lv: 7, kind: 'cloth', part: 'upper', season: 'winter' },
  { id: 'ct07', brand: '南极人', name: '南极人保暖袜 5双', cat: '衣物', price: 15, sv: 5,
    nut: { carb: 0, prot: 0, fat: 0, vit: 0, water: 0 }, eff: { sat: 0, thirst: 0, hp: 0, ent: 0, hyg: 0 },
    shelf: null, lv: 7, kind: 'cloth', part: 'socks', season: 'winter' },
  { id: 'ct08', brand: '恒源祥', name: '恒源祥羊毛衫', cat: '衣物', price: 150, sv: 1,
    nut: { carb: 0, prot: 0, fat: 0, vit: 0, water: 0 }, eff: { sat: 0, thirst: 0, hp: 0, ent: 0, hyg: 0 },
    shelf: null, lv: 7, kind: 'cloth', part: 'upper', season: 'winter' },
  { id: 'ct09', brand: '波司登', name: '波司登羽绒服', cat: '衣物', price: 699, sv: 1,
    nut: { carb: 0, prot: 0, fat: 0, vit: 0, water: 0 }, eff: { sat: 0, thirst: 0, hp: 0, ent: 0, hyg: 0 },
    shelf: null, lv: 7, kind: 'cloth', part: 'outer', season: 'winter' },
  { id: 'ct10', brand: '森马', name: '森马牛仔裤', cat: '衣物', price: 99, sv: 1,
    nut: { carb: 0, prot: 0, fat: 0, vit: 0, water: 0 }, eff: { sat: 0, thirst: 0, hp: 0, ent: 0, hyg: 0 },
    shelf: null, lv: 7, kind: 'cloth', part: 'lower', season: 'neutral' },
  { id: 'ct11', brand: '海澜之家', name: '海澜之家衬衫', cat: '衣物', price: 129, sv: 1,
    nut: { carb: 0, prot: 0, fat: 0, vit: 0, water: 0 }, eff: { sat: 0, thirst: 0, hp: 0, ent: 0, hyg: 0 },
    shelf: null, lv: 7, kind: 'cloth', part: 'upper', season: 'neutral' },
  { id: 'ct12', brand: '全棉时代', name: '全棉时代棉内裤 3条', cat: '衣物', price: 45, sv: 3,
    nut: { carb: 0, prot: 0, fat: 0, vit: 0, water: 0 }, eff: { sat: 0, thirst: 0, hp: 0, ent: 0, hyg: 0 },
    shelf: null, lv: 7, kind: 'cloth', part: 'inner', season: 'neutral' },
  { id: 'ct13', brand: '蕉下', name: '蕉下防晒衣', cat: '衣物', price: 199, sv: 1,
    nut: { carb: 0, prot: 0, fat: 0, vit: 0, water: 0 }, eff: { sat: 0, thirst: 0, hp: 0, ent: 0, hyg: 0 },
    shelf: null, lv: 7, kind: 'cloth', part: 'outer', season: 'summer' },
  { id: 'ct14', brand: '回力', name: '回力帆布鞋', cat: '衣物', price: 59, sv: 1,
    nut: { carb: 0, prot: 0, fat: 0, vit: 0, water: 0 }, eff: { sat: 0, thirst: 0, hp: 0, ent: 0, hyg: 0 },
    shelf: null, lv: 7, kind: 'cloth', part: 'shoes', season: 'neutral' }
);

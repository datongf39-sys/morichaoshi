/* ============================================================
   数据 / 设施 —— 超市摆件设施（货架/冷藏柜/冷冻柜/烤肠机/关东煮/热食柜）
   分区（三级起）= 区域划分；设施 = 具体摆件。玩家自行决定
   每件设施摆什么，分区内的物品仅该分区可摆放。
   一级二级无分区，但不止一个货架（小卖部/便利店现实配置）。
   容量按物品大小区分（大件占 2 点，小件占 1 点）。
   ============================================================ */
window.DATA = window.DATA || {};
DATA.facility = {

  /* ---------- 设施类型 ---------- */
  TYPES: {
    shelf:  { name: '货架',     size: '常温陈列', cap: 40, note: '薯片、饼干、泡面、调料等常温商品' },
    chill:  { name: '冷藏柜',   size: '冷藏 0~8℃', cap: 30, note: '超市摆放饮品冷饮的那种立式/卧式冷柜；牛奶、饮料、生鲜、熟食冷藏' },
    freeze: { name: '冷冻柜',   size: '冷冻 -18℃', cap: 20, note: '冷冻水饺、冻肉冻海鲜等' },
    grill:  { name: '烤肠机',   size: '恒温加热', cap: 30, note: '便利店门口那种滚筒烤肠机' },
    pot:    { name: '关东煮锅', size: '沸腾保温', cap: 30, note: '汤底咕嘟，萝卜鱼丸关东煮' },
    hotbox: { name: '热食柜',   size: '保温 60℃', cap: 40, note: '玻璃保温柜，包子烧麦玉米等热食' }
  },

  /* ---------- 分区（三级超市起出现） ---------- */
  ZONES: {
    snack:  { name: '零食饮料区', desc: '薯片饼干糖果、饮料与饮用水' },
    grain:  { name: '粮油速食区', desc: '米面粮油、调味料、方便速食' },
    daily:  { name: '日化日杂区', desc: '日用品、洗护、厨房小工具' },
    fresh:  { name: '生鲜区',     desc: '蔬果肉类、蛋奶（必须冷藏）' },
    frozen: { name: '冷冻区',     desc: '冷冻水饺、冻品' },
    hot:    { name: '熟食区',     desc: '烤肠机、关东煮、热食柜' },
    pharm:  { name: '药品区',     desc: '常备药品（超市 4 级开放）' },
    aqua:   { name: '水产区',     desc: '鲜活水产冷藏（超市 4 级开放）' },
    arms:   { name: '枪械区',     desc: '枪械弹具（超市 5 级开放）' },
    ent:    { name: '娱乐区',     desc: '娱乐用品（超市 6 级开放）' },
    cloth:  { name: '服装区',     desc: '衣物鞋帽（超市 7 级开放）' }
  },

  /* ---------- 各等级设施计划 ----------
     一级小卖部（30㎡）：3 货架 + 冷藏柜 + 冷冻柜
     二级便利店（80㎡）：5 货架 + 2 冷藏柜 + 冷冻柜 + 烤肠机 + 关东煮 + 热食柜
     三级起出现分区，设施随等级（面积）扩张 */
  PLAN: {
    1: { main: { shelf: 3, chill: 1, freeze: 1 } },
    2: { main: { shelf: 5, chill: 2, freeze: 1, grill: 1, pot: 1, hotbox: 1 } },
    3: {
      snack:  { shelf: 3, chill: 2 },
      grain:  { shelf: 3 },
      daily:  { shelf: 2 },
      fresh:  { chill: 2, freeze: 1 },
      hot:    { grill: 1, pot: 1, hotbox: 1 },
      frozen: { freeze: 2 }
    },
    4: {
      snack:  { shelf: 4, chill: 3 },
      grain:  { shelf: 4 },
      daily:  { shelf: 3 },
      fresh:  { chill: 3, freeze: 2 },
      hot:    { grill: 1, pot: 1, hotbox: 2 },
      frozen: { freeze: 2 },
      pharm:  { shelf: 2 },
      aqua:   { chill: 1 }
    },
    5: {
      snack:  { shelf: 5, chill: 3 },
      grain:  { shelf: 5 },
      daily:  { shelf: 3 },
      fresh:  { chill: 3, freeze: 2 },
      hot:    { grill: 2, pot: 1, hotbox: 2 },
      frozen: { freeze: 3 },
      pharm:  { shelf: 2 },
      aqua:   { chill: 1 },
      arms:   { shelf: 2 }
    },
    6: {
      snack:  { shelf: 6, chill: 4 },
      grain:  { shelf: 6 },
      daily:  { shelf: 4 },
      fresh:  { chill: 4, freeze: 3 },
      hot:    { grill: 2, pot: 2, hotbox: 2 },
      frozen: { freeze: 3 },
      pharm:  { shelf: 3 },
      aqua:   { chill: 2 },
      arms:   { shelf: 2 },
      ent:    { shelf: 2 }
    },
    7: {
      snack:  { shelf: 7, chill: 4 },
      grain:  { shelf: 7 },
      daily:  { shelf: 4 },
      fresh:  { chill: 5, freeze: 3 },
      hot:    { grill: 2, pot: 2, hotbox: 3 },
      frozen: { freeze: 4 },
      pharm:  { shelf: 3 },
      aqua:   { chill: 2 },
      arms:   { shelf: 3 },
      ent:    { shelf: 3 },
      cloth:  { shelf: 3 }
    },
    8: {
      snack:  { shelf: 9, chill: 6 },
      grain:  { shelf: 9 },
      daily:  { shelf: 6 },
      fresh:  { chill: 7, freeze: 5 },
      hot:    { grill: 3, pot: 2, hotbox: 4 },
      frozen: { freeze: 6 },
      pharm:  { shelf: 5 },
      aqua:   { chill: 3 },
      arms:   { shelf: 4 },
      ent:    { shelf: 4 },
      cloth:  { shelf: 5 }
    },
    9: {
      snack:  { shelf: 12, chill: 8 },
      grain:  { shelf: 12 },
      daily:  { shelf: 8 },
      fresh:  { chill: 9, freeze: 7 },
      hot:    { grill: 4, pot: 3, hotbox: 5 },
      frozen: { freeze: 8 },
      pharm:  { shelf: 7 },
      aqua:   { chill: 4 },
      arms:   { shelf: 5 },
      ent:    { shelf: 6 },
      cloth:  { shelf: 7 }
    },
    10: {
      snack:  { shelf: 16, chill: 10 },
      grain:  { shelf: 16 },
      daily:  { shelf: 10 },
      fresh:  { chill: 12, freeze: 9 },
      hot:    { grill: 5, pot: 4, hotbox: 6 },
      frozen: { freeze: 10 },
      pharm:  { shelf: 9 },
      aqua:   { chill: 5 },
      arms:   { shelf: 6 },
      ent:    { shelf: 8 },
      cloth:  { shelf: 9 }
    }
  },

  /* ---------- 商品存储规则 ----------
     易腐（生鲜/蛋奶/冷冻）必须进对应设施，不可直接摆货架；
     饮料/饮用水可选放冷藏柜（现实冷饮）；
     其余常温商品放货架。 */
  STOR_RULES: {
    veg: 'chill', fruit: 'chill', meat: 'chill', aquatic: 'chill', dairy: 'chill',
    freezers: ['in07', 'in08', 'in09'],   // 冷冻水饺
    chillDrink: ['dr16', 'dr17', 'dr18']  // 饮料类牛奶需冷藏
  },

  /* ---------- 商品 → 分区 ---------- */
  zoneOf: function (p) {
    if (p.stor === 'freeze') return 'frozen';
    if (p.stor === 'chill') return 'fresh';
    if (p.stor === 'hot' || p.stor === 'grill' || p.stor === 'pot') return 'hot';
    if (p.kind === 'veg' || p.kind === 'fruit' || p.kind === 'meat' || p.kind === 'aquatic' || p.kind === 'dairy') return 'fresh';
    if (p.kind === 'weapon') return 'arms';
    if (p.kind === 'cloth') return 'cloth';
    if (p.kind === 'ent') return 'ent';
    if (p.kind === 'med') return 'pharm';
    if (p.kind === 'drink' || p.kind === 'water' || p.kind === 'snack') return 'snack';
    if (p.kind === 'grain' || p.kind === 'spice' || p.kind === 'instant') return 'grain';
    return 'daily';
  }
};

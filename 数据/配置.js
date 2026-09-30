/* ============================================================
   数据 / 配置 —— 游戏核心常量
   ============================================================ */
window.DATA = window.DATA || {};
DATA.config = {

  /* ---------- 时间 ---------- */
  DAYS_PER_MONTH: 30,
  DAYS_PER_YEAR: 360,
  DAY_MINUTES: 1440,          // 一天 = 1440 分钟（24 小时）
  DAY_START_MIN: 8 * 60,      // 每天从 08:00 开始
  OPEN_START: 8 * 60,         // 营业 08:00
  OPEN_END: 22 * 60,          // 打烊 22:00

  /* ---------- 游戏阶段 ----------
     末日前期 1~3 年 / 中期 4~8 年 / 后期 9 年以上 */
  STAGES: {
    early: { name: '末日前期', years: '第1~3年', dayStart: 1, dayEnd: 1080,
      desc: '末日刚刚降临。人们还揣着现金和家里的存货，硬通货依然坚挺。' },
    mid: { name: '末日中期', years: '第4~8年', dayStart: 1081, dayEnd: 2880,
      desc: '纸币成了废纸。晶核成为唯一的硬通货，低阶晶核是主流。' },
    late: { name: '末日后期', years: '第9年起', dayStart: 2881, dayEnd: Infinity,
      desc: '秩序在废墟上重建。中阶晶核通行，高阶晶核开始现身。' }
  },

  /* ---------- 晶核（9 阶）兑换积分 ---------- */
  CRYSTAL_RATE: { 1: 5, 2: 20, 3: 80, 4: 300, 5: 1200, 6: 5000, 7: 20000, 8: 80000, 9: 300000 },
  CRYSTAL_TIERS: { low: [1, 2, 3], mid: [4, 5, 6], high: [7, 8, 9] },
  CRYSTAL_LABEL: { 1: '一阶晶核', 2: '二阶晶核', 3: '三阶晶核', 4: '四阶晶核', 5: '五阶晶核', 6: '六阶晶核', 7: '七阶晶核', 8: '八阶晶核', 9: '九阶晶核' },

  /* ---------- 硬通货（末日前期，兑换比例恒定不变） ---------- */
  HARD_GOODS: {
    gold:      { name: '黄金',   unit: '克',   rate: 400, desc: '末日里永恒的价值' },
    cigarette: { name: '整条香烟', unit: '条', rate: 200, desc: '末日社交硬通货' },
    baijiu:    { name: '白酒',   unit: '瓶',   rate: 150, desc: '一杯下肚，暂时忘掉末日' }
  },
  /* 现金逐月贬值（首月 1:1 与现实一致） */
  CASH_DECAY: { m1: 1.0, m2: 0.7, m3: 0.4, m4: 0.25, m5: 0.15, m6: 0.08 },
  /* 物品逐月损耗与过期 */
  GOODS_DECAY_BASE: 0.82,

  /* ---------- 超市等级（1~10） ---------- */
  LEVELS: [
    { lv: 1,  name: '小卖部',     area: '30㎡',   cost: 0,
      desc: '两排货架、一台收银台。柜台后是你的住处：一张床、一套基础卫浴。保护罩把荒野挡在门外。',
      cond: { cum: 0, types: 0, newCust: 0, emp: 0, crys: 0 } },
    { lv: 2,  name: '小超市',     area: '80㎡',   cost: 1500,
      desc: '货架多了一排，门头换了新招牌。夜里亮起的日光灯，是方圆几公里唯一的光。',
      cond: { cum: 500, types: 15, newCust: 5, emp: 0, crys: 0 } },
    { lv: 3,  name: '中型超市',   area: '200㎡',  cost: 4200,
      desc: '生鲜柜和自助区陆续开放。超市终于有了超市的样子。',
      cond: { cum: 3000, types: 35, newCust: 20, emp: 3, crys: 0 } },
    { lv: 4,  name: '大型超市',   area: '500㎡',  cost: 11760,
      desc: '冷藏柜、水产缸、药品柜依次排开。员工们穿着统一围裙，忙而不乱。',
      cond: { cum: 20000, types: 60, newCust: 60, emp: 10, crys: 10 } },
    { lv: 5,  name: '仓储超市',   area: '1200㎡', cost: 32928,
      desc: '高高的货架像森林。枪械柜上了锁，钥匙在你口袋里。',
      cond: { cum: 100000, types: 90, newCust: 200, emp: 25, crys: 50 } },
    { lv: 6,  name: '购物中心',   area: '3000㎡', cost: 92200,
      desc: '自动扶梯缓缓转动，娱乐区亮起彩灯。隔壁的酒店已经挂牌营业。',
      cond: { cum: 400000, types: 120, newCust: 600, emp: 100, crys: 200 } },
    { lv: 7,  name: '商业综合体', area: '8000㎡', cost: 258160,
      desc: '网络接通的瞬间，整座超市的屏幕同时亮起。服装店、影院、车行——城市正在重生。',
      cond: { cum: 1500000, types: 140, newCust: 1500, emp: 250, crys: 800 } },
    { lv: 8,  name: '巨型商城',   area: '20000㎡', cost: 722848,
      desc: '穹顶之下灯火通明。人们从几十公里外赶来，只为在末日里逛一次街。',
      cond: { cum: 5000000, types: 150, newCust: 4000, emp: 600, crys: 3000 } },
    { lv: 9,  name: '末日商业帝国', area: '50000㎡', cost: 2023975,
      desc: '你的名字印在每一只购物袋上。这里的货架，就是末日的秩序。',
      cond: { cum: 15000000, types: 160, newCust: 10000, emp: 1500, crys: 10000 } },
    { lv: 10, name: '庇护所级商城', area: '120000㎡', cost: 5667130,
      desc: '一座自给自足的城市。人们在这里出生、成长、老去，渐渐忘记外面的世界曾经那样可怕。',
      cond: { cum: 40000000, types: 170, newCust: 25000, emp: 4000, crys: 40000 } }
  ],
  /* 各阶段超市等级上限 */
  LEVEL_CAP: { early: 3, mid: 6, late: 10 },

  /* ---------- 区域解锁 ---------- */
  AREAS: {
    dorm:     { name: '员工宿舍', lv: 2, cost: 800,    cap: 0, desc: '上下铺、储物柜、公共卫浴。有了宿舍，才能把信得过的老客变成店员。', fx: '可招募员工' },
    kitchen:  { name: '小厨房',   lv: 1, cost: 600,    cap: 0, desc: '案板、灶台、一口锅。会做饭的你，终于有了用武之地。', fx: '会做饭者开局自动解锁' },
    self:     { name: '自助区',   lv: 3, cost: 20000,  cap: 4, desc: '自助结账机嘀嘀作响。', fx: '客流上限+4' },
    fresh:    { name: '生鲜区',   lv: 3, cost: 30000,  cap: 4, desc: '蔬菜水果码得整整齐齐，水雾定时喷洒。', fx: '客流上限+4' },
    chill:    { name: '冷藏冷冻区', lv: 4, cost: 50000, cap: 4, desc: '冷柜嗡嗡低鸣，牛奶和肉都有了安身之处。', fx: '客流上限+4，生鲜保质期+2天' },
    aqua:     { name: '水产区',   lv: 4, cost: 40000,  cap: 3, desc: '玻璃缸里鱼影游动。', fx: '客流上限+3' },
    pharm:    { name: '药品区',   lv: 4, cost: 30000,  cap: 3, desc: '药剂师不在，但药架都在。', fx: '客流上限+3，药品热销' },
    ent:      { name: '娱乐区',   lv: 6, cost: 150000, cap: 5, desc: '棋牌桌、书柜、音响。人们在这里找回笑声。', fx: '客流上限+5，娱乐品热销' },
    cloth:    { name: '服装区',   lv: 7, cost: 200000, cap: 4, desc: '衣架一排排挂满。末日里，体面是奢侈品。', fx: '客流上限+4，衣物热销' },
    arms:     { name: '枪械区',   lv: 5, cost: 300000, cap: 2, desc: '玻璃柜里躺着沉默的钢铁。', fx: '解锁枪械商品销售，客流上限+2' },
    network:  { name: '网络专区', lv: 7, cost: 400000, cap: 5, desc: '末日第七年，网络重连。', fx: '解锁L7店铺（服装店/影院/车行/通讯店），客流上限+5' },
    warehouse:{ name: '仓库扩容', lv: 2, cost: 15000,  cap: 0, desc: '货更多，心更安。', fx: '库存上限+1500' }
  },
  /* 区域展示顺序 */
  AREAS_ORDER: ['dorm', 'kitchen', 'self', 'fresh', 'chill', 'aqua', 'pharm', 'ent', 'cloth', 'arms', 'network', 'warehouse'],

  /* ---------- 保护罩 ---------- */
  SHIELD: [
    { r: '50m',   cost: 0 },
    { r: '100m',  cost: 5000 },
    { r: '200m',  cost: 15000 },
    { r: '500m',  cost: 40000 },
    { r: '1km',   cost: 100000 },
    { r: '2km',   cost: 250000 },
    { r: '5km',   cost: 600000 },
    { r: '10km',  cost: 1500000 },
    { r: '20km',  cost: 4000000 },
    { r: '50km',  cost: 10000000 }
  ],

  /* ---------- 末日轮换危害（第 2 个月起随机出现，需保护罩等级防范） ---------- */
  HAZARDS: {
    heat: { id: 'heat', name: '极热', needShield: 2, icon: '☀',
      desc: '气温逼近 60 度。未达标：口渴消耗翻倍。' },
    cold: { id: 'cold', name: '极寒', needShield: 2, icon: '❄',
      desc: '零下三十度。未达标：饱食消耗加快。' },
    acid: { id: 'acid', name: '酸雨', needShield: 3, icon: '☂',
      desc: '酸雨腐蚀一切。未达标：货架商品每日损坏 5%。' },
    horde: { id: 'horde', name: '尸潮', needShield: 4, icon: '☣',
      desc: '游荡者成群结队。未达标：客流减半，且可能冲破保护罩伤人。' }
  },
  HAZARD_START_DAY: 31,       // 第 2 个月起
  HAZARD_CHANCE: 0.35,        // 每日出现基准概率（随月份上升）

  /* ---------- 员工招募上限（按超市等级） ---------- */
  EMP_CAP: { 2: 2, 3: 5, 4: 20, 5: 50, 6: 200, 7: 500, 8: 1200, 9: 3000, 10: 8000 },
  /* 升级所需员工 = 目标等级可招募上限的一半（向上取整） */

  /* ---------- 属性衰减（每小时） ---------- */
  DECAY: { sat: 1.6, thirst: 2.0, hp: 0.15, ent: 1.3, hygFemale: 0.8, hygMale: 1.6 },
  /* 每日结算：店主与所有店员五项数值须全部 > 60，否则触发失败结局 */
  SURVIVE_MIN: 60,
  /* 饥饿 / 口渴加重生命值流失 */
  HUNGRY_THRESHOLD: 25,

  /* ---------- 营养（碳水/蛋白质/脂肪/维生素，单位克） ----------
     每 4 日结算一次，有一类摄入不满即患营养不良 */
  NUTR_NEED: { carb: 60, prot: 30, fat: 25, vit: 15 },   // 每日需求，4 日结算 ×4
  NUTR_CHECK_DAYS: 4,
  MALNUTRITION_HP_LOSS: 5,

  /* ---------- 衣物更换（季节间隔） ---------- */
  CLOTH_INTERVAL: { summer: 1, spring: 2, autumn: 2, winter: 3 },
  CLOTH_PENALTY: 10,   // 超过期限后，每多一日卫生值 -10

  /* ---------- 女性月经 ---------- */
  PERIOD: { cycle: 30, min: 4, max: 7, padPerDay: 1 },
  PERIOD_HYG_MULT: 3,

  /* ---------- 疾病 ---------- */
  DISEASES: {
    foodpoison: { name: '食物中毒', hpPerDay: 8, autoDays: 5, meds: ['md06', 'md07'], desc: '吃了没处理干净或过期的食物。需要止泻药。' },
    cold:       { name: '感冒',     hpPerDay: 6, autoDays: 5, meds: ['md01', 'md02', 'md19'], desc: '着凉或卫生太差。需要感冒药。' },
    fever:      { name: '发烧',     hpPerDay: 9, autoDays: 4, meds: ['md03', 'md04'], desc: '感染或感冒加重。需要退烧药。' },
    infection:  { name: '伤口感染', hpPerDay: 10, autoDays: 6, meds: ['md05'], desc: '伤口没有处理干净。需要抗生素。' },
    indigest:   { name: '消化不良', hpPerDay: 5, autoDays: 3, meds: ['md08', 'md09'], desc: '吃了太多不新鲜的东西。需要助消化药。' },
    heatstroke: { name: '中暑',     hpPerDay: 8, autoDays: 2, meds: ['md18'], desc: '酷暑天水分不足。需要藿香正气水。' }
  },

  /* ---------- 末日前身份（基础属性加成 + 特长） ---------- */
  IDENTITIES: [
    { id: 'office',  name: '普通上班族', desc: '朝九晚五，安安稳稳。', mods: { sat: 5, thirst: 5, hp: 5, ent: 5, hyg: 5 }, perk: '均衡发展，无特殊加成。' },
    { id: 'coach',   name: '健身教练',   desc: '一身腱子肉，耐得住苦。', mods: { hp: 15, stamina: 15 }, perk: '休息与睡眠恢复体力 +20%。' },
    { id: 'chef',    name: '私房菜大厨', desc: '颠勺十年，味蕾挑剔。', mods: { sat: 8 }, cook: true, perk: '天生会做饭（开局解锁小厨房），烹饪耗时 -30%。' },
    { id: 'doctor',  name: '社区医生',   desc: '白大褂洗得发白。', mods: { hp: 10 }, perk: '药品与治疗效果 +25%，疾病自愈天数 -1。' },
    { id: 'coder',   name: '软件工程师', desc: '键盘是武器，逻辑是盾。', mods: { ent: 10 }, perk: '系统亲和：超市升级费用 -10%，进货耗时 -30%。' },
    { id: 'courier', name: '快递员',     desc: '风里来雨里去。', mods: { stamina: 12 }, perk: '外出探索体力消耗 -25%。' },
    { id: 'soldier', name: '退伍军人',   desc: '纪律与警觉刻在骨子里。', mods: { hp: 20, stamina: 10 }, perk: '探索遇险概率 -50%，探索收益 +20%。' },
    { id: 'teacher', name: '中学教师',   desc: '讲台前站了十几年。', mods: { ent: 15 }, perk: '老客更容易成为员工，顾客消费 +8%。' },
    { id: 'student', name: '大学生',     desc: '年轻，就是本钱。', mods: { sat: 5, thirst: 5, hp: 5, ent: 5, hyg: 5 }, perk: '精力旺盛：娱乐值衰减 -30%。' }
  ],

  /* ---------- 喜欢的颜色（店铺 / 住处 / 网页主题） ---------- */
  COLORS: [
    { id: 'warm',   name: '暖阳黄', c: '#c96f2e', palette: { bg: '#f7efdf', panel: '#fffaf0', panel2: '#f4e8cf', panel3: '#efe0c2', accent: '#c96f2e', accent2: '#8a5a2b', text: '#3d2f1e', muted: '#8d7a5f', line: '#e6d7b6' } },
    { id: 'cream',  name: '奶油白', c: '#b08954', palette: { bg: '#f5f1ea', panel: '#fdfbf6', panel2: '#efe9de', panel3: '#e8e0d2', accent: '#b08954', accent2: '#7c6a4f', text: '#3c352b', muted: '#8b8173', line: '#e2dbcc' } },
    { id: 'mint',   name: '薄荷绿', c: '#4f7d4f', palette: { bg: '#eef4ea', panel: '#f9fcf6', panel2: '#e2eeda', panel3: '#d8e7cf', accent: '#4f7d4f', accent2: '#38603c', text: '#2f3b2c', muted: '#7c8a76', line: '#d5e2cd' } },
    { id: 'slate',  name: '雾霾蓝', c: '#5a7d9a', palette: { bg: '#edf1f5', panel: '#f8fafc', panel2: '#dee7ef', panel3: '#d3dde6', accent: '#5a7d9a', accent2: '#3f5d75', text: '#2d3740', muted: '#7a8a97', line: '#d2dde6' } },
    { id: 'sakura', name: '樱花粉', c: '#c2767f', palette: { bg: '#f8eef0', panel: '#fdf9fa', panel2: '#f2e0e4', panel3: '#ecd5da', accent: '#c2767f', accent2: '#96525a', text: '#3d2c30', muted: '#96747c', line: '#e8d2d6' } },
    { id: 'earth',  name: '大地棕', c: '#8a6b3d', palette: { bg: '#efe8dc', panel: '#faf5ec', panel2: '#e3d8c2', panel3: '#d9ccb2', accent: '#8a6b3d', accent2: '#5f4a28', text: '#362f24', muted: '#847658', line: '#ddd0b8' } },
    { id: 'dusk',   name: '暮云紫', c: '#7d6ba6', palette: { bg: '#f0edf4', panel: '#faf9fc', panel2: '#e2dcf0', panel3: '#d8d1e8', accent: '#7d6ba6', accent2: '#574a7d', text: '#332e42', muted: '#837b98', line: '#d9d3e6' } }
  ],

  /* ---------- 风格（店主专属区域 / 商店整体 / 网页 UI） ---------- */
  STYLES: [
    { id: 'rustic',  name: '田园小屋',   v: { radius: 18, border: 1, shadow: 1, head: 'serif', dens: 1 }, desc: '圆润、柔和的木色与棉布感，像外婆家的杂货铺。' },
    { id: 'modern',  name: '极简现代',   v: { radius: 8,  border: 0, shadow: 0, head: 'sans', dens: 1 }, desc: '干净利落，线条分明，功能至上。' },
    { id: 'retro',   name: '复古杂货铺', v: { radius: 4,  border: 2, shadow: 1, head: 'serif', dens: 1.08 }, desc: '双线描边、紧凑排布，旧时代的百货商店。' },
    { id: 'nordic',  name: '北欧清新',   v: { radius: 12, border: 1, shadow: 0, head: 'sans', dens: 0.94 }, desc: '留白与浅色，空气感十足。' },
    { id: 'wafu',    name: '日式和风',   v: { radius: 6,  border: 1, shadow: 0, head: 'serif', dens: 1 }, desc: '克制的暖调与细线，安静而妥帖。' }
  ],

  /* ---------- 厨房设备 ---------- */
  KITCHEN: {
    baseTools: ['stove', 'wok', 'pot', 'knife', 'board', 'spatula', 'steamer'],
    tools: {
      stove:  { name: '燃气灶', base: true },
      wok:    { name: '炒锅', base: true },
      pot:    { name: '汤锅', base: true },
      knife:  { name: '菜刀', base: true },
      board:  { name: '砧板', base: true },
      spatula:{ name: '锅铲', base: true },
      steamer:{ name: '蒸锅', base: true },
      riceCooker: { name: '电饭煲', cost: 2000, desc: '解锁米饭、煲仔类餐品' },
      oven:       { name: '烤箱', cost: 8000, desc: '解锁烘焙、焗烤类餐品' },
      microwave:  { name: '微波炉', cost: 3000, desc: '热饭热菜更快（速食耗时减半）' },
      fridge:     { name: '冰箱', cost: 5000, desc: '生鲜保质期 +3 天' }
    }
  },

  /* ---------- 餐馆 DLC（超市 3 级解锁） ---------- */
  RESTAURANT: [
    { lv: 1, name: '快餐亭',   cost: 10000, income: 80,  portions: 5,  desc: '窗口卖盒饭，队伍排到门口。' },
    { lv: 2, name: '小餐馆',   cost: 40000, income: 200, portions: 10, desc: '几张圆桌，几盏暖灯。' },
    { lv: 3, name: '餐厅',     cost: 120000, income: 500, portions: 18, desc: '菜单越写越长，回头客越来越多。' },
    { lv: 4, name: '高级餐厅', cost: 350000, income: 1200, portions: 30, desc: '烛台、桌布、侍者。末日里的体面。' },
    { lv: 5, name: '星级餐厅', cost: 900000, income: 3000, portions: 50, desc: '一座难求。人们为一口热饭跨越百里。' }
  ],

  /* ---------- 酒店 DLC（超市 6 级解锁） ---------- */
  HOTEL: [
    { lv: 1, name: '大通铺',   cost: 15000, income: 150, desc: '一排铺位，遮风挡雨。' },
    { lv: 2, name: '客栈',     cost: 60000, income: 400, desc: '独立小间，热水供应。' },
    { lv: 3, name: '宾馆',     cost: 180000, income: 1000, desc: '标准客房，床单雪白。' },
    { lv: 4, name: '酒店',     cost: 500000, income: 2500, desc: '大堂有吊灯，走廊有地毯。' },
    { lv: 5, name: '度假酒店', cost: 1200000, income: 6000, desc: '泳池、花园、露台。末日最奢侈的梦境。' }
  ],

  /* ---------- 网络店铺（超市 7 级 + 网络专区解锁） ---------- */
  SHOPS: [
    { id: 'clothes',  name: '服装店', cost: 300000,  income: 400,  desc: '货架挂满外套与衬衫。', fx: '衣物热销' },
    { id: 'cinema',   name: '电影院', cost: 600000,  income: 900,  desc: '银幕亮起时，人们短暂忘记末日。', fx: '娱乐品热销，客流+2' },
    { id: 'comshop',  name: '通讯店', cost: 500000,  income: 600,  desc: '对讲机、电池、卫星电话。', fx: '客流+2' },
    { id: 'carshop',  name: '车行',   cost: 1500000, income: 2500, desc: '改装车、燃油、配件。出行不再靠腿。', fx: '客流+3，顾客走得更远' }
  ],

  /* ---------- 超市搬迁（保护罩 5 级后解锁） ---------- */
  RELOCATIONS: [
    { id: 'riverside', name: '河畔营地', desc: '水源充足，但潮气重。', fx: '客流量+20%，探索遇险-20%' },
    { id: 'cityedge',  name: '城市边缘', desc: '废墟里的残余人流经过这里。', fx: '客流量+40%，探索遇险+30%' },
    { id: 'wasteland', name: '荒野深处', desc: '人迹罕至，但垃圾成山。', fx: '客流量-20%，探索收益+50%' }
  ],

  /* ---------- 库存上限 ---------- */
  INVENTORY_CAP: 1000,
  WAREHOUSE_BONUS: 1500
};

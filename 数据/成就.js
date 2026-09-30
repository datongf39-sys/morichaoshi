/* ============================================================
   数据 / 成就 —— 成就商店与身份兑换
   身份系统：普通上班族免费；其余身份需消耗成就点兑换。
   成就点跨周目永久累计（保存在浏览器本地），
   因此"其他身份全部好加成"的平衡前提是：先玩一局攒成就点，才能兑换强力身份。
   ============================================================ */
window.DATA = window.DATA || {};
DATA.achievements = {
  /* 身份兑换价格（成就点） */
  identityCost: {
    office: 0,     // 普通上班族：免费
    student: 60,   // 大学生
    courier: 100,  // 快递员
    coach: 80,     // 健身教练
    teacher: 120,  // 中学教师
    chef: 150,     // 私房菜大厨
    doctor: 200,   // 社区医生
    coder: 250,    // 软件工程师
    soldier: 300   // 退伍军人
  },

  /* 成就列表：type 为判定依据，target 为目标值，points 为奖励成就点 */
  list: [
    { id: 'first_sale',   name: '第一桶金',     desc: '赚到第一笔积分',        type: 'cumPoints', target: 1,     points: 5 },
    { id: 'income_1k',    name: '小有盈利',     desc: '累计赚取 1000 积分',     type: 'cumPoints', target: 1000,  points: 10 },
    { id: 'income_10k',   name: '日进斗金',     desc: '累计赚取 10000 积分',    type: 'cumPoints', target: 10000, points: 20 },
    { id: 'income_100k',  name: '末日财阀',     desc: '累计赚取 100000 积分',   type: 'cumPoints', target: 100000, points: 40 },
    { id: 'cust_10',      name: '门庭若市',     desc: '录入 10 位顾客',         type: 'customers', target: 10,   points: 10 },
    { id: 'cust_50',      name: '远近闻名',     desc: '录入 50 位顾客',         type: 'customers', target: 50,   points: 20 },
    { id: 'emp_1',        name: '第一个帮手',   desc: '招募第 1 名员工',        type: 'employees', target: 1,    points: 15 },
    { id: 'emp_5',        name: '小小团队',     desc: '拥有 5 名员工',          type: 'employees', target: 5,    points: 30 },
    { id: 'explore_10',   name: '拾荒达人',     desc: '外出探索 10 次',         type: 'explore',   target: 10,   points: 15 },
    { id: 'cook_10',      name: '厨艺初成',     desc: '烹饪 10 次',             type: 'cook',      target: 10,   points: 15 },
    { id: 'store_2',      name: '开分店',       desc: '超市升到 2 级',          type: 'storeLv',   target: 2,    points: 15 },
    { id: 'store_5',      name: '仓储大亨',     desc: '超市升到 5 级',          type: 'storeLv',   target: 5,    points: 30 },
    { id: 'store_10',     name: '庇护所之王',   desc: '超市升到 10 级',         type: 'storeLv',   target: 10,   points: 80 },
    { id: 'day_30',       name: '满月',         desc: '在末日中存活 30 天',     type: 'days',      target: 30,   points: 20 },
    { id: 'day_100',      name: '百日',         desc: '在末日中存活 100 天',    type: 'days',      target: 100,  points: 50 },
    { id: 'day_365',      name: '一周年',       desc: '在末日中存活一整年',     type: 'days',      target: 365,  points: 120 },
    { id: 'crystal_50',   name: '晶核收藏家',   desc: '累计收取 50 颗晶核',     type: 'crystals',  target: 50,   points: 25 },
    { id: 'dlc_1',        name: '多元经营',     desc: '解锁 1 个 DLC（餐馆/酒店/店铺）', type: 'dlc', target: 1, points: 20 },
    { id: 'shield_5',     name: '铜墙铁壁',     desc: '保护罩升到 5 级',        type: 'shieldLv',  target: 5,    points: 30 },
    { id: 'hazard_5',     name: '天灾人祸',     desc: '经历 5 次末日轮换危害',  type: 'hazard',    target: 5,    points: 25 }
  ]
};

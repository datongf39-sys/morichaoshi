/* ============================================================
   数据 / 金手指
   拼夕夕系统：每日随机 60~100 个品类，进货价 = 商品售价的 20%
   变废为宝系统：每日随机 40~80 个品类（可重复），外出探索捡垃圾 → 对应产品倍数奖励
   平衡思路：
     拼夕夕 —— 开局送新手积分，进货花钱（20% 售价），但即时、安全、品类多；
     变废为宝 —— 开局 0 积分，探索免费捡物资（花体力、时间，有遇险概率），
                  且独有晶核掉落。两条路线一花钱一花时间，长期收益相当。
   ============================================================ */
window.DATA = window.DATA || {};
DATA.golden = {
  pddDaily: [60, 100],       // 每日随机品类数范围（拼夕夕品类更多）
  wasteDaily: [40, 80],      // 每日随机品类数范围
  pddRate: 0.2,              // 拼夕夕进货价 = 商品售价的 20%（真实扣积分）
  pddStartPoints: 1000,      // 拼夕夕开局新手积分
  /* 变废为宝：垃圾 → 产品 × 倍数（mult 为每份垃圾的产出倍数） */
  wastePool: [
    { pid: 'dr01', mult: 3,  name: '可口可乐易拉罐' },
    { pid: 'dr02', mult: 3,  name: '百事可乐塑料瓶' },
    { pid: 'wt01', mult: 4,  name: '农夫山泉空瓶' },
    { pid: 'wt03', mult: 4,  name: '康师傅水瓶' },
    { pid: 'in01', mult: 3,  name: '泡面包装袋' },
    { pid: 'in02', mult: 3,  name: '酸菜面袋' },
    { pid: 'sn01', mult: 3,  name: '薯片袋' },
    { pid: 'sn05', mult: 3,  name: '饼干包装盒' },
    { pid: 'in10', mult: 4,  name: '火腿肠外皮' },
    { pid: 'in11', mult: 4,  name: '火腿肠包装' },
    { pid: 'in18', mult: 2,  name: '午餐肉空罐' },
    { pid: 'aq14', mult: 2,  name: '金枪鱼罐头盒' },
    { pid: 'eg05', mult: 2,  name: '牛奶盒' },
    { pid: 'eg01', mult: 3,  name: '碎蛋壳' },
    { pid: 'dl01', mult: 1,  name: '洗衣液空桶' },
    { pid: 'dl04', mult: 2,  name: '旧香皂头' },
    { pid: 'dl13', mult: 2,  name: '废电池' },
    { pid: 'dl07', mult: 2,  name: '牙膏皮' },
    { pid: 'dl09', mult: 2,  name: '废纸箱' },
    { pid: 'dl19', mult: 1,  name: '破雨伞' },
    { pid: 'gr05', mult: 2,  name: '散落的面粉袋' },
    { pid: 'gr16', mult: 2,  name: '糖包' },
    { pid: 'gr10', mult: 2,  name: '酱油空瓶' },
    { pid: 'en05', mult: 2,  name: '旧书' },
    { pid: 'en01', mult: 3,  name: '旧扑克牌' },
    { pid: 'ct03', mult: 1,  name: '破旧T恤' },
    { pid: 'ct07', mult: 2,  name: '旧袜子' },
    { pid: 'ms30', mult: 1,  name: '旧铁锅' },
    { pid: 'ms36', mult: 1,  name: '报废微波炉' },
    { pid: 'dr21', mult: 1,  name: '名酒空瓶' },
    { pid: 'vg03', mult: 3,  name: '发芽的土豆堆' },
    { pid: 'fr05', mult: 3,  name: '烂苹果堆' },
    { pid: 'gr21', mult: 2,  name: '散粉丝' },
    { pid: 'in20', mult: 2,  name: '黑芝麻糊空袋' },
    { pid: 'sn13', mult: 3,  name: '奶糖包装' }
  ],
  /* 探索特殊掉落：晶核（按阶段出现） */
  specialFinds: [
    { id: 'crystal', name: '晶核', desc: '废墟深处的能量结晶。' }
  ]
};

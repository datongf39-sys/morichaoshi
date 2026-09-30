/* ============================================================
   脚本 / 状态 —— 游戏状态创建、保存、读取
   ============================================================ */
window.SG = window.SG || {};
SG.State = (function () {
  var KEY = 'doomsday_supermarket_v1';
  var state = null;

  function baseStats(profile) {
    var cfg = DATA.config;
    var id = cfg.IDENTITIES.filter(function (x) { return x.id === profile.identityId; })[0] || cfg.IDENTITIES[0];
    var stats = { sat: 75, thirst: 75, hp: 85, ent: 65, hyg: 75 };
    (id.mods || {}).sat && (stats.sat += id.mods.sat);
    (id.mods || {}).thirst && (stats.thirst += id.mods.thirst);
    (id.mods || {}).hp && (stats.hp += id.mods.hp);
    (id.mods || {}).ent && (stats.ent += id.mods.ent);
    (id.mods || {}).hyg && (stats.hyg += id.mods.hyg);
    var stamina = 100 + (id.mods.stamina || 0);
    return { stats: stats, stamina: clampSta(stamina), identity: id };
  }

  function clampSta(v) { return Math.max(20, Math.min(140, v)); }

  function createState(profile) {
    var b = baseStats(profile);
    var cfg = DATA.config;
    var s = {
      version: 1,
      created: {
        name: profile.name, gender: profile.gender, age: profile.age,
        identityId: profile.identityId, goldenFinger: profile.goldenFinger,
        cook: profile.cook, colorId: profile.colorId, styleId: profile.styleId
      },
      day: 1,
      minute: cfg.DAY_START_MIN,
      stats: b.stats, stamina: b.stamina,
      /* 开局积分差分：拼夕夕系统送新手积分；变废为宝 0 积分，靠探索自行收集 */
      points: profile.goldenFinger === 'pdd' ? (DATA.golden.pddStartPoints || 1000) : 0,
      cumPoints: 0,
      crystals: {},                        // 收取的晶核（按阶）
      totalBuys: 0,                        // 累计顾客购买笔数（解锁非必需品销售门槛）
      hotelDays: 0,                        // 酒店运营天数（与 totalBuys 取较松者作为门槛）
      reputation: 50,                      // 名声 0~100（初始 50，成交加、拒客扣，影响客流）
      nutr: { carb: 0, prot: 0, fat: 0, vit: 0, water: 0 },
      nutrDays: [],
      malnutrition: false,
      diseases: {},                        // {diseaseId: {startDay, days}}
      hpRegenUntil: 0,
      period: { active: false, nextDay: SG.u.rint(5, 25), daysLeft: 0 },
      inventory: {},                       // pid -> qty（仓库件数）
      stockDay: {},                        // pid -> day（保质期起点）
      shelf: {},                           // pid -> qty（货架上待售件数）
      visitors: [],                        // 店内待接待的顾客 id 队列
      hazard: null,                        // 今日末日轮换危害 {id, day}
      bases: null,                         // 基地地图（中期后开放，随机生成）
      clothes: {
        lastChangeDay: 1,
        current: 'ct03',
        sets: { ct03: { clean: 1, dirty: 0 }, ct04: { clean: 2, dirty: 0 }, ct12: { clean: 2, dirty: 0 }, ct07: { clean: 2, dirty: 0 } }
      },
      store: {
        level: 1, shieldLv: 1, areas: {},
        kitchenTools: cfg.KITCHEN.baseTools.slice(),
        kitchenUpgrades: {},
        newCustomers: 0,
        location: null,
        dlc: { restaurant: { lv: 0, menu: [] }, hotel: { lv: 0 }, shops: {} },
        autoRestock: false,
        cashiers: [],                       // 安排在收银台的员工 id（可自动售卖）
        facilities: SG.Fac.buildFor(1)      // 一级小卖部：货架×3 + 冷藏柜 + 冷冻柜
      },
      gf: { pddDay: 0, pddItems: [], wasteDay: 0, wasteItems: [], exploreCount: 0, cookCount: 0, hazardCount: 0 },
      customers: {}, custSeq: 1,
      employees: [],
      orderDay: 0, orderMenu: [],
      logs: [], history: [],
      ending: null
    };
    /* 开局零库存：货架空空，一切从补货/探索开始 */
    if (profile.cook) s.store.areas.kitchen = true;
    return s;
  }

  function save() {
    if (!state) return;
    try { localStorage.setItem(KEY, JSON.stringify(state)); return true; }
    catch (e) { console.warn('存档失败', e); return false; }
  }
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return null;
      state = JSON.parse(raw);
      if (!state.created || !state.store) return null;
      migrate(state);
      return state;
    } catch (e) { return null; }
  }
  /* 旧存档字段迁移：补齐新系统字段 */
  function migrate(s) {
    if (!s.shelf) s.shelf = {};
    if (!s.visitors) s.visitors = [];
    if (!s.hazard) s.hazard = null;
    if (!s.bases) s.bases = null;
    if (!s.store.cashiers) s.store.cashiers = [];
    if (!s.gf) s.gf = {};
    if (s.gf.exploreCount == null) s.gf.exploreCount = 0;
    if (s.gf.cookCount == null) s.gf.cookCount = 0;
    if (s.gf.hazardCount == null) s.gf.hazardCount = 0;
    if (s.totalBuys == null) s.totalBuys = 0;
    if (s.hotelDays == null) s.hotelDays = 0;
    if (s.reputation == null) s.reputation = 50;
    /* 设施系统：旧档无设施 → 按当前等级初始化，旧平铺货架收回仓库重新上货 */
    if (!s.store.facilities) SG.Fac.ensure(s);
    /* 旧搬迁位置（固定选址）失效，回到荒野 */
    if (s.store.location && !(s.bases || []).some(function (b) { return b.id === s.store.location; })) {
      s.store.location = null;
    }
    s.employees = (s.employees || []).map(function (e) { if (!e.shift) e.shift = 'morning'; return e; });
  }
  function clearSave() { try { localStorage.removeItem(KEY); } catch (e) { } }
  function hasSave() { try { return !!localStorage.getItem(KEY); } catch (e) { return false; } }
  function setState(s) { state = s; }
  function getState() { return state; }

  return {
    createState: createState, save: save, load: load, clearSave: clearSave,
    hasSave: hasSave, setState: setState, getState: getState
  };
})();

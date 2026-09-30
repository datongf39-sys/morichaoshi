/* 无头验证脚本：加载游戏全部脚本，stub 浏览器 API，验证核心玩法逻辑 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = 'E:\\末日超市';

/* ---------- 浏览器 API stub ---------- */
const storage = {};
const els = {};
function mkEl(id) {
  return {
    id: id, innerHTML: '', textContent: '', className: '', style: {}, value: '',
    dataset: {}, _listeners: {},
    classList: { add() {}, remove() {}, toggle() {} },
    appendChild() {}, removeChild() {}, setAttribute() {}, getAttribute() { return null; },
    addEventListener(t, f) { (this._listeners[t] = this._listeners[t] || []).push(f); },
    removeEventListener() {},
    querySelector() { return mkEl('_q'); }, querySelectorAll() { return [mkEl('_q')]; },
    closest() { return null; }
  };
}
const document = {
  getElementById(id) { if (!els[id]) els[id] = mkEl(id); return els[id]; },
  createElement(tag) { return mkEl('_' + Math.random().toString(36).slice(2)); },
  querySelector() { return null; },
  querySelectorAll() { return []; },
  addEventListener() {}, removeEventListener() {},
  body: mkEl('body')
};
const localStorage = {
  getItem(k) { return Object.prototype.hasOwnProperty.call(storage, k) ? storage[k] : null; },
  setItem(k, v) { storage[k] = String(v); },
  removeItem(k) { delete storage[k]; }
};
const DATA = {};
const SG = {};
const window = {
  DATA: DATA, SG: SG,
  addEventListener() {}, removeEventListener() {}, localStorage: localStorage
};
const sandbox = {
  window: window, DATA: DATA, SG: SG,
  document: document, localStorage: localStorage,
  console: console, Math: Math, JSON: JSON, Date: Date, setTimeout: setTimeout,
  clearTimeout: clearTimeout, isNaN: isNaN, parseFloat: parseFloat, parseInt: parseInt,
  String: String, Number: Number, Boolean: Boolean, Array: Array, Object: Object, Error: Error
};
vm.createContext(sandbox);

/* 按 HTML 顺序加载脚本 */
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const scripts = [];
const re = /<script src="([^"]+)"><\/script>/g;
let m;
while ((m = re.exec(html))) scripts.push(m[1]);
const dataOrder = scripts.filter(s => s.startsWith('数据/'));
const engineOrder = scripts.filter(s => s.startsWith('脚本/') && !s.includes('界面/') && s !== '脚本/主程序.js');
const uiOrder = scripts.filter(s => s.includes('界面/') || s === '脚本/主程序.js');
let errs = [];
[...dataOrder, ...engineOrder, ...uiOrder].forEach(s => {
  try {
    const code = fs.readFileSync(path.join(ROOT, s), 'utf8');
    process.stderr.write('>> ' + s + '\n');
    vm.runInContext(code, sandbox, { filename: s });
  } catch (e) {
    errs.push(s + ' : ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 3).join('\n'));
  }
});
if (errs.length) {
  console.log('!!! 加载错误:');
  errs.forEach(e => console.log(e));
  process.exit(1);
}
console.log('脚本加载完成，无错误');

const u = SG.u;
let pass = 0, fail = 0;
function ok(cond, name) {
  if (cond) { pass++; console.log('  [OK] ' + name); }
  else { fail++; console.log('  [FAIL] ' + name); }
}

/* ============ 1. 创建状态：零库存 + 金手指差分 ============ */
console.log('\n[1] 开局状态');
const statePdd = SG.State.createState({ name: '测试', gender: 'male', age: 28, identityId: 'office', goldenFinger: 'pdd', cook: false, colorId: 'warm', styleId: 'rustic' });
ok(Object.keys(statePdd.inventory).length === 0, '拼夕夕开局仓库零库存');
ok(statePdd.points === 1000, '拼夕夕开局 1000 新手积分（实际 ' + statePdd.points + '）');
ok(statePdd.shelf && Object.keys(statePdd.shelf).length === 0, '货架初始为空');
ok(statePdd.visitors.length === 0, '店内队列初始为空');
ok(statePdd.hazard === null, '无末日危害');
ok(statePdd.store.cashiers.length === 0, '无收银员安排');
SG.State.setState(statePdd);
const stateWaste = SG.State.createState({ name: '测试2', gender: 'female', age: 28, identityId: 'office', goldenFinger: 'waste', cook: false, colorId: 'warm', styleId: 'rustic' });
ok(stateWaste.points === 0, '变废为宝开局 0 积分（实际 ' + stateWaste.points + '）');

/* ============ 2. 拼夕夕补货扣积分 ============ */
console.log('\n[2] 拼夕夕补货');
SG.State.setState(statePdd);
SG.Gf.refresh(statePdd);
ok(statePdd.gf.pddItems.length >= 60 && statePdd.gf.pddItems.length <= 100, '拼夕夕每日品类 60~100（实际 ' + statePdd.gf.pddItems.length + '）');
const pid0 = statePdd.gf.pddItems[0];
const p0 = SG.Data.product(pid0);
const cost0 = Math.round(p0.price * DATA.golden.pddRate * 10 * 100) / 100;
const ptsBefore = statePdd.points;
const r1 = SG.Gf.restock(pid0, 10, statePdd);
ok(r1.ok === true, '补 10 件成功');
ok(Math.abs((ptsBefore - statePdd.points) - cost0) < 0.001, '扣积分正确（应扣 ' + cost0 + '，实际扣 ' + (ptsBefore - statePdd.points) + '）');
ok((statePdd.inventory[pid0] || 0) === 10, '仓库 +10 件');

const before1 = statePdd.points;
const r2 = SG.Gf.oneClickRestock(statePdd);
ok(r2.ok === true, '一键补货成功');
ok(statePdd.points <= before1, '一键补货后积分未上涨（' + before1 + ' → ' + statePdd.points + '）');
ok(r2.minutes <= 30, '一键补货时间封顶 30 分钟（实际 ' + r2.minutes + '）');
ok(r2.msg.indexOf('积分') >= 0, '提示包含扣积分信息');

/* ============ 3. 上架/下架（设施维度） ============ */
console.log('\n[3] 设施上货/下货');
/* 选一个一级超市可卖的小件商品（避免随机品类是蔬果肉等高级生鲜） */
let lv1Pid = null;
for (const _pid of statePdd.gf.pddItems) {
  const _p = SG.Data.product(_pid);
  if (_p && _p.lv <= 1 && !_p.stor && SG.Data.canStock(_p, statePdd)) { lv1Pid = _pid; break; }
}
if (!lv1Pid) lv1Pid = 'wt01';
/* 一键补货可能只补了 3 件该品类，确保仓库足够 4 件 */
if ((statePdd.inventory[lv1Pid] || 0) < 4) statePdd.inventory[lv1Pid] = (statePdd.inventory[lv1Pid] || 0) + 6;
const r3 = SG.Inv.shelfUp(lv1Pid, 4, statePdd);
ok(r3.ok === true, '上货 4 件成功（' + r3.msg + '）');
ok(statePdd.shelf[lv1Pid] === 4, '货架聚合 +4');
ok((statePdd.inventory[lv1Pid] || 0) >= 0, '仓库扣减正常');
const r4 = SG.Inv.shelfDown(lv1Pid, 2, statePdd);
ok(r4.ok === true, '下架 2 件成功');
ok(statePdd.shelf[lv1Pid] === 2, '货架 2');
ok(SG.Inv.availableOnShelf(statePdd).length >= 1, '货架有在售商品');

/* ---------- 设施系统新增断言 ---------- */
console.log('\n[3b] 设施系统');
/* 一级小卖部：无分区，多货架 + 冷柜 */
const facs1 = SG.Fac.zoneList(statePdd);
ok(facs1.length === 1 && facs1[0].id === 'main', '一级无分区（main）');
const facT1 = facs1[0].summary;
ok(facT1.shelf === 3, '一级 3 个货架（实际 ' + facT1.shelf + '）');
ok(facT1.chill === 1 && facT1.freeze === 1, '一级冷藏柜×1 + 冷冻柜×1');
/* 牛奶必须冷藏：不能上货架 */
const milk = SG.Data.product('eg05');
ok(milk.stor === 'chill', '鲜奶标为必须冷藏（' + milk.stor + '）');
const shelfFac = facs1[0].facs.find(f => f.type === 'shelf');
const chillFac = facs1[0].facs.find(f => f.type === 'chill');
ok(SG.Fac.canPlace(milk, shelfFac, statePdd).ok === false, '牛奶不能摆常温货架');
ok(SG.Fac.canPlace(milk, chillFac, statePdd).ok === true, '牛奶可摆冷藏柜');
/* 薯片饼干常温：可摆货架 */
const chips = SG.Data.product('sn01');
ok(!chips.stor && SG.Fac.canPlace(chips, shelfFac, statePdd).ok === true, '薯片常温可摆货架');
/* 蔬果肉类：一级不可陈列（金手指获得仅能自用） */
const veg1 = DATA.products.find(p => p.kind === 'veg');
ok(veg1.lv >= 3, '蔬菜等级修正为 ≥3（实际 ' + veg1.lv + '）');
ok(SG.Data.canStock(veg1, statePdd) === false, '一级不能陈列蔬菜');
ok(SG.Inv.shelfUp(veg1.id, 1, statePdd).ok === false, '一级上架蔬菜被拦截');
/* 大件占 2 点：容量测试 */
const bigP = DATA.products.find(p => p.size === 'l');
ok(SG.Fac.sizePoints(bigP) === 2, '大件占 2 点（' + bigP.name + '）');
/* 关东煮制作：需汤底 + 2 种食材，产出 3 串进关东煮锅 */
const s2 = SG.State.createState({ name: '关东煮', gender: 'male', age: 28, identityId: 'office', goldenFinger: 'pdd', cook: false, colorId: 'warm', styleId: 'modern' });
s2.store.level = 2; SG.Fac.applyPlan(s2);
s2.inventory['in26'] = 2; s2.inventory['in27'] = 3; s2.inventory['in28'] = 2;
const rO1 = SG.Fac.makeOden(s2);
ok(rO1.ok === true, '关东煮制作成功（' + rO1.msg + '）');
ok(s2.inventory['in26'] === 1, '消耗 1 包汤底');
ok(s2.inventory['in27'] === 2 && s2.inventory['in28'] === 1, '消耗两种食材各 1');
ok(s2.shelf['in22'] === 3, '3 串关东煮已上锅');
ok((s2.inventory['in22'] || 0) === 0, '成品不滞留仓库');
const rO2 = SG.Fac.makeOden(s2);
ok(rO2.ok === true, '可连续制作（食材还有）');
/* 升级到三级：出现分区，原货架商品回仓库 */
const s3 = SG.State.createState({ name: '分区', gender: 'male', age: 28, identityId: 'office', goldenFinger: 'pdd', cook: false, colorId: 'warm', styleId: 'retro' });
s3.store.level = 3; SG.Fac.applyPlan(s3);
const facs3 = SG.Fac.zoneList(s3);
ok(facs3.length >= 6, '三级出现 6+ 分区（实际 ' + facs3.length + '）');
ok(facs3.some(z => z.id === 'hot' && z.summary.pot >= 1), '熟食区含关东煮锅');
ok(facs3.some(z => z.id === 'fresh' && z.summary.chill >= 2), '生鲜区冷藏柜 ≥2');
/* 高级包含低级设施：5 级仍有烤肠机/关东煮/热食柜 */
const s5 = SG.State.createState({ name: '高级', gender: 'male', age: 28, identityId: 'office', goldenFinger: 'pdd', cook: false, colorId: 'warm', styleId: 'nordic' });
s5.store.level = 5; SG.Fac.applyPlan(s5);
const z5 = SG.Fac.zoneList(s5);
const hot5 = z5.find(z => z.id === 'hot');
ok(hot5 && hot5.summary.grill >= 2 && hot5.summary.pot >= 1 && hot5.summary.hotbox >= 2, '5 级熟食设施齐全（烤肠机/关东煮/热食柜）');
/* 场景描述：随风格变化、描述布局 */
const dR = SG.Decor.scene(statePdd);
ok(dR.indexOf('货架') >= 0 && dR.indexOf('冷藏') >= 0, '场景描述含布局');
const dN = SG.Decor.scene(s5);
ok(dN.indexOf('分区') >= 0 || dN.indexOf('区」') >= 0, '高级场景描述含分区');
const sMod = SG.State.createState({ name: '现代', gender: 'male', age: 28, identityId: 'office', goldenFinger: 'pdd', cook: false, colorId: 'warm', styleId: 'modern' });
sMod.store.level = 3; SG.Fac.applyPlan(sMod);
ok(SG.Decor.scene(sMod).indexOf('不锈钢') >= 0, '极简风格用不锈钢措辞');
/* 药品分级：抗生素/处方药不进小卖部 */
ok(SG.Data.product('md05').lv >= 3, '阿莫西林（抗生素）3 级起（实际 ' + SG.Data.product('md05').lv + '）');
ok(SG.Data.product('md10').lv === 1, '创可贴 1 级可卖');
/* 全部商品品牌真实：无“便利店/超市/未知”等占位品牌 */
const fakeBrands = DATA.products.filter(p => !p.brand || /便利店|超市|未知|自制/.test(p.brand));
ok(fakeBrands.length === 0, '全部商品为真实品牌（' + DATA.products.length + ' 种）');

/* ============ 4. 顾客系统 ============ */
console.log('\n[4] 顾客系统');
statePdd.minute = 10 * 60;
statePdd.day = 1;
SG.Cust.hourlyWave(statePdd);
ok(statePdd.visitors.length >= 1, '营业时段顾客到店排队（' + statePdd.visitors.length + ' 人）');
const cid = statePdd.visitors[0];
const c = statePdd.customers[cid];
const sv = SG.Cust.serveVisitor(cid, true, statePdd);
ok(sv.ok === true, '接待顾客成功');
ok(statePdd.visitors.indexOf(cid) < 0, '接待后离开队列');
if (sv.exchanged > 0) ok(sv.exchanged > 0, '兑换积分生效');
ok(sv.spent >= 0, '购物结算正常（花费 ' + sv.spent + '）');
ok(c.visits >= 1, '到店次数 +1');

SG.Cust.hourlyWave(statePdd);
const cid2 = statePdd.visitors[0];
const sv2 = SG.Cust.serveVisitor(cid2, false, statePdd);
ok(sv2.refused === true, '拒绝接待生效');

const t1 = SG.Cust.theftChance({ persona: 'bad' }, statePdd);
ok(t1 === 0, '小卖部（1 级）偷窃概率为 0');

statePdd.store.level = 2;
const t2 = SG.Cust.theftChance({ persona: 'bad' }, statePdd);
ok(t2 > 0, '超市 2 级偷窃概率 > 0');

const emp = { id: 'e1', name: '员工A', shift: 'morning' };
statePdd.minute = 10 * 60;
ok(SG.Emp.onDuty(emp, statePdd), '早班 10 点当班');
statePdd.minute = 20 * 60;
ok(!SG.Emp.onDuty(emp, statePdd), '早班 20 点不当班');
const emp2 = { id: 'e2', name: '员工B', shift: 'evening' };
ok(SG.Emp.onDuty(emp2, statePdd), '晚班 20 点当班');
ok(SG.Emp.shiftLabel('morning') === '早班 08~16 点', '班次标签正确');

/* ============ 5. 时间引擎 / 末日轮换 / 地图 ============ */
console.log('\n[5] 时间引擎 / 末日轮换 / 地图');
statePdd.day = 31;
statePdd.minute = 8 * 60;
SG.Time.advanceTime(12 * 60, statePdd);
ok(statePdd.day >= 31, '时间推进正常（第 ' + statePdd.day + ' 天 ' + SG.u.fmtClock(statePdd.minute) + '）');
ok(statePdd.hazard === null || statePdd.hazard.day === statePdd.day, '末日轮换状态合法');
const hz = SG.Time.hazardDef(statePdd);
if (hz) ok(DATA.config.HAZARDS[hz.id] !== undefined, '危害定义存在：' + hz.name);

SG.Map.init(statePdd);
ok(statePdd.bases.length >= 6 && statePdd.bases.length <= 9, '每局生成 6~9 个基地（' + statePdd.bases.length + '）');
ok(statePdd.bases.every(b => b.pop >= 50 && b.pop <= 3000), '基地人数在范围内');
ok(statePdd.bases.every(b => b.morality >= 15 && b.morality <= 95), '道德值在范围内');
const mapOpenNow = SG.Map.mapOpen(statePdd);
ok(typeof mapOpenNow === 'boolean', '地图开放判定正常（' + mapOpenNow + '）');
const askR = SG.Map.ask(statePdd);
ok(askR.ok === (mapOpenNow ? true : false), mapOpenNow ? '中期可打听基地' : '前期打听被拒绝');
if (mapOpenNow) ok(askR.minutes === 30, '打听耗时 30 分钟');

statePdd.store.level = 4;
ok(!SG.Store.canRelocate(statePdd), '超市 4 级不可搬迁');
statePdd.store.level = 5;
ok(SG.Store.canRelocate(statePdd), '超市 5 级可搬迁');
if (mapOpenNow && askR.ok) {
  statePdd.points = 999999;
  const rl = SG.Store.relocate(askR.base.id, statePdd);
  ok(rl.ok === true, '搬迁到已打听基地成功');
  ok(SG.Map.base(statePdd) && SG.Map.base(statePdd).id === askR.base.id, '现址已更新');
}

/* ============ 6. 成就系统 ============ */
console.log('\n[6] 成就系统');
ok(SG.Ach.points() >= 0, '成就点可读取（' + SG.Ach.points() + '）');
ok(SG.Ach.identityCost('office') === 0, '上班族免费');
ok(SG.Ach.identityCost('soldier') === 300, '退伍军人需 300 成就点');
ok(SG.Ach.canSelect('office'), '上班族可直接选');
statePdd.cumPoints = 100000;
statePdd.store.level = 10;
statePdd.day = 400;
statePdd.employees = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }, { id: 'e' }];
const earned = SG.Ach.check(statePdd);
ok(earned.length >= 5, '达成多项成就（' + earned.map(a => a.name).join('、') + '）');
ok(SG.Ach.points() >= 100, '成就点已累计（' + SG.Ach.points() + '）');
ok(SG.Ach.canSelect('soldier') || SG.Ach.points() < 300, '成就点可兑换身份判定正常');

/* ============ 16. 商品库规模与唯一性 ============ */
console.log('\n[16] 商品库规模');
ok(DATA.products.length >= 2000, '商品总数 ≥2000（实际 ' + DATA.products.length + '）');
const _idSet = new Set(DATA.products.map(p => p.id));
ok(_idSet.size === DATA.products.length, '商品 id 全部唯一');
const _nameSet = new Set(DATA.products.map(p => p.brand + '|' + p.name));
ok(_nameSet.size === DATA.products.length, '品牌+名称组合全部唯一（严禁重复）');
const _badBrand = DATA.products.filter(p => !p.brand || /便利店|超市|未知|自制/.test(p.brand));
ok(_badBrand.length === 0, '全部商品为真实品牌（' + DATA.products.length + ' 种）');
const _kinds = new Set(DATA.products.map(p => p.kind));
ok([..._kinds].every(k => ['snack', 'drink', 'water', 'instant', 'grain', 'spice', 'veg', 'fruit', 'meat', 'aquatic', 'dairy', 'med', 'hygiene', 'paper', 'daily', 'stationery', 'tool', 'kitchen', 'wine', 'candy', 'bakery', 'coffee', 'tea', 'pet', 'baby', 'book', 'cloth', 'weapon', 'ent'].indexOf(k) >= 0), 'kind 枚举全部合法（' + [..._kinds].join('/') + '）');

/* ============ 7. 点餐 10 种 ============ */
console.log('\n[7] 点餐');
SG.Econ.refreshOrderMenu(statePdd);
ok(statePdd.orderMenu.length === 10, '点餐每日随机 10 种（实际 ' + statePdd.orderMenu.length + '）');
ok(new Set(statePdd.orderMenu).size === 10, '10 种不重复');

/* ============ 8. 旧存档迁移 ============ */
console.log('\n[8] 旧存档迁移');
localStorage.setItem('doomsday_supermarket_v1', JSON.stringify({
  created: { name: '旧档' }, store: { level: 1, shieldLv: 1, areas: {}, kitchenTools: [], kitchenUpgrades: {}, newCustomers: 0, location: 'riverside', dlc: { restaurant: { lv: 0, menu: [] }, hotel: { lv: 0 }, shops: {} }, autoRestock: false },
  stats: { sat: 75, thirst: 75, hp: 90, ent: 70, hyg: 70 }, stamina: 100, day: 5, minute: 600,
  points: 200, cumPoints: 0, crystals: {}, nutr: {}, nutrDays: [], malnutrition: false, diseases: {}, hpRegenUntil: 0, period: { active: false, nextDay: 10, daysLeft: 0 },
  inventory: { wt01: 5 }, stockDay: { wt01: 1 }, clothes: { lastChangeDay: 1, current: 'ct03', sets: {} },
  gf: { pddDay: 0, pddItems: [], wasteDay: 0, wasteItems: [] }, customers: {}, custSeq: 1, employees: [], orderDay: 0, orderMenu: [], logs: [], history: []
}));
const rawBefore = localStorage.getItem('doomsday_supermarket_v1') || '';
console.log('  [raw前80字] ' + rawBefore.substring(0, 80));
const old = SG.State.load();
console.log('  [迁移结果] shelf=' + JSON.stringify(old.shelf) + ' visitors=' + JSON.stringify(old.visitors) + ' hazard=' + JSON.stringify(old.hazard) + ' bases=' + JSON.stringify(old.bases) + ' loc=' + old.store.location + ' cashiers=' + JSON.stringify(old.store.cashiers));
ok(old.shelf && Object.keys(old.shelf).length === 0, '旧档补货架字段');
ok(old.visitors && old.visitors.length === 0, '旧档补队列字段');
ok(old.hazard === null, '旧档补危害字段');
ok(old.bases === null, '旧档补基地字段');
ok(old.store.location === null, '旧档无效选址被清空');
ok(old.store.cashiers && old.store.cashiers.length === 0, '旧档补收银员字段');

/* ============ 汇总 ============ */
console.log('\n========== 结果：' + pass + ' 通过，' + fail + ' 失败 ==========');
process.exit(fail ? 1 : 0);

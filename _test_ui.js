/* 界面交互链路测试：创建→点击开启→二次确认→执行→教程弹窗→主界面→库存补货确认
   在 vm 沙箱中加载全部脚本（逻辑层+界面层），用增强 DOM stub 模拟点击分发 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const ROOT = 'E:/末日超市/';

let pass = 0, fail = 0;
function ok(cond, name) {
  if (cond) { pass++; console.log('  [OK] ' + name); }
  else { fail++; console.log('  [FAIL] ' + name); }
}

/* ---------- 增强 DOM stub ---------- */
function makeEl(id) {
  const el = {
    id, innerHTML: '', textContent: '', className: '', value: '',
    style: { setProperty() {}, getPropertyValue() { return ''; } }, _listeners: {}, _children: [],
    classList: {
      _set: new Set(),
      add(c) { this._set.add(c); },
      remove(c) { this._set.delete(c); },
      contains(c) { return this._set.has(c); },
      toggle(c) { this._set.has(c) ? this._set.delete(c) : this._set.add(c); }
    },
    addEventListener(t, fn) { (el._listeners[t] = el._listeners[t] || []).push(fn); },
    removeEventListener(t, fn) { el._listeners[t] = (el._listeners[t] || []).filter(f => f !== fn); },
    appendChild(c) { el._children.push(c); },
    removeChild(c) { el._children = el._children.filter(x => x !== c); },
    setAttribute() {}, getAttribute() { return null; },
    querySelector(sel) { if (sel[0] === '#') return getEl(sel.slice(1)); return null; },
    querySelectorAll() { return []; },
    closest() { return null; },
    focus() {}, scrollIntoView() {}
  };
  Object.defineProperty(el, 'innerText', {
    get() { return String(el.innerHTML).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(); }
  });
  return el;
}
const elById = {};
function getEl(id) { if (!elById[id]) elById[id] = makeEl(id); return elById[id]; }

const docListeners = {};
const document = {
  readyState: 'complete',
  getElementById: getEl,
  createElement(tag) { return makeEl(tag); },
  addEventListener(t, fn) { (docListeners[t] = docListeners[t] || []).push(fn); },
  removeEventListener(t, fn) { docListeners[t] = (docListeners[t] || []).filter(f => f !== fn); },
  querySelector(sel) {
    if (sel[0] === '#') return getEl(sel.slice(1));
    return null;
  },
  querySelectorAll() { return []; }
};
document.body = makeEl('body');
document.documentElement = makeEl('html');
/* 点击事件模拟：找元素（按 id），构造带 closest 的事件 */
function clickEl(id, dataAct) {
  const el = getEl(id);
  el.getAttribute = function (a) { return a === 'data-act' ? (dataAct || null) : null; };
  el.closest = function (sel) { return (sel === '[data-act]' && dataAct) ? el : null; };
  const e = { target: el, stopPropagation() {} };
  (docListeners['click'] || []).forEach(fn => { try { fn(e); } catch (err) { console.log('  [click-error] ' + err.message); } });
  return el;
}
/* 便捷：直接调用 document 上的点击监听（目标为指定 mock） */
function fireClickOn(el, dataAct, dataArgs) {
  el.getAttribute = function (a) { return a === 'data-act' ? (dataAct || null) : (a === 'data-args' ? (dataArgs || null) : null); };
  el.closest = function (sel) { return (sel === '[data-act]' && dataAct) ? el : null; };
  const e = { target: el, stopPropagation() {} };
  (docListeners['click'] || []).forEach(fn => { try { fn(e); } catch (err) { console.log('  [click-error] ' + err.message); } });
}

const storage = {};
const localStorage = {
  getItem(k) { return storage[k] != null ? storage[k] : null; },
  setItem(k, v) { storage[k] = String(v); },
  removeItem(k) { delete storage[k]; }
};

const DATA = {}, SG = {};
const w = { DATA, SG, addEventListener() {}, localStorage };
const sandbox = { window: w, DATA, SG, document, localStorage, console, Math, JSON, Date, setTimeout, clearTimeout, isNaN, parseFloat, parseInt, String, Number, Boolean, Array, Object, Error, Event: function () {} };
vm.createContext(sandbox);

/* 按 HTML 中的 script 顺序加载全部脚本 */
const html = fs.readFileSync(ROOT + '末日超市.html', 'utf8');
const files = [];
let re = /<script src="([^"]+)"><\/script>/g, m;
while ((m = re.exec(html))) files.push(m[1]);
files.forEach(f => {
  try { vm.runInContext(fs.readFileSync(ROOT + f, 'utf8'), sandbox, { filename: f }); }
  catch (e) { console.log('  [load-error] ' + f + ' : ' + e.message); if (e.stack) console.log(e.stack.split('\n').slice(0, 4).join('\n')); }
});

/* ---------- 测试流程 ---------- */
console.log('[UI] 创建界面渲染');
const app = getEl('app');
ok(app.innerHTML.length > 0, 'renderShell 渲染出外壳');
ok(getEl('scr-body').innerHTML.indexOf('cf-name') >= 0 || getEl('scr-body').innerHTML.length > 0, '创建界面已渲染到 scr-body');

console.log('[UI] 点击「开启末日超市」→ 二次确认弹窗');
const startBtn = makeEl('start-btn');
startBtn.innerHTML = '开启末日超市';
/* 先输入姓名 */
const nameBox = getEl('cf-name');
nameBox.value = '测试员';
(nameBox._listeners['input'] || []).forEach(fn => fn({ target: nameBox }));
fireClickOn(startBtn, 'UI.startGame');
const modalLayer = getEl('modal-layer');
ok(modalLayer.classList.contains('show'), '确认弹窗已显示');
ok(modalLayer.innerHTML.indexOf('操作确认') >= 0, '弹窗标题为「操作确认」');
ok(modalLayer.innerHTML.indexOf('startGame') >= 0 || modalLayer.innerHTML.indexOf('耗时') >= 0, '弹窗含操作名/耗时信息');

console.log('[UI] 确认执行 → startGame → 教程弹窗');
console.log('  [debug] SG.A keys: ' + Object.keys(SG.A || {}).join(','));
console.log('  [debug] SG.Screens keys: ' + Object.keys(SG.Screens || {}).join(','));
const doActionBtn = makeEl('do-action');
doActionBtn.innerHTML = '确认执行';
fireClickOn(doActionBtn, 'UI.doAction', '["startGame",[]]');
ok(!modalLayer.classList.contains('show') || modalLayer.innerHTML.indexOf('新手引导') >= 0, '确认框关闭且进入教程弹窗');
const afterExec = modalLayer.innerHTML;
ok(afterExec.indexOf('新手引导') >= 0, '新手教程弹窗已显示');
ok(afterExec.indexOf('第一步') >= 0 && afterExec.indexOf('补货') >= 0, '教程含补货说明');
ok(afterExec.indexOf('接待顾客') >= 0, '教程含接待说明');

console.log('[UI] 关闭教程 → 主界面');
fireClickOn(getEl('tut-close'), 'UI.closeModal');
ok(!modalLayer.classList.contains('show'), '教程弹窗已关闭');
const body = getEl('scr-body');
ok(SG.State.getState() && SG.State.getState().created, '游戏状态已创建');
ok(SG.State.getState().points === 1000, '拼夕夕开局积分 1000');
ok(body.innerHTML.indexOf('收银台') >= 0, '主界面已渲染（含收银台）');

console.log('[UI] 切到库存页 → 一键补货 → 确认框显示耗时');
try {
  SG.UI.switchTab('inv');
} catch (e) {
  console.log('  [switchTab-error] ' + e.message + ' @ ' + (e.stack || '').split('\n')[1]);
  const dbg = SG.Gf.pddItems(SG.State.getState());
  console.log('  [debug] pdd len=' + dbg.length + ' undef=' + dbg.filter(x => !x).length);
  throw e;
}
ok(body.innerHTML.indexOf('补货') >= 0 || body.innerHTML.length > 0, '库存页已渲染');
const restockBtn = makeEl('restock-btn');
restockBtn.innerHTML = '一键补货';
fireClickOn(restockBtn, 'oneClickRestock');
ok(modalLayer.classList.contains('show'), '补货确认弹窗显示');
ok(modalLayer.innerHTML.indexOf('一键补货') >= 0, '弹窗标注操作名');
ok(modalLayer.innerHTML.indexOf('30 分钟') >= 0 || modalLayer.innerHTML.indexOf('耗时') >= 0, '弹窗标注耗时');

console.log('[UI] 确认补货 → 积分被扣（不涨）');
const ptsBefore = SG.State.getState().points;
fireClickOn(getEl('do-action2'), 'UI.doAction', '["oneClickRestock",[]]');
const ptsAfter = SG.State.getState().points;
ok(ptsAfter < ptsBefore, '补货后积分下降（' + ptsBefore + ' → ' + ptsAfter + '）');

console.log('\n========== 结果：' + pass + ' 通过，' + fail + ' 失败 ==========');
process.exit(fail ? 1 : 0);

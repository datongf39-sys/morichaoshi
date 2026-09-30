/* ============================================================
   脚本 / 界面 / 界面核心 —— 外壳、标签页、Toast、弹窗、动作分发
   ============================================================ */
window.SG = window.SG || {};
SG.Screens = {};
SG.A = {};
SG.UI = (function () {
  var TABS = [
    { id: 'main', label: '主界面' },
    { id: 'store', label: '超市' },
    { id: 'inv', label: '库存' },
    { id: 'cust', label: '顾客' },
    { id: 'emp', label: '员工' },
    { id: 'cook', label: '厨房' },
    { id: 'explore', label: '探索' },
    { id: 'map', label: '地图' },
    { id: 'dlc', label: 'DLC' },
    { id: 'record', label: '记录' },
    { id: 'settings', label: '设置' }
  ];
  var currentTab = 'main';

  function renderShell() {
    var app = document.getElementById('app');
    var svg = '<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="2" y="13" width="28" height="17" rx="3" fill="var(--accent)"/><path d="M2 13 16 3l14 10" fill="var(--accent2)"/><path d="M11 13v17M21 13v17" stroke="var(--accent2)" stroke-width="1.6" fill="none"/><path d="M16 20a4.5 4.5 0 1 0 .1 0M16 16v9M13 20h6" stroke="var(--panel)" stroke-width="2.2" fill="none" stroke-linecap="round"/></svg>';
    var tabsHtml = TABS.map(function (t) {
      return '<button class="tab-btn' + (t.id === currentTab ? ' active' : '') + '" data-act="UI.switchTab" data-args=' + SG.UI.attJson([t.id]) + '>' + t.label + '</button>';
    }).join('');
    app.innerHTML =
      '<div class="topbar">' +
      '<div class="brand">' + svg + '末日超市<span class="sub">温暖庇护所</span></div>' +
      '<div class="top-info" id="top-info"></div>' +
      '</div>' +
      '<div class="tabs">' + tabsHtml + '</div>' +
      '<div class="screens" id="scr-body"></div>';
    /* 事件委托挂在 document 上，弹窗（在 #app 外）里的按钮也能命中；只绑定一次 */
    if (!SG.UI._bound) {
      document.addEventListener('click', onClick);
      SG.UI._bound = true;
    }
    renderTopbar();
    renderScreen();
  }

  function attJson(args) { return '"' + esc(JSON.stringify(args)) + '"'; }
  function esc(s) { return SG.u.esc(s); }

  function onClick(e) {
    try {
      var el = e.target.closest ? e.target.closest('[data-act]') : null;
      if (!el) return;
      var fn = el.getAttribute('data-act');
      var args = el.getAttribute('data-args');
      var arr = args ? JSON.parse(args) : [];
      if (fn.indexOf('UI.') === 0) {
        var m = fn.split('.')[1];
        if (SG.UI[m]) { SG.UI[m].apply(null, arr); return; }
        fn = m; /* UI.xxx 未定义时回退到同名动作 SG.A.xxx */
      }
      /* 玩家操作二次确认：标注耗时与预计完成时间 */
      if (SKIP_CONFIRM.indexOf(fn) >= 0) { execAction(fn, arr); return; }
      confirmAction(fn, arr);
    } catch (err) {
      try { toast('点击处理出错：' + err.message, 'warn'); } catch (e2) { }
      console.error('onClick 出错', err);
    }
  }

  function execAction(fn, arr) {
    var r = null;
    try { r = SG.A[fn].apply(null, arr); } catch (err) { console.error(err); toast('操作出错：' + err.message, 'warn'); return; }
    handleAction(r);
  }

  /* 已在自身弹窗中完成确认/无需二次确认的动作 */
  var SKIP_CONFIRM = ['serveOk', 'serveNo', 'serveRefuse', 'serveNext', 'doAction', 'newGameConfirm', 'switchTab'];

  /* 动作预估耗时（分钟；null 表示按描述显示） */
  function estFor(fn, args) {
    switch (fn) {
      case 'skipTime': return { m: args[0] || 30, txt: '快进 ' + (args[0] || 30) + ' 分钟' };
      case 'sleepAct': return { m: null, txt: '睡到明早 8 点' };
      case 'restAct': return { m: args[0] || 30, txt: '休息 ' + (args[0] || 30) + ' 分钟' };
      case 'showerAct': return { m: 15, txt: '洗澡 15 分钟' };
      case 'eatItem': case 'drinkItem': return { m: 10, txt: '用餐 10 分钟' };
      case 'entItem': return { m: 30, txt: '娱乐 30 分钟' };
      case 'medItem': return { m: 5, txt: '服药 5 分钟' };
      case 'orderDish': return { m: 20, txt: '点餐享用 20 分钟' };
      case 'eatCookedDish': return { m: 15, txt: '吃自做的菜 15 分钟' };
      case 'changeClothes': return { m: 5, txt: '换衣 5 分钟' };
      case 'washClothes': return { m: 60, txt: '清洗衣物 1 小时' };
      case 'restockItem': return { m: Math.min(10, (args[1] || 10) * 2), txt: '补货约 ' + Math.min(10, (args[1] || 10) * 2) + ' 分钟' };
      case 'oneClickRestock': return { m: 30, txt: '一键补货约 30 分钟' };
      case 'cleanExpired': return { m: 5, txt: '清理过期 5 分钟' };
      case 'shelfUp': case 'shelfDown': return { m: 5, txt: '整理货架 5 分钟' };
      case 'makeOden': return { m: 10, txt: '煮关东煮 10 分钟' };
      case 'exploreAct': return { m: (args[0] || 1) * 60, txt: '外出探索 ' + (args[0] || 1) + ' 小时' };
      case 'fastForwardDays': return { m: null, txt: '快进 ' + (args[0] || 1) + ' 天' };
      case 'recruitEmp': return { m: 60, txt: '办理入职 1 小时' };
      case 'relocate': return { m: 240, txt: '搬迁耗时 4 小时' };
      case 'mapAsk': return { m: 30, txt: '打听情报 30 分钟' };
      case 'cookDish': return { m: 30, txt: '烹饪约 30 分钟' };
      case 'fireEmp': return { m: 0, txt: '立即完成' };
      case 'empShift': case 'empCashier': return { m: 0, txt: '立即完成' };
      case 'toggleAutoRestock': return { m: 0, txt: '立即生效' };
      case 'unlockStore': case 'upgradeStore': case 'upgradeShield': case 'unlockArea':
      case 'unlockKitchen': case 'buyKitchenTool': case 'saveMenu':
      case 'unlockRestaurant': case 'upgradeRestaurant':
      case 'unlockHotel': case 'upgradeHotel': case 'buyShop':
        return { m: 0, txt: '立即完成' };
      default: return { m: null, txt: null };
    }
  }
  var NAME_MAP = {
    skipTime: '快进时间', sleepAct: '睡觉', restAct: '休息', showerAct: '洗澡',
    eatItem: '吃饭', drinkItem: '喝水', entItem: '娱乐', medItem: '服药',
    orderDish: '点餐享用', eatCookedDish: '吃自做的菜', changeClothes: '更换衣物', washClothes: '清洗衣物',
    restockItem: '拼夕夕补货', oneClickRestock: '一键补货', cleanExpired: '清理过期商品',
    shelfUp: '上架商品', shelfDown: '下架商品', exploreAct: '外出探索', makeOden: '制作关东煮',
    fastForwardDays: '快进天数', recruitEmp: '招募员工', fireEmp: '辞退员工',
    empShift: '调整班次', empCashier: '安排/撤下收银台', toggleAutoRestock: '切换自动补货',
    relocate: '超市搬迁', mapAsk: '打听基地情报', cookDish: '烹饪',
    upgradeStore: '升级超市', upgradeShield: '升级保护罩', unlockArea: '解锁区域',
    unlockKitchen: '解锁厨房', buyKitchenTool: '购买厨具', saveMenu: '保存菜单',
    unlockRestaurant: '解锁餐馆', upgradeRestaurant: '升级餐馆',
    unlockHotel: '解锁酒店', upgradeHotel: '升级酒店', buyShop: '开设店铺'
  };

  /* 二次确认弹窗：标注耗时与预计完成时间 */
  function confirmAction(fn, arr) {
    var state = SG.State.getState();
    var est = estFor(fn, arr);
    var nameTxt = NAME_MAP[fn] || fn;
    var timeTxt = '';
    if (est.m === null && est.txt) timeTxt = est.txt;
    else if (est.m === null) timeTxt = '耗时以实际为准';
    else if (est.m === 0) timeTxt = '立即完成，不耗时';
    else {
      var endMin = state.minute + est.m;
      var endTxt = SG.u.fmtClock(endMin % 1440);
      if (endMin >= 1440) endTxt = '次日 ' + endTxt;
      timeTxt = '预计耗时 ' + est.m + ' 分钟，完成后约 ' + endTxt;
    }
    var h = '<div class="m-body"><div class="small muted">确认执行以下操作？</div>' +
      '<div class="panel2" style="padding:12px 14px;border-radius:var(--radius);margin-top:8px"><b>' + esc(nameTxt) + '</b>' +
      '<div class="small muted mt">' + timeTxt + '</div></div></div>' +
      '<div class="m-foot">' + btn('确认执行', 'UI.doAction', [fn, arr], 'primary') +
      btn('取消', 'UI.closeModal', [], 'ghost') + '</div>';
    modal('<div class="m-head"><h3>操作确认</h3></div>' + h);
  }

  function handleAction(r) {
    var state = SG.State.getState();
    if (!r) { refresh(); checkAchievements(state); return; }
    if (r.ok === false) { toast(r.msg, 'warn'); refresh(); return; }
    if (r.ok && r.msg) toast(r.msg);
    if (r.minutes && !state.ending) {
      SG.Time.advanceTime(r.minutes, state);
    }
    refresh();
    checkAchievements(state);
  }
  function checkAchievements(state) {
    if (!state || state.ending) return;
    var earned = SG.Ach.check(state);
    if (earned.length) {
      earned.forEach(function (a) {
        toast('成就达成：「' + a.name + '」+ ' + a.points + ' 成就点', 'ok');
        SG.Player.log(state, '成就达成：「' + a.name + '」+ ' + a.points + ' 成就点！', '');
      });
    }
  }

  function renderTopbar() {
    var state = SG.State.getState();
    var box = document.getElementById('top-info');
    if (!box || !state) return;
    var d = SG.u.dayInfo(state.day);
    var stage = DATA.config.STAGES[d.stage];
    var crys = SG.Econ.crystalTotal(state);
    box.innerHTML =
      '<span class="info-chip">' + SG.u.fmtDate(state.day) + ' ' + SG.u.fmtClock(state.minute) + '</span>' +
      '<span class="info-chip stage-chip">' + stage.name + '</span>' +
      '<span class="info-chip">积分 <b>' + SG.u.money(state.points) + '</b></span>' +
      '<span class="info-chip">晶核 <b>' + SG.u.fmtCrystal(crys) + '</b></span>' +
      '<span class="info-chip">顾客 <b>' + Object.keys(state.customers).length + '</b></span>' +
      '<span class="info-chip">员工 <b>' + state.employees.length + '</b></span>';
  }

  function renderScreen() {
    var state = SG.State.getState();
    var body = document.getElementById('scr-body');
    if (!body) return;
    if (!state || !state.created) { SG.Screens.creation(body); return; }
    if (state.ending) { renderEnding(body, state.ending); return; }
    var fn = SG.Screens[currentTab];
    if (!fn) currentTab = 'main';
    SG.Screens[currentTab](body, state);
    /* 标签激活态 */
    document.querySelectorAll('.tab-btn').forEach(function (b) {
      var id = JSON.parse(b.getAttribute('data-args'))[0];
      b.classList.toggle('active', id === currentTab);
    });
  }
  function refresh() { renderTopbar(); renderScreen(); }
  function switchTab(id) { currentTab = id; renderScreen(); }

  function renderEnding(body, ending) {
    body.innerHTML =
      '<div class="panel" style="max-width:560px;margin:8vh auto;text-align:center;padding:34px 30px">' +
      '<h2 style="font-size:26px;margin-bottom:12px">' + SG.u.esc(ending.title) + '</h2>' +
      '<p style="line-height:1.9;color:var(--text)">' + SG.u.esc(ending.text) + '</p>' +
      '<p class="muted mt">游戏进程结束于第 ' + SG.State.getState().day + ' 天。</p>' +
      '<div class="mt" style="display:flex;gap:10px;justify-content:center">' +
      '<button class="btn primary" data-act="UI.newGame" data-args="[]">重新开始</button>' +
      '</div></div>';
    document.getElementById('top-info').innerHTML = '<span class="info-chip stage-chip">旅程已结束</span>';
  }

  /* ---------- Toast ---------- */
  function toast(msg, cls) {
    var layer = document.getElementById('toast-layer');
    var t = document.createElement('div');
    t.className = 'toast' + (cls ? ' ' + cls : '');
    t.textContent = msg;
    layer.appendChild(t);
    setTimeout(function () { t.style.opacity = '0'; t.style.transition = 'opacity .4s'; }, 2600);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 3100);
  }
  /* ---------- Modal ---------- */
  function modal(html, wide) {
    var layer = document.getElementById('modal-layer');
    layer.innerHTML = '<div class="modal' + (wide ? ' wide' : '') + '">' + html + '</div>';
    layer.classList.add('show');
  }
  function closeModal() {
    document.getElementById('modal-layer').classList.remove('show');
    document.getElementById('modal-layer').innerHTML = '';
  }
  function confirm(title, bodyHtml, okLabel, okFn) {
    modal(
      '<div class="m-head"><h3>' + esc(title) + '</h3><button class="btn sm ghost" data-act="UI.closeModal" data-args="[]">关闭</button></div>' +
      '<div class="m-body">' + bodyHtml + '</div>' +
      '<div class="m-foot"><button class="btn ghost" data-act="UI.closeModal" data-args="[]">取消</button>' +
      '<button class="btn primary" data-act="UI.confirmOk" data-args="[]">' + esc(okLabel || '确定') + '</button></div>'
    );
    SG.UI._confirmFn = okFn;
  }
  function confirmOk() {
    closeModal();
    var fn = SG.UI._confirmFn; SG.UI._confirmFn = null;
    if (fn) { var r = fn(); handleAction(r); }
  }
  function newGame() {
    closeModal();
    SG.State.clearSave();
    SG.State.setState(null);
    currentTab = 'main';
    renderShell();
  }

  /* ---------- 通用渲染辅助 ---------- */
  function statBar(label, val, color, low) {
    var v = Math.round(val);
    var lowCls = low !== false && val <= 60 ? ' low' : '';
    return '<div class="stat-item' + lowCls + '"><span class="lab">' + label + '</span>' +
      '<div class="bar"><div class="fill ' + color + '" style="width:' + Math.min(100, v) + '%"></div></div>' +
      '<span class="val">' + v + '</span></div>';
  }
  function btn(label, act, args, cls) {
    return '<button class="btn ' + (cls || '') + '" data-act="' + act + '" data-args=' + attJson(args) + '>' + label + '</button>';
  }

  return {
    renderShell: renderShell, renderTopbar: renderTopbar, renderScreen: renderScreen,
    refresh: refresh, switchTab: switchTab, toast: toast, modal: modal, closeModal: closeModal,
    confirm: confirm, confirmOk: confirmOk, newGame: newGame,
    statBar: statBar, btn: btn, attJson: attJson, esc: esc, handleAction: handleAction,
    doAction: function (fn, arr) { closeModal(); execAction(fn, arr); },
    _confirmFn: null
  };
})();

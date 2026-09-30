/* ============================================================
   脚本 / 界面 / 创建界面 —— 信息填写（姓名/性别/年龄/末日前身份/
   金手指/是否会做饭/喜欢的颜色与风格）
   身份系统：普通上班族免费；其余身份需用成就点兑换（成就商店）。
   ============================================================ */
window.SG = window.SG || {};
SG.Screens.creation = function (body) {
  var cfg = DATA.config;
  var sel = { gender: 'male', identityId: 'office', goldenFinger: 'pdd', cook: false, colorId: 'warm', styleId: 'rustic', name: '', age: 28 };
  var h = '';
  h += '<div style="max-width:760px;margin:0 auto">';
  h += '<div class="panel" style="text-align:center;padding:26px">';
  h += '<h1 style="font-size:26px;letter-spacing:2px">末日超市 · 温暖庇护所</h1>';
  h += '<p class="muted" style="max-width:520px;margin:12px auto 0;line-height:1.8">末日降临，世界一片苍凉。但你——因为喜欢囤货，意外解锁了「超市系统」，并获得金手指。';
  h += '在系统的引导下，你于郊外荒无人烟处开了一家小卖部，撑起保护罩，为废墟中的人点亮一盏灯。<br>把货架填满，把日子过暖。</p>';
  h += '<div class="mt"><span class="chip ok">成就点 ' + SG.Ach.points() + '</span>' +
    '<span class="chip">成就跨周目累计，可用于在成就商店兑换强力身份</span></div>';
  h += '</div>';
  h += '<div class="panel mt"><h3>填写基础信息</h3>';
  h += '<div class="grid cols-2">';
  h += '<div class="field"><label>你的姓名</label><input id="cf-name" type="text" maxlength="8" placeholder="末日里，名字很重要"></div>';
  h += '<div class="field"><label>年龄</label><input id="cf-age" type="number" min="14" max="80" value="28"></div>';
  h += '</div>';
  h += '<div class="field"><label>性别（影响卫生与身体事件）</label><div class="opt-grid" id="cf-gender"></div></div>';
  h += '<div class="field"><label>末日前身份（成就商店：免费身份 + 成就点兑换身份）</label><div class="opt-grid" id="cf-identity"></div></div>';
  h += '<div class="field"><label>金手指（二选一，决定开局与赚钱路线）</label><div class="opt-grid" id="cf-gf"></div></div>';
  h += '<div class="field"><label>是否会做饭（会做饭解锁小厨房，可自行烹饪）</label><div class="opt-grid" id="cf-cook"></div></div>';
  h += '<div class="field"><label>喜欢的颜色（影响店铺/住处/网页主题）</label><div class="opt-grid" id="cf-color"></div></div>';
  h += '<div class="field"><label>喜欢的风格（影响整体 UI 与专属区域）</label><div class="opt-grid" id="cf-style"></div></div>';
  h += '<div style="display:flex;gap:12px;justify-content:center;margin-top:8px">' +
    '<button class="btn primary lg" data-act="UI.startGame" data-args="[]">开启末日超市</button></div>';
  h += '</div></div>';
  body.innerHTML = h;

  function renderOpts() {
    var g = '';
    [['male', '男'], ['female', '女']].forEach(function (x) {
      g += '<div class="opt-card' + (sel.gender === x[0] ? ' sel' : '') + '" data-set="gender" data-v="' + x[0] + '">' + x[1] + '</div>';
    });
    document.getElementById('cf-gender').innerHTML = g;
    /* 身份：成就商店。未解锁身份禁用并显示价格 */
    var i = '';
    cfg.IDENTITIES.forEach(function (x) {
      var cost = SG.Ach.identityCost(x.id);
      var unlocked = SG.Ach.identityUnlocked(x.id);
      var locked = !unlocked;
      i += '<div class="opt-card' + (sel.identityId === x.id ? ' sel' : '') + (locked ? ' dim' : '') + '" data-set="identityId" data-v="' + x.id + '"' +
        (locked ? ' data-locked="1"' : '') + '>' +
        '<b>' + x.name + '</b>' +
        '<span class="chip' + (cost > 0 ? (unlocked ? ' ok' : '') : '') + '">' + (cost > 0 ? (unlocked ? '已兑换' : cost + ' 成就点') : '免费') + '</span>' +
        '<div class="muted small">' + x.desc + '<br>' + x.perk + '</div></div>';
    });
    document.getElementById('cf-identity').innerHTML = i;
    var f = '';
    [['pdd', '拼夕夕系统', '开局送 1000 新手积分，进货价仅售价的 2 折。即时、安全、品类多，每日随机 60~100 个品类。'],
      ['waste', '变废为宝系统', '开局 0 积分，外出探索捡垃圾换物资。免费但耗体力、耗时、有遇险概率，还可捡到晶核。每日随机 40~80 个品类。']].forEach(function (x) {
      f += '<div class="opt-card' + (sel.goldenFinger === x[0] ? ' sel' : '') + '" data-set="goldenFinger" data-v="' + x[0] + '">' +
        '<b>' + x[1] + '</b><div class="muted small">' + x[2] + '</div></div>';
    });
    document.getElementById('cf-gf').innerHTML = f;
    var c = '';
    [['yes', '会'], ['no', '不会']].forEach(function (x) {
      c += '<div class="opt-card' + (sel.cook === (x[0] === 'yes') ? ' sel' : '') + '" data-set="cook" data-v="' + x[0] + '">' + x[1] + '</div>';
    });
    document.getElementById('cf-cook').innerHTML = c;
    var col = '';
    cfg.COLORS.forEach(function (x) {
      col += '<div class="opt-card' + (sel.colorId === x.id ? ' sel' : '') + '" data-set="colorId" data-v="' + x.id + '">' +
        '<span class="swatch" style="background:' + x.c + '"></span>' + x.name + '</div>';
    });
    document.getElementById('cf-color').innerHTML = col;
    var st = '';
    cfg.STYLES.forEach(function (x) {
      st += '<div class="opt-card' + (sel.styleId === x.id ? ' sel' : '') + '" data-set="styleId" data-v="' + x.id + '">' +
        '<b>' + x.name + '</b><div class="muted small">' + x.desc + '</div></div>';
    });
    document.getElementById('cf-style').innerHTML = st;
  }
  renderOpts();

  /* 事件委托：renderOpts() 每次点击都会重建选项 DOM，
     直接绑定在选项元素上的监听器会随重建而丢失（首次点击后全部失效），
     因此把监听挂在不会重建的界面容器上，每次渲染时先移除旧监听避免闭包过期。 */
  if (body._dsHandler) body.removeEventListener('click', body._dsHandler);
  body._dsHandler = function (e) {
    var el = e.target && e.target.closest ? e.target.closest('[data-set]') : null;
    if (!el) return;
    var set = el.getAttribute('data-set'), v = el.getAttribute('data-v');
    if (set === 'identityId' && el.getAttribute('data-locked')) {
      SG.UI.toast('成就点不足，无法兑换该身份（先玩一局攒成就点吧）', 'warn');
      return;
    }
    if (set === 'cook') sel.cook = v === 'yes'; else sel[set] = v;
    renderOpts();
  };
  body.addEventListener('click', body._dsHandler);
  body.querySelector('#cf-name').addEventListener('input', function (e) { sel.name = e.target.value.trim(); });
  body.querySelector('#cf-age').addEventListener('input', function (e) { sel.age = parseInt(e.target.value, 10) || 28; });
  SG.A.startGame = function () {
    if (!sel.name) { SG.UI.toast('请填写姓名', 'warn'); return { ok: false, msg: '' }; }
    if (sel.age < 14 || sel.age > 80) { SG.UI.toast('年龄需在 14~80 之间', 'warn'); return { ok: false, msg: '' }; }
    if (!SG.Ach.canSelect(sel.identityId)) { SG.UI.toast('成就点不足，无法兑换该身份', 'warn'); return { ok: false, msg: '' }; }
    /* 厨师身份默认会做饭 */
    var id = cfg.IDENTITIES.filter(function (x) { return x.id === sel.identityId; })[0];
    if (id && id.cook) sel.cook = true;
    var state = SG.State.createState({
      name: sel.name, gender: sel.gender, age: sel.age,
      identityId: sel.identityId, goldenFinger: sel.goldenFinger,
      cook: sel.cook, colorId: sel.colorId, styleId: sel.styleId
    });
    SG.State.setState(state);
    SG.Data.applyTheme(sel.colorId, sel.styleId);
    SG.Econ.refreshOrderMenu(state);
    SG.Gf.refresh(state);
    SG.Player.log(state, '末日第1天，你在荒郊野外的保护罩里，支起了自己的小卖部。');
    SG.Player.log(state, '系统提示：把货架填满，接待顾客——每天五项数值都要保持在 60 以上。', '');
    SG.State.save();
    SG.UI.toast('欢迎来到末日超市，' + sel.name + '！');
    SG.UI.switchTab('main');
    showTutorial(state, sel);
    return { ok: true };
  };

  /* 开局新手教程弹窗：剧情 + 玩法说明 */
  function showTutorial(state, sel) {
    var gfName = sel.goldenFinger === 'pdd' ? '拼夕夕系统' : '变废为宝系统';
    var gfText = sel.goldenFinger === 'pdd'
      ? '你开局拿到 1000 新手积分，进货只花售价的 2 折。去「库存」页用拼夕夕补货，把货架填满。'
      : '你开局 0 积分。去「探索」页外出捡垃圾换物资（花体力、有危险），捡到的物资就是你的本钱。';
    var h = '<div class="m-body" style="line-height:1.9">';
    h += '<div class="panel2" style="padding:12px 14px;border-radius:var(--radius)"><b>末日第 1 年 1 月 1 日</b><br>' +
      '核冬天的尘土落定，城市沦为废墟。你因为囤货癖意外解锁了「超市系统」和金手指，在郊外支起一间小卖部，撑起保护罩。<br>' +
      '废墟中的人会循着灯光而来。你卖的不只是货，是活下去的希望。</div>';
    h += '<div class="mt"><b>第一步 · 补货与上架</b><br>「库存」页补货（' + gfName + '：' + gfText + '）→ 点「上架」把仓库的货摆到货架 → 顾客只买货架上的东西。</div>';
    h += '<div class="mt"><b>第二步 · 接待顾客</b><br>顾客到店后会排队等候。「接待」顾客时，他们会用现金/物资/晶核兑换积分并购买商品，也可能抢劫偷窃（小卖部阶段不会偷窃，超市 2 级起要小心）。你可以在弹窗中选择接待或拒绝。</div>';
    h += '<div class="mt"><b>照顾好自己</b><br>饱食/口渴/生命/娱乐/卫生五项数值每天结算都要 &gt; 60，体力是干活的本钱。饿了吃饭、渴了喝水、脏了洗澡、累了睡觉。</div>';
    h += '<div class="mt"><b>升级与后期</b><br>赚积分升级超市（解锁区域、员工、DLC），升级保护罩。第 2 个月起会有极热/极寒/酸雨/尸潮等末日轮换，中期还可打听地图基地、把超市搬到基地附近经营。</div>';
    h += '</div>';
    SG.UI.modal('<div class="m-head"><h3>欢迎来到末日超市 · 新手引导</h3><button class="btn sm ghost" data-act="UI.closeModal" data-args="[]">跳过</button></div>' + h +
      '<div class="m-foot"><button class="btn primary" data-act="UI.closeModal" data-args="[]">开始营业</button></div>', true);
  }
};

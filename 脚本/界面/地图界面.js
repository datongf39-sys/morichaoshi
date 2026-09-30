/* ============================================================
   脚本 / 界面 / 地图界面 —— 基地情报、打听、搬迁
   末日前期不开放；中期起向顾客打听解锁基地，
   超市 5 级后可搬迁至已发现的基地附近经营。
   ============================================================ */
window.SG = window.SG || {};
SG.Screens.map = function (body, state) {
  var cfg = DATA.config;
  var h = '';

  if (!SG.Map.mapOpen(state)) {
    body.innerHTML = '<div class="panel"><h3>地图</h3>' +
      '<p class="muted">地图功能尚未开放。末日前期（第 1~3 年），人们还蜷缩在各自的角落里，没有人知道这世界上还有哪些基地。</p>' +
      '<p class="muted">第 4 年起（末日中期），你可以向到店的顾客打听各地基地的情报，把超市搬去更热闹的地方。</p></div>';
    return;
  }

  var bases = SG.Map.list(state);
  var known = bases.filter(function (b) { return b.discovered; });
  var cur = SG.Map.base(state);

  /* 地图总览 */
  h += '<div class="panel hero" style="background:linear-gradient(var(--panel), var(--panel2))"><div><h3>末日地图</h3>' +
    '<p class="muted">废墟之上，人类的聚落星罗棋布。每处基地的人心、家底都不同：<br>' +
    '人数多 → 客流旺；富裕高 → 顾客买得多；道德低 → 偷窃抢劫多、你还会被骚扰，甚至被武装攻打。</p>' +
    '<div class="small">已探明 ' + known.length + ' / ' + bases.length + ' 处基地' +
    (cur ? ' · 现址：「' + cur.name + '」附近' : ' · 现址：荒野孤店') + '</div></div></div>';

  /* 打听 */
  h += '<div class="panel"><h3>打听基地情报</h3>' +
    '<div class="small muted">向到店的顾客打听（花费 30 分钟），每次随机解锁一处未探明的基地。</div>' +
    '<div class="mt">' + SG.UI.btn('向顾客打听', 'UI.mapAsk', [], 'primary') + '</div></div>';

  /* 基地列表 */
  h += '<div class="panel"><h3>基地列表</h3><div class="area-grid">';
  if (!bases.length) h += '<div class="muted">地图上一片荒芜。</div>';
  bases.forEach(function (b) {
    var isCur = cur && cur.id === b.id;
    h += '<div class="area-card' + (isCur ? ' owned' : '') + '">';
    if (!b.discovered) {
      h += '<div class="area-name">？？？</div><div class="small muted">未探明，向顾客打听解锁。</div>';
    } else {
      h += '<div class="area-name">' + SG.u.esc(b.name) + ' <span class="chip">' + b.sizeName + '</span>' +
        (isCur ? ' <span class="chip ok">现址</span>' : '') + '</div>';
      h += '<div class="small muted">' + SG.Map.desc(b) + '</div>';
      h += '<div class="small">约 ' + b.pop + ' 人 · 道德 ' + b.morality + ' · 富裕 ' + b.wealth + '</div>';
      if (!isCur && SG.Store.canRelocate(state) && b.discovered) {
        h += '<div class="mt">' + SG.UI.btn('搬迁至此（' + SG.u.money(DATA.map.relocateCost) + ' 积分）', 'UI.relocate', [b.id], 'sm primary') + '</div>';
      } else if (!isCur && !SG.Store.canRelocate(state)) {
        h += '<div class="small muted mt">超市 5 级后可搬迁</div>';
      }
    }
    h += '</div>';
  });
  h += '</div></div>';

  /* 提示 */
  h += '<div class="panel"><h3>经营提示</h3><div class="small muted" style="line-height:1.9">' +
    '· 搬迁后，来往顾客以基地判定：人多的基地来的顾客多，富裕的基地买得多，道德低的基地偷窃抢劫概率高。<br>' +
    '· 低道德基地会时常骚扰你；大型低道德基地甚至可能派出军械攻打超市——提高保护罩等级才能守住。<br>' +
    '· 保护罩等级需求：小型基地攻打需 2 级、中型 3 级、大型 4 级。</div></div>';

  body.innerHTML = h;
};

/* ---------- 行动 ---------- */
SG.A.mapAsk = function () {
  var state = SG.State.getState();
  var r = SG.Map.ask(state);
  if (!r.ok) return r;
  return { ok: true, msg: r.msg, minutes: r.minutes, sta: r.sta };
};

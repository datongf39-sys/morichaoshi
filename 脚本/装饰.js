/* ============================================================
   脚本 / 装饰 —— 场景描述
   所有涉及场景描述的地方，只描述样式与布局（货架怎么摆、
   冷柜在哪个位置、分区如何划分），不罗列卖什么商品；
   措辞随玩家选择的风格（田园/极简/复古/北欧/和风）变化。
   ============================================================ */
window.SG = window.SG || {};
SG.Decor = (function () {
  /* 各风格下的设施样式词 */
  var STYLE = {
    rustic: {
      head: '木色与棉布的暖调',
      shelf: '原木货架', chill: '乳白色冷藏柜', freeze: '磨砂玻璃冷冻柜',
      grill: '铜色烤肠机', pot: '土陶关东煮锅', hotbox: '木质玻璃热食柜',
      wall: '木质墙面', light: '暖黄灯光', floor: '木地板'
    },
    modern: {
      head: '不锈钢与灯带的冷感',
      shelf: '不锈钢货架', chill: '镜面冷藏柜', freeze: '钢化玻璃冷冻柜',
      grill: '流线型烤肠机', pot: '不锈钢关东煮锅', hotbox: '透明保温热食柜',
      wall: '水泥灰墙面', light: '冷白灯带', floor: '深灰地砖'
    },
    retro: {
      head: '铁皮与搪瓷的旧时光',
      shelf: '铁皮货架', chill: '老式冰柜', freeze: '厚门冷冻柜',
      grill: '红漆烤肠机', pot: '搪瓷关东煮锅', hotbox: '玻璃罩热食柜',
      wall: '贴砖墙面', light: '钨丝灯', floor: '黑白格地砖'
    },
    nordic: {
      head: '浅木与留白的通透',
      shelf: '浅木货架', chill: '白色冷藏柜', freeze: '磨砂冷冻柜',
      grill: '原木烤肠机', pot: '陶罐关东煮锅', hotbox: '亚克力热食柜',
      wall: '白墙', light: '自然光', floor: '浅色地板'
    },
    wafu: {
      head: '细木与暖帘的安静',
      shelf: '细木格货架', chill: '和风冷藏柜', freeze: '杉木冷冻柜',
      grill: '铜色烤肠机', pot: '土锅关东煮', hotbox: '木框热食柜',
      wall: '和纸推拉门', light: '纸灯柔光', floor: '榻榻米边沿'
    }
  };

  function styleWords(state) {
    var s = STYLE[state.created.styleId] || STYLE.rustic;
    return s;
  }
  function typeWord(type, w) {
    switch (type) {
      case 'shelf': return w.shelf;
      case 'chill': return w.chill;
      case 'freeze': return w.freeze;
      case 'grill': return w.grill;
      case 'pot': return w.pot;
      case 'hotbox': return w.hotbox;
      default: return type;
    }
  }
  function qtyWord(n) {
    return n === 1 ? '一台' : (n === 2 ? '两台' : (n === 3 ? '三台' : (n === 4 ? '四台' : n + '台')));
  }
  function cntWord(n) {
    return n === 1 ? '一' : (n === 2 ? '两' : (n === 3 ? '三' : (n === 4 ? '四' : n)));
  }

  /* 单个设施组的描述（同类型多台） */
  function groupTxt(type, n, w) {
    var name = typeWord(type, w);
    return qtyWord(n) + name;
  }

  /* 完整场景描述：当前超市的样式与布局 */
  function scene(state) {
    var w = styleWords(state);
    var lv = state.store.level;
    var lvDef = DATA.config.LEVELS[lv - 1];
    var zoneArr = SG.Fac.zoneList(state);
    var parts = [];

    if (lv < 3) {
      /* 无分区：小卖部/便利店布局 */
      var counts = {};
      (zoneArr[0] ? zoneArr[0].facs : []).forEach(function (f) { counts[f.type] = (counts[f.type] || 0) + 1; });
      var t = [];
      if (counts.shelf) t.push(groupTxt('shelf', counts.shelf, w) + '沿墙排开');
      if (counts.chill) t.push(groupTxt('chill', counts.chill, w) + '挨着收银台（饮品冷饮都码在里面）');
      if (counts.freeze) t.push(groupTxt('freeze', counts.freeze, w) + '在角落低鸣');
      if (counts.grill) t.push(groupTxt('grill', counts.grill, w) + '在门口转个不停，油香扑鼻');
      if (counts.pot) t.push(groupTxt('pot', counts.pot, w) + '咕嘟冒泡');
      if (counts.hotbox) t.push(groupTxt('hotbox', counts.hotbox, w) + '里码着热腾腾的包子');
      parts.push(t.join('，') + '。');
      parts.push('收银台正对大门，柜台后是你的住处。' + w.head + '，' + w.floor + '上铺着一层淡淡的光。');
    } else {
      /* 分区布局 */
      zoneArr.forEach(function (z) {
        var zn = (DATA.facility.ZONES[z.id] || { name: z.id }).name;
        var t = [];
        ['shelf', 'chill', 'freeze', 'grill', 'pot', 'hotbox'].forEach(function (type) {
          if (z.summary[type]) t.push(groupTxt(type, z.summary[type], w));
        });
        parts.push('「' + zn + '」里，' + t.join('、') + '各就各位。');
      });
      parts.push('分区之间以' + (lv >= 5 ? '通道与' : '') + w.wall + '隔开，' + w.light + '下整座超市一眼望得到头。');
    }
    parts.push('门外是荒芜的末日旷野，保护罩内是' + w.head + '的庇护所。');
    return parts.join('');
  }

  /* 简版布局（顶栏/卡片用） */
  function brief(state) {
    var lv = state.store.level;
    if (lv < 3) {
      var n = 0;
      var fs = SG.Fac.facilities(state);
      for (var z in fs) for (var fid in fs[z]) if (fs[z][fid].type === 'shelf') n++;
      return n + ' 排' + styleWords(state).shelf + (lv >= 2 ? ' + 烤肠机/关东煮/热食柜' : ' + 冷藏柜');
    }
    var zoneArr = SG.Fac.zoneList(state);
    return zoneArr.length + ' 个分区 · ' + zoneArr.reduce(function (s, z) { return s + z.facs.length; }, 0) + ' 组设施';
  }

  return { scene: scene, brief: brief, styleWords: styleWords };
})();

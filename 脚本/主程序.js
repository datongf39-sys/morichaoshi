/* ============================================================
   脚本 / 主程序 —— 启动、数据初始化、路由、存档
   ============================================================ */
window.SG = window.SG || {};
(function () {
  function boot() {
    /* 1. 数据注册与自检 */
    SG.Data.init();
    var missing = SG.Data.checkDishIngredients();
    if (missing && missing.length) {
      console.warn('末日超市：菜品配料存在缺失引用', missing);
    }
    /* 2. 读取存档或进入创建界面 */
    var saved = SG.State.load();
    if (saved) {
      SG.Data.applyTheme(saved.created.colorId, saved.created.styleId);
      SG.UI.renderShell();
      SG.UI.toast('欢迎回来，' + saved.created.name + '。你的超市还在等你。');
    } else {
      SG.UI.renderShell();
    }
    /* 3. 离开前自动存档 */
    window.addEventListener('beforeunload', function () {
      var s = SG.State.getState();
      if (s && s.created) SG.State.save();
    });
    /* 4. 弹窗背景点击关闭 */
    var ml = document.getElementById('modal-layer');
    if (ml) ml.addEventListener('click', function (e) {
      if (e.target === ml) SG.UI.closeModal();
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

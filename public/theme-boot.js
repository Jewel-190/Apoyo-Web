(function () {
  try {
    var raw = localStorage.getItem("apoyo.webTheme.v1");
    if (!raw) return;
    var parsed = JSON.parse(raw);
    var vars = parsed && parsed.cssVars;
    if (!vars || typeof vars !== "object") return;
    var root = document.documentElement;
    for (var key in vars) {
      if (Object.prototype.hasOwnProperty.call(vars, key)) {
        root.style.setProperty(key, String(vars[key]));
      }
    }
  } catch (e) {
    /* ignore corrupt cache */
  }
})();

/* auth.js — تسجيل الدخول الموحد + التوجيه حسب الدور */
(() => {
  'use strict';
  APP.initPage();

  // مستخدم مسجل مسبقاً ← توجيه مباشر
  const existing = APP.getSession();
  if (existing) {
    const db = APP.getDB();
    if (db.users.some(u => u.id === existing.userId)) {
      location.replace(APP.homeFor(existing.role));
      return;
    }
  }

  document.getElementById('loginForm').addEventListener('submit', e => {
    e.preventDefault();
    const u = document.getElementById('username').value;
    const p = document.getElementById('password').value;
    const s = APP.login(u, p);
    if (!s) { document.getElementById('loginErr').textContent = APP.t('badCreds'); return; }
    location.href = APP.homeFor(s.role);
  });
})();

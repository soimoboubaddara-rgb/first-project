/* owner-dashboard.js — لوحة مول المحل: كل البيانات مفلترة على صالونه فقط */
(() => {
  'use strict';
  const session = APP.requireRole('owner');
  if (!session) return;

  const $ = id => document.getElementById(id);
  const L = () => APP.getLang();
  const E = APP.esc;
  const salonId = session.salonId;

  function fillFilters(db) {
    const barbers = db.barbers.filter(b => b.salonId === salonId);
    const curB = $('fBarber').value, curS = $('fStatus').value;
    $('fBarber').innerHTML = `<option value="">${APP.t('all')}</option>` +
      barbers.map(b => `<option value="${E(b.id)}">${E(b.name)}</option>`).join('');
    $('fStatus').innerHTML = `<option value="">${APP.t('all')}</option>` +
      APP.STATUSES.map(s => `<option value="${s}">${APP.statusLabel(s)}</option>`).join('');
    $('fBarber').value = curB; $('fStatus').value = curS;
  }

  function render() {
    const db = APP.getDB();
    const salon = db.salons.find(s => s.id === salonId);
    const barbers = db.barbers.filter(b => b.salonId === salonId);
    const services = db.services.filter(s => s.salonId === salonId);
    const bookings = db.bookings.filter(b => b.salonId === salonId);
    const today = APP.todayStr();

    $('salonName').textContent = salon.name[L()] + ' — ' + salon.city[L()];
    $('who').textContent = session.name;

    // الإحصائيات
    const revenue = bookings.filter(b => b.status === 'done').reduce((a, b) => a + b.price, 0);
    $('stats').innerHTML = [
      [bookings.filter(b => b.date === today && b.status !== 'cancelled').length, 'statToday'],
      [bookings.filter(b => b.status === 'pending').length, 'statPending'],
      [APP.money(revenue), 'statRevenue'],
      [barbers.length, 'statBarbers']
    ].map(([n, k]) => `<div class="stat glass"><div class="num">${E(n)}</div><div class="lbl">${APP.t(k)}</div></div>`).join('');

    // الحلاقون
    $('barbersBody').innerHTML = barbers.map(b => {
      const u = db.users.find(x => x.id === b.userId);
      return `<tr><td>${E(b.name)}</td><td>${E(u ? u.username : '')}</td>
        <td><button class="btn danger sm" data-del-barber="${E(b.id)}">${APP.t('del')}</button></td></tr>`;
    }).join('') || `<tr><td colspan="3" class="muted">${APP.t('noData')}</td></tr>`;

    // المداخيل حسب الحلاق
    $('revenueBody').innerHTML = barbers.map(b => {
      const done = bookings.filter(k => k.barberId === b.id && k.status === 'done');
      return `<tr><td>${E(b.name)}</td><td>${done.length}</td><td>${APP.money(done.reduce((a, k) => a + k.price, 0))}</td></tr>`;
    }).join('') || `<tr><td colspan="3" class="muted">${APP.t('noData')}</td></tr>`;

    // الخدمات
    $('servicesBody').innerHTML = services.map(s =>
      `<tr><td>${E(s.name[L()])}</td><td>${APP.money(s.price)}</td><td>${s.duration} ${APP.t('min')}</td>
        <td><button class="btn danger sm" data-del-service="${E(s.id)}">${APP.t('del')}</button></td></tr>`
    ).join('') || `<tr><td colspan="4" class="muted">${APP.t('noData')}</td></tr>`;

    fillFilters(db);
    renderBookings(db, bookings);
  }

  function renderBookings(db, bookings) {
    const fd = $('fDate').value, fb = $('fBarber').value, fs = $('fStatus').value;
    const rows = bookings
      .filter(b => (!fd || b.date === fd) && (!fb || b.barberId === fb) && (!fs || b.status === fs))
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

    $('bookingsBody').innerHTML = rows.map(b => {
      const barber = db.barbers.find(x => x.id === b.barberId);
      const svc = db.services.find(x => x.id === b.serviceId);
      const opts = APP.STATUSES.map(s => `<option value="${s}" ${s === b.status ? 'selected' : ''}>${APP.statusLabel(s)}</option>`).join('');
      return `<tr>
        <td>${E(b.customerName)}</td><td dir="ltr">${E(b.customerPhone)}</td>
        <td>${E(barber ? barber.name : '—')}</td><td>${E(svc ? svc.name[L()] : '—')}</td>
        <td>${E(b.date)}</td><td>${E(b.time)}</td><td>${APP.money(b.price)}</td>
        <td><span class="badge ${b.status}">${APP.statusLabel(b.status)}</span>
            <select data-status="${E(b.id)}">${opts}</select></td></tr>`;
    }).join('') || `<tr><td colspan="8" class="muted">${APP.t('noData')}</td></tr>`;
  }

  /* ---------- الأحداث ---------- */
  document.addEventListener('click', e => {
    const bb = e.target.closest('[data-del-barber]');
    if (bb && confirm(APP.t('confirmDel'))) { APP.removeBarber(bb.dataset.delBarber); render(); }
    const sb = e.target.closest('[data-del-service]');
    if (sb && confirm(APP.t('confirmDel'))) { APP.removeService(sb.dataset.delService); render(); }
  });

  document.addEventListener('change', e => {
    const sel = e.target.closest('[data-status]');
    if (sel) { APP.updateBookingStatus(sel.dataset.status, sel.value); render(); }
  });

  ['fDate', 'fBarber', 'fStatus'].forEach(id => $(id).addEventListener('change', render));

  $('barberForm').addEventListener('submit', e => {
    e.preventDefault();
    const name = $('bName').value, user = $('bUser').value.trim(), pass = $('bPass').value;
    const err = $('barberErr'); err.textContent = '';
    if (!name.trim()) { err.textContent = APP.t('errName'); return; }
    const r = APP.addBarber(name, user, pass);
    if (!r.ok) { err.textContent = APP.t(r.error); return; }
    e.target.reset(); render();
  });

  $('serviceForm').addEventListener('submit', e => {
    e.preventDefault();
    if (APP.addService($('sAr').value, $('sFr').value, $('sPrice').value, $('sDur').value)) {
      e.target.reset(); $('sDur').value = 30; render();
    }
  });

  window.addEventListener('storage', e => { if (e.key && e.key.startsWith('salon_saas_db')) render(); });

  APP.initPage();
  render();
})();

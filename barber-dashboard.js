/* barber-dashboard.js — لوحة الحلاق: يرى كرسيه ومواعيده وطابوره فقط */
(() => {
  'use strict';
  const session = APP.requireRole('barber');
  if (!session) return;

  const $ = id => document.getElementById(id);
  const L = () => APP.getLang();
  const E = APP.esc;

  function actionsHTML(b, db) {
    const btns = [];
    if (b.status === 'pending') btns.push(`<button class="btn ok sm" data-act="confirmed" data-id="${E(b.id)}">${APP.t('actConfirm')}</button>`);
    if (b.status === 'pending' || b.status === 'confirmed') {
      btns.push(`<button class="btn sm" data-act="done" data-id="${E(b.id)}">${APP.t('actDone')}</button>`);
      btns.push(`<button class="btn danger sm" data-act="cancelled" data-id="${E(b.id)}">${APP.t('actCancel')}</button>`);
    }
    const salon = db.salons.find(s => s.id === b.salonId);
    const msg = APP.t('waConfirmMsg') + ' — ' + (salon ? salon.name[L()] : '') + ' — ' + b.date + ' ' + b.time;
    btns.push(`<a class="btn wa sm" target="_blank" rel="noopener" href="${E(APP.waLink(b.customerPhone, msg))}">💬 ${APP.t('actWa')}</a>`);
    return `<div class="actions">${btns.join('')}</div>`;
  }

  function render() {
    const db = APP.getDB();
    const barber = APP.getBarberByUser(db, session.userId);
    if (!barber) { APP.logout(); return; }
    const salon = db.salons.find(s => s.id === barber.salonId);
    const today = APP.todayStr();

    // صارم: فقط حجوزات هذا الحلاق
    const mine = db.bookings.filter(b => b.barberId === barber.id && b.salonId === barber.salonId);
    const sorted = [...mine].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    const queue = sorted.filter(b => b.date >= today && (b.status === 'pending' || b.status === 'confirmed'));
    const doneToday = mine.filter(b => b.date === today && b.status === 'done');

    $('salonName').textContent = salon.name[L()] + ' — ' + barber.name;
    $('who').textContent = session.name;

    $('stats').innerHTML = [
      [queue.length, 'statQueue'],
      [doneToday.length, 'statDone'],
      [APP.money(doneToday.reduce((a, b) => a + b.price, 0)), 'statEarn']
    ].map(([n, k]) => `<div class="stat glass"><div class="num">${E(n)}</div><div class="lbl">${APP.t(k)}</div></div>`).join('');

    const svcName = b => { const s = db.services.find(x => x.id === b.serviceId); return s ? s.name[L()] : '—'; };

    // الزبون التالي
    if (queue.length) {
      const n = queue[0];
      $('nextClient').innerHTML = `<div class="next-client">
        <h3>${APP.t('nextClient')}</h3>
        <p><b>${E(n.customerName)}</b> — <span dir="ltr">${E(n.customerPhone)}</span></p>
        <p class="muted">${E(svcName(n))} • ${E(n.date)} • ${E(n.time)} • ${APP.money(n.price)}</p>
        <div class="mt">${actionsHTML(n, db)}</div></div>`;
    } else {
      $('nextClient').innerHTML = '';
    }

    // الطابور (بعد الزبون التالي)
    $('queue').innerHTML = queue.length
      ? queue.slice(1).map(b => `<div class="queue-item">
          <div><b>${E(b.time)}</b> — ${E(b.customerName)}
            <div class="muted">${E(b.date)} • ${E(svcName(b))} • ${APP.money(b.price)}</div></div>
          ${actionsHTML(b, db)}</div>`).join('')
      : `<p class="muted center">${APP.t('noQueue')}</p>`;

    // كل المواعيد
    $('allBody').innerHTML = sorted.reverse().map(b => `<tr>
      <td>${E(b.customerName)}</td><td dir="ltr">${E(b.customerPhone)}</td><td>${E(svcName(b))}</td>
      <td>${E(b.date)}</td><td>${E(b.time)}</td><td>${APP.money(b.price)}</td>
      <td><span class="badge ${b.status}">${APP.statusLabel(b.status)}</span></td></tr>`
    ).join('') || `<tr><td colspan="7" class="muted">${APP.t('noData')}</td></tr>`;
  }

  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    if (btn.dataset.act === 'cancelled' && !confirm(APP.t('confirmDel'))) return;
    APP.updateBookingStatus(btn.dataset.id, btn.dataset.act);
    render();
  });

  window.addEventListener('storage', e => { if (e.key && e.key.startsWith('salon_saas_db')) render(); });
  setInterval(render, 60000); // تحديث الطابور كل دقيقة

  APP.initPage();
  render();
})();

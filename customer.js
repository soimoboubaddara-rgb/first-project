/* customer.js — واجهة الزبائن: اختيار الصالون ← الحلاق ← الخدمة ← الوقت ← تأكيد + واتساب */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const L = () => APP.getLang();
  const state = { salonId: null, barberId: null, serviceId: null, date: APP.todayStr(), time: null };

  function resetFrom(level) {
    if (level <= 1) state.barberId = null;
    if (level <= 2) state.serviceId = null;
    if (level <= 3) state.time = null;
  }

  function choiceButtons(container, items, activeId, html, onPick) {
    container.innerHTML = items.map(it =>
      `<button type="button" class="card glass choice ${it.id === activeId ? 'active' : ''}" data-id="${APP.esc(it.id)}">${html(it)}</button>`
    ).join('') || `<p class="muted">${APP.t('noData')}</p>`;
    container.querySelectorAll('.choice').forEach(b => { b.onclick = () => onPick(b.dataset.id); });
  }

  function render() {
    const db = APP.getDB();
    const salon = db.salons.find(s => s.id === state.salonId);
    const service = db.services.find(s => s.id === state.serviceId);

    choiceButtons($('salons'), db.salons, state.salonId,
      s => `<div class="ico">💈</div><h3>${APP.esc(s.name[L()])}</h3><p>📍 ${APP.esc(s.city[L()])}</p>`,
      id => { state.salonId = id; resetFrom(1); render(); });

    $('secBarber').classList.toggle('hidden', !salon);
    $('secService').classList.toggle('hidden', !state.barberId);
    $('secTime').classList.toggle('hidden', !service);
    $('secForm').classList.toggle('hidden', !state.time);

    if (salon) {
      choiceButtons($('barbers'), db.barbers.filter(b => b.salonId === salon.id), state.barberId,
        b => `<div class="ico">✂️</div><h3>${APP.esc(b.name)}</h3>`,
        id => { state.barberId = id; resetFrom(2); render(); });
    }
    if (state.barberId) {
      choiceButtons($('services'), db.services.filter(s => s.salonId === salon.id), state.serviceId,
        s => `<h3>${APP.esc(s.name[L()])}</h3><p>${s.duration} ${APP.t('min')}</p><p class="gold"><b>${APP.money(s.price)}</b></p>`,
        id => { state.serviceId = id; resetFrom(3); render(); });
    }
    if (service) renderSlots(db, service);
    if (state.time) renderSummary(db, salon, service);
  }

  function renderSlots(db, service) {
    const slots = APP.availableSlots(db, state.barberId, state.date, service.duration);
    if (state.time && !slots.includes(state.time)) state.time = null;
    $('slots').innerHTML = slots.map(s => `<button type="button" class="slot ${s === state.time ? 'active' : ''}" data-t="${s}">${s}</button>`).join('');
    $('noSlots').classList.toggle('hidden', slots.length > 0);
    $('slots').querySelectorAll('.slot').forEach(b => {
      b.onclick = () => { state.time = b.dataset.t; render(); $('secForm').scrollIntoView({ behavior: 'smooth', block: 'center' }); };
    });
  }

  function summaryHTML(salon, barber, service, date, time) {
    return `
      <div><span>${APP.t('salon')}</span><b>${APP.esc(salon.name[L()])}</b></div>
      <div><span>${APP.t('barber')}</span><b>${APP.esc(barber.name)}</b></div>
      <div><span>${APP.t('service')}</span><b>${APP.esc(service.name[L()])}</b></div>
      <div><span>${APP.t('date')}</span><b>${date}</b></div>
      <div><span>${APP.t('time')}</span><b>${time}</b></div>
      <div><span>${APP.t('price')}</span><b class="gold">${APP.money(service.price)}</b></div>`;
  }

  function renderSummary(db, salon, service) {
    const barber = db.barbers.find(b => b.id === state.barberId);
    $('summary').innerHTML = summaryHTML(salon, barber, service, state.date, state.time);
  }

  /* ---------- الأحداث ---------- */
  function setupDate() {
    const d = $('date');
    const max = new Date(); max.setDate(max.getDate() + 30);
    d.min = APP.todayStr(); d.max = APP.todayStr(max); d.value = state.date;
    d.onchange = () => {
      if (!d.value || d.value < d.min || d.value > d.max) { d.value = state.date; return; }
      state.date = d.value; state.time = null; render();
    };
  }

  $('bookForm').addEventListener('submit', e => {
    e.preventDefault();
    const name = $('custName').value.trim();
    const phone = $('custPhone').value.trim();
    const err = $('formErr');
    err.textContent = '';
    if (!state.time) { err.textContent = APP.t('errSlot'); return; }
    if (name.length < 2) { err.textContent = APP.t('errName'); return; }
    if (!APP.isValidMoroccanPhone(phone)) { err.textContent = APP.t('errPhone'); return; }

    const res = APP.createBooking({
      salonId: state.salonId, barberId: state.barberId, serviceId: state.serviceId,
      date: state.date, time: state.time, customerName: name, customerPhone: phone
    });
    if (!res.ok) {
      err.textContent = res.error === 'slotTaken' ? APP.t('slotTaken') : APP.t('errSlot');
      state.time = null; render(); return;
    }

    const db = res.db;
    const salon = db.salons.find(s => s.id === res.booking.salonId);
    const barber = db.barbers.find(b => b.id === res.booking.barberId);
    const service = db.services.find(s => s.id === res.booking.serviceId);
    const url = APP.waLink(salon.phone, APP.buildBookingMessage(res.booking, db));

    ['secSalon', 'secBarber', 'secService', 'secTime', 'secForm'].forEach(id => $(id).classList.add('hidden'));
    $('doneSummary').innerHTML = summaryHTML(salon, barber, service, res.booking.date, res.booking.time);
    $('waBtn').href = url;
    $('secDone').classList.remove('hidden');
    window.open(url, '_blank', 'noopener');
  });

  $('newBtn').onclick = () => {
    state.salonId = state.barberId = state.serviceId = state.time = null;
    $('bookForm').reset(); $('formErr').textContent = '';
    $('secDone').classList.add('hidden'); $('secSalon').classList.remove('hidden');
    render(); window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // مزامنة بين التبويبات (إذا حُجز الوقت من مكان آخر)
  window.addEventListener('storage', e => { if (e.key && e.key.startsWith('salon_saas_db') && !$('secDone').offsetParent) render(); });

  APP.initPage();
  setupDate();
  render();
})();

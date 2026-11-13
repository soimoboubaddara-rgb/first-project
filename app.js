/* =====================================================
   app.js — قاعدة البيانات المحلية + الصلاحيات (RBAC) + الترجمة + واتساب
   ملاحظة: النظام تجريبي يعمل بالكامل في المتصفح (localStorage).
   للإنتاج الحقيقي يجب نقل البيانات والمصادقة إلى Backend آمن.
   ===================================================== */
const APP = (() => {
  "use strict";

  const DB_KEY = "salon_saas_db_v1";
  const SESSION_KEY = "salon_saas_session_v1";
  const LANG_KEY = "salon_saas_lang";
  const OPEN = 9 * 60; // 09:00
  const CLOSE = 21 * 60; // 21:00
  const STEP = 30; // دقيقة
  const STATUSES = ["pending", "confirmed", "done", "cancelled"];

  /* ---------------- الترجمة ---------------- */
  const I18N = {
    ar: {
      appName: "حجز الصالونات",
      langBtn: "Français",
      logout: "تسجيل الخروج",
      staffLogin: "دخول الفريق",
      all: "الكل",
      dh: "د.م",
      min: "دقيقة",
      noData: "لا توجد بيانات",
      add: "إضافة",
      del: "حذف",
      confirmDel: "هل أنت متأكد من الحذف؟",
      back: "رجوع للرئيسية",
      heroTitle: "احجز موعدك في أفضل صالونات الحلاقة",
      heroSub: "اختر الصالون والحلاق والخدمة ثم أكد حجزك عبر واتساب",
      step1: "1. اختر الصالون",
      step2: "2. اختر الحلاق",
      step3: "3. اختر الخدمة",
      step4: "4. اختر التاريخ والوقت",
      step5: "5. بياناتك",
      date: "التاريخ",
      noSlots: "لا توجد أوقات متاحة في هذا اليوم",
      fullName: "الاسم الكامل",
      phone: "رقم الهاتف (مثال: 0612345678)",
      confirmBook: "تأكيد الحجز",
      errName: "المرجو إدخال الاسم",
      errPhone: "رقم هاتف مغربي غير صحيح",
      errSlot: "المرجو اختيار الوقت",
      slotTaken: "عذراً، هذا الوقت حُجز للتو. اختر وقتاً آخر.",
      bookingDone: "تم تسجيل حجزك ✅",
      bookingDoneSub: "أرسل الرسالة عبر واتساب لتأكيد الموعد مع الصالون",
      sendWhatsapp: "إرسال عبر واتساب",
      newBooking: "حجز جديد",
      summary: "ملخص الحجز",
      salon: "الصالون",
      barber: "الحلاق",
      service: "الخدمة",
      time: "الوقت",
      price: "الثمن",
      waHeader: "حجز جديد ✂️",
      waName: "الاسم",
      waPhone: "الهاتف",
      loginTitle: "تسجيل الدخول",
      loginSub: "خاص بأصحاب الصالونات والحلاقين",
      username: "اسم المستخدم",
      password: "كلمة المرور",
      loginBtn: "دخول",
      badCreds: "اسم المستخدم أو كلمة المرور غير صحيحة",
      ownerTitle: "لوحة مول المحل",
      statToday: "مواعيد اليوم",
      statPending: "في الانتظار",
      statRevenue: "المداخيل الإجمالية",
      statBarbers: "عدد الحلاقين",
      team: "فريق العمل (الحلاقون)",
      addBarber: "إضافة حلاق جديد",
      barberName: "اسم الحلاق",
      barberUser: "اسم المستخدم",
      barberPass: "كلمة المرور",
      userExists: "اسم المستخدم مستعمل من قبل",
      invalidUser: "اسم المستخدم: 3-20 حرفاً لاتينياً أو أرقاماً",
      shortPass: "كلمة المرور قصيرة جداً",
      services: "الخدمات والأسعار",
      addService: "إضافة خدمة",
      svcNameAr: "الاسم بالعربية",
      svcNameFr: "الاسم بالفرنسية",
      duration: "المدة (دقيقة)",
      bookings: "جميع المواعيد",
      filterDate: "التاريخ",
      filterBarber: "الحلاق",
      filterStatus: "الحالة",
      colName: "الاسم",
      colUser: "المستخدم",
      colCustomer: "الزبون",
      colPhone: "الهاتف",
      colBarber: "الحلاق",
      colService: "الخدمة",
      colDate: "التاريخ",
      colTime: "الوقت",
      colPrice: "الثمن",
      colStatus: "الحالة",
      colActions: "إجراءات",
      colRevenue: "المداخيل",
      colBookings: "مواعيد منجزة",
      revenueByBarber: "المداخيل حسب الحلاق",
      barberTitle: "لوحة الحلاق",
      myQueue: "طابور الانتظار",
      nextClient: "الزبون التالي",
      myBookings: "جميع مواعيدي",
      statQueue: "في الطابور",
      statDone: "منجزة اليوم",
      statEarn: "مداخيل اليوم",
      noQueue: "لا يوجد زبناء في الانتظار 🎉",
      pending: "في الانتظار",
      confirmed: "مؤكد",
      done: "منجز",
      cancelled: "ملغى",
      actConfirm: "تأكيد",
      actDone: "إنهاء",
      actCancel: "إلغاء",
      actWa: "واتساب",
      waConfirmMsg: "مرحباً، تم تأكيد موعدك",
    },
    fr: {
      appName: "Réservation Salons",
      langBtn: "العربية",
      logout: "Déconnexion",
      staffLogin: "Espace équipe",
      all: "Tous",
      dh: "MAD",
      min: "min",
      noData: "Aucune donnée",
      add: "Ajouter",
      del: "Supprimer",
      confirmDel: "Confirmer la suppression ?",
      back: "Retour à l'accueil",
      heroTitle: "Réservez dans les meilleurs salons de coiffure",
      heroSub:
        "Choisissez le salon, le coiffeur et le service, puis confirmez via WhatsApp",
      step1: "1. Choisir le salon",
      step2: "2. Choisir le coiffeur",
      step3: "3. Choisir le service",
      step4: "4. Choisir la date et l'heure",
      step5: "5. Vos informations",
      date: "Date",
      noSlots: "Aucun créneau disponible ce jour",
      fullName: "Nom complet",
      phone: "Téléphone (ex : 0612345678)",
      confirmBook: "Confirmer la réservation",
      errName: "Veuillez saisir votre nom",
      errPhone: "Numéro marocain invalide",
      errSlot: "Veuillez choisir l'heure",
      slotTaken:
        "Désolé, ce créneau vient d’être pris. Choisissez-en un autre.",
      bookingDone: "Réservation enregistrée ✅",
      bookingDoneSub:
        "Envoyez le message via WhatsApp pour confirmer avec le salon",
      sendWhatsapp: "Envoyer via WhatsApp",
      newBooking: "Nouvelle réservation",
      summary: "Résumé",
      salon: "Salon",
      barber: "Coiffeur",
      service: "Service",
      time: "Heure",
      price: "Prix",
      waHeader: "Nouvelle réservation ✂️",
      waName: "Nom",
      waPhone: "Téléphone",
      loginTitle: "Connexion",
      loginSub: "Réservé aux propriétaires et coiffeurs",
      username: "Nom d'utilisateur",
      password: "Mot de passe",
      loginBtn: "Se connecter",
      badCreds: "Nom d'utilisateur ou mot de passe incorrect",
      ownerTitle: "Tableau de bord propriétaire",
      statToday: "RDV d'aujourd'hui",
      statPending: "En attente",
      statRevenue: "Revenus totaux",
      statBarbers: "Coiffeurs",
      team: "Équipe (coiffeurs)",
      addBarber: "Ajouter un coiffeur",
      barberName: "Nom du coiffeur",
      barberUser: "Nom d'utilisateur",
      barberPass: "Mot de passe",
      userExists: "Nom d'utilisateur déjà pris",
      invalidUser: "Nom d'utilisateur : 3-20 caractères latins ou chiffres",
      shortPass: "Mot de passe trop court",
      services: "Services et tarifs",
      addService: "Ajouter un service",
      svcNameAr: "Nom en arabe",
      svcNameFr: "Nom en français",
      duration: "Durée (min)",
      bookings: "Tous les rendez-vous",
      filterDate: "Date",
      filterBarber: "Coiffeur",
      filterStatus: "Statut",
      colName: "Nom",
      colUser: "Utilisateur",
      colCustomer: "Client",
      colPhone: "Téléphone",
      colBarber: "Coiffeur",
      colService: "Service",
      colDate: "Date",
      colTime: "Heure",
      colPrice: "Prix",
      colStatus: "Statut",
      colActions: "Actions",
      colRevenue: "Revenus",
      colBookings: "RDV terminés",
      revenueByBarber: "Revenus par coiffeur",
      barberTitle: "Tableau de bord coiffeur",
      myQueue: "File d'attente",
      nextClient: "Client suivant",
      myBookings: "Tous mes rendez-vous",
      statQueue: "Dans la file",
      statDone: "Terminés aujourd'hui",
      statEarn: "Revenus du jour",
      noQueue: "Aucun client en attente 🎉",
      pending: "En attente",
      confirmed: "Confirmé",
      done: "Terminé",
      cancelled: "Annulé",
      actConfirm: "Confirmer",
      actDone: "Terminer",
      actCancel: "Annuler",
      actWa: "WhatsApp",
      waConfirmMsg: "Bonjour, votre rendez-vous est confirmé",
    },
  };

  /* ---------------- البيانات الأولية ---------------- */
  const mkServices = (sid) => [
    {
      id: sid + "-sv1",
      salonId: sid,
      name: { ar: "قص الشعر", fr: "Coupe de cheveux" },
      price: 50,
      duration: 30,
    },
    {
      id: sid + "-sv2",
      salonId: sid,
      name: { ar: "حلاقة اللحية", fr: "Taille de barbe" },
      price: 30,
      duration: 30,
    },
    {
      id: sid + "-sv3",
      salonId: sid,
      name: { ar: "قص + لحية", fr: "Coupe + barbe" },
      price: 70,
      duration: 60,
    },
    {
      id: sid + "-sv4",
      salonId: sid,
      name: { ar: "قص الأطفال", fr: "Coupe enfant" },
      price: 35,
      duration: 30,
    },
  ];

  function seed() {
    return {
      salons: [
        {
          id: "s1",
          name: { ar: "صالون الفخامة", fr: "Salon Prestige" },
          city: { ar: "فاس", fr: "Fès" },
          phone: "212600000001",
        },
        {
          id: "s2",
          name: { ar: "صالون الأناقة", fr: "Salon Élégance" },
          city: { ar: "الرباط", fr: "Rabat" },
          phone: "212600000002",
        },
      ],
      users: [
        {
          id: "u1",
          username: "owner1",
          password: "123",
          role: "owner",
          salonId: "s1",
          name: "مول صالون الفخامة",
        },
        {
          id: "u2",
          username: "ahmed",
          password: "123",
          role: "barber",
          salonId: "s1",
          name: "أحمد",
        },
        {
          id: "u3",
          username: "khalid",
          password: "123",
          role: "barber",
          salonId: "s1",
          name: "خالد",
        },
        {
          id: "u4",
          username: "owner2",
          password: "123",
          role: "owner",
          salonId: "s2",
          name: "مول صالون الأناقة",
        },
        {
          id: "u5",
          username: "omar",
          password: "123",
          role: "barber",
          salonId: "s2",
          name: "عمر",
        },
        {
          id: "u6",
          username: "soufiane",
          password: "123",
          role: "barber",
          salonId: "s2",
          name: "سفيان",
        },
      ],
      barbers: [
        { id: "b1", salonId: "s1", userId: "u2", name: "أحمد" },
        { id: "b2", salonId: "s1", userId: "u3", name: "خالد" },
        { id: "b3", salonId: "s2", userId: "u5", name: "عمر" },
        { id: "b4", salonId: "s2", userId: "u6", name: "سفيان" },
      ],
      services: [...mkServices("s1"), ...mkServices("s2")],
      bookings: [],
    };
  }

  /* ---------------- قاعدة البيانات ---------------- */
  function saveDB(db) {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  }
  function getDB() {
    try {
      const raw = localStorage.getItem(DB_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      /* تجاهل وإعادة البناء */
    }
    const db = seed();
    saveDB(db);
    return db;
  }
  const uid = (p) =>
    p + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  /* ---------------- أدوات عامة ---------------- */
  const esc = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const pad = (n) => String(n).padStart(2, "0");
  const todayStr = (d = new Date()) =>
    d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  const toMin = (t) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const toTime = (m) => pad(Math.floor(m / 60)) + ":" + pad(m % 60);

  function getLang() {
    return localStorage.getItem(LANG_KEY) === "fr" ? "fr" : "ar";
  }
  function t(key) {
    return (I18N[getLang()] || I18N.ar)[key] || key;
  }
  function applyI18n() {
    const lang = getLang();
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll("[data-i18n-ph]").forEach((el) => {
      el.placeholder = t(el.dataset.i18nPh);
    });
  }
  function toggleLang() {
    localStorage.setItem(LANG_KEY, getLang() === "ar" ? "fr" : "ar");
    location.reload();
  }
  function initPage() {
    applyI18n();
    const lb = document.getElementById("langBtn");
    if (lb) {
      lb.textContent = t("langBtn");
      lb.onclick = toggleLang;
    }
    const out = document.getElementById("logoutBtn");
    if (out) out.onclick = logout;
  }
  function toast(msg, type = "ok") {
    let el = document.getElementById("toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.className = "toast show " + type;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => {
      el.className = "toast";
    }, 3000);
  }
  const money = (n) => Number(n || 0).toLocaleString("en-US") + " " + t("dh");
  const statusLabel = (s) => t(s);

  /* ---------------- واتساب ---------------- */
  function normalizePhone(p) {
    let d = String(p)
      .replace(/[^\d+]/g, "")
      .replace(/^\+/, "");
    if (d.startsWith("00")) d = d.slice(2);
    if (d.startsWith("0")) d = "212" + d.slice(1);
    return d;
  }
  const isValidMoroccanPhone = (p) =>
    /^(\+212|00212|0)[5-7]\d{8}$/.test(String(p).replace(/[\s.-]/g, ""));
  const waLink = (phone, text) =>
    "https://wa.me/" +
    normalizePhone(phone) +
    "?text=" +
    encodeURIComponent(text);

  function buildBookingMessage(b, db) {
    const L = getLang();
    const salon = db.salons.find((s) => s.id === b.salonId);
    const barber = db.barbers.find((x) => x.id === b.barberId);
    const svc = db.services.find((x) => x.id === b.serviceId);
    return [
      t("waHeader"),
      t("salon") + ": " + (salon ? salon.name[L] : ""),
      t("barber") + ": " + (barber ? barber.name : ""),
      t("service") +
        ": " +
        (svc ? svc.name[L] : "") +
        " (" +
        b.price +
        " " +
        t("dh") +
        ")",
      t("date") + ": " + b.date,
      t("time") + ": " + b.time,
      t("waName") + ": " + b.customerName,
      t("waPhone") + ": " + b.customerPhone,
    ].join("\n");
  }

  /* ---------------- المواعيد المتاحة ---------------- */
  function busySet(db, barberId, date) {
    const busy = new Set();
    db.bookings.forEach((b) => {
      if (
        b.barberId !== barberId ||
        b.date !== date ||
        b.status === "cancelled"
      )
        return;
      const s = toMin(b.time);
      for (let m = s; m < s + (b.duration || STEP); m += STEP) busy.add(m);
    });
    return busy;
  }
  function availableSlots(db, barberId, date, duration) {
    const busy = busySet(db, barberId, date);
    const now = new Date();
    const isToday = date === todayStr(now);
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const out = [];
    for (let m = OPEN; m + duration <= CLOSE; m += STEP) {
      if (isToday && m <= nowMin) continue;
      let free = true;
      for (let k = m; k < m + duration; k += STEP)
        if (busy.has(k)) {
          free = false;
          break;
        }
      if (free) out.push(toTime(m));
    }
    return out;
  }

  /* ---------------- إنشاء حجز (للزبائن) ---------------- */
  function createBooking({
    salonId,
    barberId,
    serviceId,
    date,
    time,
    customerName,
    customerPhone,
  }) {
    const db = getDB();
    const salon = db.salons.find((s) => s.id === salonId);
    const barber = db.barbers.find(
      (b) => b.id === barberId && b.salonId === salonId,
    );
    const svc = db.services.find(
      (s) => s.id === serviceId && s.salonId === salonId,
    );
    if (!salon || !barber || !svc) return { ok: false, error: "invalid" };
    if (!availableSlots(db, barberId, date, svc.duration).includes(time))
      return { ok: false, error: "slotTaken" };
    const booking = {
      id: uid("bk"),
      salonId,
      barberId,
      serviceId,
      date,
      time,
      customerName: customerName.trim().slice(0, 60),
      customerPhone: customerPhone.trim().slice(0, 20),
      price: svc.price,
      duration: svc.duration,
      status: "pending",
      createdAt: Date.now(),
    };
    db.bookings.push(booking);
    saveDB(db);
    return { ok: true, booking, db };
  }

  /* ---------------- المصادقة والجلسة ---------------- */
  function getSession() {
    try {
      return JSON.parse(sessionStorage.getItem(SESSION_KEY));
    } catch (e) {
      return null;
    }
  }
  function login(username, password) {
    const db = getDB();
    const u = db.users.find(
      (x) =>
        x.username.toLowerCase() === String(username).trim().toLowerCase() &&
        x.password === password,
    );
    if (!u) return null;
    const s = {
      userId: u.id,
      role: u.role,
      salonId: u.salonId,
      name: u.name,
      username: u.username,
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
    return s;
  }
  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    location.href = "login.html";
  }
  const homeFor = (role) =>
    role === "owner" ? "owner-dashboard.html" : "barber-dashboard.html";

  // حارس الصفحات: يعيد الجلسة أو يحوّل إلى صفحة الدخول
  function requireRole(role) {
    const s = getSession();
    const db = getDB();
    const valid =
      s &&
      s.role === role &&
      db.users.some((u) => u.id === s.userId && u.salonId === s.salonId);
    if (!valid) {
      sessionStorage.removeItem(SESSION_KEY);
      location.href = "login.html";
      return null;
    }
    return s;
  }
  const getBarberByUser = (db, userId) =>
    db.barbers.find((b) => b.userId === userId);

  /* ---------------- عمليات محمية بالصلاحيات ---------------- */
  function ownerSession() {
    const s = getSession();
    return s && s.role === "owner" ? s : null;
  }

  function updateBookingStatus(id, status) {
    const s = getSession();
    const db = getDB();
    const b = db.bookings.find((x) => x.id === id);
    if (!s || !b || !STATUSES.includes(status)) return false;
    let allowed = false;
    if (s.role === "owner") allowed = b.salonId === s.salonId;
    if (s.role === "barber") {
      const br = getBarberByUser(db, s.userId);
      allowed = !!br && br.id === b.barberId;
    }
    if (!allowed) return false;
    b.status = status;
    saveDB(db);
    return true;
  }

  function addBarber(name, username, password) {
    const s = ownerSession();
    if (!s) return { ok: false, error: "forbidden" };
    const db = getDB();
    if (!/^[a-z0-9_.-]{3,20}$/i.test(username))
      return { ok: false, error: "invalidUser" };
    if (String(password).length < 3) return { ok: false, error: "shortPass" };
    if (
      db.users.some((u) => u.username.toLowerCase() === username.toLowerCase())
    )
      return { ok: false, error: "userExists" };
    const userId = uid("u");
    db.users.push({
      id: userId,
      username,
      password,
      role: "barber",
      salonId: s.salonId,
      name: name.trim(),
    });
    db.barbers.push({
      id: uid("b"),
      salonId: s.salonId,
      userId,
      name: name.trim(),
    });
    saveDB(db);
    return { ok: true };
  }

  function removeBarber(barberId) {
    const s = ownerSession();
    if (!s) return false;
    const db = getDB();
    const b = db.barbers.find(
      (x) => x.id === barberId && x.salonId === s.salonId,
    );
    if (!b) return false;
    db.barbers = db.barbers.filter((x) => x.id !== b.id);
    db.users = db.users.filter((u) => u.id !== b.userId);
    db.bookings.forEach((k) => {
      if (
        k.barberId === b.id &&
        (k.status === "pending" || k.status === "confirmed")
      )
        k.status = "cancelled";
    });
    saveDB(db);
    return true;
  }

  function addService(nameAr, nameFr, price, duration) {
    const s = ownerSession();
    if (!s) return false;
    price = Number(price);
    duration = Math.max(STEP, Math.round(Number(duration) / STEP) * STEP);
    if (!nameAr.trim() || !nameFr.trim() || !(price >= 0)) return false;
    const db = getDB();
    db.services.push({
      id: uid("sv"),
      salonId: s.salonId,
      name: { ar: nameAr.trim(), fr: nameFr.trim() },
      price,
      duration,
    });
    saveDB(db);
    return true;
  }

  function removeService(id) {
    const s = ownerSession();
    if (!s) return false;
    const db = getDB();
    if (!db.services.some((x) => x.id === id && x.salonId === s.salonId))
      return false;
    db.services = db.services.filter((x) => x.id !== id);
    saveDB(db);
    return true;
  }

  return {
    STATUSES,
    getDB,
    saveDB,
    esc,
    todayStr,
    getLang,
    t,
    applyI18n,
    toggleLang,
    initPage,
    toast,
    money,
    statusLabel,
    waLink,
    normalizePhone,
    isValidMoroccanPhone,
    buildBookingMessage,
    availableSlots,
    createBooking,
    getSession,
    login,
    logout,
    homeFor,
    requireRole,
    getBarberByUser,
    updateBookingStatus,
    addBarber,
    removeBarber,
    addService,
    removeService,
  };
})();

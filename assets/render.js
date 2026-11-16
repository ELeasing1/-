/* Благо Дарю — сборка страницы из content.json.
   Этим файлом пользуются сайт (assets/site.js) и админка (admin/).
   Править тексты нужно в админке, а не здесь. */
(function (root) {
  'use strict';

  var ASSET_V = '3';

  var ICONS = {
    coffee: '<path d="M10 2v2M14 2v2M6 2v2"/><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"/>',
    backpack: '<path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"/><path d="M8 10h8M8 18h8"/><path d="M8 22v-6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>',
    home: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    bag: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
    book: '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
    heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    truck: '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
    box: '<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><path d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7"/><path d="m7.5 4.27 9 5.15"/>',
    building: '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4M10 10h4M10 14h4M10 18h4"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98"/>',
    copy: '<rect x="8" y="8" width="14" height="14" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    arrow: '<path d="M5 12h14M12 5l7 7-7 7"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    plus: '<path d="M5 12h14M12 5v14"/>',
    left: '<path d="m15 18-6-6 6-6"/>',
    right: '<path d="m9 18 6-6-6-6"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
    flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    sprout: '<path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/>',
    pin: '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
    letter: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    play: '<path d="M6 3 20 12 6 21Z"/>',
    ext: '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/>',
    hammer: '<path d="m15 12-8.373 8.373a1 1 0 1 1-3-3L12 9"/><path d="m18 15 4-4"/><path d="m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172V7l-2.26-2.26a6 6 0 0 0-4.202-1.756L9 2.96l.92.82A6.18 6.18 0 0 1 12 8.4V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    church: '<path d="M10 9h4"/><path d="M12 7v5"/><path d="M14 22v-4a2 2 0 0 0-4 0v4"/><path d="M18 22V5.618a1 1 0 0 0-.553-.894l-4.553-2.277a2 2 0 0 0-1.788 0L6.553 4.724A1 1 0 0 0 6 5.618V22"/><path d="m18 7 3.447 1.724a1 1 0 0 1 .553.894V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.618a1 1 0 0 1 .553-.894L6 7"/>'
  };

  var ICON_NAMES = {
    heart: 'Сердце', users: 'Люди', box: 'Коробка', building: 'Компания', share: 'Поделиться',
    backpack: 'Рюкзак', bag: 'Пакет', gift: 'Подарок', home: 'Дом', hammer: 'Молоток',
    book: 'Книга', truck: 'Грузовик', letter: 'Письмо', sprout: 'Росток', church: 'Церковь',
    phone: 'Телефон', camera: 'Камера', coffee: 'Кофе', flame: 'Огонь', check: 'Галочка'
  };

  /* ---------- мелочи ---------- */

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function fmt(n) { return Math.round(n).toLocaleString('ru-RU'); }
  function fmt1(n) { return (Math.round(n * 10) / 10).toLocaleString('ru-RU'); }
  function forms(s) { return String(s || '').split('|').map(function (x) { return x.trim(); }); }
  function plural(n, f) {
    var a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return f[2] || f[0];
    if (b > 1 && b < 5) return f[1] || f[0];
    if (b === 1) return f[0];
    return f[2] || f[0];
  }
  function one(n) { return n % 10 === 1 && n % 100 !== 11; }
  function icon(name, cls) {
    return '<svg class="' + (cls || 'ic') + '" aria-hidden="true"><use href="#i-' + esc(name || 'heart') + '"/></svg>';
  }
  function paras(text) {
    return String(text || '').split(/\n\s*\n/).map(function (p) { return p.trim(); }).filter(Boolean)
      .map(function (p) { return '<p>' + esc(p).replace(/\n/g, '<br>') + '</p>'; }).join('');
  }
  function accent(title, acc, cls) {
    title = String(title || '');
    if (acc && title.indexOf(acc) > -1) {
      var i = title.indexOf(acc);
      return esc(title.slice(0, i)) + '<span class="' + (cls || 'accent') + '">' + esc(acc) + '</span>' + esc(title.slice(i + acc.length));
    }
    return esc(title);
  }
  function phoneHref(p) {
    var d = String(p || '').replace(/\D/g, '');
    if (d.length === 11 && d[0] === '8') d = '7' + d.slice(1);
    if (d.length === 10) d = '7' + d;
    return 'tel:+' + d;
  }
  function img(o, extra) {
    if (!o || !o.src) return '';
    extra = extra || {};
    var a = '<img src="' + esc(o.src) + '" alt="' + esc(o.alt) + '"';
    if (o.w && o.h) a += ' width="' + (+o.w) + '" height="' + (+o.h) + '"';
    if (extra.eager) a += ' fetchpriority="high"'; else a += ' loading="lazy"';
    if (extra.cls) a += ' class="' + extra.cls + '"';
    if (o.pos) a += ' style="object-position:' + esc(o.pos) + '"';
    return a + '>';
  }
  function lbBtn(o, group, caption) {
    if (!o || !o.src) return '';
    var cap = caption || o.alt || '';
    return '<button type="button" class="lb-open" data-lb="' + esc(group) + '" data-src="' + esc(o.src) + '" data-cap="' + esc(cap) + '" aria-label="Открыть фото: ' + esc(cap) + '">' + img(o) + '</button>';
  }
  function video(v, cls) {
    if (!v || !v.src) return '';
    return '<video class="' + (cls || '') + '" controls preload="none" playsinline src="' + esc(v.src) + '"' +
      (v.poster ? ' poster="' + esc(v.poster) + '"' : '') + ' aria-label="' + esc(v.title || 'Видео') + '"></video>';
  }
  function head(s, extraCls) {
    if (!s.eyebrow && !s.title && !s.lead) return '';
    return '<header class="sec-head' + (extraCls ? ' ' + extraCls : '') + '">' +
      (s.eyebrow ? '<p class="eyebrow">' + esc(s.eyebrow) + '</p>' : '') +
      (s.title ? '<h2>' + accent(s.title, s.accent, 'gold') + '</h2>' : '') +
      (s.lead ? '<div class="lead">' + paras(s.lead) + '</div>' : '') +
      '</header>';
  }
  function list(a) { return Array.isArray(a) ? a : []; }

  /* ---------- калькулятор ---------- */

  function calc(cfg, st) {
    var total = st.amount * (st.monthly ? 12 : 1) * st.people;
    var items = list(cfg.items).map(function (it) {
      var price = +it.price || 1;
      if (it.mode === 'measure') {
        var packs = total / price;
        return { num: fmt1(packs * (+it.per || 1)) + ' ' + (it.unit || ''), label: it.measureLabel || '', frac: packs % 1 };
      }
      var n = Math.floor(total / price), frac = (total % price) / price;
      if (n === 0) return { num: Math.max(1, Math.round(frac * 100)) + '%', label: it.part || '', frac: frac };
      return { num: fmt(n), label: plural(n, forms(it.forms)), frac: frac };
    });
    var best = null;
    list(cfg.items).forEach(function (it) {
      if (it.mode === 'measure' || !it.who) return;
      var n = Math.floor(total / (+it.price || 1));
      if (n >= 1 && (!best || +it.price > +best.it.price)) best = { it: it, n: n };
    });
    var headline = null;
    if (best) {
      var v = forms(best.it.verb);
      headline = { n: fmt(best.n), count: best.n, icon: best.it.icon,
        text: ' ' + plural(best.n, forms(best.it.who)) + ' ' + (one(best.n) ? v[0] : (v[1] || v[0])) + ' ' + (best.it.tail || '') };
    }
    return {
      total: total,
      totalText: fmt(total) + ' ₽',
      eq: fmt(st.amount) + ' ₽' + (st.monthly ? ' × 12 мес.' : '') + ' × ' + fmt(st.people) + ' чел.',
      perDay: 'Это около ' + fmt(Math.max(1, st.amount / 30)) + ' ₽ в день с человека',
      items: items,
      headline: headline
    };
  }

  /* ---------- разделы ---------- */

  var R = {};

  R.hero = function (s, c) {
    var site = c.site || {};
    var facts = list(s.facts).filter(function (f) { return f.num || f.text; });
    return '<section class="hero" id="' + esc(s.id) + '"><div class="wrap hero-in">' +
      '<div class="hero-text">' +
        (s.eyebrow ? '<p class="eyebrow">' + esc(s.eyebrow) + '</p>' : '') +
        '<h1>' + accent(s.title, s.accent) + '</h1>' +
        (s.lead ? '<div class="lead">' + paras(s.lead) + '</div>' : '') +
        '<div class="hero-cta">' +
          (s.button ? '<a class="btn btn-leaf" href="#' + esc(s.buttonTarget || 'calc') + '">' + esc(s.button) + icon('arrow') + '</a>' : '') +
          (site.phone ? '<a class="btn btn-ghost" href="' + phoneHref(site.phone) + '">' + icon('phone') + esc(site.phone) + '</a>' : '') +
        '</div>' +
        (facts.length ? '<ul class="facts" style="--n:' + Math.min(facts.length, 4) + '">' + facts.map(function (f) {
          return '<li><b>' + esc(f.num) + '</b><span>' + esc(f.text) + '</span></li>';
        }).join('') + '</ul>' : '') +
      '</div>' +
      '<div class="hero-art">' +
        (s.image && s.image.src ? '<div class="arch">' + img(s.image, { eager: true }) + '</div>' : '') +
        (s.photo && s.photo.src ? '<figure class="polaroid">' + img(s.photo) + (s.photoCaption ? '<figcaption>' + icon('heart') + esc(s.photoCaption) + '</figcaption>' : '') + '</figure>' : '') +
        '<span class="badge" role="img" aria-label="Логотип «' + esc(site.brandName) + '»" style="background-image:url(\'' + esc(site.logo || 'images/logo.jpg') + '\')"></span>' +
        (s.note ? '<p class="note">' + icon('camera') + esc(s.note) + '</p>' : '') +
      '</div>' +
    '</div></section>';
  };

  R.name = function (s) {
    return '<section class="band name" id="' + esc(s.id) + '"><div class="wrap">' +
      (s.eyebrow ? '<p class="eyebrow">' + esc(s.eyebrow) + '</p>' : '') +
      '<p class="name-play"><span class="sr">' + esc(s.word1) + ' ' + esc(s.word2) + '</span><span aria-hidden="true">' + esc(s.word1) +
        '</span><span class="gap" aria-hidden="true"></span><span class="w2" aria-hidden="true">' + esc(s.word2) + '</span></p>' +
      '<div class="meanings">' + list(s.cards).map(function (k) {
        return '<div class="meaning"><h3>' + accent(k.title, k.accent, 'em') + '</h3>' + paras(k.text) + '</div>';
      }).join('') + '</div>' +
      (s.verse && s.verse.text ? '<figure class="verse"><blockquote>' + esc(s.verse.text) + '</blockquote>' + (s.verse.ref ? '<cite>' + esc(s.verse.ref) + '</cite>' : '') + '</figure>' : '') +
    '</div></section>';
  };

  R.calc = function (s, c) {
    var site = c.site || {};
    var amounts = list(s.amounts), people = list(s.people);
    var st = { amount: +(amounts[0] && amounts[0].value) || 250, monthly: true, people: +(people[0] && people[0].value) || 1 };
    var r = calc(s, st);
    var min = +s.min || 100, max = +s.max || 10000;
    var chip = function (o, i) {
      return '<button type="button" class="chip" data-v="' + (+o.value) + '" aria-pressed="' + (i === 0) + '">' +
        (+o.value === +site.coffeePrice ? icon('coffee') : '') + fmt(+o.value) + ' ₽' + (o.label ? ' <small>' + esc(o.label) + '</small>' : '') + '</button>';
    };
    var dots = '';
    for (var i = 0; i < 100; i++) dots += '<i' + (i < Math.min(st.people, 100) ? ' class="on"' : '') + '></i>';
    var picto = '';
    if (r.headline) for (var j = 0; j < Math.min(r.headline.count, 40); j++) picto += icon(r.headline.icon);
    return '<section class="band forest" id="' + esc(s.id) + '"><div class="wrap">' + head(s) +
      '<div class="calc-grid"><div class="ctl-wrap">' +
        '<fieldset class="ctl"><legend><span class="step">1</span>' + esc(s.step1 || 'Ваш вклад') + '</legend>' +
          '<div class="seg" role="group" aria-label="Как часто помогать">' +
            '<button type="button" class="seg-btn" data-f="month" aria-pressed="true">' + esc(s.monthlyLabel || 'Каждый месяц') + '</button>' +
            '<button type="button" class="seg-btn" data-f="once" aria-pressed="false">' + esc(s.onceLabel || 'Один раз') + '</button>' +
          '</div>' +
          '<div class="chips amt-chips" role="group" aria-label="Готовые суммы">' + amounts.map(chip).join('') + '</div>' +
          '<label class="range-label" for="amt">Своя сумма <output id="amt-out" for="amt">' + fmt(st.amount) + ' ₽</output></label>' +
          '<input type="range" id="amt" min="' + min + '" max="' + max + '" step="50" value="' + st.amount + '" style="--p:' + ((st.amount - min) / (max - min) * 100).toFixed(1) + '%">' +
          '<div class="range-scale" aria-hidden="true"><span>' + fmt(min) + ' ₽</span><span>' + fmt(max) + ' ₽</span></div>' +
        '</fieldset>' +
        '<fieldset class="ctl"><legend><span class="step">2</span>' + esc(s.step2 || 'Сколько нас') + '</legend>' +
          '<div class="chips ppl-chips" role="group" aria-label="Сколько человек помогает">' + people.map(function (o, i) {
            return '<button type="button" class="chip" data-v="' + (+o.value) + '" aria-pressed="' + (i === 0) + '">' + esc(o.label || fmt(+o.value)) + '</button>';
          }).join('') + '</div>' +
          '<div class="dots" aria-hidden="true">' + dots + '</div>' +
          '<p class="ctl-note"><span>' + esc(s.dotsNote || '') + '</span><b class="dots-note">' + fmt(st.people) + ' из 100</b></p>' +
        '</fieldset>' +
      '</div>' +
      '<div class="result">' +
        '<p class="eq">' + esc(r.eq) + '</p>' +
        '<p class="total"><b class="total-n">' + esc(r.totalText) + '</b><span class="total-note">за год</span></p>' +
        '<p class="perday">' + esc(r.perDay) + '</p>' +
        '<p class="headline" aria-live="polite">' + (r.headline ? '<span class="hn">' + esc(r.headline.n) + '</span>' + esc(r.headline.text) : esc(s.emptyHeadline || '')) + '</p>' +
        '<div class="picto" aria-hidden="true">' + picto + '</div>' +
        '<ul class="res-grid">' + list(s.items).map(function (it, k) {
          var x = r.items[k];
          return '<li class="res">' + icon(it.icon) + '<p class="res-num">' + esc(x.num) + '</p><p class="res-label">' + esc(x.label) + '</p>' +
            (it.sub ? '<p class="res-sub">' + esc(it.sub) + '</p>' : '') + '<span class="res-bar"><i style="--w:' + Math.round(x.frac * 100) + '%"></i></span></li>';
        }).join('') + '</ul>' +
        '<div class="result-cta">' +
          (site.phone ? '<a class="btn btn-gold" href="' + phoneHref(site.phone) + '">' + icon('phone') + esc(s.button || 'Хочу помогать') + '</a><span class="phone-txt">' + esc(site.phone) + '</span>' : '') +
        '</div>' +
        (s.fine ? '<p class="fine">' + esc(s.fine) + '</p>' : '') +
      '</div></div>' +
      '<script type="application/json" class="calc-data">' + JSON.stringify({
        items: s.items, emptyHeadline: s.emptyHeadline || '', min: min, max: max
      }).replace(/</g, '\\u003c') + '</script>' +
    '</div></section>';
  };

  R.rate = function (s, c) {
    var coffee = +(c.site && c.site.coffeePrice) || 250;
    var cup = icon('coffee');
    var rows = [{ name: 'Один стакан кофе', price: coffee, ref: true }].concat(list(s.rows));
    return '<section class="band rate" id="' + esc(s.id) + '"><div class="wrap">' + head(s) +
      '<ul class="rate-list">' + rows.map(function (r) {
        var cups = (+r.price || 0) / coffee, whole = Math.floor(cups), frac = cups - whole, h = '';
        for (var i = 0; i < whole; i++) h += cup;
        if (frac > 0.01) h += '<span class="cup-part" style="--f:' + frac.toFixed(2) + '">' + cup + '</span>';
        var shown = Math.round(cups * 10) / 10;
        var word = shown % 1 !== 0 ? 'стакана' : plural(shown, ['стакан', 'стакана', 'стаканов']);
        return '<li class="rate-row' + (r.ref ? ' ref' : '') + '"><div class="rate-name"><b>' + esc(r.name) + '</b><span>≈ ' + fmt(+r.price) + ' ₽</span></div>' +
          '<div class="cups" aria-hidden="true">' + h + '</div><p class="rate-n">' + shown.toLocaleString('ru-RU') + '<small>' + word + '</small></p></li>';
      }).join('') + '</ul>' +
      ((s.noteLeft || s.noteRight) ? '<div class="rate-foot"><p>' + esc(s.noteLeft) + '</p><p>' + esc(s.noteRight) + '</p></div>' : '') +
    '</div></section>';
  };

  R.stories = function (s) {
    return '<section class="band" id="' + esc(s.id) + '"><div class="wrap">' + head(s) +
      '<div class="deeds">' + list(s.items).map(function (d) {
        var im = list(d.images).filter(function (x) { return x && x.src; });
        return '<article class="deed">' +
          (im.length ? '<div class="deed-media n' + Math.min(im.length, 3) + '">' + im.slice(0, 3).map(function (o, i) {
            return '<div class="dm' + (i === 0 ? ' main' : '') + '">' + lbBtn(o, 'deed-' + esc(s.id)) + '</div>';
          }).join('') + '</div>' : '') +
          '<div class="deed-text">' +
            (d.when ? '<p class="when">' + esc(d.when) + '</p>' : '') +
            (d.title ? '<h3>' + esc(d.title) + '</h3>' : '') + paras(d.text) +
            (d.tag ? '<p class="tag">' + icon(d.icon || 'heart') + esc(d.tag) + '</p>' : '') +
          '</div></article>';
      }).join('') + '</div></div></section>';
  };

  R.center = function (s) {
    var im = list(s.images).filter(function (x) { return x && x.src; });
    var vids = list(s.videos).filter(function (x) { return x && x.src; });
    var mosaic = im.slice(0, 3), rest = im.slice(3);
    return '<section class="band center" id="' + esc(s.id) + '"><div class="wrap">' +
      '<div class="center-grid"><div class="center-text">' + head(s, 'tight') +
        (s.text ? '<div class="center-body">' + paras(s.text) + '</div>' : '') +
        (list(s.list).length ? (s.listTitle ? '<h3 class="list-title">' + esc(s.listTitle) + '</h3>' : '') +
          '<ul class="checklist">' + list(s.list).map(function (l) {
            return '<li>' + icon('check') + '<div><b>' + esc(l.text) + '</b>' + (l.note ? '<span>' + esc(l.note) + '</span>' : '') + '</div></li>';
          }).join('') + '</ul>' : '') +
      '</div>' +
      (mosaic.length ? '<div class="center-mosaic n' + mosaic.length + '">' + mosaic.map(function (o, i) {
        return '<div class="dm' + (i === 0 ? ' main' : '') + '">' + lbBtn(o, 'center') + '</div>';
      }).join('') + '</div>' : '') +
      '</div>' +
      ((rest.length || vids.length) ? '<div class="strip">' +
        vids.map(function (v) { return '<figure class="strip-item vid">' + video(v) + (v.title ? '<figcaption>' + icon('play') + esc(v.title) + '</figcaption>' : '') + '</figure>'; }).join('') +
        rest.map(function (o) { return '<figure class="strip-item">' + lbBtn(o, 'center') + '</figure>'; }).join('') +
      '</div>' : '') +
    '</div></section>';
  };

  R.partners = function (s, c) {
    var showInn = !(c.site && c.site.showInn === false);
    return '<section class="band partners" id="' + esc(s.id) + '"><div class="wrap">' + head(s) +
      '<div class="p-groups">' + list(s.groups).map(function (g) {
        return '<article class="p-group"><header><h3>' + esc(g.title) + '</h3>' + (g.note ? '<span class="p-note">' + esc(g.note) + '</span>' : '') + '</header>' +
          '<ul class="p-list">' + list(g.items).map(function (p) {
            return '<li><b>' + esc(p.org || p.person) + '</b>' +
              (p.org && p.person ? '<span class="p-person">' + esc(p.person) + '</span>' : '') +
              (p.what ? '<span class="p-what">' + esc(p.what) + '</span>' : '') +
              (showInn && p.inn ? '<span class="p-inn">ИНН ' + esc(p.inn) + '</span>' : '') + '</li>';
          }).join('') + '</ul></article>';
      }).join('') + '</div></div></section>';
  };

  R.letters = function (s) {
    return '<section class="band letters" id="' + esc(s.id) + '"><div class="wrap">' + head(s) +
      '<div class="letter-grid">' + list(s.items).filter(function (l) { return l.image && l.image.src; }).map(function (l) {
        var cap = l.caption || 'Благодарственное письмо';
        return '<figure class="letter">' + lbBtn(l.image, 'letters', cap) + '<figcaption>' + esc(cap) + '</figcaption></figure>';
      }).join('') + '</div></div></section>';
  };

  R.gallery = function (s) {
    var items = list(s.items).filter(function (g) { return (g.kind === 'video' ? g.video && g.video.src : g.image && g.image.src); });
    var cats = list(s.categories).filter(function (k) { return items.some(function (g) { return g.cat === k.key; }); });
    return '<section class="band gallery-sec" id="' + esc(s.id) + '"><div class="wrap">' + head(s) +
      (cats.length > 1 ? '<div class="filters" role="group" aria-label="Фильтр фотографий">' +
        '<button type="button" class="filter" data-f="all" aria-pressed="true">Все<span>' + items.length + '</span></button>' +
        cats.map(function (k) {
          var n = items.filter(function (g) { return g.cat === k.key; }).length;
          return '<button type="button" class="filter" data-f="' + esc(k.key) + '" aria-pressed="false">' + esc(k.label) + '<span>' + n + '</span></button>';
        }).join('') + '</div>' : '') +
      '<div class="masonry">' + items.map(function (g) {
        if (g.kind === 'video') {
          return '<figure class="g-item g-video" data-cat="' + esc(g.cat) + '">' + video(g.video) +
            '<span class="g-cap">' + icon('play') + esc(g.video.title || 'Видео') + '</span></figure>';
        }
        return '<figure class="g-item" data-cat="' + esc(g.cat) + '">' + lbBtn(g.image, 'gallery') + '</figure>';
      }).join('') + '</div></div></section>';
  };

  R.help = function (s, c) {
    var site = c.site || {};
    return '<section class="band" id="' + esc(s.id) + '"><div class="wrap">' + head(s) +
      '<div class="help-grid">' + list(s.cards).map(function (k) {
        var btn = '';
        if (k.button === 'phone' && site.phone) btn = '<a class="btn ' + (k.dark ? 'btn-gold' : 'btn-leaf') + '" href="' + phoneHref(site.phone) + '">' + icon('phone') + esc(site.phone) + '</a>';
        if (k.button === 'share') btn = '<button class="btn btn-ghost share-btn" type="button">' + icon('share') + 'Поделиться сайтом</button>';
        if (k.button === 'vk' && site.vk) btn = '<a class="btn btn-ghost" href="' + esc(site.vk) + '" target="_blank" rel="noopener">ВКонтакте</a>';
        return '<article class="help' + (k.size === 'big' ? ' big' : '') + (k.dark ? ' accent' : '') + '">' +
          '<span class="ico">' + icon(k.icon) + '</span><h3>' + esc(k.title) + '</h3>' + paras(k.text) + btn + '</article>';
      }).join('') + '</div></div></section>';
  };

  R.team = function (s) {
    return '<section class="band team" id="' + esc(s.id) + '"><div class="wrap team-in">' +
      (s.image && s.image.src ? '<div class="team-art"><div class="arch">' + img(s.image) + '</div></div>' : '') +
      '<div class="team-text">' +
        (s.eyebrow ? '<p class="eyebrow">' + esc(s.eyebrow) + '</p>' : '') +
        (s.title ? '<h2>' + accent(s.title, s.accent, 'gold') + '</h2>' : '') + paras(s.text) +
        (s.verse && s.verse.text ? '<figure class="team-verse"><blockquote>«' + esc(s.verse.text) + '»</blockquote>' + (s.verse.ref ? '<cite>' + esc(s.verse.ref) + '</cite>' : '') + '</figure>' : '') +
      '</div></div></section>';
  };

  R.faq = function (s, c) {
    return '<section class="band" id="' + esc(s.id) + '"><div class="wrap">' + head(s) +
      '<div class="faq-list">' + list(s.items).map(function (q) {
        return '<details><summary>' + esc(q.q) + icon('plus') + '</summary>' + paras(q.a) + '</details>';
      }).join('') + '</div></div></section>';
  };

  R.text = function (s) {
    return '<section class="band textsec" id="' + esc(s.id) + '"><div class="wrap' + (s.image && s.image.src ? ' textsec-in' : '') + '">' +
      '<div class="textsec-body">' + head(s) + paras(s.text) + '</div>' +
      (s.image && s.image.src ? '<figure class="textsec-img">' + lbBtn(s.image, 'text-' + esc(s.id)) + '</figure>' : '') +
    '</div></section>';
  };

  R.contacts = function (s, c) {
    var site = c.site || {};
    return '<section class="band contact" id="' + esc(s.id) + '"><div class="wrap"><div class="contact-card">' +
      '<div class="contact-main">' +
        (s.eyebrow ? '<p class="eyebrow">' + esc(s.eyebrow) + '</p>' : '') +
        (s.title ? '<h2>' + esc(s.title) + '</h2>' : '') +
        (site.phone ? '<div class="phone-row"><a class="phone-big" href="' + phoneHref(site.phone) + '">' + esc(site.phone) + '</a>' +
          '<button class="copy" type="button" data-copy="' + esc(site.phone) + '">' + icon('copy') + 'Скопировать</button></div>' : '') +
        (s.city ? '<p class="city">' + icon('pin') + esc(s.city) + '</p>' : '') +
        paras(s.text) +
      '</div>' +
      '<div class="socials">' +
        (site.vk ? '<a class="social" href="' + esc(site.vk) + '" target="_blank" rel="noopener"><span class="mark vk">VK</span><span><b>ВКонтакте</b><span>' + esc(s.vkNote || '') + '</span></span>' + icon('ext') + '</a>' : '') +
        (site.max ? '<a class="social" href="' + esc(site.max) + '" target="_blank" rel="noopener"><span class="mark max">MAX</span><span><b>Канал в MAX</b><span>' + esc(s.maxNote || '') + '</span></span>' + icon('ext') + '</a>' : '') +
      '</div></div></div></section>';
  };

  var TYPE_NAMES = {
    hero: 'Первый экран', name: 'Название', calc: 'Калькулятор', rate: 'Курс в стаканах кофе',
    stories: 'Наши дела', center: 'Центр восстановления', partners: 'Благословители', letters: 'Благодарственные письма',
    gallery: 'Фотоотчёт', help: 'Как помочь', team: 'Кто мы', faq: 'Вопросы', text: 'Текст с фото', contacts: 'Контакты'
  };

  /* ---------- страница целиком ---------- */

  function sprite() {
    return '<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">' +
      Object.keys(ICONS).map(function (k) { return '<symbol id="i-' + k + '" viewBox="0 0 24 24">' + ICONS[k] + '</symbol>'; }).join('') + '</svg>';
  }

  function renderBody(c) {
    var site = c.site || {};
    var secs = list(c.sections).filter(function (s) { return s && s.show !== false && R[s.type]; });
    var nav = secs.filter(function (s) { return s.nav; }).map(function (s) { return '<a href="#' + esc(s.id) + '">' + esc(s.nav) + '</a>'; }).join('');
    var logoBg = ' style="background-image:url(\'' + esc(site.logo || 'images/logo.jpg') + '\')"';
    var tel = phoneHref(site.phone);
    return '<div id="bd-root" data-version="' + esc(c.meta && c.meta.updatedAt) + '">' + sprite() +
      '<header class="top"><div class="wrap top-in">' +
        '<a class="brand" href="#' + esc(secs[0] ? secs[0].id : 'top') + '"><span class="emblem" aria-hidden="true"' + logoBg + '></span>' +
          '<span class="brand-name">' + esc(site.brandName) + (site.brandSub ? '<small>' + esc(site.brandSub) + '</small>' : '') + '</span></a>' +
        '<nav class="nav" aria-label="Разделы сайта">' + nav + '</nav>' +
        (site.headerButton ? '<a class="btn btn-gold top-btn" href="#' + esc(site.headerButtonTarget || 'help') + '">' + icon('heart') + esc(site.headerButton) + '</a>' : '') +
        '<button class="burger" type="button" aria-expanded="false" aria-label="Открыть меню">' + icon('menu') + '</button>' +
      '</div></header>' +
      '<main>' + secs.map(function (s) { return R[s.type](s, c); }).join('\n') + '</main>' +
      '<footer class="foot"><div class="wrap"><div class="foot-in">' +
        '<div class="foot-brand"><a class="brand" href="#' + esc(secs[0] ? secs[0].id : 'top') + '"><span class="emblem" aria-hidden="true"' + logoBg + '></span><span class="brand-name">' + esc(site.brandName) + '<small>' + esc(site.legalName || '') + '</small></span></a>' +
          paras(site.footerText) + '</div>' +
        '<nav aria-label="Разделы сайта в подвале">' + nav + '</nav>' +
        '<div class="foot-contacts">' + (site.phone ? '<a href="' + tel + '">' + esc(site.phone) + '</a>' : '') + (site.city ? '<span>' + esc(site.city) + '</span>' : '') + '</div>' +
      '</div><div class="foot-bottom"><span>© ' + new Date().getFullYear() + ' ' + esc(site.legalName || site.brandName) + '</span>' +
        (site.footerQuote ? '<span>' + esc(site.footerQuote) + '</span>' : '') + '</div></div></footer>' +
      '<nav class="dock" aria-label="Быстрая связь">' +
        (site.phone ? '<a class="d-call" href="' + tel + '">' + icon('phone') + 'Позвонить</a>' : '') +
        (site.vk ? '<a class="d-soc" href="' + esc(site.vk) + '" target="_blank" rel="noopener">ВКонтакте</a>' : '') +
        (site.max ? '<a class="d-soc" href="' + esc(site.max) + '" target="_blank" rel="noopener">MAX</a>' : '') +
      '</nav>' +
      '<div class="lb" role="dialog" aria-modal="true" aria-label="Просмотр фотографии" hidden>' +
        '<div class="lb-bar"><span class="lb-count">1 / 1</span><button class="lb-btn lb-close" type="button" aria-label="Закрыть">' + icon('x') + '</button></div>' +
        '<div class="lb-stage"><img class="lb-img" alt=""><button class="lb-btn lb-prev" type="button" aria-label="Предыдущее фото">' + icon('left') + '</button>' +
        '<button class="lb-btn lb-next" type="button" aria-label="Следующее фото">' + icon('right') + '</button></div><p class="lb-cap"></p></div>' +
      '<p class="toast" role="status" hidden></p>' +
    '</div>';
  }

  function renderHead(c, opts) {
    var site = c.site || {};
    opts = opts || {};
    var ld = {
      '@context': 'https://schema.org', '@type': 'NGO', name: site.legalName || site.brandName, alternateName: site.brandName,
      description: site.description, telephone: site.phone, areaServed: site.city, logo: site.logo,
      sameAs: [site.vk, site.max].filter(Boolean)
    };
    return '<title>' + esc(site.title || site.brandName) + '</title>\n' +
      '<meta name="description" content="' + esc(site.description) + '">\n' +
      '<meta name="theme-color" content="#0C3622">\n' +
      '<meta property="og:type" content="website">\n' +
      '<meta property="og:title" content="' + esc(site.title || site.brandName) + '">\n' +
      '<meta property="og:description" content="' + esc(site.description) + '">\n' +
      (site.siteUrl ? '<meta property="og:url" content="' + esc(site.siteUrl) + '">\n<meta property="og:image" content="' + esc(String(site.siteUrl).replace(/\/?$/, '/') + (site.logo || 'images/logo.jpg')) + '">\n' : '') +
      '<link rel="icon" href="' + esc(site.logo || 'images/logo.jpg') + '">\n' +
      '<script type="application/ld+json">' + JSON.stringify(ld).replace(/</g, '\\u003c') + '</script>';
  }

  function page(c, opts) {
    opts = opts || {};
    return '<!doctype html>\n<html lang="ru">\n<head>\n<meta charset="utf-8">\n' +
      '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' +
      (opts.base ? '<base href="' + esc(opts.base) + '">\n' : '') +
      '<!-- Эта страница собирается автоматически из content.json. Править тексты нужно через админку: /admin/ -->\n' +
      renderHead(c, opts) + '\n' +
      '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
      '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Prata&display=swap">\n' +
      '<link rel="stylesheet" href="assets/site.css?v=' + ASSET_V + '">\n' +
      '</head>\n<body>\n' + renderBody(c) + '\n' +
      (opts.noSync ? '<script>window.BD_NO_SYNC = true;</script>\n' : '') +
      '<script src="assets/render.js?v=' + ASSET_V + '" defer></script>\n<script src="assets/site.js?v=' + ASSET_V + '" defer></script>\n' +
      '</body>\n</html>\n';
  }

  root.BDRender = {
    page: page, renderBody: renderBody, renderHead: renderHead, calc: calc,
    esc: esc, fmt: fmt, plural: plural, forms: forms, phoneHref: phoneHref,
    ICONS: ICONS, ICON_NAMES: ICON_NAMES, TYPE_NAMES: TYPE_NAMES, types: Object.keys(R)
  };
})(typeof window !== 'undefined' ? window : globalThis);

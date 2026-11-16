/* Благо Дарю — поведение страницы: меню, калькулятор, просмотр фото, копирование номера. */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var R = window.BDRender;
  var globalsBound = false;

  /* ---------- уведомление и копирование ---------- */
  var toastT;
  function toast(msg) {
    var el = $('.toast');
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastT);
    toastT = setTimeout(function () { el.hidden = true; }, 2600);
  }
  function copyText(text, okMsg) {
    var fail = function () { toast('Не получилось скопировать: ' + text); };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { toast(okMsg); }, fail);
      else fail();
    } catch (e) { fail(); }
  }

  /* ---------- просмотр фото ---------- */
  var lbList = [], lbCur = 0, lbLast = null;
  function lbShow(k) {
    var lb = $('.lb');
    if (!lb || !lbList.length) return;
    lbCur = (k + lbList.length) % lbList.length;
    var b = lbList[lbCur], img = $('.lb-img', lb);
    img.src = b.dataset.src;
    img.alt = b.dataset.cap || '';
    $('.lb-cap', lb).textContent = b.dataset.cap || '';
    $('.lb-count', lb).textContent = (lbCur + 1) + ' / ' + lbList.length;
    var many = lbList.length > 1;
    $('.lb-prev', lb).hidden = !many;
    $('.lb-next', lb).hidden = !many;
  }
  function lbOpen(btn) {
    var lb = $('.lb');
    if (!lb) return;
    lbList = $$('.lb-open[data-lb="' + btn.dataset.lb + '"]').filter(function (x) { return !x.closest('[hidden]'); });
    lbLast = document.activeElement;
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
    lbShow(lbList.indexOf(btn));
    $('.lb-close', lb).focus();
  }
  function lbClose() {
    var lb = $('.lb');
    if (!lb || lb.hidden) return;
    lb.hidden = true;
    document.body.style.overflow = '';
    if (lbLast) lbLast.focus();
  }

  /* ---------- калькулятор ---------- */
  function initCalc(sec) {
    var dataEl = $('.calc-data', sec);
    if (!dataEl || !R) return;
    var cfg = JSON.parse(dataEl.textContent);
    var range = $('input[type=range]', sec);
    var firstPeople = $('.ppl-chips .chip', sec);
    var st = { amount: +range.value, monthly: true, people: firstPeople ? +firstPeople.dataset.v : 1 };
    var dots = $$('.dots i', sec);

    function pressed(group, val) {
      $$('.chip', group).forEach(function (b) { b.setAttribute('aria-pressed', String(+b.dataset.v === val)); });
    }
    function render() {
      var r = R.calc(cfg, st);
      $('#amt-out', sec).textContent = R.fmt(st.amount) + ' ₽';
      range.value = st.amount;
      range.style.setProperty('--p', ((st.amount - cfg.min) / (cfg.max - cfg.min) * 100) + '%');
      pressed($('.amt-chips', sec), st.amount);
      pressed($('.ppl-chips', sec), st.people);
      $$('.seg-btn', sec).forEach(function (b) { b.setAttribute('aria-pressed', String((b.dataset.f === 'month') === st.monthly)); });
      var lit = Math.min(st.people, 100);
      dots.forEach(function (d, k) { d.classList.toggle('on', k < lit); });
      $('.dots-note', sec).textContent = st.people > 100 ? R.fmt(st.people) + ' — это ' + Math.round(st.people / 100) + ' таких полей' : R.fmt(st.people) + ' из 100';
      $('.eq', sec).textContent = r.eq;
      var tot = $('.total-n', sec);
      tot.textContent = r.totalText;
      tot.classList.toggle('long', r.totalText.length > 10);
      $('.total-note', sec).textContent = st.monthly ? 'за год' : 'сразу';
      var pd = $('.perday', sec);
      pd.hidden = !st.monthly;
      pd.textContent = r.perDay;
      var hl = $('.headline', sec);
      hl.innerHTML = r.headline ? '<span class="hn">' + R.esc(r.headline.n) + '</span>' + R.esc(r.headline.text) : R.esc(cfg.emptyHeadline);
      var html = '';
      if (r.headline) {
        var MAX = 40;
        for (var j = 0; j < Math.min(r.headline.count, MAX); j++) html += '<svg class="ic" style="animation-delay:' + (j * 18) + 'ms"><use href="#i-' + R.esc(r.headline.icon) + '"/></svg>';
        if (r.headline.count > MAX) html += '<span class="more">+' + R.fmt(r.headline.count - MAX) + '</span>';
      }
      $('.picto', sec).innerHTML = html;
      $$('.res', sec).forEach(function (li, k) {
        var x = r.items[k];
        if (!x) return;
        $('.res-num', li).textContent = x.num;
        $('.res-label', li).textContent = x.label;
        $('.res-bar i', li).style.setProperty('--w', Math.round(x.frac * 100) + '%');
      });
    }
    $$('.amt-chips .chip', sec).forEach(function (b) { b.addEventListener('click', function () { st.amount = +b.dataset.v; render(); }); });
    $$('.ppl-chips .chip', sec).forEach(function (b) { b.addEventListener('click', function () { st.people = +b.dataset.v; render(); }); });
    $$('.seg-btn', sec).forEach(function (b) { b.addEventListener('click', function () { st.monthly = b.dataset.f === 'month'; render(); }); });
    range.addEventListener('input', function () { st.amount = +range.value; render(); });
  }

  /* ---------- всё вместе ---------- */
  function init() {
    var root = document.getElementById('bd-root');
    if (!root) return;

    var nav = $('.nav', root), burger = $('.burger', root);
    if (burger && nav) {
      burger.addEventListener('click', function () {
        var open = nav.classList.toggle('open');
        burger.setAttribute('aria-expanded', String(open));
        burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
      });
      $$('a', nav).forEach(function (a) {
        a.addEventListener('click', function () { nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); });
      });
    }

    $$('[data-copy]', root).forEach(function (b) {
      b.addEventListener('click', function () { copyText(b.dataset.copy, 'Номер скопирован'); });
    });
    $$('.share-btn', root).forEach(function (b) {
      b.addEventListener('click', function () {
        var url = location.href.split('#')[0];
        var fallback = function () { copyText(url, 'Ссылка на сайт скопирована'); };
        if (navigator.share) navigator.share({ title: document.title, url: url }).catch(function (e) { if (!e || e.name !== 'AbortError') fallback(); });
        else fallback();
      });
    });

    $$('.forest', root).forEach(initCalc);

    $$('.gallery-sec', root).forEach(function (sec) {
      var items = $$('.g-item', sec), filters = $$('.filter', sec);
      filters.forEach(function (f) {
        f.addEventListener('click', function () {
          filters.forEach(function (x) { x.setAttribute('aria-pressed', String(x === f)); });
          items.forEach(function (it) { it.hidden = !(f.dataset.f === 'all' || it.dataset.cat === f.dataset.f); });
        });
      });
    });

    root.addEventListener('click', function (e) {
      var b = e.target.closest('.lb-open');
      if (b) { lbOpen(b); return; }
      if (e.target.closest('.lb-close')) lbClose();
      else if (e.target.closest('.lb-prev')) lbShow(lbCur - 1);
      else if (e.target.closest('.lb-next')) lbShow(lbCur + 1);
      else if (e.target.classList.contains('lb') || e.target.classList.contains('lb-stage')) lbClose();
    });
    var lb = $('.lb', root), sx = null;
    if (lb) {
      lb.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
      lb.addEventListener('touchend', function (e) {
        if (sx === null) return;
        var dx = e.changedTouches[0].clientX - sx;
        if (Math.abs(dx) > 50) lbShow(lbCur + (dx < 0 ? 1 : -1));
        sx = null;
      });
    }

    if (!globalsBound) {
      globalsBound = true;
      var onScroll = function () { var t = $('.top'); if (t) t.classList.toggle('scrolled', window.scrollY > 8); };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
      document.addEventListener('keydown', function (e) {
        var l = $('.lb');
        if (!l || l.hidden) return;
        if (e.key === 'Escape') lbClose();
        if (e.key === 'ArrowLeft') lbShow(lbCur - 1);
        if (e.key === 'ArrowRight') lbShow(lbCur + 1);
      });
    }
  }

  /* Подстраховка: если content.json поменяли в обход админки,
     страница сама пересоберётся из свежих данных. */
  function sync() {
    var root = document.getElementById('bd-root');
    if (window.BD_NO_SYNC || !root || !R || !window.fetch || location.protocol === 'file:') return;
    fetch('content.json?t=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (c) {
        if (!c || !c.meta || c.meta.updatedAt === root.dataset.version) return;
        var wrap = document.createElement('div');
        wrap.innerHTML = R.renderBody(c);
        root.replaceWith(wrap.firstElementChild);
        init();
      })
      .catch(function () {});
  }

  init();
  sync();
})();

/* Админка «Благо Дарю».
   Читает content.json из репозитория GitHub, даёт его редактировать
   и одним коммитом публикует content.json, пересобранный index.html и новые фото. */
(function () {
  'use strict';

  var R = window.BDRender;
  var app = document.getElementById('app');
  var AUTH_KEY = 'bd-admin-auth';

  var S = {
    mode: null,          // 'github' или 'demo'
    gh: { token: '', owner: '', repo: '', branch: '' },
    content: null,
    original: '',
    contentSha: '',
    pending: {},         // путь -> { dataUrl, b64, size }
    sel: 'site',         // 'site' или id раздела
    open: {},            // какие карточки списков раскрыты
    dirty: false
  };

  /* ---------- мелочи ---------- */

  function h(tag, attrs) {
    var el = document.createElement(tag);
    attrs = attrs || {};
    Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
      else if (k === 'value') el.value = v;
      else el.setAttribute(k, v === true ? '' : v);
    });
    for (var i = 2; i < arguments.length; i++) add(el, arguments[i]);
    return el;
  }
  function add(el, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) { c.forEach(function (x) { add(el, x); }); return; }
    el.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  function ic(name) {
    var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('class', 'ic');
    s.setAttribute('viewBox', '0 0 24 24');
    s.innerHTML = R.ICONS[name] || '';
    return s;
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function stamp() { return new Date().toISOString().replace(/\D/g, '').slice(0, 14) + '-' + Math.random().toString(36).slice(2, 6); }
  function siteRoot() { return new URL('../', location.href).href; }
  function srcFor(p) {
    if (!p) return '';
    if (S.pending[p]) return S.pending[p].dataUrl;
    if (/^(https?:|data:)/.test(p)) return p;
    return siteRoot() + p;
  }
  function b64ToText(b64) {
    var bin = atob(String(b64).replace(/\s/g, ''));
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder('utf-8').decode(bytes);
  }

  var toastT;
  function toast(msg, bad) {
    var old = document.querySelector('.toast');
    if (old) old.remove();
    var t = h('div', { class: 'toast' + (bad ? ' bad' : ''), role: 'status' }, msg);
    document.body.append(t);
    clearTimeout(toastT);
    toastT = setTimeout(function () { t.remove(); }, bad ? 7000 : 3500);
  }
  function busy(msg) {
    var b = document.querySelector('.busy');
    if (!msg) { if (b) b.remove(); return; }
    if (!b) { b = h('div', { class: 'busy' }, h('div')); document.body.append(b); }
    b.firstChild.textContent = msg;
  }

  /* ---------- GitHub ---------- */

  function gh(path, opts) {
    opts = opts || {};
    var headers = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', Authorization: 'Bearer ' + S.gh.token };
    if (opts.body) headers['Content-Type'] = 'application/json';
    return fetch('https://api.github.com' + path, {
      method: opts.method || 'GET', headers: headers, cache: 'no-store',
      body: opts.body ? JSON.stringify(opts.body) : undefined
    }).then(function (r) {
      if (r.ok) return r.status === 204 ? null : r.json();
      return r.json().catch(function () { return {}; }).then(function (j) {
        var e = new Error(j.message || r.statusText);
        e.status = r.status;
        throw e;
      });
    });
  }
  function repoPath() { return '/repos/' + S.gh.owner + '/' + S.gh.repo; }

  function readFile(path) {
    return gh(repoPath() + '/contents/' + path + '?ref=' + encodeURIComponent(S.gh.branch)).then(function (f) {
      return { text: b64ToText(f.content), sha: f.sha };
    });
  }

  function detectRepo() {
    var host = location.hostname;
    if (!/\.github\.io$/.test(host)) return '';
    var owner = host.split('.')[0];
    var segs = location.pathname.split('/').filter(Boolean);
    var repo = segs.length && segs[0] !== 'admin' ? segs[0] : owner + '.github.io';
    return owner + '/' + repo;
  }

  function login(token, repoFull, branch, remember) {
    var parts = String(repoFull || '').trim().replace(/^https?:\/\/github\.com\//, '').replace(/\/+$/, '').split('/');
    if (parts.length !== 2 || !parts[0] || !parts[1]) return Promise.reject(new Error('Укажите репозиторий в виде «владелец/название», например ivanov/blago-daryu'));
    S.gh = { token: String(token || '').trim(), owner: parts[0], repo: parts[1], branch: String(branch || '').trim() };
    return gh(repoPath()).then(function (info) {
      if (!S.gh.branch) S.gh.branch = info.default_branch || 'main';
      if (info.permissions && !info.permissions.push) throw new Error('У этого аккаунта нет права изменять репозиторий.');
      return readFile('content.json');
    }).then(function (f) {
      S.mode = 'github';
      S.contentSha = f.sha;
      setContent(JSON.parse(f.text));
      var store = remember ? localStorage : sessionStorage;
      try {
        localStorage.removeItem(AUTH_KEY);
        sessionStorage.removeItem(AUTH_KEY);
        store.setItem(AUTH_KEY, JSON.stringify({ token: S.gh.token, repo: S.gh.owner + '/' + S.gh.repo, branch: S.gh.branch }));
      } catch (e) {}
    }).catch(function (e) {
      if (e.status === 401) throw new Error('Токен не подошёл. Проверьте, что скопировали его целиком и срок действия не истёк.');
      if (e.status === 404) throw new Error('Репозиторий или файл content.json не найден. Проверьте название репозитория и что токену дан доступ именно к нему.');
      if (e.status === 403) throw new Error('GitHub не пустил: ' + e.message);
      throw e;
    });
  }

  function demo() {
    return fetch('../content.json?t=' + Date.now(), { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error('Не нашёл content.json рядом с сайтом.');
      return r.json();
    }).then(function (c) { S.mode = 'demo'; setContent(c); });
  }

  function setContent(c) {
    if (!c.meta) c.meta = {};
    if (!c.site) c.site = {};
    if (!Array.isArray(c.sections)) c.sections = [];
    S.content = c;
    S.original = JSON.stringify(c);
    S.pending = {};
    S.dirty = false;
  }

  function usedPaths() {
    var txt = JSON.stringify(S.content);
    return Object.keys(S.pending).filter(function (p) { return txt.indexOf('"' + p + '"') > -1; });
  }

  function publish() {
    if (S.mode !== 'github') { toast('Чтобы публиковать, войдите с токеном GitHub.', true); return; }
    var problem = check();
    if (problem && !confirm(problem + '\n\nВсё равно опубликовать?')) return;
    var base, files;
    busy('Проверяю, не менялся ли сайт…');
    readFile('content.json').then(function (f) {
      if (f.sha !== S.contentSha && !confirm('После того как вы открыли админку, кто-то уже опубликовал изменения. Если продолжить, они будут заменены вашими. Продолжить?')) throw new Error('cancel');
      var c = clone(S.content);
      c.meta.updatedAt = new Date().toISOString();
      files = [
        { path: 'content.json', content: JSON.stringify(c, null, 2) + '\n', encoding: 'utf-8' },
        { path: 'index.html', content: R.page(c), encoding: 'utf-8' }
      ];
      usedPaths().forEach(function (p) { files.push({ path: p, content: S.pending[p].b64, encoding: 'base64' }); });
      S._next = c;
      busy('Готовлю публикацию…');
      return gh(repoPath() + '/git/ref/heads/' + S.gh.branch);
    }).then(function (ref) {
      base = ref.object.sha;
      return gh(repoPath() + '/git/commits/' + base);
    }).then(function (commit) {
      var tree = [], i = 0;
      function next() {
        if (i >= files.length) return Promise.resolve();
        var f = files[i++];
        busy('Отправляю файлы: ' + i + ' из ' + files.length + '…');
        return gh(repoPath() + '/git/blobs', { method: 'POST', body: { content: f.content, encoding: f.encoding } }).then(function (b) {
          if (f.path === 'content.json') S._contentBlob = b.sha;
          tree.push({ path: f.path, mode: '100644', type: 'blob', sha: b.sha });
          return next();
        });
      }
      return next().then(function () {
        return gh(repoPath() + '/git/trees', { method: 'POST', body: { base_tree: commit.tree.sha, tree: tree } });
      });
    }).then(function (t) {
      busy('Сохраняю…');
      return gh(repoPath() + '/git/commits', { method: 'POST', body: { message: 'Обновление сайта через админку', tree: t.sha, parents: [base] } });
    }).then(function (c) {
      return gh(repoPath() + '/git/refs/heads/' + S.gh.branch, { method: 'PATCH', body: { sha: c.sha } });
    }).then(function () {
      busy();
      S.contentSha = S._contentBlob;
      S.content.meta.updatedAt = S._next.meta.updatedAt;
      S.original = JSON.stringify(S.content);
      S.pending = {};
      S.dirty = false;
      clearDraft();
      renderAll();
      toast('Опубликовано. Сайт обновится через 1–2 минуты.');
    }).catch(function (e) {
      busy();
      if (e.message === 'cancel') return;
      var msg = e.message;
      if (e.status === 403 || e.status === 404) msg = 'GitHub не дал записать файлы. Проверьте, что у токена есть право «Contents: Read and write» для этого репозитория. (' + e.message + ')';
      if (e.status === 409 || e.status === 422) msg = 'Репозиторий изменился во время публикации. Нажмите «Опубликовать» ещё раз. (' + e.message + ')';
      toast('Не получилось опубликовать: ' + msg, true);
    });
  }

  function check() {
    var s = S.content.site || {};
    if (!s.phone) return 'Не указан телефон.';
    var ids = {}, dup = null;
    S.content.sections.forEach(function (x) { if (ids[x.id]) dup = x.id; ids[x.id] = 1; });
    if (dup) return 'Два раздела с одинаковым адресом «' + dup + '».';
    return '';
  }

  /* ---------- черновик ---------- */

  var draftT;
  function draftKey() { return 'bd-admin-draft:' + (S.mode === 'github' ? S.gh.owner + '/' + S.gh.repo : 'demo'); }
  function saveDraft() {
    clearTimeout(draftT);
    draftT = setTimeout(function () {
      try { localStorage.setItem(draftKey(), JSON.stringify({ at: Date.now(), content: S.content })); } catch (e) {}
    }, 600);
  }
  function clearDraft() { try { localStorage.removeItem(draftKey()); } catch (e) {} }
  function readDraft() {
    try {
      var d = JSON.parse(localStorage.getItem(draftKey()) || 'null');
      if (d && d.content && JSON.stringify(d.content) !== S.original) return d;
    } catch (e) {}
    return null;
  }

  function touch() {
    S.dirty = JSON.stringify(S.content) !== S.original || usedPaths().length > 0;
    renderStatus();
    saveDraft();
  }

  /* ---------- фото и видео ---------- */

  function processImage(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var im = new Image();
      im.onload = function () {
        var max = 1600, k = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight));
        var w = Math.round(im.naturalWidth * k), hh = Math.round(im.naturalHeight * k);
        var cv = document.createElement('canvas');
        cv.width = w; cv.height = hh;
        cv.getContext('2d').drawImage(im, 0, 0, w, hh);
        var dataUrl = cv.toDataURL('image/jpeg', 0.82);
        URL.revokeObjectURL(url);
        var path = 'images/photo-' + stamp() + '.jpg';
        S.pending[path] = { dataUrl: dataUrl, b64: dataUrl.split(',')[1], size: Math.round(dataUrl.length * 0.75) };
        resolve({ src: path, alt: '', w: w, h: hh });
      };
      im.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error('Не получилось открыть «' + file.name + '». Подходят JPG и PNG. Фото с iPhone (HEIC) сначала сохраните как JPG.'));
      };
      im.src = url;
    });
  }
  function processVideo(file) {
    return new Promise(function (resolve, reject) {
      if (file.size > 95e6) { reject(new Error('Видео больше 95 МБ, GitHub его не примет. Сожмите ролик или выложите во ВКонтакте.')); return; }
      var rd = new FileReader();
      rd.onload = function () {
        var ext = (file.name.split('.').pop() || 'mp4').toLowerCase().replace(/[^a-z0-9]/g, '') || 'mp4';
        var path = 'video/video-' + stamp() + '.' + ext;
        S.pending[path] = { dataUrl: rd.result, b64: String(rd.result).split(',')[1], size: file.size, video: true };
        if (file.size > 25e6) toast('Видео тяжёлое (' + Math.round(file.size / 1e6) + ' МБ). На телефоне оно будет долго грузиться.');
        resolve(path);
      };
      rd.onerror = function () { reject(new Error('Не получилось прочитать видео.')); };
      rd.readAsDataURL(file);
    });
  }
  function pickFiles(accept, multiple) {
    return new Promise(function (resolve) {
      var inp = h('input', { type: 'file', accept: accept, multiple: multiple || null });
      inp.addEventListener('change', function () { resolve(Array.prototype.slice.call(inp.files || [])); });
      inp.click();
    });
  }
  function uploadImages(multiple) {
    return pickFiles('image/*', multiple).then(function (files) {
      if (!files.length) return [];
      busy('Сжимаю фото…');
      var out = [];
      return files.reduce(function (p, f) {
        return p.then(function () { return processImage(f).then(function (o) { out.push(o); }); });
      }, Promise.resolve()).then(function () { busy(); return out; }).catch(function (e) { busy(); toast(e.message, true); return out; });
    });
  }
  function measure(o) {
    var im = new Image();
    im.onload = function () { o.w = im.naturalWidth; o.h = im.naturalHeight; touch(); };
    im.src = srcFor(o.src);
  }

  function chooseExisting() {
    return new Promise(function (resolve) {
      var close = function (v) { m.remove(); resolve(v || null); };
      var grid = h('div', { class: 'picker' }, h('p', null, 'Загружаю список…'));
      var m = h('div', { class: 'modal', onclick: function (e) { if (e.target === m) close(); } },
        h('div', { class: 'modal-box' },
          h('div', { class: 'modal-h' }, h('h3', null, 'Выберите фото'), h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Закрыть', onclick: function () { close(); } }, ic('x'))),
          h('div', { class: 'modal-b' }, grid),
          h('div', { class: 'modal-f' }, h('button', { class: 'btn', type: 'button', onclick: function () { close(); } }, 'Отмена'))));
      document.body.append(m);
      var listP;
      if (S.mode === 'github') {
        listP = gh(repoPath() + '/contents/images?ref=' + encodeURIComponent(S.gh.branch)).then(function (arr) {
          return arr.filter(function (f) { return f.type === 'file' && /\.(jpe?g|png|webp|gif)$/i.test(f.name); })
            .map(function (f) { return { path: f.path, thumb: f.download_url }; });
        });
      } else {
        var seen = {};
        JSON.stringify(S.content).replace(/"(images\/[^"]+\.(?:jpe?g|png|webp|gif))"/gi, function (x, p) { seen[p] = 1; });
        listP = Promise.resolve(Object.keys(seen).sort().map(function (p) { return { path: p, thumb: srcFor(p) }; }));
      }
      listP.then(function (arr) {
        Object.keys(S.pending).forEach(function (p) { if (!S.pending[p].video) arr.unshift({ path: p, thumb: S.pending[p].dataUrl }); });
        grid.innerHTML = '';
        arr.forEach(function (f) {
          grid.append(h('button', { type: 'button', title: f.path, onclick: function () { close(f.path); } }, h('img', { src: f.thumb, alt: f.path, loading: 'lazy' })));
        });
        if (!arr.length) grid.append(h('p', null, 'Фото пока нет.'));
      }).catch(function (e) { grid.innerHTML = ''; grid.append(h('p', { class: 'err' }, 'Не получилось загрузить список: ' + e.message)); });
    });
  }

  /* ---------- описание полей ---------- */

  function T(k, label, hint) { return { k: k, label: label, type: 'text', hint: hint }; }
  function TA(k, label, hint) { return { k: k, label: label, type: 'textarea', hint: hint }; }
  function N(k, label, hint) { return { k: k, label: label, type: 'number', hint: hint }; }
  function B(k, label, hint) { return { k: k, label: label, type: 'bool', hint: hint }; }
  function SEL(k, label, options, hint) { return { k: k, label: label, type: 'select', options: options, hint: hint }; }
  function IMG(k, label, hint) { return { k: k, label: label, type: 'image', hint: hint }; }
  function IMGS(k, label, hint) { return { k: k, label: label, type: 'images', hint: hint }; }
  function VID(k, label) { return { k: k, label: label, type: 'video' }; }
  function GR(k, label, fields) { return { k: k, label: label, type: 'group', fields: fields }; }
  function L(k, label, fields, o) { o = o || {}; o.k = k; o.label = label; o.type = 'list'; o.fields = fields; return o; }
  function when(f, fn) { f.when = fn; return f; }

  var ICON_OPTS = function () { return Object.keys(R.ICON_NAMES).map(function (k) { return [k, R.ICON_NAMES[k]]; }); };
  var SECTION_OPTS = function () { return S.content.sections.map(function (s) { return [s.id, sectionName(s)]; }); };
  var POS_OPTS = [['', 'По центру'], ['50% 20%', 'Ближе к верху'], ['50% 80%', 'Ближе к низу'], ['25% 50%', 'Левее'], ['75% 50%', 'Правее']];

  var HEAD = [T('eyebrow', 'Надзаголовок', 'Мелкая строка над заголовком'), T('title', 'Заголовок'),
    T('accent', 'Выделить в заголовке', 'Кусок заголовка, который будет другим цветом. Пусто — без выделения.'), TA('lead', 'Текст под заголовком')];
  var VERSE = [TA('text', 'Стих'), T('ref', 'Ссылка', 'Например: 2 Коринфянам 9:15')];

  var SITE_FIELDS = [
    T('brandName', 'Название в шапке'), T('brandSub', 'Подпись под названием'), T('legalName', 'Полное название организации', 'Для подвала и поисковиков'),
    IMG('logo', 'Логотип', 'Квадратная картинка; в кружке видна её середина'),
    T('phone', 'Телефон', 'Как показывать на сайте, например +7 (930) 146-37-16'), T('city', 'Город'),
    T('vk', 'Ссылка на ВКонтакте'), T('max', 'Ссылка на канал MAX'),
    T('headerButton', 'Кнопка в шапке', 'Пусто — кнопки не будет'), SEL('headerButtonTarget', 'Кнопка в шапке ведёт к разделу', SECTION_OPTS),
    N('coffeePrice', 'Цена стакана кофе, ₽', 'Для калькулятора и «курса в стаканах кофе»'),
    B('showInn', 'Показывать ИНН у благословителей'),
    TA('footerText', 'Текст в подвале'), T('footerQuote', 'Цитата в подвале'),
    T('title', 'Заголовок страницы для поисковиков', 'Его видно во вкладке браузера и в Яндексе'),
    TA('description', 'Описание для поисковиков', '1–2 предложения: кто вы и чем помогаете'),
    T('siteUrl', 'Адрес сайта', 'Например https://blago-daryu.ru — нужен, чтобы ссылка красиво выглядела в мессенджерах')
  ];

  var TYPES = {
    hero: { fields: HEAD.concat([T('button', 'Текст зелёной кнопки'), SEL('buttonTarget', 'Кнопка ведёт к разделу', SECTION_OPTS),
      L('facts', 'Цифры под текстом', [T('num', 'Цифра', 'Например 40 или 150+'), T('text', 'Подпись')], { max: 4 }),
      IMG('image', 'Большое фото в арке'), IMG('photo', 'Фото-карточка'), T('photoCaption', 'Подпись на карточке'), T('note', 'Тёмная плашка на фото')]),
      make: function () { return { eyebrow: '', title: 'Новый заголовок', accent: '', lead: '', facts: [] }; } },
    name: { fields: [T('eyebrow', 'Надзаголовок'), T('word1', 'Первое слово'), T('word2', 'Второе слово'),
      L('cards', 'Карточки', [T('title', 'Заголовок'), T('accent', 'Выделить в заголовке'), TA('text', 'Текст')]), GR('verse', 'Стих', VERSE)],
      make: function () { return { word1: 'Благо', word2: 'дарю', cards: [], verse: {} }; } },
    calc: { fields: HEAD.concat([T('step1', 'Шаг 1'), T('step2', 'Шаг 2'), T('monthlyLabel', 'Кнопка «каждый месяц»'), T('onceLabel', 'Кнопка «один раз»'),
      N('min', 'Ползунок: от, ₽'), N('max', 'Ползунок: до, ₽'),
      L('amounts', 'Готовые суммы', [N('value', 'Сумма, ₽'), T('label', 'Подпись', 'Например «стакан кофе». Можно пусто')]),
      L('people', 'Сколько человек', [N('value', 'Человек'), T('label', 'Надпись на кнопке')]),
      T('dotsNote', 'Подпись под точками'), T('button', 'Текст кнопки звонка'), T('emptyHeadline', 'Фраза, если суммы мало'), TA('fine', 'Мелкий текст внизу'),
      L('items', 'Что можно купить', [
        SEL('icon', 'Значок', ICON_OPTS), N('price', 'Цена, ₽'),
        SEL('mode', 'Как считать', [['count', 'Штуками (наборы, подарки)'], ['measure', 'Площадью или весом']]),
        when(T('forms', 'Название: 1 | 2 | 5', 'Через черту: «школьный набор | школьных набора | школьных наборов»'), function (o) { return o.mode !== 'measure'; }),
        when(T('part', 'Если не хватает на целый', 'Например «школьного набора» — будет «86% школьного набора»'), function (o) { return o.mode !== 'measure'; }),
        when(T('who', 'Кто получит: 1 | 2 | 5', 'Для главной фразы: «школьник | школьника | школьников». Пусто — не участвует'), function (o) { return o.mode !== 'measure'; }),
        when(T('verb', 'Глагол: один | много', 'Например «пойдёт | пойдут»'), function (o) { return o.mode !== 'measure'; }),
        when(T('tail', 'Конец фразы', 'Например «в школу с новым рюкзаком»'), function (o) { return o.mode !== 'measure'; }),
        when(N('per', 'Сколько даёт одна покупка', 'Например 5,76 (м² на одну упаковку)'), function (o) { return o.mode === 'measure'; }),
        when(T('unit', 'Единица', 'м², кг'), function (o) { return o.mode === 'measure'; }),
        when(T('measureLabel', 'Подпись', 'Например «утеплённой стены»'), function (o) { return o.mode === 'measure'; }),
        T('sub', 'Пояснение мелким шрифтом')
      ], { make: function () { return { icon: 'gift', price: 1000, mode: 'count', forms: '', part: '', who: '', verb: 'получит | получат', tail: '', sub: '' }; } })]),
      make: function () { return { title: 'Калькулятор', amounts: [{ value: 250, label: 'стакан кофе' }], people: [{ value: 1, label: 'Только я' }], items: [] }; } },
    rate: { fields: HEAD.concat([L('rows', 'Строки (первая строка «стакан кофе» добавляется сама)', [T('name', 'Что'), N('price', 'Цена, ₽')]),
      T('noteLeft', 'Подпись слева'), T('noteRight', 'Подпись справа')]),
      make: function () { return { title: 'Сколько стоит помощь', rows: [] }; } },
    stories: { fields: HEAD.concat([L('items', 'Дела', [T('when', 'Когда', 'Например «Август 2025»'), T('title', 'Заголовок'), TA('text', 'Текст'),
      T('tag', 'Плашка', 'Например «30 детей»'), SEL('icon', 'Значок на плашке', ICON_OPTS), IMGS('images', 'Фото (видно первые три)')],
      { make: function () { return { when: '', title: 'Новое дело', text: '', tag: '', icon: 'heart', images: [] }; } })]),
      make: function () { return { title: 'Наши дела', items: [] }; } },
    center: { fields: HEAD.concat([TA('text', 'Текст'), T('listTitle', 'Заголовок списка'),
      L('list', 'Список: что сделали', [T('text', 'Что'), T('note', 'Кто помог / пояснение')]),
      IMGS('images', 'Фото (первые три — крупно, остальные — лентой ниже)'),
      L('videos', 'Видео', [VID('', 'Видео')], { make: function () { return { src: '', poster: '', title: '' }; } })]),
      make: function () { return { title: 'Новый раздел', text: '', list: [], images: [], videos: [] }; } },
    partners: { fields: HEAD.concat([L('groups', 'Группы', [T('title', 'Название группы', 'Например «Новогодний праздник»'), T('note', 'Плашка', 'Например «150+ детей»'),
      L('items', 'Благословители', [T('org', 'Организация', 'ООО «…» или ИП …'), T('person', 'Имя'), T('inn', 'ИНН'), T('what', 'Чем помогли')],
        { make: function () { return { org: '', person: '', inn: '', what: '' }; } })],
      { make: function () { return { title: 'Новая группа', note: '', items: [] }; } })]),
      make: function () { return { title: 'Благословители', groups: [] }; } },
    letters: { fields: HEAD.concat([L('items', 'Письма', [IMG('image', 'Фото'), T('caption', 'Подпись', 'Кому вручили. Пусто — «Благодарственное письмо»')],
      { bulk: function (img) { return { image: img, caption: '' }; }, make: function () { return { image: null, caption: '' }; } })]),
      make: function () { return { title: 'Благодарственные письма', items: [] }; } },
    gallery: { fields: HEAD.concat([L('categories', 'Рубрики для фильтра', [T('key', 'Код', 'Латиницей, без пробелов: school, center'), T('label', 'Название')],
        { make: function () { return { key: 'cat' + Math.random().toString(36).slice(2, 5), label: 'Новая рубрика' }; } }),
      L('items', 'Фото и видео', [SEL('kind', 'Что это', [['photo', 'Фото'], ['video', 'Видео']]),
        { k: 'cat', label: 'Рубрика', type: 'select', options: function (ctx) { return [['', '—']].concat((ctx.section.categories || []).map(function (c) { return [c.key, c.label]; })); } },
        when(IMG('image', 'Фото'), function (o) { return o.kind !== 'video'; }),
        when(VID('video', 'Видео'), function (o) { return o.kind === 'video'; })],
        { bulk: function (img, ctx) { var cats = ctx.section.categories || []; return { kind: 'photo', cat: cats[0] ? cats[0].key : '', image: img }; },
          make: function () { return { kind: 'photo', cat: '', image: null }; } })]),
      make: function () { return { title: 'Фото', categories: [], items: [] }; } },
    help: { fields: HEAD.concat([L('cards', 'Карточки', [SEL('icon', 'Значок', ICON_OPTS), T('title', 'Заголовок'), TA('text', 'Текст'),
      SEL('button', 'Кнопка', [['none', 'Без кнопки'], ['phone', 'Позвонить'], ['share', 'Поделиться сайтом'], ['vk', 'ВКонтакте']]),
      SEL('size', 'Размер', [['small', 'Обычная'], ['big', 'Широкая']]), B('dark', 'Тёмная карточка')],
      { make: function () { return { icon: 'heart', title: 'Новая карточка', text: '', button: 'none', size: 'small', dark: false }; } })]),
      make: function () { return { title: 'Как помочь', cards: [] }; } },
    team: { fields: [T('eyebrow', 'Надзаголовок'), T('title', 'Заголовок'), T('accent', 'Выделить в заголовке'), TA('text', 'Текст'),
      IMG('image', 'Фото', 'Сюда можно поставить фото команды'), GR('verse', 'Стих', VERSE)],
      make: function () { return { title: 'Кто мы', text: '', verse: {} }; } },
    faq: { fields: HEAD.concat([L('items', 'Вопросы', [T('q', 'Вопрос'), TA('a', 'Ответ')], { make: function () { return { q: 'Новый вопрос', a: '' }; } })]),
      make: function () { return { title: 'Вопросы', items: [] }; } },
    text: { fields: HEAD.concat([TA('text', 'Текст', 'Пустая строка между абзацами'), IMG('image', 'Фото (можно без него)')]),
      make: function () { return { title: 'Новый раздел', text: '' }; } },
    contacts: { fields: [T('eyebrow', 'Надзаголовок'), T('title', 'Заголовок'), T('city', 'Город / адрес'), TA('text', 'Дополнительный текст'),
      T('vkNote', 'Подпись у ВКонтакте'), T('maxNote', 'Подпись у MAX')],
      make: function () { return { title: 'Контакты', city: '' }; } }
  };

  function sectionName(s) { return s.nav || s.title || R.TYPE_NAMES[s.type] || s.type; }

  /* ---------- поля ---------- */

  function fieldWrap(f, control, labelFor) {
    return h('div', { class: 'f' },
      f.label ? (labelFor ? h('label', { for: labelFor }, f.label) : h('span', { class: 'f-label' }, f.label)) : null,
      control,
      f.hint ? h('span', { class: 'hint' }, f.hint) : null);
  }

  var uid = 0;
  function renderField(f, obj, ctx) {
    if (f.when && !f.when(obj)) return null;
    var id = 'fld-' + (++uid);
    var v = obj[f.k];
    switch (f.type) {
      case 'text':
        return fieldWrap(f, h('input', { class: 'inp', id: id, type: 'text', value: v == null ? '' : v,
          oninput: function (e) { obj[f.k] = e.target.value; touch(); } }), id);
      case 'textarea':
        var ta = h('textarea', { class: 'ta', id: id, rows: Math.min(12, Math.max(3, Math.ceil(String(v || '').length / 70) + 1)),
          oninput: function (e) { obj[f.k] = e.target.value; touch(); } });
        ta.value = v == null ? '' : v;
        return fieldWrap(f, ta, id);
      case 'number':
        return fieldWrap(f, h('input', { class: 'inp', id: id, type: 'number', step: 'any', value: v == null ? '' : v,
          oninput: function (e) { obj[f.k] = e.target.value === '' ? '' : Number(String(e.target.value).replace(',', '.')); touch(); } }), id);
      case 'bool':
        return h('div', { class: 'f' }, h('label', { class: 'check' },
          h('input', { type: 'checkbox', checked: v !== false && v != null ? true : null, onchange: function (e) { obj[f.k] = e.target.checked; touch(); } }), f.label),
          f.hint ? h('span', { class: 'hint' }, f.hint) : null);
      case 'select':
        var opts = typeof f.options === 'function' ? f.options(ctx) : f.options;
        var sel = h('select', { class: 'sel', id: id, onchange: function (e) { obj[f.k] = e.target.value; touch(); renderEditor(); } },
          opts.map(function (o) { return h('option', { value: o[0], selected: String(v == null ? '' : v) === String(o[0]) ? true : null }, o[1]); }));
        if (v != null && !opts.some(function (o) { return String(o[0]) === String(v); })) sel.append(h('option', { value: v, selected: true }, v));
        return fieldWrap(f, sel, id);
      case 'image':
        return fieldWrap(f, imageField(obj, f.k));
      case 'images':
        return fieldWrap(f, imagesField(obj, f.k));
      case 'video':
        return fieldWrap(f, videoField(f.k ? (obj[f.k] = obj[f.k] || { src: '', poster: '', title: '' }) : obj));
      case 'group':
        obj[f.k] = obj[f.k] || {};
        return h('fieldset', { class: 'group' }, h('legend', null, f.label), f.fields.map(function (x) { return renderField(x, obj[f.k], ctx); }));
      case 'list':
        if (!Array.isArray(obj[f.k])) obj[f.k] = [];
        return fieldWrap(f, listField(f, obj[f.k], ctx));
    }
    return null;
  }

  function imageField(obj, k) {
    var o = obj[k];
    var has = o && o.src;
    var thumb = h('div', { class: 'thumb' }, has ? h('img', { src: srcFor(o.src), alt: '' }) : 'Нет фото', has && S.pending[o.src] ? h('span', { class: 'new' }, 'новое') : null);
    var set = function (img) { obj[k] = img; touch(); renderEditor(); };
    var side = h('div', { class: 'imgf-side' },
      h('div', { class: 'imgf-btns' },
        h('button', { class: 'btn btn-sm', type: 'button', onclick: function () {
          uploadImages(false).then(function (arr) { if (arr[0]) { arr[0].alt = (o && o.alt) || ''; arr[0].pos = o && o.pos; set(arr[0]); } });
        } }, ic('camera'), 'Загрузить'),
        h('button', { class: 'btn btn-sm', type: 'button', onclick: function () {
          chooseExisting().then(function (p) { if (!p) return; var n = { src: p, alt: (o && o.alt) || '' }; if (o && o.pos) n.pos = o.pos; measure(n); set(n); });
        } }, 'Выбрать из загруженных'),
        has ? h('button', { class: 'btn btn-sm btn-danger', type: 'button', onclick: function () { set(null); } }, 'Убрать') : null),
      has ? h('div', { class: 'f' }, h('span', { class: 'f-label' }, 'Что на фото'),
        h('input', { class: 'inp', type: 'text', value: o.alt || '', placeholder: 'Например: дети с новыми рюкзаками', oninput: function (e) { o.alt = e.target.value; touch(); } }),
        h('span', { class: 'hint' }, 'Нужно для поисковиков и незрячих людей')) : null,
      has ? h('div', { class: 'f' }, h('span', { class: 'f-label' }, 'Что важнее при обрезке'),
        h('select', { class: 'sel', onchange: function (e) { if (e.target.value) o.pos = e.target.value; else delete o.pos; touch(); } },
          POS_OPTS.map(function (p) { return h('option', { value: p[0], selected: (o.pos || '') === p[0] ? true : null }, p[1]); }))) : null);
    return h('div', { class: 'imgf' }, thumb, side);
  }

  function imagesField(obj, k) {
    if (!Array.isArray(obj[k])) obj[k] = [];
    var arr = obj[k];
    var grid = h('div', { class: 'imgs' });
    arr.forEach(function (o, i) {
      if (!o) return;
      var key = 'img:' + o.src;
      grid.append(h('div', { class: 'cell' },
        h('div', { class: 'thumb' + (S.open[key] ? ' sel' : ''), title: o.alt || o.src, onclick: function () { S.open[key] = !S.open[key]; renderEditor(); } },
          h('img', { src: srcFor(o.src), alt: '' }), S.pending[o.src] ? h('span', { class: 'new' }, 'новое') : null),
        h('div', { class: 'cell-tools' },
          h('button', { class: 'icon-btn', type: 'button', title: 'Левее', disabled: i === 0 ? true : null, onclick: function () { arr.splice(i - 1, 0, arr.splice(i, 1)[0]); touch(); renderEditor(); } }, ic('left')),
          h('button', { class: 'icon-btn', type: 'button', title: 'Правее', disabled: i === arr.length - 1 ? true : null, onclick: function () { arr.splice(i + 1, 0, arr.splice(i, 1)[0]); touch(); renderEditor(); } }, ic('right')),
          h('button', { class: 'icon-btn danger', type: 'button', title: 'Убрать', onclick: function () { arr.splice(i, 1); touch(); renderEditor(); } }, ic('x')))));
    });
    var editors = arr.filter(function (o) { return o && S.open['img:' + o.src]; }).map(function (o) {
      return h('div', { class: 'group' }, h('div', { class: 'imgf' }, h('div', { class: 'thumb' }, h('img', { src: srcFor(o.src), alt: '' })),
        h('div', { class: 'imgf-side' },
          h('div', { class: 'f' }, h('span', { class: 'f-label' }, 'Что на фото'), h('input', { class: 'inp', type: 'text', value: o.alt || '', oninput: function (e) { o.alt = e.target.value; touch(); } })),
          h('div', { class: 'f' }, h('span', { class: 'f-label' }, 'Что важнее при обрезке'),
            h('select', { class: 'sel', onchange: function (e) { if (e.target.value) o.pos = e.target.value; else delete o.pos; touch(); } },
              POS_OPTS.map(function (p) { return h('option', { value: p[0], selected: (o.pos || '') === p[0] ? true : null }, p[1]); }))))));
    });
    return h('div', { class: 'list' }, arr.length ? grid : h('span', { class: 'hint' }, 'Фото пока нет.'),
      arr.length ? h('span', { class: 'hint' }, 'Нажмите на фото, чтобы подписать его.') : null, editors,
      h('div', { class: 'list-foot' },
        h('button', { class: 'btn btn-sm', type: 'button', onclick: function () { uploadImages(true).then(function (a) { if (a.length) { a.forEach(function (x) { arr.push(x); }); touch(); renderEditor(); } }); } }, ic('camera'), 'Загрузить фото'),
        h('button', { class: 'btn btn-sm', type: 'button', onclick: function () { chooseExisting().then(function (p) { if (p) { var n = { src: p, alt: '' }; measure(n); arr.push(n); touch(); renderEditor(); } }); } }, 'Выбрать из загруженных')));
  }

  function videoField(o) {
    return h('div', { class: 'vidf' },
      h('div', { class: 'imgf-btns' },
        h('span', { class: 'vid-name' }, o.src ? o.src + (S.pending[o.src] ? ' (новое, ' + Math.round(S.pending[o.src].size / 1e6) + ' МБ)' : '') : 'Видео не выбрано'),
        h('button', { class: 'btn btn-sm', type: 'button', onclick: function () {
          pickFiles('video/mp4,video/*', false).then(function (files) {
            if (!files[0]) return;
            busy('Читаю видео…');
            processVideo(files[0]).then(function (p) { busy(); o.src = p; touch(); renderEditor(); }).catch(function (e) { busy(); toast(e.message, true); });
          });
        } }, ic('play'), o.src ? 'Заменить видео' : 'Загрузить видео')),
      h('div', { class: 'f' }, h('span', { class: 'f-label' }, 'Подпись'), h('input', { class: 'inp', type: 'text', value: o.title || '', oninput: function (e) { o.title = e.target.value; touch(); } })),
      h('div', { class: 'f' }, h('span', { class: 'f-label' }, 'Картинка-обложка'),
        imageField({ get poster() { return o.poster ? { src: o.poster } : null; }, set poster(v) { o.poster = v ? v.src : ''; } }, 'poster')));
  }

  function summary(item) {
    if (!item || typeof item !== 'object') return String(item);
    var t = item.title || item.name || item.org || item.person || item.q || item.caption || item.label || item.when ||
      (item.num ? item.num + ' ' + (item.text || '') : '') || item.text || (item.value != null && item.value !== '' ? String(item.value) : '') ||
      (item.image && item.image.alt) || (item.video && item.video.title) || (item.kind === 'video' ? 'Видео' : '') || 'Без названия';
    return String(t).slice(0, 90);
  }
  function itemThumb(item) {
    if (!item) return null;
    var src = (item.image && item.image.src) || (item.video && item.video.poster) || item.poster || (item.images && item.images[0] && item.images[0].src);
    return src ? h('img', { src: srcFor(src), alt: '' }) : null;
  }

  function listField(f, arr, ctx) {
    var path = ctx.path + '.' + f.k;
    var wrap = h('div', { class: 'list' });
    arr.forEach(function (item, i) {
      var key = path + '.' + i, open = !!S.open[key];
      var mv = function (d) { var j = i + d; if (j < 0 || j >= arr.length) return; arr.splice(j, 0, arr.splice(i, 1)[0]); var a = S.open[key]; S.open[key] = S.open[path + '.' + j]; S.open[path + '.' + j] = a; touch(); renderEditor(); };
      var card = h('div', { class: 'item' + (open ? ' open' : '') },
        h('div', { class: 'item-h' },
          h('button', { class: 'item-t', type: 'button', 'aria-expanded': String(open), onclick: function () { S.open[key] = !open; renderEditor(); } },
            h('span', { class: 'num' }, i + 1), itemThumb(item), h('b', null, summary(item))),
          h('button', { class: 'icon-btn', type: 'button', title: 'Выше', disabled: i === 0 ? true : null, onclick: function () { mv(-1); } }, ic('left')),
          h('button', { class: 'icon-btn', type: 'button', title: 'Ниже', disabled: i === arr.length - 1 ? true : null, onclick: function () { mv(1); } }, ic('right')),
          h('button', { class: 'icon-btn', type: 'button', title: 'Копия', onclick: function () { arr.splice(i + 1, 0, clone(item)); touch(); renderEditor(); } }, ic('copy')),
          h('button', { class: 'icon-btn danger', type: 'button', title: 'Удалить', onclick: function () {
            if (!confirm('Удалить «' + summary(item) + '»?')) return;
            arr.splice(i, 1); touch(); renderEditor();
          } }, ic('x'))),
        open ? h('div', { class: 'item-b' }, f.fields.map(function (x) {
          return renderField(x, item, { section: ctx.section, path: key });
        })) : null);
      card.querySelectorAll('.item-h .icon-btn svg').forEach(function (s, n) { if (n < 2) s.style.transform = 'rotate(90deg)'; });
      wrap.append(card);
    });
    var foot = h('div', { class: 'list-foot' });
    if (!f.max || arr.length < f.max) {
      foot.append(h('button', { class: 'btn btn-sm', type: 'button', onclick: function () {
        var n = f.make ? f.make(ctx) : {};
        arr.push(n);
        S.open[path + '.' + (arr.length - 1)] = true;
        touch(); renderEditor();
      } }, ic('plus'), 'Добавить'));
    }
    if (f.bulk) {
      foot.append(h('button', { class: 'btn btn-sm', type: 'button', onclick: function () {
        uploadImages(true).then(function (imgs) {
          if (!imgs.length) return;
          imgs.forEach(function (im) { arr.push(f.bulk(im, ctx)); });
          touch(); renderEditor();
          toast('Добавлено фото: ' + imgs.length + '. Не забудьте подписать их.');
        });
      } }, ic('camera'), 'Добавить несколько фото'));
    }
    wrap.append(foot);
    return wrap;
  }

  /* ---------- экраны ---------- */

  function renderLogin(errMsg) {
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem(AUTH_KEY) || sessionStorage.getItem(AUTH_KEY) || '{}'); } catch (e) {}
    var token = h('input', { class: 'inp', id: 'tok', type: 'password', autocomplete: 'off', placeholder: 'github_pat_… или ghp_…', value: saved.token || '' });
    var repo = h('input', { class: 'inp', id: 'rep', type: 'text', placeholder: 'владелец/название', value: saved.repo || detectRepo() });
    var branch = h('input', { class: 'inp', id: 'br', type: 'text', placeholder: 'main', value: saved.branch || '' });
    var remember = h('input', { type: 'checkbox', checked: true });
    var err = h('p', { class: 'err', hidden: errMsg ? null : true }, errMsg || '');
    var go = h('button', { class: 'btn btn-main', type: 'submit' }, 'Войти');
    var form = h('form', { class: 'login-card', onsubmit: function (e) {
      e.preventDefault();
      err.hidden = true;
      go.disabled = true; go.textContent = 'Проверяю…';
      login(token.value, repo.value, branch.value, remember.checked).then(start).catch(function (x) {
        go.disabled = false; go.textContent = 'Войти';
        err.textContent = x.message; err.hidden = false;
      });
    } },
      h('div', { class: 'logo' }),
      h('h1', null, 'Админка сайта «Благо Дарю»'),
      h('p', null, 'Здесь можно поменять любой текст, цифры, фото и разделы сайта. Изменения уходят на сайт после кнопки «Опубликовать».'),
      fieldWrap({ label: 'Токен GitHub' }, token, 'tok'),
      h('details', { class: 'howto' }, h('summary', null, 'Где взять токен'),
        h('ol', null,
          h('li', null, 'Откройте ', h('a', { href: 'https://github.com/settings/personal-access-tokens/new', target: '_blank', rel: 'noopener' }, 'github.com → Settings → Fine-grained tokens'), '.'),
          h('li', null, 'Название — любое, срок — например, 1 год.'),
          h('li', null, 'Repository access → Only select repositories → выберите репозиторий сайта.'),
          h('li', null, 'Permissions → Repository permissions → Contents → Read and write.'),
          h('li', null, 'Нажмите Generate token и скопируйте его сюда. Никому его не пересылайте.'))),
      fieldWrap({ label: 'Репозиторий', hint: 'Если админка открыта на github.io, поле заполнится само' }, repo, 'rep'),
      fieldWrap({ label: 'Ветка', hint: 'Обычно main. Можно оставить пустым' }, branch, 'br'),
      h('label', { class: 'check' }, remember, 'Запомнить на этом устройстве'),
      err, go,
      h('div', { class: 'or' }, 'или'),
      h('button', { class: 'btn', type: 'button', onclick: function () { demo().then(start).catch(function (x) { err.textContent = x.message; err.hidden = false; }); } }, 'Посмотреть без входа'));
    app.innerHTML = '';
    app.append(h('div', { class: 'login' }, form));
  }

  function start() {
    S.sel = 'site';
    S.open = {};
    renderAll();
    var d = readDraft();
    if (d) {
      var b = h('div', { class: 'banner' }, 'Есть несохранённый черновик от ' + new Date(d.at).toLocaleString('ru-RU') + '. Новые фото в черновик не попадают.',
        h('span', { class: 'sp' }),
        h('button', { class: 'btn btn-sm', type: 'button', onclick: function () { S.content = d.content; touch(); renderAll(); } }, 'Восстановить'),
        h('button', { class: 'btn btn-sm', type: 'button', onclick: function () { clearDraft(); b.remove(); } }, 'Удалить черновик'));
      document.querySelector('.main').prepend(b);
    }
  }

  function renderAll() {
    app.innerHTML = '';
    var status = h('span', { class: 'status', id: 'status' });
    var pubBtn = h('button', { class: 'btn btn-gold', type: 'button', id: 'pub', onclick: publish }, 'Опубликовать');
    var top = h('header', { class: 'top' },
      h('div', { class: 'logo' }),
      h('div', null, h('b', null, 'Админка'), h('div', { class: 'repo' }, S.mode === 'github' ? S.gh.owner + '/' + S.gh.repo + ' · ' + S.gh.branch : 'Просмотр без входа: опубликовать нельзя')),
      status, h('span', { class: 'sp' }),
      h('a', { class: 'btn', href: '../', target: '_blank', rel: 'noopener' }, 'Сайт'),
      h('button', { class: 'btn', type: 'button', onclick: preview }, 'Предпросмотр'),
      pubBtn,
      h('button', { class: 'btn', type: 'button', title: 'Скачать копию content.json', onclick: backup }, 'Копия'),
      h('button', { class: 'btn', type: 'button', onclick: logout }, 'Выйти'));
    app.append(top, h('div', { class: 'layout' }, h('aside', { class: 'side', id: 'side' }), h('div', { class: 'main', id: 'main' })));
    renderStatus();
    renderSide();
    renderEditor();
  }

  function renderStatus() {
    var st = document.getElementById('status'), pub = document.getElementById('pub');
    if (!st) return;
    var n = usedPaths().length;
    st.className = 'status' + (S.dirty ? ' dirty' : '');
    st.textContent = S.dirty ? 'Есть неопубликованные изменения' + (n ? ' · новых файлов: ' + n : '') : 'Всё опубликовано';
    if (pub) pub.disabled = S.mode !== 'github' || !S.dirty;
  }

  function renderSide() {
    var side = document.getElementById('side');
    if (!side) return;
    side.innerHTML = '';
    var secs = S.content.sections;
    side.append(h('div', { class: 'side-item' + (S.sel === 'site' ? ' on' : '') },
      h('button', { class: 'side-btn', type: 'button', onclick: function () { select('site'); } }, h('b', null, 'Общие настройки'), h('span', null, 'Телефон, ссылки, логотип, поисковики'))));
    side.append(h('div', { class: 'side-h' }, 'Разделы сверху вниз'));
    secs.forEach(function (s, i) {
      side.append(h('div', { class: 'side-item' + (S.sel === s.id ? ' on' : '') + (s.show === false ? ' off' : '') },
        h('button', { class: 'side-btn', type: 'button', onclick: function () { select(s.id); } },
          h('b', null, sectionName(s)), h('span', null, (R.TYPE_NAMES[s.type] || s.type) + (s.show === false ? ' · скрыт' : ''))),
        h('button', { class: 'icon-btn', type: 'button', title: 'Выше', disabled: i === 0 ? true : null, onclick: function () { moveSection(i, -1); } }, rot(ic('left'))),
        h('button', { class: 'icon-btn', type: 'button', title: 'Ниже', disabled: i === secs.length - 1 ? true : null, onclick: function () { moveSection(i, 1); } }, rot(ic('right')))));
    });
    var typeSel = h('select', { class: 'sel', 'aria-label': 'Тип нового раздела' },
      Object.keys(TYPES).map(function (t) { return h('option', { value: t }, R.TYPE_NAMES[t] || t); }));
    typeSel.value = 'text';
    side.append(h('div', { class: 'side-add' }, typeSel, h('button', { class: 'btn btn-sm', type: 'button', onclick: function () { addSection(typeSel.value); } }, ic('plus'), 'Раздел')));
  }
  function rot(svg) { svg.style.transform = 'rotate(90deg)'; return svg; }

  function select(id) {
    S.sel = id;
    renderSide();
    renderEditor();
    window.scrollTo(0, 0);
  }
  function moveSection(i, d) {
    var a = S.content.sections, j = i + d;
    if (j < 0 || j >= a.length) return;
    a.splice(j, 0, a.splice(i, 1)[0]);
    touch(); renderSide();
  }
  function addSection(type) {
    var base = type, id = base, n = 2;
    while (S.content.sections.some(function (s) { return s.id === id; })) id = base + '-' + (n++);
    var s = Object.assign({ id: id, type: type, show: true, nav: '' }, TYPES[type].make());
    var idx = S.content.sections.findIndex(function (x) { return x.type === 'contacts'; });
    if (idx < 0) S.content.sections.push(s); else S.content.sections.splice(idx, 0, s);
    touch();
    select(id);
  }

  function renderEditor() {
    var main = document.getElementById('main');
    if (!main) return;
    var y = window.scrollY;
    var banner = main.querySelector('.banner');
    main.innerHTML = '';
    if (banner) main.append(banner);
    uid = 0;

    var mob = h('select', { class: 'sel', 'aria-label': 'Раздел', onchange: function (e) { select(e.target.value); } },
      h('option', { value: 'site' }, 'Общие настройки'),
      S.content.sections.map(function (s) { return h('option', { value: s.id }, sectionName(s) + (s.show === false ? ' (скрыт)' : '')); }));
    mob.value = S.sel;
    main.append(h('div', { class: 'mob-nav' }, mob));

    if (S.sel === 'site') {
      main.append(h('section', { class: 'card' }, h('div', { class: 'card-h' }, h('h2', null, 'Общие настройки')),
        SITE_FIELDS.map(function (f) { return renderField(f, S.content.site, { section: S.content.site, path: 'site' }); })));
    } else {
      var i = S.content.sections.findIndex(function (s) { return s.id === S.sel; });
      var s = S.content.sections[i];
      if (!s) { S.sel = 'site'; renderEditor(); return; }
      var t = TYPES[s.type] || { fields: [] };
      main.append(h('section', { class: 'card' },
        h('div', { class: 'card-h' }, h('div', null, h('h2', null, sectionName(s)), h('span', { class: 'muted' }, (R.TYPE_NAMES[s.type] || s.type) + ' · адрес #' + s.id)),
          h('div', { class: 'imgf-btns' },
            h('a', { class: 'btn btn-sm', href: '../#' + s.id, target: '_blank', rel: 'noopener' }, 'Открыть на сайте'),
            h('button', { class: 'btn btn-sm btn-danger', type: 'button', onclick: function () {
              if (!confirm('Удалить раздел «' + sectionName(s) + '» целиком? Его можно просто скрыть галочкой ниже.')) return;
              S.content.sections.splice(i, 1); touch(); select('site');
            } }, 'Удалить раздел'))),
        h('div', { class: 'row2' },
          renderField(B('show', 'Показывать на сайте'), s, {}),
          renderField(T('nav', 'Пункт меню', 'Как раздел называется в меню. Пусто — в меню его нет.'), s, {})),
        t.fields.map(function (f) { return renderField(f, s, { section: s, path: s.id }); })));
    }
    window.scrollTo(0, y);
  }

  function preview() {
    var c = clone(S.content);
    var html = R.page(c, { base: siteRoot(), noSync: true });
    Object.keys(S.pending).forEach(function (p) { html = html.split(p).join(S.pending[p].dataUrl); });
    var frame = h('iframe', { title: 'Предпросмотр сайта' });
    var close = function () { box.remove(); document.removeEventListener('keydown', esc); };
    var esc = function (e) { if (e.key === 'Escape') close(); };
    var bPc = h('button', { class: 'btn btn-sm on', type: 'button', onclick: function () { frame.classList.remove('phone'); bPc.classList.add('on'); bPh.classList.remove('on'); } }, 'Компьютер');
    var bPh = h('button', { class: 'btn btn-sm', type: 'button', onclick: function () { frame.classList.add('phone'); bPh.classList.add('on'); bPc.classList.remove('on'); } }, 'Телефон');
    var box = h('div', { class: 'prev' },
      h('div', { class: 'prev-bar' }, h('b', null, 'Предпросмотр: так сайт будет выглядеть после публикации'), h('span', { class: 'sp' }), bPc, bPh,
        h('button', { class: 'btn btn-sm', type: 'button', onclick: close }, 'Закрыть')),
      h('div', { class: 'prev-stage' }, frame));
    document.body.append(box);
    document.addEventListener('keydown', esc);
    frame.srcdoc = html;
  }

  function backup() {
    var blob = new Blob([JSON.stringify(S.content, null, 2)], { type: 'application/json' });
    var a = h('a', { href: URL.createObjectURL(blob), download: 'content-' + new Date().toISOString().slice(0, 10) + '.json' });
    document.body.append(a); a.click(); a.remove();
  }

  function logout() {
    if (S.dirty && !confirm('Есть неопубликованные изменения. Они останутся в черновике на этом устройстве. Выйти?')) return;
    try { localStorage.removeItem(AUTH_KEY); sessionStorage.removeItem(AUTH_KEY); } catch (e) {}
    S.mode = null; S.content = null; S.gh.token = '';
    renderLogin();
  }

  window.addEventListener('beforeunload', function (e) {
    if (S.dirty) { e.preventDefault(); e.returnValue = ''; }
  });

  /* ---------- запуск ---------- */
  (function boot() {
    var saved = null;
    try { saved = JSON.parse(localStorage.getItem(AUTH_KEY) || sessionStorage.getItem(AUTH_KEY) || 'null'); } catch (e) {}
    if (saved && saved.token && saved.repo) {
      app.innerHTML = '<div class="login"><div class="login-card"><p>Вхожу…</p></div></div>';
      login(saved.token, saved.repo, saved.branch, !!localStorage.getItem(AUTH_KEY)).then(start).catch(function (e) { renderLogin(e.message); });
    } else renderLogin();
  })();
})();

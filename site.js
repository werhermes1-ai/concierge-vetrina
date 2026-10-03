// Comanda · vetrina: l'intro del logo, la demo Telegram animata e la barra "Provalo gratis".
// I testi della demo sono quelli di @provacomanda_bot (commit 91e3333 del bot): non inventarne.
(function () {
  // ---- Intro: il foglietto viene scritto, si richiude nella C e vola nella testata.
  // Accesa dallo script in <head> (prima pagina della sessione, niente "riduci movimento").
  // Un tocco, un tasto o lo scroll la chiudono subito.
  var root = document.documentElement;
  var introOn = root.classList.contains('is-intro');
  var introEnd = [];
  (function () {
    var veil = document.querySelector('.intro');
    var logo = veil && veil.querySelector('.intro__logo');
    var dest = document.querySelector('.logo__svg');
    if (!introOn) return;
    if (!veil || !logo || !dest || !window.requestAnimationFrame) { root.classList.remove('is-intro'); introOn = false; return; }
    root.classList.add('intro-js');

    var $ = function (id) { return document.getElementById(id); };
    var paper = $('intro-paper'), shape = $('intro-shape'), rules = $('intro-rules'), ink = $('intro-ink');
    var fold = $('intro-fold'), mark = $('intro-mark'), pencil = $('intro-pencil'), win = $('intro-win-r');

    // Il foglietto e la C hanno gli stessi comandi: si interpolano i numeri uno a uno.
    var FROM = shape.getAttribute('d');
    var TO = 'M 144 31 C 124 17 102 13 80 13 C 41 13 16 39 16 79 C 16 119 43 145 82 145 C 105 145 125 138 145 126 L 145 97 C 125 110 105 117 85 117 C 59 117 46 102 46 79 C 46 55 60 41 84 41 C 105 41 124 47 144 60 Z';
    var NUM = /-?\d+(\.\d+)?/g;
    var a = FROM.match(NUM).map(Number), b = TO.match(NUM).map(Number);

    var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
    var span = function (t, t0, t1) { return clamp((t - t0) / (t1 - t0)); };
    var lerp = function (x, y, p) { return x + (y - x) * p; };
    var inOut = function (p) { return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; };
    var out = function (p) { return 1 - Math.pow(1 - p, 3); };
    var mix = function (c1, c2, p) {
      return 'rgb(' + [0, 1, 2].map(function (i) { return Math.round(lerp(c1[i], c2[i], p)); }).join(',') + ')';
    };
    var CARTA = [255, 253, 249], INCHIOSTRO = [29, 26, 23];

    var FLY = 1600, END = 2050;
    var fly = null; // { dx, dy, k } misurato all'inizio del volo

    function frame(t) {
      // 0-250: il foglietto entra salendo un poco
      var pIn = out(span(t, 0, 250));
      // 750-1200: si richiude nella C e scende alla misura del logo
      var pM = inOut(span(t, 750, 1200));
      var s = lerp(3.2, 1, pM), x = lerp(394, 0, pM), y = lerp(12, 0, pIn) * (1 - pM);
      paper.setAttribute('transform', 'translate(' + x + ' ' + y + ') translate(82 79) scale(' + s + ') translate(-82 -79)');
      paper.setAttribute('opacity', pIn);
      var i = 0;
      shape.setAttribute('d', FROM.replace(NUM, function () { var v = lerp(a[i], b[i], pM); i++; return v.toFixed(2); }));
      shape.setAttribute('fill', mix(CARTA, INCHIOSTRO, pM));
      shape.setAttribute('stroke-width', lerp(1.7, 0, pM));
      rules.setAttribute('opacity', 1 - span(t, 700, 900));

      // 250-650: la matita mattone scrive la riga; 650-780 si alza e sparisce
      var pW = span(t, 250, 650), pUp = out(span(t, 650, 780));
      ink.setAttribute('stroke-dashoffset', 72 * (1 - pW));
      ink.setAttribute('opacity', t < 750 ? 1 : 0);
      pencil.setAttribute('transform', 'translate(' + (46 + 72 * pW) + ' ' + (89 - 14 * pUp) + ')');
      pencil.setAttribute('opacity', Math.min(span(t, 150, 250), 1 - pUp));

      // 750-1200: la riga diventa il segno rosso della C
      var pR = inOut(span(t, 750, 1200));
      mark.setAttribute('opacity', t < 750 ? 0 : 1);
      mark.setAttribute('transform', 'translate(' + lerp(82, 133, pR) + ' ' + lerp(89, 76, pR) + ') scale(' + lerp(1.385, 1, pR) + ' ' + lerp(0.114, 1, pR) + ') translate(-133 -76)');
      fold.setAttribute('opacity', out(span(t, 1050, 1200)));

      // 1150-1500: emerge OMANDA
      win.setAttribute('width', 818 * out(span(t, 1150, 1500)));

      // 1600-2050: il logo vola nella testata; il velo si scioglie tardi, quando il logo sta arrivando
      if (t >= FLY) {
        if (!fly) {
          var r1 = logo.getBoundingClientRect(), r2 = dest.getBoundingClientRect();
          fly = { dx: r2.left - r1.left, dy: r2.top - r1.top, k: r2.width / r1.width };
          veil.style.pointerEvents = 'none';
        }
        var pF = inOut(span(t, FLY, END));
        logo.style.transform = 'translate(' + fly.dx * pF + 'px,' + fly.dy * pF + 'px) scale(' + lerp(1, fly.k, pF) + ')';
        veil.style.backgroundColor = 'rgba(250,246,239,' + (1 - Math.pow(span(t, 1750, END), 3)) + ')';
      }
    }

    var t0 = null, raf = 0, done = false;
    function finish() {
      if (done) return;
      done = true; introOn = false;
      cancelAnimationFrame(raf);
      ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(function (e) { window.removeEventListener(e, skip, true); });
      root.classList.remove('is-intro', 'intro-js');
      veil.remove();
      introEnd.forEach(function (fn) { fn(); });
    }
    function skip() { finish(); }
    function tick(now) {
      if (t0 === null) t0 = now;
      var t = now - t0;
      frame(Math.min(t, END));
      if (t >= END) finish(); else raf = requestAnimationFrame(tick);
    }
    ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(function (e) { window.addEventListener(e, skip, { capture: true, passive: true }); });
    frame(0);
    raf = requestAnimationFrame(tick);
  })();

  var demo = document.getElementById('demo');
  var body = demo && demo.querySelector('[data-demo-body]');
  var field = demo && demo.querySelector('.tg-field');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var HOME = [['⏰ Orari', '✉ Altro'], ['🍽 Menù'], ['📞 Telefono']];
  var MENU = [['🔎 Cerca un piatto'], ['➕ Aggiungi un piatto'], ['‹ indietro']];
  var CARD = [['💶 Cambia prezzo'], ['🙈 Nascondi'], ['🗑 Togli dal menù'], ['‹ indietro']];
  var GRID = [['€ 12.50', '€ 13.00', '€ 13.50'], ['€ 14.00', '€ 14.50', '€ 15.00']];

  // Ogni scena parte `at` millisecondi dopo l'inizio del giro.
  var SCENES = [
    { at: 0, run: function (c) { c.reset(); c.bot('Ciao. Da qui cambi le informazioni del tuo sito.\nOgni modifica passa prima da un\'anteprima: la pubblichi solo se ti convince.', '12:40', HOME); } },
    { at: 1200, run: function (c) { c.tap('🍽 Menù', function () { c.edit('Il menù del sito. Cerca il piatto che vuoi cambiare, oppure aggiungine uno nuovo.', MENU); }); } },
    { at: 2600, run: function (c) { c.tap('🔎 Cerca un piatto', function () { c.bot('Come si chiama il piatto? Rispondi a questo messaggio, anche solo con un pezzo del nome.', '12:41'); }); } },
    { at: 3800, run: function (c) { c.type('carbonara', '12:41'); } },
    { at: 5200, run: function (c) { c.bot('Carbonara\nPrezzo: € 13.00', '12:41', CARD); } },
    { at: 6600, run: function (c) { c.tap('💶 Cambia prezzo', function () { c.edit('Carbonara: adesso è € 13.00. Quale prezzo vuoi mettere?', GRID); }); } },
    { at: 8000, run: function (c) { c.tap('€ 14.00', function () { c.dropKb(); }); } },
    { at: 8700, run: function (c) { c.bot('Preparo l\'anteprima, arriva tra poco.', '12:42'); } },
    { at: 9700, run: function (c) { c.bot('Ecco come viene:\n§prova.sitocomanda.it/…/anteprima/', '12:42', [['🚀 Pubblica', '✗ Annulla']]); } },
    { at: 11100, run: function (c) { c.tap('🚀 Pubblica', function () { c.dropKb(); c.bot('Sto pubblicando, ti avviso appena è online.', '12:42'); }); } },
    { at: 12500, run: function (c) { c.bot('Fatto, è online:\n§prova.sitocomanda.it/…/', '12:42', [['↩️ Annulla']]); } }
  ];
  var END = 13200;   // da qui la chat resta ferma sullo stato finale
  var LOOP = 16500;  // poi ricomincia

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  // "\n" va a capo, una riga che inizia con "§" è un link.
  function fill(p, text) {
    p.textContent = '';
    text.split('\n').forEach(function (line, i) {
      if (i) p.appendChild(document.createElement('br'));
      if (line.charAt(0) === '§') p.appendChild(el('span', 'tg-link', line.slice(1)));
      else p.appendChild(document.createTextNode(line));
    });
  }
  function keyboard(rows) {
    var k = el('div', 'tg-kb');
    rows.forEach(function (r) {
      var row = el('div', 'tg-kb__row');
      r.forEach(function (label) { row.appendChild(el('span', null, label)); });
      k.appendChild(row);
    });
    return k;
  }

  if (demo && body && !reduce && 'IntersectionObserver' in window) {
    var finalHTML = body.innerHTML;
    var timers = [];
    var visible = false;
    var last = null; // { row, msg } dell'ultimo messaggio del bot

    var c = {
      reset: function () { body.innerHTML = ''; body.removeAttribute('data-demo-state'); body.setAttribute('aria-hidden', 'true'); last = null; },
      bot: function (text, time, rows) {
        var msg = el('div', 'tg-msg');
        var p = el('p'); fill(p, text);
        msg.appendChild(p); msg.appendChild(el('time', null, time));
        var row = msg;
        if (rows) { row = el('div', 'tg-row'); row.appendChild(msg); row.appendChild(keyboard(rows)); }
        row.classList.add('is-new');
        body.appendChild(row);
        last = { row: row, msg: msg };
      },
      edit: function (text, rows) {
        if (!last) return;
        fill(last.msg.querySelector('p'), text);
        c.dropKb();
        if (rows) {
          if (last.row === last.msg) {
            var row = el('div', 'tg-row');
            last.msg.parentNode.replaceChild(row, last.msg);
            row.appendChild(last.msg); last.row = row;
          }
          last.row.appendChild(keyboard(rows));
        }
      },
      dropKb: function () {
        var k = last && last.row.querySelector('.tg-kb');
        if (k) k.remove();
      },
      tap: function (label, then) {
        var btn = Array.prototype.filter.call(body.querySelectorAll('.tg-kb span'), function (s) { return s.textContent === label; })[0];
        if (btn) {
          btn.classList.add('is-tap');
          var r = btn.getBoundingClientRect(), d = demo.getBoundingClientRect();
          var dot = el('i', 'tg-tap');
          dot.style.left = (r.left - d.left + r.width / 2) + 'px';
          dot.style.top = (r.top - d.top + r.height / 2) + 'px';
          demo.appendChild(dot);
          timers.push(setTimeout(function () { dot.remove(); }, 500));
        }
        timers.push(setTimeout(function () { if (btn) btn.classList.remove('is-tap'); then(); }, 450));
      },
      type: function (text, time) {
        if (!field) return;
        field.classList.add('is-typing');
        for (var i = 1; i <= text.length; i++) {
          (function (n) { timers.push(setTimeout(function () { field.textContent = text.slice(0, n); }, n * 90)); })(i);
        }
        timers.push(setTimeout(function () {
          field.textContent = 'Messaggio'; field.classList.remove('is-typing');
          var msg = el('div', 'tg-msg tg-msg--me is-new');
          msg.appendChild(el('p', null, text));
          var t = el('time', null, time + ' '); t.appendChild(el('i', 'tg-ticks'));
          msg.appendChild(t);
          body.appendChild(msg);
        }, text.length * 90 + 350));
      }
    };

    var showFinal = function () {
      body.innerHTML = finalHTML;
      body.setAttribute('data-demo-state', 'final');
      body.removeAttribute('aria-hidden');
      last = null;
      if (field) { field.textContent = 'Messaggio'; field.classList.remove('is-typing'); }
      Array.prototype.forEach.call(demo.querySelectorAll('.tg-tap'), function (d) { d.remove(); });
    };
    var stop = function () {
      timers.forEach(clearTimeout); timers = [];
      demo.removeAttribute('data-demo-running');
    };
    var run = function () {
      stop();
      demo.setAttribute('data-demo-running', '');
      SCENES.forEach(function (s) { timers.push(setTimeout(function () { s.run(c); }, s.at)); });
      timers.push(setTimeout(function () { body.setAttribute('data-demo-state', 'final'); }, END));
      timers.push(setTimeout(function () {
        if (visible && !document.hidden) run(); else { stop(); showFinal(); }
      }, LOOP));
    };

    // Durante l'intro la demo aspetta: parte quando il logo è arrivato in testata.
    introEnd.push(function () { if (visible && !document.hidden) run(); });

    new IntersectionObserver(function (entries) {
      visible = entries[entries.length - 1].isIntersecting;
      if (introOn) return;
      if (visible && !document.hidden) { if (!demo.hasAttribute('data-demo-running')) run(); }
      else { stop(); showFinal(); }
    }, { threshold: 0.4 }).observe(demo);

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { stop(); showFinal(); }
      else if (visible && !introOn) run();
    });
  }

  // Barra fissa sul telefono: compare quando la hero è uscita, sparisce sulla chiusura.
  // Su desktop la nasconde il CSS.
  var bar = document.querySelector('.sticky-cta');
  var hero = document.querySelector('.hero');
  var close = document.querySelector('.close');
  if (bar && hero && close && 'IntersectionObserver' in window) {
    var heroIn = true, closeIn = false;
    var sync = function () { bar.hidden = heroIn || closeIn; };
    new IntersectionObserver(function (e) { heroIn = e[e.length - 1].isIntersecting; sync(); }).observe(hero);
    new IntersectionObserver(function (e) { closeIn = e[e.length - 1].isIntersecting; sync(); }).observe(close);
  }
})();

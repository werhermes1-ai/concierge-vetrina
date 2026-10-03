// Comanda · vetrina: la demo Telegram animata e la barra "Provalo gratis".
// I testi della demo sono quelli di @provacomanda_bot (commit 91e3333 del bot): non inventarne.
(function () {
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
      reset: function () { body.innerHTML = ''; body.removeAttribute('data-demo-state'); last = null; },
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

    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible && !document.hidden) { if (!demo.hasAttribute('data-demo-running')) run(); }
      else { stop(); showFinal(); }
    }, { threshold: 0.4 }).observe(demo);

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { stop(); showFinal(); }
      else if (visible) run();
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
    new IntersectionObserver(function (e) { heroIn = e[0].isIntersecting; sync(); }).observe(hero);
    new IntersectionObserver(function (e) { closeIn = e[0].isIntersecting; sync(); }).observe(close);
  }
})();

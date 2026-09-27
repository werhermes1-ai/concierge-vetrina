// Comanda · vetrina: menù, testata, FAQ e la chat demo della hero.
(function () {
  // Menù su telefono
  var menu = document.querySelector('.menu');
  var nav = document.getElementById('nav');
  if (menu && nav) {
    menu.addEventListener('click', function () {
      var open = menu.getAttribute('aria-expanded') === 'true';
      menu.setAttribute('aria-expanded', String(!open));
      menu.setAttribute('aria-label', open ? 'Apri il menù' : 'Chiudi il menù');
      nav.classList.toggle('is-open', !open);
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        menu.setAttribute('aria-expanded', 'false');
        nav.classList.remove('is-open');
      }
    });
  }

  // Bordo della testata quando si scorre
  var top = document.querySelector('.top');
  if (top) {
    var onScroll = function () { top.classList.toggle('is-scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // FAQ: da tablet in su tutte aperte, come nel disegno
  var wide = window.matchMedia('(min-width: 768px)');
  var syncFaq = function () {
    document.querySelectorAll('.faq__list details').forEach(function (d) { d.open = wide.matches; });
  };
  syncFaq();
  if (wide.addEventListener) wide.addEventListener('change', syncFaq);

  // Chat demo
  var chat = document.querySelector('[data-chat]');
  if (!chat) return;
  var body = chat.querySelector('[data-chat-body]');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var busy = false;

  var ASKS = {
    tiramisu: {
      me: 'Aggiungi il tiramisù a 6 €',
      bot: 'Aggiunto ai dolci. Ecco l\'anteprima: lo pubblico?',
      menu: [['Cacio e pepe', '11 €'], ['Carbonara', '13 €'], ['Tiramisù', '6 €', true]]
    },
    chiuso: {
      me: 'Lunedì siamo chiusi',
      bot: 'Fatto: lunedì risulta chiuso negli orari del sito.',
      menu: [['Lunedì', 'chiuso', true], ['Mar–Dom', '12–15 · 19–23']]
    },
    foto: {
      me: 'Cambia la foto della sala',
      bot: 'Mandami la foto e te la metto in copertina. Prima ti faccio vedere com\'è.',
      photo: true
    },
    natale: {
      me: 'Orari di Natale: il 24 solo pranzo, il 25 chiusi',
      bot: 'Aggiunti gli orari delle feste. Tornano normali dal 27.',
      menu: [['24 dicembre', '12–15', true], ['25 dicembre', 'chiuso', true], ['26 dicembre', '12–15 · 19–23']]
    }
  };

  function now() {
    var d = new Date();
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function scrollDown() { body.scrollTop = body.scrollHeight; }

  function siteCard(a) {
    var card = el('div', 'site');
    card.appendChild(el('span', 'site__url', 'dachecco.it'));
    card.appendChild(el('b', 'site__name', 'Da Checco al Portico'));
    if (a.photo) {
      card.appendChild(el('div', 'site__photo'));
    } else {
      var ul = el('ul', 'site__menu');
      a.menu.forEach(function (row) {
        var li = el('li', row[2] ? 'is-new' : '');
        li.appendChild(el('span', null, row[0]));
        li.appendChild(el('span', null, row[1]));
        ul.appendChild(li);
      });
      card.appendChild(ul);
    }
    return card;
  }

  chat.querySelectorAll('[data-ask]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var a = ASKS[btn.getAttribute('data-ask')];
      if (!a || busy || btn.getAttribute('aria-pressed') === 'true') return;
      busy = true;
      btn.setAttribute('aria-pressed', 'true');
      var t = now();

      var me = el('div', 'msg msg--me');
      me.appendChild(el('p', null, a.me));
      me.appendChild(el('time', null, t));
      body.appendChild(me);
      scrollDown();

      var typing = el('div', 'msg msg--bot msg--typing');
      typing.setAttribute('aria-label', 'Comanda sta scrivendo');
      typing.innerHTML = '<i></i><i></i><i></i>';
      setTimeout(function () {
        body.appendChild(typing);
        scrollDown();
      }, reduce ? 0 : 350);

      setTimeout(function () {
        typing.remove();
        var bot = el('div', 'msg msg--bot');
        bot.appendChild(el('p', null, a.bot));
        bot.appendChild(siteCard(a));
        bot.appendChild(el('time', null, t));
        body.appendChild(bot);
        scrollDown();
        busy = false;
      }, reduce ? 0 : 1300);
    });
  });
})();

// Comanda · pagina d'acquisto: link Maps → anteprima → dati e fattura → Stripe Checkout.
// Parla con la cassa sullo stesso dominio (/api/...). Spec: docs/superpowers/specs/2026-10-04-comanda-acquisto-online-design.md §4.
(function () {
  'use strict';

  var KEY = 'comanda-acquisto';
  var CAMPI = ['nome', 'email', 'cellulare', 'ragione_sociale', 'piva', 'sdi', 'pec', 'indirizzo', 'cap', 'comune', 'provincia'];
  var POLL_OGNI = 2000, POLL_PER = 30000, ATTESA_MAX = 20000;

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var stato = { passo: null, anteprima_id: null, scheda: null, posti: null };
  var occupato = false;

  var formLink = $('[data-form-link]');
  var inputLink = $('#link');
  var formOrdine = $('[data-form-order]');
  var trappola = $('#sito_web');
  var condizioni = $('#f-condizioni');
  var annuncio = $('[data-announce]');
  var talk = document.getElementById('parla');

  // ---------- "Parla con noi": copiato da site.js (vetrina) ----------
  // Senza <dialog>.showModal resta il link #parla, che lo apre col CSS :target.
  if (talk && typeof talk.showModal === 'function') {
    document.addEventListener('click', function (e) {
      var t = e.target.closest && e.target.closest('[data-talk]');
      if (t) { e.preventDefault(); talk.showModal(); }
    });
    talk.addEventListener('click', function (e) {
      // tocco fuori dal pannello (sul fondo) o sulla X: si chiude
      if (e.target === talk || (e.target.closest && e.target.closest('[data-talk-close]'))) { e.preventDefault(); talk.close(); }
    });
  }
  function apriParla() {
    if (talk && typeof talk.showModal === 'function' && !talk.open) talk.showModal();
  }

  // ---------- Memoria della sessione (per il ritorno da Stripe annullato) ----------
  function leggi() {
    try { return JSON.parse(sessionStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; }
  }
  function salva() {
    try {
      sessionStorage.setItem(KEY, JSON.stringify({
        link: inputLink.value, anteprima_id: stato.anteprima_id, scheda: stato.scheda,
        campi: valori(), condizioni: condizioni.checked
      }));
    } catch (e) { /* storage pieno o bloccato: la pagina funziona lo stesso */ }
  }
  function dimentica() { try { sessionStorage.removeItem(KEY); } catch (e) {} }
  var salvaPoi = null;
  function salvaTraPoco() { clearTimeout(salvaPoi); salvaPoi = setTimeout(salva, 250); }

  // ---------- Rete ----------
  function chiedi(metodo, percorso, corpo) {
    var ctrl = 'AbortController' in window ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, ATTESA_MAX) : null;
    var opz = { method: metodo, headers: { 'Accept': 'application/json' }, cache: 'no-store', credentials: 'same-origin' };
    if (ctrl) opz.signal = ctrl.signal;
    if (corpo !== undefined) { opz.headers['Content-Type'] = 'application/json'; opz.body = JSON.stringify(corpo); }
    return fetch(percorso, opz).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (dati) { return { status: r.status, dati: dati || {} }; });
    }).finally(function () { if (timer) clearTimeout(timer); });
  }

  // ---------- Annunci e avvisi ----------
  function annuncia(testo) {
    annuncio.textContent = '';
    setTimeout(function () { annuncio.textContent = testo; }, 60);
  }
  function avviso(n, html, tipo) {
    var box = $('[data-alert="' + n + '"]');
    box.classList.toggle('alert--info', tipo === 'info');
    box.innerHTML = html || '';
  }
  var PARLA = '<a href="#parla" data-talk>parla con noi</a>';

  function occupa(btn, si) {
    occupato = si;
    var etichetta = $('[data-label]', btn);
    if (!btn.dataset.idle) btn.dataset.idle = etichetta.textContent;
    etichetta.textContent = si ? btn.dataset.busyLabel : btn.dataset.idle;
    btn.classList.toggle('is-busy', si);
    if (si) btn.setAttribute('aria-disabled', 'true'); else btn.removeAttribute('aria-disabled');
    btn.closest('form').setAttribute('aria-busy', si ? 'true' : 'false');
  }

  // ---------- Passi ----------
  var PASSO_TITOLO = { '1': '#p1-t', '2': '#p2-t', '3': '#p3-t', 'esauriti': '#pe-t' };

  function mostra(passo, opz) {
    opz = opz || {};
    passo = String(passo);
    if ((passo === '2' || passo === '3') && !stato.scheda) passo = '1';
    stato.passo = passo;
    $$('[data-passo]').forEach(function (s) { s.hidden = s.getAttribute('data-passo') !== passo; });
    var numerico = /^[123]$/.test(passo);
    $('[data-bar]').hidden = !numerico;
    $$('[data-pace]').forEach(function (li) {
      var n = li.getAttribute('data-pace');
      li.classList.toggle('is-done', numerico && n < passo);
      if (n === passo) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    });
    if (opz.storia === 'push') history.pushState({ passo: passo }, '');
    else if (opz.storia === 'replace') history.replaceState({ passo: passo }, '', opz.url || location.href);
    if (opz.fuoco !== false) {
      window.scrollTo(0, 0);
      var t = $(PASSO_TITOLO[passo] || '');
      if (t) t.focus({ preventScroll: true });
    }
  }

  window.addEventListener('popstate', function (e) {
    var p = e.state && e.state.passo;
    if (p && /^[123]$/.test(p) && stato.passo !== 'fatto' && stato.passo !== 'esauriti') mostra(p);
  });

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-go]');
    if (!b) return;
    var dove = b.getAttribute('data-go');
    if (dove === '3') { $('[data-who-name]').textContent = stato.scheda ? stato.scheda.nome : ''; }
    mostra(dove, { storia: 'push' });
  });

  // ---------- Posti e prezzo ----------
  function euro(cent) {
    var n = cent / 100;
    var testo = n.toLocaleString('it-IT', cent % 100 ? { minimumFractionDigits: 2, maximumFractionDigits: 2 } : { maximumFractionDigits: 0 });
    return testo + ' €';
  }
  function posti(p) {
    if (!p || typeof p.restanti !== 'number') return;
    stato.posti = p;
    var restanti = Math.max(0, p.restanti), totale = p.totale || 0;
    var riga = $('[data-seats]');
    $('[data-seats-text]').textContent = restanti === 0 ? 'Posti di lancio esauriti'
      : restanti === 1 ? 'Resta 1 posto su ' + totale : 'Restano ' + restanti + ' posti su ' + totale;
    var punti = $('[data-seats-dots]');
    punti.innerHTML = '';
    if (totale > 0 && totale <= 20) {
      for (var i = 0; i < totale; i++) {
        var d = document.createElement('i');
        if (i < totale - restanti) d.className = 'is-taken';
        punti.appendChild(d);
      }
    }
    riga.hidden = false;
    if (typeof p.prezzo_cent === 'number' && p.prezzo_cent > 0) {
      $('[data-lordo]').textContent = euro(p.prezzo_cent);
      $('[data-netto]').textContent = euro(Math.round(p.prezzo_cent / 1.22));
    }
  }
  function leggiPosti(dopo) {
    chiedi('GET', '/api/posti').then(function (r) {
      if (r.status !== 200) return;
      posti(r.dati);
      if (dopo) dopo(r.dati);
    }).catch(function () { /* cassa giù: niente contatore, i passi dicono "riprova" */ });
  }

  // ---------- ① Il link ----------
  var ERRORI_LOCALE = {
    non_maps: '<p>Questo non sembra un link di Google Maps. Su Maps apri il tuo locale, tocca Condividi e copia il link.</p><p>Se non ci riesci, ' + PARLA + '.</p>',
    non_trovato: '<p>Non troviamo il locale da questo link.</p><p>Controlla il link oppure ' + PARLA + '.</p>',
    troppe: '<p>Troppe richieste, riprova fra un\'ora.</p>',
    giu: '<p>Riprova tra poco.</p><p>Oppure ' + PARLA + '.</p>'
  };
  function erroreLocale(codice, status) {
    var chiave = codice === 'non_maps' ? 'non_maps'
      : (codice === 'senza_nome' || codice === 'non_trovato') ? 'non_trovato'
      : (codice === 'troppe' || status === 429) ? 'troppe'
      : 'giu';
    inputLink.setAttribute('aria-invalid', chiave === 'non_maps' ? 'true' : 'false');
    avviso(1, ERRORI_LOCALE[chiave]);
    // ogni intoppo porta a "Parla con noi" (spec §4); il link sbagliato no: quasi sempre è un incolla sbagliato
    if (chiave === 'non_trovato' || chiave === 'giu') apriParla();
  }

  formLink.addEventListener('submit', function (e) {
    e.preventDefault();
    if (occupato) return;
    var link = inputLink.value.trim();
    avviso(1, '');
    if (!link) {
      inputLink.setAttribute('aria-invalid', 'true');
      avviso(1, '<p>Incolla qui il link del tuo locale su Google Maps.</p>');
      inputLink.focus();
      return;
    }
    var btn = $('button[type="submit"]', formLink);
    occupa(btn, true);
    annuncia('Cerco il locale su Google Maps.');
    chiedi('POST', '/api/locale', { link: link }).then(function (r) {
      if (r.status === 200 && r.dati.scheda && r.dati.anteprima_id != null) {
        inputLink.removeAttribute('aria-invalid');
        stato.anteprima_id = r.dati.anteprima_id;
        stato.scheda = r.dati.scheda;
        scheda(stato.scheda);
        salva();
        mostra('2', { storia: 'push' });
      } else {
        erroreLocale(r.dati.errore, r.status);
      }
    }).catch(function () {
      erroreLocale('rete', 0);
    }).finally(function () { occupa(btn, false); });
  });
  inputLink.addEventListener('input', function () { inputLink.removeAttribute('aria-invalid'); salvaTraPoco(); });

  // ---------- ② L'anteprima ----------
  function scheda(s) {
    var nome = s.nome || '';
    var foto = $('[data-place-photos]');
    foto.innerHTML = '';
    (s.foto || []).slice(0, 3).forEach(function (url, i, tutte) {
      var img = document.createElement('img');
      img.loading = 'lazy';
      img.decoding = 'async';
      img.referrerPolicy = 'no-referrer';
      img.setAttribute('referrerpolicy', 'no-referrer');
      img.width = 400; img.height = 400;
      img.alt = tutte.length > 1 ? nome + ', foto ' + (i + 1) : nome;
      img.addEventListener('error', function () {
        img.remove();
        foto.setAttribute('data-n', String(foto.children.length));
      });
      img.src = url;
      foto.appendChild(img);
    });
    foto.setAttribute('data-n', String(foto.children.length));

    $('[data-place-name]').textContent = nome;
    $('[data-place-addr]').textContent = s.indirizzo || '';

    var voto = $('[data-place-rate]');
    voto.innerHTML = '';
    if (typeof s.voto === 'number') {
      var stelle = document.createElement('span');
      stelle.innerHTML = '<span class="star" aria-hidden="true">★</span> ';
      stelle.appendChild(document.createTextNode(s.voto.toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 })));
      var su5 = document.createElement('span'); su5.className = 'sr'; su5.textContent = ' su 5';
      stelle.appendChild(su5);
      voto.appendChild(stelle);
      if (typeof s.recensioni === 'number') {
        var rec = document.createElement('span');
        rec.textContent = ' · ' + s.recensioni.toLocaleString('it-IT') + (s.recensioni === 1 ? ' recensione' : ' recensioni');
        voto.appendChild(rec);
      }
    }
    voto.hidden = !voto.childNodes.length;

    var tel = $('[data-place-tel]');
    tel.textContent = s.telefono ? 'Tel. ' + s.telefono : '';
    tel.hidden = !s.telefono;

    var orari = $('[data-place-hours]');
    var lista = $('[data-place-hours-list]');
    lista.innerHTML = '';
    (s.orari || []).forEach(function (riga) {
      var li = document.createElement('li'); li.textContent = riga; lista.appendChild(li);
    });
    orari.hidden = !lista.children.length;
    orari.open = false;

    $('[data-who-name]').textContent = nome;
  }

  // ---------- ③ Dati e fattura ----------
  function campo(k) { return formOrdine.elements[k]; }
  function valori() {
    var v = {};
    CAMPI.forEach(function (k) { v[k] = campo(k).value.trim(); });
    return v;
  }
  function riempi(v) {
    if (!v) return;
    CAMPI.forEach(function (k) { if (typeof v[k] === 'string') campo(k).value = v[k]; });
  }
  function pulisciErrore(k) {
    var e = document.getElementById('e-' + k);
    if (e) e.textContent = '';
    var f = document.getElementById('f-' + k);
    if (f) f.removeAttribute('aria-invalid');
    if (k === 'sdi' || k === 'pec') { pulisciErrore2('sdi'); pulisciErrore2('pec'); }
  }
  function pulisciErrore2(k) {
    document.getElementById('e-' + k).textContent = '';
    document.getElementById('f-' + k).removeAttribute('aria-invalid');
  }
  function mostraErrori(errori) {
    CAMPI.concat('condizioni').forEach(function (k) {
      var msg = errori[k] || '';
      document.getElementById('e-' + k).textContent = msg;
      var f = document.getElementById('f-' + k);
      if (msg) f.setAttribute('aria-invalid', 'true'); else f.removeAttribute('aria-invalid');
    });
    var primo = $$('[aria-invalid="true"]', formOrdine)[0];
    var n = $$('[aria-invalid="true"]', formOrdine).length;
    if (n) {
      avviso(3, '<p>' + (n === 1 ? 'Controlla il campo segnato.' : 'Controlla i campi segnati.') + '</p>');
      primo.focus();
    } else {
      // il server ha segnato un campo che la pagina non conosce
      avviso(3, '<p>Qualcosa nei dati non torna. Controlla e riprova, oppure ' + PARLA + '.</p>');
    }
  }
  function controllaVuoti(v) {
    var e = {};
    if (!v.nome) e.nome = 'Scrivi nome e cognome.';
    if (!v.email) e.email = "Serve un'email valida.";
    if (!v.cellulare) e.cellulare = 'Serve un numero di cellulare valido.';
    if (!v.ragione_sociale) e.ragione_sociale = 'Scrivi la ragione sociale.';
    if (!v.piva) e.piva = 'Scrivi la partita IVA.';
    if (!v.sdi && !v.pec) e.sdi = 'Serve il codice SDI oppure la PEC.';
    if (!v.indirizzo) e.indirizzo = "Scrivi l'indirizzo della sede.";
    if (!v.cap) e.cap = 'Il CAP ha 5 cifre.';
    if (!v.comune) e.comune = 'Scrivi il comune.';
    if (!v.provincia) e.provincia = 'La sigla della provincia ha 2 lettere.';
    if (!condizioni.checked) e.condizioni = 'Serve accettare le condizioni di vendita.';
    return e;
  }

  formOrdine.addEventListener('input', function (e) {
    var k = e.target.name;
    if (k && k !== 'sito_web') pulisciErrore(k);
    salvaTraPoco();
  });
  condizioni.addEventListener('change', function () { pulisciErrore('condizioni'); salvaTraPoco(); });

  formOrdine.addEventListener('submit', function (e) {
    e.preventDefault();
    if (occupato) return;
    avviso(3, '');
    avviso('3top', '');
    var v = valori();
    var vuoti = controllaVuoti(v);
    if (Object.keys(vuoti).length) { mostraErrori(vuoti); return; }
    var btn = $('button[type="submit"]', formOrdine);
    var corpo = { anteprima_id: stato.anteprima_id, condizioni: condizioni.checked === true, sito_web: trappola.value };
    CAMPI.forEach(function (k) { corpo[k] = v[k]; });
    salva();
    occupa(btn, true);
    annuncia('Preparo il pagamento.');
    var resta = false;
    chiedi('POST', '/api/ordine', corpo).then(function (r) {
      var d = r.dati, err = d.errore;
      if (r.status === 200 && d.url) {
        resta = true; // la pagina se ne va: il bottone resta in attesa
        location.assign(d.url);
      } else if (r.status === 200) {
        fatto(stato.scheda && stato.scheda.nome);
        dimentica();
      } else if (r.status === 400 && err === 'campi' && d.campi) {
        mostraErrori(d.campi);
      } else if (r.status === 404) {
        stato.anteprima_id = null;
        salva();
        mostra('1', { storia: 'push' });
        avviso(1, '<p>La ricerca del locale è scaduta: incolla di nuovo il link. I tuoi dati restano compilati.</p>', 'info');
      } else if (err === 'esauriti') {
        if (stato.posti) posti({ restanti: 0, totale: stato.posti.totale, prezzo_cent: stato.posti.prezzo_cent });
        avviso(3, '<p>Mentre compilavi i posti di lancio sono finiti.</p><p>Se vuoi il sito per il tuo locale, ' + PARLA + '.</p>');
        apriParla();
      } else if (err === 'gia_pagato') {
        avviso(3, '<p>Questo locale risulta già pagato.</p><p>Se non ti torna, ' + PARLA + '.</p>');
      } else if (r.status === 429) {
        avviso(3, '<p>Troppe richieste, riprova fra un\'ora.</p>');
      } else {
        avviso(3, '<p>Il pagamento non risponde. Riprova tra poco.</p><p>Oppure ' + PARLA + '.</p>');
        apriParla();
      }
    }).catch(function () {
      avviso(3, '<p>Il pagamento non risponde. Riprova tra poco.</p><p>Oppure ' + PARLA + '.</p>');
      apriParla();
    }).finally(function () { if (!resta) occupa(btn, false); });
  });

  // Tornando indietro da Stripe col tasto del browser la pagina può riaprirsi dalla cache:
  // il bottone non deve restare "in attesa".
  window.addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    $$('button[type="submit"]').forEach(function (b) { if (b.classList.contains('is-busy')) occupa(b, false); });
  });

  // ---------- ⑤ Fatto ----------
  function blocco(quale, fuoco) {
    $$('[data-done]').forEach(function (b) { b.hidden = b.getAttribute('data-done') !== quale; });
    var t = $('[data-done="' + quale + '"] .step__title');
    if (t) $('[data-passo="fatto"]').setAttribute('aria-labelledby', t.id);
    if ((quale !== 'attesa' || fuoco) && t) { window.scrollTo(0, 0); t.focus({ preventScroll: true }); }
  }
  function fatto(locale) {
    $('[data-done-text]').textContent = (locale ? 'Il sito di ' + locale : 'Il sito del tuo locale') +
      ' è in arrivo: entro 48 ore te lo mandiamo su WhatsApp, poi attiviamo Comanda su Telegram.';
    mostra('fatto', { fuoco: false });
    blocco('ok');
  }
  function aspetta(id, fuoco) {
    var inizio = Date.now();
    var memoria = leggi();
    mostra('fatto', { fuoco: false });
    blocco('attesa', fuoco);
    annuncia('Controllo il pagamento.');
    function nonAncora() { blocco('no'); }
    function giro() {
      chiedi('GET', '/api/ordine/' + encodeURIComponent(id)).then(function (r) {
        if (r.status === 200 && r.dati.pagato) {
          fatto(r.dati.locale || (memoria.scheda && memoria.scheda.nome));
          dimentica();
        } else if (r.status === 404) {
          nonAncora();
        } else if (Date.now() - inizio + POLL_OGNI > POLL_PER) {
          nonAncora();
        } else {
          setTimeout(giro, POLL_OGNI);
        }
      }).catch(function () {
        if (Date.now() - inizio + POLL_OGNI > POLL_PER) nonAncora(); else setTimeout(giro, POLL_OGNI);
      });
    }
    giro();
  }

  // ---------- Avvio ----------
  var q = new URLSearchParams(location.search);
  var idFatto = q.get('fatto');
  var memoria = leggi();

  if (memoria.link) inputLink.value = memoria.link;
  riempi(memoria.campi);
  if (memoria.condizioni) condizioni.checked = true;

  if (idFatto) {
    $('[data-done-retry]').addEventListener('click', function () { aspetta(idFatto, true); });
    aspetta(idFatto);
  } else {
    var annullato = q.get('annullato') === '1';
    var pulito = location.pathname;
    if (annullato && memoria.scheda && memoria.anteprima_id != null) {
      stato.anteprima_id = memoria.anteprima_id;
      stato.scheda = memoria.scheda;
      scheda(stato.scheda);
      mostra('3', { storia: 'replace', url: pulito });
      avviso('3top', '<p>Pagamento annullato: i tuoi dati sono ancora qui. Quando vuoi, riprova.</p>', 'info');
    } else {
      if (memoria.scheda && memoria.anteprima_id != null) {
        // ricarica a metà strada: i dati restano, la scheda si ritrova col link
        stato.anteprima_id = memoria.anteprima_id;
        stato.scheda = memoria.scheda;
        scheda(stato.scheda);
      }
      mostra('1', { storia: 'replace', url: annullato ? pulito : location.href, fuoco: annullato });
      if (annullato) avviso(1, '<p>Pagamento annullato. Ricomincia dal link del tuo locale.</p>', 'info');
    }
    leggiPosti(function (p) {
      if (!p.aperto || p.restanti <= 0) {
        // dopo un annullamento il posto può essere ancora prenotato da noi: decide la cassa
        if (!annullato) mostra('esauriti', { fuoco: !!document.activeElement && document.activeElement !== document.body });
      }
    });
  }
})();

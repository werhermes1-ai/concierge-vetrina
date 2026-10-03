// Comanda · vetrina: l'intro del logo, la demo Telegram animata, il pannello "Parla con noi" e la barra fissa.
// I testi della demo sono quelli di @provacomanda_bot (commit 91e3333 del bot): non inventarne.
(function () {
  // ---- Intro: il logo del teaser Comanda (video-studio/projects/2026-10-02-comanda-teaser,
  // drawLogo). Il foglietto cade, si scrive, si avvolge nella C, la C tira fuori OMANDA;
  // poi il logo vola nella testata. Stesso disegno, tempi accorciati per il sito.
  // Accesa dallo script in <head> (prima pagina della sessione, niente "riduci movimento").
  // Un tocco, un tasto o lo scroll la chiudono subito.
  var root = document.documentElement;
  var introOn = root.classList.contains('is-intro');
  var introEnd = [];
  (function () {
    var veil = document.querySelector('.intro');
    var cv = veil && veil.querySelector('.intro__cv');
    var dest = document.querySelector('.logo__svg');
    var omanda = document.getElementById('logo-omanda');
    if (!introOn) return;
    if (!veil || !cv || !cv.getContext || !dest || !omanda || !window.Path2D || !window.requestAnimationFrame) {
      root.classList.remove('is-intro'); introOn = false; return;
    }
    root.classList.add('intro-js');
    var ctx = cv.getContext('2d');

    var clamp01 = function (x) { return Math.max(0, Math.min(1, x)); };
    var lerp = function (a, b, k) { return a + (b - a) * k; };
    var smooth = function (a, b, x) { var k = clamp01((x - a) / (b - a)); return k * k * (3 - 2 * k); };
    var eIO3 = function (u) { return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
    var eOut3 = function (u) { return 1 - Math.pow(1 - u, 3); };
    var eBack = function (u, s) { var c3 = s + 1; return 1 + c3 * Math.pow(u - 1, 3) + s * Math.pow(u - 1, 2); };
    var mixHex = function (h1, h2, k) {
      var a = parseInt(h1.slice(1), 16), b = parseInt(h2.slice(1), 16);
      return 'rgb(' + [16, 8, 0].map(function (s) { return Math.round(lerp((a >> s) & 255, (b >> s) & 255, k)); }).join(',') + ')';
    };

    // Tempi in secondi dall'apertura (nel teaser: 4,8 s a 118 BPM).
    var LG = {
      drop: 0, w: [0.3, 0.5, 0.7], m0: 1.15, m1: 1.9, mv0: 1.95, mv1: 2.35, l0: 2.3, lDur: 0.6,
      fly0: 2.9, fly1: 3.35,
      S1: 2.0, C0: [540, 860], S2: 3.4, CC: [87.5, 79]
    };
    var PAPER = '#FAF6EF', FOLDC = '#D9D2C6', INK = '#1D1A17', INK2 = '#3A352F', BRICK = '#B8412A';
    var SLIP_LINES = [[196, 352, 201, INK], [186, 342, 257, INK], [176, 332, 313, BRICK]];
    var HOLES = [175.5, 220.5, 265.5, 310.5, 355.5];
    var LETTERS = [[[0, 1], 86, 161], [[2], 176, 237], [[3, 4], 238, 322], [[5], 330, 408], [[6, 7], 420, 513], [[8, 9], 500, 573]];
    // Spazio del teaser: 1080 x 1920, lockup 988 x 160 largo 890, centrato a y 840.
    var LK = 0.9, LX = (1080 - 988 * LK) / 2, LY = 840 - 80 * LK;
    var TAB = [[107, 71], [159, 53], [159, 82], [107, 99]];
    var P = {
      C: 'M 144 31 C 124 17 102 13 80 13 C 41 13 16 39 16 79 C 16 119 43 145 82 145 C 105 145 125 138 145 126 L 145 97 C 125 110 105 117 85 117 C 59 117 46 102 46 79 C 46 55 60 41 84 41 C 105 41 124 47 144 60 Z',
      FOLD: 'M 17 68 C 23 39 49 19 79 14 C 61 26 46 43 41 62 C 34 81 37 101 47 116 C 26 104 14 87 17 68 Z',
      RED: 'M 111 69 L 155 54 Q 159 53 159 58 L 159 78 Q 159 82 155 83 L 111 98 Q 107 99 107 94 L 107 76 Q 107 71 111 69 Z',
      OUTER: 'M 144 31 C 124 17 102 13 80 13 C 41 13 16 39 16 79 C 16 119 43 145 82 145 C 105 145 125 138 145 126',
      INNER: 'M 144 60 C 124 47 105 41 84 41 C 60 41 46 55 46 79 C 46 102 59 117 85 117 C 105 117 125 110 145 97',
      SLIP: 'M150 118 L382 118 L382 336 L304 424 L150 424 Z',
      SLIPFOLD: 'M382 336 L304 424 L378 408 Z'
    };

    // Geometria: bordi della C campionati con getPointAtLength, lettere di OMANDA dal logo in testata.
    var ns = 'http://www.w3.org/2000/svg', tmp = document.createElementNS(ns, 'svg');
    tmp.setAttribute('width', '0'); tmp.setAttribute('height', '0'); tmp.style.position = 'absolute';
    var po = document.createElementNS(ns, 'path'), pi = document.createElementNS(ns, 'path');
    po.setAttribute('d', P.OUTER); pi.setAttribute('d', P.INNER);
    tmp.appendChild(po); tmp.appendChild(pi); document.body.appendChild(tmp);
    var N = 96, Lo = po.getTotalLength(), Li = pi.getTotalLength(), outer = [], inner = [], i;
    for (i = 0; i <= N; i++) {
      var pa = po.getPointAtLength(Lo * i / N), pb = pi.getPointAtLength(Li * i / N);
      outer.push([pa.x, pa.y]); inner.push([pb.x, pb.y]);
    }
    tmp.remove();
    var midLen = 0, wSum = 0;
    for (i = 0; i <= N; i++) {
      wSum += Math.hypot(outer[i][0] - inner[i][0], outer[i][1] - inner[i][1]);
      if (i) midLen += Math.hypot((outer[i][0] + inner[i][0] - outer[i - 1][0] - inner[i - 1][0]) / 2, (outer[i][1] + inner[i][1] - outer[i - 1][1] - inner[i - 1][1]) / 2);
    }
    var subs = omanda.getAttribute('d').split('Z').filter(function (s) { return s.trim(); }).map(function (s) { return s + 'Z'; });
    var G = {
      N: N, outer: outer, inner: inner, midLen: midLen, wAvg: wSum / (N + 1),
      letters: LETTERS.map(function (l) { return new Path2D(l[0].map(function (k) { return subs[k]; }).join(' ')); }),
      C: new Path2D(P.C), FOLD: new Path2D(P.FOLD), RED: new Path2D(P.RED), SLIP: new Path2D(P.SLIP), SLIPFOLD: new Path2D(P.SLIPFOLD)
    };

    // Dallo spazio del teaser allo schermo: K, OX, OY (pixel del canvas, con il dpr).
    var K = 1, OX = 0, OY = 0, DPR = 1, VW = 0, VH = 0;
    var T = function (a, b, c, d, e, f) { ctx.setTransform(K * a, K * b, K * c, K * d, K * e + OX, K * f + OY); };
    var I1 = function () { T(1, 0, 0, 1, 0, 0); };
    function size() {
      DPR = Math.min(window.devicePixelRatio || 1, 2); VW = window.innerWidth; VH = window.innerHeight;
      cv.width = Math.round(VW * DPR); cv.height = Math.round(VH * DPR);
    }
    function centre() {
      var lockW = Math.min(VW * 0.84, 544), k = lockW / (988 * LK);
      return [k * DPR, (VW / 2 - 540 * k) * DPR, (VH * 0.5 - 840 * k) * DPR];
    }
    function header() {
      // come preserveAspectRatio "meet" dell'SVG in testata: stessa scala, stesso centraggio
      var r = dest.getBoundingClientRect(), m = Math.min(r.width / 988, r.height / 160), k = m / LK;
      var x = r.left + (r.width - 988 * m) / 2, y = r.top + (r.height - 160 * m) / 2;
      return [k * DPR, (x - LX * k) * DPR, (y - LY * k) * DPR];
    }

    function slipPose(t) {
      var pd = clamp01((t - LG.drop) / 0.5);
      var y = -1500 * (1 - eBack(pd, 1.3));
      var r = -8 + 16 * (1 - eOut3(pd));
      var k = t - LG.drop - 0.5;
      if (k > 0) { r += 6 * Math.exp(-3.2 * k) * Math.sin(9 * k); y += 8 * Math.sin(2.4 * k); }
      return { x: LG.C0[0], y: LG.C0[1] + y, r: r * Math.PI / 180 };
    }
    function cXform(t) {
      var k = eIO3(clamp01((t - LG.mv0) / (LG.mv1 - LG.mv0)));
      return [lerp(LG.C0[0], LX + (4 + LG.CC[0]) * LK, k), lerp(LG.C0[1], LY + LG.CC[1] * LK, k), lerp(LG.S2, LK, k)];
    }
    var cPt = function (p, X) { return [X[0] + X[2] * (p[0] - LG.CC[0]), X[1] + X[2] * (p[1] - LG.CC[1])]; };
    function drawTab(q, r) {
      // quadrilatero con angoli arrotondati: poligono rientrato di r + tratto spesso 2r
      var area = 0;
      q.forEach(function (p, i) { var n = q[(i + 1) % 4]; area += p[0] * n[1] - n[0] * p[1]; });
      var sg = area > 0 ? 1 : -1;
      var nrm = function (a, b) { var dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [-sg * dy / l, sg * dx / l]; };
      ctx.beginPath();
      q.forEach(function (p, i) {
        var a = q[(i + 3) % 4], b = q[(i + 1) % 4], n1 = nrm(a, p), n2 = nrm(p, b);
        var k = r / Math.max(0.2, 1 + n1[0] * n2[0] + n1[1] * n2[1]);
        var x = p[0] + (n1[0] + n2[0]) * k, y = p[1] + (n1[1] + n2[1]) * k;
        if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      });
      ctx.closePath();
      ctx.fillStyle = BRICK; ctx.strokeStyle = BRICK; ctx.lineJoin = 'round'; ctx.lineWidth = 2 * r;
      ctx.fill(); ctx.stroke();
    }

    // f: 0 sul velo scuro (carta crema, come nel teaser), 1 in testata (inchiostro su crema).
    function drawLogo(t, f) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      var pose = slipPose(t);
      var sh = 1 - f;
      var shadowOn = function () { ctx.shadowColor = 'rgba(0,0,0,' + (0.5 * sh) + ')'; ctx.shadowBlur = 50 * K; ctx.shadowOffsetY = 24 * K; };
      var shadowOff = function () { ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; };
      var writeP = function (i) { return eOut3(clamp01((t - LG.w[i]) / (i === 2 ? 0.42 : 0.3))); };
      var q;

      if (t < LG.m0) {
        // ---- fase A: il foglietto vero, appeso, si scrive ----
        var c = Math.cos(pose.r) * LG.S1, s = Math.sin(pose.r) * LG.S1;
        T(c, s, -s, c, pose.x - c * 266 + s * 271, pose.y - s * 266 - c * 271);
        shadowOn(); ctx.fillStyle = PAPER; ctx.fill(G.SLIP); shadowOff();
        ctx.fillStyle = FOLDC; ctx.fill(G.SLIPFOLD);
        ctx.fillStyle = INK;
        HOLES.forEach(function (hx) { ctx.beginPath(); ctx.arc(hx, 120, 14, 0, Math.PI * 2); ctx.fill(); });
        ctx.lineCap = 'round'; ctx.lineWidth = 30;
        SLIP_LINES.forEach(function (ln, i) {
          var p = writeP(i); if (p <= 0) return;
          ctx.strokeStyle = ln[3]; ctx.beginPath(); ctx.moveTo(ln[0] + 15, ln[2]); ctx.lineTo(ln[0] + 15 + (ln[1] - ln[0] - 30) * p, ln[2]); ctx.stroke();
        });
        return;
      }

      var X = cXform(t);
      var uRaw = clamp01((t - LG.m0) / (LG.m1 - LG.m0));
      if (uRaw < 1) {
        // ---- fase B: la carta si piega e diventa la C ----
        var u = eIO3(uRaw), ds = 1 / N;
        var H0 = 306 * LG.S1, W0 = 232 * LG.S1, Lc = G.midLen * LG.S2, Wc = G.wAvg * LG.S2;
        var wk = 1 - Math.pow(1 - u, 2.2), L = lerp(H0, Lc, wk), w = lerp(W0, Wc, wk), Kc = Math.pow(u, 1.25) * 4.29;
        var rotB = pose.r * (1 - u) + 0.35 * Math.sin(Math.PI * u);
        var midE = [(G.outer[N / 2][0] + G.inner[N / 2][0]) / 2, (G.outer[N / 2][1] + G.inner[N / 2][1]) / 2];
        var midS = cPt(midE, X);
        var M = [lerp(pose.x, midS[0], u), lerp(pose.y, midS[1], u)];
        var Pt = new Array(N + 1);
        var hAt = function (sv) { return rotB + Math.PI / 2 - Kc * (sv - 0.5); };
        Pt[N / 2] = M;
        for (i = N / 2; i < N; i++) { var h1 = hAt((i + 0.5) * ds); Pt[i + 1] = [Pt[i][0] + L * ds * Math.cos(h1), Pt[i][1] + L * ds * Math.sin(h1)]; }
        for (i = N / 2; i > 0; i--) { var h2 = hAt((i - 0.5) * ds); Pt[i - 1] = [Pt[i][0] - L * ds * Math.cos(h2), Pt[i][1] - L * ds * Math.sin(h2)]; }
        var bl = smooth(0.45, 1, u);
        var O = [], In = [];
        for (i = 0; i <= N; i++) {
          var h = hAt(i * ds), nx0 = Math.cos(h + Math.PI / 2) * w / 2, ny0 = Math.sin(h + Math.PI / 2) * w / 2;
          var oe = cPt(G.outer[i], X), ie = cPt(G.inner[i], X);
          O.push([lerp(Pt[i][0] + nx0, oe[0], bl), lerp(Pt[i][1] + ny0, oe[1], bl)]);
          In.push([lerp(Pt[i][0] - nx0, ie[0], bl), lerp(Pt[i][1] - ny0, ie[1], bl)]);
        }
        var edge = function (A, sv) { var f2 = clamp01(sv) * N, j = Math.min(N - 1, Math.floor(f2)), k = f2 - j; return [lerp(A[j][0], A[j + 1][0], k), lerp(A[j][1], A[j + 1][1], k)]; };
        var pt = function (sv, v) { var a = edge(O, sv), b = edge(In, sv); return [lerp(a[0], b[0], v), lerp(a[1], b[1], v)]; };
        // orecchia del foglietto che si distende nei primi istanti
        var cut = 1 - smooth(0, 0.35, u), sCut = 1 - 0.288 * cut, vCut = 1 - 0.336 * cut;
        I1();
        ctx.beginPath(); ctx.moveTo(O[0][0], O[0][1]);
        for (i = 1; i <= N; i++) ctx.lineTo(O[i][0], O[i][1]);
        q = pt(1, vCut); ctx.lineTo(q[0], q[1]);
        q = pt(sCut, 1); ctx.lineTo(q[0], q[1]);
        for (i = Math.floor(sCut * N); i >= 0; i--) ctx.lineTo(In[i][0], In[i][1]);
        ctx.closePath();
        shadowOn(); ctx.fillStyle = PAPER; ctx.fill(); shadowOff();
        if (cut > 0.01) {
          ctx.globalAlpha = cut; ctx.fillStyle = FOLDC; ctx.beginPath();
          q = pt(sCut, 1); ctx.moveTo(q[0], q[1]); q = pt(1, vCut); ctx.lineTo(q[0], q[1]); q = pt(lerp(1, 0.948, cut), lerp(1, 0.983, cut)); ctx.lineTo(q[0], q[1]);
          ctx.fill(); ctx.globalAlpha = 1;
        }
        // il rovescio della carta che compare nella curva
        var fa = smooth(0.7, 1, u);
        if (fa > 0) { ctx.globalAlpha = fa; T(X[2], 0, 0, X[2], X[0] - X[2] * LG.CC[0], X[1] - X[2] * LG.CC[1]); ctx.fillStyle = FOLDC; ctx.fill(G.FOLD); I1(); ctx.globalAlpha = 1; }
        // fori e righe d'inchiostro che spariscono nella piega
        var la = 1 - smooth(0, 0.3, u);
        if (la > 0) {
          ctx.globalAlpha = la; ctx.fillStyle = INK;
          HOLES.forEach(function (hx) { q = pt(0.007, (hx - 150) / 232); ctx.beginPath(); ctx.arc(q[0], q[1], 14 * LG.S1 * (1 - u), 0, Math.PI * 2); ctx.fill(); });
          ctx.lineCap = 'round'; ctx.lineWidth = 30 * LG.S1 * (1 - 0.6 * u); ctx.strokeStyle = INK;
          for (i = 0; i < 2; i++) {
            var ln = SLIP_LINES[i], svl = (ln[2] - 118) / 306, pad = 15 / 232;
            var a1 = pt(svl, (ln[0] - 150) / 232 + pad), b1 = pt(svl, (ln[1] - 150) / 232 - pad);
            ctx.beginPath(); ctx.moveTo(a1[0], a1[1]); ctx.lineTo(b1[0], b1[1]); ctx.stroke();
          }
          ctx.globalAlpha = 1;
        }
        // la riga mattone si stacca e diventa la linguetta nella bocca della C
        var sv = (313 - 118) / 306, v0 = 26 / 232, v1 = 182 / 232;
        var A = pt(sv, v0), Bp = pt(sv, v1), A2 = pt(sv + 0.01, v0);
        var nx = A2[0] - A[0], ny = A2[1] - A[1], nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
        var hh = 15 * LG.S1;
        var from = [[A[0] - nx * hh, A[1] - ny * hh], [Bp[0] - nx * hh, Bp[1] - ny * hh], [Bp[0] + nx * hh, Bp[1] + ny * hh], [A[0] + nx * hh, A[1] + ny * hh]];
        var to = TAB.map(function (p) { return cPt(p, X); });
        var kk = eBack(clamp01((uRaw - 0.4) / 0.6), 1.4);
        drawTab(from.map(function (p, j) { return [lerp(p[0], to[j][0], kk), lerp(p[1], to[j][1], kk)]; }), lerp(hh * 0.98, 4 * LG.S2, clamp01(kk)));
        return;
      }

      // ---- fase C: la C è fatta; va nel lockup e tira fuori OMANDA ----
      var face = mixHex(PAPER, INK, f), back = mixHex(FOLDC, INK2, f);
      T(X[2], 0, 0, X[2], X[0] - X[2] * LG.CC[0], X[1] - X[2] * LG.CC[1]);
      shadowOn(); ctx.fillStyle = face; ctx.fill(G.C); shadowOff();
      ctx.fillStyle = back; ctx.fill(G.FOLD);
      // lettere: escono dalla bocca della C, una dopo l'altra
      var mouth = X[0] + X[2] * (145 - LG.CC[0]);
      I1();
      ctx.save(); ctx.beginPath(); ctx.rect(mouth, 0, 1080 - mouth, 1920); ctx.clip();
      ctx.fillStyle = face;
      var pw = clamp01((t - LG.l0) / LG.lDur);
      if (pw > 0) {
        var dx = (1 - eBack(eOut3(pw), 0.9)) * (70 - 573 - 6), s2 = 1.5 * LK;
        T(s2, 0, 0, s2, LX + (44 + 1.5 * dx) * LK, LY + 131 * LK);
        G.letters.forEach(function (lp) { ctx.fill(lp); });
      }
      ctx.restore();
      T(X[2], 0, 0, X[2], X[0] - X[2] * LG.CC[0], X[1] - X[2] * LG.CC[1]);
      // la linguetta batte un colpo quando la C si chiude
      var pk = t - LG.m1, ps = pk < 0.3 ? 1 + 0.18 * Math.sin(Math.PI * pk / 0.3) : 1;
      ctx.translate(133, 76); ctx.scale(ps, ps); ctx.translate(-133, -76);
      ctx.fillStyle = BRICK; ctx.fill(G.RED);
    }

    var a0 = null, b0 = null; // posa al centro e posa in testata, misurate all'inizio del volo
    function frame(t) {
      var f = 0;
      if (t < LG.fly0) { var m = centre(); K = m[0]; OX = m[1]; OY = m[2]; }
      else {
        if (!a0) { a0 = centre(); b0 = header(); veil.style.pointerEvents = 'none'; }
        f = eIO3(clamp01((t - LG.fly0) / (LG.fly1 - LG.fly0)));
        K = lerp(a0[0], b0[0], f); OX = lerp(a0[1], b0[1], f); OY = lerp(a0[2], b0[2], f);
        veil.style.backgroundColor = 'rgba(29,26,23,' + (1 - Math.pow(clamp01((t - LG.fly0 - 0.1) / (LG.fly1 - LG.fly0 - 0.1)), 2)) + ')';
      }
      drawLogo(t, f);
    }

    var t0 = null, raf = 0, done = false, landed = false, EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart'];
    function finish() {
      if (done) return;
      done = true; introOn = false;
      cancelAnimationFrame(raf);
      EVENTS.forEach(function (e) { window.removeEventListener(e, finish, true); });
      window.removeEventListener('resize', size);
      root.classList.remove('is-intro', 'intro-js');
      veil.remove();
      introEnd.forEach(function (fn) { fn(); });
    }
    function tick(now) {
      if (t0 === null) t0 = now;
      var t = (now - t0) / 1000;
      // la posa finale resta a schermo un fotogramma, poi il canvas cede il posto al logo vero
      if (landed) { finish(); return; }
      frame(Math.min(t, LG.fly1));
      if (t >= LG.fly1) landed = true;
      raf = requestAnimationFrame(tick);
    }
    EVENTS.forEach(function (e) { window.addEventListener(e, finish, { capture: true, passive: true }); });
    window.addEventListener('resize', size);
    size();
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

  // "Parla con noi": il pannello con chiamata, WhatsApp e mail.
  // Senza <dialog>.showModal resta il link #parla, che lo apre col CSS :target.
  var talk = document.getElementById('parla');
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

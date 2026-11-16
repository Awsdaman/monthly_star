/* Diamond grading certificate — DOM component + 1080x1920 share card.
   The 4Cs of a real grading report are mapped to the club's values:
   القطع ← الإبداع · النقاء ← العطاء · اللون ← الشغف · الوزن ← الأثر */
(function () {
  'use strict';
  var S = window.SOTM, m = S.member, G = S.G;

  var GRADES = [
    { c: 'القَطع', v: 'الإبداع', grade: 'ممتاز', scale: ['ضعيف', 'مقبول', 'جيد', 'جيد جدًا', 'ممتاز'], at: 4 },
    { c: 'النقاء', v: 'العطاء', grade: 'بلا شوائب · FL', scale: ['I', 'SI', 'VS', 'VVS', 'IF', 'FL'], at: 5 },
    { c: 'اللون', v: 'الشغف', grade: 'الأنقى · D', scale: ['K', 'J', 'I', 'H', 'G', 'F', 'E', 'D'], at: 7 },
    { c: 'الوزن', v: 'الأثر', grade: 'لا يُقاس', scale: null }
  ];

  /* guilloche: rosette lines for the border band, generated once */
  function guillochePath(w, h, inset, waves, amp, phase) {
    var pts = [], per = 2 * (w + h - 4 * inset), steps = 900;
    for (var i = 0; i <= steps; i++) {
      var d = (i / steps) * per, x, y, nx, ny, L1 = w - 2 * inset, L2 = h - 2 * inset;
      if (d < L1) { x = inset + d; y = inset; nx = 0; ny = 1; }
      else if (d < L1 + L2) { x = w - inset; y = inset + (d - L1); nx = -1; ny = 0; }
      else if (d < 2 * L1 + L2) { x = w - inset - (d - L1 - L2); y = h - inset; nx = 0; ny = -1; }
      else { x = inset; y = h - inset - (d - 2 * L1 - L2); nx = 1; ny = 0; }
      var o = amp * Math.sin((d / per) * Math.PI * 2 * waves + phase);
      pts.push((x + nx * o).toFixed(1) + ',' + (y + ny * o).toFixed(1));
    }
    return 'M' + pts.join('L');
  }
  function guillocheSVG(w, h) {
    var s = '';
    for (var k = 0; k < 7; k++) s += '<path d="' + guillochePath(w, h, 16, 64, 6, k * 0.9) + '"/>';
    return '<svg class="cert__band" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" aria-hidden="true"><g fill="none" stroke="#358b9a" stroke-width=".55" opacity=".7">' + s + '</g>' +
      '<rect x="30" y="30" width="' + (w - 60) + '" height="' + (h - 60) + '" fill="none" stroke="#2a636d" stroke-width="1.2"/></svg>';
  }

  /* plot diagram: crown/top view + profile, like a lab report */
  function plotSVG() {
    var top = '', cx = 60, cy = 60, R = 50, r = 27;
    var oct = [], inner = [];
    for (var i = 0; i < 8; i++) { var a = i / 8 * Math.PI * 2 + Math.PI / 8; oct.push([cx + R * Math.cos(a), cy + R * Math.sin(a)]); var b = a; inner.push([cx + r * Math.cos(b), cy + r * Math.sin(b)]); }
    top += '<polygon points="' + oct.map(function (p) { return p.join(','); }).join(' ') + '"/>';
    top += '<polygon points="' + inner.map(function (p) { return p.join(','); }).join(' ') + '"/>';
    for (i = 0; i < 8; i++) {
      var mid = [(oct[i][0] + oct[(i + 1) % 8][0]) / 2, (oct[i][1] + oct[(i + 1) % 8][1]) / 2];
      top += '<path d="M' + inner[i].join(',') + 'L' + mid.join(',') + 'L' + inner[(i + 1) % 8].join(',') + '"/>';
      top += '<path d="M' + inner[i].join(',') + 'L' + oct[i].join(',') + '"/>';
    }
    var side = '<path d="M140 40 L160 22 L220 22 L240 40 L190 100 Z M140 40 L240 40 M160 22 L170 40 L190 22 L210 40 L220 22 M170 40 L190 100 L210 40"/>';
    return '<svg class="cert__plot" viewBox="0 0 250 120" aria-hidden="true"><g fill="none" stroke="#2a636d" stroke-width="1.3" stroke-linejoin="round">' + top + side + '</g>' +
      '<g fill="#9f895c"><circle cx="48" cy="44" r="2"/><circle cx="74" cy="70" r="1.6"/></g></svg>';
  }

  function sealSVG() {
    var txt = 'نجوم الشهر · ' + S.CONFIG.club + ' · ' + S.CONFIG.month + ' ' + S.CONFIG.year + ' · ';
    return '<svg class="cert__seal" viewBox="0 0 140 140" aria-hidden="true"><defs>' +
      '<radialGradient id="foil" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#ead9b6"/><stop offset=".45" stop-color="#c9b28a"/><stop offset=".8" stop-color="#9f895c"/><stop offset="1" stop-color="#7b6845"/></radialGradient>' +
      '<path id="sealArc" d="M70 70 m-50 0 a50 50 0 1 1 100 0 a50 50 0 1 1 -100 0"/></defs>' +
      '<g>' + (function () { var s = ''; for (var i = 0; i < 36; i++) { var a = i / 36 * Math.PI * 2, a2 = (i + .5) / 36 * Math.PI * 2; s += (i ? 'L' : 'M') + (70 + 68 * Math.cos(a)).toFixed(1) + ',' + (70 + 68 * Math.sin(a)).toFixed(1) + 'L' + (70 + 62 * Math.cos(a2)).toFixed(1) + ',' + (70 + 62 * Math.sin(a2)).toFixed(1); } return '<path d="' + s + 'Z" fill="url(#foil)"/>'; })() + '</g>' +
      '<circle cx="70" cy="70" r="57" fill="none" stroke="#7b6845" stroke-width="1"/><circle cx="70" cy="70" r="38" fill="none" stroke="#7b6845" stroke-width="1"/>' +
      '<text font-family="Alexandria, sans-serif" font-size="9.4" font-weight="600" fill="#5e4f33"><textPath href="#sealArc" startOffset="0">' + txt + txt.slice(0, 18) + '</textPath></text>' +
      '<g transform="translate(46 50) scale(.24)" stroke="#5e4f33" stroke-width="7" fill="#d8c49d" stroke-linejoin="round"><polygon points="58,12 20,58 65,60"/><polygon points="58,12 100,12 65,60"/><polygon points="100,12 65,60 135,60"/><polygon points="100,12 142,12 135,60"/><polygon points="142,12 180,58 135,60"/><polygon points="20,58 65,60 100,148"/><polygon points="65,60 135,60 100,148"/><polygon points="135,60 180,58 100,148"/></g>' +
      '</svg>';
  }

  var CSS = '' +
  '.cert{--paper:#f4f9f9;--paper-2:#e5f0f1;position:relative;width:100%;max-width:440px;margin-inline:auto;color:#0c272c;background:radial-gradient(120% 80% at 50% 0%,var(--paper) 40%,var(--paper-2));border-radius:4px;padding:44px 34px 34px;box-shadow:0 30px 70px rgba(0,0,0,.45),0 2px 0 rgba(255,255,255,.6) inset;overflow:hidden;font-family:var(--font-ar)}' +
  '.cert::after{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(115deg,rgba(53,139,154,.035) 0 2px,transparent 2px 7px)}' +
  '.cert__band{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}' +
  '.cert__head{position:relative;display:flex;justify-content:space-between;align-items:flex-start;gap:12px;border-bottom:1px solid rgba(42,99,109,.35);padding-bottom:12px}' +
  '.cert__title{margin:0;font-weight:800;font-size:1.25rem;line-height:1.3;color:#0c272c}' +
  '.cert__org{margin:2px 0 0;font-size:.78rem;color:#2a636d}' +
  '.cert__no{direction:ltr;text-align:left;font-family:var(--font-mono);font-size:.7rem;line-height:1.5;color:#2a636d;white-space:nowrap}' +
  '.cert__no b{display:block;font-weight:600;font-size:.82rem;color:#0c272c}' +
  '.cert__gem{position:relative;display:block;width:150px;height:150px;margin:6px auto -14px;object-fit:contain;border-radius:50%;background:radial-gradient(closest-side,#1d5a64,#0f3238 70%,transparent 72%)}' +
  '.cert__owner{position:relative;text-align:center;padding:18px 0 6px}' +
  '.cert__owner small{display:block;font-size:.78rem;color:#2a636d}' +
  '.cert__name{margin:2px 0 0;font-family:var(--font-cal);font-weight:700;font-size:clamp(2rem,9vw,2.7rem);line-height:1.35;color:#0c272c;text-wrap:balance}' +
  '.cert__role{margin:2px 0 0;font-size:.9rem;color:#0c272c}.cert__role b{color:#7b6845;font-weight:700}' +
  '.cert__grid{position:relative;display:grid;gap:0;margin-top:12px;border-top:1px solid rgba(42,99,109,.35)}' +
  '.cert__row{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:4px 12px;padding:9px 0;border-bottom:1px dashed rgba(42,99,109,.3);transition:opacity .5s,filter .5s}' +
  '.cert__row.pending{opacity:.22;filter:blur(1.5px)}' +
  '.cert__k{font-weight:700;font-size:.92rem}.cert__k em{display:block;font-style:normal;font-weight:400;font-size:.72rem;color:#2a636d}' +
  '.cert__g{justify-self:end;font-weight:700;font-size:.9rem;color:#0c272c;white-space:nowrap}' +
  '.cert__scale{grid-column:1/-1;display:flex;direction:ltr;gap:3px}' +
  '.cert__scale i{flex:1;height:5px;background:rgba(42,99,109,.16);border-radius:1px;transition:background-color .3s}' +
  '.cert__scale i.on{background:#358b9a}.cert__scale i.at{background:#9f895c}' +
  '.cert__foot{position:relative;display:grid;grid-template-columns:1fr auto;align-items:end;gap:10px;margin-top:14px}' +
  '.cert__plot{width:100%;max-width:190px;height:auto}' +
  '.cert__meta{font-size:.74rem;color:#2a636d;line-height:1.6}.cert__meta b{color:#0c272c;font-weight:600}' +
  '.cert__seal{width:96px;height:96px;filter:drop-shadow(0 6px 8px rgba(94,79,51,.35));opacity:0;transform:scale(2.4) rotate(-30deg)}' +
  '.cert.stamped .cert__seal{animation:stamp .55s cubic-bezier(.2,1.6,.4,1) forwards}' +
  '@keyframes stamp{to{opacity:1;transform:scale(1) rotate(-8deg)}}' +
  '.cert__slogan{position:relative;margin:14px 0 0;text-align:center;font-size:.78rem;font-weight:600;color:#7b6845}' +
  '.cert__logo{position:relative;display:flex;justify-content:center;gap:8px;margin-top:8px;font-size:.66rem;color:rgba(42,99,109,.6)}' +
  '@media (max-width:380px){.cert{padding:40px 24px 28px}.cert__seal{width:80px;height:80px}}';

  function injectCSS() {
    if (document.getElementById('cert-css')) return;
    var st = document.createElement('style'); st.id = 'cert-css'; st.textContent = CSS; document.head.appendChild(st);
  }

  function scaleHTML(g) {
    if (!g.scale) return '<div class="cert__scale" data-inf><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>';
    return '<div class="cert__scale">' + g.scale.map(function () { return '<i></i>'; }).join('') + '</div>';
  }

  function mount(container, opts) {
    opts = opts || {};
    injectCSS();
    var el = document.createElement('article');
    el.className = 'cert';
    el.setAttribute('aria-label', 'تقرير تقييم الماسة');
    el.innerHTML = guillocheSVG(440, 760) +
      '<header class="cert__head"><div><h2 class="cert__title">تقرير تقييم الماسة</h2><p class="cert__org">' + S.CONFIG.club + ' · مختبر نجوم الشهر</p></div>' +
      '<div class="cert__no">REPORT NO.<b>' + m.serial + '</b>' + S.CONFIG.month + ' ' + S.CONFIG.year + '</div></header>' +
      (opts.gemSrc ? '<img class="cert__gem" alt="" src="' + opts.gemSrc + '">' : '') +
      '<div class="cert__owner"><small>' + G('صاحبة الماسة', 'صاحب الماسة') + '</small><h3 class="cert__name">' + m.name + '</h3>' +
      '<p class="cert__role"><b>' + m.title + '</b> · ' + m.committee + '</p></div>' +
      '<div class="cert__grid">' + GRADES.map(function (g, i) {
        return '<div class="cert__row pending" data-row="' + i + '"><div class="cert__k">' + g.c + '<em>' + g.v + '</em></div><span></span><div class="cert__g">' + g.grade + '</div>' + scaleHTML(g) + '</div>';
      }).join('') + '</div>' +
      '<div class="cert__foot"><div>' + plotSVG() + '<div class="cert__meta">الشكل: <b>قطع بريليانت</b><br>المختبر: <b>' + S.CONFIG.club + '</b></div></div>' + sealSVG() + '</div>' +
      '<p class="cert__slogan">' + S.CONFIG.slogan + '</p>';
    container.appendChild(el);

    function fillRow(i, instant) {
      var row = el.querySelector('[data-row="' + i + '"]');
      if (!row) return;
      row.classList.remove('pending');
      var bars = Array.prototype.slice.call(row.querySelectorAll('.cert__scale i'));
      var g = GRADES[i], at = g.scale ? g.at : bars.length - 1;
      bars.forEach(function (b, k) {
        var on = function () { b.classList.add(k === at ? 'at' : 'on'); if (!instant && k % 2 === 0) S.sound.play('tick'); };
        if (instant) on(); else setTimeout(on, 70 * k + 150);
      });
    }
    function fillAll() { for (var i = 0; i < GRADES.length; i++) fillRow(i, true); }
    function stamp() { el.classList.add('stamped'); }
    return { el: el, fillRow: fillRow, fillAll: fillAll, stamp: stamp, count: GRADES.length };
  }

  /* ---------- share card, drawn directly (no DOM screenshot) ---------- */
  function svgToImage(svg) {
    return new Promise(function (res) {
      var img = new Image();
      img.onload = function () { res(img); }; img.onerror = function () { res(null); };
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" '));
    });
  }

  function drawCard(gemCanvas) {
    return S.fontsReady(['700 80px "Aref Ruqaa"', '800 60px Alexandria', '400 30px Alexandria', '600 30px "JetBrains Mono"']).then(function () {
      return Promise.all([svgToImage(guillocheSVG(900, 1500)), svgToImage(plotSVG()), svgToImage(sealSVG().replace('class="cert__seal"', 'width="280" height="280"'))]);
    }).then(function (imgs) {
      var W = 1080, H = 1920, c = document.createElement('canvas'); c.width = W; c.height = H;
      var x = c.getContext('2d');
      var bg = x.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#14424a'); bg.addColorStop(1, '#0c272c');
      x.fillStyle = bg; x.fillRect(0, 0, W, H);
      // paper
      var px = 90, py = 140, pw = 900, ph = 1610;
      x.save(); x.shadowColor = 'rgba(0,0,0,.45)'; x.shadowBlur = 60; x.shadowOffsetY = 26;
      var pg = x.createRadialGradient(W / 2, py, 100, W / 2, py + 400, 1400); pg.addColorStop(0, '#f6fbfb'); pg.addColorStop(1, '#e2eff0');
      x.fillStyle = pg; x.fillRect(px, py, pw, ph); x.restore();
      if (imgs[0]) x.drawImage(imgs[0], px, py, pw, ph);
      x.direction = 'rtl'; x.textAlign = 'right';
      var R = px + pw - 80, L = px + 80;
      x.fillStyle = '#0c272c'; x.font = '800 54px Alexandria'; x.fillText('تقرير تقييم الماسة', R, py + 150);
      x.fillStyle = '#2a636d'; x.font = '400 30px Alexandria'; x.fillText(S.CONFIG.club + ' · مختبر نجوم الشهر', R, py + 200);
      x.direction = 'ltr'; x.textAlign = 'left';
      x.font = '400 24px "JetBrains Mono", monospace'; x.fillText('REPORT NO.', L, py + 120);
      x.fillStyle = '#0c272c'; x.font = '600 34px "JetBrains Mono", monospace'; x.fillText(m.serial, L, py + 162);
      x.fillStyle = '#2a636d'; x.direction = 'rtl'; x.textAlign = 'left'; x.font = '400 26px Alexandria'; x.fillText(S.CONFIG.month + ' ' + S.CONFIG.year, L, py + 200);
      x.strokeStyle = 'rgba(42,99,109,.4)'; x.lineWidth = 2; x.beginPath(); x.moveTo(L, py + 240); x.lineTo(R, py + 240); x.stroke();
      // gem image or plot
      var gy = py + 270;
      if (gemCanvas) {
        var disc = x.createRadialGradient(W / 2, gy + 170, 20, W / 2, gy + 170, 170);
        disc.addColorStop(0, '#1d5a64'); disc.addColorStop(1, '#0c272c');
        x.fillStyle = disc; x.beginPath(); x.arc(W / 2, gy + 170, 168, 0, Math.PI * 2); x.fill();
        x.strokeStyle = '#c9b28a'; x.lineWidth = 6; x.stroke();
        x.drawImage(gemCanvas, W / 2 - 170, gy, 340, 340);
      }
      else if (imgs[1]) x.drawImage(imgs[1], W / 2 - 250, gy + 60, 500, 240);
      x.textAlign = 'center'; x.direction = 'rtl';
      x.fillStyle = '#2a636d'; x.font = '400 30px Alexandria'; x.fillText(G('صاحبة الماسة', 'صاحب الماسة'), W / 2, py + 670);
      x.fillStyle = '#0c272c';
      var fs = S.fitText(x, m.name, pw - 160, 104, '700', '"Aref Ruqaa"');
      x.font = '700 ' + fs + 'px "Aref Ruqaa"'; x.fillText(m.name, W / 2, py + 790);
      x.font = '700 36px Alexandria'; x.fillStyle = '#7b6845'; x.fillText(m.title, W / 2, py + 860);
      x.font = '400 30px Alexandria'; x.fillStyle = '#0c272c';
      S.wrapLines(x, m.committee, pw - 200).forEach(function (l, i) { x.fillText(l, W / 2, py + 910 + i * 42); });
      // grades
      var gy0 = py + 1000;
      GRADES.forEach(function (g, i) {
        var y = gy0 + i * 84;
        x.strokeStyle = 'rgba(42,99,109,.3)'; x.setLineDash([6, 6]); x.beginPath(); x.moveTo(L, y + 62); x.lineTo(R, y + 62); x.stroke(); x.setLineDash([]);
        x.textAlign = 'right'; x.fillStyle = '#0c272c'; x.font = '700 34px Alexandria'; x.fillText(g.c, R, y + 20);
        x.fillStyle = '#2a636d'; x.font = '400 24px Alexandria'; x.fillText(g.v, R, y + 52);
        x.textAlign = 'left'; x.fillStyle = '#0c272c'; x.font = '700 32px Alexandria'; x.fillText(g.grade, L, y + 20);
        // scale under the grade
        var n = g.scale ? g.scale.length : 8, at = g.scale ? g.at : n - 1, sw = 320, bw = sw / n;
        for (var k = 0; k < n; k++) { x.fillStyle = k === at ? '#9f895c' : '#358b9a'; x.fillRect(L + k * bw, y + 38, bw - 5, 8); }
      });
      if (imgs[2]) { x.save(); x.translate(L + 110, py + ph - 150); x.rotate(-0.14); x.drawImage(imgs[2], -110, -110, 220, 220); x.restore(); }
      x.textAlign = 'right'; x.fillStyle = '#7b6845'; x.font = '600 30px Alexandria'; x.fillText(S.CONFIG.slogan, R, py + ph - 150);
      x.fillStyle = '#2a636d'; x.font = '400 26px Alexandria'; x.fillText('الشكل: قطع بريليانت', R, py + ph - 100);
      x.textAlign = 'center'; x.fillStyle = '#a9c9cd'; x.font = '400 30px Alexandria'; x.fillText('نجوم الشهر · ' + S.CONFIG.club, W / 2, H - 120);
      return c;
    });
  }

  window.Cert = { mount: mount, drawCard: drawCard, GRADES: GRADES };
})();

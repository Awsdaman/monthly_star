/* نجوم الشهر — shared core
   Member data, gender-aware copy, sound, card export and share.
   Used by every concept page. No dependencies. */
(function () {
  'use strict';

  /* ---------- Month & members (edit here each month) ---------- */
  var CONFIG = { month: 'أكتوبر', year: '٢٠٢٦', slogan: 'العصر الماسي — يُصنع فيه الأثر', club: 'نادي الحاسبات' };

  // Prototype data: one placeholder member per department.
  // Each row: [full name, 'f' or 'm' (Arabic wording), department]
  var MEMBERS = [
    ['أوس سمير دمنهوري', 'm', 'لجنة جودة الحياة'],
    ['أوس سمير دمنهوري', 'm', 'اللجنة الإعلامية'],
    ['أوس سمير دمنهوري', 'm', 'اللجنة العلمية'],
    ['أوس سمير دمنهوري', 'm', 'لجنة المسابقات والأنشطة الرياضية'],
    ['أوس سمير دمنهوري', 'm', 'لجنة الموارد البشرية'],
    ['أوس سمير دمنهوري', 'm', 'لجنة الرعايات والشراكات']
  ].map(function (r, i) { return { name: r[0], g: r[1], committee: r[2], index: i }; });

  function norm(s) {
    return String(s || '').replace(/[-_+]+/g, ' ').replace(/\s+/g, ' ').trim()
      .replace(/[إأآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي');
  }
  function slug(name) { return String(name).trim().replace(/\s+/g, '-'); }

  function readRequested() {
    var q = null;
    try { q = new URLSearchParams(location.search); } catch (e) {}
    var n = q && (q.get('n') || q.get('name'));
    if (!n && location.hash.length > 1) {
      try { n = decodeURIComponent(location.hash.slice(1)); } catch (e) {}
    }
    return { n: n || '', g: q && q.get('g'), c: q && q.get('c') };
  }

  // The same name can appear in several departments, so ?c= (department) picks the row.
  var req = readRequested();
  var hit = null, byName = MEMBERS.filter(function (x) { return norm(x.name) === norm(req.n); });
  if (byName.length) {
    hit = byName[0];
    if (req.c) byName.forEach(function (x) { if (norm(x.committee) === norm(req.c)) hit = x; });
  }
  var M = hit || (req.n
    ? { name: req.n.replace(/[-_+]+/g, ' ').trim(), g: req.g === 'm' ? 'm' : 'f', committee: req.c ? req.c.replace(/[-_+]+/g, ' ').trim() : CONFIG.club, index: 99 }
    : MEMBERS[0]);

  function G(f, m) { return M.g === 'f' ? f : m; }
  var parts = M.name.split(' ');

  var member = {
    name: M.name,
    first: parts[0],
    rest: parts.slice(1).join(' '),
    g: M.g,
    committee: M.committee,
    index: M.index,
    title: G('نجمة الشهر', 'نجم الشهر'),
    slug: slug(M.name),
    // report-style number e.g. CC-2610-10
    serial: 'CC-' + '2610' + '-' + String((M.index % 100) + 1).padStart(2, '0')
  };

  /* ---------- Sound: synthesized with WebAudio, no files ---------- */
  var AC = null, master = null, musicGain = null, musicNodes = null;
  var muted = false;
  try { muted = localStorage.getItem('sotm-muted') === '1'; } catch (e) {}

  function ctx() {
    if (AC) return AC;
    var C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    AC = new C();
    master = AC.createGain();
    master.gain.value = muted ? 0 : 0.9;
    master.connect(AC.destination);
    return AC;
  }
  function unlock() { var c = ctx(); if (c && c.state === 'suspended') c.resume(); }

  function tone(freq, t0, dur, type, vol, dest) {
    var c = AC, o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.2, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(dest || master);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function noise(t0, dur, freq, q, vol) {
    var c = AC, len = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    var s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = buf; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    g.gain.value = vol;
    s.connect(f); f.connect(g); g.connect(master);
    s.start(t0);
  }

  var SFX = {
    // crystal ping: inharmonic partials
    ping: function (t, pitch) {
      var p = pitch || 1;
      [1, 2.76, 5.4, 8.93].forEach(function (r, i) { tone(1046 * p * r, t, 1.6 / (i + 1), 'sine', 0.12 / (i + 1)); });
    },
    chisel: function (t) {
      noise(t, 0.12, 3200, 1.2, 0.9);
      tone(180, t, 0.12, 'triangle', 0.25);
    },
    tick: function (t) { noise(t, 0.03, 5200, 4, 0.35); },
    key: function (t) { noise(t, 0.025, 2400 + Math.random() * 900, 6, 0.28); },
    whoosh: function (t) {
      var c = AC, len = Math.floor(c.sampleRate * 0.9), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / len);
      var s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
      s.buffer = buf; f.type = 'bandpass'; f.Q.value = 0.8;
      f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(2800, t + 0.8);
      g.gain.value = 0.35; s.connect(f); f.connect(g); g.connect(master); s.start(t);
    },
    stamp: function (t) {
      tone(90, t, 0.35, 'sine', 0.6);
      noise(t, 0.08, 900, 0.7, 0.8);
    },
    open: function (t) {
      tone(220, t, 0.5, 'triangle', 0.12);
      tone(330, t + 0.08, 0.6, 'triangle', 0.1);
    },
    reveal: function (t) {
      // rising arpeggio in a bright mode
      [523.25, 659.25, 783.99, 987.77, 1174.66, 1567.98].forEach(function (f, i) {
        tone(f, t + i * 0.09, 1.8 - i * 0.15, 'sine', 0.16);
        tone(f * 2.01, t + i * 0.09, 0.6, 'sine', 0.04);
      });
      noise(t + 0.5, 1.2, 7000, 0.6, 0.12);
    },
    blip: function (t) { tone(880, t, 0.09, 'square', 0.05); tone(1320, t + 0.06, 0.09, 'square', 0.04); },
    lock: function (t) {
      noise(t, 0.04, 2600, 3, 0.6);
      tone(1568, t + 0.02, 0.35, 'sine', 0.12); tone(2093, t + 0.07, 0.5, 'sine', 0.08);
    },
    thud: function (t) { tone(70, t, 0.6, 'sine', 0.7); noise(t, 0.2, 300, 0.6, 0.6); },
    // a plucked string, pitch as a multiplier (used for the kashida "rubber band")
    pluck: function (t, p) {
      var f = 196 * (p || 1);
      tone(f, t, 0.9, 'triangle', 0.22); tone(f * 2, t, 0.4, 'sine', 0.08); tone(f * 3.01, t, 0.25, 'sine', 0.04);
      noise(t, 0.02, f * 4, 2, 0.25);
    },
    tear: function (t) { noise(t, 0.35, 4200, 0.7, 0.55); noise(t + 0.05, 0.25, 1800, 0.9, 0.3); },
    flip: function (t) { noise(t, 0.08, 2600, 1.2, 0.45); tone(660, t + 0.02, 0.12, 'sine', 0.05); }
  };

  // A continuous voice whose pitch/volume a page can steer (pressure rumble, light hum).
  function drone(kind) {
    var c = ctx(); if (!c) return { set: function () {}, stop: function () {} };
    if (c.state === 'suspended') c.resume();
    var g = c.createGain(); g.gain.value = 0.0001; g.connect(master);
    var nodes = [];
    var f = c.createBiquadFilter();
    if (kind === 'rumble') {
      var len = c.sampleRate * 2, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0), last = 0;
      for (var i = 0; i < len; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
      var src = c.createBufferSource(); src.buffer = buf; src.loop = true;
      f.type = 'lowpass'; f.frequency.value = 160; src.connect(f); f.connect(g); src.start(); nodes.push(src);
      var o = c.createOscillator(); o.type = 'sine'; o.frequency.value = 42; var og = c.createGain(); og.gain.value = 0.5; o.connect(og); og.connect(g); o.start(); nodes.push(o);
    } else {
      f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 2; f.connect(g);
      [1, 1.5, 2.01].forEach(function (r, k) { var o2 = c.createOscillator(); o2.type = k ? 'sine' : 'triangle'; o2.frequency.value = 220 * r; o2.connect(f); o2.start(); nodes.push(o2); });
    }
    return {
      set: function (amount, pitch) {
        if (!AC) return;
        var now = AC.currentTime;
        g.gain.setTargetAtTime(muted ? 0.0001 : Math.max(0.0001, amount), now, 0.08);
        if (pitch) {
          if (kind === 'rumble') f.frequency.setTargetAtTime(120 + pitch * 380, now, 0.1);
          else { nodes.forEach(function (n, k) { n.frequency.setTargetAtTime(pitch * [1, 1.5, 2.01][k], now, 0.06); }); f.frequency.setTargetAtTime(pitch * 3, now, 0.1); }
        }
      },
      stop: function () { if (!AC) return; g.gain.setTargetAtTime(0.0001, AC.currentTime, 0.1); setTimeout(function () { nodes.forEach(function (n) { try { n.stop(); } catch (e) {} }); g.disconnect(); }, 600); }
    };
  }
  function buzz(pattern) {
    try {
      var ua = navigator.userActivation;
      if (navigator.vibrate && (!ua || ua.hasBeenActive)) navigator.vibrate(pattern);
    } catch (e) {}
  }

  function play(name, arg) {
    var c = ctx(); if (!c || muted) return;
    if (c.state === 'suspended') c.resume();
    try { SFX[name](c.currentTime + 0.01, arg); } catch (e) {}
  }

  // Ambient pad: slow detuned chord through a lowpass, plus random glints
  function startMusic() {
    var c = ctx(); if (!c || musicNodes) return;
    musicGain = c.createGain(); musicGain.gain.value = 0.0001;
    var lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
    musicGain.connect(master); lp.connect(musicGain);
    var oscs = [];
    [146.83, 220, 277.18, 329.63].forEach(function (f, i) {
      [-4, 4].forEach(function (det) {
        var o = c.createOscillator(); o.type = i === 0 ? 'sine' : 'triangle';
        o.frequency.value = f; o.detune.value = det;
        var g = c.createGain(); g.gain.value = i === 0 ? 0.09 : 0.035;
        o.connect(g); g.connect(lp); o.start(); oscs.push(o);
      });
    });
    var lfo = c.createOscillator(), lg = c.createGain();
    lfo.frequency.value = 0.07; lg.gain.value = 380; lfo.connect(lg); lg.connect(lp.frequency); lfo.start(); oscs.push(lfo);
    musicGain.gain.exponentialRampToValueAtTime(0.5, c.currentTime + 3);
    var notes = [1174.66, 1318.51, 1479.98, 1760, 1975.53, 2349.32];
    var timer = setInterval(function () {
      if (muted || !AC) return;
      var t = AC.currentTime + 0.05;
      tone(notes[Math.floor(Math.random() * notes.length)], t, 2.4, 'sine', 0.025, musicGain);
    }, 2300);
    musicNodes = { oscs: oscs, timer: timer };
  }

  function setMuted(v) {
    muted = !!v;
    try { localStorage.setItem('sotm-muted', muted ? '1' : '0'); } catch (e) {}
    if (master && AC) master.gain.setTargetAtTime(muted ? 0 : 0.9, AC.currentTime, 0.08);
    document.querySelectorAll('[data-sound-toggle]').forEach(function (b) {
      b.setAttribute('aria-pressed', muted ? 'false' : 'true');
      b.setAttribute('aria-label', muted ? 'تشغيل الصوت' : 'كتم الصوت');
    });
  }

  var ICON_SOUND_ON = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z"/><path class="w1" d="M15.5 9a4.2 4.2 0 0 1 0 6"/><path class="w2" d="M18.2 6.5a8 8 0 0 1 0 11"/><path class="x" d="M16 9.5l5 5M21 9.5l-5 5"/></svg>';

  function mountSoundButton(parent) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'sound-btn';
    b.setAttribute('data-sound-toggle', '');
    b.innerHTML = ICON_SOUND_ON;
    b.addEventListener('click', function () { unlock(); startMusic(); setMuted(!muted); });
    (parent || document.body).appendChild(b);
    setMuted(muted);
    return b;
  }

  /* ---------- Shard burst overlay (2D canvas) ---------- */
  var burstCanvas = null, bctx = null, shards = [], burstRAF = 0;
  var BRAND = { abyss: '#0c272c', deep: '#2a636d', teal: '#358b9a', taupe: '#9f895c', white: '#ffffff', mist: '#cfe5e8', sand: '#e9dcc3' };

  function ensureBurst() {
    if (burstCanvas) return;
    burstCanvas = document.createElement('canvas');
    burstCanvas.className = 'burst-layer';
    burstCanvas.setAttribute('aria-hidden', 'true');
    burstCanvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:60';
    document.body.appendChild(burstCanvas);
    bctx = burstCanvas.getContext('2d');
    var resize = function () {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      burstCanvas.width = innerWidth * dpr; burstCanvas.height = innerHeight * dpr;
      bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize(); addEventListener('resize', resize);
  }
  function burst(x, y, n, opts) {
    if (reducedMotion()) return;
    ensureBurst();
    opts = opts || {};
    var cols = opts.colors || [BRAND.white, BRAND.mist, BRAND.teal, BRAND.taupe, BRAND.sand];
    for (var i = 0; i < (n || 40); i++) {
      var a = Math.random() * Math.PI * 2, sp = (opts.speed || 7) * (0.35 + Math.random());
      shards.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (opts.lift || 2), r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.4,
        s: 3 + Math.random() * (opts.size || 7), c: cols[i % cols.length], life: 1, decay: 0.008 + Math.random() * 0.014 });
    }
    if (!burstRAF) burstRAF = requestAnimationFrame(stepBurst);
  }
  function stepBurst() {
    bctx.clearRect(0, 0, innerWidth, innerHeight);
    for (var i = shards.length - 1; i >= 0; i--) {
      var p = shards[i];
      p.vy += 0.16; p.vx *= 0.985; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life -= p.decay;
      if (p.life <= 0 || p.y > innerHeight + 40) { shards.splice(i, 1); continue; }
      bctx.save(); bctx.translate(p.x, p.y); bctx.rotate(p.r); bctx.globalAlpha = Math.min(1, p.life * 1.4);
      bctx.fillStyle = p.c;
      bctx.beginPath(); bctx.moveTo(0, -p.s); bctx.lineTo(p.s * 0.6, 0); bctx.lineTo(0, p.s * 0.9); bctx.lineTo(-p.s * 0.6, 0); bctx.closePath(); bctx.fill();
      bctx.restore();
    }
    burstRAF = shards.length ? requestAnimationFrame(stepBurst) : 0;
    if (!shards.length) bctx.clearRect(0, 0, innerWidth, innerHeight);
  }

  function reducedMotion() {
    return window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /* ---------- Brand diamond (2D) for cards & fallbacks ----------
     Drawn on a 200x160 grid: crown of 5 triangles over a pavilion of 3. */
  var DIA = {
    crown: [[[58, 12], [20, 58], [65, 60]], [[58, 12], [100, 12], [65, 60]], [[100, 12], [65, 60], [135, 60]], [[100, 12], [142, 12], [135, 60]], [[142, 12], [180, 58], [135, 60]]],
    pav: [[[20, 58], [65, 60], [100, 148]], [[65, 60], [135, 60], [100, 148]], [[135, 60], [180, 58], [100, 148]]]
  };
  function drawDiamond(c, cx, cy, w, opt) {
    opt = opt || {};
    var s = w / 200, ox = cx - 100 * s, oy = cy - 80 * s;
    var fills = opt.fills || ['#b9d6d9', '#e4f1f2', '#cbe1e3', '#dcecee', '#a6c7cb', '#afcdd1', '#eef7f8', '#c6dcdf'];
    var all = DIA.crown.concat(DIA.pav);
    c.save();
    c.lineJoin = 'round';
    all.forEach(function (tri, i) {
      c.beginPath();
      tri.forEach(function (p, j) { var X = ox + p[0] * s, Y = oy + p[1] * s; j ? c.lineTo(X, Y) : c.moveTo(X, Y); });
      c.closePath();
      c.fillStyle = fills[i % fills.length]; c.fill();
    });
    if (opt.stroke !== false) {
      c.strokeStyle = opt.stroke || BRAND.abyss; c.lineWidth = (opt.lineWidth || 6) * s;
      all.forEach(function (tri) {
        c.beginPath();
        tri.forEach(function (p, j) { var X = ox + p[0] * s, Y = oy + p[1] * s; j ? c.lineTo(X, Y) : c.moveTo(X, Y); });
        c.closePath(); c.stroke();
      });
    }
    // highlight glint
    c.globalAlpha = 0.85; c.fillStyle = '#fff';
    c.beginPath(); c.moveTo(ox + 68 * s, oy + 22 * s); c.lineTo(ox + 92 * s, oy + 17 * s); c.lineTo(ox + 70 * s, oy + 50 * s); c.closePath(); c.fill();
    c.restore();
  }
  function diamondSVG(cls, fills, stroke) {
    fills = fills || ['#b9d6d9', '#e4f1f2', '#cbe1e3', '#dcecee', '#a6c7cb', '#afcdd1', '#eef7f8', '#c6dcdf'];
    var all = DIA.crown.concat(DIA.pav), out = '';
    all.forEach(function (t, i) { out += '<polygon points="' + t.map(function (p) { return p.join(','); }).join(' ') + '" fill="' + fills[i] + '"/>'; });
    return '<svg class="' + (cls || '') + '" viewBox="0 0 200 160" aria-hidden="true"><g stroke="' + (stroke || BRAND.abyss) + '" stroke-width="6" stroke-linejoin="round">' + out +
      '</g><polygon points="68,22 92,17 70,50" fill="#fff" opacity=".85"/></svg>';
  }

  /* ---------- Canvas text helpers (Arabic, RTL) ---------- */
  function fitText(c, text, maxW, size, weight, family) {
    var s = size;
    do { c.font = weight + ' ' + s + 'px ' + family; if (c.measureText(text).width <= maxW) break; s -= 2; } while (s > 18);
    return s;
  }
  function wrapLines(c, text, maxW) {
    var words = text.split(' '), lines = [], line = '';
    words.forEach(function (w) {
      var t = line ? line + ' ' + w : w;
      if (c.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
    });
    if (line) lines.push(line);
    return lines;
  }
  function fontsReady(list) {
    var p = (list || []).map(function (f) { return document.fonts && document.fonts.load ? document.fonts.load(f, 'ابجد') : Promise.resolve(); });
    return Promise.all(p).then(function () { return document.fonts ? document.fonts.ready : null; }).catch(function () {});
  }

  /* ---------- Save & share ---------- */
  function toBlob(canvas) {
    return new Promise(function (res) { canvas.toBlob(function (b) { res(b); }, 'image/png'); });
  }
  // "framed" means a foreign/sandboxed host; our own tab shell (same origin) does not count
  function inFrame() {
    try { if (window.self === window.top) return false; void window.top.location.href; return false; }
    catch (e) { return true; }
  }
  // the link to share: the shell page (with its tab) when we are inside it, else this page
  function shareUrl() {
    try { if (window.top !== window.self && window.top.location.origin === location.origin) return window.top.location.href; } catch (e) {}
    return location.href;
  }

  function toast(msg) {
    var t = document.querySelector('.sotm-toast');
    if (!t) {
      t = document.createElement('div'); t.className = 'sotm-toast'; t.setAttribute('role', 'status'); t.setAttribute('aria-live', 'polite');
      document.body.appendChild(t);
    }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove('show'); }, 2600);
  }

  function showImageSheet(url) {
    var sh = document.querySelector('.sotm-sheet');
    if (!sh) {
      sh = document.createElement('div'); sh.className = 'sotm-sheet'; sh.setAttribute('role', 'dialog'); sh.setAttribute('aria-modal', 'true'); sh.setAttribute('aria-label', 'بطاقتك');
      sh.innerHTML = '<div class="sotm-sheet__panel"><img alt="بطاقة نجم الشهر"><p></p><button type="button" class="sotm-sheet__close">تم</button></div>';
      document.body.appendChild(sh);
      var close = function () { sh.classList.remove('open'); };
      sh.querySelector('.sotm-sheet__close').addEventListener('click', close);
      sh.addEventListener('click', function (e) { if (e.target === sh) close(); });
      addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    }
    sh.querySelector('img').src = url;
    sh.querySelector('p').textContent = G('اضغطي مطوّلًا على البطاقة واختاري «حفظ الصورة».', 'اضغط مطوّلًا على البطاقة واختر «حفظ الصورة».');
    sh.classList.add('open');
    sh.querySelector('.sotm-sheet__close').focus();
  }

  function saveCanvas(canvas, filename) {
    filename = filename || ('نجم-الشهر-' + member.slug + '.png');
    return toBlob(canvas).then(function (blob) {
      var claude = window.claude;
      var viaClaude = claude && claude.use ? Promise.race([
        claude.use('downloads'), new Promise(function (r) { setTimeout(function () { r(null); }, 1500); })
      ]) : Promise.resolve(null);
      return viaClaude.then(function (dl) {
        if (dl) {
          return dl.save({ filename: filename, data: blob }).then(function () { toast(G('حُفظت بطاقتك ✓', 'حُفظت بطاقتك ✓')); })
            .catch(function () { showImageSheet(URL.createObjectURL(blob)); });
        }
        var url = URL.createObjectURL(blob);
        var isTouch = matchMedia('(pointer: coarse)').matches;
        if (!inFrame() && !isTouch) {
          var a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
          toast('تم تنزيل البطاقة');
        } else {
          showImageSheet(url);
        }
      });
    });
  }

  function readable(u) { try { return decodeURI(u); } catch (e) { return u; } }
  function shareText() {
    return '💎 ' + member.name + ' — ' + member.title + ' في ' + member.committee + ' · ' + CONFIG.club;
  }
  function shareCanvas(canvas) {
    var url = shareUrl();
    var text = shareText();
    var p = canvas ? toBlob(canvas) : Promise.resolve(null);
    return p.then(function (blob) {
      try {
        if (blob && navigator.canShare) {
          var file = new File([blob], 'star-of-the-month.png', { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) return navigator.share({ files: [file], text: text, title: member.title });
        }
        if (navigator.share) return navigator.share({ title: member.title, text: text, url: url });
      } catch (e) {}
      return Promise.reject(new Error('no-share'));
    }).catch(function (err) {
      if (err && err.name === 'AbortError') return;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text + '\n' + url).then(function () { toast('نُسخ الرابط والنص، الصقه في أي محادثة'); })
          .catch(function () { toast(readable(url)); });
      }
      toast(readable(url));
    });
  }

  /* ---------- Small utils ---------- */
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function splitChars(el, text) {
    // keeps Arabic shaping intact: animate whole words, not letters
    el.textContent = '';
    text.split(' ').forEach(function (w, i, arr) {
      var s = document.createElement('span'); s.className = 'w'; s.style.setProperty('--i', i); s.textContent = w;
      el.appendChild(s);
      if (i < arr.length - 1) el.appendChild(document.createTextNode(' '));
    });
  }

  document.documentElement.lang = 'ar';
  document.documentElement.dir = 'rtl';
  document.title = member.title + ' · ' + member.first;

  window.SOTM = {
    CONFIG: CONFIG, MEMBERS: MEMBERS, member: member, G: G, norm: norm, slug: slug,
    sound: { unlock: unlock, play: play, startMusic: startMusic, setMuted: setMuted, isMuted: function () { return muted; }, mountButton: mountSoundButton, drone: drone },
    buzz: buzz,
    burst: burst, reducedMotion: reducedMotion, BRAND: BRAND,
    drawDiamond: drawDiamond, diamondSVG: diamondSVG,
    fitText: fitText, wrapLines: wrapLines, fontsReady: fontsReady,
    saveCanvas: saveCanvas, shareCanvas: shareCanvas, toast: toast,
    wait: wait, $: $, $$: $$, splitWords: splitChars
  };
})();

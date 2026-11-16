/* Gem3D — a rough stone that is cut, step by step, into a brilliant diamond.
   Requires THREE (r128). One geometry morphs continuously from rock (rough=1)
   to a faceted brilliant (rough=0), so every cut visibly changes the same object. */
(function () {
  'use strict';

  var N = 8; // facets around
  // rings from culet (bottom) to table (top): radius, height, angular offset (in segments)
  var RINGS = [
    { r: 0.0, y: -1.02, o: 0 },
    { r: 0.52, y: -0.5, o: 0.5 },
    { r: 1.0, y: 0.0, o: 0 },
    { r: 1.0, y: 0.07, o: 0 },
    { r: 0.8, y: 0.3, o: 0.5 },
    { r: 0.56, y: 0.44, o: 0 },
    { r: 0.0, y: 0.44, o: 0 }
  ];

  function ringPoint(ring, i) {
    var a = ((i + ring.o) / N) * Math.PI * 2;
    return [Math.cos(a) * ring.r, ring.y, Math.sin(a) * ring.r];
  }

  function buildDiamondTris() {
    var tris = [];
    for (var k = 0; k < RINGS.length - 1; k++) {
      var A = RINGS[k], B = RINGS[k + 1];
      for (var i = 0; i < N; i++) {
        var a0 = ringPoint(A, i), a1 = ringPoint(A, i + 1), b0 = ringPoint(B, i), b1 = ringPoint(B, i + 1);
        if (A.r > 0) tris.push([a0, b0, a1]);
        if (B.r > 0) tris.push([a1, b0, b1]);
      }
    }
    return tris;
  }

  // deterministic smooth-ish noise on position (so shared vertices move together)
  function n3(x, y, z, seed) {
    return (Math.sin(3.1 * x + 1.7 * y + seed) + Math.sin(2.3 * y + 4.1 * z + seed * 1.3) + Math.sin(3.7 * z + 2.9 * x + seed * 0.7) +
      0.5 * Math.sin(7.3 * x - 5.1 * z + seed * 2.1)) / 3.5;
  }

  function makeEnvTexture(THREE, renderer) {
    var c = document.createElement('canvas'); c.width = 512; c.height = 256;
    var g = c.getContext('2d');
    var grd = g.createLinearGradient(0, 0, 0, 256);
    grd.addColorStop(0, '#5aa9b6'); grd.addColorStop(0.45, '#163f46'); grd.addColorStop(1, '#06171a');
    g.fillStyle = grd; g.fillRect(0, 0, 512, 256);
    // soft-box streaks: these become the sparkles on polished facets
    var boxes = [[40, 40, 70, 18, '#ffffff'], [180, 26, 40, 60, '#e9f7f8'], [300, 50, 90, 14, '#ffffff'], [420, 30, 30, 40, '#f3e6c9'], [110, 120, 26, 10, '#bfe7ee'], [360, 130, 60, 8, '#ffffff']];
    boxes.forEach(function (b) { g.fillStyle = b[4]; g.globalAlpha = 0.95; g.fillRect(b[0], b[1], b[2], b[3]); });
    g.globalAlpha = 1;
    var tex = new THREE.CanvasTexture(c);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.encoding = THREE.sRGBEncoding;
    var pm = new THREE.PMREMGenerator(renderer);
    var env = pm.fromEquirectangular(tex).texture;
    tex.dispose(); pm.dispose();
    return env;
  }

  function create(container, opts) {
    opts = opts || {};
    var THREE = window.THREE;
    var canvas = document.createElement('canvas');
    canvas.className = 'gem-canvas';
    container.appendChild(canvas);
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
    } catch (e) { canvas.remove(); return null; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
    camera.position.set(0, 0.55, 5.6);
    camera.lookAt(0, 0, 0);

    var env = makeEnvTexture(THREE, renderer);
    scene.environment = env;

    scene.add(new THREE.HemisphereLight(0x9fd6de, 0x2a636d, 0.45));
    var key = new THREE.DirectionalLight(0xffffff, 1.4); key.position.set(2.5, 4, 3); scene.add(key);
    var lights = [
      new THREE.PointLight(0xffffff, 1.6, 12), new THREE.PointLight(0x7fd3e0, 1.4, 12), new THREE.PointLight(0xe9dcc3, 1.2, 12)
    ];
    lights.forEach(function (l) { scene.add(l); });

    // geometry
    var tris = buildDiamondTris();
    var count = tris.length * 3;
    var base = new Float32Array(count * 3), rough = new Float32Array(count * 3);
    var idx = 0;
    tris.forEach(function (t) {
      t.forEach(function (p) {
        base[idx] = p[0]; base[idx + 1] = p[1]; base[idx + 2] = p[2];
        // rock: inflate toward a lumpy ellipsoid
        var len = Math.hypot(p[0], p[1] * 1.25, p[2]) || 1;
        var nx = p[0] / len, ny = (p[1] * 1.25) / len, nz = p[2] / len;
        var lump = 0.86 + 0.26 * n3(nx, ny, nz, 1.7);
        rough[idx] = nx * lump * 1.02 + 0.12 * n3(p[0], p[1], p[2], 4.2);
        rough[idx + 1] = ny * lump * 0.82 + 0.1 * n3(p[2], p[0], p[1], 2.4);
        rough[idx + 2] = nz * lump * 0.96 + 0.12 * n3(p[1], p[2], p[0], 7.9);
        idx += 3;
      });
    });
    var geo = new THREE.BufferGeometry();
    var pos = new Float32Array(count * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

    var ROUGH_COLOR = new THREE.Color('#1d1c19'), GEM_COLOR = new THREE.Color('#3f9aa8');
    var mat = new THREE.MeshStandardMaterial({ color: ROUGH_COLOR.clone(), roughness: 1, metalness: 0, flatShading: true, envMapIntensity: 0.05 });
    var mesh = new THREE.Mesh(geo, mat);

    var edgesGeo = new THREE.EdgesGeometry(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(base, 3)), 1);
    var edgeMat = new THREE.LineBasicMaterial({ color: 0xeef7f8, transparent: true, opacity: 0 });
    var edges = new THREE.LineSegments(edgesGeo, edgeMat);

    var gem = new THREE.Group();
    gem.add(mesh); gem.add(edges);
    gem.rotation.x = 0.32;
    var holder = new THREE.Group(); holder.add(gem); scene.add(holder);
    var scale = opts.scale || 1.05;
    holder.scale.setScalar(scale);

    // state
    var state = { rough: 1, target: 1, polish: 0, polishTarget: 0, spin: 0.35, vel: 0, dragging: false, float: 0, punch: 0 };

    function applyMorph() {
      var t = state.rough, e = t * t * (3 - 2 * t);
      for (var i = 0; i < pos.length; i++) pos[i] = base[i] + (rough[i] - base[i]) * e;
      geo.attributes.position.needsUpdate = true;
      geo.computeVertexNormals();
      geo.computeBoundingSphere();
      var p = state.polish;
      mat.color.copy(ROUGH_COLOR).lerp(GEM_COLOR, Math.min(1, (1 - t) * 0.7 + p * 0.3));
      mat.roughness = 1 - (1 - t) * 0.75 - p * 0.22;
      mat.metalness = (1 - t) * 0.35 + p * 0.35;
      mat.envMapIntensity = 0.05 + (1 - t) * 0.9 + p * 1.2;
      key.intensity = 0.7 + (1 - t) * 0.6;
      edgeMat.opacity = Math.max(0, p * 0.55 - t * 0.5);
    }
    applyMorph();

    // shards
    var shardGeo = new THREE.TetrahedronGeometry(0.07, 0);
    var shardList = [];
    function spawnShards(n) {
      for (var i = 0; i < n; i++) {
        var m = new THREE.Mesh(shardGeo, new THREE.MeshStandardMaterial({ color: mat.color.clone(), roughness: mat.roughness, metalness: mat.metalness, flatShading: true, transparent: true }));
        var a = Math.random() * Math.PI * 2, el = (Math.random() - 0.3) * 1.2;
        var dir = new THREE.Vector3(Math.cos(a), el, Math.sin(a)).normalize();
        m.position.copy(dir).multiplyScalar(0.9 * scale);
        m.scale.setScalar(0.6 + Math.random() * 1.6);
        m.userData.v = dir.multiplyScalar(0.035 + Math.random() * 0.05);
        m.userData.r = new THREE.Vector3(Math.random(), Math.random(), Math.random()).multiplyScalar(0.25);
        m.userData.life = 1;
        scene.add(m); shardList.push(m);
      }
    }

    // sizing
    // fit: the gem takes at most fitW of the width and fitH of the height,
    // centred at `top` (fraction from the top of the container)
    var fitW = opts.fitW || 0.62, fitH = opts.fitH || 0.42, topFrac = opts.top == null ? 0.4 : opts.top, baseY = 0, visH = 4;
    var DIST = camera.position.length();
    function resize() {
      var w = container.clientWidth || innerWidth, h = container.clientHeight || innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      var size = 2.1 * scale;
      visH = Math.max(size / fitH, size / fitW / camera.aspect);
      camera.fov = 2 * Math.atan(visH / 2 / DIST) * 180 / Math.PI;
      baseY = visH * (0.5 - topFrac);
      camera.updateProjectionMatrix();
    }
    function setLayout(o) { if (o.fitW) fitW = o.fitW; if (o.fitH) fitH = o.fitH; if (o.top != null) topFrac = o.top; resize(); }
    resize();
    var ro = window.ResizeObserver ? new ResizeObserver(resize) : null;
    if (ro) ro.observe(container); else addEventListener('resize', resize);

    // interaction
    var down = null, lastX = 0, onTap = opts.onTap || null, interactive = true;
    var ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
    canvas.addEventListener('pointerdown', function (e) {
      if (!interactive) return;
      down = { x: e.clientX, y: e.clientY, t: performance.now() }; lastX = e.clientX; state.dragging = true;
      canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - lastX; lastX = e.clientX;
      state.vel = dx * 0.012; gem.rotation.y += dx * 0.012;
    });
    function up(e) {
      if (!down) return;
      var moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      state.dragging = false;
      if (moved < 8 && onTap) {
        var r = canvas.getBoundingClientRect();
        ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
        ray.setFromCamera(ndc, camera);
        var hitGem = ray.intersectObject(mesh).length > 0;
        onTap({ hit: hitGem, x: e.clientX, y: e.clientY });
      }
      down = null;
    }
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', function () { down = null; state.dragging = false; });

    // loop
    var clock = new THREE.Clock(), raf = 0, running = true;
    function frame() {
      if (!running) return;
      raf = requestAnimationFrame(frame);
      var dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
      var changed = false;
      if (Math.abs(state.rough - state.target) > 0.0005) { state.rough += (state.target - state.rough) * Math.min(1, dt * 5); changed = true; }
      if (Math.abs(state.polish - state.polishTarget) > 0.0005) { state.polish += (state.polishTarget - state.polish) * Math.min(1, dt * 1.6); changed = true; }
      if (changed) applyMorph();
      if (!state.dragging) { state.vel *= 0.95; gem.rotation.y += state.spin * dt + state.vel; }
      state.float += dt;
      state.y = state.y == null ? baseY : state.y + (baseY - state.y) * Math.min(1, dt * 2.5);
      holder.position.y = Math.sin(state.float * 1.1) * 0.05 + state.y;
      state.punch *= 0.88;
      holder.scale.setScalar(scale * (1 - state.punch * 0.08));
      gem.rotation.z = Math.sin(t * 0.7) * 0.04;
      lights[0].position.set(Math.cos(t * 0.8) * 3, 1.6, Math.sin(t * 0.8) * 3);
      lights[1].position.set(Math.cos(t * 0.6 + 2) * 3, -1, Math.sin(t * 0.6 + 2) * 3);
      lights[2].position.set(Math.cos(t * 0.5 + 4) * 3, 2.4, Math.sin(t * 0.5 + 4) * 3);
      for (var i = shardList.length - 1; i >= 0; i--) {
        var s = shardList[i];
        s.userData.v.y -= 0.0022;
        s.position.add(s.userData.v);
        s.rotation.x += s.userData.r.x; s.rotation.y += s.userData.r.y;
        s.userData.life -= dt * 0.9;
        s.material.opacity = Math.max(0, s.userData.life);
        if (s.userData.life <= 0) { scene.remove(s); s.material.dispose(); shardList.splice(i, 1); }
      }
      renderer.render(scene, camera);
    }
    frame();

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { running = false; cancelAnimationFrame(raf); }
      else if (!running) { running = true; clock.getDelta(); frame(); }
    });

    function screenCenter() {
      var v = new THREE.Vector3(); holder.getWorldPosition(v); v.project(camera);
      var r = canvas.getBoundingClientRect();
      return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height };
    }

    return {
      canvas: canvas,
      setRough: function (v, instant) { state.target = v; if (instant) { state.rough = v; applyMorph(); } },
      cut: function (v) { state.target = v; state.punch = 1; state.vel += (Math.random() > 0.5 ? 1 : -1) * 0.06; spawnShards(10 + Math.floor(Math.random() * 6)); },
      polish: function () { state.polishTarget = 1; state.spin = 0.55; },
      setSpin: function (v) { state.spin = v; },
      setLayout: setLayout,
      setInteractive: function (v) { interactive = v; },
      onTap: function (fn) { onTap = fn; },
      screenCenter: screenCenter,
      // square crop around the gem, for the share card
      snapshot: function (size) {
        renderer.render(scene, camera);
        var c = screenCenter(), r = canvas.getBoundingClientRect();
        var sx = canvas.width / r.width, side = Math.min(r.width, r.height) * 0.62;
        var out = document.createElement('canvas'); out.width = out.height = size || 900;
        out.getContext('2d').drawImage(canvas, (c.x - r.left - side / 2) * sx, (c.y - r.top - side / 2) * sx, side * sx, side * sx, 0, 0, out.width, out.height);
        return out;
      },
      dispose: function () { running = false; cancelAnimationFrame(raf); if (ro) ro.disconnect(); renderer.dispose(); }
    };
  }

  window.Gem3D = { create: create, supported: function () {
    try { var c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); } catch (e) { return false; }
  } };
})();

// Wiggle Meadow — core: math, tweens, springs, drawing helpers, particles, camera, input, loop.
(() => {
  const G = (window.G = {
    W: 6400, BEACH: 4800, TOP: -900, BOTTOM: 1800, GROUND: 745, UNDER: 1560,
    things: [], particles: [], tweens: [], timers: [], list: [],
    catchers: [], seats: [], waters: [],
    time: 0, night: 0, scale: 1, base: 1, zoom: 1, ZMIN: 0.55, ZMAX: 2.4, vw: 1600, vh: 900, sw: 0, sh: 0, pinch: null,
    cam: { x: 800, y: 450, tx: 800, ty: 450, vx: 0, vy: 0 },
    view: { x0: 0, y0: 0, x1: 1600, y1: 900 },
    pointers: new Map(),
    look: { x: 800, y: 500, t: -99 }, // last place a finger touched, for eyes to follow
  });
  const INK = (G.INK = '#3b2f4a');
  const TAU = (G.TAU = Math.PI * 2);
  // Things let go of above the soil land on the meadow; drag them down into the soil and they drop into the tunnel.
  G.floorFor = (y) => (y < G.GROUND + 185 ? G.GROUND : G.UNDER);

  // ---------- math ----------
  G.rand = (a, b) => a + Math.random() * (b - a);
  G.randi = (a, b) => Math.floor(G.rand(a, b + 1));
  G.pick = (a) => a[Math.floor(Math.random() * a.length)];
  G.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  G.lerp = (a, b, t) => a + (b - a) * t;
  G.dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
  G.mix = (c1, c2, t) => {
    const a = parseInt(c1.slice(1), 16), b = parseInt(c2.slice(1), 16);
    const ch = (s) => Math.round(G.lerp((a >> s) & 255, (b >> s) & 255, t));
    return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
  };
  G.ease = {
    linear: (t) => t,
    out: (t) => 1 - Math.pow(1 - t, 3),
    inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    outBack: (t) => 1 + 2.7 * Math.pow(t - 1, 3) + 1.7 * Math.pow(t - 1, 2),
    outElastic: (t) => (t <= 0 || t >= 1 ? t : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * 2.094) + 1),
  };

  // ---------- tweens, timers, springs ----------
  G.tween = (obj, to, dur, ease = G.ease.out, done) => {
    const from = {};
    for (const k in to) from[k] = obj[k];
    const tw = { obj, from, to, dur, t: 0, ease, done };
    G.tweens.push(tw);
    return tw;
  };
  G.after = (sec, fn) => G.timers.push({ t: sec, fn });
  G.Spring = class {
    constructor(k = 160, d = 9) { this.x = 0; this.v = 0; this.k = k; this.d = d; }
    kick(v) { this.v += v; return this; }
    update(dt) {
      this.v += (-this.k * this.x - this.d * this.v) * dt;
      this.x += this.v * dt;
      return this.x;
    }
  };

  // ---------- drawing helpers (chunky outlined shapes) ----------
  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
      r = Math.min(typeof r === 'number' ? r : r[0] || 0, w / 2, h / 2);
      this.moveTo(x + r, y); this.arcTo(x + w, y, x + w, y + h, r); this.arcTo(x + w, y + h, x, y + h, r);
      this.arcTo(x, y + h, x, y, r); this.arcTo(x, y, x + w, y, r); this.closePath();
    };
  }
  G.path = (c, fill, build, lw = 5) => {
    c.beginPath(); build(c);
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (lw) { c.lineWidth = lw; c.strokeStyle = INK; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); }
  };
  G.circle = (c, x, y, r, fill, lw) => G.path(c, fill, (p) => p.arc(x, y, Math.max(0.1, r), 0, TAU), lw);
  G.ellipse = (c, x, y, rx, ry, fill, lw, rot = 0) =>
    G.path(c, fill, (p) => p.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, TAU), lw);
  G.rrect = (c, x, y, w, h, r, fill, lw) => G.path(c, fill, (p) => p.roundRect(x, y, w, h, r), lw);
  G.starPath = (c, x, y, r1, r2, n = 5, rot = -Math.PI / 2) => {
    for (let i = 0; i < n * 2; i++) {
      const r = i % 2 ? r2 : r1, a = rot + (i * Math.PI) / n;
      i ? c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r) : c.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    }
    c.closePath();
  };
  G.heartPath = (c, x, y, s) => {
    c.moveTo(x, y + s * 0.5);
    c.bezierCurveTo(x - s * 1.2, y - s * 0.2, x - s * 0.55, y - s * 1.1, x, y - s * 0.45);
    c.bezierCurveTo(x + s * 0.55, y - s * 1.1, x + s * 1.2, y - s * 0.2, x, y + s * 0.5);
  };
  // Simple dot eyes with a shine; blink squashes them, look shifts them.
  G.eyes = (c, x, y, gap, r, lx = 0, ly = 0, blink = 0, mood = 'open') => {
    for (const s of [-1, 1]) {
      const ex = x + s * gap + lx * r * 0.5, ey = y + ly * r * 0.4;
      if (mood === 'closed' || blink > 0.85) {
        G.path(c, null, (p) => { p.moveTo(ex - r, ey); p.quadraticCurveTo(ex, ey + r * 0.9, ex + r, ey); }, r * 0.55);
      } else if (mood === 'happy') {
        G.path(c, null, (p) => { p.moveTo(ex - r, ey + r * 0.3); p.quadraticCurveTo(ex, ey - r * 1.1, ex + r, ey + r * 0.3); }, r * 0.55);
      } else {
        const sy = mood === 'wide' ? 1.25 : 1 - blink;
        c.fillStyle = INK; c.beginPath(); c.ellipse(ex, ey, r * (mood === 'wide' ? 1.15 : 1), r * 1.15 * sy, 0, 0, TAU); c.fill();
        c.fillStyle = '#fff'; c.beginPath(); c.arc(ex - r * 0.3, ey - r * 0.4 * sy, r * 0.35, 0, TAU); c.fill();
      }
    }
  };
  G.cheeks = (c, x, y, gap, r, a = 0.45) => {
    c.fillStyle = `rgba(255,120,150,${a})`;
    for (const d of [-1, 1]) { c.beginPath(); c.arc(x + d * gap, y, r, 0, TAU); c.fill(); }
  };
  G.smile = (c, x, y, w, lw = 3.5) => G.path(c, null, (p) => { p.moveTo(x - w, y); p.quadraticCurveTo(x, y + w * 0.9, x + w, y); }, lw);

  // ---------- particles ----------
  G.spawn = (kind, x, y, o = {}) => {
    const p = Object.assign({ kind, x, y, vx: 0, vy: 0, g: 0, life: 1, age: 0, size: 12, rot: 0, vr: 0, color: '#fff', drag: 0.5 }, o);
    G.particles.push(p);
    return p;
  };
  G.burst = (kind, x, y, n = 10, o = {}) => {
    for (let i = 0; i < n; i++) {
      const a = o.angle !== undefined ? o.angle + G.rand(-(o.spread ?? 0.6), o.spread ?? 0.6) : G.rand(0, TAU);
      const sp = G.rand(o.speedMin ?? 60, o.speed ?? 260);
      G.spawn(kind, x + G.rand(-(o.jitter ?? 0), o.jitter ?? 0), y, {
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (o.up ?? 0), g: o.g ?? 300,
        life: G.rand(0.6, 1.1) * (o.life ?? 1), size: G.rand(0.7, 1.3) * (o.size ?? 14),
        rot: G.rand(0, TAU), vr: G.rand(-6, 6), drag: o.drag ?? 0.5,
        color: o.colors ? G.pick(o.colors) : o.color ?? '#fff',
      });
    }
  };
  G.CONFETTI = ['#ff8a7a', '#ffc94a', '#8fd16a', '#6cc3f0', '#b9a3e3', '#ff9ed2'];

  function drawParticle(c, p) {
    const k = 1 - p.age / p.life, s = p.size;
    c.save(); c.globalAlpha = Math.min(1, k * 1.6); c.translate(p.x, p.y); c.rotate(p.rot);
    c.fillStyle = p.color;
    switch (p.kind) {
      case 'sparkle': c.beginPath(); G.starPath(c, 0, 0, s, s * 0.3, 4); c.fill(); break;
      case 'star': G.path(c, p.color, (q) => G.starPath(q, 0, 0, s, s * 0.45, 5), 2.5); break;
      case 'heart': c.rotate(-p.rot * 0.85); G.path(c, p.color, (q) => G.heartPath(q, 0, 0, s), 2.5); break;
      case 'confetti': c.fillRect(-s * 0.5, -s * 0.3, s, s * 0.6); break;
      case 'coin': c.scale(Math.abs(Math.cos(p.rot * 2)) + 0.15, 1); G.circle(c, 0, 0, s, p.color, 2.5); break;
      case 'leaf': G.ellipse(c, 0, 0, s, s * 0.45, p.color, 2); break;
      case 'drop': c.rotate(-p.rot); c.beginPath(); c.moveTo(0, -s); c.quadraticCurveTo(s * 0.7, s * 0.2, 0, s * 0.6);
        c.quadraticCurveTo(-s * 0.7, s * 0.2, 0, -s); c.fill(); break;
      case 'bubble': c.rotate(-p.rot); c.globalAlpha *= 0.85; c.strokeStyle = '#ffffff'; c.lineWidth = 3;
        c.beginPath(); c.arc(0, 0, s, 0, TAU); c.fillStyle = 'rgba(200,235,255,.25)'; c.fill(); c.stroke();
        c.fillStyle = '#fff'; c.beginPath(); c.arc(-s * 0.35, -s * 0.35, s * 0.2, 0, TAU); c.fill(); break;
      case 'smoke': c.globalAlpha *= 0.55; c.beginPath(); c.arc(0, 0, s * (1.6 - k * 0.8), 0, TAU); c.fill(); break;
      case 'note': case 'zzz': c.rotate(-p.rot * 0.8); c.font = `900 ${s * 2}px "Baloo 2", system-ui, sans-serif`;
        c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 4; c.strokeStyle = INK;
        c.strokeText(p.kind === 'note' ? '♪' : 'z', 0, 0); c.fillText(p.kind === 'note' ? '♪' : 'z', 0, 0); break;
      default: c.beginPath(); c.arc(0, 0, s * k, 0, TAU); c.fill(); // dust
    }
    c.restore();
  }

  // ---------- canvas & camera ----------
  const canvas = (G.canvas = document.getElementById('game'));
  const ctx = (G.ctx = canvas.getContext('2d'));
  let dpr = 1;
  const cam = G.cam;
  G.clampCam = (x, y) => [
    G.vw >= G.W ? G.W / 2 : G.clamp(x, G.vw / 2, G.W - G.vw / 2),
    G.vh >= G.BOTTOM - G.TOP ? (G.TOP + G.BOTTOM) / 2 : G.clamp(y, G.TOP + G.vh / 2, G.BOTTOM - G.vh / 2),
  ];
  G.camTo = (x, y) => { [cam.tx, cam.ty] = G.clampCam(x, y); cam.vx = cam.vy = 0; };
  const applyScale = () => { G.scale = G.base * G.zoom; G.vw = G.sw / G.scale; G.vh = G.sh / G.scale; };
  G.resize = () => {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    G.sw = window.innerWidth; G.sh = window.innerHeight;
    canvas.width = Math.round(G.sw * dpr); canvas.height = Math.round(G.sh * dpr);
    let s = Math.min(G.sw / 1600, G.sh / 900);
    s = Math.max(s, (G.sh / 900) * 0.72); // tall phones zoom in instead of shrinking the meadow
    G.base = s; applyScale();
    [cam.x, cam.y] = G.clampCam(cam.x, cam.y);
    [cam.tx, cam.ty] = G.clampCam(cam.tx, cam.ty);
  };
  window.addEventListener('resize', G.resize);
  G.resize();
  const toWorld = (sx, sy) => ({ x: sx / G.scale + cam.x - G.vw / 2, y: sy / G.scale + cam.y - G.vh / 2 });
  // Zoom around a screen point, keeping whatever is under it in place.
  G.setZoom = (z, sx = G.sw / 2, sy = G.sh / 2) => {
    const before = toWorld(sx, sy);
    G.zoom = G.clamp(z, G.ZMIN, G.ZMAX); applyScale();
    const after = toWorld(sx, sy);
    [cam.x, cam.y] = G.clampCam(cam.x + before.x - after.x, cam.y + before.y - after.y);
    cam.tx = cam.x; cam.ty = cam.y; cam.vx = cam.vy = 0;
  };

  G.add = (t) => { G.things.push(t); return t; };
  G.pickAt = (x, y, filter) => {
    for (let i = G.list.length - 1; i >= 0; i--) {
      const t = G.list[i];
      if (!t.dead && t.pickable !== false && t.hit && (!filter || filter(t)) && t.hit(x, y)) return t;
    }
    return null;
  };

  // ---------- input: tap, tickle, drag + throw, strum, pan ----------
  const pos = (e) => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    G.sfx && G.sfx.unlock();
    const [sx, sy] = pos(e), p = toWorld(sx, sy);
    G.look = { x: p.x, y: p.y, t: G.time };
    const thing = G.pickAt(p.x, p.y, (t) => !t.held);
    const rec = {
      sx0: sx, sy0: sy, sx, sy, x0: p.x, y0: p.y, x: p.x, y: p.y, t0: G.time, lt: G.time, thing,
      drag: false, pan: false, vx: 0, vy: 0, svx: 0, svy: 0, cx0: cam.x, cy0: cam.y,
    };
    G.pointers.set(e.pointerId, rec);
    cam.vx = cam.vy = 0;
    try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
    // A second finger while the first isn't holding anything: pinch to zoom (and two-finger pan).
    const other = [...G.pointers.values()].filter((r) => r !== rec && !r.dead && !r.drag && !(r.thing && r.thing.draggable));
    if (!G.pinch && other.length === 1 && !(thing && thing.draggable)) {
      const a = other[0], mx = (a.sx + sx) / 2, my = (a.sy + sy) / 2;
      a.pinch = rec.pinch = true; a.pan = rec.pan = false;
      G.pinch = { a, b: rec, d0: Math.max(20, Math.hypot(a.sx - sx, a.sy - sy)), z0: G.zoom, w0: toWorld(mx, my) };
      return;
    }
    if (thing && thing.onPress) thing.onPress(p, rec);
  });
  const pinchMove = () => {
    const P = G.pinch, d = Math.hypot(P.a.sx - P.b.sx, P.a.sy - P.b.sy);
    G.zoom = G.clamp((P.z0 * d) / P.d0, G.ZMIN, G.ZMAX); applyScale();
    const w = toWorld((P.a.sx + P.b.sx) / 2, (P.a.sy + P.b.sy) / 2);
    [cam.x, cam.y] = G.clampCam(cam.x + P.w0.x - w.x, cam.y + P.w0.y - w.y);
    cam.tx = cam.x; cam.ty = cam.y;
  };
  canvas.addEventListener('pointermove', (e) => {
    const rec = G.pointers.get(e.pointerId);
    if (!rec) return;
    const [sx, sy] = pos(e), p = toWorld(sx, sy);
    G.look = { x: p.x, y: p.y, t: G.time };
    const dt = Math.max(0.008, G.time - rec.lt);
    rec.vx = G.lerp(rec.vx, (p.x - rec.x) / dt, 0.5); rec.vy = G.lerp(rec.vy, (p.y - rec.y) / dt, 0.5);
    rec.svx = G.lerp(rec.svx, (sx - rec.sx) / dt, 0.5); rec.svy = G.lerp(rec.svy, (sy - rec.sy) / dt, 0.5);
    rec.x = p.x; rec.y = p.y; rec.sx = sx; rec.sy = sy; rec.lt = G.time;
    if (rec.dead) return;
    if (rec.pinch) { if (G.pinch) pinchMove(); return; }
    const moved = Math.hypot(sx - rec.sx0, sy - rec.sy0);
    const t = rec.thing;
    if (rec.pan) {
      cam.x = cam.tx = rec.cx0 - (sx - rec.sx0) / G.scale;
      cam.y = cam.ty = rec.cy0 - (sy - rec.sy0) / G.scale;
      [cam.tx, cam.ty] = G.clampCam(cam.tx, cam.ty); [cam.x, cam.y] = [cam.tx, cam.ty];
      return;
    }
    if (t && t.draggable && !rec.drag && moved > (t.dragSlop || 10)) {
      rec.drag = true; t.held = rec; rec.ox = t.x - p.x; rec.oy = t.y - p.y;
      t.onDragStart && t.onDragStart(p, rec);
    }
    if (rec.drag) {
      t.onDrag ? t.onDrag(p, rec) : ((t.x = p.x + rec.ox), (t.y = p.y + rec.oy));
    } else if (t && t.draggable) {
      t.onRub && t.onRub(p, rec); // wiggling a finger on a critter tickles it
    } else if ((!t || !t.onRub) && moved > 10) {
      rec.pan = true; rec.sx0 = sx; rec.sy0 = sy; rec.cx0 = cam.x; rec.cy0 = cam.y;
    } else {
      const under = G.pickAt(p.x, p.y, (q) => q.onRub && !q.draggable);
      if (under) under.onRub(p, rec); // strumming flowers, shells, crystals
    }
  });
  const release = (e) => {
    const rec = G.pointers.get(e.pointerId);
    if (!rec) return;
    G.pointers.delete(e.pointerId);
    if (rec.pinch) { // lifting either finger ends the pinch; the other finger stays inert until lifted
      const P = G.pinch;
      if (P && (P.a === rec || P.b === rec)) { (P.a === rec ? P.b : P.a).dead = true; G.pinch = null; }
      return;
    }
    if (rec.dead) return;
    const t = rec.thing, p = { x: rec.x, y: rec.y };
    if (rec.pan) { cam.vx = G.clamp(-rec.svx / G.scale, -2500, 2500); cam.vy = G.clamp(-rec.svy / G.scale, -2500, 2500); return; }
    if (rec.drag) { t.held = null; t.onDrop && t.onDrop(p, rec); return; }
    const small = Math.hypot(rec.sx - rec.sx0, rec.sy - rec.sy0) < 14;
    if (e.type === 'pointercancel' || !small || G.time - rec.t0 > 0.8) return;
    if (t && t.onTap) t.onTap(p, rec);
    else if (!t && G.onEmptyTap) G.onEmptyTap(p);
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  // Trackpad pinch / ctrl+wheel zooms; a plain wheel or two-finger trackpad swipe scrolls.
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const [sx, sy] = pos(e);
    if (e.ctrlKey) { G.setZoom(G.zoom * Math.exp(-e.deltaY * 0.01), sx, sy); return; }
    [cam.x, cam.y] = G.clampCam(cam.x + e.deltaX / G.scale, cam.y + e.deltaY / G.scale);
    cam.tx = cam.x; cam.ty = cam.y; cam.vx = cam.vy = 0;
  }, { passive: false });
  document.addEventListener('gesturestart', (e) => e.preventDefault()); // keep Safari from zooming the page itself

  // ---------- main loop ----------
  let last = 0;
  function frame(ts) {
    const now = ts / 1000;
    const dt = Math.min(0.05, last ? now - last : 0.016);
    last = now; G.time += dt;

    // camera: fling inertia, edge-scroll while carrying something, then ease toward the target
    if (cam.vx || cam.vy) {
      cam.tx += cam.vx * dt; cam.ty += cam.vy * dt;
      const k = Math.exp(-3.5 * dt); cam.vx *= k; cam.vy *= k;
      if (Math.hypot(cam.vx, cam.vy) < 8) cam.vx = cam.vy = 0;
    }
    for (const rec of G.pointers.values()) {
      if (!rec.drag) continue;
      const m = 80, ex = rec.sx < m ? -1 : rec.sx > G.sw - m ? 1 : 0, ey = rec.sy < m ? -1 : rec.sy > G.sh - m ? 1 : 0;
      cam.tx += ex * 700 * dt; cam.ty += ey * 700 * dt;
      rec.vx *= Math.exp(-6 * dt); rec.vy *= Math.exp(-6 * dt);
    }
    [cam.tx, cam.ty] = G.clampCam(cam.tx, cam.ty);
    const ck = 1 - Math.exp(-7 * dt);
    cam.x += (cam.tx - cam.x) * ck; cam.y += (cam.ty - cam.y) * ck;
    for (const rec of G.pointers.values()) {
      if (!rec.drag || !rec.thing) continue;
      const p = toWorld(rec.sx, rec.sy); rec.x = p.x; rec.y = p.y;
      const t = rec.thing;
      t.onDrag ? t.onDrag(p, rec) : ((t.x = p.x + rec.ox), (t.y = p.y + rec.oy));
    }

    for (let i = G.tweens.length - 1; i >= 0; i--) {
      const tw = G.tweens[i];
      tw.t += dt;
      const k = Math.min(1, tw.t / tw.dur), e = tw.ease(k);
      for (const key in tw.to) tw.obj[key] = tw.from[key] + (tw.to[key] - tw.from[key]) * e;
      if (k >= 1) { G.tweens.splice(i, 1); tw.done && tw.done(); }
    }
    for (let i = G.timers.length - 1; i >= 0; i--) {
      const tm = G.timers[i];
      if ((tm.t -= dt) <= 0) { G.timers.splice(i, 1); tm.fn(); }
    }
    for (const t of G.things) t.update && t.update(dt);
    G.things = G.things.filter((t) => !t.dead);
    for (const p of G.particles) {
      p.age += dt; p.vy += p.g * dt;
      p.vx *= 1 - p.drag * dt; p.vy *= 1 - p.drag * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
    }
    G.particles = G.particles.filter((p) => p.age < p.life);
    if (G.particles.length > 900) G.particles.splice(0, G.particles.length - 900);

    // draw
    const v = G.view, s = G.scale;
    v.x0 = cam.x - G.vw / 2; v.x1 = v.x0 + G.vw; v.y0 = cam.y - G.vh / 2; v.y1 = v.y0 + G.vh;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(dpr * s, 0, 0, dpr * s, -v.x0 * s * dpr, -v.y0 * s * dpr);
    G.paintBack && G.paintBack(ctx);
    G.list = G.things.slice().sort((a, b) => (a.held ? 50 : a.z || 0) - (b.held ? 50 : b.z || 0) || a.y - b.y);
    const near = (t) => t.always || t.x === undefined || (t.x > v.x0 - 700 && t.x < v.x1 + 700 && t.y > v.y0 - 900 && t.y < v.y1 + 900);
    for (const t of G.list) if (t.draw && near(t)) { ctx.save(); t.draw(ctx); ctx.restore(); }
    if (G.night > 0.01) {
      ctx.fillStyle = `rgba(20,24,70,${0.42 * G.night})`;
      ctx.fillRect(v.x0 - 5, v.y0 - 5, v.x1 - v.x0 + 10, v.y1 - v.y0 + 10);
      ctx.globalCompositeOperation = 'lighter';
      for (const t of G.list) if (t.glow && near(t)) { ctx.save(); t.glow(ctx); ctx.restore(); }
      ctx.globalCompositeOperation = 'source-over';
    }
    for (const p of G.particles) if (p.x > v.x0 - 50 && p.x < v.x1 + 50 && p.y > v.y0 - 50 && p.y < v.y1 + 50) drawParticle(ctx, p);
    G.onFrame && G.onFrame(dt);
    requestAnimationFrame(frame);
  }
  G.start = () => requestAnimationFrame(frame);
})();

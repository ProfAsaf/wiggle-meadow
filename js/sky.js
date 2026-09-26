// Wiggle Meadow — sky, hills, sun & moon, rain clouds, rainbow, stars, fireflies.
(() => {
  const G = window.G, S = () => G.sfx;
  G.rainbow = 0;

  // ---------- stars & shooting stars (painted by the backdrop; always out in space, everywhere at night) ----------
  class Stars {
    constructor() {
      this.z = -10; this.pickable = false; this.always = true; this.shooting = [];
      this.stars = Array.from({ length: 280 }, () => ({ x: G.rand(0, G.W), y: G.rand(G.TOP + 10, 560), r: G.rand(1.5, 4), ph: G.rand(0, 6) }));
    }
    shoot(x, y) {
      this.shooting.push({ x, y, vx: G.pick([-1, 1]) * G.rand(700, 900), vy: G.rand(250, 380), life: 0.9, age: 0 });
      S().twinkle();
    }
    update(dt) {
      for (const s of this.shooting) { s.age += dt; s.x += s.vx * dt; s.y += s.vy * dt; }
      this.shooting = this.shooting.filter((s) => s.age < s.life);
    }
    drawSky(c) {
      const n = G.night, v = G.view;
      for (const s of this.stars) {
        if (s.x < v.x0 - 10 || s.x > v.x1 + 10 || s.y < v.y0 - 10 || s.y > v.y1 + 10) continue;
        const a = Math.max(n, G.clamp((-s.y - 150) / 500, 0, 1));
        if (a < 0.02) continue;
        c.globalAlpha = a * (0.55 + 0.45 * Math.sin(G.time * 2 + s.ph));
        c.fillStyle = '#fff7d6'; c.beginPath(); G.starPath(c, s.x, s.y, s.r * 2, s.r * 0.7, 4); c.fill();
      }
      c.globalAlpha = 1;
      for (const s of this.shooting) {
        const k = 1 - s.age / s.life, g = c.createLinearGradient(s.x, s.y, s.x - s.vx * 0.25, s.y - s.vy * 0.25);
        g.addColorStop(0, `rgba(255,250,220,${k})`); g.addColorStop(1, 'rgba(255,250,220,0)');
        c.strokeStyle = g; c.lineWidth = 6; c.lineCap = 'round';
        c.beginPath(); c.moveTo(s.x, s.y); c.lineTo(s.x - s.vx * 0.25, s.y - s.vy * 0.25); c.stroke();
      }
    }
  }

  // ---------- the sun (tap: goodnight!) and the moon (tap: good morning!) ----------
  class Orb {
    constructor(x, y) {
      this.x = x; this.y = y; this.z = 1; this.oy = 0; this.mode = 'sun'; this.spin = 0; this.busy = false;
      this.sq = new G.Spring(180, 8); this.blink = 0;
    }
    hit(px, py) { return G.dist(px, py, this.x, this.y + this.oy) < 105; }
    onTap() {
      this.sq.kick(3);
      if (this.busy) return;
      this.busy = true;
      const toNight = this.mode === 'sun';
      G.burst('sparkle', this.x, this.y, 14, { color: toNight ? '#ffe27a' : '#fff6c9', g: 0, speed: 320, size: 14 });
      S().giggle(toNight ? 1.1 : 0.9);
      G.tween(this, { spin: this.spin + G.TAU }, 1, G.ease.outBack);
      G.after(0.8, () => {
        toNight ? S().sunset() : S().sunrise();
        G.tween(G, { night: toNight ? 1 : 0 }, 2.4, G.ease.inOut);
        G.tween(this, { oy: 720 }, 1.1, G.ease.inOut, () => {
          this.mode = toNight ? 'moon' : 'sun';
          G.tween(this, { oy: 0 }, 1.3, G.ease.outBack, () => (this.busy = false));
        });
      });
    }
    update(dt) {
      // far away, so it rides along with the view like the real sun does
      this.x = G.view.x0 + G.vw * 0.82; this.y = Math.min(G.view.y0 + G.vh * 0.2, 400);
      this.sq.update(dt);
      if (Math.random() < dt * 0.3) this.blink = 1;
      this.blink = Math.max(0, this.blink - dt * 6);
    }
    drawSky(c) {
      const t = G.time, q = G.clamp(this.sq.x, -0.4, 0.4);
      c.save(); c.globalAlpha = G.clamp(1 - this.oy / 700, 0, 1);
      c.translate(this.x, this.y + this.oy); c.scale(1 + q * 0.5, 1 - q * 0.5);
      if (this.mode === 'sun') {
        c.save(); c.rotate(t * 0.25 + this.spin);
        for (let i = 0; i < 12; i++) {
          c.rotate(G.TAU / 12);
          G.path(c, i % 2 ? '#ffb84a' : '#ffd24d', (p) => { p.moveTo(-14, -80); p.quadraticCurveTo(0, -128 - Math.sin(t * 3 + i) * 8, 14, -80); p.closePath(); }, 4);
        }
        c.restore();
        c.rotate(Math.sin(this.spin) * 0.3);
        G.circle(c, 0, 0, 74, '#ffd84f', 6);
        G.eyes(c, 0, -10, 24, 8, 0, 0, this.blink, this.busy ? 'happy' : 'open');
        c.fillStyle = 'rgba(255,120,90,.45)';
        for (const d of [-1, 1]) { c.beginPath(); c.arc(d * 40, 14, 11, 0, G.TAU); c.fill(); }
        G.path(c, null, (p) => { p.moveTo(-18, 18); p.quadraticCurveTo(0, 36, 18, 18); }, 5);
      } else {
        G.circle(c, 0, 0, 64, '#fff3c4', 6);
        c.fillStyle = '#efdc9d';
        for (const [x, y, r] of [[-26, -28, 10], [30, -14, 7], [16, 34, 9]]) { c.beginPath(); c.arc(x, y, r, 0, G.TAU); c.fill(); }
        G.eyes(c, 0, -4, 20, 7, 0, 0, 0, this.busy ? 'happy' : 'closed');
        c.fillStyle = 'rgba(255,140,160,.4)';
        for (const d of [-1, 1]) { c.beginPath(); c.arc(d * 34, 14, 9, 0, G.TAU); c.fill(); }
        G.path(c, null, (p) => { p.moveTo(-12, 18); p.quadraticCurveTo(0, 28, 12, 18); }, 4);
      }
      c.restore();
    }
    glow(c) {
      if (this.mode !== 'moon') return;
      const g = c.createRadialGradient(this.x, this.y + this.oy, 50, this.x, this.y + this.oy, 190);
      g.addColorStop(0, `rgba(255,240,190,${0.35 * G.night})`); g.addColorStop(1, 'rgba(255,240,190,0)');
      c.fillStyle = g; c.fillRect(this.x - 200, this.y + this.oy - 200, 400, 400);
    }
  }

  // ---------- clouds: drag them around, tap to make rain ----------
  const PUFFS = [[-70, 8, 42], [-28, -18, 52], [28, -24, 56], [74, 4, 42], [0, 14, 50]];
  class Cloud {
    constructor(x, y, s) {
      this.x = x; this.y = y; this.s = s; this.z = 2; this.draggable = true;
      this.vx = G.rand(7, 14) * G.pick([-1, 1]); this.rainT = 0; this.sq = new G.Spring(200, 7);
    }
    hit(px, py) { const dx = (px - this.x) / (125 * this.s), dy = (py - this.y) / (70 * this.s); return dx * dx + dy * dy < 1; }
    onTap() {
      this.sq.kick(3.5); S().pop();
      if (this.rainT <= 0) S().rain(3.6);
      this.rainT = 3.6;
    }
    onDrag(p, rec) { this.x = p.x + rec.ox; this.y = G.clamp(p.y + rec.oy, 70, 330); this.sq.kick(rec.vx * 0.0006); }
    update(dt) {
      this.sq.update(dt);
      if (!this.held) {
        this.x += this.vx * dt;
        if (this.x > G.W + 260) this.x = -260;
        if (this.x < -260) this.x = G.W + 260;
      }
      if (this.rainT > 0) {
        this.rainT -= dt;
        const rate = 45 * this.s;
        for (let i = 0; i < rate * dt * 2; i++) {
          if (Math.random() > 0.5) continue;
          const x = this.x + G.rand(-95, 95) * this.s, y = this.y + 45 * this.s;
          G.spawn('drop', x, y, { vy: 950, drag: 0, life: (G.GROUND + 40 - y) / 950, size: 8, color: '#5fb8ec' });
        }
        if (Math.random() < dt * 8) G.burst('dust', this.x + G.rand(-90, 90) * this.s, G.GROUND + G.rand(10, 80), 3, { color: '#8fd3f5', size: 5, g: 400, up: 150, speed: 60 });
        for (const f of G.flowers || []) if (Math.abs(f.x - this.x) < 110 * this.s) f.water(dt);
        if (this.rainT <= 0 && G.rainbow < 0.1 && Math.random() < 0.6) {
          G.tween(G, { rainbow: 1 }, 1.5, G.ease.inOut, () => G.after(7, () => G.tween(G, { rainbow: 0 }, 2)));
          S().tada();
        }
      }
    }
    draw(c) {
      const q = G.clamp(this.sq.x, -0.35, 0.35), raining = this.rainT > 0;
      c.translate(this.x, this.y); c.scale(this.s * (1 + q * 0.6), this.s * (1 - q * 0.6));
      c.fillStyle = G.INK;
      for (const [x, y, r] of PUFFS) { c.beginPath(); c.arc(x, y, r + 5, 0, G.TAU); c.fill(); }
      c.fillStyle = raining ? '#e2ebf5' : '#ffffff';
      for (const [x, y, r] of PUFFS) { c.beginPath(); c.arc(x, y, r, 0, G.TAU); c.fill(); }
      G.eyes(c, 0, 2, 20, 6, 0, 0, 0, raining ? 'closed' : this.held ? 'wide' : 'open');
      c.fillStyle = 'rgba(255,140,170,.45)';
      for (const d of [-1, 1]) { c.beginPath(); c.arc(d * 36, 18, 8, 0, G.TAU); c.fill(); }
      if (raining) G.ellipse(c, 0, 24, 6, 7, '#7a2e45', 3);
      else G.path(c, null, (p) => { p.moveTo(-10, 20); p.quadraticCurveTo(0, 30, 10, 20); }, 4);
    }
  }

  // ---------- fireflies (night only; tap one and it zooms off) ----------
  class Fireflies {
    constructor(n) {
      this.z = 12; this.y = 0; this.hot = null;
      this.flies = Array.from({ length: n }, () => ({ x: G.rand(100, G.W - 100), y: G.rand(380, 720), a: G.rand(0, G.TAU), sp: G.rand(25, 45), ph: G.rand(0, 6), zoom: 0 }));
    }
    hit(px, py) {
      if (G.night < 0.5) return false;
      this.hot = this.flies.find((f) => G.dist(px, py, f.x, f.y) < 45);
      return !!this.hot;
    }
    onTap() {
      const f = this.hot; if (!f) return;
      f.zoom = 1.3; f.a = G.rand(0, G.TAU); S().twinkle();
      G.burst('sparkle', f.x, f.y, 8, { color: '#e9ff9a', g: 0, speed: 160, size: 9 });
    }
    update(dt) {
      for (const f of this.flies) {
        f.zoom = Math.max(0, f.zoom - dt);
        f.a += G.rand(-2.5, 2.5) * dt;
        const sp = f.sp * (1 + f.zoom * 7);
        f.x += Math.cos(f.a) * sp * dt; f.y += Math.sin(f.a) * sp * dt;
        if (f.x < 60 || f.x > G.W - 60 || f.y < 330 || f.y > 740) f.a = Math.atan2(560 - f.y, G.W / 2 - f.x) + G.rand(-0.6, 0.6);
      }
    }
    glow(c) {
      for (const f of this.flies) {
        const a = G.night * (0.45 + 0.55 * Math.sin(G.time * 3 + f.ph));
        if (a <= 0.02) continue;
        const g = c.createRadialGradient(f.x, f.y, 0, f.x, f.y, 22);
        g.addColorStop(0, `rgba(240,255,150,${a})`); g.addColorStop(1, 'rgba(240,255,150,0)');
        c.fillStyle = g; c.fillRect(f.x - 22, f.y - 22, 44, 44);
      }
    }
  }

  Object.assign(G, { Stars, Orb, Cloud, Fireflies });
})();

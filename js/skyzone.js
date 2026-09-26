// Wiggle Meadow — up in the sky: a hot-air balloon to ride, a banner plane, a flock of birds,
// and way up in space a ringed planet with a rocket looping around it.
(() => {
  const G = window.G, S = () => G.sfx;

  // A front layer drawn above critters (basket fronts, blankets) so riders look tucked in.
  class Front {
    constructor(owner, draw, z = 8) { this.owner = owner; this.drawFn = draw; this.z = z; this.pickable = false; }
    update() { this.x = this.owner.x; this.y = this.owner.y + 1; }
    draw(c) { this.drawFn(c); }
  }

  // ---------- hot-air balloon: drag it anywhere, tap for a burst of flame, drop a critter in the basket ----------
  const STRIPES = ['#ff8a7a', '#ffd84f', '#6cc3f0', '#ff9ed2', '#8fd16a', '#b9a3e3'];
  class HotAir {
    constructor(x, y) {
      this.x = x; this.hx = x; this.y = y; this.alt = y; this.z = 6; this.draggable = true; this.flame = 0; this.vx = 10; this.sq = new G.Spring(120, 6);
      this.seat = { kind: 'basket', x, y: y - 22, rot: 0, occupant: null, fling: () => ({ vx: G.rand(-200, 200), vy: -500 }) };
      G.seats.push(this.seat);
      G.add(new Front(this, (c) => this.drawBasket(c, true), 8));
    }
    hit(px, py) {
      const dx = (px - this.x) / 130, dy = (py - (this.y - 250)) / 150;
      return dx * dx + dy * dy < 1 || (Math.abs(px - this.x) < 50 && py > this.y - 70 && py < this.y);
    }
    onTap() { this.flame = 1.2; this.alt = Math.max(G.TOP + 360, this.alt - 110); S().burner(); this.sq.kick(2); }
    onDrag(p, rec) { this.x = this.hx = G.clamp(p.x + rec.ox, 150, G.W - 150); this.y = G.clamp(p.y + rec.oy, G.TOP + 330, 430); this.alt = this.y; this.sq.kick(rec.vx * 0.0004); }
    update(dt) {
      this.sq.update(dt); this.flame = Math.max(0, this.flame - dt);
      if (!this.held) {
        this.x += this.vx * dt; // drifts gently back and forth around where it was left
        if (Math.abs(this.x - this.hx) > 350 || this.x < 250 || this.x > G.W - 250) this.vx = -Math.sign(this.x - this.hx || 1) * Math.abs(this.vx);
        this.alt = Math.min(this.alt + dt * 6, 300);
        this.y = G.lerp(this.y, this.alt + Math.sin(G.time * 0.9) * 12, 1 - Math.exp(-1.5 * dt));
      }
      this.seat.x = this.x; this.seat.y = this.y - 22;
    }
    drawBasket(c, front) {
      const x = this.x, y = this.y;
      if (front) {
        G.rrect(c, x - 48, y - 56, 96, 56, 10, '#c98d5b', 5);
        c.strokeStyle = 'rgba(59,47,74,.35)'; c.lineWidth = 3;
        for (const yy of [-40, -22]) { c.beginPath(); c.moveTo(x - 44, y + yy); c.lineTo(x + 44, y + yy); c.stroke(); }
        G.rrect(c, x - 54, y - 62, 108, 14, 6, '#a86f43', 4);
      } else G.rrect(c, x - 44, y - 60, 88, 56, 8, '#8a5a34', 4);
    }
    draw(c) {
      const x = this.x, y = this.y, q = G.clamp(this.sq.x, -0.3, 0.3), top = y - 250;
      c.strokeStyle = G.INK; c.lineWidth = 3;
      for (const d of [-1, 1]) { c.beginPath(); c.moveTo(x + d * 44, y - 58); c.lineTo(x + d * 62, top + 118); c.stroke(); }
      this.drawBasket(c, false);
      if (this.flame > 0) {
        const f = this.flame * (0.8 + Math.random() * 0.4);
        G.path(c, '#ffb65c', (p) => { p.moveTo(x - 14, y - 70); p.quadraticCurveTo(x, y - 70 - 60 * f, x + 14, y - 70); p.closePath(); }, 3);
        G.path(c, '#fff3b0', (p) => { p.moveTo(x - 6, y - 72); p.quadraticCurveTo(x, y - 72 - 34 * f, x + 6, y - 72); p.closePath(); }, 0);
      }
      c.save(); c.translate(x, top); c.scale(1 + q * 0.3, 1 - q * 0.3);
      const env = (p) => { p.moveTo(-60, 120); p.bezierCurveTo(-160, 40, -150, -150, 0, -150); p.bezierCurveTo(150, -150, 160, 40, 60, 120); p.closePath(); };
      c.save(); c.beginPath(); env(c); c.clip();
      for (let i = 0; i < 6; i++) { c.fillStyle = STRIPES[i]; c.fillRect(-160 + i * 54, -160, 54, 300); }
      c.fillStyle = 'rgba(255,255,255,.25)'; c.beginPath(); c.ellipse(-50, -80, 26, 50, 0.3, 0, G.TAU); c.fill();
      c.restore();
      G.path(c, null, env, 6);
      G.rrect(c, -62, 112, 124, 16, 7, '#fff3c4', 4);
      c.restore();
    }
  }

  // ---------- banner plane: loops the whole world; tap for a loop-the-loop ----------
  class Airplane {
    constructor(y) { this.x = 600; this.y = y; this.by = y; this.z = 6; this.spin = 0; this.speed = 190; this.buzzT = 0; }
    hit(px, py) { return Math.abs(px - this.x) < 110 && Math.abs(py - this.y) < 60; }
    onTap() { S().toot(); G.tween(this, { spin: this.spin - G.TAU }, 1.2, G.ease.inOut); G.burst('heart', this.x - 200, this.y, 6, { colors: ['#ff6f91', '#ffb3c8'], g: -40, speed: 120, size: 12 }); }
    update(dt) {
      this.x += this.speed * dt;
      if (this.x > G.W + 700) this.x = -300;
      this.y = this.by + Math.sin(G.time * 0.8) * 30;
      if ((this.buzzT -= dt) < 0) { this.buzzT = 2; if (this.x > G.view.x0 && this.x < G.view.x1 && this.y > G.view.y0 && this.y < G.view.y1) S().buzz(); }
    }
    draw(c) {
      const t = G.time, x = this.x, y = this.y;
      c.strokeStyle = G.INK; c.lineWidth = 3; c.beginPath(); c.moveTo(x - 90, y); c.lineTo(x - 160, y); c.stroke();
      G.path(c, '#fff3c4', (p) => { p.moveTo(x - 160, y - 34); for (let i = 0; i <= 8; i++) p.lineTo(x - 160 - i * 30, y - 34 + Math.sin(t * 5 + i) * 6); p.lineTo(x - 400, y + 34 + Math.sin(t * 5 + 8) * 6); for (let i = 8; i >= 0; i--) p.lineTo(x - 160 - i * 30, y + 34 + Math.sin(t * 5 + i) * 6); p.closePath(); }, 4);
      for (let i = 0; i < 3; i++) G.path(c, '#ff6f91', (p) => G.heartPath(p, x - 205 - i * 70, y + 4 + Math.sin(t * 5 + 1.5 + i * 2.3) * 6, 15), 3);
      c.save(); c.translate(x, y); c.rotate(this.spin + Math.sin(t * 1.6) * 0.06);
      G.path(c, '#ff8a7a', (p) => { p.moveTo(-70, -6); p.lineTo(-96, -40); p.lineTo(-80, -40); p.lineTo(-50, -10); p.closePath(); }, 4);
      G.ellipse(c, 0, 0, 90, 26, '#ffd84f');
      G.circle(c, 30, -8, 15, '#bfe6fa', 4);
      G.eyes(c, 32, -10, 5, 2.4, 0, 0, 0, 'happy');
      G.rrect(c, -30, 2, 70, 16, 7, '#ff8a7a', 4);
      G.ellipse(c, 92, 0, 6, 34 * Math.abs(Math.sin(t * 40)) + 4, '#ffffff', 3);
      c.restore();
    }
  }

  // ---------- a flock of little birds: tap and they scatter, then regroup ----------
  const FLOCK_COLS = ['#ff8a7a', '#6cc3f0', '#ffd84f', '#b9a3e3', '#8fd16a'];
  class Flock {
    constructor() {
      this.x = 1200; this.y = -520; this.z = 6; this.hot = false;
      this.birds = FLOCK_COLS.map((col, i) => ({ col, fx: -Math.abs(i - 2) * 55, fy: Math.abs(i - 2) * 30 * (i < 2 ? -1 : 1), ox: 0, oy: 0, vx: 0, vy: 0, ph: i }));
    }
    pos(b) { return [this.x + b.fx + b.ox, this.y + b.fy + b.oy]; }
    hit(px, py) { return this.birds.some((b) => { const [x, y] = this.pos(b); return G.dist(px, py, x, y) < 50; }); }
    onTap() { S().chirp(); G.after(0.2, () => S().chirp()); for (const b of this.birds) { b.vx = G.rand(-500, 500); b.vy = G.rand(-500, 300); } }
    update(dt) {
      this.x += 120 * dt;
      if (this.x > G.W + 400) { this.x = -400; this.y = G.rand(-680, -360); }
      for (const b of this.birds) {
        b.vx += -b.ox * 3 * dt; b.vy += -b.oy * 3 * dt; b.vx *= 1 - 1.5 * dt; b.vy *= 1 - 1.5 * dt;
        b.ox += b.vx * dt; b.oy += b.vy * dt;
      }
    }
    draw(c) {
      for (const b of this.birds) {
        const [x, y] = this.pos(b), f = Math.sin(G.time * 12 + b.ph) * 14;
        G.path(c, null, (p) => { p.moveTo(x - 24, y - f); p.quadraticCurveTo(x - 10, y - 12, x, y); p.quadraticCurveTo(x + 10, y - 12, x + 24, y - f); }, 5);
        G.ellipse(c, x, y + 2, 12, 8, b.col, 4);
        G.circle(c, x + 10, y - 3, 2.2, G.INK, 0);
      }
    }
  }

  // ---------- space: a ringed planet (tap: it spins and changes colour) and an orbiting rocket ----------
  const PLANET_COLS = [['#ffb65c', '#ff8a7a'], ['#b9a3e3', '#8f7ad0'], ['#8fd16a', '#5fae44'], ['#6cc3f0', '#4a9fd6']];
  class Planet {
    constructor(x, y) { this.x = x; this.y = y; this.z = 2; this.ci = 0; this.tilt = new G.Spring(40, 2.5); this.sq = new G.Spring(160, 6); }
    hit(px, py) { return G.dist(px, py, this.x, this.y) < 115; }
    onTap() { this.tilt.kick(2.5); this.sq.kick(2); this.ci = (this.ci + 1) % PLANET_COLS.length; S().twinkle(); G.burst('sparkle', this.x, this.y, 16, { color: '#fff7c9', g: 0, speed: 340, size: 12 }); }
    update(dt) { this.tilt.update(dt); this.sq.update(dt); }
    draw(c) {
      const [a, b] = PLANET_COLS[this.ci], q = G.clamp(this.sq.x, -0.3, 0.3), tilt = -0.35 + this.tilt.x * 0.3;
      c.translate(this.x, this.y); c.scale(1 + q * 0.4, 1 - q * 0.4);
      const ring = (from, to) => { c.save(); c.rotate(tilt); c.strokeStyle = G.INK; c.lineWidth = 22; c.beginPath(); c.ellipse(0, 0, 160, 38, 0, from, to); c.stroke(); c.strokeStyle = '#fff3c4'; c.lineWidth = 12; c.stroke(); c.restore(); };
      ring(Math.PI, G.TAU);
      G.circle(c, 0, 0, 92, a, 6);
      c.save(); c.beginPath(); c.arc(0, 0, 89, 0, G.TAU); c.clip();
      c.fillStyle = b; for (const yy of [-50, 10, 60]) { c.beginPath(); c.ellipse(0, yy, 110, 12, 0.2, 0, G.TAU); c.fill(); }
      c.restore();
      G.eyes(c, 0, -14, 26, 8, 0, 0, 0, this.sq.x > 0.1 ? 'happy' : 'open');
      G.cheeks(c, 0, 8, 44, 11); G.smile(c, 0, 10, 16, 5);
      ring(0, Math.PI);
    }
  }
  class Rocket {
    constructor(planet) { this.p = planet; this.a = 0; this.speed = 0.45; this.boost = 0; this.z = 3; this.x = planet.x; this.y = planet.y; this.rot = 0; }
    hit(px, py) { return G.dist(px, py, this.x, this.y) < 60; }
    onTap() { this.boost = 1.8; S().launch(); }
    update(dt) {
      this.boost = Math.max(0, this.boost - dt);
      const sp = this.speed * (1 + this.boost * 3.5), r = 280 + this.boost * 120;
      this.a += sp * dt;
      const nx = this.p.x + Math.cos(this.a) * r * 1.35, ny = this.p.y + Math.sin(this.a) * r * 0.55;
      this.rot = Math.atan2(ny - this.y, nx - this.x); this.x = nx; this.y = ny;
      if (this.boost > 0 && Math.random() < 0.6) G.spawn('confetti', this.x - Math.cos(this.rot) * 50, this.y - Math.sin(this.rot) * 50, { vx: -Math.cos(this.rot) * 120, vy: -Math.sin(this.rot) * 120, life: 0.8, size: 10, color: G.pick(G.CONFETTI) });
    }
    draw(c) {
      c.translate(this.x, this.y); c.rotate(this.rot);
      const f = (this.boost > 0 ? 44 : 18) * (0.8 + Math.random() * 0.4);
      G.path(c, '#ffb65c', (p) => { p.moveTo(-40, -12); p.quadraticCurveTo(-40 - f, 0, -40, 12); p.closePath(); }, 3);
      G.path(c, '#ff8a7a', (p) => { p.moveTo(-30, -14); p.lineTo(-48, -30); p.lineTo(-44, -8); p.closePath(); p.moveTo(-30, 14); p.lineTo(-48, 30); p.lineTo(-44, 8); p.closePath(); }, 4);
      G.path(c, '#ffffff', (p) => { p.moveTo(-40, -18); p.lineTo(20, -18); p.quadraticCurveTo(56, -10, 64, 0); p.quadraticCurveTo(56, 10, 20, 18); p.lineTo(-40, 18); p.closePath(); }, 5);
      G.path(c, '#ff8a7a', (p) => { p.moveTo(36, -15); p.quadraticCurveTo(56, -10, 64, 0); p.quadraticCurveTo(56, 10, 36, 15); p.closePath(); }, 0);
      G.circle(c, 6, 0, 11, '#bfe6fa', 4);
      G.eyes(c, 7, -1, 4, 2, 0, 0, 0, this.boost > 0 ? 'happy' : 'open');
    }
  }

  Object.assign(G, { Front, HotAir, Airplane, Flock, Planet, Rocket });
})();

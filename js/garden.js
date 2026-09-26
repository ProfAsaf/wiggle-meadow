// Wiggle Meadow — apple tree, apples, songbird, xylophone flowers, butterflies, sprouts.
(() => {
  const G = window.G, S = () => G.sfx;

  // ---------- apples: fall from the tree, roll, get tossed, get eaten ----------
  class Apple {
    constructor(x, y, color = G.pick(['#ff5b5b', '#ff5b5b', '#9bd25a', '#ffc94a'])) {
      this.x = x; this.y = y; this.vx = G.rand(-60, 60); this.vy = 0; this.r = 19; this.z = 8;
      this.color = color; this.crumb = '#fff1c9'; this.rot = G.rand(-0.3, 0.3); this.floor = G.floorFor(y);
      this.isFood = true; this.draggable = true; this.onGround = false; this.claimed = null;
    }
    hit(px, py) { return G.dist(px, py, this.x, this.y) < 34; }
    onTap() { this.vy = -520; this.onGround = false; S().pop(); }
    onDragStart() { this.claimed = null; this.onGround = false; S().click(); }
    onDrag(p, rec) {
      const y = p.y + rec.oy;
      this.x = G.clamp(p.x + rec.ox, 20, G.W - 20); this.y = Math.min(y, G.floorFor(y));
      if (G.trackSnap) G.trackSnap(this); // a hungry mouth or the soup pot lights up
    }
    onDrop(p, rec) {
      this.floor = G.floorFor(this.y);
      const s = this.snap; this.snap = null;
      if (s && s.eater) return G.snapInto(this, s.x, s.y, () => { if (s.eater.state === 'sleep') s.eater.wakeUntil = G.time + 6; s.eater.eat(this); });
      if (s && s.pot) return G.snapInto(this, s.x, s.y, () => s.pot.add(this));
      const who = G.things.find((t) => t instanceof G.Critter && t.state !== 'held' && t.hit(this.x, this.y));
      if (who) { if (who.state === 'sleep') who.wakeUntil = G.time + 6; return who.eat(this); }
      this.vx = G.clamp(rec.vx * 0.8, -1500, 1500); this.vy = G.clamp(rec.vy * 0.8, -1500, 1500);
    }
    update(dt) {
      if (this.held || this.snapping) return;
      const floor = this.floor - this.r + 4;
      if (!this.onGround) {
        this.vy += 2000 * dt; this.x += this.vx * dt; this.y += this.vy * dt;
        if (this.x < 30 || this.x > G.W - 30) { this.x = G.clamp(this.x, 30, G.W - 30); this.vx *= -0.6; }
        if (this.vy > 0 && G.catchers.some((q) => q.catches(this))) return;
        if (this.y >= floor) {
          this.y = floor;
          const w = this.floor === G.GROUND && G.waters.find((q) => q.inside(this.x));
          if (w) { w.splash(this.x, 0.6); this.vx = Math.sign(w.bank(this.x) - this.x || 1) * 330; this.vy = -650; return; }
          if (this.vy > 260) { this.vy *= -0.45; S().blub(); } else { this.vy = 0; this.onGround = true; }
        }
      } else {
        this.x += this.vx * dt; this.vx *= 1 - 2.5 * dt;
        if (this.x < 30 || this.x > G.W - 30) { this.x = G.clamp(this.x, 30, G.W - 30); this.vx *= -0.6; }
      }
      this.rot += (this.vx * dt) / this.r;
    }
    draw(c) {
      c.fillStyle = 'rgba(40,60,20,.16)';
      c.beginPath(); c.ellipse(this.x, this.floor + 3, 18, 5, 0, 0, G.TAU); c.fill();
      c.translate(this.x, this.y); c.rotate(this.rot);
      G.path(c, '#7a4a2a', (p) => { p.moveTo(0, -this.r + 2); p.lineTo(3, -this.r - 9); }, 4);
      G.ellipse(c, 9, -this.r - 5, 9, 4.5, '#6cc04a', 3, -0.5);
      G.path(c, this.color, (p) => { const r = this.r; p.moveTo(0, -r * 0.75); p.bezierCurveTo(r * 1.3, -r * 1.25, r * 1.3, r * 1.05, 0, r); p.bezierCurveTo(-r * 1.3, r * 1.05, -r * 1.3, -r * 1.25, 0, -r * 0.75); });
      c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.ellipse(-7, -5, 4, 7, 0.4, 0, G.TAU); c.fill();
    }
  }

  // ---------- the apple tree: tap to shake, apples regrow ----------
  const CANOPY = [[-95, 20, 72], [95, 20, 72], [-55, -60, 80], [55, -60, 80], [0, -100, 78], [0, 10, 90]];
  class Tree {
    constructor(x) {
      this.x = x; this.y = G.GROUND - 1; this.z = 5; this.shake = new G.Spring(140, 5);
      this.cy = -360; // canopy centre, relative to the trunk base
      this.slots = [[-80, 10], [60, 40], [-20, -60], [80, -50], [-100, -30], [10, 50]].map(([dx, dy]) => ({ dx, dy, g: 1 }));
    }
    hit(px, py) {
      const dx = px - this.x, dy = py - (this.y + this.cy);
      return dx * dx + dy * dy < 175 * 175 || (Math.abs(dx) < 34 && py > this.y + this.cy && py < this.y);
    }
    onTap() {
      this.shake.kick(G.pick([-1, 1]) * 2.2); S().whoosh();
      G.burst('leaf', this.x, this.y + this.cy, 12, { colors: ['#6cc04a', '#8fd16a', '#4ea83a'], g: 160, speed: 260, size: 10, life: 1.6 });
      const ripe = this.slots.filter((s) => s.g >= 1);
      for (const s of ripe.sort(() => Math.random() - 0.5).slice(0, G.randi(1, 3))) {
        s.g = 0;
        G.add(new Apple(this.x + s.dx, this.y + this.cy + s.dy));
        G.after(G.rand(9, 16), () => G.tween(s, { g: 1 }, 1.2, G.ease.outBack));
      }
    }
    update(dt) { this.shake.update(dt); }
    draw(c) {
      const a = G.clamp(this.shake.x, -1, 1) * 0.06;
      c.fillStyle = 'rgba(40,60,20,.16)';
      c.beginPath(); c.ellipse(this.x, this.y + 5, 120, 16, 0, 0, G.TAU); c.fill();
      c.translate(this.x, this.y); c.rotate(a);
      G.path(c, '#9a6a44', (p) => { p.moveTo(-34, 0); p.quadraticCurveTo(-18, -150, -26, -300); p.lineTo(26, -300); p.quadraticCurveTo(18, -150, 34, 0); p.closePath(); }, 6);
      G.path(c, null, (p) => { p.moveTo(-6, -120); p.quadraticCurveTo(0, -140, 8, -150); p.moveTo(10, -60); p.quadraticCurveTo(12, -70, 4, -80); }, 3);
      c.rotate(a * 1.5);
      c.fillStyle = G.INK;
      for (const [x, y, r] of CANOPY) { c.beginPath(); c.arc(x, this.cy + y, r + 6, 0, G.TAU); c.fill(); }
      c.fillStyle = '#6cbf4b';
      for (const [x, y, r] of CANOPY) { c.beginPath(); c.arc(x, this.cy + y, r, 0, G.TAU); c.fill(); }
      c.fillStyle = '#86d062';
      for (const [x, y, r] of CANOPY.slice(2, 5)) { c.beginPath(); c.arc(x - r * 0.25, this.cy + y - r * 0.25, r * 0.5, 0, G.TAU); c.fill(); }
      for (const s of this.slots) if (s.g > 0.05) {
        c.save(); c.translate(s.dx, this.cy + s.dy); c.scale(s.g, s.g);
        G.path(c, '#ff5b5b', (p) => p.arc(0, 0, 17, 0, G.TAU), 4);
        c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.ellipse(-6, -5, 3.5, 6, 0.4, 0, G.TAU); c.fill();
        c.restore();
      }
    }
  }

  // ---------- songbird: tap and it flies a loop around the meadow ----------
  class Bird {
    constructor(x, y) {
      this.hx = x; this.hy = y; this.x = x; this.y = y; this.z = 11; this.dir = -1;
      this.state = 'perch'; this.beak = 0; this.hopT = 2; this.yy = 0;
    }
    hit(px, py) { return G.dist(px, py, this.x, this.y - 10) < 48; }
    onTap() {
      S().chirp(); this.beak = 0.4;
      if (this.state !== 'perch') { G.burst('heart', this.x, this.y - 20, 3, { color: '#ff7aa2', g: -60, speed: 90, size: 10 }); return; }
      this.state = 'fly';
      const pts = [[G.rand(200, 600), G.rand(120, 260)], [G.rand(900, 1400), G.rand(90, 240)], [G.rand(400, 1200), G.rand(300, 480)], [this.hx, this.hy]];
      const go = (i) => {
        if (i >= pts.length) { this.state = 'perch'; this.dir = -1; return; }
        const [tx, ty] = pts[i];
        this.dir = tx > this.x ? 1 : -1;
        G.tween(this, { x: tx, y: ty }, 1.1 + G.dist(this.x, this.y, tx, ty) / 900, G.ease.inOut, () => { if (i < 3 && Math.random() < 0.6) S().chirp(); go(i + 1); });
      };
      go(0);
    }
    update(dt) {
      this.beak = Math.max(0, this.beak - dt);
      if (this.state === 'perch') {
        if ((this.hopT -= dt) < 0) {
          this.hopT = G.rand(1.5, 4);
          if (G.night < 0.5) { this.yy = -10; G.tween(this, { yy: 0 }, 0.3, G.ease.out); if (Math.random() < 0.5) this.dir *= -1; if (Math.random() < 0.3) { this.beak = 0.3; S().chirp(); } }
        }
        if (G.night > 0.6 && Math.random() < dt * 0.5) G.spawn('zzz', this.x + 10, this.y - 30, { vy: -30, vx: 15, life: 1.8, size: 9, color: '#dfe6ff' });
      }
    }
    draw(c) {
      const t = G.time, flying = this.state === 'fly', sleepy = G.night > 0.6 && !flying;
      c.translate(this.x, this.y + this.yy); c.scale(this.dir, 1);
      if (flying) c.rotate(Math.sin(t * 8) * 0.08);
      G.path(c, '#4e98d4', (p) => { p.moveTo(-18, -10); p.lineTo(-38, -20); p.lineTo(-36, -2); p.closePath(); }, 4);
      G.ellipse(c, 0, -12, 24, 18, '#6cb8f0');
      G.ellipse(c, 4, -6, 14, 10, '#d8efff', 0);
      c.save(); c.translate(-4, -16); c.rotate(flying ? Math.sin(t * 32) * 0.9 - 0.4 : 0.2);
      G.ellipse(c, -10, 0, 16, 9, '#4e98d4', 4); c.restore();
      G.circle(c, 18, -30, 14, '#6cb8f0');
      const open = this.beak > 0 ? 5 : 0;
      G.path(c, '#ffa53c', (p) => { p.moveTo(28, -34); p.lineTo(42, -30 + open * 0.3); p.lineTo(29, -26 + open); p.closePath(); }, 3);
      G.eyes(c, 16, -34, 0.01, 3.5, 0, 0, 0, sleepy ? 'closed' : 'open');
      if (!flying) G.path(c, null, (p) => { p.moveTo(-4, 5); p.lineTo(-4, 12); p.moveTo(6, 5); p.lineTo(6, 12); }, 3);
    }
  }

  // ---------- flowers: a xylophone you can strum; rain makes them grow ----------
  const PETALS = ['#ff8a7a', '#ffb65c', '#ffe066', '#8fd16a', '#6cc3f0', '#b9a3e3', '#ff9ed2', '#ff8a7a'];
  class Flower {
    constructor(x, i) {
      this.x = x; this.y = 880; this.i = i; this.z = 9; this.h = 72 + (i % 3) * 12; this.grow = 1;
      this.sq = new G.Spring(200, 7); this.spin = 0; this.lastNote = -9; this.n = 5 + (i % 3);
    }
    get hy() { return this.y - this.h * this.grow; }
    hit(px, py) { return G.dist(px, py, this.x, this.hy) < 44 * Math.min(1.5, this.grow) || (Math.abs(px - this.x) < 16 && py > this.hy && py < this.y); }
    play() {
      if (G.time - this.lastNote < 0.18) return;
      this.lastNote = G.time; this.sq.kick(3.5);
      S().marimba(S().PENTA[this.i % S().PENTA.length]);
      G.tween(this, { spin: this.spin + Math.PI / this.n }, 0.5, G.ease.outBack);
      G.spawn('note', this.x, this.hy - 40, { vy: -120, vx: G.rand(-30, 30), life: 1, size: 14, color: PETALS[this.i] });
    }
    onTap() { this.play(); }
    onRub() { this.play(); }
    water(dt) {
      const before = this.grow;
      this.grow = Math.min(1.9, this.grow + dt * 0.3);
      if (Math.floor(before * 5) !== Math.floor(this.grow * 5)) { this.sq.kick(2); G.burst('sparkle', this.x, this.hy, 4, { color: '#fff7b0', g: 0, speed: 90, size: 8 }); }
    }
    update(dt) { this.sq.update(dt); this.grow = Math.max(1, this.grow - dt * 0.008); }
    draw(c) {
      const q = G.clamp(this.sq.x, -0.4, 0.4), sway = Math.sin(G.time * 1.6 + this.i) * 5 + q * 30;
      const top = this.hy, k = Math.min(1.45, 0.8 + this.grow * 0.35);
      c.lineCap = 'round';
      for (const [col, w] of [[G.INK, 11], ['#5fae44', 5]]) { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(this.x, this.y); c.quadraticCurveTo(this.x - sway * 0.3, (this.y + top) / 2, this.x + sway, top); c.stroke(); }
      G.ellipse(c, this.x + 12, this.y - 22, 14, 6, '#6cc04a', 3, -0.5);
      c.translate(this.x + sway, top); c.scale(k * (1 + q), k * (1 - q)); c.rotate(this.spin + sway * 0.01);
      for (let j = 0; j < this.n; j++) {
        c.save(); c.rotate((j * G.TAU) / this.n);
        G.ellipse(c, 0, -22, 13, 20, PETALS[this.i], 4); c.restore();
      }
      c.rotate(-this.spin);
      G.circle(c, 0, 0, 15, '#ffd84f', 4);
      G.eyes(c, 0, -2, 5, 2.4, 0, 0, 0, this.sq.x > 0.12 ? 'happy' : 'open');
      G.path(c, null, (p) => { p.moveTo(-4, 5); p.quadraticCurveTo(0, 9, 4, 5); }, 2.5);
    }
  }

  // ---------- butterflies: flit between flowers, scatter when tapped ----------
  class Butterfly {
    constructor(color) {
      this.x = G.rand(100, 1500); this.y = G.rand(300, 600); this.z = 10; this.color = color;
      this.tx = this.x; this.ty = this.y; this.rest = 0; this.ph = G.rand(0, 6); this.pick();
    }
    pick() {
      const f = Math.random() < 0.7 && G.flowers ? G.pick(G.flowers) : null;
      this.target = f; this.tx = f ? f.x : G.rand(100, 1500); this.ty = f ? f.hy - 20 : G.rand(250, 650);
    }
    hit(px, py) { return G.dist(px, py, this.x, this.y) < 44; }
    onTap() {
      this.rest = 0; this.target = null; this.tx = G.rand(100, 1500); this.ty = G.rand(80, 260);
      S().whoosh(); G.burst('sparkle', this.x, this.y, 7, { color: this.color, g: 0, speed: 150, size: 9 });
    }
    update(dt) {
      if (this.target) this.ty = this.target.hy - 20;
      if (this.rest > 0) { if ((this.rest -= dt) <= 0) this.pick(); return; }
      const dx = this.tx - this.x, dy = this.ty - this.y, d = Math.hypot(dx, dy);
      if (d < 8) { if (this.target) this.rest = G.rand(2, 5); else this.pick(); return; }
      const sp = Math.min(d, 170 * dt);
      this.x += (dx / d) * sp; this.y += (dy / d) * sp + Math.sin(G.time * 6 + this.ph) * 60 * dt;
      this.dir = dx > 0 ? 1 : -1;
    }
    draw(c) {
      const flap = this.rest > 0 ? 0.55 + Math.sin(G.time * 3 + this.ph) * 0.35 : Math.abs(Math.sin(G.time * 18 + this.ph));
      c.translate(this.x, this.y); c.rotate((this.dir || 1) * 0.15);
      for (const d of [-1, 1]) {
        c.save(); c.scale(d * (0.25 + flap * 0.75), 1);
        G.ellipse(c, 13, -8, 14, 12, this.color, 3.5, -0.4);
        G.ellipse(c, 10, 9, 9, 8, this.color, 3.5, 0.4);
        c.restore();
      }
      G.ellipse(c, 0, 0, 4, 13, G.INK, 0);
      G.path(c, null, (p) => { p.moveTo(-2, -11); p.quadraticCurveTo(-6, -22, -10, -24); p.moveTo(2, -11); p.quadraticCurveTo(6, -22, 10, -24); }, 2);
    }
  }

  // ---------- sprouts: tap bare grass and a little bloom pops up ----------
  class Sprout {
    constructor(x, y) {
      this.x = x; this.y = y; this.z = 6; this.g = 0; this.age = 0; this.color = G.pick(PETALS);
      this.sq = new G.Spring(200, 7); G.tween(this, { g: 1 }, 0.5, G.ease.outBack);
    }
    hit(px, py) { return G.dist(px, py, this.x, this.y - 22) < 26; }
    onTap() { this.sq.kick(3); S().boop(); }
    update(dt) {
      this.sq.update(dt);
      if ((this.age += dt) > 25 && !this.fading) { this.fading = true; G.tween(this, { g: 0 }, 0.6, G.ease.inOut, () => (this.dead = true)); }
    }
    draw(c) {
      const q = G.clamp(this.sq.x, -0.4, 0.4);
      c.translate(this.x, this.y); c.scale(this.g * (1 + q), this.g * (1 - q));
      G.path(c, null, (p) => { p.moveTo(0, 0); p.lineTo(0, -20); }, 4);
      for (let j = 0; j < 5; j++) { const a = (j * G.TAU) / 5; G.circle(c, Math.cos(a) * 8, -24 + Math.sin(a) * 8, 6, this.color, 2.5); }
      G.circle(c, 0, -24, 5, '#ffd84f', 2.5);
    }
  }

  Object.assign(G, { Apple, Tree, Bird, Flower, Butterfly, Sprout });
})();

// Wiggle Meadow — the playground: slide, swing, seesaw (launch your friends!), ice-cream cart, lamp posts.
(() => {
  const G = window.G, S = () => G.sfx;
  const qb = (a, b, c, u) => (1 - u) * (1 - u) * a + 2 * (1 - u) * u * b + u * u * c;

  // ---------- slide: drop a critter at the top (or throw one onto it) and down they go ----------
  class Slide {
    constructor(x) {
      this.x = x; this.y = G.GROUND - 1; this.top = 505; this.z = 5; this.u = 0; this.sq = new G.Spring(200, 8);
      const P = [[x + 88, this.top], [x + 185, this.top + 30], [x + 300, 722]];
      this.P = P;
      this.seat = { kind: 'slide', x: x + 40, y: this.top, rot: 0, occupant: null, onSit: () => { this.u = 0; S().wheee(1.1); }, fling: () => ({ vx: 400, vy: -600 }) };
      G.seats.push(this.seat); G.catchers.push(this);
    }
    catches(t) {
      if (!(t instanceof G.Critter) || this.seat.occupant) return false;
      if (t.x < this.x - 15 || t.x > this.x + 100 || t.y < this.top - 6 || t.y > this.top + 40) return false;
      t.sit(this.seat); return true;
    }
    hit(px, py) { return px > this.x - 15 && px < this.x + 330 && py > this.top - 30 && py < this.y && (px < this.x + 100 || py > qb(this.top, this.top + 30, 722, (px - this.x - 88) / 212) - 30); }
    onTap() { this.sq.kick(3); S().boing(1.2); G.burst('sparkle', this.x + 180, this.top + 80, 8, { colors: G.CONFETTI, g: 0, speed: 160, size: 10 }); }
    update(dt) {
      this.sq.update(dt);
      const s = this.seat, rider = s.occupant;
      if (!rider) { s.x = this.x + 40; s.y = this.top; s.rot = 0; return; }
      if (s.x < this.x + 86) { s.x += 160 * dt; s.y = this.top; return; } // scoot to the edge first
      this.u = Math.min(1, this.u + dt * (0.5 + this.u * 1.6));
      const [a, b, c] = this.P, u = this.u;
      s.x = qb(a[0], b[0], c[0], u); s.y = qb(a[1], b[1], c[1], u) - 6;
      s.rot = Math.atan2(2 * (1 - u) * (b[1] - a[1]) + 2 * u * (c[1] - b[1]), 2 * (1 - u) * (b[0] - a[0]) + 2 * u * (c[0] - b[0])) * 0.5;
      if (u >= 1) { rider.jump(-320, 560); rider.floor = G.GROUND; rider.say('happy', 'open', 1); S().giggle(rider.pitch); }
    }
    draw(c) {
      const x = this.x, top = this.top, q = G.clamp(this.sq.x, -0.2, 0.2);
      c.fillStyle = 'rgba(40,60,20,.16)'; c.beginPath(); c.ellipse(x + 160, this.y + 5, 210, 14, 0, 0, G.TAU); c.fill();
      for (const lx of [x, x + 70]) G.rrect(c, lx - 6, top - 10, 12, this.y - top + 10, 5, '#6cc3f0', 5);
      for (let y = top + 40; y < this.y - 10; y += 42) G.rrect(c, x, y, 70, 9, 4, '#ffffff', 4);
      G.rrect(c, x - 14, top - 8, 110, 18, 8, '#ffd84f', 5);
      G.path(c, null, (p) => { p.moveTo(x - 6, top - 8); p.lineTo(x - 6, top - 58); p.lineTo(x + 76, top - 58); p.lineTo(x + 76, top - 8); }, 6);
      const [a, b, d] = this.P, off = q * 20;
      G.path(c, '#ff8a7a', (p) => {
        p.moveTo(a[0], a[1] - 12); p.quadraticCurveTo(b[0], b[1] - 12 + off, d[0], d[1] - 12);
        p.lineTo(d[0] + 40, d[1] - 8); p.lineTo(d[0] + 40, d[1] + 8); p.lineTo(d[0], d[1] + 8);
        p.quadraticCurveTo(b[0], b[1] + 12 + off, a[0], a[1] + 12); p.closePath();
      }, 5);
      G.path(c, null, (p) => { p.moveTo(a[0] + 10, a[1] - 20); p.quadraticCurveTo(b[0], b[1] - 22 + off, d[0], d[1] - 20); }, 5);
      G.rrect(c, d[0] - 8, d[1] + 6, 12, this.y - d[1] - 6, 5, '#6cc3f0', 5);
    }
  }

  // ---------- swing: tap to push; a critter dropped on the seat swings along ----------
  class Swing {
    constructor(x) {
      this.x = x; this.y = G.GROUND - 1; this.px = x; this.py = 430; this.L = 235; this.th = 0; this.om = 0; this.z = 5;
      this.seat = { kind: 'swing', x, y: this.py + this.L, rot: 0, occupant: null,
        onSit: () => { if (Math.abs(this.om) < 1) this.om += 1.4; },
        fling: () => ({ vx: this.om * this.L * Math.cos(this.th), vy: -Math.abs(this.om * this.L * Math.sin(this.th)) - 650 }) };
      G.seats.push(this.seat);
    }
    hit(px, py) { return Math.abs(px - this.x) < 140 && py > this.py - 30 && py < this.y; }
    onTap() { this.om += (this.om >= 0 ? 1 : -1) * 1.1; S().creak(); }
    update(dt) {
      const rider = this.seat.occupant;
      this.om += (-(9.8 / (this.L / 100)) * Math.sin(this.th) * 0.35 - this.om * (rider ? 0.02 : 0.25)) * dt * 3;
      if (rider && Math.abs(this.th) < 0.05 && Math.abs(this.om) < 1.4) this.om *= 1.08; // pumping legs
      this.th = G.clamp(this.th + this.om * dt, -1.3, 1.3);
      const s = this.seat;
      s.x = this.px + Math.sin(this.th) * this.L; s.y = this.py + Math.cos(this.th) * this.L - 4; s.rot = -this.th * 0.9;
      if (rider && Math.abs(this.om) < 0.15 && Math.abs(this.th) > 0.5 && Math.random() < dt * 3) { rider.say('happy', 'open', 0.6); S().giggle(rider.pitch); }
    }
    draw(c) {
      const x = this.x, top = this.py - 10;
      c.fillStyle = 'rgba(40,60,20,.16)'; c.beginPath(); c.ellipse(x, this.y + 5, 170, 12, 0, 0, G.TAU); c.fill();
      for (const d of [-1, 1]) G.path(c, null, (p) => { p.moveTo(x + d * 150, this.y); p.lineTo(x + d * 120, top); p.moveTo(x + d * 95, this.y); p.lineTo(x + d * 120, top); }, 10);
      c.strokeStyle = '#ffb65c'; c.lineWidth = 5; c.lineCap = 'round';
      for (const d of [-1, 1]) { c.beginPath(); c.moveTo(x + d * 150, this.y); c.lineTo(x + d * 120, top); c.moveTo(x + d * 95, this.y); c.lineTo(x + d * 120, top); c.stroke(); }
      G.rrect(c, x - 135, top - 10, 270, 20, 9, '#ff8a7a', 5);
      const s = this.seat, ca = Math.cos(this.th), sa = Math.sin(this.th);
      c.strokeStyle = G.INK; c.lineWidth = 4;
      for (const d of [-1, 1]) { c.beginPath(); c.moveTo(this.px + d * 30, this.py); c.lineTo(s.x + d * 30 * ca, s.y + 4 - d * 30 * sa); c.stroke(); }
      c.save(); c.translate(s.x, s.y + 4); c.rotate(-this.th); G.rrect(c, -40, -4, 80, 14, 6, '#ffd84f', 4); c.restore();
    }
  }

  // ---------- seesaw: sit one critter on each end, then drop a third... or just watch the launch ----------
  class Seesaw {
    constructor(x) {
      this.x = x; this.y = G.GROUND - 1; this.phi = 0; this.w = new G.Spring(40, 6); this.z = 6; this.half = 160; this.py = G.GROUND - 58;
      this.seats = [-1, 1].map((side) => ({ kind: 'seesaw', side, x: x + side * 140, y: this.py, rot: 0, occupant: null,
        onSit: (cr) => this.landed(side, cr), fling: () => ({ vx: side * 250, vy: -900 }) }));
      G.seats.push(...this.seats); G.catchers.push(this);
    }
    catches(t) {
      if (!(t instanceof G.Critter)) return false;
      const s = this.seats.find((q) => !q.occupant && Math.abs(t.x - q.x) < 55 && t.y > q.y - 10 && t.y < q.y + 40);
      if (!s) return false;
      t.sit(s); return true;
    }
    landed(side) {
      this.phi = side * -0.05; this.w.kick(side * 1.6); S().thunk();
      const other = this.seats.find((q) => q.side === -side).occupant;
      if (other) { other.jump(-1350, -side * 160); other.spin = -side * G.TAU; other.say('wide', 'open', 1.2); other.floor = G.GROUND; S().boing(1.1); S().wheee(other.pitch); }
    }
    hit(px, py) { return Math.abs(px - this.x) < this.half + 20 && py > this.py - 60 && py < this.y; }
    onTap(p) { const side = p.x < this.x ? -1 : 1; this.w.kick(side * 1.2); S().thunk(); }
    update(dt) {
      const L = this.seats[0].occupant, R = this.seats[1].occupant;
      const target = (R ? R.size : 0) - (L ? L.size : 0);
      this.w.update(dt);
      this.phi = G.lerp(this.phi, G.clamp(target * 0.3, -0.26, 0.26) + this.w.x * 0.1, 1 - Math.exp(-6 * dt));
      for (const s of this.seats) {
        s.x = this.x + s.side * 140 * Math.cos(this.phi); s.y = this.py + s.side * 140 * Math.sin(this.phi) - 8; s.rot = this.phi;
      }
    }
    draw(c) {
      const x = this.x;
      c.fillStyle = 'rgba(40,60,20,.16)'; c.beginPath(); c.ellipse(x, this.y + 5, 180, 12, 0, 0, G.TAU); c.fill();
      G.path(c, '#b9a3e3', (p) => { p.moveTo(x - 36, this.y); p.lineTo(x, this.py + 4); p.lineTo(x + 36, this.y); p.closePath(); }, 5);
      c.save(); c.translate(x, this.py); c.rotate(this.phi);
      G.rrect(c, -this.half, -10, this.half * 2, 20, 9, '#8fd16a', 5);
      for (const d of [-1, 1]) G.path(c, null, (p) => { p.moveTo(d * 118, -10); p.lineTo(d * 118, -38); p.lineTo(d * 100, -38); }, 6);
      c.restore();
      G.circle(c, x, this.py, 9, '#ffd84f', 4);
    }
  }

  // ---------- ice-cream cart: ring the bell, get a cone (brrr!) ----------
  const SCOOPS = ['#ff9ed2', '#fff3c4', '#8fd16a', '#b9a3e3', '#ffb65c'];
  class IceCream extends G.Apple {
    constructor(x, y) { super(x, y, G.pick(SCOOPS)); this.r = 20; this.crumb = this.color; }
    onEaten(cr) {
      for (let i = 0; i < 6; i++) G.after(i * 0.09, () => cr.tilt.kick(i % 2 ? -5 : 5));
      G.burst('sparkle', cr.x, cr.y - 120 * cr.s, 8, { color: '#bfe9ff', g: 0, speed: 120, size: 9 }); S().twinkle();
    }
    draw(c) {
      c.fillStyle = 'rgba(40,60,20,.16)'; c.beginPath(); c.ellipse(this.x, this.floor + 3, 16, 5, 0, 0, G.TAU); c.fill();
      c.translate(this.x, this.y - 10); c.rotate(this.rot * 0.3);
      G.path(c, '#e8b169', (p) => { p.moveTo(-15, -2); p.lineTo(15, -2); p.lineTo(0, 24); p.closePath(); }, 4);
      G.circle(c, 0, -10, 16, this.color, 4);
      G.circle(c, 0, -28, 5, '#ff5b5b', 3);
    }
  }
  class Cart {
    constructor(x) { this.x = x; this.y = G.GROUND - 1; this.z = 5; this.sq = new G.Spring(220, 9); this.ring = 0; }
    hit(px, py) { return Math.abs(px - this.x) < 95 && py > this.y - 250 && py < this.y; }
    onTap() {
      this.sq.kick(3); S().bell(); this.ring = 0.6;
      if (G.things.filter((t) => t instanceof IceCream).length >= 4) return;
      const k = new IceCream(this.x + 40, this.y - 120); k.vx = G.rand(120, 380) * G.pick([-1, 1]); k.vy = -650;
      G.after(0.15, () => { G.add(k); S().pop(); });
    }
    update(dt) { this.sq.update(dt); this.ring = Math.max(0, this.ring - dt); }
    draw(c) {
      const q = G.clamp(this.sq.x, -0.25, 0.25);
      c.fillStyle = 'rgba(40,60,20,.16)'; c.beginPath(); c.ellipse(this.x, this.y + 5, 100, 12, 0, 0, G.TAU); c.fill();
      c.translate(this.x, this.y); c.scale(1 + q * 0.3, 1 - q * 0.3);
      G.path(c, null, (p) => { p.moveTo(0, -120); p.lineTo(0, -225); }, 6);
      G.path(c, '#ff9ed2', (p) => { p.moveTo(-95, -205); p.quadraticCurveTo(0, -300, 95, -205); p.closePath(); }, 5);
      for (const d of [-60, 0, 60]) G.circle(c, d, -205, 10, '#ffffff', 4);
      G.rrect(c, -80, -125, 160, 95, 14, '#fff3c4', 5);
      G.rrect(c, -80, -125, 160, 22, 10, '#6cc3f0', 5);
      G.circle(c, -20, -70, 16, '#ff9ed2', 4); G.circle(c, 20, -70, 16, '#8fd16a', 4); G.circle(c, 0, -88, 16, '#fff9e3', 4);
      for (const d of [-50, 50]) { G.circle(c, d, -18, 20, '#ff8a7a', 5); G.circle(c, d, -18, 6, '#ffffff', 3); }
      c.save(); c.translate(70, -140); c.rotate(Math.sin(G.time * 40) * this.ring);
      G.path(c, '#ffd84f', (p) => { p.moveTo(-12, 10); p.quadraticCurveTo(-12, -14, 0, -14); p.quadraticCurveTo(12, -14, 12, 10); p.closePath(); }, 4);
      c.restore();
    }
  }

  // ---------- lamp posts: tap to switch; they glow at night ----------
  class Lamp {
    constructor(x, y = G.GROUND - 1) { this.x = x; this.y = y; this.z = 4; this.on = true; this.sq = new G.Spring(200, 8); }
    hit(px, py) { return Math.abs(px - this.x) < 34 && py > this.y - 300 && py < this.y; }
    onTap() { this.on = !this.on; this.sq.kick(3); S().click(); }
    update(dt) { this.sq.update(dt); }
    draw(c) {
      c.translate(this.x, this.y); c.rotate(G.clamp(this.sq.x, -0.3, 0.3) * 0.15);
      G.rrect(c, -7, -270, 14, 270, 6, '#46557a', 5);
      G.rrect(c, -24, -8, 48, 12, 5, '#46557a', 4);
      G.path(c, this.on ? '#fff3b0' : '#c9c4d6', (p) => { p.moveTo(-22, -270); p.lineTo(22, -270); p.lineTo(16, -310); p.lineTo(-16, -310); p.closePath(); }, 5);
      G.path(c, '#46557a', (p) => { p.moveTo(-28, -310); p.lineTo(28, -310); p.lineTo(0, -334); p.closePath(); }, 5);
    }
    glow(c) {
      if (!this.on) return;
      const g = c.createRadialGradient(this.x, this.y - 290, 10, this.x, this.y - 290, 230);
      g.addColorStop(0, `rgba(255,225,150,${0.55 * G.night})`); g.addColorStop(1, 'rgba(255,225,150,0)');
      c.fillStyle = g; c.fillRect(this.x - 230, this.y - 520, 460, 460);
    }
  }

  Object.assign(G, { Slide, Swing, Seesaw, IceCream, Cart, Lamp });
})();

// Wiggle Meadow — underground: a cosy burrow with beds and string lights, carrots to pull,
// wiggly worms, and a mole who pops up somewhere new.
(() => {
  const G = window.G, S = () => G.sfx;

  // ---------- beds: drop a critter in and it snuggles under the blanket ----------
  class Bed {
    constructor(x, color) {
      this.x = x; this.y = G.UNDER; this.z = 5; this.color = color; this.sq = new G.Spring(200, 8);
      this.seat = { kind: 'bed', x, y: G.UNDER - 34, rot: 0, occupant: null, fling: () => ({ vx: G.rand(-150, 150), vy: -650 }) };
      G.seats.push(this.seat);
      G.add(new G.Front(this, (c) => this.drawBlanket(c), 8));
    }
    hit(px, py) { return Math.abs(px - this.x) < 115 && py > G.UNDER - 150 && py < G.UNDER + 10; }
    onTap() { this.sq.kick(3); S().boing(0.9); const o = this.seat.occupant; if (o) { o.sq.kick(2); S().snore(); } }
    update(dt) { this.sq.update(dt); }
    draw(c) {
      const x = this.x, y = this.y, q = G.clamp(this.sq.x, -0.3, 0.3) * 8;
      G.path(c, '#c98d5b', (p) => { p.moveTo(x - 110, y); p.lineTo(x - 110, y - 120); p.quadraticCurveTo(x - 110, y - 150, x - 80, y - 150); p.quadraticCurveTo(x - 70, y - 150, x - 70, y - 120); p.lineTo(x - 70, y); p.closePath(); }, 5);
      G.rrect(c, x + 88, y - 80, 26, 80, 8, '#c98d5b', 5);
      G.rrect(c, x - 95, y - 58 + q, 200, 34, 12, '#ffffff', 5);
      G.rrect(c, x - 90, y - 26, 190, 16, 6, '#a86f43', 5);
      G.ellipse(c, x - 58, y - 64 + q, 30, 16, '#fff3c4', 4);
    }
    drawBlanket(c) {
      const x = this.x, y = this.y, q = G.clamp(this.sq.x, -0.3, 0.3) * 8, full = !!this.seat.occupant;
      const x0 = full ? x - 70 : x + 10, top = full ? y - 90 : y - 62;
      G.path(c, this.color, (p) => { p.moveTo(x0, top + q); p.quadraticCurveTo((x0 + x + 100) / 2, top - 14 + q, x + 100, top + 6 + q); p.lineTo(x + 104, y - 22); p.lineTo(x0 - 6, y - 22); p.closePath(); }, 5);
      c.fillStyle = 'rgba(255,255,255,.55)';
      for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(x0 + 20 + i * ((x + 90 - x0) / 5), top + 30 + (i % 2) * 14 + q, 6, 0, G.TAU); c.fill(); }
      G.rrect(c, x0 - 8, top - 6 + q, 28, 60, 10, '#ffffff', 4);
    }
  }

  // ---------- the burrow room: rug, pictures, and string lights you can tap ----------
  const BULBS = [['#ff8a7a', '#ffd84f', '#6cc3f0', '#8fd16a'], ['#ff9ed2', '#b9a3e3', '#fff3c4', '#ff9ed2'], ['#ffd84f', '#ffd84f', '#ffb65c', '#ffd84f']];
  class Burrow {
    constructor(x0, x1) { this.x0 = x0; this.x1 = x1; this.x = (x0 + x1) / 2; this.y = G.UNDER; this.z = 1; this.pal = 0; this.flash = 0; }
    bulbs() {
      const out = [];
      for (let x = this.x0 + 60; x <= this.x1 - 60; x += 46) out.push([x, G.ceilingAt(x) + 40 + Math.sin(((x - this.x0) / (this.x1 - this.x0)) * Math.PI * 3) * 10]);
      return out;
    }
    hit(px, py) { return px > this.x0 && px < this.x1 && Math.abs(py - (G.ceilingAt(px) + 40)) < 40; }
    onTap() { this.pal = (this.pal + 1) % BULBS.length; this.flash = 1; S().twinkle(); }
    update(dt) { this.flash = Math.max(0, this.flash - dt); }
    draw(c) {
      const x = this.x, y = this.y;
      c.save(); c.globalAlpha = 0.9;
      G.ellipse(c, x, y + 10, 280, 20, '#ff9ed2', 4); G.ellipse(c, x, y + 10, 200, 13, '#fff3c4', 0); G.ellipse(c, x, y + 10, 110, 7, '#b9a3e3', 0);
      c.restore();
      G.rrect(c, this.x1 - 190, 1330, 90, 70, 8, '#fff3c4', 6); G.path(c, '#ff6f91', (p) => G.heartPath(p, this.x1 - 145, 1368, 18), 3);
      G.circle(c, this.x0 + 130, 1360, 44, '#bfe6fa', 6); G.circle(c, this.x0 + 130, 1360, 16, '#ffd84f', 3);
      G.path(c, null, (p) => { p.moveTo(this.x0 + 86, 1360); p.lineTo(this.x0 + 174, 1360); p.moveTo(this.x0 + 130, 1316); p.lineTo(this.x0 + 130, 1404); }, 4);
      const b = this.bulbs();
      c.strokeStyle = G.INK; c.lineWidth = 3; c.beginPath(); b.forEach(([bx, by], i) => (i ? c.lineTo(bx, by - 8) : c.moveTo(bx, by - 8))); c.stroke();
      b.forEach(([bx, by], i) => G.ellipse(c, bx, by, 8, 11, BULBS[this.pal][i % 4], 3));
    }
    glow(c) {
      const b = this.bulbs();
      b.forEach(([bx, by], i) => {
        const a = 0.35 + this.flash * 0.4 + Math.sin(G.time * 3 + i) * 0.1, g = c.createRadialGradient(bx, by, 2, bx, by, 40);
        g.addColorStop(0, `rgba(255,230,160,${a})`); g.addColorStop(1, 'rgba(255,230,160,0)');
        c.fillStyle = g; c.fillRect(bx - 40, by - 40, 80, 80);
      });
    }
  }

  // ---------- carrots: the tops poke out of the grass; drag one up to pull it out ----------
  class Carrot extends G.Apple {
    constructor(x) {
      super(x, 955, '#ff9d3c'); this.hx = x; this.embedded = true; this.isFood = false; this.r = 17; this.crumb = '#ffb65c';
      this.z = 9; this.floor = G.GROUND; this.g = 0; this.wig = new G.Spring(200, 7); this.dragSlop = 6;
      G.tween(this, { g: 1 }, 0.8, G.ease.outBack);
    }
    hit(px, py) { return this.embedded ? Math.abs(px - this.x) < 34 && py > 850 && py < 1010 : super.hit(px, py); }
    onTap() { if (this.embedded) { this.wig.kick(5); S().squeak(0.7); } else super.onTap(); }
    onDragStart(p, rec) {
      if (this.embedded) {
        this.embedded = false; this.isFood = true; S().pop(); S().boing(1.5);
        G.burst('dust', this.x, 905, 14, { colors: ['#9b6b4a', '#b58461', '#7a5038'], size: 8, g: 900, up: 300, speed: 220 });
        G.after(14, () => G.add(new Carrot(this.hx)));
      }
      super.onDragStart(p, rec);
    }
    update(dt) { this.wig.update(dt); if (!this.embedded) super.update(dt); }
    draw(c) {
      if (this.embedded) {
        c.translate(this.x, 905); c.scale(this.g, this.g); c.rotate(G.clamp(this.wig.x, -1, 1) * 0.15);
        this.leaves(c, 0); this.body(c, 0, 4, 0);
      } else {
        c.fillStyle = 'rgba(40,60,20,.16)'; c.beginPath(); c.ellipse(this.x, this.floor + 3, 22, 5, 0, 0, G.TAU); c.fill();
        c.translate(this.x, this.y); c.rotate(this.rot * 0.3 + 0.9);
        this.body(c, -35, 0, 0); this.leaves(c, -38);
      }
    }
    body(c, y0) { G.path(c, '#ff9d3c', (p) => { p.moveTo(-17, y0); p.quadraticCurveTo(-14, y0 + 60, 0, y0 + 88); p.quadraticCurveTo(14, y0 + 60, 17, y0); p.closePath(); }, 5);
      G.path(c, null, (p) => { p.moveTo(-10, y0 + 22); p.lineTo(0, y0 + 24); p.moveTo(2, y0 + 44); p.lineTo(10, y0 + 42); p.moveTo(-6, y0 + 62); p.lineTo(2, y0 + 63); }, 3); }
    leaves(c, y0) { for (const a of [-0.45, 0, 0.45]) { c.save(); c.translate(0, y0); c.rotate(a + Math.sin(G.time * 2 + this.hx) * 0.06); G.ellipse(c, 0, -26, 8, 26, '#6cc04a', 4); c.restore(); } }
  }

  // ---------- worms living in the soil ----------
  class Worm {
    constructor(x, y) { this.x = x; this.y = y; this.hx = x; this.z = 2; this.dir = 1; this.st = new G.Spring(90, 5); this.ph = G.rand(0, 6); this.col = G.pick(['#ff9ec0', '#ffb3a0', '#f7a3c8']); this.gT = 0; }
    hit(px, py) { return Math.abs(px - this.x) < 70 && Math.abs(py - this.y) < 30; }
    onTap() { this.st.kick(4); S().boing(1.5); S().giggle(1.5); G.spawn('heart', this.x, this.y - 30, { vy: -80, life: 1, size: 10, color: '#ff7aa2' }); }
    onRub() { if (G.time < this.gT) return; this.gT = G.time + 0.8; this.st.kick(2); S().giggle(1.6); }
    update(dt) { this.st.update(dt); this.x += this.dir * 12 * dt; if (Math.abs(this.x - this.hx) > 80) this.dir = Math.sign(this.hx - this.x); }
    draw(c) {
      const t = G.time, k = 1 + G.clamp(this.st.x, -0.4, 0.8) * 0.5;
      for (let i = 5; i >= 0; i--) {
        const sx = this.x - this.dir * i * 14 * k, sy = this.y + Math.sin(t * 5 + i * 0.9 + this.ph) * 6;
        G.circle(c, sx, sy, i === 0 ? 14 : 12, this.col, 4);
      }
      const hy = this.y + Math.sin(t * 5 + this.ph) * 6;
      G.eyes(c, this.x + this.dir * 3, hy - 3, 5, 2.5, this.dir * 0.4, 0, 0, this.st.x > 0.2 ? 'happy' : 'open');
      G.smile(c, this.x + this.dir * 4, hy + 5, 4, 2.5);
    }
  }

  // ---------- the mole: tap and it digs down, then pops up somewhere else ----------
  class Mole {
    constructor(x0, x1) { this.x0 = x0; this.x1 = x1; this.x = (x0 + x1) / 2; this.y = G.UNDER; this.z = 6; this.up = 1; this.busy = false; this.autoT = 7; }
    hit(px, py) { return Math.abs(px - this.x) < 60 && py > this.y - 110 * this.up - 10 && py < this.y + 10; }
    onTap() { this.dig(true); }
    dig(loud) {
      if (this.busy) return;
      this.busy = true; S().dig(); if (loud) S().squeak(0.9);
      G.burst('dust', this.x, this.y - 10, 16, { colors: ['#9b6b4a', '#7a5038', '#c99b73'], size: 9, g: 900, up: 300, speed: 220 });
      G.tween(this, { up: 0 }, 0.3, G.ease.inOut, () => {
        this.x = G.rand(this.x0 + 80, this.x1 - 80);
        G.after(0.7, () => { S().pop(); G.burst('dust', this.x, this.y - 10, 10, { colors: ['#9b6b4a', '#c99b73'], size: 8, g: 900, up: 250, speed: 180 }); G.tween(this, { up: 1 }, 0.45, G.ease.outBack, () => (this.busy = false)); });
      });
    }
    update(dt) { if ((this.autoT -= dt) < 0) { this.autoT = G.rand(6, 11); this.dig(false); } }
    draw(c) {
      const x = this.x, y = this.y, u = this.up;
      c.save(); c.beginPath(); c.rect(x - 90, y - 220, 180, 214); c.clip();
      c.translate(x, y + (1 - u) * 110);
      G.ellipse(c, 0, -52, 46, 56, '#7d6b8f');
      G.ellipse(c, 0, -40, 28, 30, '#b8a9c9', 0);
      for (const d of [-1, 1]) G.ellipse(c, d * 40, -40, 14, 10, '#ffb3c8', 4, d * 0.5);
      G.eyes(c, 0, -80, 14, 3.5, 0, 0, 0, this.busy ? 'closed' : 'happy');
      G.ellipse(c, 0, -66, 11, 8, '#ff7fa3', 4);
      G.cheeks(c, 0, -62, 26, 7);
      c.restore();
      G.ellipse(c, x, y - 2, 70, 16, '#9b6b4a', 5);
    }
  }

  Object.assign(G, { Bed, Burrow, Carrot, Worm, Mole });
})();

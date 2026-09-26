// Wiggle Meadow — deeper underground: singing crystals, a treasure chest, a dinosaur fossil,
// glowing mushrooms, and lanterns that light the tunnel.
(() => {
  const G = window.G, S = () => G.sfx;
  const halo = (c, x, y, r, rgb, a) => {
    if (a <= 0.01) return;
    const g = c.createRadialGradient(x, y, 2, x, y, r);
    g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`);
    c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
  };

  // ---------- crystals: strum them like the flowers ----------
  const GEMS = [['#b9a3e3', '185,163,227'], ['#6cc3f0', '108,195,240'], ['#ff9ed2', '255,158,210'], ['#8fe0c0', '143,224,192']];
  class Crystal {
    constructor(x, y, i) { this.x = x; this.y = y; this.i = i; this.z = 2; this.col = GEMS[i % GEMS.length]; this.sq = new G.Spring(220, 8); this.shine = 0; this.last = -9; this.flip = i % 2 ? 1 : -1; }
    hit(px, py) { return G.dist(px, py, this.x, this.y - 25) < 46; }
    play() {
      if (G.time - this.last < 0.18) return;
      this.last = G.time; this.sq.kick(3); this.shine = 1; S().crystal(this.i + 3);
      G.burst('sparkle', this.x, this.y - 30, 6, { color: '#ffffff', g: 0, speed: 140, size: 9 });
    }
    onTap() { this.play(); }
    onRub() { this.play(); }
    update(dt) { this.sq.update(dt); this.shine = Math.max(0, this.shine - dt * 1.2); }
    draw(c) {
      halo(c, this.x, this.y - 25, 80, this.col[1], 0.18 + this.shine * 0.4);
      const q = G.clamp(this.sq.x, -0.4, 0.4);
      c.translate(this.x, this.y); c.scale(this.flip * (1 + q * 0.4), 1 - q * 0.4);
      const prism = (x, h, w, a) => { c.save(); c.translate(x, 0); c.rotate(a);
        G.path(c, this.col[0], (p) => { p.moveTo(-w, 0); p.lineTo(-w, -h); p.lineTo(0, -h - w * 1.4); p.lineTo(w, -h); p.lineTo(w, 0); p.closePath(); }, 4);
        c.fillStyle = 'rgba(255,255,255,.45)'; c.beginPath(); c.moveTo(-w * 0.5, -4); c.lineTo(-w * 0.5, -h); c.lineTo(0, -h - w * 1.1); c.lineTo(0, -4); c.closePath(); c.fill(); c.restore(); };
      prism(-20, 30, 11, -0.35); prism(20, 26, 10, 0.4); prism(0, 50, 14, 0);
    }
  }

  // ---------- treasure chest ----------
  class Chest {
    constructor(x) { this.x = x; this.y = G.UNDER; this.z = 5; this.lid = 0; this.busy = false; this.sq = new G.Spring(220, 9); }
    hit(px, py) { return Math.abs(px - this.x) < 80 && py > this.y - 130 && py < this.y + 5; }
    onTap() {
      this.sq.kick(3);
      if (this.busy) { S().jingle(); return; }
      this.busy = true; S().creak();
      G.tween(this, { lid: 1 }, 0.45, G.ease.outBack, () => {
        S().jingle(); S().tada();
        G.burst('coin', this.x, this.y - 80, 22, { color: '#ffd84f', angle: -Math.PI / 2, spread: 0.8, speed: 520, g: 1300, size: 11, life: 1.4 });
        G.burst('sparkle', this.x, this.y - 90, 14, { colors: ['#ff9ed2', '#6cc3f0', '#8fe0c0', '#ffffff'], angle: -Math.PI / 2, spread: 1, speed: 380, g: 500, size: 12 });
        G.after(2.5, () => G.tween(this, { lid: 0 }, 0.4, G.ease.inOut, () => { S().thunk(); this.busy = false; }));
      });
    }
    update(dt) { this.sq.update(dt); }
    draw(c) {
      const q = G.clamp(this.sq.x, -0.3, 0.3), x = this.x, y = this.y;
      c.translate(x, y); c.scale(1 + q * 0.3, 1 - q * 0.3);
      if (this.lid > 0.2) halo(c, 0, -70, 110, '255,216,79', 0.5 * this.lid);
      G.rrect(c, -70, -70, 140, 70, 8, '#c98d5b', 5);
      G.rrect(c, -70, -48, 140, 12, 4, '#ffd84f', 4);
      c.save(); c.translate(-70, -70); c.rotate(-this.lid * 1.9);
      G.path(c, '#b07a4a', (p) => { p.moveTo(0, 0); p.lineTo(0, -26); p.quadraticCurveTo(70, -56, 140, -26); p.lineTo(140, 0); p.closePath(); }, 5);
      G.path(c, '#ffd84f', (p) => { p.moveTo(60, -38); p.lineTo(60, 0); p.lineTo(80, 0); p.lineTo(80, -38); }, 4);
      c.restore();
      G.rrect(c, -12, -60, 24, 26, 6, '#ffd84f', 4); G.circle(c, 0, -48, 4, G.INK, 0);
    }
  }

  // ---------- dinosaur fossil in the rock: tap and it wiggles and roars ----------
  class Fossil {
    constructor(x, y) { this.x = x; this.y = y; this.z = 2; this.w = new G.Spring(90, 4); this.jaw = 0; }
    hit(px, py) { return Math.abs(px - this.x) < 190 && Math.abs(py - this.y) < 80; }
    onTap() { this.w.kick(4); S().roar(); this.jaw = 1; G.tween(this, { jaw: 0 }, 0.9, G.ease.out); G.burst('dust', this.x + 120, this.y - 20, 8, { color: '#d8c7a8', size: 7, g: 300, speed: 140 }); }
    update(dt) { this.w.update(dt); }
    draw(c) {
      const BONE = '#f6efe0', wob = (i) => Math.sin(G.time * 10 + i) * this.w.x * 4;
      c.translate(this.x, this.y);
      for (let i = 0; i < 7; i++) G.circle(c, -150 + i * 22, 10 - i * 4 + wob(i), 9 - i * 0.3, BONE, 4);
      for (let i = 0; i < 5; i++) G.path(c, null, (p) => { const x = -10 + i * 24; p.moveTo(x, -18 + wob(i + 7)); p.quadraticCurveTo(x + 14, 10, x + 2, 34); }, 7);
      c.strokeStyle = BONE; c.lineWidth = 3;
      for (let i = 0; i < 5; i++) { const x = -10 + i * 24; c.beginPath(); c.moveTo(x, -18 + wob(i + 7)); c.quadraticCurveTo(x + 14, 10, x + 2, 34); c.stroke(); }
      G.rrect(c, -20, -26, 140, 16, 8, BONE, 4);
      for (const lx of [0, 90]) { G.rrect(c, lx - 6, -12, 12, 58, 6, BONE, 4); G.ellipse(c, lx + 6, 48, 14, 7, BONE, 4); }
      c.save(); c.translate(150, -30 + wob(12)); c.rotate(-0.2 - this.w.x * 0.1);
      G.path(c, BONE, (p) => { p.moveTo(-26, -8); p.quadraticCurveTo(0, -38, 44, -18); p.lineTo(48, 0); p.lineTo(-20, 8); p.closePath(); }, 4);
      c.save(); c.translate(-10, 6); c.rotate(this.jaw * 0.5);
      G.path(c, BONE, (p) => { p.moveTo(0, 0); p.lineTo(56, -4); p.lineTo(50, 10); p.lineTo(4, 14); p.closePath(); }, 4); c.restore();
      G.circle(c, 4, -14, 7, '#5b3a2b', 3);
      c.restore();
    }
  }

  // ---------- glowing mushrooms ----------
  const CAPS = [['#ff8a7a', '255,138,122'], ['#b9a3e3', '185,163,227'], ['#8fe0c0', '143,224,192'], ['#ffd84f', '255,216,79']];
  class Mushroom {
    constructor(x) { this.x = x; this.y = G.UNDER; this.z = 6; this.ci = G.randi(0, 3); this.sq = new G.Spring(220, 7); this.pulse = 0; }
    hit(px, py) { return Math.abs(px - this.x) < 60 && py > this.y - 110 && py < this.y + 5; }
    onTap() { this.sq.kick(4); this.ci = (this.ci + 1) % CAPS.length; this.pulse = 1; S().boop(); S().boing(1.6); G.burst('sparkle', this.x, this.y - 80, 6, { color: CAPS[this.ci][0], g: -60, speed: 120, size: 9 }); }
    update(dt) { this.sq.update(dt); this.pulse = Math.max(0, this.pulse - dt); }
    draw(c) {
      const [col, rgb] = CAPS[this.ci], q = G.clamp(this.sq.x, -0.4, 0.4);
      halo(c, this.x, this.y - 60, 100, rgb, 0.22 + this.pulse * 0.4 + Math.sin(G.time * 2 + this.x) * 0.05);
      c.translate(this.x, this.y); c.scale(1 + q * 0.6, 1 - q * 0.6);
      for (const [dx, s] of [[-30, 0.6], [28, 0.75], [0, 1]]) {
        c.save(); c.translate(dx, 0); c.scale(s, s);
        G.rrect(c, -11, -60, 22, 60, 9, '#fff3e0', 4);
        G.path(c, col, (p) => { p.moveTo(-42, -52); p.quadraticCurveTo(-40, -100, 0, -102); p.quadraticCurveTo(40, -100, 42, -52); p.closePath(); }, 4);
        c.fillStyle = 'rgba(255,255,255,.7)'; for (const [sx, sy] of [[-18, -74], [10, -86], [22, -64]]) { c.beginPath(); c.arc(sx, sy, 5, 0, G.TAU); c.fill(); }
        if (dx === 0) { G.eyes(c, 0, -30, 6, 2.6, 0, 0, 0, this.pulse > 0.3 ? 'happy' : 'open'); G.smile(c, 0, -22, 4, 2.5); }
        c.restore();
      }
    }
  }

  // ---------- lanterns hanging from the tunnel roof: tap to swing and switch ----------
  class Lantern {
    constructor(x) { this.x = x; this.top = G.ceilingAt(x) + 4; this.y = this.top + 90; this.z = 3; this.on = true; this.sw = new G.Spring(20, 1.2); }
    hit(px, py) { return Math.abs(px - this.x) < 40 && py > this.top && py < this.y + 40; }
    onTap() { this.sw.kick(2.2); this.on = !this.on; S().click(); }
    update(dt) { this.sw.update(dt); }
    draw(c) {
      const a = G.clamp(this.sw.x, -1, 1) * 0.5, lx = this.x + Math.sin(a) * 90, ly = this.top + Math.cos(a) * 90;
      if (this.on) halo(c, lx, ly, 150, '255,210,120', 0.35 + Math.sin(G.time * 5 + this.x) * 0.03);
      G.path(c, null, (p) => { p.moveTo(this.x, this.top); p.lineTo(lx, ly - 22); }, 4);
      c.translate(lx, ly); c.rotate(-a);
      G.rrect(c, -18, -22, 36, 44, 8, this.on ? '#ffe69a' : '#b8a98f', 5);
      G.rrect(c, -22, -28, 44, 10, 4, '#46557a', 4); G.rrect(c, -16, 20, 32, 8, 4, '#46557a', 4);
    }
  }

  Object.assign(G, { Crystal, Chest, Fossil, Mushroom, Lantern });
})();

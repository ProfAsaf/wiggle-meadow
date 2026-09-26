// Wiggle Meadow — the beach: waves, dolphins, a sailboat, a whale, a crab, a sandcastle, singing shells, an umbrella.
(() => {
  const G = window.G, S = () => G.sfx;

  // ---------- the sea: waves wash in and out; tap for splashes (near) or dolphins (far) ----------
  class Sea {
    constructor() { this.x = 4600; this.y = 760; this.x0 = 4400; this.z = 4; this.jumps = []; this.rings = []; this.waveT = 3; G.waters.push(this); }
    get shore() { return 4400 + Math.sin(G.time * 0.9) * 30; }
    inside(x) { return x > this.shore + 30; }
    bank() { return this.x0 - 140; }
    hit(px, py) { return (px > this.shore && py > 690 && py < 915) || (px > 3400 && py > 606 && py < 700); }
    splash(x, k = 1) {
      S().splash();
      G.burst('drop', x, 770, Math.round(16 * k), { color: '#8fd8f7', angle: -Math.PI / 2, spread: 0.9, speed: 460 * k, g: 1200, size: 8 });
      this.rings.push({ x, y: 790, r: 10, a: 1 });
    }
    onTap(p) {
      if (p.y < 700) {
        this.jumps.push({ x0: p.x, dir: G.pick([-1, 1]), t: 0 });
        S().squeak(1.9); G.after(0.15, () => S().squeak(2.1));
      } else { this.splash(p.x, 0.8); S().wave(); }
    }
    update(dt) {
      for (const r of this.rings) { r.r += 70 * dt; r.a -= dt * 0.8; }
      this.rings = this.rings.filter((r) => r.a > 0);
      for (const j of this.jumps) { j.t += dt; if (j.t > 1.25 && !j.done) { j.done = true; G.burst('drop', j.x0 + j.dir * 160, 690, 10, { color: '#bfe9ff', angle: -Math.PI / 2, spread: 0.7, speed: 260, g: 900, size: 6 }); } }
      this.jumps = this.jumps.filter((j) => j.t < 1.3);
      if ((this.waveT -= dt) < 0) { this.waveT = G.rand(4, 7); if (G.view.x1 > 3900 && G.view.y0 < 900) S().wave(); }
    }
    draw(c) {
      const sh = this.shore, t = G.time;
      for (const j of this.jumps) { // dolphins leap out on the horizon
        const k = j.t / 1.25, x = j.x0 + j.dir * 160 * k, y = 690 - Math.sin(Math.min(1, k) * Math.PI) * 120;
        c.save(); c.translate(x, y); c.scale(j.dir, 1); c.rotate((k - 0.5) * 2.4);
        G.path(c, '#8fb3d9', (p) => { p.moveTo(-40, 0); p.quadraticCurveTo(-10, -26, 36, -6); p.lineTo(52, -2); p.lineTo(36, 4); p.quadraticCurveTo(0, 18, -40, 0); p.closePath(); }, 4);
        G.path(c, '#8fb3d9', (p) => { p.moveTo(-40, 0); p.lineTo(-56, -14); p.lineTo(-54, 12); p.closePath(); }, 4);
        G.path(c, '#8fb3d9', (p) => { p.moveTo(-6, -14); p.lineTo(-12, -30); p.lineTo(8, -16); }, 4);
        G.eyes(c, 26, -6, 0.01, 3, 0, 0, 0, 'happy'); c.restore();
      }
      c.fillStyle = 'rgba(190,150,95,.35)';
      c.beginPath(); c.moveTo(sh - 90, 700); c.lineTo(G.W + 20, 700); c.lineTo(G.W + 20, 912); c.lineTo(sh - 40, 912); c.closePath(); c.fill();
      const g = c.createLinearGradient(0, 700, 0, 912);
      g.addColorStop(0, G.mix('#63c3ee', '#2c4f88', G.night)); g.addColorStop(1, G.mix('#3aa0dc', '#233f75', G.night));
      c.fillStyle = g; c.beginPath(); c.moveTo(sh, 700);
      for (let y = 700; y <= 912; y += 12) c.lineTo(sh + (y - 700) * 0.22 + Math.sin(y * 0.08 + t * 3) * 6, y);
      c.lineTo(G.W + 20, 912); c.lineTo(G.W + 20, 700); c.closePath(); c.fill();
      c.strokeStyle = '#ffffff'; c.lineWidth = 7; c.lineCap = 'round';
      c.beginPath(); for (let y = 700; y <= 912; y += 12) c.lineTo(sh + (y - 700) * 0.22 + Math.sin(y * 0.08 + t * 3) * 6, y); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 4;
      for (let i = 0; i < 4; i++) {
        const off = ((t * 40 + i * 90) % 360), x = G.W - off - 20;
        if (x < sh + 30) continue;
        c.beginPath(); c.moveTo(x, 730 + i * 45); c.quadraticCurveTo(x - 30, 715 + i * 45, x - 60, 730 + i * 45); c.stroke();
      }
      c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 3;
      for (const r of this.rings) { c.globalAlpha = r.a; c.beginPath(); c.ellipse(r.x, r.y, r.r, r.r * 0.3, 0, 0, G.TAU); c.stroke(); }
      c.globalAlpha = 1;
    }
  }

  // ---------- sailboat: tap and it toots off somewhere new ----------
  class Boat {
    constructor(x) { this.x = x; this.y = 650; this.z = 3; this.dir = 1; this.sq = new G.Spring(180, 7); this.busy = false; }
    hit(px, py) { return Math.abs(px - this.x) < 90 && py > this.y - 160 && py < this.y + 30; }
    onTap() {
      this.sq.kick(3); S().toot();
      if (this.busy) return;
      this.busy = true;
      let tx = G.rand(3650, 4700); if (Math.abs(tx - this.x) < 300) tx = this.x > 4150 ? tx - 450 : tx + 450;
      this.dir = tx > this.x ? 1 : -1;
      G.tween(this, { x: G.clamp(tx, 3650, 4720) }, 3.5, G.ease.inOut, () => (this.busy = false));
    }
    update(dt) { this.sq.update(dt); }
    draw(c) {
      const t = G.time, bob = Math.sin(t * 1.6) * 4;
      c.translate(this.x, this.y + bob); c.rotate(Math.sin(t * 1.2) * 0.05 + G.clamp(this.sq.x, -0.4, 0.4) * 0.2); c.scale(this.dir, 1);
      G.path(c, null, (p) => { p.moveTo(0, -8); p.lineTo(0, -150); }, 6);
      G.path(c, '#ffffff', (p) => { p.moveTo(6, -145); p.quadraticCurveTo(60, -80, 70, -18); p.lineTo(6, -18); p.closePath(); }, 5);
      G.path(c, '#ff8a7a', (p) => { p.moveTo(8, -100); p.quadraticCurveTo(40, -72, 52, -52); p.lineTo(8, -52); p.closePath(); }, 0);
      G.path(c, '#fff3c4', (p) => { p.moveTo(-6, -130); p.quadraticCurveTo(-40, -80, -52, -24); p.lineTo(-6, -24); p.closePath(); }, 5);
      c.save(); c.translate(0, -150); c.rotate(Math.sin(t * 6) * 0.2); G.path(c, '#6cc3f0', (p) => { p.moveTo(0, 0); p.lineTo(26, 6); p.lineTo(0, 14); p.closePath(); }, 3); c.restore();
      G.path(c, '#ff8a7a', (p) => { p.moveTo(-80, -14); p.lineTo(84, -14); p.quadraticCurveTo(70, 18, 40, 20); p.lineTo(-44, 20); p.quadraticCurveTo(-70, 18, -80, -14); p.closePath(); }, 5);
      for (const d of [-30, 0, 30]) G.circle(c, d, 2, 5, '#ffffff', 3);
    }
  }

  // ---------- whale: tap for a big spout ----------
  class Whale {
    constructor(x) { this.x = x; this.y = 694; this.z = 3; this.lift = 0; this.autoT = 6; }
    hit(px, py) { return Math.abs(px - this.x) < 120 && py > this.y - 90 && py < this.y + 10; }
    onTap() { this.blow(1); }
    blow(k) {
      S().spout(); if (k > 0.8) S().whale();
      G.tween(this, { lift: 1 }, 0.4, G.ease.outBack, () => G.after(1.5, () => G.tween(this, { lift: 0 }, 0.8)));
      for (let i = 0; i < 10; i++) G.after(i * 0.07, () => G.burst('drop', this.x - 30, this.y - 55 - this.lift * 15, 4, { color: '#d4f1ff', angle: -Math.PI / 2, spread: 0.3, speed: 520 * k, g: 900, size: 7 }));
    }
    update(dt) { if ((this.autoT -= dt) < 0) { this.autoT = G.rand(9, 16); if (G.view.x1 > this.x - 200 && G.view.x0 < this.x + 200) this.blow(0.6); } }
    draw(c) {
      const t = G.time, y = this.y - this.lift * 16;
      c.save(); c.beginPath(); c.rect(this.x - 200, y - 200, 400, this.y - y + 204); c.clip();
      G.ellipse(c, this.x, y + 30, 120, 60, '#6f8fc9');
      G.ellipse(c, this.x + 10, y + 50, 90, 30, '#c9d8f2', 0);
      G.eyes(c, this.x - 70, y + 6, 0.01, 5, 0, 0, 0, this.lift > 0.5 ? 'happy' : 'open');
      G.cheeks(c, this.x - 58, y + 22, 0.01, 9);
      G.smile(c, this.x - 86, y + 24, 12, 4);
      c.restore();
      c.save(); c.translate(this.x + 150, this.y - 10); c.rotate(Math.sin(t * 1.4) * 0.25);
      G.path(c, '#6f8fc9', (p) => { p.moveTo(0, 0); p.quadraticCurveTo(-10, -40, -36, -50); p.quadraticCurveTo(0, -46, 4, -30); p.quadraticCurveTo(8, -46, 44, -50); p.quadraticCurveTo(14, -40, 10, 0); p.closePath(); }, 5);
      c.restore();
      c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 4; c.beginPath(); c.moveTo(this.x - 130, this.y + 3); c.lineTo(this.x + 175, this.y + 3); c.stroke();
    }
  }

  // ---------- crab: scuttles sideways, claps when tapped, can be carried ----------
  class Crab {
    constructor(x) { this.x = x; this.y = G.GROUND; this.floor = G.GROUND; this.homeX = x; this.z = 7; this.vx = 0; this.vy = 0; this.dir = 1; this.state = 'walk'; this.stateT = 2; this.clap = 0; this.draggable = true; this.sq = new G.Spring(220, 10); }
    hit(px, py) { return G.dist(px, py, this.x, this.y - 28) < 52; }
    onTap() { this.clap = 1.2; this.sq.kick(2); for (let i = 0; i < 4; i++) G.after(i * 0.16, () => S().click()); if (this.state !== 'air') { this.state = 'air'; this.vy = -520; } }
    onDragStart() { this.state = 'held'; S().squeak(1.9); }
    onDrop(p, rec) { this.floor = G.floorFor(this.y); this.homeX = this.x; this.state = 'air'; this.vx = G.clamp(rec.vx * 0.7, -1200, 1200); this.vy = G.clamp(rec.vy * 0.7, -1400, 1400); }
    update(dt) {
      this.sq.update(dt); this.clap = Math.max(0, this.clap - dt);
      if (this.state === 'held') return;
      if (this.state === 'air') {
        this.vy += 2200 * dt; this.x = G.clamp(this.x + this.vx * dt, 40, G.W - 40); this.y += this.vy * dt;
        if (this.y >= this.floor) {
          const w = this.floor === G.GROUND && G.waters.find((q) => q.inside(this.x));
          if (w) { w.splash(this.x, 0.6); this.vx = Math.sign(w.bank(this.x) - this.x || 1) * 400; this.vy = -800; this.y = this.floor - 1; return; }
          this.y = this.floor; this.sq.kick(Math.min(3, this.vy * 0.003)); this.vx = 0; this.vy = 0; this.state = 'walk'; this.stateT = 1;
        }
        return;
      }
      if ((this.stateT -= dt) < 0) { this.stateT = G.rand(1.5, 3.5); this.dir = Math.random() < 0.5 ? -1 : 1; this.pause = Math.random() < 0.35; if (Math.random() < 0.3) this.clap = 0.6; }
      if (!this.pause) {
        this.x += this.dir * 70 * dt;
        if (Math.abs(this.x - this.homeX) > 260) this.dir = Math.sign(this.homeX - this.x);
        const w = this.floor === G.GROUND && G.waters.find((q) => q.inside(this.x + this.dir * 30));
        if (w) this.dir = -this.dir;
      }
    }
    draw(c) {
      const t = G.time, walking = this.state === 'walk' && !this.pause, q = G.clamp(this.sq.x, -0.4, 0.4);
      c.fillStyle = 'rgba(60,40,20,.16)'; c.beginPath(); c.ellipse(this.x, this.floor + 3, 40, 8, 0, 0, G.TAU); c.fill();
      c.translate(this.x, this.y); c.scale(1 + q * 0.5, 1 - q * 0.5);
      c.strokeStyle = G.INK; c.lineWidth = 5; c.lineCap = 'round';
      for (const d of [-1, 1]) for (let i = 0; i < 3; i++) {
        const k = walking || this.state === 'held' ? Math.sin(t * 16 + i * 2 + d) * 6 : 0;
        c.beginPath(); c.moveTo(d * (14 + i * 8), -16); c.lineTo(d * (30 + i * 9), -4 + k); c.lineTo(d * (32 + i * 9), 0); c.stroke();
      }
      for (const d of [-1, 1]) G.path(c, null, (p) => { p.moveTo(d * 10, -38); p.lineTo(d * 14, -58); }, 5);
      G.ellipse(c, 0, -26, 38, 22, '#ff7a59');
      for (const d of [-1, 1]) { G.circle(c, d * 14, -62, 8, '#ffffff', 4); G.circle(c, d * 14 + 1, -62, 3.5, G.INK, 0); }
      G.cheeks(c, 0, -22, 20, 6); G.smile(c, 0, -26, 7, 3);
      for (const d of [-1, 1]) {
        const open = this.clap > 0 ? Math.abs(Math.sin(t * 20)) * 0.7 : 0.15;
        c.save(); c.translate(d * 46, -44); c.rotate(d * 0.5);
        G.path(c, '#ff7a59', (p) => { p.arc(0, 0, 14, -open, Math.PI + open, true); p.lineTo(0, 0); p.closePath(); }, 4);
        c.restore();
      }
    }
  }

  // ---------- sandcastle: tap to build it taller, flag on top, then... whoops ----------
  class Castle {
    constructor(x) { this.x = x; this.y = 815; this.z = 8; this.lv = [1, 0, 0]; this.level = 1; this.flag = 0; this.sq = new G.Spring(200, 8); }
    hit(px, py) { return Math.abs(px - this.x) < 110 && py > this.y - 260 && py < this.y + 5; }
    onTap() {
      this.sq.kick(2.5);
      if (this.level < 3) { G.tween(this.lv, { [this.level]: 1 }, 0.5, G.ease.outBack); this.level++; S().pop(); this.sand(8); }
      else if (this.flag < 0.5) { G.tween(this, { flag: 1 }, 0.5, G.ease.outBack); S().tada(); }
      else {
        this.sand(30); S().thud(); this.flag = 0; this.level = 1; this.lv[1] = this.lv[2] = 0; this.sq.kick(5);
        G.after(0.3, () => S().giggle(1.2));
      }
    }
    sand(n) { G.burst('dust', this.x, this.y - 60, n, { colors: ['#e9c77f', '#f3dca2', '#d8b36a'], size: 9, g: 700, up: 260, speed: 260 }); }
    update(dt) { this.sq.update(dt); }
    draw(c) {
      const q = G.clamp(this.sq.x, -0.3, 0.3), SAND = '#ecc97f';
      c.translate(this.x, this.y); c.scale(1 + q * 0.4, 1 - q * 0.4);
      const tower = (x, w, h, k) => {
        if (k < 0.02) return;
        c.save(); c.translate(x, 0); c.scale(1, k);
        G.rrect(c, -w / 2, -h, w, h, 6, SAND, 5);
        for (let i = 0; i < 3; i++) G.rrect(c, -w / 2 + i * (w / 3) + 2, -h - 14, w / 3 - 4, 16, 3, SAND, 4);
        G.path(c, '#8a6a3a', (p) => { p.moveTo(-7, -h * 0.35); p.lineTo(-7, -h * 0.55); p.arc(0, -h * 0.55, 7, Math.PI, 0); p.lineTo(7, -h * 0.35); p.closePath(); }, 3);
        c.restore();
      };
      tower(-60, 50, 110, this.lv[1]); tower(60, 50, 110, this.lv[1]);
      tower(0, 70, 150, this.lv[2]);
      G.rrect(c, -95, -70, 190, 70, 8, SAND, 5);
      for (let i = 0; i < 5; i++) G.rrect(c, -95 + i * 38 + 3, -84, 32, 18, 3, SAND, 4);
      G.path(c, '#8a6a3a', (p) => { p.moveTo(-16, 0); p.lineTo(-16, -30); p.arc(0, -30, 16, Math.PI, 0); p.lineTo(16, 0); p.closePath(); }, 4);
      for (const [x, y, col] of [[-60, -30, '#ff9ed2'], [58, -40, '#fff3c4']]) G.circle(c, x, y, 7, col, 3);
      if (this.flag > 0.02) {
        const top = this.lv[2] > 0.5 ? -164 : -84;
        c.save(); c.translate(0, top); c.scale(this.flag, this.flag);
        G.path(c, null, (p) => { p.moveTo(0, 0); p.lineTo(0, -60); }, 4);
        G.path(c, '#ff5b5b', (p) => { p.moveTo(0, -60); p.quadraticCurveTo(20, -58 + Math.sin(G.time * 6) * 5, 36, -50); p.lineTo(0, -40); p.closePath(); }, 3);
        c.restore();
      }
    }
  }

  // ---------- shells: a seaside xylophone ----------
  const SHELL_COLS = ['#ffc6d6', '#ffd8a8', '#e6d9ff', '#fff3c4', '#c9f0ff'];
  class Shell {
    constructor(x, i) { this.x = x; this.y = 880; this.i = i; this.z = 9; this.sq = new G.Spring(220, 8); this.last = -9; }
    hit(px, py) { return G.dist(px, py, this.x, this.y - 16) < 40; }
    play() {
      if (G.time - this.last < 0.18) return;
      this.last = G.time; this.sq.kick(3.5); S().crystal(this.i + 1);
      G.spawn('note', this.x, this.y - 50, { vy: -110, vx: G.rand(-30, 30), life: 1, size: 13, color: SHELL_COLS[this.i] });
    }
    onTap() { this.play(); }
    onRub() { this.play(); }
    update(dt) { this.sq.update(dt); }
    draw(c) {
      const q = G.clamp(this.sq.x, -0.4, 0.4);
      c.translate(this.x, this.y); c.scale(1 + q * 0.5, 1 - q * 0.5); c.rotate(q * 0.4);
      if (this.i % 2 === 0) {
        G.path(c, SHELL_COLS[this.i], (p) => { p.moveTo(-26, -6); p.quadraticCurveTo(-24, -44, 0, -44); p.quadraticCurveTo(24, -44, 26, -6); p.lineTo(8, 0); p.lineTo(-8, 0); p.closePath(); }, 4);
        c.strokeStyle = 'rgba(59,47,74,.4)'; c.lineWidth = 3;
        for (const a of [-0.6, -0.2, 0.2, 0.6]) { c.beginPath(); c.moveTo(0, -2); c.lineTo(Math.sin(a) * 36, -8 - Math.cos(a) * 32); c.stroke(); }
      } else {
        G.path(c, SHELL_COLS[this.i], (p) => { p.moveTo(-30, -4); p.quadraticCurveTo(-26, -34, 4, -36); p.lineTo(32, -20); p.quadraticCurveTo(20, 0, -30, -4); p.closePath(); }, 4);
        c.strokeStyle = 'rgba(59,47,74,.45)'; c.lineWidth = 3;
        c.beginPath(); c.arc(-4, -18, 11, 0, Math.PI * 1.6); c.stroke(); c.beginPath(); c.arc(-4, -18, 4, 0, Math.PI * 1.6); c.stroke();
      }
    }
  }

  // ---------- beach umbrella ----------
  class Umbrella {
    constructor(x) { this.x = x; this.y = G.GROUND - 1; this.z = 5; this.open = 1; this.sq = new G.Spring(180, 7); }
    hit(px, py) { return Math.abs(px - this.x) < 130 && py > this.y - 300 && py < this.y; }
    onTap() { this.sq.kick(4); S().whoosh(); G.tween(this, { open: 0.25 }, 0.25, G.ease.out, () => G.tween(this, { open: 1 }, 0.6, G.ease.outBack)); }
    update(dt) { this.sq.update(dt); }
    draw(c) {
      c.fillStyle = 'rgba(60,40,20,.14)'; c.beginPath(); c.ellipse(this.x + 20, this.y + 5, 150, 14, 0, 0, G.TAU); c.fill();
      G.rrect(c, this.x - 120, this.y - 14, 200, 22, 6, '#6cc3f0', 4);
      G.path(c, null, (p) => { p.moveTo(this.x - 110, this.y - 3); p.lineTo(this.x + 70, this.y - 3); }, 3);
      c.translate(this.x, this.y); c.rotate(-0.12 + G.clamp(this.sq.x, -0.5, 0.5) * 0.3);
      G.rrect(c, -5, -290, 10, 290, 4, '#fff3c4', 4);
      c.translate(0, -285); c.scale(this.open, 1);
      const cols = ['#ff8a7a', '#ffffff'];
      for (let i = 0; i < 6; i++) {
        const a0 = Math.PI + (i * Math.PI) / 6, a1 = a0 + Math.PI / 6;
        G.path(c, cols[i % 2], (p) => { p.moveTo(0, 0); p.arc(0, 8, 140, a0, a1); p.closePath(); }, 4);
      }
    }
  }

  Object.assign(G, { Sea, Boat, Whale, Crab, Castle, Shell, Umbrella });
})();

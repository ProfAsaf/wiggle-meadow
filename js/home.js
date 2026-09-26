// Wiggle Meadow — the house (door surprises, lights, chimney), mailbox, pond, ball, trampoline.
(() => {
  const G = window.G, S = () => G.sfx;

  // ---------- door surprises ----------
  class Cookie extends G.Apple {
    constructor(x, y) { super(x, y, '#d9a05b'); this.crumb = '#e8b977'; this.r = 18; }
    draw(c) {
      c.fillStyle = 'rgba(40,60,20,.16)'; c.beginPath(); c.ellipse(this.x, this.floor + 3, 17, 5, 0, 0, G.TAU); c.fill();
      c.translate(this.x, this.y); c.rotate(this.rot);
      G.circle(c, 0, 0, this.r, '#e0a95f');
      c.fillStyle = '#6b3f2a';
      for (const [x, y] of [[-6, -5], [6, -7], [-2, 6], [8, 5], [-9, 3]]) { c.beginPath(); c.arc(x, y, 2.8, 0, G.TAU); c.fill(); }
    }
  }
  class Balloon {
    constructor(x, y) { this.x = x; this.y = y; this.z = 13; this.color = G.pick(G.CONFETTI); this.ph = G.rand(0, 6); this.draggable = true; this.sq = new G.Spring(200, 6); }
    hit(px, py) { return G.dist(px, py, this.x, this.y) < 44; }
    onTap() { this.dead = true; S().pop(); G.burst('confetti', this.x, this.y, 26, { colors: G.CONFETTI, speed: 380, g: 500, size: 12 }); }
    onDrag(p, rec) { this.x = p.x + rec.ox; this.y = p.y + rec.oy; this.sq.kick(rec.vx * 0.0008); }
    update(dt) {
      this.sq.update(dt);
      if (!this.held) { this.y -= 55 * dt; this.x += Math.sin(G.time * 1.3 + this.ph) * 18 * dt; }
      if (this.y < G.TOP + 40) { this.onTap(); }
    }
    draw(c) {
      const sw = Math.sin(G.time * 2 + this.ph) * 10;
      c.strokeStyle = G.INK; c.lineWidth = 2.5; c.beginPath(); c.moveTo(this.x, this.y + 40);
      c.bezierCurveTo(this.x + sw, this.y + 80, this.x - sw, this.y + 110, this.x + sw * 0.5, this.y + 150); c.stroke();
      c.translate(this.x, this.y); c.rotate(G.clamp(this.sq.x, -0.5, 0.5));
      G.ellipse(c, 0, 0, 32, 38, this.color);
      G.path(c, this.color, (p) => { p.moveTo(-6, 40); p.lineTo(6, 40); p.lineTo(0, 34); p.closePath(); }, 3);
      c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(-11, -14, 6, 11, 0.5, 0, G.TAU); c.fill();
    }
  }
  class Plane {
    constructor(x, y) { this.x = x; this.y = y; this.by = y; this.t = 0; this.z = 13; this.spin = 0; }
    hit(px, py) { return G.dist(px, py, this.x, this.y) < 55; }
    onTap() { S().whoosh(); G.tween(this, { spin: this.spin - G.TAU }, 0.9, G.ease.inOut); }
    update(dt) {
      this.t += dt; this.x += 240 * dt; this.y = this.by - this.t * 30 + Math.sin(this.t * 2.2) * 55;
      if (this.x > G.W + 120) { this.dead = true; }
    }
    draw(c) {
      c.translate(this.x, this.y); c.rotate(Math.cos(this.t * 2.2) * -0.35 + this.spin);
      G.path(c, '#ffffff', (p) => { p.moveTo(40, 0); p.lineTo(-30, -18); p.lineTo(-18, 0); p.lineTo(-30, 16); p.closePath(); }, 4);
      G.path(c, '#dfe8f5', (p) => { p.moveTo(40, 0); p.lineTo(-18, 0); p.lineTo(-24, 10); p.closePath(); }, 3);
    }
  }

  // ---------- the house ----------
  class House {
    constructor(x) {
      this.x = x; this.y = G.GROUND - 6; this.z = 3; this.door = 0; this.peek = 0; this.busy = false;
      this.win = [{ dx: -95, lit: true, c: 1 }, { dx: 95, lit: true, c: 1 }]; this.sq = new G.Spring(160, 8);
    }
    hit(px, py) {
      const dx = px - this.x, top = this.y - 440;
      if (Math.abs(dx) < 175 && py > this.y - 270 && py < this.y) return true;
      if (py > top && py < this.y - 260 && Math.abs(dx) < 200 * ((py - top) / 180)) return true;
      return px > this.x + 70 && px < this.x + 130 && py > top + 30 && py < top + 130;
    }
    onTap(p) {
      const dx = p.x - this.x, dy = p.y - this.y;
      if (dy < -270) return this.puff();
      if (Math.abs(dx) < 46 && dy > -175) return this.openDoor();
      const w = this.win.find((w) => Math.abs(dx - w.dx) < 50 && dy > -230 && dy < -140);
      if (w) { w.lit = !w.lit; S().click(); G.tween(w, { c: w.lit ? 1 : 0 }, 0.4, G.ease.outBack); return; }
      this.sq.kick(2); S().knock();
    }
    puff() {
      for (let i = 0; i < 4; i++) G.after(i * 0.22, () => G.spawn('smoke', this.x + 100 + G.rand(-4, 4), this.y - 420, { vy: -70, vx: G.rand(10, 30), life: 2.4, size: 22, color: '#f1f1f6', drag: 0.1 }));
      S().boop(0); this.sq.kick(1.5);
    }
    openDoor() {
      if (this.busy) return;
      this.busy = true; S().knock(); G.after(0.3, () => S().creak());
      G.tween(this, { door: 1 }, 0.5, G.ease.outBack, () => {
        const r = G.randi(0, 4), dx = this.x, dy = this.y - 60;
        if (r === 0) { G.add(new Balloon(dx, dy - 40)); S().pop(); }
        else if (r === 1) { const k = new Cookie(dx, dy); k.vx = G.rand(200, 420); k.vy = -600; G.add(k); S().boing(1.4); }
        else if (r === 2) { this.peek = 1; S().squeak(1.3); G.after(0.25, () => S().squeak(1.5)); }
        else if (r === 3) { G.burst('confetti', dx, dy, 30, { colors: G.CONFETTI, speed: 420, g: 600, up: 300, size: 12 }); S().tada(); }
        else { const b = G.ball; if (b && !b.held) { b.x = dx; b.y = dy; b.vx = 700; b.vy = -500; b.onGround = false; S().boing(); } else S().tada(); }
        G.after(1.6, () => { this.peek = 0; G.tween(this, { door: 0 }, 0.4, G.ease.inOut, () => (this.busy = false)); });
      });
    }
    update(dt) { this.sq.update(dt); }
    draw(c) {
      const q = G.clamp(this.sq.x, -0.2, 0.2), n = G.night;
      c.fillStyle = 'rgba(40,60,20,.16)'; c.beginPath(); c.ellipse(this.x, this.y + 8, 200, 18, 0, 0, G.TAU); c.fill();
      c.translate(this.x, this.y); c.scale(1 + q * 0.3, 1 - q * 0.3);
      G.rrect(c, 70, -410, 60, 110, 6, '#d9796b', 6);
      G.rrect(c, 62, -420, 76, 20, 6, '#c4655a', 5);
      G.rrect(c, -175, -272, 350, 272, 14, '#fff1d6', 6);
      G.path(c, '#ff8a7a', (p) => { p.moveTo(-205, -250); p.quadraticCurveTo(0, -460, 205, -250); p.closePath(); }, 6);
      c.save(); c.beginPath(); c.moveTo(-205, -250); c.quadraticCurveTo(0, -460, 205, -250); c.closePath(); c.clip();
      c.strokeStyle = 'rgba(59,47,74,.18)'; c.lineWidth = 4;
      for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(-230, -250 - i * 26); c.quadraticCurveTo(0, -300 - i * 26, 230, -250 - i * 26); c.stroke(); }
      c.restore();
      G.circle(c, 0, -300, 26, '#fff1d6', 5); G.circle(c, 0, -300, 14, n > 0.5 ? '#ffd76a' : '#9fd3f0', 4);
      for (const w of this.win) {
        G.rrect(c, w.dx - 42, -228, 84, 84, 10, w.lit ? (n > 0.3 ? '#ffd76a' : '#bfe6fa') : '#6d6a8f', 5);
        G.path(c, null, (p) => { p.moveTo(w.dx, -228); p.lineTo(w.dx, -144); p.moveTo(w.dx - 42, -186); p.lineTo(w.dx + 42, -186); }, 4);
        const cw = 40 * (1 - w.c * 0.72);
        G.rrect(c, w.dx - 42, -230, cw, 88, 6, '#ff9ed2', 4); G.rrect(c, w.dx + 42 - cw, -230, cw, 88, 6, '#ff9ed2', 4);
        G.rrect(c, w.dx - 52, -146, 104, 12, 5, '#ffffff', 4);
      }
      // door: interior, peeking friend, then the door itself swinging on its hinge
      G.path(c, n > 0.4 ? '#ffcf7a' : '#5b3f63', (p) => { p.moveTo(-44, 0); p.lineTo(-44, -130); p.arc(0, -130, 44, Math.PI, 0); p.lineTo(44, 0); p.closePath(); }, 6);
      if (this.peek > 0) {
        const bob = Math.sin(G.time * 8) * 3;
        G.circle(c, -26, -118 + bob, 12, '#c9c4d6', 4); G.circle(c, 26, -118 + bob, 12, '#c9c4d6', 4);
        G.circle(c, 0, -88 + bob, 30, '#c9c4d6', 5);
        G.eyes(c, 0, -94 + bob, 10, 4, 0, 0, 0, 'happy');
        G.ellipse(c, 0, -80 + bob, 5, 4, '#ff7fa3', 0);
      }
      const dw = 88 * (1 - this.door * 0.82);
      G.path(c, '#6cc3f0', (p) => { p.moveTo(-44, 0); p.lineTo(-44, -130); p.quadraticCurveTo(-44, -174, -44 + dw / 2, -174); p.quadraticCurveTo(-44 + dw, -174, -44 + dw, -130); p.lineTo(-44 + dw, 0); p.closePath(); }, 6);
      if (this.door < 0.5) G.circle(c, 26, -70, 6, '#ffd84f', 3);
      G.rrect(c, -64, -8, 128, 14, 5, '#d9b28a', 4);
      G.rrect(c, 188, -64, 12, 64, 4, '#9a6a44', 4);
    }
    glow(c) {
      const n = G.night;
      for (const w of this.win) if (w.lit) {
        const x = this.x + w.dx, y = this.y - 186, g = c.createRadialGradient(x, y, 20, x, y, 140);
        g.addColorStop(0, `rgba(255,210,120,${0.45 * n})`); g.addColorStop(1, 'rgba(255,210,120,0)');
        c.fillStyle = g; c.fillRect(x - 140, y - 140, 280, 280);
      }
    }
  }

  // ---------- mailbox: tap for a paper airplane ----------
  class Mailbox {
    constructor(x) { this.x = x; this.y = G.GROUND - 2; this.z = 6; this.flag = 0; this.lid = 0; this.sq = new G.Spring(200, 8); }
    hit(px, py) { return Math.abs(px - this.x) < 50 && py > this.y - 175 && py < this.y; }
    onTap() {
      this.sq.kick(3); S().click();
      if (this.lid > 0.1) return;
      G.tween(this, { flag: 1, lid: 1 }, 0.35, G.ease.outBack, () => {
        G.add(new Plane(this.x + 40, this.y - 140)); S().whoosh();
        G.after(1.2, () => G.tween(this, { flag: 0, lid: 0 }, 0.4, G.ease.inOut));
      });
    }
    update(dt) { this.sq.update(dt); }
    draw(c) {
      const q = G.clamp(this.sq.x, -0.3, 0.3);
      c.translate(this.x, this.y); c.rotate(q * 0.2);
      G.rrect(c, -8, -110, 16, 110, 4, '#9a6a44', 5);
      G.path(c, '#6cc3f0', (p) => { p.moveTo(-44, -100); p.lineTo(-44, -140); p.arc(0, -140, 44, Math.PI, 0); p.lineTo(44, -100); p.closePath(); }, 5);
      c.save(); c.translate(44, -100); c.rotate(this.lid * 1.1);
      G.path(c, '#4ea8dc', (p) => { p.moveTo(0, 0); p.lineTo(0, -40); p.arc(-12, -40, 12, 0, -Math.PI / 2, true); p.lineTo(-12, -52); }, 5); c.restore();
      c.save(); c.translate(-30, -120); c.rotate(-this.flag * 1.5);
      G.rrect(c, -4, -44, 8, 44, 3, '#ff5b5b', 4); G.rrect(c, -4, -44, 26, 16, 4, '#ff5b5b', 4); c.restore();
    }
  }

  // ---------- pond with jumping fish ----------
  class Pond {
    constructor(x) {
      this.x = x; this.y = 805; this.rx = 205; this.ry = 50; this.z = 4; this.x0 = x - this.rx; this.x1 = x + this.rx;
      this.rings = []; this.jumps = []; this.fish = [0, 1].map((i) => ({ ph: i * 3, c: i ? '#ffb65c' : '#ff8a7a' })); this.pad = new G.Spring(150, 5);
    }
    inside(x) { return x > this.x0 + 25 && x < this.x1 - 25; }
    bank(x) { return x < this.x ? this.x0 - 40 : this.x1 + 40; }
    hit(px, py) { const dx = (px - this.x) / this.rx, dy = (py - this.y) / (this.ry + 20); return dx * dx + dy * dy < 1; }
    splash(x, k = 1) {
      S().splash();
      G.burst('drop', x, this.y - 6, Math.round(14 * k), { color: '#7fcdf3', angle: -Math.PI / 2, spread: 0.9, speed: 420 * k, g: 1200, size: 8 });
      this.rings.push({ x, r: 8, a: 1 });
    }
    onTap(p) {
      this.rings.push({ x: p.x, r: 6, a: 1 });
      if (G.dist(p.x, p.y, this.x + 90, this.y - 6) < 50) { this.pad.kick(4); S().blub(); return; }
      S().blub();
      const dir = G.pick([-1, 1]), x0 = G.clamp(p.x, this.x0 + 70, this.x1 - 70);
      this.jumps.push({ x0, dir, t: 0, c: G.pick(this.fish).c });
      G.after(0.05, () => this.splash(x0, 0.5));
    }
    update(dt) {
      this.pad.update(dt);
      for (const r of this.rings) { r.r += 60 * dt; r.a -= dt * 0.8; }
      this.rings = this.rings.filter((r) => r.a > 0);
      for (const j of this.jumps) { j.t += dt; if (j.t >= 0.9 && !j.done) { j.done = true; this.splash(j.x0 + j.dir * 120, 0.5); } }
      this.jumps = this.jumps.filter((j) => j.t < 0.9);
    }
    draw(c) {
      const t = G.time;
      G.ellipse(c, this.x, this.y + 6, this.rx + 14, this.ry + 12, '#b8a684', 0);
      G.ellipse(c, this.x, this.y, this.rx, this.ry, '#63bfe8', 6);
      c.save(); c.beginPath(); c.ellipse(this.x, this.y, this.rx - 4, this.ry - 4, 0, 0, G.TAU); c.clip();
      for (const f of this.fish) {
        const fx = this.x + Math.sin(t * 0.6 + f.ph) * 140, fy = this.y + 8 + Math.sin(t * 1.3 + f.ph) * 10, d = Math.cos(t * 0.6 + f.ph) > 0 ? 1 : -1;
        c.globalAlpha = 0.5; G.ellipse(c, fx, fy, 22, 10, f.c, 0);
        c.beginPath(); c.moveTo(fx - d * 20, fy); c.lineTo(fx - d * 34, fy - 9); c.lineTo(fx - d * 34, fy + 9); c.closePath(); c.fill(); c.globalAlpha = 1;
      }
      c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 3;
      for (const r of this.rings) { c.globalAlpha = r.a; c.beginPath(); c.ellipse(r.x, this.y, r.r, r.r * 0.3, 0, 0, G.TAU); c.stroke(); }
      c.globalAlpha = 1;
      c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 4;
      c.beginPath(); c.ellipse(this.x - 80, this.y - 15, 40, 6, 0, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
      c.restore();
      c.save(); c.translate(this.x + 90, this.y - 6); c.rotate(G.clamp(this.pad.x, -1, 1) * 0.5 + Math.sin(t) * 0.05);
      G.path(c, '#6cc04a', (p) => { p.ellipse(0, 0, 38, 13, 0, 0.35, G.TAU - 0.1); p.lineTo(0, 0); p.closePath(); }, 4);
      G.circle(c, -8, -8, 9, '#ff9ed2', 3); G.circle(c, -8, -8, 4, '#ffd84f', 0); c.restore();
      for (const j of this.jumps) {
        const k = j.t / 0.9, fx = j.x0 + j.dir * 120 * k, fy = this.y - Math.sin(k * Math.PI) * 150;
        c.save(); c.translate(fx, fy); c.scale(j.dir, 1); c.rotate((k - 0.5) * 2.2);
        G.path(c, j.c, (p) => { p.moveTo(-22, 0); p.lineTo(-36, -12); p.lineTo(-36, 12); p.closePath(); }, 4);
        G.ellipse(c, 0, 0, 26, 14, j.c); G.eyes(c, 12, -3, 0.01, 3.2, 0, 0, 0, 'open'); c.restore();
      }
    }
  }

  // ---------- beach ball ----------
  class Ball {
    constructor(x, y = G.GROUND) { this.floor = G.floorFor(y); this.x = x; this.y = this.floor - 34; this.r = 34; this.vx = 0; this.vy = 0; this.z = 8; this.rot = 0; this.draggable = true; this.onGround = true; this.sq = new G.Spring(260, 12); }
    hit(px, py) { return G.dist(px, py, this.x, this.y) < 50; }
    kick(dir, who) { this.vx = dir * G.rand(420, 720); this.vy = -G.rand(450, 800); this.onGround = false; this.y -= 2; S().boing(1.2); }
    onTap() { this.kick(G.pick([-1, 1])); this.vy = -1000; }
    onDragStart() { this.onGround = false; }
    onDrop(p, rec) { this.floor = G.floorFor(this.y); this.vx = G.clamp(rec.vx, -1800, 1800); this.vy = G.clamp(rec.vy, -1800, 1800); }
    update(dt) {
      this.sq.update(dt);
      if (this.held) return;
      const floor = this.floor - this.r + 3;
      if (!this.onGround) this.vy += 1700 * dt;
      this.x += this.vx * dt; this.y += this.vy * dt; this.rot += (this.vx * dt) / this.r;
      if (this.x < this.r || this.x > G.W - this.r) { this.x = G.clamp(this.x, this.r, G.W - this.r); this.vx *= -0.75; S().blub(); }
      if (this.y < G.TOP + 60 && this.vy < 0) { this.y = G.TOP + 60; this.vy *= -0.5; }
      if (this.vy > 0 && G.catchers.some((q) => q.catches(this))) return;
      if (this.y >= floor) {
        this.y = floor;
        const w = this.floor === G.GROUND && G.waters.find((q) => q.inside(this.x));
        if (w && this.vy > 150) { w.splash(this.x, 0.7); this.vy = -Math.max(600, this.vy * 0.6); this.vx = Math.sign(w.bank(this.x) - this.x || 1) * 300; return; }
        if (this.vy > 180) { this.sq.kick(Math.min(4, this.vy * 0.004)); this.vy *= -0.68; if (this.vy < -200) S().boing(1.5); }
        else { this.vy = 0; this.onGround = true; }
        this.vx *= 0.9;
      }
      if (this.onGround) { this.vx *= 1 - 1.2 * dt; if (Math.abs(this.vx) < 4) this.vx = 0; }
    }
    draw(c) {
      const q = G.clamp(this.sq.x, -0.35, 0.35), sh = G.clamp(1 - (this.floor - this.y) / 700, 0.3, 1);
      c.fillStyle = 'rgba(40,60,20,.16)'; c.beginPath(); c.ellipse(this.x, this.floor + 3, 32 * sh, 7 * sh, 0, 0, G.TAU); c.fill();
      c.translate(this.x, this.y + this.r * q * 0.6); c.scale(1 + q * 0.6, 1 - q * 0.6); c.rotate(this.rot);
      const cols = ['#ff5b5b', '#ffffff', '#ffd84f', '#ffffff', '#6cc3f0', '#ffffff'];
      cols.forEach((col, i) => { c.fillStyle = col; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, this.r, (i * G.TAU) / 6, ((i + 1) * G.TAU) / 6); c.closePath(); c.fill(); });
      G.circle(c, 0, 0, this.r, null, 5); G.circle(c, 0, 0, 7, '#ffffff', 3);
    }
  }

  // ---------- trampoline ----------
  class Trampoline {
    constructor(x) { this.x = x; this.w = 190; this.y = G.GROUND - 1; this.top = G.GROUND - 58; this.z = 6; this.dip = new G.Spring(260, 9); }
    hit(px, py) { return Math.abs(px - this.x) < this.w / 2 + 10 && py > this.top - 25 && py < this.y; }
    onTap() { this.dip.kick(5); S().boing(0.8); }
    catches(t) {
      const isC = t instanceof G.Critter, bottom = isC ? t.y : t.y + (t.r || 0);
      if (Math.abs(t.x - this.x) > this.w / 2 - 10 || bottom < this.top || bottom > this.top + 45) return false;
      t.y = this.top - (isC ? 0 : t.r || 0);
      t.vy = -G.clamp(t.vy * 0.95, isC ? 1150 : 900, 2000);
      t.bounces = (t.bounces || 0) + 1;
      if (isC) {
        t.say('happy', 'open', 0.8); t.sq.kick(2.5);
        if (t.bounces % 2 === 1) S().giggle(t.pitch);
        if (t.bounces > 3) { t.vx = G.pick([-1, 1]) * 380; t.bounces = 0; t.spin = Math.sign(t.vx) * G.TAU; }
      }
      this.dip.kick(6); S().boing(isC ? 1 : 1.3);
      return true;
    }
    update(dt) { this.dip.update(dt); }
    draw(c) {
      const d = G.clamp(this.dip.x, -0.6, 1) * 22, x0 = this.x - this.w / 2, x1 = this.x + this.w / 2;
      G.path(c, null, (p) => { p.moveTo(x0 + 18, this.top); p.lineTo(x0 + 8, this.y); p.moveTo(x1 - 18, this.top); p.lineTo(x1 - 8, this.y); p.moveTo(this.x, this.top + 10); p.lineTo(this.x, this.y); }, 8);
      G.path(c, '#b9a3e3', (p) => { p.moveTo(x0, this.top); p.quadraticCurveTo(this.x, this.top + d * 2, x1, this.top); p.lineTo(x1, this.top + 10); p.quadraticCurveTo(this.x, this.top + 10 + d * 2, x0, this.top + 10); p.closePath(); }, 5);
      G.rrect(c, x0 - 8, this.top - 5, 20, 20, 8, '#ff8a7a', 4); G.rrect(c, x1 - 12, this.top - 5, 20, 20, 8, '#ff8a7a', 4);
    }
  }

  Object.assign(G, { Cookie, Balloon, Plane, House, Mailbox, Pond, Ball, Trampoline });
})();

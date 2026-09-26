// Wiggle Meadow — the campfire kitchen. Drop anything edible into the pot (apples, carrots, cookies,
// ice cream, or veggies from the basket), tap to stir, and out comes a bowl of soup coloured by what went in.
// Sweet and savoury together tastes... interesting. Critters dropped in the pot hop right back out.
(() => {
  const G = window.G, S = () => G.sfx;
  const VEG = {
    tomato: { col: '#ff5b5b', taste: 'savory' }, cheese: { col: '#ffd84f', taste: 'savory' }, fish: { col: '#8fb3d9', taste: 'savory' },
    broccoli: { col: '#6cc04a', taste: 'savory' }, egg: { col: '#fff3c4', taste: 'savory' }, mushroom: { col: '#c9a27a', taste: 'savory' },
    strawberry: { col: '#ff6f91', taste: 'sweet' }, banana: { col: '#ffe066', taste: 'sweet' },
  };
  const flavor = (f) => f.flavor || { col: f.color || '#ffd84f', taste: f instanceof G.Carrot ? 'savory' : 'sweet' };
  const rgb = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const hex = (a) => '#' + a.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');

  class Veg extends G.Apple {
    constructor(type, x, y) { super(x, y, VEG[type].col); this.type = type; this.flavor = VEG[type]; this.crumb = VEG[type].col; this.r = 18; }
    draw(c) {
      c.fillStyle = 'rgba(40,60,20,.16)'; c.beginPath(); c.ellipse(this.x, this.floor + 3, 18, 5, 0, 0, G.TAU); c.fill();
      c.translate(this.x, this.y); c.rotate(this.rot);
      const t = this.type, col = this.color;
      if (t === 'tomato') { G.circle(c, 0, 2, 18, col); G.path(c, '#5fae44', (p) => G.starPath(p, 0, -14, 9, 4, 5), 2.5); }
      else if (t === 'cheese') { G.path(c, col, (p) => { p.moveTo(-20, 12); p.lineTo(20, 12); p.lineTo(20, -8); p.closePath(); }, 4); c.fillStyle = '#e8b93a'; for (const [x, y] of [[8, 4], [14, -2]]) { c.beginPath(); c.arc(x, y, 3, 0, G.TAU); c.fill(); } }
      else if (t === 'fish') { G.path(c, col, (p) => { p.moveTo(14, 0); p.lineTo(26, -10); p.lineTo(26, 10); p.closePath(); }, 3.5); G.ellipse(c, -2, 0, 18, 11, col); G.circle(c, -10, -2, 2.5, G.INK, 0); }
      else if (t === 'broccoli') { G.rrect(c, -5, -2, 10, 18, 4, '#9bd26a', 3.5); for (const [x, y] of [[-10, -6], [10, -6], [0, -14]]) G.circle(c, x, y, 10, col, 3.5); }
      else if (t === 'egg') { G.ellipse(c, 0, 0, 14, 18, col); }
      else if (t === 'mushroom') { G.rrect(c, -6, -4, 12, 18, 5, '#fff3e0', 3.5); G.path(c, col, (p) => { p.moveTo(-20, -2); p.quadraticCurveTo(0, -30, 20, -2); p.closePath(); }, 3.5); }
      else if (t === 'strawberry') { G.path(c, col, (p) => { p.moveTo(0, 18); p.bezierCurveTo(-24, 0, -16, -16, 0, -12); p.bezierCurveTo(16, -16, 24, 0, 0, 18); }, 3.5); c.fillStyle = '#fff3c4'; for (const [x, y] of [[-6, -2], [6, -2], [0, 6]]) { c.beginPath(); c.arc(x, y, 1.8, 0, G.TAU); c.fill(); } G.path(c, '#5fae44', (p) => G.starPath(p, 0, -13, 8, 3.5, 5), 2.5); }
      else { G.path(c, col, (p) => { p.moveTo(-20, -8); p.quadraticCurveTo(0, 22, 22, -10); p.quadraticCurveTo(2, 8, -20, -8); p.closePath(); }, 3.5); }
    }
  }

  class Bowl extends G.Apple {
    constructor(x, y, col, taste) { super(x, y, col); this.taste = taste; this.yucky = taste === 'yuck'; this.crumb = col; this.r = 20; this.flavor = { col, taste: taste === 'yuck' ? 'sweet' : taste }; }
    draw(c) {
      c.fillStyle = 'rgba(40,60,20,.16)'; c.beginPath(); c.ellipse(this.x, this.floor + 3, 26, 6, 0, 0, G.TAU); c.fill();
      c.translate(this.x, this.y); c.rotate(this.rot * 0.2);
      G.path(c, '#ffffff', (p) => { p.moveTo(-28, -6); p.quadraticCurveTo(-26, 18, 0, 18); p.quadraticCurveTo(26, 18, 28, -6); p.closePath(); }, 4);
      G.ellipse(c, 0, -6, 26, 7, this.color, 3.5);
      c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 3;
      for (const x of [-8, 6]) { c.beginPath(); c.moveTo(x, -16); c.quadraticCurveTo(x + 6, -24 - Math.sin(G.time * 4 + x) * 3, x, -32); c.stroke(); }
    }
  }

  // ---------- the pot over the campfire ----------
  class Pot {
    constructor(x) {
      this.x = x; this.y = G.GROUND - 1; this.rim = G.GROUND - 128; this.z = 5; this.items = []; this.soup = '#bfe6fa';
      this.stirT = 0; this.fire = 1; this.sq = new G.Spring(200, 8); this.bubT = 0; this.steamT = 0;
      G.pot = this; G.catchers.push(this);
    }
    mouth(x, y) { return Math.abs(x - this.x) < 72 && y > this.rim - 30 && y < this.rim + 45; }
    catches(t) {
      if (!this.mouth(t.x, t.y + (t.r || 0))) return false;
      if (t instanceof G.Critter) { // too hot to sit in!
        t.vy = -1250; t.vx = G.pick([-1, 1]) * 280; t.say('wide', 'o', 1.2); t.sq.kick(3); S().sizzle(); S().boing(1.3);
        G.burst('smoke', this.x, this.rim, 8, { color: '#ffffff', g: -120, speed: 120, size: 16, life: 1.2 });
        return true;
      }
      if (t.isFood && !t.held && !(t instanceof Bowl)) { this.add(t); return true; }
      return false;
    }
    add(food) {
      food.dead = true; S().blub(); S().splash(); this.sq.kick(2);
      const f = flavor(food); this.items.push(f); if (this.items.length > 6) this.items.shift();
      G.burst('drop', this.x, this.rim, 10, { color: this.soup, angle: -Math.PI / 2, spread: 0.8, speed: 300, g: 1100, size: 7 });
      this.mixSoup();
    }
    mixSoup() {
      if (!this.items.length) { this.soup = '#bfe6fa'; return; }
      const sum = [0, 0, 0]; for (const it of this.items) rgb(it.col).forEach((v, i) => (sum[i] += v));
      const base = rgb('#bfe6fa'), n = this.items.length;
      this.soup = hex(sum.map((v, i) => (v / n) * 0.82 + base[i] * 0.18));
    }
    taste() {
      const sweet = this.items.some((i) => i.taste === 'sweet'), savory = this.items.some((i) => i.taste === 'savory');
      return sweet && savory ? 'yuck' : sweet ? 'sweet' : 'savory';
    }
    hit(px, py) { return Math.abs(px - this.x) < 100 && py > this.rim - 40 && py < this.y; }
    onTap(p) {
      if (p.y > this.y - 45) { this.fire = 2; S().sizzle(); G.burst('sparkle', this.x, this.y - 30, 10, { colors: ['#ffd84f', '#ffb65c', '#ff8a7a'], g: -200, speed: 160, size: 8 }); return; }
      this.stirT = 0.9; S().stir(); this.sq.kick(1.5);
      if (!this.items.length) { G.burst('bubble', this.x, this.rim, 6, { g: -150, speed: 80, size: 9 }); return; }
      const col = this.soup, taste = this.taste();
      G.after(0.6, () => {
        const b = new Bowl(this.x + 60, this.rim - 20, col, taste); b.vx = G.rand(220, 360) * G.pick([-1, 1]); b.vy = -650;
        G.add(b); S().pop(); this.items.pop(); this.mixSoup();
      });
    }
    update(dt) {
      this.sq.update(dt); this.fire = Math.max(1, this.fire - dt * 0.4); this.stirT = Math.max(0, this.stirT - dt);
      const near = this.x > G.view.x0 - 100 && this.x < G.view.x1 + 100;
      if (near && (this.bubT -= dt * this.fire) < 0) { this.bubT = this.items.length ? 0.25 : 0.7; G.spawn('bubble', this.x + G.rand(-45, 45), this.rim + 4, { vy: -60, life: 0.7, size: G.rand(4, 8), g: 0 }); }
      if (near && this.items.length && (this.steamT -= dt) < 0) { this.steamT = 0.5; G.spawn('smoke', this.x + G.rand(-30, 30), this.rim - 10, { vy: -50, vx: G.rand(-10, 10), life: 2, size: 14, color: '#ffffff', drag: 0.1 }); }
    }
    draw(c) {
      const x = this.x, y = this.y, t = G.time, q = G.clamp(this.sq.x, -0.2, 0.2);
      for (let i = 0; i < 7; i++) G.ellipse(c, x - 90 + i * 30, y - 6, 17, 11, i % 2 ? '#b8b0c8' : '#cfc8dc', 4);
      G.rrect(c, x - 60, y - 30, 120, 16, 7, '#9a6a44', 4); G.rrect(c, x - 50, y - 44, 100, 16, 7, '#b07a4a', 4);
      for (let i = 0; i < 3; i++) {
        const fx = x - 30 + i * 30, h = (34 + Math.sin(t * 12 + i * 2) * 8) * (0.8 + this.fire * 0.25);
        G.path(c, i === 1 ? '#ffd84f' : '#ffb65c', (p) => { p.moveTo(fx - 14, y - 36); p.quadraticCurveTo(fx - 12, y - 36 - h * 0.6, fx, y - 36 - h); p.quadraticCurveTo(fx + 12, y - 36 - h * 0.6, fx + 14, y - 36); p.closePath(); }, 3);
      }
      c.save(); c.translate(x, 0); c.scale(1 + q * 0.3, 1);
      G.path(c, '#4a4560', (p) => { p.moveTo(-76, this.rim); p.quadraticCurveTo(-84, y - 40, 0, y - 44); p.quadraticCurveTo(84, y - 40, 76, this.rim); p.closePath(); }, 6);
      for (const d of [-1, 1]) G.ellipse(c, d * 82, this.rim + 22, 10, 7, '#4a4560', 4);
      G.ellipse(c, 0, this.rim, 76, 16, this.soup, 5);
      this.items.forEach((it, i) => G.circle(c, -40 + ((i * 29 + t * (this.stirT > 0 ? 90 : 8)) % 80), this.rim + Math.sin(t * 3 + i) * 3, 7, it.col, 3));
      c.restore();
      const a = this.stirT > 0 ? Math.sin(t * 14) * 0.5 : 0.35;
      c.save(); c.translate(x + 20, this.rim); c.rotate(a);
      G.rrect(c, -4, -90, 8, 90, 4, '#c98d5b', 4); G.ellipse(c, 0, -2, 12, 7, '#c98d5b', 4); c.restore();
    }
    glow(c) {
      const g = c.createRadialGradient(this.x, this.y - 40, 10, this.x, this.y - 40, 220);
      g.addColorStop(0, `rgba(255,190,110,${0.5 * G.night})`); g.addColorStop(1, 'rgba(255,190,110,0)');
      c.fillStyle = g; c.fillRect(this.x - 220, this.y - 260, 440, 440);
    }
  }

  // ---------- the veggie basket ----------
  class Basket {
    constructor(x) { this.x = x; this.y = G.GROUND - 1; this.z = 5; this.sq = new G.Spring(220, 9); this.bag = []; }
    hit(px, py) { return Math.abs(px - this.x) < 70 && py > this.y - 100 && py < this.y; }
    onTap() {
      this.sq.kick(3);
      if (G.things.filter((t) => t instanceof Veg && !t.dead).length >= 10) { S().boop(0); return; }
      if (!this.bag.length) this.bag = Object.keys(VEG).sort(() => Math.random() - 0.5);
      const v = new Veg(this.bag.pop(), this.x, this.y - 90); v.vx = G.rand(120, 300) * G.pick([-1, 1]); v.vy = -620;
      G.add(v); S().pop();
    }
    update(dt) { this.sq.update(dt); }
    draw(c) {
      const q = G.clamp(this.sq.x, -0.3, 0.3);
      c.translate(this.x, this.y); c.scale(1 + q * 0.4, 1 - q * 0.4);
      for (const [x, col] of [[-26, '#ff5b5b'], [0, '#6cc04a'], [24, '#ffe066']]) G.circle(c, x, -62, 16, col, 4);
      G.path(c, '#e0b070', (p) => { p.moveTo(-62, -60); p.lineTo(62, -60); p.lineTo(48, 0); p.lineTo(-48, 0); p.closePath(); }, 5);
      c.strokeStyle = 'rgba(59,47,74,.35)'; c.lineWidth = 3;
      for (const yy of [-42, -22]) { c.beginPath(); c.moveTo(-56, yy); c.lineTo(56, yy); c.stroke(); }
      G.path(c, null, (p) => { p.moveTo(-54, -60); p.quadraticCurveTo(0, -130, 54, -60); }, 6);
    }
  }

  Object.assign(G, { Veg, Bowl, Pot, Basket, VEG });
})();

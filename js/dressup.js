// Wiggle Meadow — the dress-up trunk: hats, crowns, glasses and bows. Drop one on any critter to put it on,
// drag it off to take it back, drop it in the trunk to tidy up.
(() => {
  const G = window.G, S = () => G.sfx, INK = G.INK;
  // Each item draws around its anchor: the brim for hats, the bridge for glasses, the knot for neckwear.
  const WEAR = (G.WEAR = {
    party: { slot: 'hat', draw(c) {
      G.path(c, '#ff9ed2', (p) => { p.moveTo(-26, 0); p.lineTo(0, -72); p.lineTo(26, 0); p.closePath(); }, 4);
      c.strokeStyle = '#fff3c4'; c.lineWidth = 6; c.beginPath(); c.moveTo(-17, -22); c.lineTo(9, -30); c.moveTo(-9, -46); c.lineTo(5, -50); c.stroke();
      G.circle(c, 0, -74, 9, '#ffd84f', 3);
    } },
    crown: { slot: 'hat', draw(c) {
      G.path(c, '#ffd84f', (p) => { p.moveTo(-30, 0); p.lineTo(-32, -38); p.lineTo(-15, -20); p.lineTo(0, -46); p.lineTo(15, -20); p.lineTo(32, -38); p.lineTo(30, 0); p.closePath(); }, 4);
      G.circle(c, 0, -14, 5.5, '#ff5b5b', 2.5); G.circle(c, -18, -12, 4, '#6cc3f0', 2.5); G.circle(c, 18, -12, 4, '#8fd16a', 2.5);
    } },
    tophat: { slot: 'hat', draw(c) {
      G.rrect(c, -24, -60, 48, 60, 6, '#3f3957', 4); G.rrect(c, -24, -18, 48, 11, 2, '#ff5b5b', 0);
      G.ellipse(c, 0, 0, 40, 8, '#3f3957', 4);
    } },
    cap: { slot: 'hat', draw(c) {
      G.ellipse(c, 24, 0, 28, 8, '#4a9fd6', 4);
      G.path(c, '#6cc3f0', (p) => { p.moveTo(-36, 2); p.quadraticCurveTo(-34, -36, 0, -36); p.quadraticCurveTo(34, -36, 36, 2); p.closePath(); }, 4);
      G.circle(c, 0, -36, 4, '#ffffff', 2.5);
    } },
    flowers: { slot: 'hat', draw(c) {
      c.strokeStyle = '#5fae44'; c.lineWidth = 5; c.beginPath(); c.moveTo(-40, 0); c.quadraticCurveTo(0, -18, 40, 0); c.stroke();
      [[-32, -4, '#ff8a7a'], [-16, -10, '#ffd84f'], [0, -12, '#ff9ed2'], [16, -10, '#b9a3e3'], [32, -4, '#6cc3f0']].forEach(([x, y, col]) => {
        for (let i = 0; i < 5; i++) { const a = (i * G.TAU) / 5; G.circle(c, x + Math.cos(a) * 6, y + Math.sin(a) * 6, 5, col, 2); }
        G.circle(c, x, y, 3.5, '#fff3c4', 0);
      });
    } },
    bow: { slot: 'hat', draw(c) {
      c.save(); c.translate(24, -6);
      for (const d of [-1, 1]) G.ellipse(c, d * 16, -6, 18, 12, '#ff5b5b', 4, d * 0.35);
      G.circle(c, 0, -6, 7, '#ff8a7a', 3); c.restore();
    } },
    wizard: { slot: 'hat', draw(c) {
      G.path(c, '#7a6bd6', (p) => { p.moveTo(-30, 0); p.quadraticCurveTo(-8, -50, 14, -92); p.quadraticCurveTo(10, -44, 30, 0); p.closePath(); }, 4);
      c.fillStyle = '#ffd84f'; for (const [x, y] of [[-8, -24], [8, -44], [-2, -62]]) { c.beginPath(); G.starPath(c, x, y, 7, 3, 5); c.fill(); }
      G.ellipse(c, 0, 0, 42, 8, '#7a6bd6', 4);
    } },
    chef: { slot: 'hat', draw(c) {
      G.rrect(c, -24, -26, 48, 26, 5, '#ffffff', 4);
      for (const [x, y] of [[-16, -36], [16, -36], [0, -46]]) G.circle(c, x, y, 18, '#ffffff', 4);
      G.rrect(c, -24, -26, 48, 26, 5, '#ffffff', 0); G.rrect(c, -24, -10, 48, 6, 2, '#e6e0f0', 0);
    } },
    shades: { slot: 'eyes', draw(c) {
      for (const d of [-1, 1]) G.rrect(c, d * 20 - 14, -10, 28, 20, 8, '#3b2f4a', 3);
      G.path(c, null, (p) => { p.moveTo(-6, -4); p.quadraticCurveTo(0, -8, 6, -4); }, 3);
      c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 3; for (const d of [-1, 1]) { c.beginPath(); c.moveTo(d * 20 - 8, -4); c.lineTo(d * 20 - 2, -8); c.stroke(); }
    } },
    hearts: { slot: 'eyes', draw(c) {
      for (const d of [-1, 1]) G.path(c, '#ff5b5b', (p) => G.heartPath(p, d * 20, 0, 15), 3);
      G.path(c, null, (p) => { p.moveTo(-8, -4); p.lineTo(8, -4); }, 3);
    } },
    bowtie: { slot: 'neck', draw(c) {
      for (const d of [-1, 1]) G.path(c, '#ff5b5b', (p) => { p.moveTo(0, 0); p.lineTo(d * 24, -12); p.lineTo(d * 24, 12); p.closePath(); }, 3.5);
      G.circle(c, 0, 0, 6, '#ff8a7a', 3);
    } },
    scarf: { slot: 'neck', draw(c) {
      G.rrect(c, 6, -2, 16, 38, 6, '#8fd16a', 3.5);
      G.rrect(c, -32, -8, 64, 16, 8, '#8fd16a', 3.5);
      c.fillStyle = '#fff3c4'; for (const x of [-20, -4, 12]) c.fillRect(x, -8, 5, 16);
    } },
  });

  // drawn inside the critter's own transform, right after its face
  G.drawWorn = (cr, c) => {
    const k = cr.kind, W = cr.wears, lx = cr.lx, ly = cr.ly;
    if (W.neck) { c.save(); c.translate(0, -50); WEAR[W.neck].draw(c); c.restore(); }
    if (W.eyes) {
      c.save(); c.translate(lx * 7, (k === 'frog' ? -135 : -102) + ly * 4);
      if (k === 'frog') c.scale(1.3, 1);
      WEAR[W.eyes].draw(c); c.restore();
    }
    if (W.hat) {
      c.save(); c.translate(lx * 3, k === 'frog' ? -150 : k === 'chick' ? -134 : -130);
      c.rotate(-0.1 + G.clamp(cr.tilt.x, -1, 1) * 0.06); WEAR[W.hat].draw(c); c.restore();
    }
  };

  // ---------- a loose item lying about ----------
  class Wear {
    constructor(type, x, y, vx = 0, vy = 0) {
      this.type = type; this.x = x; this.y = y; this.vx = vx; this.vy = vy; this.z = 8; this.draggable = true;
      this.floor = G.floorFor(y); this.rot = 0; this.onGround = false; this.isWear = true;
    }
    hit(px, py) { return G.dist(px, py, this.x, this.y - 20) < 44; }
    onTap() { this.vy = -450; this.onGround = false; S().pop(); }
    onDragStart() { this.onGround = false; S().click(); }
    onDrag(p, rec) { this.x = p.x + rec.ox; this.y = Math.min(p.y + rec.oy, G.floorFor(p.y + rec.oy)); }
    onDrop(p, rec) {
      this.floor = G.floorFor(this.y);
      const cr = G.things.find((t) => t instanceof G.Critter && t.state !== 'held' && t.hit(this.x, this.y - 10));
      if (cr) { this.dead = true; cr.wear(this.type); return; }
      if (G.trunk && G.trunk.catches(this)) { G.trunk.swallow(this); return; }
      this.vx = G.clamp(rec.vx * 0.7, -1200, 1200); this.vy = G.clamp(rec.vy * 0.7, -1400, 1400);
    }
    update(dt) {
      if (this.held || this.onGround) return;
      this.vy += 1800 * dt; this.x = G.clamp(this.x + this.vx * dt, 30, G.W - 30); this.y += this.vy * dt; this.rot += this.vx * dt * 0.01;
      if (this.y >= this.floor) {
        this.y = this.floor;
        if (this.vy > 260) { this.vy *= -0.4; this.vx *= 0.6; } else { this.vy = this.vx = 0; this.rot = 0; this.onGround = true; }
      }
    }
    draw(c) {
      c.fillStyle = 'rgba(40,60,20,.16)'; c.beginPath(); c.ellipse(this.x, this.floor + 3, 30, 6, 0, 0, G.TAU); c.fill();
      const slot = WEAR[this.type].slot;
      c.translate(this.x, this.y - (slot === 'hat' ? 4 : 16)); c.rotate(this.rot);
      WEAR[this.type].draw(c);
    }
  }
  G.dropWear = (type, x, y, vx = 0, vy = 0) => G.add(new Wear(type, x, y, vx, vy));

  // ---------- the trunk ----------
  class Trunk {
    constructor(x) {
      this.x = x; this.y = G.GROUND - 1; this.z = 5; this.lid = 0; this.sq = new G.Spring(200, 8); this.i = 0;
      this.order = Object.keys(WEAR).sort(() => Math.random() - 0.5); G.trunk = this;
    }
    hit(px, py) { return Math.abs(px - this.x) < 110 && py > this.y - 170 && py < this.y; }
    catches(w) { return Math.abs(w.x - this.x) < 100 && w.y > this.y - 230 && w.y < this.y - 30; }
    swallow(w) { w.dead = true; S().gulp(); this.sq.kick(3); this.open(0.4); G.burst('sparkle', this.x, this.y - 150, 8, { colors: G.CONFETTI, g: 0, speed: 160, size: 9 }); }
    open(hold = 1) { G.tween(this, { lid: 1 }, 0.3, G.ease.outBack, () => G.after(hold, () => G.tween(this, { lid: 0 }, 0.35, G.ease.inOut))); }
    onTap() {
      this.sq.kick(3); this.open(); S().creak();
      if (G.things.filter((t) => t instanceof Wear && !t.dead).length >= 16) return;
      for (let k = 0; k < 2; k++) G.after(0.2 + k * 0.15, () => {
        const type = this.order[this.i++ % this.order.length];
        G.dropWear(type, this.x + (k ? 30 : -30), this.y - 130, (k ? 1 : -1) * G.rand(160, 330), -G.rand(700, 900)); S().pop();
      });
    }
    update(dt) { this.sq.update(dt); }
    draw(c) {
      const q = G.clamp(this.sq.x, -0.25, 0.25);
      c.fillStyle = 'rgba(40,60,20,.16)'; c.beginPath(); c.ellipse(this.x, this.y + 6, 125, 14, 0, 0, G.TAU); c.fill();
      c.translate(this.x, this.y); c.scale(1 + q * 0.4, 1 - q * 0.4);
      if (this.lid > 0.1) for (const [x, col] of [[-50, '#ff9ed2'], [-10, '#ffd84f'], [34, '#6cc3f0']]) G.path(c, col, (p) => { p.moveTo(x - 18, -120); p.lineTo(x, -120 - 40 * this.lid); p.lineTo(x + 18, -120); p.closePath(); }, 4);
      c.save(); c.translate(-105, -122); c.rotate(-this.lid * 1.8);
      G.path(c, '#c98d5b', (p) => { p.moveTo(0, 0); p.lineTo(0, -18); p.quadraticCurveTo(105, -56, 210, -18); p.lineTo(210, 0); p.closePath(); }, 5);
      c.restore();
      G.rrect(c, -105, -122, 210, 122, 12, '#c98d5b', 6);
      for (const x of [-70, 70]) G.rrect(c, x - 9, -122, 18, 122, 3, '#ffd84f', 4);
      G.path(c, '#ff6f91', (p) => G.heartPath(p, 0, -60, 24), 4);
    }
  }

  Object.assign(G, { Wear, Trunk });
})();

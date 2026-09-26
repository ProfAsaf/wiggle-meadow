// Wiggle Meadow — Toy Yard blocks with real physics (Matter.js). Stack them, topple them, throw them,
// stand critters on top. The toy box hands out new blocks and swallows any you put back in.
(() => {
  const G = window.G, S = () => G.sfx, M = window.Matter;
  G.blocks = [];
  G.blockTop = () => null; G.bumpBlocks = () => {};
  if (!M) return; // no physics library (offline and never cached): the rest of the meadow still works

  const engine = (G.engine = M.Engine.create({ gravity: { x: 0, y: 2.2 }, enableSleeping: true }));
  engine.positionIterations = 10; engine.velocityIterations = 8;
  const world = engine.world;
  M.Composite.add(world, [
    M.Bodies.rectangle(G.W / 2, G.GROUND + 100, G.W + 600, 200, { isStatic: true, friction: 1 }),
    M.Bodies.rectangle(-40, 0, 80, 6000, { isStatic: true }),
    M.Bodies.rectangle(G.W + 40, 0, 80, 6000, { isStatic: true }),
  ]);

  const COLS = ['#ff8a7a', '#ffd84f', '#8fd16a', '#6cc3f0', '#b9a3e3', '#ff9ed2', '#ffb65c'];
  const KINDS = ['cube', 'brick', 'plank', 'pillar', 'tri', 'dome', 'wheel'];
  const NOTE = { cube: 2, brick: 1, plank: 0, pillar: 3, tri: 4, dome: 5, wheel: 6 };
  const OPT = () => ({ friction: 0.8, frictionStatic: 1, restitution: 0.05, density: 0.002, sleepThreshold: 40 });
  const dome = Array.from({ length: 11 }, (_, i) => ({ x: Math.cos(Math.PI + (i * Math.PI) / 10) * 62, y: Math.sin(Math.PI + (i * Math.PI) / 10) * 62 }));
  const make = (k, x, y) => {
    switch (k) {
      case 'cube': return M.Bodies.rectangle(x, y, 72, 72, { ...OPT(), chamfer: { radius: 7 } });
      case 'brick': return M.Bodies.rectangle(x, y, 130, 58, { ...OPT(), chamfer: { radius: 7 } });
      case 'plank': return M.Bodies.rectangle(x, y, 230, 30, { ...OPT(), chamfer: { radius: 8 } });
      case 'pillar': return M.Bodies.rectangle(x, y, 38, 150, { ...OPT(), chamfer: { radius: 7 } });
      case 'tri': return M.Bodies.fromVertices(x, y, [[{ x: 0, y: -56 }, { x: 64, y: 36 }, { x: -64, y: 36 }]], OPT());
      case 'dome': return M.Bodies.fromVertices(x, y, [dome], OPT());
      default: return M.Bodies.circle(x, y, 38, { ...OPT(), friction: 0.5 });
    }
  };
  // the top surface of a (possibly tilted) block at a given x, from its upper edges
  const surfaceY = (body, x) => {
    const vs = body.vertices; let top = null;
    for (let i = 0; i < vs.length; i++) {
      const a = vs[i], b = vs[(i + 1) % vs.length];
      if ((x - a.x) * (x - b.x) > 0 || a.x === b.x) continue;
      const y = a.y + ((x - a.x) / (b.x - a.x)) * (b.y - a.y);
      if (top === null || y < top) top = y;
    }
    return top;
  };
  G.blockSurface = (blk, x) => (blk.dead || blk.held || x < blk.body.bounds.min.x + 6 || x > blk.body.bounds.max.x - 6 ? null : surfaceY(blk.body, x));
  // first block surface crossed when falling from y0 to y1 at x (so critters can land on towers)
  G.blockTop = (x, y0, y1) => {
    let best = null;
    for (const b of G.blocks) {
      const s = G.blockSurface(b, x);
      if (s !== null && s >= y0 - 3 && s <= y1 + 3 && (!best || s < best.y)) best = { y: s, block: b };
    }
    return best;
  };
  // Helping hands for builders: a block let go close to level, just above the ground or another block,
  // straightens up and lines up (centred on the block below, or edge to edge) with a click.
  const DIM = { cube: [72, 72], brick: [130, 58], plank: [230, 30], pillar: [38, 150] }; // width, height
  const BASE = { tri: [64, 30.7], dome: [62, 26.3] }; // half width, centre to flat bottom
  const poseFor = (blk) => {
    const b = blk.body, k = blk.kind;
    if (k === 'wheel') return null;
    let a, hw, hh;
    if (DIM[k]) {
      const quarter = Math.round(b.angle / (Math.PI / 2));
      a = quarter * (Math.PI / 2);
      [hw, hh] = quarter & 1 ? [DIM[k][1] / 2, DIM[k][0] / 2] : [DIM[k][0] / 2, DIM[k][1] / 2];
    } else { a = Math.round(b.angle / G.TAU) * G.TAU; [hw, hh] = BASE[k]; }
    if (Math.abs(b.angle - a) > 0.4) return null; // too crooked to guess what was meant
    const x = b.position.x, bottom = b.position.y + hh;
    let sup = Math.abs(G.GROUND - bottom) < 40 ? { y: G.GROUND } : null;
    for (const o of G.blocks) {
      if (o === blk || o.held || o.dead) continue;
      const ob = o.body.bounds;
      if (ob.max.x < x - hw + 8 || ob.min.x > x + hw - 8) continue;
      const top = G.blockSurface(o, G.clamp(x, ob.min.x + 7, ob.max.x - 7));
      if (top !== null && Math.abs(top - bottom) < 40 && (!sup || top < sup.y)) sup = { y: top, o };
    }
    if (!sup) return null;
    let tx = x;
    if (sup.o) {
      const ob = sup.o.body.bounds, cx = sup.o.body.position.x;
      if (Math.abs(x - cx) < 28) tx = cx;
      else if (Math.abs(x - hw - ob.min.x) < 22) tx = ob.min.x + hw;
      else if (Math.abs(x + hw - ob.max.x) < 22) tx = ob.max.x - hw;
    }
    return { x: tx, y: sup.y - hh - 0.5, a, hh };
  };

  G.bumpBlocks = (x, y, vx, vy, r = 80) => {
    for (const b of G.blocks) {
      const p = b.body.position;
      if (b.held || Math.hypot(p.x - x, p.y - y) > r) continue;
      M.Sleeping.set(b.body, false);
      M.Body.setVelocity(b.body, { x: b.body.velocity.x + vx / 90, y: b.body.velocity.y + vy / 90 - 3 });
      M.Body.setAngularVelocity(b.body, b.body.angularVelocity + G.rand(-0.15, 0.15));
    }
  };

  class Block {
    constructor(kind, x, y, color, angle = 0) {
      this.kind = kind; this.color = color || G.pick(COLS); this.z = 6; this.draggable = true; this.isBlock = true;
      this.body = make(kind, x, y); M.Body.setAngle(this.body, angle);
      M.Composite.add(world, this.body);
      this.x = x; this.y = y; this.lastTap = -9; this.emblem = G.randi(0, 3);
      this.dark = G.mix(this.color, '#3b2f4a', 0.28); this.light = G.mix(this.color, '#ffffff', 0.45);
      G.blocks.push(this);
    }
    hit(px, py) { return M.Vertices.contains(this.body.vertices, { x: px, y: py }); }
    onTap() {
      const b = this.body; M.Sleeping.set(b, false);
      if (G.time - this.lastTap < 0.45) { M.Body.setAngle(b, b.angle + Math.PI / 2); M.Body.setAngularVelocity(b, 0); S().pop(); } // double tap: turn it
      else { M.Body.setVelocity(b, { x: b.velocity.x, y: -8 }); S().marimba(S().PENTA[NOTE[this.kind]]); }
      this.lastTap = G.time;
    }
    onDragStart(p) {
      const b = this.body; M.Sleeping.set(b, false); b.frictionAir = 0.06;
      this.pin = M.Constraint.create({ pointA: { x: p.x, y: p.y }, bodyB: b, pointB: M.Vector.sub(p, b.position), stiffness: 0.2, damping: 0.08, length: 0 });
      M.Composite.add(world, this.pin); S().click();
    }
    onDrag(p) {
      if (this.pin) this.pin.pointA = { x: G.clamp(p.x, 20, G.W - 20), y: Math.min(p.y, G.GROUND - 6) };
      const pose = poseFor(this);
      if (pose && !this.pose) S().tick();
      this.pose = pose; // shown as a ghost outline where it will settle
    }
    onDrop() {
      if (this.pin) M.Composite.remove(world, this.pin);
      this.pin = null; this.body.frictionAir = 0.01; this.pose = null;
      if (G.toybox && G.toybox.catchesBlock(this)) return G.toybox.swallow(this);
      const pose = poseFor(this), b = this.body;
      if (!pose) return;
      M.Body.setAngle(b, pose.a); M.Body.setPosition(b, { x: pose.x, y: pose.y });
      M.Body.setVelocity(b, { x: 0, y: 0 }); M.Body.setAngularVelocity(b, 0);
      S().snap(); G.burst('sparkle', pose.x, pose.y + pose.hh, 8, { colors: ['#ffffff', '#fff3b0'], g: 0, speed: 150, size: 9 });
    }
    remove() { this.dead = true; M.Composite.remove(world, this.body); G.blocks = G.blocks.filter((b) => b !== this); }
    draw(c) {
      const b = this.body, vs = b.vertices;
      if (this.held && this.pose) { // ghost of where it will settle if let go now
        const pz = this.pose, da = pz.a - b.angle, cs = Math.cos(da), sn = Math.sin(da);
        c.save(); c.setLineDash([10, 8]); c.lineDashOffset = -G.time * 30;
        c.strokeStyle = '#ffffff'; c.lineWidth = 4; c.fillStyle = 'rgba(255,255,255,.25)'; c.beginPath();
        vs.forEach((v, i) => { const rx = v.x - b.position.x, ry = v.y - b.position.y, X = pz.x + rx * cs - ry * sn, Y = pz.y + rx * sn + ry * cs; i ? c.lineTo(X, Y) : c.moveTo(X, Y); });
        c.closePath(); c.fill(); c.stroke(); c.restore();
      }
      G.path(c, this.color, (p) => { vs.forEach((v, i) => (i ? p.lineTo(v.x, v.y) : p.moveTo(v.x, v.y))); p.closePath(); }, 5);
      c.translate(b.position.x, b.position.y); c.rotate(b.angle);
      c.fillStyle = this.light; c.strokeStyle = this.dark; c.lineWidth = 4; c.lineCap = 'round';
      switch (this.kind) {
        case 'cube':
          c.fillStyle = this.dark;
          if (this.emblem === 0) { c.beginPath(); G.starPath(c, 0, 2, 22, 10, 5); c.fill(); }
          else if (this.emblem === 1) { c.beginPath(); G.heartPath(c, 0, 4, 20); c.fill(); }
          else if (this.emblem === 2) { c.beginPath(); c.arc(0, 0, 18, 0, G.TAU); c.fill(); }
          else { c.beginPath(); c.moveTo(0, -18); c.lineTo(18, 14); c.lineTo(-18, 14); c.closePath(); c.fill(); }
          break;
        case 'brick': for (const x of [-32, 32]) { c.beginPath(); c.arc(x, 0, 11, 0, G.TAU); c.fill(); c.stroke(); } break;
        case 'plank': for (const y of [-5, 5]) { c.beginPath(); c.moveTo(-90, y); c.quadraticCurveTo(0, y + (y > 0 ? 4 : -4), 90, y); c.stroke(); } break;
        case 'pillar': for (const y of [-45, 0, 45]) { c.beginPath(); c.moveTo(-12, y); c.lineTo(12, y); c.stroke(); } break;
        case 'tri': c.beginPath(); c.moveTo(0, -24); c.lineTo(28, 20); c.lineTo(-28, 20); c.closePath(); c.fill(); break;
        case 'dome': c.fillStyle = this.dark; c.beginPath(); c.arc(0, 0, 24, Math.PI, 0); c.closePath(); c.fill(); break;
        default:
          c.beginPath(); c.arc(0, 0, 14, 0, G.TAU); c.fill(); c.stroke();
          for (let i = 0; i < 4; i++) { const a = (i * Math.PI) / 2; c.beginPath(); c.moveTo(Math.cos(a) * 16, Math.sin(a) * 16); c.lineTo(Math.cos(a) * 30, Math.sin(a) * 30); c.stroke(); }
      }
    }
  }

  // steps the physics and keeps each block's x/y current for sorting and culling
  class Physics {
    constructor() { this.pickable = false; this.always = true; this.acc = 0; this.z = -20; }
    update(dt) {
      this.acc = Math.min(this.acc + dt, 0.05);
      while (this.acc >= 1 / 60) { M.Engine.update(engine, 1000 / 60); this.acc -= 1 / 60; }
      for (const b of G.blocks) { b.x = b.body.position.x; b.y = b.body.position.y + 40; }
    }
  }
  let lastClack = 0;
  M.Events.on(engine, 'collisionStart', (ev) => {
    for (const pr of ev.pairs) {
      const a = pr.bodyA, b = pr.bodyB, v = Math.hypot(a.velocity.x - b.velocity.x, a.velocity.y - b.velocity.y);
      const x = (a.isStatic ? b : a).position.x;
      if (v > 3 && G.time - lastClack > 0.05 && x > G.view.x0 && x < G.view.x1) { lastClack = G.time; S().clack(v); }
    }
  });

  // ---------- the toy box ----------
  class ToyBox {
    constructor(x) { this.x = x; this.y = G.GROUND - 1; this.z = 5; this.lid = 0; this.sq = new G.Spring(200, 8); this.bag = []; G.toybox = this; }
    hit(px, py) { return Math.abs(px - this.x) < 105 && py > this.y - 150 && py < this.y; }
    catchesBlock(b) { const p = b.body.position; return Math.abs(p.x - this.x) < 100 && p.y > this.y - 230 && p.y < this.y - 40; }
    swallow(b) {
      b.remove(); S().gulp(); this.sq.kick(3); this.open(0.5);
      G.burst('sparkle', this.x, this.y - 130, 10, { colors: G.CONFETTI, g: 0, speed: 180, size: 10 });
    }
    open(hold = 0.8) { G.tween(this, { lid: 1 }, 0.25, G.ease.outBack, () => G.after(hold, () => G.tween(this, { lid: 0 }, 0.35, G.ease.inOut))); }
    onTap() {
      this.sq.kick(3); this.open();
      if (G.blocks.length >= 45) { S().boop(0); return; }
      if (!this.bag.length) this.bag = KINDS.slice().sort(() => Math.random() - 0.5);
      const blk = new Block(this.bag.pop(), this.x, this.y - 190);
      M.Body.setVelocity(blk.body, { x: G.rand(1.5, 3.5), y: -13 }); M.Body.setAngularVelocity(blk.body, G.rand(-0.06, 0.06)); // lands just beside the box
      G.add(blk); S().pop(); S().boing(1.2);
    }
    update(dt) { this.sq.update(dt); }
    draw(c) {
      const q = G.clamp(this.sq.x, -0.25, 0.25);
      c.fillStyle = 'rgba(40,60,20,.16)'; c.beginPath(); c.ellipse(this.x, this.y + 6, 120, 14, 0, 0, G.TAU); c.fill();
      c.translate(this.x, this.y); c.scale(1 + q * 0.4, 1 - q * 0.4);
      c.save(); c.translate(-100, -140); c.rotate(-this.lid * 1.7);
      G.rrect(c, 0, -22, 200, 26, 10, '#6cc3f0', 5); c.restore();
      G.rrect(c, -100, -140, 200, 140, 14, '#ffd84f', 6);
      ['#ff8a7a', '#8fd16a', '#b9a3e3'].forEach((col, i) => G.rrect(c, -100, -112 + i * 36, 200, 16, 0, col, 0));
      G.rrect(c, -100, -140, 200, 140, 14, null, 6);
      G.path(c, '#ffffff', (p) => G.starPath(p, 0, -70, 30, 13, 5), 5);
    }
  }

  G.addBlock = (kind, x, y, color, angle) => G.add(new Block(kind, x, y, color, angle));
  G.physics = new Physics();
  Object.assign(G, { Block, ToyBox, BLOCK_KINDS: KINDS });
})();

// Wiggle Meadow — the critters: tap, tickle, carry, toss, feed, seat them, and let them play.
(() => {
  const G = window.G, S = () => G.sfx;
  const SPECIES = {
    bunny: { body: '#ffc6d6', belly: '#fff1f5', size: 1, pitch: 1.25, voice: (p) => S().squeak(p) },
    bear: { body: '#c98d5b', belly: '#efcfa6', size: 1.12, pitch: 0.8, voice: (p) => S().hum(p) },
    cat: { body: '#ffae5c', belly: '#ffe4c4', size: 0.95, pitch: 1.1, voice: (p) => S().meow(p) },
    frog: { body: '#86cf6b', belly: '#dcf3bd', size: 0.95, pitch: 0.9, voice: () => S().ribbit() },
    chick: { body: '#ffdf5e', belly: '#fff3b0', feet: '#ffa53c', size: 0.74, pitch: 1.4, voice: (p) => S().peep(p) },
    penguin: { body: '#46557a', belly: '#ffffff', feet: '#ffa53c', size: 0.95, pitch: 1.05, voice: (p) => S().honk(p) },
    mouse: { body: '#bdb6cf', belly: '#f1ebf8', size: 0.82, pitch: 1.6, voice: (p) => S().squeak(p) },
    pup: { body: '#f3d3a6', belly: '#fff3e2', size: 1, pitch: 1.1, voice: (p) => S().bark(p) },
  };
  const GRAV = 2300;
  const waterAt = (x) => G.waters.find((w) => w.inside(x));

  class Critter {
    constructor(kind, x, y = G.GROUND) {
      Object.assign(this, SPECIES[kind]);
      this.kind = kind; this.x = x; this.y = y; this.floor = G.floorFor(y); this.homeX = x;
      this.vx = 0; this.vy = 0; this.z = 7; this.s = this.size; this.draggable = true; this.dragSlop = 24;
      this.state = 'idle'; this.stateT = G.rand(1, 3);
      this.sq = new G.Spring(230, 10); this.tilt = new G.Spring(90, 5);
      this.rot = 0; this.spin = 0; this.swing = 0; this.hop = 0; this.dir = 1;
      this.blink = 0; this.blinkT = G.rand(1, 4); this.mood = 'open'; this.moodT = 0;
      this.mouth = 'smile'; this.mouthT = 0; this.armT = 0; this.tongue = 0; this.flap = 0;
      this.lx = 0; this.ly = 0; this.giggleT = 0; this.dizzyT = 0; this.zT = 0; this.noteT = 0; this.seat = null;
    }
    hit(px, py) {
      const s = this.s, dx = (px - this.x) / (58 * s), dy = (py - (this.y - 72 * s)) / (88 * s);
      return dx * dx + dy * dy < 1;
    }
    say(mood = 'happy', mouth = 'open', t = 0.8) { this.mood = mood; this.mouth = mouth; this.moodT = this.mouthT = t; }
    setState(st, t = 0) { this.state = st; this.stateT = t; }
    jump(vy = -780, vx = 0) {
      this.leaveSeat();
      this.setState('air'); this.vy = vy * (this.kind === 'chick' ? 0.8 : 1); this.vx = vx; this.y -= 2; this.sq.kick(-2.5);
    }
    sit(seat) {
      seat.occupant = this; this.seat = seat; this.setState('ride'); this.rot = 0; this.spin = 0;
      this.sq.kick(2.5); this.say(seat.kind === 'bed' ? 'closed' : 'happy', 'open', 1);
      seat.kind === 'bed' ? S().snore() : S().giggle(this.pitch);
      seat.onSit && seat.onSit(this);
    }
    leaveSeat() {
      if (!this.seat) return;
      const seat = this.seat; seat.occupant = null; this.seat = null;
      seat.onLeave && seat.onLeave(this);
    }

    // ---------- interactions ----------
    onTap() {
      if (this.state === 'ride') {
        const v = this.seat.fling ? this.seat.fling() : { vx: G.rand(-200, 200), vy: -700 };
        this.jump(v.vy, v.vx); this.floor = G.floorFor(this.y); this.say('happy', 'open', 0.8); S().wheee(this.pitch); return;
      }
      if (this.state === 'sleep') {
        this.say('wide', 'o', 0.8); this.jump(-500); S().squeak(this.pitch); this.wakeUntil = G.time + 6; return;
      }
      if (this.state === 'held') return;
      const r = G.randi(0, 4);
      if (r === 0) { this.jump(); this.spin = G.pick([0, 0, G.TAU]) * G.pick([-1, 1]); S().boing(this.pitch); this.say(); S().giggle(this.pitch); }
      else if (r === 1) { this.say('happy', 'open', 1.2); G.burst('heart', this.x, this.y - 150 * this.s, 6, { colors: ['#ff6f91', '#ff9ec0'], up: 250, g: -80, speed: 120, size: 13 }); this.voice(this.pitch); }
      else if (r === 2) { this.setState('dance', 2.4); this.say('happy', 'open', 2.4); S().tada(); }
      else if (r === 3) { this.armT = 1.4; this.say('happy', 'smile', 1.4); this.voice(this.pitch); }
      else this.special();
      this.sq.kick(1.5);
    }
    special() {
      const k = this.kind;
      this.voice(this.pitch); this.say('happy', 'open', 1);
      if (k === 'bunny') { this.jump(-1150); S().boing(1.3); }
      else if (k === 'chick') { this.jump(-700); this.flap = 1.2; G.burst('leaf', this.x, this.y - 50, 5, { colors: ['#fff3b0', '#ffe066'], size: 7, g: 120 }); }
      else if (k === 'frog') { this.tongue = 0.5; S().pop(); }
      else if (k === 'bear') { for (let i = 0; i < 4; i++) G.after(i * 0.18, () => this.sq.kick(1.8)); S().giggle(0.6); }
      else if (k === 'penguin') { this.flap = 1; this.tilt.kick(6); G.after(0.3, () => this.tilt.kick(-6)); }
      else if (k === 'mouse') { this.jump(-900); this.spin = G.TAU * G.pick([-1, 1]); }
      else { this.jump(-650); this.spin = G.TAU; }
    }
    onRub() {
      if (this.state === 'held' || G.time < this.giggleT) return;
      this.giggleT = G.time + 0.9;
      if (this.state === 'sleep') { this.sq.kick(0.8); S().snore(); return; }
      this.say('happy', 'open', 0.9); this.tilt.kick(G.pick([-3, 3])); this.sq.kick(1);
      S().giggle(this.pitch);
      if (Math.random() < 0.6) G.spawn('heart', this.x + G.rand(-30, 30), this.y - 150 * this.s, { vy: -90, life: 1, size: 11, color: '#ff7aa2' });
    }
    onDragStart() {
      this.leaveSeat();
      this.setState('held'); this.say('wide', 'o', 99); S().wheee(this.pitch);
    }
    onDrag(p, rec) {
      const y = p.y + rec.oy;
      this.x = G.clamp(p.x + rec.ox, 30, G.W - 30);
      this.y = Math.min(y, G.floorFor(y));
      this.swing = G.lerp(this.swing, G.clamp(-rec.vx * 0.0011, -0.9, 0.9), 0.2);
      this.grabY = -rec.oy;
    }
    onDrop(p, rec) {
      this.floor = G.floorFor(this.y); this.homeX = this.x;
      const seat = G.seats.filter((s) => !s.occupant && !s.disabled && s.owner !== this && G.dist(s.x, s.y, this.x, this.y) < (s.radius || 90))
        .sort((a, b) => G.dist(a.x, a.y, this.x, this.y) - G.dist(b.x, b.y, this.x, this.y))[0];
      if (seat) return this.sit(seat);
      this.vx = G.clamp(rec.vx * 0.8, -1600, 1600); this.vy = G.clamp(rec.vy * 0.8, -1800, 1800);
      this.setState('air'); this.spin = Math.abs(this.vx) > 900 ? Math.sign(this.vx) * G.TAU : 0;
      this.say(Math.abs(this.vx) + Math.abs(this.vy) > 900 ? 'happy' : 'open', 'open', 0.6);
      if (Math.abs(this.vx) + Math.abs(this.vy) > 900) S().wheee(this.pitch * 1.2);
    }
    eat(food) {
      food.dead = true;
      if (this.state !== 'ride') this.setState('eat', 1.6);
      this.say('closed', 'chew', 1.6); S().chomp();
      G.burst('dust', this.x, this.y - 80 * this.s, 8, { color: food.crumb || '#ffe1a8', size: 6, g: 500, up: 120, speed: 140 });
      G.after(1.6, () => {
        this.say('happy', 'open', 1); S().yum(this.pitch); this.sq.kick(2);
        G.burst('heart', this.x, this.y - 150 * this.s, 5, { colors: ['#ff6f91', '#ffb3c8'], up: 220, g: -60, speed: 110, size: 12 });
        if (food.onEaten) food.onEaten(this);
      });
    }

    // ---------- behaviour ----------
    think() {
      if (G.night > 0.7 && !(this.wakeUntil > G.time)) { this.setState('sleep', 99); this.zT = 0.5; return; }
      const food = G.things.find((t) => t.isFood && t.onGround && !t.held && !t.claimed && t.floor === this.floor && Math.abs(t.x - this.x) < 520);
      if (food) { food.claimed = this; this.target = food; this.tx = food.x - Math.sign(food.x - this.x || 1) * 40; return this.setState('walk', 6); }
      const ball = G.ball;
      if (ball && !ball.held && ball.onGround && ball.floor === this.floor && Math.random() < 0.35 && Math.abs(ball.x - this.x) < 600) {
        this.target = ball; this.tx = ball.x - Math.sign(ball.x - this.x || 1) * 55; return this.setState('walk', 5);
      }
      if (Math.random() < 0.55) {
        this.target = null;
        let tx = G.clamp(this.homeX + G.rand(-340, 340), 70, G.W - 70);
        const w = this.floor === G.GROUND && waterAt(tx);
        if (w) tx = w.bank(tx);
        this.tx = G.clamp(tx, 70, G.W - 70); return this.setState('walk', 6);
      }
      this.setState('idle', G.rand(1.5, 4));
      if (Math.random() < 0.3) this.say('happy', 'smile', 1);
    }
    land() {
      const impact = this.vy;
      const w = this.floor === G.GROUND && waterAt(this.x);
      if (w) {
        w.splash(this.x); this.say('wide', 'o', 1);
        this.vx = Math.sign(w.bank(this.x) - this.x || 1) * 460; this.vy = -900; this.y = this.floor - 1; return;
      }
      this.y = this.floor; this.sq.kick(Math.min(4.2, impact * 0.0026)); this.rot = 0; this.spin = 0;
      if (impact > 1500) { this.dizzyT = 1.8; this.say('closed', 'o', 1.8); S().thud(); S().boing(0.7); }
      else if (impact > 500) S().thud();
      if (impact > 420) { this.vy = -impact * 0.32; this.vx *= 0.6; this.y -= 1; return; }
      this.vx = 0; this.vy = 0; this.setState('idle', this.dizzyT > 0 ? 1.8 : G.rand(0.6, 1.5));
      G.burst('dust', this.x, this.floor, 5, { color: this.floor === G.GROUND ? '#d8e7b0' : '#c9a27a', size: 7, g: -40, speed: 90, angle: -Math.PI / 2, spread: 1.4 });
    }
    update(dt) {
      const sq = this.sq.update(dt); this.tilt.update(dt);
      if ((this.blinkT -= dt) < 0) { this.blinkT = G.rand(1.5, 4.5); this.blink = 1; }
      this.blink = Math.max(0, this.blink - dt * 7);
      if ((this.moodT -= dt) < 0) this.mood = 'open';
      if ((this.mouthT -= dt) < 0) this.mouth = 'smile';
      this.armT -= dt; this.tongue = Math.max(0, this.tongue - dt); this.flap = Math.max(0, this.flap - dt);
      this.dizzyT = Math.max(0, this.dizzyT - dt);
      if (this.state !== 'held') this.swing *= 0.9;
      const fresh = G.time - G.look.t < 2.5 && Math.abs(G.look.x - this.x) < 900 && Math.abs(G.look.y - this.y) < 700;
      const tx = fresh ? G.clamp((G.look.x - this.x) / 300, -1, 1) : this.state === 'walk' ? this.dir * 0.7 : Math.sin(G.time * 0.7 + this.x) * 0.4;
      const ty = fresh ? G.clamp((G.look.y - (this.y - 100)) / 300, -1, 1) : 0;
      this.lx = G.lerp(this.lx, tx, 0.1); this.ly = G.lerp(this.ly, ty, 0.1);

      switch (this.state) {
        case 'held': break;
        case 'ride': {
          const st = this.seat;
          if (!st) { this.setState('air'); break; }
          this.x = st.x; this.y = st.y; this.rot = st.rot || 0;
          if (st.kind === 'bed' && (this.zT -= dt) < 0) { this.zT = 1.6; this.mood = 'closed'; this.moodT = 2; G.spawn('zzz', this.x + 30, this.y - 140 * this.s, { vy: -40, vx: 25, life: 2, size: 12, color: '#dfe6ff' }); }
          break;
        }
        case 'air':
          this.vy += GRAV * dt; this.x += this.vx * dt; this.y += this.vy * dt;
          if (this.spin) this.rot += this.spin * dt * 1.6;
          if (this.x < 40 || this.x > G.W - 40) { this.x = G.clamp(this.x, 40, G.W - 40); this.vx *= -0.6; this.tilt.kick(4); }
          if (this.y < G.TOP + 80 && this.vy < 0) { this.y = G.TOP + 80; this.vy = 0; }
          if (this.floor === G.UNDER && this.y < G.GROUND + 480 && this.vy < 0) this.vy *= 0.5; // tunnel ceiling
          if (this.vy > 0 && G.catchers.some((c) => c.catches(this))) break;
          if (this.y >= this.floor && this.vy > 0) this.land();
          break;
        case 'walk': {
          const d = this.tx - this.x;
          this.dir = Math.sign(d) || this.dir;
          const speed = this.kind === 'chick' || this.kind === 'mouse' ? 150 : this.kind === 'penguin' ? 90 : 115;
          this.x += this.dir * Math.min(Math.abs(d), speed * dt);
          this.hop += dt * (this.kind === 'frog' ? 7 : this.kind === 'penguin' ? 14 : 10);
          const tg = this.target;
          if (tg && (tg.dead || tg.held)) { if (tg.claimed === this) tg.claimed = null; this.target = null; this.setState('idle', 1); break; }
          if (tg && tg.isFood && Math.abs(tg.x - this.x) < 60) { this.eat(tg); this.target = null; break; }
          if (tg === G.ball && Math.abs(tg.x - this.x) < 70) { tg.kick(this.dir, this); this.say('happy', 'open', 0.8); S().giggle(this.pitch); this.target = null; this.setState('idle', 1.2); break; }
          if (Math.abs(d) < 2 || (this.stateT -= dt) < 0) { if (tg && tg.claimed === this) tg.claimed = null; this.setState('idle', G.rand(1, 3)); }
          break;
        }
        case 'dance':
          this.hop += dt * 12;
          if ((this.noteT -= dt) < 0) { this.noteT = 0.3; G.spawn('note', this.x + G.rand(-40, 40), this.y - 170 * this.s, { vy: -110, vx: G.rand(-40, 40), life: 1.1, size: 15, color: G.pick(G.CONFETTI) }); }
          if ((this.stateT -= dt) < 0) this.setState('idle', 1);
          break;
        case 'sleep':
          if ((this.zT -= dt) < 0) { this.zT = 1.6; G.spawn('zzz', this.x + 30 * this.s, this.y - 150 * this.s, { vy: -40, vx: 25, life: 2, size: 12, color: '#dfe6ff' }); }
          if (G.night < 0.5) { this.setState('idle', 1); this.sq.kick(-2); this.say('happy', 'open', 1); this.voice(this.pitch); }
          break;
        default: // idle, eat
          if (this.y < this.floor - 1) { this.setState('air'); break; }
          if ((this.stateT -= dt) < 0) this.think();
      }
      this.sqv = sq;
    }

    // ---------- drawing ----------
    draw(c) {
      const s = this.s, t = G.time, st = this.state;
      if (st !== 'ride') {
        const lift = this.floor - this.y, sh = G.clamp(1 - lift / 700, 0.35, 1);
        c.fillStyle = 'rgba(40,40,20,.18)';
        c.beginPath(); c.ellipse(this.x, this.floor + 4, 44 * s * sh, 10 * s * sh, 0, 0, G.TAU); c.fill();
      }
      let yOff = 0, rot = this.rot + this.tilt.x * 0.1 + this.swing;
      if (st === 'walk') yOff = -Math.abs(Math.sin(this.hop)) * (this.kind === 'frog' ? 26 : this.kind === 'penguin' ? 5 : 12) * s;
      if (st === 'walk' && this.kind === 'penguin') rot += Math.sin(this.hop) * 0.12;
      if (st === 'dance') { yOff = -Math.abs(Math.sin(this.hop)) * 16 * s; rot += Math.sin(this.hop * 0.5) * 0.28; }
      if (this.dizzyT > 0) rot += Math.sin(t * 9) * 0.12;
      const sleepy = st === 'sleep' || (st === 'ride' && this.seat && this.seat.kind === 'bed');
      const breathe = sleepy ? Math.sin(t * 1.6) * 0.04 : Math.sin(t * 2.6 + this.x) * 0.018;
      const sq = G.clamp(this.sqv || 0, -0.45, 0.45) + breathe;
      c.translate(this.x + (this.offX || 0), this.y + yOff + (this.offY || 0));
      const py = st === 'held' ? this.grabY || -100 * s : 0;
      c.translate(0, py); c.rotate(rot); c.translate(0, -py);
      c.scale(s * (1 + sq * 0.7), s * (1 - sq));

      const kick = st === 'held' || st === 'air' ? Math.sin(t * 22) * 5 : st === 'fly' ? Math.sin(t * 6) * 3 : 0;
      const sit = st === 'sleep' || st === 'ride' ? 6 : 0;
      if (this.back) this.back(c, t);
      for (const d of [-1, 1]) G.ellipse(c, d * 19, -7 + kick * d + sit, 15, 9, this.feet || this.body);
      if (this.kind === 'cat' || this.kind === 'mouse') this.tail(c, t);
      G.ellipse(c, 0, -42 + sit, 38, 36 - sit * 0.5, this.body);
      G.ellipse(c, 0, -38 + sit, 24, 21, this.belly, 0);
      if (this.chest) this.chest(c, t, sit);
      for (const d of [-1, 1]) {
        let a = d * (0.35 + (st === 'held' ? 0.9 : 0));
        if (d === 1 && this.armT > 0) a = 2.1 + Math.sin(t * 16) * 0.5;
        if (st === 'dance') a = d * (1.2 + Math.sin(t * 12 + d) * 0.6);
        if (st === 'ride' && !sleepy) a = d * 1.3;
        if (this.flap > 0 || ((this.kind === 'chick' || this.kind === 'penguin') && st === 'air')) a = d * (1.2 + Math.sin(t * 40) * 0.6);
        if (st === 'ride' && this.seat && this.seat.kind === 'carry') a = d * 2.8; // hanging on with both hands
        if (this.armPose) a = this.armPose(d, a, t);
        c.save(); c.translate(d * 33, -58 + sit); c.rotate(-a);
        G.ellipse(c, 0, 12, 10, 17, this.body); c.restore();
      }
      c.translate(0, sit * 1.5);
      this.ears(c, t);
      G.circle(c, 0, -98, this.kind === 'bear' ? 46 : 43, this.body);
      this.face(c, t, sleepy);
      if (this.dizzyT > 0) for (let i = 0; i < 3; i++) {
        const a = t * 5 + (i * G.TAU) / 3;
        G.path(c, '#ffd84a', (p) => G.starPath(p, Math.cos(a) * 42, -150 + Math.sin(a) * 10, 9, 4), 2.5);
      }
    }
    tail(c, t) {
      const w = Math.sin(t * 3) * 14, m = this.kind === 'mouse';
      c.lineCap = 'round';
      for (const [col, lw] of [[G.INK, m ? 10 : 16], [m ? '#ffb3c8' : this.body, m ? 4 : 7]]) {
        c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); c.moveTo(28, -24);
        c.quadraticCurveTo(72, -30, 58 + w, -78); c.stroke();
      }
    }
    ears(c, t) {
      const k = this.kind, e = this.tilt.x * 0.2 + this.swing * 0.5;
      if (k === 'bunny') for (const d of [-1, 1]) {
        c.save(); c.translate(d * 18, -130); c.rotate(d * 0.18 - e + Math.sin(t * 2 + d) * 0.05);
        G.ellipse(c, 0, -32, 13, 36, this.body); G.ellipse(c, 0, -30, 6, 26, '#ff9fbb', 0); c.restore();
      } else if (k === 'bear') for (const d of [-1, 1]) {
        G.circle(c, d * 34, -132, 16, this.body); G.circle(c, d * 34, -132, 8, this.belly, 0);
      } else if (k === 'mouse') for (const d of [-1, 1]) {
        G.circle(c, d * 36, -134, 25, this.body); G.circle(c, d * 36, -134, 14, '#ffb3c8', 0);
      } else if (k === 'cat') for (const d of [-1, 1]) {
        G.path(c, this.body, (p) => { p.moveTo(d * 40, -112); p.lineTo(d * 34, -158); p.lineTo(d * 8, -136); p.closePath(); });
        G.path(c, '#ff9fbb', (p) => { p.moveTo(d * 33, -122); p.lineTo(d * 31, -146); p.lineTo(d * 17, -134); p.closePath(); }, 0);
      } else if (k === 'pup') for (const d of [-1, 1]) {
        c.save(); c.translate(d * 34, -124); c.rotate(d * (0.35 + Math.sin(t * 3 + d) * 0.06) + e * 0.6 + (this.earFlap || 0) * d);
        G.ellipse(c, 0, 28, 15, 34, '#c98d5b'); c.restore();
      } else if (k === 'frog') for (const d of [-1, 1]) G.circle(c, d * 21, -134, 19, this.body);
      else if (k === 'chick') for (const i of [-1, 0, 1]) G.ellipse(c, i * 7, -143, 5, 12, this.body, 4, i * 0.4);
    }
    face(c, t, sleepy) {
      const k = this.kind, lx = this.lx, ly = this.ly;
      const mood = sleepy ? 'closed' : this.mood;
      if (k === 'penguin') G.ellipse(c, lx * 3, -94, 32, 28, '#ffffff', 0);
      const ey = k === 'frog' ? -135 : -102;
      G.eyes(c, lx * 5, ey + ly * 4, k === 'frog' ? 21 : 16, 5.5, lx, ly, this.blink, mood);
      G.cheeks(c, lx * 3, -84, 27, 7.5);
      if (k === 'bear') { G.ellipse(c, lx * 4, -82, 18, 13, this.belly, 0); G.ellipse(c, lx * 4, -89, 7, 5, G.INK, 0); }
      if (k === 'pup') { G.ellipse(c, lx * 4, -82, 17, 12, this.belly, 0); G.ellipse(c, lx * 4, -90, 8, 6, G.INK, 0); }
      if (k === 'bunny' || k === 'mouse') G.ellipse(c, lx * 4, -90, 5, 3.5, '#ff7fa3', 0);
      if (k === 'cat' || k === 'mouse') {
        c.strokeStyle = G.INK; c.lineWidth = 2.5;
        for (const d of [-1, 1]) for (const a of [-0.15, 0.15]) { c.beginPath(); c.moveTo(d * 22, -86); c.lineTo(d * 46, -86 + a * 40); c.stroke(); }
      }
      const mx = lx * 5, my = k === 'bear' ? -78 : -80;
      if (k === 'chick' || k === 'penguin') {
        const o = this.mouth === 'smile' ? 0 : 5;
        G.path(c, '#ff9d3c', (p) => { p.moveTo(mx - 9, my - 6); p.lineTo(mx + 9, my - 6); p.lineTo(mx, my + 5 + o); p.closePath(); }, 3);
        return;
      }
      if (this.tongue > 0) {
        const L = Math.sin((this.tongue / 0.5) * Math.PI) * 60;
        c.strokeStyle = '#ff6f91'; c.lineWidth = 7; c.beginPath(); c.moveTo(mx, my); c.lineTo(mx + L * 0.8, my - L * 0.6); c.stroke();
      }
      const m = this.mouth;
      if (m === 'open' || (m === 'chew' && Math.sin(t * 22) > 0)) {
        const w = k === 'frog' ? 16 : 10;
        G.path(c, '#7a2e45', (p) => p.ellipse(mx, my + 2, w, m === 'chew' ? 5 : 9, 0, 0, G.TAU), 3);
      } else if (m === 'o') G.ellipse(c, mx, my + 2, 5, 6, '#7a2e45', 3);
      else G.smile(c, mx, my - 1, k === 'frog' ? 20 : 9);
    }
  }
  G.Critter = Critter;
})();

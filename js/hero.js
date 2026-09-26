// Wiggle Meadow — Super Pup. Tap the pup with the star collar: it spins into a cape and mask and takes off.
// While super it flies and hovers: drag it anywhere in the air, tap it for super moves, and drop a friend
// onto it for a ride. After a long rest (sooner at night) it lands and turns back, ready to transform again.
(() => {
  const G = window.G, S = () => G.sfx;
  const CAPE = '#ff5b5b', MASK = '#4a6fd6';

  class Hero extends G.Critter {
    constructor(x, y) {
      super('pup', x, y);
      this.isSuper = false; this.cape = 0; this.maskA = 0; this.busy = false; this.pose = 0; this.earFlap = 0;
      this.tx = x; this.ty = this.y; this.pickT = 3; this.idleT = 0; this.loop = 0; this.loopDir = 1; this.zoomT = 0; this.trailT = 0;
      this.carry = { kind: 'carry', owner: this, x, y, rot: 0, occupant: null, disabled: true, radius: 170,
        fling: () => ({ vx: this.vx * 0.6, vy: Math.min(this.vy, 0) - 250 }) };
      G.seats.push(this.carry);
    }
    get draggable() { return !this.busy; }
    set draggable(v) {} // the base class sets this; the pup decides for itself

    // where it likes to fly: the sky, the meadow air, or the tunnel it is in
    band() {
      if (this.y < -60) return [G.TOP + 170, -100];
      if (this.y < G.GROUND + 185) return [150, G.GROUND - 90];
      return [Math.min(G.ceilingAt(this.x) + 160, G.UNDER - 60), G.UNDER - 40];
    }

    // ---------- interactions ----------
    onTap() {
      if (this.busy) return;
      if (!this.isSuper) return this.state === 'ride' || this.state === 'held' || this.state === 'sleep' ? super.onTap() : this.transform();
      this.idleT = 0; this.superMove();
    }
    onDragStart(p, rec) { super.onDragStart(p, rec); this.idleT = 0; }
    onDrop(p, rec) {
      if (!this.isSuper) return super.onDrop(p, rec);
      this.setState('fly'); this.idleT = 0; this.pickT = 3.5; this.floor = G.floorFor(this.y);
      this.vx = G.clamp(rec.vx * 0.6, -1400, 1400); this.vy = G.clamp(rec.vy * 0.6, -1400, 1400);
      const [y0, y1] = this.band();
      this.tx = G.clamp(this.x + this.vx * 0.35, 80, G.W - 80); this.ty = G.clamp(this.y + this.vy * 0.35, y0, y1);
      this.homeX = this.tx;
      if (Math.hypot(this.vx, this.vy) > 700) { S().zoom(); this.zoomT = 0.8; } else S().whoosh();
      this.say('happy', 'open', 0.8);
    }
    transform() {
      this.busy = true; this.leaveSeat(); this.setState('transform'); this.vx = this.vy = 0;
      this.say('happy', 'open', 1.6); S().transform(); this.voice(this.pitch);
      G.tween(this, { rot: G.TAU * 2 }, 0.9, G.ease.inOut, () => (this.rot = 0));
      G.after(0.45, () => {
        this.isSuper = true;
        G.tween(this, { cape: 1, maskA: 1 }, 0.5, G.ease.outBack);
        G.burst('star', this.x, this.y - 80, 12, { colors: ['#ffd84f', '#fff3b0', '#ff8a7a'], g: 0, speed: 380, size: 14 });
        G.burst('sparkle', this.x, this.y - 80, 16, { colors: G.CONFETTI, g: 0, speed: 260, size: 11 });
      });
      G.after(0.95, () => { this.busy = false; this.takeOff(); S().tada(); });
    }
    takeOff() {
      this.setState('fly'); this.idleT = 0; this.pickT = 2.5; this.homeX = this.x; this.floor = G.floorFor(this.y);
      const [y0, y1] = this.band();
      this.tx = this.x; this.ty = G.clamp(this.y - 240, y0, y1); this.vy = -300;
      S().whoosh();
    }
    superMove() {
      this.say('happy', 'open', 1);
      const r = G.randi(0, 3);
      if (r === 0) this.doLoop();
      else if (r === 1) this.zoom();
      else if (r === 2) { this.pose = 1.2; S().tada(); G.burst('star', this.x, this.y - 90, 10, { colors: ['#ffd84f', '#fff3b0'], g: 0, speed: 300, size: 13 }); this.voice(this.pitch); }
      else { this.armT = 1.4; this.voice(this.pitch); G.burst('heart', this.x, this.y - 150, 5, { colors: ['#ff6f91', '#ffb3c8'], up: 200, g: -60, speed: 110, size: 12 }); }
    }
    doLoop() {
      if (this.loop > 0) return;
      this.loopDir = this.vx >= 0 ? 1 : -1; S().whoosh();
      G.tween(this, { loop: 1 }, 1.1, G.ease.inOut, () => { this.loop = 0; this.rot = 0; });
    }
    zoom() {
      const v = G.view, [y0, y1] = this.band(), dir = this.x < (v.x0 + v.x1) / 2 ? 1 : -1;
      this.tx = G.clamp(this.x + dir * G.rand(500, 800), Math.max(80, v.x0 + 120), Math.min(G.W - 80, v.x1 - 120));
      this.ty = G.rand(y0, y1); this.zoomT = 1.2; this.homeX = this.tx; this.pickT = 3; S().zoom();
    }
    powerDown() {
      if (this.busy) return;
      this.busy = true;
      const o = this.carry.occupant;
      if (o) { o.jump(-300, 0); o.floor = G.floorFor(o.y); }
      this.setState('transform');
      const floor = (this.floor = G.floorFor(this.y));
      const w = floor === G.GROUND && G.waters.find((q) => q.inside(this.x));
      const dur = G.clamp(Math.abs(floor - this.y) / 600, 0.6, 2.4);
      G.tween(this, { y: floor, x: w ? w.bank(this.x) : this.x, rot: 0 }, dur, G.ease.inOut, () => {
        this.offX = this.offY = 0; this.vx = this.vy = 0; this.sq.kick(2.5); S().powerDown();
        G.burst('sparkle', this.x, this.y - 80, 14, { colors: G.CONFETTI, g: 0, speed: 240, size: 10 });
        G.tween(this, { cape: 0, maskA: 0, rot: -G.TAU }, 0.6, G.ease.inOut, () => {
          this.rot = 0; this.isSuper = false; this.busy = false; this.homeX = this.x;
          this.setState('idle', 1.5); this.say('happy', 'open', 1);
        });
      });
    }

    // ---------- flying ----------
    update(dt) {
      if (!this.isSuper && this.state !== 'transform') {
        super.update(dt);
        this.carry.disabled = true; this.carry.x = this.x + 34; this.carry.y = this.y - 58;
        return;
      }
      const sq = this.sq.update(dt); this.tilt.update(dt); this.sqv = sq;
      if ((this.blinkT -= dt) < 0) { this.blinkT = G.rand(1.5, 4.5); this.blink = 1; }
      this.blink = Math.max(0, this.blink - dt * 7);
      if ((this.moodT -= dt) < 0) this.mood = 'open';
      if ((this.mouthT -= dt) < 0) this.mouth = 'smile';
      this.armT -= dt; this.pose = Math.max(0, this.pose - dt); this.zoomT = Math.max(0, this.zoomT - dt);
      const fresh = G.time - G.look.t < 2.5;
      this.lx = G.lerp(this.lx, fresh ? G.clamp((G.look.x - this.x) / 300, -1, 1) : G.clamp(this.vx / 300, -1, 1), 0.1);
      this.ly = G.lerp(this.ly, fresh ? G.clamp((G.look.y - (this.y - 100)) / 300, -1, 1) : G.clamp(this.vy / 400, -1, 1), 0.1);
      this.earFlap = G.lerp(this.earFlap, G.clamp(Math.hypot(this.vx, this.vy) / 900, 0, 0.9), 0.1);
      // a friend rides piggyback: tucked behind the pup, peeking over the shoulder away from the flight direction
      this.carry.disabled = !this.isSuper || this.busy;
      this.side = G.lerp(this.side || 1, Math.abs(this.vx) > 60 ? -Math.sign(this.vx) : this.side || 1, 0.08);
      this.carry.x = this.x + (this.offX || 0) + 34 * this.side; this.carry.y = this.y + (this.offY || 0) - 58;
      if (this.state !== 'fly') { this.offY = G.lerp(this.offY || 0, 0, 0.2); return; } // being carried or changing

      const [y0, y1] = this.band();
      if ((this.pickT -= dt) < 0) {
        this.pickT = G.rand(2.5, 5);
        this.tx = G.clamp(this.homeX + G.rand(-420, 420), 80, G.W - 80); this.ty = G.rand(y0, y1);
        if (Math.random() < 0.2) this.doLoop();
      }
      const k = this.zoomT > 0 ? 14 : 4.5, damp = this.zoomT > 0 ? 5.5 : 3.2;
      this.vx += ((this.tx - this.x) * k - this.vx * damp) * dt;
      this.vy += ((this.ty - this.y) * k - this.vy * damp) * dt;
      this.x = G.clamp(this.x + this.vx * dt, 40, G.W - 40);
      this.y = G.clamp(this.y + this.vy * dt, G.TOP + 120, this.floor - 20);
      if (this.loop > 0) {
        const a = this.loop * G.TAU;
        this.offX = Math.sin(a) * 70 * this.loopDir; this.offY = -(1 - Math.cos(a)) * 70; this.rot = -this.loopDir * a;
      } else {
        this.offX = G.lerp(this.offX || 0, 0, 0.2); this.offY = Math.sin(G.time * 2.4) * 8;
        this.rot = G.lerp(this.rot, G.clamp(this.vx * 0.0007, -0.45, 0.45), 0.12);
      }
      const sp = Math.hypot(this.vx, this.vy);
      if (sp > 380 && (this.trailT -= dt) < 0) {
        this.trailT = 0.03;
        G.spawn('sparkle', this.x + this.offX - Math.sign(this.vx) * 30, this.y + this.offY - 60, { vx: -this.vx * 0.1, vy: -this.vy * 0.1, life: 0.6, size: 9, color: G.pick(['#ffd84f', '#fff3b0', '#ff8a7a']) });
      }
      this.idleT += dt;
      if (this.idleT > (G.night > 0.7 ? 12 : 50)) this.powerDown();
    }

    // ---------- drawing: cape, collar/emblem, mask, super arms ----------
    armPose(d, a, t) {
      if (!this.isSuper || this.state === 'ride') return a;
      if (this.pose > 0) return d * 2.6;
      if (this.armT > 0 && d === 1) return a;
      if (this.state === 'held') return d * 1.9;
      const lead = Math.sign(this.vx) || 1;
      if (Math.hypot(this.vx, this.vy) > 260 || this.loop > 0) return d === lead ? d * 2.7 : d * 0.4;
      return d * (0.55 + Math.sin(t * 3 + d) * 0.12);
    }
    back(c, t) {
      if (this.cape < 0.02) return;
      const k = this.cape, sp = G.clamp(this.vx / 700, -1, 1);
      const flying = this.state === 'fly' || this.state === 'held' || this.loop > 0;
      const stream = flying ? -sp * 70 : 0, len = (72 + Math.abs(stream) * 0.3) * k, top = -66;
      const wl = Math.sin(t * 9) * 8 * k, wr = Math.sin(t * 9 + 1.7) * 8 * k;
      const bl = [-44 + stream, top + len + wl], br = [44 + stream, top + len + wr];
      G.path(c, CAPE, (p) => {
        p.moveTo(-24, top); p.lineTo(24, top);
        p.quadraticCurveTo(42 + stream * 0.5, top + len * 0.5, br[0], br[1]);
        p.quadraticCurveTo((bl[0] + br[0]) / 2, (bl[1] + br[1]) / 2 + 10 + Math.sin(t * 9 + 0.8) * 6, bl[0], bl[1]);
        p.quadraticCurveTo(-42 + stream * 0.5, top + len * 0.5, -24, top); p.closePath();
      }, 5);
      c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 4;
      c.beginPath(); c.moveTo(-8 + stream * 0.2, top + 10); c.quadraticCurveTo(stream * 0.4, top + len * 0.6, stream * 0.7 - 6, top + len - 6); c.stroke();
    }
    chest(c, t, sit) {
      if (this.cape > 0.05) {
        c.save(); c.translate(0, -38 + sit); c.scale(this.cape, this.cape);
        G.circle(c, 0, 0, 16, CAPE, 4);
        G.path(c, '#ffd84f', (p) => G.starPath(p, 0, 1, 11, 5, 5), 2.5);
        c.restore();
      }
      if (this.cape < 0.95) { // collar with a star tag: the hint that this pup is special
        G.rrect(c, -24, -57 + sit, 48, 10, 5, CAPE, 3);
        G.path(c, '#ffd84f', (p) => G.starPath(p, 0, -41 + sit, 8, 3.6, 5), 2.5);
      }
    }
    face(c, t, sleepy) {
      if (this.maskA > 0.02) {
        c.save(); c.translate(this.lx * 5, -102 + this.ly * 4); c.scale(this.maskA, this.maskA);
        const fl = Math.sin(t * 8) * 4;
        G.path(c, MASK, (p) => { p.moveTo(32, -4); p.lineTo(52, -14 + fl); p.lineTo(50, 4 + fl); p.closePath(); }, 3);
        G.path(c, MASK, (p) => { p.moveTo(-36, -8); p.quadraticCurveTo(0, -18, 36, -8); p.quadraticCurveTo(41, 6, 30, 12); p.quadraticCurveTo(0, 4, -30, 12); p.quadraticCurveTo(-41, 6, -36, -8); p.closePath(); }, 4);
        c.fillStyle = '#ffffff';
        for (const d of [-1, 1]) { c.beginPath(); c.ellipse(d * 16 + this.lx * 3, 0, 10, 9, 0, 0, G.TAU); c.fill(); }
        c.restore();
      }
      super.face(c, t, sleepy);
    }
    glow(c) {
      if (!this.isSuper) return;
      const x = this.x + (this.offX || 0), y = this.y + (this.offY || 0) - 40;
      const g = c.createRadialGradient(x, y, 5, x, y, 110);
      g.addColorStop(0, `rgba(255,220,120,${0.4 * G.night})`); g.addColorStop(1, 'rgba(255,220,120,0)');
      c.fillStyle = g; c.fillRect(x - 110, y - 110, 220, 220);
    }
  }
  G.Hero = Hero;
})();

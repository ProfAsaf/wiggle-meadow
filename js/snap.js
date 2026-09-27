// Wiggle Meadow — helping hands. While something is carried, the cool spot it's close to lights up and gets
// ready (a seat for a critter, a mouth or the soup pot for food, a head for a hat); let go anywhere near and it
// slides right in with a click. (Blocks do their own lining-up in blocks.js.)
(() => {
  const G = window.G, S = () => G.sfx;
  const ready = (c, t) => c instanceof G.Critter && c !== t && !c.held && c.state !== 'transform';
  const keyOf = (s) => s && (s.seat || s.pot || s.eater || s.wearer);

  // where a carried thing would go if let go right now
  G.findSnap = (t) => {
    let best = null;
    const consider = (d, max, o) => { if (d < max && (!best || d < best.d)) best = Object.assign({ d }, o); };
    if (t instanceof G.Critter) {
      for (const s of G.seats) {
        if (s.occupant || s.disabled || s.owner === t) continue;
        consider(G.dist(s.x, s.y, t.x, t.y), (s.radius || 110) + 40, { x: s.x, y: s.y - 34, r: 46, seat: s });
      }
    } else if (t.isFood) {
      if (G.pot && !(t instanceof G.Bowl)) consider(G.dist(t.x, t.y, G.pot.x, G.pot.rim), 170, { x: G.pot.x, y: G.pot.rim - 4, r: 74, pot: G.pot });
      for (const c of G.things) if (ready(c, t)) { const my = c.y + (c.offY || 0) - 82 * c.s; consider(G.dist(t.x, t.y, c.x, my), 150, { x: c.x, y: my, r: 38, eater: c }); }
    } else if (t.isWear) {
      const slot = G.WEAR[t.type].slot;
      for (const c of G.things) if (ready(c, t)) {
        const hy = c.y + (c.offY || 0) - (slot === 'hat' ? 145 : slot === 'eyes' ? (c.kind === 'frog' ? 135 : 102) : 52) * c.s;
        consider(G.dist(t.x, t.y - 20, c.x, hy), 150, { x: c.x, y: hy, r: 40, wearer: c });
      }
    }
    return best;
  };

  // called while dragging: remember the target, tick when it changes, and let the target get excited
  G.trackSnap = (t) => {
    const s = G.findSnap(t);
    if (keyOf(s) && keyOf(s) !== keyOf(t.snap)) S().tick();
    t.snap = s;
    if (s && s.eater) s.eater.say('wide', 'open', 0.25); // mouth wide open, waiting
    if (s && s.wearer) s.wearer.say('happy', 'open', 0.25);
    return s;
  };

  // slide something into place, then do the cool thing
  G.snapInto = (t, x, y, done, dur = 0.14) => {
    t.snapping = true; S().snap();
    G.burst('sparkle', x, y, 8, { colors: ['#ffffff', '#fff3b0', '#ffd84f'], g: 0, speed: 160, size: 9 });
    G.tween(t, { x, y }, dur, G.ease.out, () => { t.snapping = false; done(); });
  };

  // the glowing, dashed ring over the spot each carried thing is heading for
  class Hints {
    constructor() { this.z = 40; this.always = true; this.pickable = false; }
    draw(c) {
      // a sparkly "magic string" from the fingertip up to the thing it's holding (drawn behind the thing)
      for (const rec of G.pointers.values()) {
        if (!rec.drag || !(rec.lift > 4)) continue;
        const k = 1 / G.scale, fx = rec.x, fy = rec.y, gy = fy - rec.lift * k, n = Math.max(2, Math.floor(rec.lift / 13));
        c.lineWidth = 1.5 * k; c.strokeStyle = 'rgba(59,47,74,.55)';
        for (let i = 0; i <= n; i++) {
          const tw = 0.5 + 0.5 * Math.sin(G.time * 10 - i * 0.9);
          c.fillStyle = i % 3 === 0 ? '#fff3a0' : '#ffffff'; c.globalAlpha = 0.6 + 0.4 * tw;
          c.beginPath(); c.arc(fx + Math.sin(G.time * 6 + i) * 2 * k, fy - (i / n) * (fy - gy), (3.4 + tw * 2) * k, 0, G.TAU); c.fill(); c.stroke();
        }
        const rr = (19 + Math.sin(G.time * 8) * 2) * k;
        c.globalAlpha = 0.7; c.lineWidth = 5 * k; c.strokeStyle = 'rgba(59,47,74,.35)'; c.beginPath(); c.arc(fx, fy, rr, 0, G.TAU); c.stroke();
        c.lineWidth = 3 * k; c.strokeStyle = '#ffffff'; c.beginPath(); c.arc(fx, fy, rr, 0, G.TAU); c.stroke();
        c.globalAlpha = 1;
      }
      for (const rec of G.pointers.values()) {
        const t = rec.thing, s = rec.drag && t && t.snap;
        if (!s) continue;
        const r = s.r * (1 + Math.sin(G.time * 9) * 0.08);
        c.fillStyle = 'rgba(255,255,255,.2)'; c.beginPath(); c.arc(s.x, s.y, r, 0, G.TAU); c.fill();
        c.setLineDash([12, 9]); c.lineDashOffset = -G.time * 40; c.strokeStyle = '#ffffff'; c.lineWidth = 5;
        c.beginPath(); c.arc(s.x, s.y, r, 0, G.TAU); c.stroke(); c.setLineDash([]);
        c.fillStyle = '#fff7b0';
        for (let i = 0; i < 3; i++) { const a = G.time * 3 + (i * G.TAU) / 3; c.beginPath(); G.starPath(c, s.x + Math.cos(a) * r * 1.25, s.y + Math.sin(a) * r * 1.25, 8, 3.5, 4); c.fill(); }
      }
    }
  }
  G.hints = new Hints();
})();

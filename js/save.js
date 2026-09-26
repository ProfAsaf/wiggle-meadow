// Wiggle Meadow — remembers the meadow between visits on this device: where the critters are and what they
// wear, block buildings, loose dress-up items, the soup in the pot, day or night, and the view.
(() => {
  const G = window.G, KEY = 'wiggle-meadow-save-1', r = Math.round;
  const store = {
    get() { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (_) { return null; } },
    set(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (_) {} },
    clear() { try { localStorage.removeItem(KEY); } catch (_) {} },
  };

  G.saveGame = () => {
    if (!G.playing) return;
    store.set({
      v: 1, night: G.night > 0.5, cam: [r(G.cam.x), r(G.cam.y)], zoom: +G.zoom.toFixed(3),
      critters: G.things.filter((t) => t instanceof G.Critter).map((c) => ({ k: c.kind, x: r(c.x), f: c.floor, w: c.wears })),
      blocks: G.blocks.filter((b) => !b.dead && !b.held).map((b) => ({ k: b.kind, c: b.color, e: b.emblem, x: r(b.body.position.x), y: r(b.body.position.y), a: +b.body.angle.toFixed(3) })),
      wear: G.things.filter((t) => t.isWear && !t.dead && !t.held).map((w) => ({ t: w.type, x: r(w.x), y: r(w.y) })),
      pot: G.pot ? G.pot.items : [],
    });
  };
  G.loadGame = () => store.get();
  G.clearGame = () => store.clear();

  G.applySave = (s) => {
    const pool = G.things.filter((t) => t instanceof G.Critter);
    for (const c of s.critters || []) {
      const cr = pool.find((p) => p.kind === c.k && !p.restored);
      if (!cr) continue;
      cr.restored = true; cr.x = cr.homeX = c.x; cr.floor = c.f === G.UNDER ? G.UNDER : G.GROUND; cr.y = cr.floor;
      cr.wears = c.w || {}; cr.setState('idle', G.rand(0.5, 2));
    }
    if (Array.isArray(s.blocks) && G.addBlock) {
      for (const b of G.blocks.slice()) b.remove();
      for (const b of s.blocks) { const blk = G.addBlock(b.k, b.x, b.y, b.c, b.a); if (b.e !== undefined) blk.emblem = b.e; }
    }
    if (Array.isArray(s.wear)) {
      for (const w of G.things) if (w.isWear) w.dead = true;
      for (const w of s.wear) G.dropWear(w.t, w.x, w.y);
    }
    if (G.pot && Array.isArray(s.pot)) { G.pot.items = s.pot.slice(-6); G.pot.mixSoup(); }
    if (s.night) { G.night = 1; G.orb.mode = 'moon'; }
    if (s.zoom) G.setZoom(s.zoom);
    if (s.cam) { G.camTo(s.cam[0], s.cam[1]); G.cam.x = G.cam.tx; G.cam.y = G.cam.ty; }
  };

  setInterval(G.saveGame, 5000);
  document.addEventListener('visibilitychange', () => { if (document.hidden) G.saveGame(); });
  window.addEventListener('pagehide', G.saveGame);
})();

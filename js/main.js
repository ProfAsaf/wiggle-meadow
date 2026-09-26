// Wiggle Meadow — build the world, wire up navigation (tabs, map, keys, zoom), title card, sound and saving.
(() => {
  const G = window.G, S = () => G.sfx, U = G.UNDER, B = G.BEACH, GR = G.GROUND;
  const add = (t) => G.add(t);

  // ----- sky, all the way up to space -----
  G.stars = add(new G.Stars());
  G.orb = add(new G.Orb(1400, 150));
  [[300, 150, 0.9], [1300, 110, 1.05], [2600, 170, 0.85], [3900, 120, 1], [5400, 160, 0.9],
   [700, -280, 1], [2100, -450, 0.9], [3500, -320, 1.1], [4900, -520, 0.8], [6000, -260, 1]].forEach(([x, y, s]) => add(new G.Cloud(x, y, s)));
  add(new G.HotAir(2700, 260));
  add(new G.Airplane(-260));
  add(new G.Flock());
  const planet = add(new G.Planet(3200, -690));
  add(new G.Rocket(planet));

  // ----- 1. home & garden, with the campfire kitchen -----
  G.house = add(new G.House(260));
  add(new G.Mailbox(560));
  add(new G.Basket(690));
  add(new G.Pot(850));
  const tree = add(new G.Tree((G.treeX = 1160)));
  add(new G.Bird(tree.x + 60, 222));
  G.waters.push((G.pond = add(new G.Pond(1390))));
  G.flowers = [60, 170, 280, 390, 500, 610, 720].map((x, i) => add(new G.Flower(x, i)));
  [850, 920, 990].forEach((x) => add(new G.Carrot(x)));
  for (const col of ['#ff9ed2', '#b9a3e3']) add(new G.Butterfly(col));

  // ----- 2. the toy yard: dress-up trunk, blocks, trampoline -----
  add(new G.Trunk(1830));
  if (G.ToyBox) {
    add(G.physics);
    add(new G.ToyBox(2180));
    const bx = 2600;
    G.addBlock('pillar', bx - 70, GR - 75, '#6cc3f0'); G.addBlock('pillar', bx + 70, GR - 75, '#6cc3f0');
    G.addBlock('plank', bx, GR - 165, '#ffb65c'); G.addBlock('tri', bx, GR - 214, '#ff8a7a');
    G.addBlock('cube', bx + 240, GR - 36, '#8fd16a'); G.addBlock('cube', bx + 240, GR - 108, '#ffd84f');
    G.addBlock('wheel', bx - 260, GR - 38, '#b9a3e3');
  }
  G.catchers.push((G.tramp = add(new G.Trampoline(3020))));
  G.dropWear('crown', 1960, GR); G.dropWear('shades', 2020, GR);

  // ----- 3. playground -----
  add(new G.Lamp(3260)); add(new G.Lamp(4230));
  add(new G.Slide(3380));
  add(new G.Swing(3980));
  add(new G.Seesaw(4450));
  add(new G.Cart(4700));
  G.ball = add(new G.Ball(3780));

  // ----- 4. beach -----
  add(new G.Sea());
  add(new G.Boat(B + 900));
  add(new G.Whale(B + 1360));
  add(new G.Umbrella(B + 700));
  add(new G.Castle(B + 420));
  add(new G.Crab(B + 950));
  [220, 360, 560, 820, 1040].forEach((dx, i) => add(new G.Shell(B + dx, i)));

  // ----- underground -----
  add(new G.Burrow(150, 900));
  add(new G.Bed(360, '#ff9ed2')); add(new G.Bed(650, '#6cc3f0'));
  add(new G.Fossil(2500, 1085));
  add(new G.Mole(3700, 4300));
  add(new G.Chest(B + 810));
  [480, 560, 640, 980, 1060, 1140].forEach((dx, i) => add(new G.Crystal(B + dx, U, i)));
  [1150, 2000, 3050, 4550, 6250].forEach((x) => add(new G.Mushroom(x)));
  [1400, 2700, 3450, 4600, 6100].forEach((x) => add(new G.Lantern(x)));
  [[1200, 1010], [2150, 1040], [3000, 990], [4450, 1030], [6150, 1050]].forEach(([x, y]) => add(new G.Worm(x, y)));

  add(new G.Fireflies(36));
  if (G.hints) add(G.hints); // glowing rings over the spot a carried thing will snap into
  [['bunny', 480], ['frog', 1560], ['cat', 2000], ['bear', 2330], ['chick', 3900], ['penguin', B + 580], ['mouse', 520, U]]
    .forEach(([k, x, y]) => add(new G.Critter(k, x, y)));
  G.hero = add(new G.Hero(130)); // Super Pup: tap to transform
  const bear = G.things.find((t) => t.kind === 'bear');
  if (bear) bear.wears = { hat: 'party' }; // a hint of what the trunk is for

  // a meadow saved from last time replaces the starting setup
  const saved = G.loadGame();
  if (saved) G.applySave(saved);

  // tapping nothing in particular still does something
  G.onEmptyTap = (p) => {
    if (p.y > GR + 170) {
      G.burst('dust', p.x, p.y, 8, { colors: ['#c99b73', '#b58461'], g: 400, speed: 160, size: 8 }); S().boop(0);
    } else if (p.y > GR + 8 && p.x < B - 30) {
      const sprouts = G.things.filter((t) => t instanceof G.Sprout && !t.fading);
      if (sprouts.length >= 14) sprouts[0].age = 99;
      const sp = add(new G.Sprout(p.x, p.y + 20));
      sp.z = p.y > 790 ? 9 : 6;
      S().pop();
    } else if (G.night > 0.5 && p.y < 560) {
      G.stars.shoot(p.x, p.y);
    } else {
      G.burst('sparkle', p.x, p.y, 9, { colors: G.CONFETTI, g: 0, speed: 200, size: 11 });
      S().boop();
    }
  };

  // ----- navigation: edge tabs, map, keyboard, zoom -----
  const cam = G.cam, $ = (id) => document.getElementById(id);
  const COLS = [800, 2400, 4000, 5600], ROWS = [-450, 450, 1350];
  // Arrow tabs: a tap glides smoothly to the next area (or most of a screen when zoomed in or on a phone);
  // holding one rolls the view along until you let go.
  const next = (arr, v, d) => (d > 0 ? arr.find((a) => a > v + 10) ?? arr[arr.length - 1] : [...arr].reverse().find((a) => a < v - 10) ?? arr[0]);
  const glideStep = (dx, dy) => {
    const [gx, gy] = G.camGoal();
    G.camTo(dx ? (G.vw >= 1400 ? next(COLS, gx, dx) : gx + dx * G.vw * 0.9) : gx, dy ? next(ROWS, gy, dy) : gy);
    S().whoosh();
  };
  const arrows = { navL: [-1, 0], navR: [1, 0], navU: [0, -1], navD: [0, 1] };
  const KEYS = { ArrowLeft: 'navL', ArrowRight: 'navR', ArrowUp: 'navU', ArrowDown: 'navD' };
  let hold = null;
  const holdEnd = (tap) => {
    if (!hold) return;
    clearTimeout(hold.timer); $(hold.nav).classList.remove('held');
    if (hold.rolling) G.push(0, 0); else if (tap) glideStep(...arrows[hold.nav]);
    hold = null;
  };
  const holdStart = (key, nav) => {
    S().unlock(); holdEnd(false);
    const h = (hold = { key, nav, rolling: false });
    h.timer = setTimeout(() => { if (hold === h) { h.rolling = true; G.push(...arrows[nav]); } }, 220);
    $(nav).classList.add('held');
  };
  for (const id in arrows) {
    const el = $(id);
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); try { el.setPointerCapture(e.pointerId); } catch (_) {} holdStart(e.pointerId, id); });
    el.addEventListener('pointerup', () => holdEnd(true));
    el.addEventListener('pointercancel', () => holdEnd(false));
    el.addEventListener('click', (e) => { if (e.detail === 0) glideStep(...arrows[id]); }); // Enter/Space on a focused tab
  }
  window.addEventListener('keydown', (e) => {
    if (!$('title').hidden) return;
    if (KEYS[e.key]) { e.preventDefault(); if (!e.repeat) holdStart(e.key, KEYS[e.key]); }
    else if (e.key === '+' || e.key === '=') G.setZoom(G.zoom * 1.2);
    else if (e.key === '-' || e.key === '_') G.setZoom(G.zoom / 1.2);
    else if (e.key === '0') G.setZoom(1);
  });
  window.addEventListener('keyup', (e) => { if (hold && hold.key === e.key) holdEnd(true); });
  window.addEventListener('blur', () => holdEnd(false));
  const map = $('map'), mapBtn = $('mapBtn');
  const setMap = (open) => { map.hidden = !open; mapBtn.setAttribute('aria-expanded', String(open)); };
  mapBtn.addEventListener('click', () => { S().unlock(); S().click(); setMap(map.hidden); });
  const cells = [...map.querySelectorAll('button')];
  cells.forEach((b) => b.addEventListener('click', () => { S().unlock(); S().whoosh(); G.camTo(COLS[+b.dataset.c], ROWS[+b.dataset.r]); setMap(false); }));
  G.canvas.addEventListener('pointerdown', () => setMap(false));
  let lastKey = '';
  G.onFrame = () => {
    const [x0, y0] = G.clampCam(-1e9, -1e9), [x1, y1] = G.clampCam(1e9, 1e9), [gx, gy] = G.camGoal();
    const show = { navL: gx > x0 + 5, navR: gx < x1 - 5, navU: gy > y0 + 5, navD: gy < y1 - 5 };
    if (hold && !show[hold.nav]) holdEnd(false); // rolled to the edge of the world
    const c = COLS.reduce((b, v, i) => (Math.abs(v - cam.x) < Math.abs(COLS[b] - cam.x) ? i : b), 0);
    const r = ROWS.reduce((b, v, i) => (Math.abs(v - cam.y) < Math.abs(ROWS[b] - cam.y) ? i : b), 0);
    const key = Object.values(show).join() + c + r + $('title').hidden;
    if (key === lastKey) return;
    lastKey = key;
    for (const id in show) $(id).hidden = !show[id] || !$('title').hidden;
    cells.forEach((b) => b.setAttribute('aria-current', String(+b.dataset.c === c && +b.dataset.r === r)));
  };

  // ----- title card, fresh start, sound -----
  const title = $('title'), play = $('play'), mute = $('mute'), fresh = $('fresh');
  fresh.hidden = !saved;
  fresh.addEventListener('click', () => { G.clearGame(); location.reload(); });
  play.addEventListener('click', () => {
    S().unlock();
    title.hidden = true; mute.hidden = false; mapBtn.hidden = false; G.playing = true;
    S().tada();
    try { navigator.wakeLock && navigator.wakeLock.request('screen').catch(() => {}); } catch (_) {}
  });
  mute.addEventListener('click', () => {
    S().unlock();
    S().setMuted(!S().muted);
    mute.setAttribute('aria-pressed', String(S().muted));
    mute.setAttribute('aria-label', S().muted ? 'Turn sound on' : 'Turn sound off');
  });

  // ----- installable + offline when served from GitHub Pages -----
  if (/\.github\.io$/.test(location.hostname)) {
    for (const [rel, href] of [['manifest', 'manifest.webmanifest'], ['apple-touch-icon', 'icons/icon-180.png']]) {
      const l = document.createElement('link'); l.rel = rel; l.href = href; document.head.appendChild(l);
    }
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  G.start();
})();

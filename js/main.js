// Wiggle Meadow — build the world, wire up navigation (arrows, mini-map, keys), title card and sound.
(() => {
  const G = window.G, S = () => G.sfx, U = G.UNDER;
  const add = (t) => G.add(t);

  // ----- sky, all the way up to space -----
  G.stars = add(new G.Stars());
  G.orb = add(new G.Orb(1400, 150));
  [[250, 150, 0.9], [760, 105, 1.1], [1160, 215, 0.8], [1950, 150, 1], [2750, 120, 0.85], [3550, 180, 1], [4350, 130, 0.9],
   [500, -250, 1], [1500, -420, 0.9], [2600, -300, 1.1], [3500, -520, 0.8], [4300, -260, 1]].forEach(([x, y, s]) => add(new G.Cloud(x, y, s)));
  add(new G.HotAir(1150, 260));
  add(new G.Airplane(-260));
  add(new G.Flock());
  const planet = add(new G.Planet(2400, -690));
  add(new G.Rocket(planet));

  // ----- home & garden -----
  G.house = add(new G.House(250));
  add(new G.Mailbox(525));
  const tree = add(new G.Tree(760));
  add(new G.Bird(tree.x + 60, 222));
  G.catchers.push((G.tramp = add(new G.Trampoline(1010))));
  G.waters.push((G.pond = add(new G.Pond(1360))));
  G.ball = add(new G.Ball(640));
  G.flowers = [70, 205, 340, 475, 610, 745, 880].map((x, i) => add(new G.Flower(x, i)));
  for (const col of ['#ff9ed2', '#b9a3e3', '#ffe066']) add(new G.Butterfly(col));

  // ----- playground -----
  add(new G.Lamp(1680)); add(new G.Lamp(2575));
  add(new G.Slide(1800));
  add(new G.Swing(2380));
  add(new G.Seesaw(2780));
  add(new G.Cart(3060));
  [1640, 1705, 2230, 2295].forEach((x) => add(new G.Carrot(x)));

  // ----- beach -----
  add(new G.Sea());
  add(new G.Boat(4100));
  add(new G.Whale(4560));
  add(new G.Umbrella(3900));
  add(new G.Castle(3620));
  add(new G.Crab(4150));
  [3420, 3560, 3760, 4020, 4240].forEach((x, i) => add(new G.Shell(x, i)));

  // ----- underground -----
  add(new G.Burrow(150, 900));
  add(new G.Bed(360, '#ff9ed2')); add(new G.Bed(650, '#6cc3f0'));
  add(new G.Mole(2100, 2680));
  add(new G.Fossil(1560, 1090));
  add(new G.Chest(4010));
  [3680, 3760, 3840, 4180, 4260, 4340].forEach((x, i) => add(new G.Crystal(x, U, i)));
  [1100, 1850, 3300, 4650].forEach((x) => add(new G.Mushroom(x)));
  [1400, 2950, 3450, 4500].forEach((x) => add(new G.Lantern(x)));
  [[1200, 1010], [2300, 1040], [3150, 1000], [4300, 1050]].forEach(([x, y]) => add(new G.Worm(x, y)));

  add(new G.Fireflies(30));
  [['bunny', 450], ['cat', 600], ['bear', 880], ['frog', 1555], ['chick', 2450], ['penguin', 3780], ['mouse', 520, U]]
    .forEach(([k, x, y]) => add(new G.Critter(k, x, y)));

  // tapping nothing in particular still does something
  G.onEmptyTap = (p) => {
    if (p.y > G.GROUND + 170) {
      G.burst('dust', p.x, p.y, 8, { colors: ['#c99b73', '#b58461'], g: 400, speed: 160, size: 8 }); S().boop(0);
    } else if (p.y > G.GROUND + 8 && p.x < 3170) {
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

  // ----- navigation: arrow buttons, mini-map, keyboard -----
  const cam = G.cam, $ = (id) => document.getElementById(id);
  const COLS = [800, 2400, 4000], ROWS = [-450, 450, 1350];
  // Arrows hop to the next area's centre (or a screen at a time on narrow phones).
  const next = (arr, v, d) => (d > 0 ? arr.find((a) => a > v + 10) ?? arr[arr.length - 1] : [...arr].reverse().find((a) => a < v - 10) ?? arr[0]);
  const step = (dx, dy) => {
    S().unlock(); S().whoosh();
    const [cx, cy] = G.clampCam(cam.tx, cam.ty);
    G.camTo(dx ? (G.vw >= 1400 ? next(COLS, cx, dx) : cx + dx * G.vw * 0.9) : cx, dy ? next(ROWS, cy, dy) : cy);
  };
  const arrows = { navL: [-1, 0], navR: [1, 0], navU: [0, -1], navD: [0, 1] };
  for (const id in arrows) $(id).addEventListener('click', () => step(...arrows[id]));
  window.addEventListener('keydown', (e) => {
    const k = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (k && $('title').hidden) { e.preventDefault(); step(...k); }
  });
  const cells = [...document.querySelectorAll('#map button')];
  cells.forEach((b) => b.addEventListener('click', () => { S().unlock(); S().whoosh(); G.camTo(COLS[+b.dataset.c], ROWS[+b.dataset.r]); }));
  let lastKey = '';
  G.onFrame = () => {
    const [x0, y0] = G.clampCam(-1e9, -1e9), [x1, y1] = G.clampCam(1e9, 1e9);
    const show = { navL: cam.tx > x0 + 5, navR: cam.tx < x1 - 5, navU: cam.ty > y0 + 5, navD: cam.ty < y1 - 5 };
    const c = COLS.reduce((b, v, i) => (Math.abs(v - cam.x) < Math.abs(COLS[b] - cam.x) ? i : b), 0);
    const r = ROWS.reduce((b, v, i) => (Math.abs(v - cam.y) < Math.abs(ROWS[b] - cam.y) ? i : b), 0);
    const key = Object.values(show).join() + c + r;
    if (key === lastKey) return;
    lastKey = key;
    for (const id in show) $(id).hidden = !show[id] || !$('title').hidden;
    cells.forEach((b) => b.setAttribute('aria-current', String(+b.dataset.c === c && +b.dataset.r === r)));
  };

  // ----- title card + sound toggle -----
  const title = $('title'), play = $('play'), mute = $('mute'), map = $('map');
  play.addEventListener('click', () => {
    S().unlock();
    title.hidden = true; mute.hidden = false; map.hidden = false; lastKey = '';
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

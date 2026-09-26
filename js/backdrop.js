// Wiggle Meadow — the backdrop: a tall sky that fades into space, hills, the sea,
// grass turning to sand, and the soil and tunnels underneath everything.
(() => {
  const G = window.G;
  G.rainbow = 0; G.rainbowX = 780;
  const B = G.BEACH;
  const SAND0 = B - 20, SAND1 = B + 160; // grass fades into sand here
  const SEA0 = B + 180;                  // the sea begins on the horizon here
  const hill = (x, base, amp, f, ph) => base + Math.sin(x * f + ph) * amp + Math.sin(x * f * 2.3 + ph * 2) * amp * 0.35;
  const blades = Array.from({ length: Math.ceil(SAND0 / 12.9) }, (_, i) => ({ x: i * 12.9 + ((i * 37) % 11), y: 770 + ((i * 53) % 120), h: 14 + ((i * 7) % 12) }));
  const pebbles = Array.from({ length: 620 }, (_, i) => ({ x: (i * 173.3) % G.W, y: 935 + ((i * 97.7) % 850), r: 3 + (i % 5) * 1.6, c: i % 3 }));
  const PEBBLE = ['#b58461', '#7a5038', '#c99b73'];

  // the tunnel: a wavy ceiling that bulges up into rooms, and a flat floor at G.UNDER
  const ROOMS = [[150, 900, 1140], [3680, 4320, 1190], [B + 420, B + 1180, 1160]];
  const ceiling = (G.ceilingAt = (x) => {
    let y = 1300 + Math.sin(x * 0.004) * 22 + Math.sin(x * 0.011 + 2) * 12;
    for (const [a, b, top] of ROOMS) if (x > a && x < b) y = Math.min(y, G.lerp(y, top, Math.min(1, Math.sin(((x - a) / (b - a)) * Math.PI) * 1.7)));
    return y;
  });
  G.SHAFTS = [1080, 3140, B + 280];

  G.paintBack = (c) => {
    const v = G.view, n = G.night, x0 = v.x0 - 10, x1 = v.x1 + 10, w = x1 - x0;

    if (v.y0 < 760) {
      const sky = c.createLinearGradient(0, G.TOP, 0, 720);
      sky.addColorStop(0, G.mix('#22306f', '#060920', n));
      sky.addColorStop(0.4, G.mix('#4f9fe0', '#141a4d', n));
      sky.addColorStop(1, G.mix('#d3f0f8', '#4d4a8c', n));
      const top = Math.max(v.y0 - 10, G.TOP - 200);
      c.fillStyle = sky; c.fillRect(x0, top, w, 760 - top);
      G.stars && G.stars.drawSky(c);
      if (G.rainbow > 0.01) {
        c.save(); c.globalAlpha = 0.6 * G.rainbow; c.lineWidth = 22;
        ['#ff8a7a', '#ffb65c', '#ffe066', '#8fd16a', '#6cc3f0', '#b9a3e3'].forEach((col, i) => {
          c.strokeStyle = col; c.beginPath(); c.arc(G.rainbowX, 760, 560 - i * 22, Math.PI, 0); c.stroke();
        });
        c.restore();
      }
      G.orb && G.orb.drawSky(c);

      // far hills drift slower than the ground (parallax); they sink away where the beach starts
      const px = G.cam.x * 0.35;
      c.fillStyle = G.mix('#b4e09a', '#5d7a8a', n * 0.5);
      c.beginPath(); c.moveTo(x0, 760);
      for (let x = x0; x <= x1 + 20; x += 20) c.lineTo(x, hill(x + px, 625, 34, 0.0042, 1.1) + Math.max(0, x - SEA0 + 250) * 0.45);
      c.lineTo(x1 + 20, 760); c.closePath(); c.fill();
      if (x1 > SEA0) {
        const sx = Math.max(x0, SEA0 - 60);
        const sea = c.createLinearGradient(0, 606, 0, 720);
        sea.addColorStop(0, G.mix('#3fa6e0', '#23407a', n)); sea.addColorStop(1, G.mix('#86d4f3', '#3a5a90', n));
        c.fillStyle = sea; c.fillRect(sx, 606, x1 - sx, 120);
        c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 4; c.lineCap = 'round';
        for (let i = 0; i < 40; i++) {
          const gx = SEA0 + ((i * 131 + G.time * 18 * ((i % 3) + 1)) % (G.W - SEA0)), gy = 625 + ((i * 29) % 80);
          if (gx < x0 || gx > x1) continue;
          c.beginPath(); c.moveTo(gx - 14, gy); c.quadraticCurveTo(gx, gy - 5, gx + 14, gy); c.stroke();
        }
      }
      c.fillStyle = G.mix('#9fd67c', '#557a6a', n * 0.5);
      c.beginPath(); c.moveTo(x0, 760);
      for (let x = x0; x <= Math.min(x1, SEA0 + 100) + 20; x += 20) c.lineTo(x, hill(x, 680, 22, 0.006, 3.0) + Math.max(0, x - SAND0) * 0.35);
      c.lineTo(Math.min(x1, SEA0 + 100) + 20, 760); c.closePath(); c.fill();
    }

    if (v.y1 > 690 && v.y0 < 920) {
      const g1 = c.createLinearGradient(SAND0, 0, SAND1, 0);
      g1.addColorStop(0, '#90cd63'); g1.addColorStop(1, '#f3dca2');
      c.fillStyle = g1; c.fillRect(x0, 700, w, 212);
      const g2 = c.createLinearGradient(SAND0, 0, SAND1, 0);
      g2.addColorStop(0, '#86c55a'); g2.addColorStop(1, '#ead08f');
      c.fillStyle = g2; c.fillRect(x0, 855, w, 57);
      c.strokeStyle = '#6fae47'; c.lineWidth = 4; c.lineCap = 'round';
      for (const b of blades) {
        if (b.x < x0 || b.x > x1 || b.x > SAND0 - 20) continue;
        const sw = Math.sin(G.time * 1.8 + b.x * 0.05) * 4;
        c.beginPath(); c.moveTo(b.x - 6, b.y); c.quadraticCurveTo(b.x - 7, b.y - b.h * 0.6, b.x - 9 + sw, b.y - b.h);
        c.moveTo(b.x + 4, b.y); c.quadraticCurveTo(b.x + 5, b.y - b.h * 0.6, b.x + 8 + sw, b.y - b.h * 0.9); c.stroke();
      }
    }

    if (v.y1 > 900) {
      c.fillStyle = '#9b6b4a'; c.fillRect(x0, 908, w, 250);
      c.fillStyle = '#86593c'; c.fillRect(x0, 1150, w, G.BOTTOM - 1150 + 40);
      if (x1 > SAND0) {
        const gs = c.createLinearGradient(SAND0, 0, SAND1, 0);
        gs.addColorStop(0, 'rgba(230,190,120,0)'); gs.addColorStop(1, 'rgba(230,190,120,.35)');
        c.fillStyle = gs; c.fillRect(Math.max(x0, SAND0), 908, x1 - Math.max(x0, SAND0), G.BOTTOM - 868);
      }
      c.strokeStyle = 'rgba(59,47,74,.25)'; c.lineWidth = 5;
      c.beginPath(); for (let x = x0; x <= x1; x += 24) c.lineTo(x, 1150 + Math.sin(x * 0.01) * 10); c.stroke();
      for (const p of pebbles) {
        if (p.x < x0 || p.x > x1 || p.y < v.y0 - 10 || p.y > v.y1 + 10) continue;
        c.fillStyle = PEBBLE[p.c]; c.beginPath(); c.ellipse(p.x, p.y, p.r * 1.35, p.r, 0.3, 0, G.TAU); c.fill();
      }
      c.strokeStyle = '#7a5038'; c.lineWidth = 7; c.lineCap = 'round'; // tree roots
      const tx = G.treeX || 760;
      if (tx > x0 - 300 && tx < x1 + 300) for (const [dx, len] of [[-50, 180], [-10, 240], [30, 200], [70, 150]]) {
        c.beginPath(); c.moveTo(tx + dx * 0.5, 905); c.quadraticCurveTo(tx + dx * 2.2, 905 + len * 0.5, tx + dx * 3, 905 + len); c.stroke();
      }
      c.fillStyle = '#5b3a2b';
      for (const sx of G.SHAFTS) {
        if (sx < x0 - 60 || sx > x1 + 60) continue;
        c.beginPath(); c.moveTo(sx - 46, 900); c.lineTo(sx - 46, ceiling(sx) + 40); c.lineTo(sx + 46, ceiling(sx) + 40); c.lineTo(sx + 46, 900); c.closePath(); c.fill();
      }
      // the long tunnel
      const a = Math.max(60, x0), b = Math.min(G.W - 60, x1);
      if (a < b) {
        c.fillStyle = '#5b3a2b'; c.beginPath(); c.moveTo(a, G.UNDER + 30);
        for (let x = a; x <= b + 16; x += 16) c.lineTo(Math.min(x, b), ceiling(Math.min(x, b)));
        c.lineTo(b, G.UNDER + 30); c.closePath(); c.fill();
        c.strokeStyle = 'rgba(59,47,74,.55)'; c.lineWidth = 6;
        c.beginPath(); for (let x = a; x <= b + 16; x += 16) c.lineTo(Math.min(x, b), ceiling(Math.min(x, b))); c.stroke();
        c.fillStyle = '#7a4f36'; c.fillRect(a, G.UNDER, b - a, 34);
        c.fillStyle = '#6a4430'; c.fillRect(a, G.UNDER + 34, b - a, 12);
      }
      // holes on the surface that lead down
      for (const sx of G.SHAFTS) {
        if (sx < x0 - 60 || sx > x1 + 60) continue;
        G.ellipse(c, sx, 892, 50, 14, '#4a2e22', 5);
      }
    }
  };
})();

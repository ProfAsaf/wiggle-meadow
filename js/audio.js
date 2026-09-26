// Wiggle Meadow — every sound is synthesized with WebAudio (no audio files).
(() => {
  let ac = null, master = null, noiseBuf = null;
  const PENTA = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.5];

  function init() {
    if (ac) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = new AC();
    const comp = ac.createDynamicsCompressor();
    master = ac.createGain();
    master.gain.value = sfx.muted ? 0 : 0.8;
    master.connect(comp); comp.connect(ac.destination);
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const ready = () => ac && ac.state === 'running' && !sfx.muted;

  // One oscillator voice with a pitch glide and a plucky envelope.
  function tone({ type = 'sine', f0 = 440, f1 = f0, dur = 0.2, vol = 0.3, at = 0, attack = 0.01, vib = 0, vibRate = 12, filter = 0 }) {
    if (!ready()) return;
    const t = ac.currentTime + at;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    if (vib) {
      const l = ac.createOscillator(), lg = ac.createGain();
      l.frequency.value = vibRate; lg.gain.value = vib;
      l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + dur + 0.05);
    }
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node = o;
    if (filter) { const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = filter; o.connect(f); node = f; }
    node.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.05);
  }
  // Filtered noise burst (splashes, chomps, whooshes, rain).
  function noise({ dur = 0.2, vol = 0.3, at = 0, type = 'bandpass', f0 = 1000, f1 = f0, q = 1, attack = 0.01 }) {
    if (!ready()) return;
    const t = ac.currentTime + at;
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noiseBuf; s.loop = true;
    f.type = type; f.Q.value = q;
    f.frequency.setValueAtTime(f0, t);
    f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(master);
    s.start(t); s.stop(t + dur + 0.05);
  }

  const sfx = (window.G.sfx = {
    muted: false,
    PENTA,
    unlock() { init(); if (ac && ac.state === 'suspended') ac.resume(); },
    setMuted(m) { sfx.muted = m; if (master) master.gain.value = m ? 0 : 0.8; },
    pop() { tone({ f0: 380, f1: 950, dur: 0.09, vol: 0.35 }); noise({ dur: 0.03, vol: 0.12, f0: 3000 }); },
    boop(i) { const f = i === undefined ? window.G.pick(PENTA) : PENTA[i % PENTA.length]; tone({ f0: f, dur: 0.35, vol: 0.18 }); tone({ f0: f * 2, dur: 0.15, vol: 0.05 }); },
    marimba(f) { tone({ f0: f, dur: 0.7, vol: 0.32, attack: 0.004 }); tone({ f0: f * 4, dur: 0.12, vol: 0.08, attack: 0.002 }); },
    boing(p = 1) { tone({ type: 'triangle', f0: 170 * p, f1: 520 * p, dur: 0.38, vol: 0.32, vib: 40, vibRate: 22 }); },
    thud() { tone({ f0: 160, f1: 45, dur: 0.18, vol: 0.4 }); noise({ dur: 0.08, vol: 0.12, type: 'lowpass', f0: 400 }); },
    giggle(p = 1) { for (let i = 0; i < 5; i++) tone({ f0: (i % 2 ? 780 : 640) * p * (1 + i * 0.04), f1: (i % 2 ? 700 : 820) * p, dur: 0.08, vol: 0.2, at: i * 0.085, vib: 30, vibRate: 30 }); },
    wheee(p = 1) { tone({ f0: 480 * p, f1: 1150 * p, dur: 0.55, vol: 0.18, vib: 25, vibRate: 9 }); },
    chomp() { for (let i = 0; i < 3; i++) { noise({ dur: 0.06, vol: 0.35, type: 'lowpass', f0: 900, at: i * 0.16 }); tone({ f0: 140, f1: 90, dur: 0.07, vol: 0.2, at: i * 0.16 }); } },
    yum(p = 1) { tone({ f0: 420 * p, f1: 620 * p, dur: 0.18, vol: 0.2, at: 0.5 }); tone({ f0: 620 * p, f1: 380 * p, dur: 0.3, vol: 0.2, at: 0.68 }); },
    splash() { noise({ dur: 0.5, vol: 0.45, f0: 1600, f1: 350, q: 0.7 }); tone({ f0: 300, f1: 900, dur: 0.08, vol: 0.12, at: 0.08 }); tone({ f0: 400, f1: 1100, dur: 0.07, vol: 0.1, at: 0.2 }); },
    blub() { tone({ f0: 260, f1: 760, dur: 0.1, vol: 0.2 }); },
    chirp() { const n = window.G.randi(2, 3); for (let i = 0; i < n; i++) tone({ f0: 2300 + i * 150, f1: 3400, dur: 0.07, vol: 0.12, at: i * 0.1 }); },
    whoosh() { noise({ dur: 0.45, vol: 0.3, f0: 300, f1: 2200, q: 1.5, attack: 0.15 }); },
    creak() { tone({ type: 'sawtooth', f0: 95, f1: 150, dur: 0.35, vol: 0.12, filter: 700, vib: 12, vibRate: 30 }); },
    knock() { for (let i = 0; i < 2; i++) { tone({ f0: 240, f1: 120, dur: 0.07, vol: 0.35, at: i * 0.14 }); noise({ dur: 0.04, vol: 0.2, type: 'lowpass', f0: 1200, at: i * 0.14 }); } },
    honk() { tone({ type: 'square', f0: 330, dur: 0.22, vol: 0.12, filter: 1400 }); tone({ type: 'square', f0: 392, dur: 0.22, vol: 0.1, filter: 1400, at: 0.25 }); },
    click() { noise({ dur: 0.03, vol: 0.25, f0: 2500 }); tone({ f0: 1800, f1: 1200, dur: 0.03, vol: 0.1 }); },
    twinkle() { for (let i = 0; i < 4; i++) tone({ f0: window.G.pick(PENTA) * 2, dur: 0.5, vol: 0.08, at: i * 0.09 }); },
    tada() { [523, 659, 784, 1046].forEach((f, i) => tone({ f0: f, dur: 0.45, vol: 0.18, at: i * 0.08, type: 'triangle' })); },
    ribbit() { for (let i = 0; i < 2; i++) tone({ type: 'sawtooth', f0: 210, f1: 150, dur: 0.14, vol: 0.14, filter: 900, vib: 60, vibRate: 45, at: i * 0.2 }); },
    meow(p = 1) { tone({ type: 'sawtooth', f0: 520 * p, f1: 420 * p, dur: 0.5, vol: 0.12, filter: 1500, vib: 20, vibRate: 6 }); },
    hum(p = 1) { tone({ type: 'triangle', f0: 170 * p, f1: 135 * p, dur: 0.4, vol: 0.28, vib: 8 }); },
    peep(p = 1) { tone({ f0: 2200 * p, f1: 2900 * p, dur: 0.08, vol: 0.15 }); tone({ f0: 2200 * p, f1: 2900 * p, dur: 0.08, vol: 0.15, at: 0.12 }); },
    squeak(p = 1) { tone({ f0: 1100 * p, f1: 1700 * p, dur: 0.1, vol: 0.18 }); },
    snore() { noise({ dur: 1.1, vol: 0.08, type: 'lowpass', f0: 250, f1: 500, attack: 0.5 }); },
    rain(sec = 3) { noise({ dur: sec, vol: 0.14, type: 'highpass', f0: 1800, attack: 0.6 }); },
    cricket() { for (let i = 0; i < 3; i++) tone({ f0: 4200, dur: 0.04, vol: 0.03, at: i * 0.07 }); },
    bell() { for (let i = 0; i < 2; i++) { tone({ f0: 1568, dur: 0.5, vol: 0.14, at: i * 0.22, attack: 0.003 }); tone({ f0: 3136, dur: 0.2, vol: 0.05, at: i * 0.22, attack: 0.003 }); } },
    crystal(i = 0) { const f = PENTA[i % PENTA.length] * 2; tone({ f0: f, dur: 1.1, vol: 0.14, attack: 0.003 }); tone({ f0: f * 1.5, dur: 0.6, vol: 0.05, attack: 0.003 }); },
    wave() { noise({ dur: 1.6, vol: 0.12, type: 'lowpass', f0: 500, f1: 1400, attack: 0.7 }); },
    whale() { tone({ f0: 220, f1: 330, dur: 0.8, vol: 0.14, vib: 10, vibRate: 5, attack: 0.2 }); tone({ f0: 330, f1: 180, dur: 0.9, vol: 0.12, at: 0.7, vib: 10, vibRate: 5, attack: 0.2 }); },
    spout() { noise({ dur: 0.8, vol: 0.25, f0: 800, f1: 3000, q: 0.6, attack: 0.05 }); },
    dig() { for (let i = 0; i < 4; i++) noise({ dur: 0.07, vol: 0.28, type: 'lowpass', f0: 700, at: i * 0.11 }); },
    roar() { tone({ type: 'sawtooth', f0: 110, f1: 80, dur: 0.7, vol: 0.14, filter: 700, vib: 14, vibRate: 18, attack: 0.08 }); },
    jingle() { for (let i = 0; i < 8; i++) tone({ f0: 2000 + Math.random() * 1600, dur: 0.12, vol: 0.06, at: i * 0.05, attack: 0.002 }); },
    burner() { noise({ dur: 0.7, vol: 0.28, f0: 400, f1: 900, q: 0.5, attack: 0.08 }); },
    buzz() { tone({ type: 'sawtooth', f0: 140, f1: 150, dur: 1, vol: 0.05, filter: 600, vib: 6, vibRate: 30, attack: 0.3 }); },
    thunk() { tone({ f0: 220, f1: 90, dur: 0.12, vol: 0.3 }); noise({ dur: 0.05, vol: 0.15, type: 'lowpass', f0: 900 }); },
    toot() { tone({ type: 'triangle', f0: 392, dur: 0.18, vol: 0.2 }); tone({ type: 'triangle', f0: 523, dur: 0.3, vol: 0.2, at: 0.2 }); },
    launch() { noise({ dur: 2.2, vol: 0.3, type: 'lowpass', f0: 300, f1: 1800, attack: 0.3 }); tone({ f0: 80, f1: 400, dur: 2, vol: 0.1, attack: 0.3 }); },
    clack(v = 5) { const f = 600 + Math.random() * 500; tone({ type: 'triangle', f0: f, f1: f * 0.7, dur: 0.06, vol: Math.min(0.22, v * 0.02), attack: 0.002 }); noise({ dur: 0.03, vol: Math.min(0.12, v * 0.01), f0: 2400 }); },
    gulp() { tone({ f0: 500, f1: 180, dur: 0.18, vol: 0.2 }); tone({ f0: 300, f1: 700, dur: 0.1, vol: 0.12, at: 0.18 }); },
    stir() { noise({ dur: 0.7, vol: 0.12, type: 'lowpass', f0: 400, f1: 900, attack: 0.2 }); for (let i = 0; i < 3; i++) tone({ f0: 300 + i * 90, f1: 700, dur: 0.08, vol: 0.08, at: 0.1 + i * 0.18 }); },
    sizzle() { noise({ dur: 0.9, vol: 0.12, type: 'highpass', f0: 3000, attack: 0.05 }); },
    bleh() { tone({ type: 'sawtooth', f0: 260, f1: 180, dur: 0.35, vol: 0.12, filter: 900, vib: 40, vibRate: 16 }); },
    dress() { [659, 784, 988, 1319].forEach((f, i) => tone({ f0: f, dur: 0.25, vol: 0.1, at: i * 0.06 })); },
    bark(p = 1) { for (let i = 0; i < 2; i++) tone({ type: 'sawtooth', f0: 560 * p, f1: 380 * p, dur: 0.09, vol: 0.14, filter: 1700, at: i * 0.15 }); },
    transform() { tone({ f0: 300, f1: 1400, dur: 0.85, vol: 0.16, vib: 30, vibRate: 14, attack: 0.05 }); noise({ dur: 0.8, vol: 0.12, f0: 600, f1: 4000, q: 1, attack: 0.3 }); for (let i = 0; i < 5; i++) tone({ f0: PENTA[i + 2] * 2, dur: 0.4, vol: 0.07, at: 0.35 + i * 0.07 }); },
    powerDown() { tone({ f0: 1200, f1: 300, dur: 0.6, vol: 0.12, vib: 20, vibRate: 10 }); for (let i = 0; i < 4; i++) tone({ f0: PENTA[6 - i] * 2, dur: 0.35, vol: 0.06, at: i * 0.08 }); },
    zoom() { noise({ dur: 0.4, vol: 0.25, f0: 500, f1: 2600, q: 1.2, attack: 0.05 }); tone({ f0: 500, f1: 1300, dur: 0.3, vol: 0.08 }); },
    beep(n = 3) { for (let i = 0; i < n; i++) tone({ type: 'square', f0: i === n - 1 ? 1320 : 880, dur: 0.12, vol: 0.07, filter: 2500, at: i * 0.5 }); },
    sunset() { [784, 659, 523, 392].forEach((f, i) => tone({ f0: f, dur: 0.6, vol: 0.12, at: i * 0.12 })); },
    sunrise() { [392, 523, 659, 784].forEach((f, i) => tone({ f0: f, dur: 0.6, vol: 0.12, at: i * 0.12 })); },
  });

  // Ambient life: birds by day, crickets by night.
  setInterval(() => {
    if (!ready() || document.hidden) return;
    if (window.G.night > 0.6) { if (Math.random() < 0.4) sfx.cricket(); }
    else if (Math.random() < 0.1) tone({ f0: 2600 + Math.random() * 800, f1: 3600, dur: 0.06, vol: 0.03 });
  }, 1600);
})();

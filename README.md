# Wiggle Meadow

A tap-anything toy world for little kids, in the spirit of Sago Mini and Toca Boca. Every critter, cloud,
flower and apple reacts when you tap it, drag it or toss it. There's nothing to read, no score and no way to lose.

**Play:** https://profasaf.github.io/wiggle-meadow/

On an iPad, open the link in Safari and choose **Share → Add to Home Screen**. After the first visit it works offline.

## The world

A 3 × 3 map. The big arrows on the screen edges move one area at a time; the little map in the corner jumps
anywhere. Swiping an empty spot also scrolls, and holding a critter against a screen edge carries it along.

| | Left | Middle | Right |
|---|---|---|---|
| **Up** | Sky, hot-air balloon | Outer space: ringed planet, rocket | Sky, banner plane, bird flock |
| **Middle** | House, garden, apple tree, pond, trampoline | Playground: slide, swing, seesaw, ice-cream cart | Beach: sea, boat, whale, crab, sandcastle, shells |
| **Down** | Burrow with beds and string lights | Mole tunnels, fossil, worms | Treasure cave, crystals, glowing mushrooms |

Tap the sun to make it night (and the moon to make it day). Drop a critter on the slide, swing, seesaw, a bed
or the balloon basket and it rides along. Drag a critter down into the soil to take it underground.

## Files

- `index.html` — page shell, title card, arrows, mini-map
- `js/core.js` — engine: camera, input (tap, drag, throw, strum, pan), tweens, particles
- `js/audio.js` — every sound, synthesized with WebAudio
- `js/backdrop.js` — sky, hills, sea, grass and sand, soil and tunnels
- `js/critters.js` — the seven critters
- `js/sky.js`, `js/skyzone.js` — sun/moon, clouds, stars, fireflies; balloon, plane, flock, planet, rocket
- `js/garden.js`, `js/home.js` — tree, apples, bird, flowers, butterflies; house, mailbox, pond, ball, trampoline
- `js/playground.js`, `js/beach.js` — playground and beach toys
- `js/underground.js`, `js/caves.js` — burrow, carrots, worms, mole; crystals, chest, fossil, mushrooms, lanterns
- `js/main.js` — places everything in the world and wires up navigation

No build step and no dependencies: open `index.html` through any static server. The GitHub Action in
`.github/workflows/pages.yml` deploys `main` to GitHub Pages.

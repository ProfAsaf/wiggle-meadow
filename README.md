# Wiggle Meadow

A tap-anything toy world for little kids, in the spirit of Sago Mini and Toca Boca. Every critter, cloud,
flower and apple reacts when you tap it, drag it or toss it. There's nothing to read, no score and no way to lose.

**Play:** https://profasaf.github.io/wiggle-meadow/

On an iPad, open the link in Safari and choose **Share → Add to Home Screen**. After the first visit it works
offline, and the meadow is remembered between visits (the title card has a "Start a fresh meadow" button).

## Getting around

A 4 × 3 world. A finger on the meadow never scrolls it, so dragging always moves the thing under your finger
(sliding across empty grass just leaves sparkles). The view moves only when you ask:

- **Arrow tabs** on the screen edges: tap to glide smoothly to the next area, hold to roll along.
- **Carrying something to an edge**: hold a critter (or block, hat, apple…) near a screen edge and the view rolls
  that way, faster the closer you get.
- **The map button** (top right) opens a little map to glide anywhere.
- **Pinch** with two fingers to zoom in and out (trackpad pinch or `+`/`-` on a computer; arrow keys work too).

| | 1 | 2 | 3 | 4 |
|---|---|---|---|---|
| **Up** | Sky | Sky, hot-air balloon | Outer space: ringed planet, rocket | Sky, banner plane, bird flock |
| **Middle** | House, garden, campfire kitchen, apple tree, pond | Toy yard: blocks, dress-up trunk, trampoline | Playground: slide, swing, seesaw, ice-cream cart | Beach: sea, boat, whale, crab, sandcastle, shells |
| **Down** | Burrow with beds and string lights | Fossil tunnel | Mole tunnels | Treasure cave, crystals |

## The deep toys

- **Blocks** (toy yard) — real physics. Tap the toy box for a new block, stack them, knock towers over, and put
  critters on top. Double-tap a block to turn it; drop one back in the toy box to tidy up.
- **Dress-up trunk** (toy yard) — hats, crowns, glasses, bows and scarves. Drop one on any critter to put it on;
  drag it off to take it back.
- **Campfire kitchen** (garden) — drop apples, carrots, cookies, ice cream or veggies from the basket into the
  pot, tap to stir, and serve the soup. Sweet and savoury together gets a "blegh!"
- **Super Pup** (the puppy with the star collar) — tap it and it spins into a cape and mask and flies. Drag it
  anywhere, tap it for loop-de-loops and zooms, drop a friend on it for a piggyback ride, or fly it through a block
  tower. After a long rest (sooner at night) it lands and turns back.

Tap the sun to make it night (and the moon to make it day). Drop a critter on the slide, swing, seesaw, a bed
or the balloon basket and it rides along. Drag a critter down into the soil to take it underground.

## Files

- `index.html` — page shell, title card, edge tabs, map and sound buttons
- `js/core.js` — engine: camera and zoom, input (tap, drag, throw, strum, pan, pinch), tweens, particles
- `js/audio.js` — every sound, synthesized with WebAudio
- `js/backdrop.js` — sky, hills, sea, grass and sand, soil and tunnels
- `js/critters.js`, `js/hero.js` — the critters; Super Pup
- `js/sky.js`, `js/skyzone.js` — sun/moon, clouds, stars, fireflies; balloon, plane, flock, planet, rocket
- `js/garden.js`, `js/home.js`, `js/kitchen.js` — tree, apples, flowers; house, pond, ball, trampoline; pot, basket, soup
- `js/blocks.js`, `js/dressup.js` — physics blocks and toy box; dress-up trunk and wearables
- `js/playground.js`, `js/beach.js` — playground and beach toys
- `js/underground.js`, `js/caves.js` — burrow, carrots, worms, mole; crystals, chest, fossil, mushrooms, lanterns
- `js/save.js` — remembers the meadow on this device
- `js/main.js` — places everything in the world and wires up navigation

No build step. The only library is [Matter.js](https://brm.io/matter-js/) for block physics, loaded from cdnjs.
Open `index.html` through any static server. The GitHub Action in `.github/workflows/pages.yml` deploys `main`
to GitHub Pages.

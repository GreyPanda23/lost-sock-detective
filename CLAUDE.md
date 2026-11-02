# Lost Sock Detective: Design Doc

A funny-noir point-and-click browser game. Vanilla HTML/CSS/JS, no build step, no frameworks, no network calls except Google Fonts (with fallbacks). All art is drawn in code; all sound is Web Audio.

## Story
Detective Lint, a sock-shaped private eye, works the Washing Machine Dimension, a noir city inside a washer drum. Mrs. Cotton's left sock vanished mid-cycle. Name the culprit before the Spin Cycle ends (a soft story clock that changes narration and flavor, never a hard fail).

**Culprit:** Fitted Sheet Fenwick, the Knot Boss. He tied the sock into an impossible knot in the Knot Tower.
**Secret ending:** if the player never accuses anyone and instead visits Mrs. Cotton's drawer clue and talks to the sock, it left on its own because it was tired of being the odd one out.

## Palette and type
Deep navy (#0b1630), soap-bubble teal (#3fd0c9), one warm amber accent (#ffb347) reserved for interactive things. Display face: Special Elite (fallback Courier New). Body face: Inter (fallback system-ui).

## Locations
1. **Drum Lobby** (hub): Mrs. Cotton, the case board, door to every location. Tower door unlocks after 3 clues.
2. **Lint Trap Alley**: lint dealer Fluffy Phil, locked gate, Tish the Tissue.
3. **Suds Harbour**: bartender Bleach Betty, bubble ferry, detergent docks.
4. **Hot Air Bazaar**: static vendor, Static Cling, heat lamp.
5. **Knot Tower**: Fenwick's hideout, final unknotting puzzle.

## Suspects (motive / alibi / lie)
| Suspect | Motive | Alibi | Lie |
|---|---|---|---|
| Bleach Betty | Hates mismatched socks | Poured drinks all cycle | Says she never met Mrs. Cotton (the ledger shows she did) |
| Pocket Change | Coin gang that "found" something | Counting coins | Claims they found a coin, not a sock; the wrapper shows otherwise (red herring) |
| Static Cling | Sticks to everything | At the Bazaar all cycle | Says he never left the Bazaar; three clues prove he did |
| Tish the Tissue | Shredded evidence | Was in the wash pocket | Says she saw nothing; her shreds hold the ticket stub |
| Fenwick | Collects odd socks | Napping in the tower | Says he has never tied a sock; his knot tag matches |

## Puzzle chain
1. **Coin bribe:** take the coin from the lobby fountain, give it to Fluffy Phil to open the Lint Trap gate.
2. **Heat lamp:** the soggy note (Suds Harbour) is unreadable; dry it under the Bazaar heat lamp to reveal "Tower, third bell".
3. **Item combine:** combine thread spool + safety pin = Knot Hook (needed in the tower).
4. **Alibi match:** present three clues (static-cling lint, ferry ticket stub, Bazaar vendor testimony) to expose Static Cling.
5. **Red herring:** the glittery button is a decoy; Pocket Change claims it, but it isn't the sock's.
6. **Tower gate:** unlocks only with 3 clues in the notebook.
7. **Unknotting:** click Fenwick's loops in the correct order (derived from the dried note: "Tower, third bell" gives the order 3,1,4,2).

## Endings
- **Win:** accuse Fenwick after the knot is undone. Sock returned, epilogue.
- **Wrong accusation:** "Case Dismissed" screen with a hint and retry.
- **Secret:** the sock left on its own.

## File layout
```
index.html          shell, screens, panels
style.css           noir styling, responsive, reduced-motion
js/engine.js        scene renderer, hotspots, verbs, narrator, save/load, game state
js/scenes.js        scene + hotspot data (plain objects)
js/dialogue.js      dialogue runner + dialogue data
js/inventory.js     items data + inventory bar, combine logic
js/audio.js         Web Audio blips, hum, mute
js/main.js          boot, screens, notebook, pause menu, endings
test/winning-path.js  Node script walking the full winning path through the data
README.md           run + how to add a scene
```

## Milestones (each committed and pushed)
a) engine + hub, b) inventory + dialogue, c) all scenes + puzzles, d) notebook + endings + audio, e) polish + tests.

## Implementation notes (as built)
- Engine rules live in `LSD.Core` (DOM-free) so `test/winning-path.js` plays the same code the browser runs.
- Content is data: responses are strings, effect objects (`say, give, take, clue, set, goto, dialogue, puzzle, end`), or arrays of `if` cases.
- Tower door unlocks with any 3 clues (as briefed). The Static Cling alibi puzzle is optional for the win but supplies the confession clue and the "Static Cling" contradiction; every other puzzle is on the critical path.
- Knot order is derivable from the dried note ("Yellow over Red over Blue over Green"), and the test proves it with a topological sort.
- Spin Cycle clock: 150 actions across Fill / Wash / Rinse / Spin, then "Extra Spin". It only changes narration and drum speed.
- Secret ending needs the sock diary (behind Phil's gate) and a talk with the freed sock.

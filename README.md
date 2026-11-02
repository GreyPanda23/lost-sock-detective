# Lost Sock Detective

A funny-noir point-and-click mystery that runs in the browser. You are Detective Lint, a sock-shaped private eye in the Washing Machine Dimension. Mrs. Cotton's left sock vanished mid-cycle. Interview suspects, collect clues, solve puzzles, and name the culprit.

Vanilla HTML, CSS and JavaScript. No build step, no frameworks, no external assets. All art is drawn in code and all sound comes from the Web Audio API. (The only network request is Google Fonts, which falls back to system fonts if offline.)

## Run it

Either open `index.html` directly in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

then visit http://localhost:8000. (Any static server works, for example `npx serve`.)

## Play

- Pick a verb (**Look**, **Talk**, **Take**, **Use**, or keys 1 to 4), then click something in the scene. Doors travel on any click.
- Click an **inventory item** to read about it, then click a hotspot to use it, or click a second item to combine them. Esc deselects.
- The **Notebook** lists clues, suspects, and a "Who Lied" tracker. **Make an Accusation** is inside it.
- The **Spin Cycle** meter at the top is a soft story clock. It changes the narration and the drum's speed, but it never ends your game.
- The sparkle button highlights every hotspot. Progress autosaves; **Continue Case** on the title screen resumes.
- Works with mouse, touch and keyboard (Tab to focus hotspots, Enter to act), at phone widths down to 400px. Animations respect `prefers-reduced-motion`.

## Test

```bash
node test/winning-path.js
```

The script loads the game data and the same rules the browser uses, then:

1. checks every scene, hotspot, item, clue, puzzle and dialogue node resolves and is reachable (every hotspot must have a narrator line);
2. plays the whole game from a fresh state to the winning ending, and checks the wrong-accusation and secret endings;
3. tries every hotspot with every verb and every item, and fails if anything leaves the player without a narrator line.

It exits non-zero on any failure.

## Layout

```
index.html        shell: screens and overlays
style.css         noir styling, responsive, reduced-motion
js/engine.js      LSD.Core (rules: conditions, effects, verbs, puzzles), LSD.Save, LSD.UI (stage, narrator, dialogue box, puzzles)
js/scenes.js      art helpers, characters, puzzle data, and the five scenes
js/dialogue.js    clues, suspects, contradictions, dialogue trees, endings, and the dialogue runner
js/inventory.js   items, combine recipes, inventory bar
js/audio.js       Web Audio blips, washer hum, mute
js/main.js        title, intro, pause, notebook, accusations, endings
test/winning-path.js
CLAUDE.md         design doc
```

## Add a new scene

Everything is plain data. To add, say, a "Fabric Softener Spa":

1. **Scene.** In `js/scenes.js`, add an object to `LSD.scenes` (above the `@@SCENES` marker; `exitHotspot` is a helper defined there):

   ```js
   LSD.scenes.spa = {
     id: 'spa',
     name: 'Fabric Softener Spa',
     first: { say: 'You push through the steam. Everything here is suspiciously soft.' }, // first visit
     again: { say: 'The spa. Still soft.' },                                              // later visits
     bg: () => `<rect width="800" height="450" fill="#1b2f66"/>`,                          // SVG in an 800x450 space
     hotspots: [
       {
         id: 'masseuse', name: 'Masseuse', rect: [300, 160, 120, 180],                     // [x, y, w, h]
         art: LSD.Art.chars.cotton(360, 340, 1.2),                                         // SVG string, or (S) => string
         look: 'A very relaxed bath towel. Possibly a witness. Definitely a professional.', // REQUIRED for every hotspot
         talk: { dialogue: 'masseuse' },                                                   // start a dialogue
         take: 'You cannot take a masseuse.',
         useWith: { coin: { take: ['coin'], give: ['soap'], say: 'A tip. And a soap.' } },
       },
       exitHotspot('Back to the Lobby'),
     ],
   };
   ```

2. **Door.** Add a hotspot with `go: 'spa'` to another scene (usually the lobby). Add `lock: { cond: {...}, say: '...' }` to gate it.
3. **Content.** Add the items (`LSD.items` in `js/inventory.js`), clues (`LSD.clues` in `js/dialogue.js`) and dialogue trees (`LSD.dialogues`) you referenced.
4. **Run the test.** `node test/winning-path.js` will flag a missing narrator line, an unknown item or clue, a broken `goto`, or an unreachable dialogue node.

### Responses and conditions

A response (`look`, `take`, `use`, an `useWith` entry, a dialogue `fx`) is a string, an effect object, or an array of cases where the first matching `if` wins:

```js
take: [
  { if: { flag: 'got_pin' }, say: 'Nothing left.' },
  { give: ['safety_pin'], set: { got_pin: true }, say: 'You pocket the pin.' },
]
```

Effects: `say`, `give[]`, `take[]`, `clue[]`, `set{}`, `goto`, `dialogue`, `puzzle`, `end`.
Conditions: `{has:'item'}`, `{clue:'id'}`, `{flag:'name'}`, `{is:['flag', value]}`, `{clues: 3}`, `{seen:'key'}`, `{all:[...]}`, `{any:[...]}`, `{not: cond}`.

Dialogue options only appear if their `if` holds, so clue-gated options are just `{ text: '...', if: { clue: 'id' } }`. A `once: true` choice disappears after it is used.

## Credits

Everything in this folder (code, art, copy) was made for this game. The fonts are Special Elite and Inter from Google Fonts.

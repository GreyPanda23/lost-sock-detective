#!/usr/bin/env node
/*
 * Winning-path test.  Run:  node test/winning-path.js
 *
 * 1. Static checks over the game data (scenes, items, clues, dialogue, puzzles): every reference must resolve,
 *    every hotspot needs a narrator `look` line, every item/clue/dialogue node must be obtainable/reachable.
 * 2. Plays the whole game through LSD.Core / LSD.Dialogue (the same rules the browser uses) from a fresh state
 *    to the winning ending, then checks the wrong-accusation and secret endings are reachable too.
 * Exits non-zero on the first failure.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const root = path.join(__dirname, '..');
globalThis.LSD = {};
['inventory', 'engine', 'scenes', 'dialogue'].forEach((f) => {
  const file = path.join(root, 'js', f + '.js');
  vm.runInThisContext(fs.readFileSync(file, 'utf8'), { filename: file });
});
const { Core, Dialogue } = LSD;

let checks = 0;
const ok = (cond, msg) => { checks++; assert.ok(cond, msg); };
const section = (t) => console.log('\n' + t);

/* ---------- helpers: walk every effect object in the data ---------- */
function effectsOf(R, acc = []) {
  if (R == null) return acc;
  if (typeof R === 'string') return acc;
  if (Array.isArray(R)) { R.forEach((r) => effectsOf(r, acc)); return acc; }
  acc.push(R);
  return acc;
}
function allEffects() {
  const list = [];
  Object.values(LSD.scenes).forEach((sc) => {
    effectsOf(sc.first, list); effectsOf(sc.again, list);
    sc.hotspots.forEach((h) => {
      ['look', 'talk', 'take', 'use'].forEach((v) => effectsOf(h[v], list));
      Object.values(h.useWith || {}).forEach((r) => effectsOf(r, list));
    });
  });
  Object.values(LSD.dialogues).forEach((d) => Object.values(d.nodes).forEach((n) => {
    effectsOf(n.fx, list);
    if (Array.isArray(n.choices)) n.choices.forEach((c) => effectsOf(c.fx, list));
  }));
  Object.values(LSD.puzzles).forEach((p) => effectsOf(p.success, list));
  return list;
}
const hasText = (s) => typeof s === 'string' ? s.trim().length > 0 : Array.isArray(s) && s.length > 0;

/* =====================================================================
 *  1. STATIC DATA CHECKS
 * ===================================================================== */
section('Static data checks');
const effects = allEffects();

// scenes + hotspots
const sceneIds = Object.keys(LSD.scenes);
ok(sceneIds.length === 5, 'expected 5 scenes, found ' + sceneIds.length);
sceneIds.forEach((sid) => {
  const sc = LSD.scenes[sid];
  ok(sc.id === sid, `scene id mismatch: ${sid}`);
  ok(sc.name && sc.first && sc.again, `scene ${sid} needs name/first/again`);
  const seen = new Set();
  sc.hotspots.forEach((h) => {
    const where = `${sid}.${h.id}`;
    ok(!seen.has(h.id), `duplicate hotspot id ${where}`);
    seen.add(h.id);
    ok(h.name, `${where} needs a name`);
    ok(Array.isArray(h.rect) && h.rect.length === 4, `${where} needs rect [x,y,w,h]`);
    const [x, y, w, hh] = h.rect;
    ok(x >= 0 && y >= 0 && w > 0 && hh > 0 && x + w <= 800 && y + hh <= 450, `${where} rect outside the 800x450 stage`);
    ok(h.look != null, `${where} has no look line (every hotspot needs a narrator line)`);
    const looks = effectsOf(typeof h.look === 'string' ? [{ say: h.look }] : h.look);
    ok(looks.every((l) => hasText(l.say)), `${where} look case without text`);
    ok(h.art != null, `${where} needs art`);
    if (h.go) {
      ok(LSD.scenes[h.go], `${where} exits to missing scene ${h.go}`);
      if (h.lock) ok(hasText(h.lock.say), `${where} lock needs a narrator line`);
    }
    if (h.talk) effectsOf(h.talk).forEach((e) => { if (e.dialogue) ok(LSD.dialogues[e.dialogue], `${where} talks to missing dialogue ${e.dialogue}`); });
    Object.keys(h.useWith || {}).forEach((i) => ok(i === '*' || LSD.items[i], `${where} useWith unknown item ${i}`));
  });
  // every scene is a hub or leads back to it
  if (sid !== 'lobby') ok(sc.hotspots.some((h) => h.go === 'lobby'), `${sid} has no way back to the lobby`);
});
console.log(`  ${sceneIds.length} scenes, ${sceneIds.reduce((n, s) => n + LSD.scenes[s].hotspots.length, 0)} hotspots, all with narrator lines`);

// effect references
const given = new Set(), clued = new Set(), flagsSet = new Set(), dialogues = new Set(), puzzles = new Set(), ends = new Set(), gotos = new Set();
effects.forEach((e) => {
  (e.give || []).forEach((i) => { ok(LSD.items[i], `give of unknown item ${i}`); given.add(i); });
  (e.take || []).forEach((i) => ok(LSD.items[i], `take of unknown item ${i}`));
  (e.clue || []).forEach((c) => { ok(LSD.clues[c], `unknown clue ${c}`); clued.add(c); });
  Object.keys(e.set || {}).forEach((f) => flagsSet.add(f));
  if (e.dialogue) { ok(LSD.dialogues[e.dialogue], `unknown dialogue ${e.dialogue}`); dialogues.add(e.dialogue); }
  if (e.puzzle) { ok(LSD.puzzles[e.puzzle], `unknown puzzle ${e.puzzle}`); puzzles.add(e.puzzle); }
  if (e.end) { ok(['win', 'secret', 'dismissed'].includes(e.end), `unknown ending ${e.end}`); ends.add(e.end); }
  if (e.goto) { ok(LSD.scenes[e.goto], `goto missing scene ${e.goto}`); gotos.add(e.goto); }
});
Object.values(LSD.scenes).forEach((s) => s.hotspots.forEach((h) => effectsOf(h.talk).forEach((e) => e.dialogue && dialogues.add(e.dialogue))));

// items & clues obtainable
LSD.combos.forEach((c) => { ok(LSD.items[c.a] && LSD.items[c.b] && LSD.items[c.result], 'combo references unknown item'); given.add(c.result); });
Object.keys(LSD.items).forEach((i) => ok(given.has(i), `item ${i} can never be obtained`));
Object.values(LSD.items).forEach((it) => it.clue && clued.add(it.clue));
Object.keys(LSD.clues).forEach((c) => ok(clued.has(c), `clue ${c} can never be found`));
Object.values(LSD.items).forEach((it) => ok(it.name && it.desc && it.icon, 'item needs name, desc and icon'));
console.log(`  ${Object.keys(LSD.items).length} items and ${Object.keys(LSD.clues).length} clues are all obtainable`);

// dialogue graph
Object.keys(LSD.dialogues).forEach((id) => {
  const d = LSD.dialogues[id];
  ok(dialogues.has(id), `dialogue ${id} is never started by anything`);
  const reach = new Set();
  const visit = (n) => {
    if (n == null || reach.has(n)) return;
    ok(d.nodes[n], `dialogue ${id} references missing node ${n}`);
    reach.add(n);
    const node = d.nodes[n];
    if (node.then) visit(node.then);
    let list = node.choices || [];
    if (typeof list === 'string') { visit(list.slice(1)); list = d.nodes[list.slice(1)].choices; }
    list.forEach((c) => visit(c.next));
  };
  (d.starts || [{ node: d.start }]).forEach((s) => visit(s.node));
  Object.keys(d.nodes).forEach((n) => ok(reach.has(n), `dialogue ${id}: node ${n} is unreachable`));
});
console.log(`  ${Object.keys(LSD.dialogues).length} dialogues, every node reachable`);

// suspects, contradictions, endings, puzzles
ok(Object.keys(LSD.suspects).length === 5, 'five suspects');
Object.keys(LSD.suspects).forEach((s) => {
  const x = LSD.suspects[s];
  ok(x.motive && x.alibi && LSD.Art.chars[x.portrait], `suspect ${s} needs motive, alibi, portrait`);
  ok(LSD.contradictions.some((c) => c.suspect === s), `suspect ${s} needs a lie in the contradiction tracker`);
  if (s !== 'fenwick') ok(x.dismiss && x.dismiss.hint, `suspect ${s} needs a dismissal hint`);
});
LSD.contradictions.forEach((c) => {
  ok(flagsSet.has(c.claimFlag), `claim flag ${c.claimFlag} is never set`);
  c.proof.forEach((p) => ok(LSD.clues[p], `contradiction ${c.id}: unknown proof clue ${p}`));
});
['win', 'secret'].forEach((e) => { ok(LSD.endings[e] && ends.has(e), `ending ${e} must exist and be reachable from data`); });
ok(Object.keys(LSD.puzzles).length >= 2, 'puzzles defined');
console.log('  suspects, contradictions, endings, puzzles are well-formed');

/* =====================================================================
 *  2. SIMULATED PLAYTHROUGH
 * ===================================================================== */
section('Playthrough');
let S, endSeen, log;
const feed = (out) => {
  if (!out) return out;
  log.push(...out.lines);
  if (out.end) endSeen = out.end;
  if (out.puzzle) pendingPuzzle = out.puzzle;
  if (out.dialogue && !out.puzzle) pendingDialogue = out.dialogue;
  return out;
};
let pendingPuzzle = null, pendingDialogue = null;

const start = () => { S = Core.newState(); endSeen = null; log = []; pendingPuzzle = null; pendingDialogue = null; feed((() => { const o = Core.newOut(); Core.enterScene(S, 'lobby', o); return o; })()); };
const step = (verb, hs, item) => {
  const before = S.scene;
  const sc = LSD.scenes[S.scene];
  const h = sc.hotspots.find((x) => x.id === hs);
  ok(h, `[${before}] no hotspot '${hs}'`);
  ok(Core.cond(h.show, S), `[${before}] hotspot '${hs}' is not visible yet`);
  return feed(Core.act(S, hs, verb, item));
};
const has = (item) => ok(S.inv.includes(item), `should hold ${item}`);
const hasClue = (c) => ok(S.clues.includes(c), `should know clue ${c}`);
const inScene = (s) => ok(S.scene === s, `should be in ${s}, am in ${S.scene}`);

/* Talk through a dialogue by choosing options whose text contains each fragment, in order. */
function talk(hsOrId, picks) {
  let r;
  if (LSD.dialogues[hsOrId]) { r = Dialogue.start(S, hsOrId); feed(r.out); }
  else {
    const out = step('talk', hsOrId);
    ok(out.dialogue, `talking to ${hsOrId} should start a dialogue`);
    r = Dialogue.start(S, out.dialogue); feed(r.out);
    pendingDialogue = null;
  }
  const settle = () => {
    while (r.view && r.view.choices.length === 1 && r.view.choices[0].idx === -1) { r = Dialogue.choose(S, -1); feed(r.out); }
  };
  settle();
  for (const frag of picks) {
    ok(r.view, `dialogue ended before choosing "${frag}"`);
    const c = r.view.choices.find((x) => x.text.includes(frag));
    ok(c, `no visible choice containing "${frag}"; have: ${r.view.choices.map((x) => x.text).join(' | ')}`);
    r = Dialogue.choose(S, c.idx); feed(r.out);
    settle();
  }
  if (r.view) { // leave: pick the last (exit) option or continue
    const leave = r.view.choices.find((x) => !x.gated && /(find it|Never mind|Just passing|Carry on|Leave|Just browsing|Bless you|Thanks|admiring)/.test(x.text));
    if (leave) { r = Dialogue.choose(S, leave.idx); feed(r.out); }
  }
  return r;
}
const goto = (door) => { step('use', door); };

/* ----- the winning path ----- */
start();
inScene('lobby');

// The Knot Tower is locked until three clues exist.
step('use', 'door_tower');
inScene('lobby');
ok(log.some((l) => /three solid clues/.test(l)), 'tower lock should explain the three-clue rule');

// Lobby: meet the client, grab the coin and the thread
talk('cotton', ['Tell me about the sock', 'Where were you', 'Anyone with a grudge']);
hasClue('cotton_regular');
ok(S.flags.suspects_known, 'suspects should be introduced');
step('take', 'couch'); has('coin');
step('take', 'basket'); has('thread_spool');

// Lint Trap Alley: the coin bribe puzzle
step('use', 'door_alley'); inScene('alley');
ok(!Core.cond(LSD.scenes.alley.hotspots.find((h) => h.id === 'lost_found').show, S), 'lost & found sits behind the locked gate');
step('use', 'gate');
ok(!S.flags.gate_open, 'gate must stay locked without a bribe');
talk('phil', ['Heard anything', 'Open the gate', 'Slide him a coin']);
ok(S.flags.gate_open, 'bribing Phil opens the gate');
hasClue('phil_tip');
ok(!S.inv.includes('coin'), 'the coin is spent');
step('take', 'lost_found'); has('safety_pin');
step('take', 'diary'); has('sock_diary'); hasClue('sock_diary');

// Item combine puzzle (and a wrong combine for good measure)
let wrongCombine = Core.combine(S, 'safety_pin', 'sock_diary');
ok(wrongCombine.lines.length > 0 && !S.inv.includes('knot_hook'), 'a wrong combine gets a narrator line and changes nothing');
feed(Core.combine(S, 'thread_spool', 'safety_pin'));
has('knot_hook'); ok(!S.inv.includes('safety_pin') && !S.inv.includes('thread_spool'), 'combine consumes both parts');

// Tish and her shreds: you have to talk to her before touching her shreds
step('take', 'shreds'); ok(!S.inv.includes('ferry_stub'), 'shreds are off-limits until you have spoken to Tish');
talk('tish', ['Why shred everything']);
step('take', 'shreds'); has('ferry_stub'); hasClue('ferry_stub');
talk('tish', ['ferry stub in your shreds']); hasClue('tish_saw');
step('use', 'exit'); inScene('lobby');

// Suds Harbour: lint, soggy note, two liars
step('use', 'door_harbour'); inScene('harbour');
step('take', 'bollard'); has('clingy_lint'); hasClue('static_lint');
step('take', 'bench'); has('soggy_note');
talk('betty', ['Do you know Mrs. Cotton', 'Mrs. Cotton says']);
ok(S.flags.claim_betty && S.flags.betty_cleared, "Betty's lie and her cleared alibi are logged");
hasClue('betty_cleared');
talk('pocket', ['glittery']); has('glitter_button'); hasClue('pocket_button');
step('use', 'ferry'); step('use', 'ferry', 'ferry_stub'); step('look', 'bar_sign');
step('use', 'exit'); inScene('lobby');

// Red herring: the button is Mrs. Cotton's
step('use', 'cotton', 'glitter_button');
hasClue('button_cleared');

// Hot Air Bazaar: the heat-lamp puzzle
step('use', 'door_bazaar'); inScene('bazaar');
talk('zed', ['Seen Static Cling', 'heat lamp']);
hasClue('vendor_testimony');
step('look', 'care_sign');
step('use', 'heat_lamp', 'soggy_note'); has('soggy_note');                      // lamp is off
step('use', 'lamp_dial'); ok(S.flags.lamp === 1, 'dial: low');
step('use', 'heat_lamp', 'soggy_note'); has('soggy_note');                      // too cool
step('use', 'lamp_dial'); step('use', 'lamp_dial'); ok(S.flags.lamp === 3, 'dial: high');
step('use', 'heat_lamp', 'soggy_note'); has('soggy_note');                      // too hot, but nothing is lost
step('use', 'lamp_dial'); step('use', 'lamp_dial'); ok(S.flags.lamp === 1 || S.flags.lamp === 0, 'dial wraps around');
while ((S.flags.lamp || 0) !== 2) step('use', 'lamp_dial');
step('use', 'heat_lamp', 'soggy_note');
has('dried_note'); ok(!S.inv.includes('soggy_note'), 'the soggy note is replaced');
hasClue('tower_note');

// The note's logic really does determine the knot order (topological sort of "X lies over Y")
const rel = [...LSD.items.dried_note.desc.matchAll(/(\w+) lies over (\w+)/g)].map((m) => [m[1].toLowerCase(), m[2].toLowerCase()]);
const nodes = [...new Set(rel.flat())];
const order = [];
while (nodes.length) {
  const top = nodes.find((n) => !rel.some(([a, b]) => b === n && nodes.includes(a)));
  ok(top, 'note relations must not be circular');
  order.push(top); nodes.splice(nodes.indexOf(top), 1);
}
assert.deepStrictEqual(order, LSD.puzzles.knot.solution, 'knot solution must follow from the note');

// Alibi puzzle: expose Static Cling with three clues
talk('static', ['Where were you', 'Lay out the evidence']);
ok(pendingPuzzle === 'alibi', 'laying out evidence opens the alibi puzzle');
const bad1 = Core.solvePuzzle(S, 'alibi', ['cotton_regular', 'phil_tip', 'pocket_button']);
ok(!bad1.ok, 'irrelevant clues must fail');
const bad2 = Core.solvePuzzle(S, 'alibi', ['static_lint', 'ferry_stub', 'cotton_regular']);
ok(!bad2.ok && /Two of those are good/.test(bad2.out.lines.join(' ')), 'two good plus one bad gets the "close" hint');
const good = Core.solvePuzzle(S, 'alibi', ['static_lint', 'ferry_stub', 'vendor_testimony']);
ok(good.ok, 'the three real clues expose Static Cling'); feed(good.out);
ok(S.flags.static_exposed && good.out.dialogue === 'static', 'success continues into his confession');
talk('static', ['Thanks for the truth']); hasClue('static_confession');
step('use', 'exit'); inScene('lobby');

// The Knot Tower: now unlocked
step('use', 'door_tower'); inScene('tower');
talk('fenwick', ['Where were you']);   // logs his lie before the evidence
step('look', 'knot_tag'); hasClue('knot_tag');
talk('fenwick', ['Your tag is on that knot']);   // clue-gated option appears once you hold the tag clue
step('use', 'knot'); ok(!S.flags.knot_undone, 'bare hands cannot undo the knot');
step('use', 'knot', 'knot_hook');
ok(pendingPuzzle === 'knot', 'the hook starts the unknotting puzzle');
const wrongKnot = Core.solvePuzzle(S, 'knot', ['red', 'blue', 'green', 'yellow']);
ok(!wrongKnot.ok && !S.flags.knot_undone, 'wrong loop order fails and loses nothing');
const knot = Core.solvePuzzle(S, 'knot', LSD.puzzles.knot.solution);
ok(knot.ok, 'the right order unties the knot'); feed(knot.out);
ok(S.flags.knot_undone, 'knot undone');

const snapPreSock = JSON.stringify(S);

// Case notebook: every suspect has a logged claim and enough proof to expose the lie
LSD.contradictions.forEach((c) => {
  ok(S.flags[c.claimFlag], `claim logged for ${c.suspect}`);
  const have = c.proof.filter((p) => S.clues.includes(p)).length;
  ok(have >= (c.needProof || c.proof.length), `lie of ${c.suspect} is exposed`);
});

// Accusing Fenwick without the sock is not enough
const noProof = Core.accuse(JSON.parse(snapPreSock), 'fenwick');
ok(noProof.result === 'noproof', 'accusing without the sock is refused');

step('take', 'sock'); has('left_sock');
ok(!Core.cond(LSD.scenes.tower.hotspots.find((h) => h.id === 'sock').show, S), 'sock hotspot disappears once taken');

const snapReady = JSON.stringify(S);

// Wrong accusations: every non-culprit gets a "case dismissed" with a hint
Object.keys(LSD.suspects).filter((x) => x !== 'fenwick').forEach((id) => {
  const r = Core.accuse(JSON.parse(snapReady), id);
  ok(r.result === 'dismissed' && r.out.end === 'dismissed' && r.out.suspect === id, `wrong accusation of ${id} is dismissed`);
});

// Winning ending A: Notebook accusation
const winA = Core.accuse(JSON.parse(snapReady), 'fenwick');
ok(winA.result === 'win' && winA.out.end === 'win', 'notebook accusation of Fenwick wins');

// Winning ending B: accuse him to his face
S = JSON.parse(snapReady); endSeen = null;
talk('fenwick', ['It was you, Fenwick']);
ok(endSeen === 'win', 'accusing Fenwick in conversation wins');

// Secret ending: the sock leaves on its own (needs the diary)
S = JSON.parse(snapPreSock); endSeen = null;
talk('sock', ['I read your diary', 'not the odd one out']);
ok(endSeen === 'secret', 'secret ending is reachable');

// Taking the sock through its own dialogue also works
S = JSON.parse(snapPreSock); endSeen = null;
talk('sock', ['Come with me']); has('left_sock');

// The secret ending is gated behind the diary clue
S = JSON.parse(snapPreSock); S.clues = S.clues.filter((c) => c !== 'sock_diary'); endSeen = null;
const sockView = Dialogue.start(S, 'sock').view;
ok(!sockView.choices.some((c) => /odd one out/.test(c.text)), 'secret option stays hidden without the diary');

// Clock + save format
ok(S.turns > 20 && Core.phaseName(S.turns) !== undefined, 'story clock advances');
ok(JSON.parse(JSON.stringify(S)).scene === S.scene, 'state serialises cleanly');
console.log(`  win path: ${JSON.parse(snapReady).turns} actions, ${JSON.parse(snapReady).clues.length}/${Object.keys(LSD.clues).length} clues, phase "${Core.phaseName(JSON.parse(snapReady).turns)}"`);

/* ----- every hotspot x every verb x every item gives the narrator something to say ----- */
section('Narrator coverage (every hotspot, verb and wrong guess)');
const states = [Core.newState(), JSON.parse(snapReady)];
states[0].inv = Object.keys(LSD.items);                                  // everything in hand
states[1].inv = Object.keys(LSD.items);
let probes = 0;
states.forEach((base) => {
  Object.keys(LSD.scenes).forEach((sid) => {
    LSD.scenes[sid].hotspots.forEach((h) => {
      const tries = [['look'], ['talk'], ['take'], ['use']].concat(Object.keys(LSD.items).map((i) => ['use', i]));
      tries.forEach(([verb, item]) => {
        const c = JSON.parse(JSON.stringify(base)); c.scene = sid;
        if (!Core.cond(h.show, c)) return;
        const out = Core.act(c, h.id, verb, item);
        probes++;
        ok(out.lines.length > 0 || out.dialogue || out.puzzle || out.end, `${sid}.${h.id} [${verb}${item ? ' ' + item : ''}] gave the player nothing`);
        out.lines.forEach((l) => ok(typeof l === 'string' && l.length > 3, `${sid}.${h.id} produced an empty narrator line`));
      });
    });
  });
});
console.log(`  ${probes} interactions all produce narrator output`);

console.log(`\nAll ${checks} checks passed. The winning path is complete and has no dead ends.`);

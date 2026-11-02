/*
 * Engine.
 *   LSD.Core : DOM-free game rules (conditions, effects, verbs, puzzles). Also loaded by test/winning-path.js.
 *   LSD.Save : localStorage wrapper (always try/catch).
 *   LSD.UI   : stage renderer, verbs, narrator, inventory bar, dialogue box, puzzle panels.
 *
 * Content lives in plain objects: LSD.scenes (scenes.js), LSD.dialogues (dialogue.js), LSD.items (inventory.js).
 *
 * Conditions (`if`, `show`, `lock.cond`) are small objects:
 *   {has:'item'} {clue:'id'} {flag:'name'} {is:['flag', value]} {clues:3} {seen:'key'}
 *   {all:[...]} {any:[...]} {not:cond}  or an array (= all).
 * Effects (a response, a dialogue `fx`) can combine any of:
 *   say, give[], take[], clue[], set{}, goto, dialogue, puzzle, end
 * A response is a string, an effect object, or an array of effect objects whose first matching `if` wins.
 */
(function () {
  'use strict';
  const LSD = (globalThis.LSD = globalThis.LSD || {});

  /* =====================================================================
   *  CORE
   * ===================================================================== */
  const PHASES = [
    { name: 'Fill', until: 12 },
    { name: 'Wash', until: 50 },
    { name: 'Rinse', until: 95 },
    { name: 'Spin', until: 150 },
  ];
  const PHASE_LINES = [
    '',
    'Main wash. Evidence left lying around gets scrubbed. Metaphorically. Mostly.',
    'Rinse cycle. Everything looks cleaner, including the lies. Especially the lies.',
    'Spin cycle. The walls blur and the case gets dizzy. Keep it together, Lint.',
    'Extra spin. The drum should have stopped by now, but it likes you. Take your time.',
  ];
  const SPIN_SECONDS = [70, 48, 34, 20, 12];

  LSD.fallbacks = {
    look: [
      'You squint at the {name}. It squints back. Nothing new.',
      'The {name}. It is exactly as interesting as it looks.',
      'You study the {name} like a man who has read three detective novels. Nothing.',
    ],
    talk: [
      'You address the {name}. The {name} declines to participate in a conversation.',
      'You say a few words to the {name}. The silence that follows is professional.',
      'Talking to the {name}: it is not much of a listener.',
    ],
    take: [
      "You can't take the {name}. Believe me, you've considered it.",
      'The {name} is not going anywhere, and neither are your pockets.',
      'You reach for the {name}. Your conscience, and the laws of physics, say no.',
    ],
    use: [
      'You poke the {name}. Nothing happens, but you feel something.',
      'You try the {name} every way you can think of. The drum spins on.',
      'Using the {name} bare-handed gets you nowhere. Maybe you need a tool.',
    ],
    useWith: [
      'The {item} and the {name} have nothing in common but you.',
      'You try the {item} on the {name}. The {name} is not impressed.',
      'Wrong guess. The {item} does nothing to the {name} but embarrass you both.',
    ],
    combine: [
      'The {a} and the {b} stare at each other. No chemistry.',
      'You press the {a} against the {b}. They remain two separate disappointments.',
    ],
  };

  function phaseIndex(t) {
    for (let i = 0; i < PHASES.length; i++) if (t < PHASES[i].until) return i;
    return PHASES.length;
  }
  function phaseName(t) { const i = phaseIndex(t); return i < PHASES.length ? PHASES[i].name : 'Extra Spin'; }

  function newState() {
    return {
      v: 1, scene: 'lobby', inv: [], clues: [], flags: {}, seen: {}, visited: {},
      turns: 0, phase: 0, verb: 'look', ended: null, wrong: 0, introDone: false,
    };
  }
  function newOut() { return { lines: [], sfx: [], newClues: [], newItems: [], moved: false }; }

  function cond(c, S) {
    if (c == null) return true;
    if (Array.isArray(c)) return c.every((x) => cond(x, S));
    if (c.all) return c.all.every((x) => cond(x, S));
    if (c.any) return c.any.some((x) => cond(x, S));
    if ('not' in c) return !cond(c.not, S);
    if ('has' in c) return S.inv.includes(c.has);
    if ('clue' in c) return S.clues.includes(c.clue);
    if ('flag' in c) return !!S.flags[c.flag];
    if ('is' in c) return (S.flags[c.is[0]] || 0) === c.is[1];
    if ('clues' in c) return S.clues.length >= c.clues;
    if ('seen' in c) return !!S.seen[c.seen];
    return false;
  }

  /* Turn a response (string | effect | array of cases) into one effect object, or null. */
  function resolve(R, S) {
    if (R == null) return null;
    if (typeof R === 'string') return { say: R };
    if (Array.isArray(R)) {
      for (const r of R) if (cond(r.if, S)) return typeof r === 'string' ? { say: r } : r;
      return null;
    }
    return cond(R.if, S) ? R : null;
  }

  function pushLines(out, say) {
    if (say == null) return;
    (Array.isArray(say) ? say : [say]).forEach((l) => out.lines.push(l));
  }

  function addClue(S, id, out) {
    if (!LSD.clues || !LSD.clues[id]) throw new Error('Unknown clue: ' + id);
    if (!S.clues.includes(id)) { S.clues.push(id); out.newClues.push(id); out.sfx.push('clue'); }
  }
  function giveItem(S, id, out) {
    if (!LSD.items[id]) throw new Error('Unknown item: ' + id);
    if (LSD.Inventory.add(S, id)) { out.newItems.push(id); out.sfx.push('pickup'); }
    if (LSD.items[id].clue) addClue(S, LSD.items[id].clue, out);
  }

  function apply(E, S, out) {
    if (!E) return out;
    pushLines(out, E.say);
    (E.give || []).forEach((id) => giveItem(S, id, out));
    (E.take || []).forEach((id) => LSD.Inventory.remove(S, id));
    (E.clue || []).forEach((id) => addClue(S, id, out));
    if (E.set) Object.assign(S.flags, E.set);
    if (E.goto) out.goto = E.goto;
    if (E.dialogue) out.dialogue = E.dialogue;
    if (E.puzzle) out.puzzle = E.puzzle;
    if (E.end) out.end = E.end;
    return out;
  }

  function hash(str) { let h = 7; for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0; return h; }
  function fallback(kind, seed, vars) {
    const list = LSD.fallbacks[kind];
    let t = list[hash(seed) % list.length];
    Object.keys(vars).forEach((k) => { t = t.split('{' + k + '}').join(vars[k]); });
    return t;
  }

  function findHotspot(S, id) {
    const sc = LSD.scenes[S.scene];
    return sc ? sc.hotspots.find((h) => h.id === id) : null;
  }
  function visibleHotspots(S) {
    const sc = LSD.scenes[S.scene];
    return sc.hotspots.filter((h) => cond(h.show, S));
  }

  function tick(S, out) {
    S.turns++;
    const p = phaseIndex(S.turns);
    if (p > S.phase) { S.phase = p; pushLines(out, PHASE_LINES[p]); out.sfx.push('phase'); }
  }

  function enterScene(S, id, out) {
    const sc = LSD.scenes[id];
    if (!sc) { pushLines(out, "That door is painted on. The artist was very committed."); return; }
    S.scene = id;
    out.moved = true;
    const first = !S.visited[id];
    S.visited[id] = true;
    const r = resolve(first ? sc.first : sc.again, S);
    if (r) { const g = out.goto; apply(r, S, out); out.goto = g; }
    out.sfx.push('door');
  }

  /* A verb (or an item, via itemId) used on a hotspot. */
  function act(S, hsId, verb, itemId) {
    const out = newOut();
    const h = findHotspot(S, hsId);
    if (!h || !cond(h.show, S)) return out;

    if (h.go) {
      if (h.lock && !cond(h.lock.cond, S)) {
        pushLines(out, h.lock.say);
        out.sfx.push('error');
      } else {
        pushLines(out, h.look);
        enterScene(S, h.go, out);
      }
      tick(S, out);
      return out;
    }

    let R = null;
    if (itemId) {
      const table = h.useWith || {};
      R = resolve(table[itemId] !== undefined ? table[itemId] : table['*'], S);
      if (!R) {
        R = { say: fallback('useWith', h.id + itemId + S.turns, { item: LSD.items[itemId].name, name: h.name }) };
        out.sfx.push('error');
      }
    } else {
      R = resolve(h[verb], S);
      if (!R) {
        R = { say: fallback(verb, h.id + verb + S.turns, { name: h.name }) };
        if (verb !== 'look') out.sfx.push('error');
      }
    }
    apply(R, S, out);
    if (out.goto) { const g = out.goto; out.goto = null; enterScene(S, g, out); }
    tick(S, out);
    return out;
  }

  function combine(S, a, b) {
    const out = newOut();
    const c = LSD.Inventory.findCombo(a, b);
    if (c) {
      LSD.Inventory.remove(S, c.a);
      LSD.Inventory.remove(S, c.b);
      giveItem(S, c.result, out);
      pushLines(out, c.say);
    } else {
      pushLines(out, fallback('combine', a + b, { a: LSD.items[a].name, b: LSD.items[b].name }));
      out.sfx.push('error');
    }
    tick(S, out);
    return out;
  }

  /* ----- puzzles ----- */
  function solvePuzzle(S, id, answer) {
    const p = LSD.puzzles[id];
    const out = newOut();
    let ok = false;
    if (p.kind === 'pick') {
      const valid = answer.filter((c) => p.valid.includes(c)).length;
      const invalid = answer.length - valid;
      ok = answer.length === p.need && invalid === 0;
      if (!ok) pushLines(out, valid >= 2 && invalid >= 1 ? p.fail.close : p.fail.far);
    } else if (p.kind === 'order') {
      ok = answer.length === p.solution.length && answer.every((x, i) => x === p.solution[i]);
      if (!ok) pushLines(out, p.fail);
    }
    if (ok) { apply(p.success, S, out); S.flags['solved_' + id] = true; out.sfx.push('win'); }
    else out.sfx.push('error');
    tick(S, out);
    return { ok, out };
  }

  /* ----- accusation ----- */
  function accuse(S, suspectId) {
    const out = newOut();
    if (suspectId === 'fenwick') {
      if (!S.inv.includes('left_sock')) {
        pushLines(out, [
          'You level the finger of justice at Fenwick. Fenwick levels an eyebrow back. "Prove it, detective. Where is the sock?"',
          'No sock, no case. You lower your finger. Even justice needs a tangible exhibit.',
        ]);
        out.sfx.push('error');
        return { result: 'noproof', out };
      }
      S.ended = 'win';
      out.end = 'win';
      return { result: 'win', out };
    }
    S.wrong++;
    out.end = 'dismissed';
    out.suspect = suspectId;
    return { result: 'dismissed', out };
  }

  LSD.Core = {
    PHASES, SPIN_SECONDS, cond, resolve, apply, newState, newOut, act, combine, enterScene,
    solvePuzzle, accuse, findHotspot, visibleHotspots, phaseIndex, phaseName, tick, pushLines,
  };

  /* =====================================================================
   *  SAVE
   * ===================================================================== */
  const KEY = 'lsd.save.v1';
  LSD.Save = {
    write(S) { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* storage unavailable */ } },
    read() {
      try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return null;
        const S = JSON.parse(raw);
        if (!S || S.v !== 1 || !LSD.scenes[S.scene] || S.ended) return null;
        return S;
      } catch (e) { return null; }
    },
    clear() { try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ } },
  };

  if (typeof document === 'undefined') return; // Node (tests): stop before any DOM code

  /* =====================================================================
   *  UI
   * ===================================================================== */
  const NS = 'http://www.w3.org/2000/svg';
  const VERB_PHRASE = { look: 'Look at', talk: 'Talk to', take: 'Take', use: 'Use' };
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const UI = (LSD.UI = {
    S: null, sel: null, log: [], fresh: 0, dlgOpen: false, hintTimer: null, toastTimer: null, puzzleState: null,

    init() {
      this.stage = $('#stage');
      this.wrap = $('#stage-wrap');
      this.hsLayer = $('#hs');
      this.bgLayer = $('#bg');
      this.label = $('#hoverlabel');
      this.nar = $('#narrator');
      this.inv = $('#inventory');
      this.desc = $('#itemdesc');
      this.dlg = $('#dialogue');
      this.buildFx();
      document.querySelectorAll('#verbs .verb').forEach((b) => b.addEventListener('click', () => this.setVerb(b.dataset.verb)));
      $('#btn-hint').addEventListener('click', () => this.hint());
      $('#puzzle-cancel').addEventListener('click', () => this.closePuzzle());
      window.addEventListener('keydown', (e) => {
        if (!$('#screen-game').classList.contains('active') || this.busy()) return;
        const map = { 1: 'look', 2: 'talk', 3: 'take', 4: 'use' };
        if (map[e.key]) this.setVerb(map[e.key]);
        if (e.key === 'Escape' && this.sel) { this.sel = null; this.renderInv(); }
      });
    },

    /* decorative drum + bubbles, built once */
    buildFx() {
      let d = '<circle cx="400" cy="225" r="332" fill="none" stroke="#3fd0c9" stroke-opacity=".16" stroke-width="12"/>' +
        '<circle cx="400" cy="225" r="258" fill="none" stroke="#3fd0c9" stroke-opacity=".08" stroke-width="3"/>';
      for (let i = 0; i < 28; i++) {
        const a = (i / 28) * Math.PI * 2;
        d += `<circle cx="${(400 + Math.cos(a) * 296).toFixed(1)}" cy="${(225 + Math.sin(a) * 296).toFixed(1)}" r="9" fill="#060b1d" stroke="#3fd0c9" stroke-opacity=".22" stroke-width="2"/>`;
        if (i % 4 === 0) d += `<line x1="400" y1="225" x2="${(400 + Math.cos(a) * 250).toFixed(1)}" y2="${(225 + Math.sin(a) * 250).toFixed(1)}" stroke="#3fd0c9" stroke-opacity=".05" stroke-width="6"/>`;
      }
      $('#drum').innerHTML = d;
      let b = '';
      for (let i = 0; i < 14; i++) {
        const x = (i * 137 + 40) % 780 + 10, r = 3 + (i % 4) * 2;
        b += `<circle class="bubble" cx="${x}" cy="0" r="${r}" fill="rgba(191,245,241,.14)" stroke="rgba(191,245,241,.55)" stroke-width="1.2" style="--d:${11 + (i % 5) * 3}s;--delay:-${(i * 1.9).toFixed(1)}s;--dx:${(i % 2 ? 1 : -1) * (10 + (i % 3) * 8)}px"/>`;
      }
      $('#fx').innerHTML = b;
    },

    load(S) {
      this.S = S; this.sel = null; this.log = []; this.fresh = 0;
      this.closeDialogue();
      this.renderAll();
    },

    busy() { return this.dlgOpen || !!document.querySelector('.overlay:not([hidden])'); },

    renderAll() {
      this.renderScene();
      this.renderInv();
      this.renderHud();
      this.renderNarr();
      this.setVerb(this.S.verb || 'look', true);
    },

    /* ---------- scene ---------- */
    renderScene() {
      const S = this.S, sc = LSD.scenes[S.scene];
      this.bgLayer.innerHTML = typeof sc.bg === 'function' ? sc.bg(S) : sc.bg;
      this.hsLayer.innerHTML = '';
      this.label.hidden = true;
      Core.visibleHotspots(S).forEach((h) => this.hsLayer.appendChild(this.buildHotspot(h)));
      $('#scene-name').textContent = sc.name;
      this.stage.dataset.scene = S.scene;
    },

    buildHotspot(h) {
      const S = this.S;
      const [x, y, w, hh] = h.rect;
      const art = typeof h.art === 'function' ? h.art(S) : h.art || '';
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'hs' + (h.go ? ' exit' : ''));
      g.setAttribute('tabindex', '0');
      g.setAttribute('role', 'button');
      g.setAttribute('aria-label', h.name);
      g.dataset.id = h.id;
      g.innerHTML =
        `<g class="art" pointer-events="none">${art}</g>` +
        `<rect class="ring" x="${x - 3}" y="${y - 3}" width="${w + 6}" height="${hh + 6}" rx="10"/>` +
        `<rect class="hit" x="${x}" y="${y}" width="${w}" height="${hh}"/>`;
      g.addEventListener('pointerenter', () => this.showLabel(h));
      g.addEventListener('focus', () => this.showLabel(h));
      g.addEventListener('pointerleave', () => { this.label.hidden = true; });
      g.addEventListener('blur', () => { this.label.hidden = true; });
      g.addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch') this.showLabel(h); });
      g.addEventListener('click', () => this.onHotspot(h.id));
      g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.onHotspot(h.id); } });
      return g;
    },

    labelText(h) {
      if (h.go) return h.name;
      if (this.sel) return `Use ${LSD.items[this.sel].name} on ${h.name}`;
      return `${VERB_PHRASE[this.S.verb]} ${h.name}`;
    },
    showLabel(h) {
      const sr = this.wrap.getBoundingClientRect(), k = sr.width / 800;
      const el = this.label;
      el.textContent = this.labelText(h);
      el.hidden = false;
      const cx = (h.rect[0] + h.rect[2] / 2) * k;
      el.style.left = Math.min(Math.max(cx, 70), sr.width - 70) + 'px';
      const top = h.rect[1] * k;
      el.style.top = (top < 34 ? (h.rect[1] + h.rect[3]) * k + 30 : top - 4) + 'px';
    },

    onHotspot(id) {
      if (this.busy()) return;
      LSD.Audio && LSD.Audio.sfx('click');
      const item = this.sel;
      this.sel = null;
      const out = Core.act(this.S, id, this.S.verb, item);
      if (out.moved) this.fadeThen(() => this.handleOut(out)); else this.handleOut(out);
    },

    fadeThen(fn) {
      this.stage.classList.add('fading');
      setTimeout(() => { fn(); this.stage.classList.remove('fading'); }, 120);
    },

    hint() {
      this.stage.classList.add('hint');
      clearTimeout(this.hintTimer);
      this.hintTimer = setTimeout(() => this.stage.classList.remove('hint'), 2600);
    },

    /* ---------- verbs & inventory ---------- */
    setVerb(v, silent) {
      this.S.verb = v;
      if (!silent) this.sel = null;
      document.querySelectorAll('#verbs .verb').forEach((b) => b.classList.toggle('on', b.dataset.verb === v && !this.sel));
      this.stage.dataset.verb = v;
      this.stage.classList.toggle('has-item', !!this.sel);
      this.renderInv();
    },

    renderInv() {
      LSD.Inventory.render(this.S, this.inv, this.sel, (id) => this.onItem(id));
      document.querySelectorAll('#verbs .verb').forEach((b) => b.classList.toggle('on', b.dataset.verb === this.S.verb && !this.sel));
      this.stage.classList.toggle('has-item', !!this.sel);
      if (this.sel) {
        const it = LSD.items[this.sel];
        this.desc.innerHTML = `<b>${esc(it.name)}</b>: ${esc(it.desc)} <em>Click something in the scene to use it, or another item to combine.</em>`;
      } else {
        const n = this.S.inv.length;
        this.desc.innerHTML = n ? 'Tap an item to read about it, then tap a hotspot (or another item) to use it.' : '';
      }
    },

    onItem(id) {
      if (this.busy()) return;
      LSD.Audio && LSD.Audio.sfx('click');
      if (this.sel && this.sel !== id) {
        const a = this.sel;
        this.sel = null;
        this.handleOut(Core.combine(this.S, a, id));
        return;
      }
      this.sel = this.sel === id ? null : id;
      this.renderInv();
    },

    /* ---------- narrator / toast / hud ---------- */
    say(lines) {
      const arr = Array.isArray(lines) ? lines : [lines];
      arr.forEach((l) => this.log.push(l));
      this.log = this.log.slice(-30);
      this.fresh = arr.length;
      this.renderNarr();
    },
    renderNarr() {
      const shown = this.log.slice(-6);
      const fresh = Math.min(this.fresh, shown.length);
      this.nar.innerHTML = shown.map((l, i) => `<p class="${i >= shown.length - fresh ? 'now' : ''}">${esc(l)}</p>`).join('');
      this.nar.scrollTop = this.nar.scrollHeight;
    },
    toast(msg) {
      const t = $('#toast');
      t.textContent = msg;
      t.classList.add('show');
      clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
    },
    renderHud() {
      const S = this.S;
      $('#cycle-label').textContent = Core.phaseName(S.turns);
      $('#cycle-fill').style.width = Math.min(100, (S.turns / PHASES[PHASES.length - 1].until) * 100) + '%';
      $('#clue-count').textContent = S.clues.length;
      document.documentElement.style.setProperty('--spin', SPIN_SECONDS[Core.phaseIndex(S.turns)] + 's');
    },

    /* Apply the visible consequences of an `out` produced by Core. */
    handleOut(out) {
      if (!out) return;
      const A = LSD.Audio;
      if (A) [...new Set(out.sfx)].forEach((s) => A.sfx(s));
      if (out.lines.length) this.say(out.lines);
      out.newClues.forEach((id) => this.toast('Clue: ' + LSD.clues[id].title));
      out.newItems.forEach((id) => this.toast('Got: ' + LSD.items[id].name));
      this.renderScene(); // hotspot visibility and art depend on state
      this.renderInv();
      this.renderHud();
      LSD.Save.write(this.S);
      if (out.end) { this.closeDialogue(); if (LSD.onEnd) LSD.onEnd(out.end, out); }
      else if (out.puzzle) { this.closeDialogue(); this.openPuzzle(out.puzzle); }
      else if (out.dialogue) this.openDialogue(out.dialogue);
    },

    /* ---------- dialogue ---------- */
    openDialogue(id) { this.afterDialogue(LSD.Dialogue.start(this.S, id)); },
    afterDialogue(r) {
      if (r.view) this.showDialogue(r.view); else this.closeDialogue();
      this.handleOut(r.out);
    },
    showDialogue(v) {
      this.dlgOpen = true;
      this.label.hidden = true;
      $('#d-portrait').innerHTML = LSD.Art ? LSD.Art.portrait(v.portrait) : '';
      $('#d-name').textContent = v.speaker;
      $('#d-text').innerHTML = v.lines.map((l) => `<p>${esc(l)}</p>`).join('');
      const box = $('#d-choices');
      box.innerHTML = '';
      v.choices.forEach((c) => {
        const b = document.createElement('button');
        b.textContent = c.text;
        if (c.gated) b.className = 'gated';
        b.addEventListener('click', () => { LSD.Audio && LSD.Audio.sfx('click'); this.afterDialogue(LSD.Dialogue.choose(this.S, c.idx)); });
        box.appendChild(b);
      });
      this.dlg.hidden = false;
      this.dlg.scrollTop = 0;
      LSD.Audio && LSD.Audio.sfx('talk');
      const first = box.querySelector('button');
      if (first) first.focus({ preventScroll: true });
    },
    closeDialogue() {
      this.dlgOpen = false;
      this.dlg.hidden = true;
      if (this.S) this.S.dlg = null;
    },

    /* ---------- puzzles ---------- */
    openPuzzle(id) {
      const p = LSD.puzzles[id];
      this.puzzleState = { id, picked: [], done: [] };
      $('#puzzle-title').textContent = p.title;
      $('#puzzle-prompt').textContent = p.prompt;
      const body = $('#puzzle-body');
      const go = $('#puzzle-go');
      go.hidden = p.kind !== 'pick';
      body.innerHTML = '';
      if (p.kind === 'pick') this.buildPick(p, body, go);
      else this.buildOrder(p, body);
      $('#overlay-puzzle').hidden = false;
    },
    closePuzzle() { $('#overlay-puzzle').hidden = true; this.puzzleState = null; },

    buildPick(p, body, go) {
      const S = this.S, st = this.puzzleState;
      const chips = document.createElement('div');
      chips.className = 'chips';
      S.clues.forEach((cid) => {
        const c = LSD.clues[cid];
        const b = document.createElement('button');
        b.className = 'chip';
        b.setAttribute('aria-pressed', 'false');
        b.innerHTML = `${esc(c.title)}<small>${esc(c.text)}</small>`;
        b.addEventListener('click', () => {
          const on = b.getAttribute('aria-pressed') !== 'true';
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
          st.picked = on ? st.picked.concat(cid) : st.picked.filter((x) => x !== cid);
          counter.textContent = `${st.picked.length} / ${p.need} selected`;
          LSD.Audio && LSD.Audio.sfx('click');
        });
        chips.appendChild(b);
      });
      const counter = document.createElement('p');
      counter.className = 'knot-progress';
      counter.textContent = `0 / ${p.need} selected`;
      const fb = document.createElement('p');
      fb.id = 'puzzle-feedback';
      fb.className = 'knot-note';
      fb.hidden = true;
      body.append(chips, counter, fb);
      go.onclick = () => {
        if (st.picked.length !== p.need) { this.toast(`Pick exactly ${p.need} clues.`); return; }
        const r = Core.solvePuzzle(S, p.id, st.picked);
        if (r.ok) { this.closePuzzle(); this.handleOut(r.out); }
        else { fb.hidden = false; fb.textContent = r.out.lines.join(' '); this.handleOut(Object.assign(r.out, { lines: [] })); }
      };
    },

    buildOrder(p, body) {
      const S = this.S, st = this.puzzleState;
      const cx = 220, cy = 150, rx = 128, ry = 44;
      let loops = '', labels = '';
      p.loops.forEach((l, i) => {
        const ang = 20 + i * 45, off = (i % 2 ? 1 : -1) * 8;
        const rad = (ang * Math.PI) / 180;
        loops += `<g data-id="${l.id}" class="loopg" transform="translate(${off} ${-off / 2})">` +
          `<ellipse class="loop" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${ang} ${cx} ${cy})" stroke="${l.color}"/>` +
          `<ellipse class="loop-hit" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${ang} ${cx} ${cy})"/></g>`;
        labels += `<text x="${(cx + off + Math.cos(rad) * (rx + 20)).toFixed(0)}" y="${(cy - off / 2 + Math.sin(rad) * (rx + 20) + 5).toFixed(0)}" text-anchor="middle">${l.name}</text>`;
      });
      body.innerHTML = `<svg id="knot-svg" viewBox="0 0 440 300" role="group" aria-label="The knot">${loops}${labels}<circle cx="${cx}" cy="${cy}" r="10" fill="#0b1630" stroke="#fff" stroke-width="3" pointer-events="none"/></svg>` +
        `<p class="knot-progress" id="knot-progress">Loops undone: 0 / ${p.loops.length}</p>` +
        `<p class="knot-note" id="knot-note"></p>`;
      const note = $('#knot-note');
      note.textContent = S.inv.includes('dried_note')
        ? 'Your dried note: ' + LSD.items.dried_note.desc
        : 'You have no idea which loop is on top. A note somewhere might say.';
      body.querySelectorAll('.loopg').forEach((g) => {
        g.addEventListener('click', () => {
          const id = g.dataset.id;
          if (st.done.includes(id)) return;
          if (id === p.solution[st.done.length]) {
            st.done.push(id);
            g.querySelector('.loop').classList.add('undone');
            LSD.Audio && LSD.Audio.sfx('pickup');
            $('#knot-progress').textContent = `Loops undone: ${st.done.length} / ${p.loops.length}`;
            if (st.done.length === p.solution.length) {
              const r = Core.solvePuzzle(S, p.id, st.done);
              this.closePuzzle();
              this.handleOut(r.out);
            }
          } else {
            const wrong = Core.solvePuzzle(S, p.id, st.done.concat(id)); // not solved: yields the fail line
            st.done = [];
            body.querySelectorAll('.loop').forEach((n) => n.classList.remove('undone'));
            $('#knot-progress').textContent = `Loops undone: 0 / ${p.loops.length}`;
            note.textContent = wrong.out.lines.join(' ');
            this.handleOut(Object.assign(wrong.out, { lines: [] }));
          }
        });
      });
    },
  });
  const Core = LSD.Core;
})();

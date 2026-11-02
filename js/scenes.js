/*
 * Scenes + art. Everything is drawn in code (SVG strings, 800x450 coordinate space).
 *
 * To add a scene, push a plain object onto LSD.scenes (see README):
 *   { id, name, first, again, bg(S)|string,
 *     hotspots:[{ id, name, rect:[x,y,w,h], art(S)|string, show?, look, talk?, take?, use?, useWith?:{item:response}, go?, lock? }] }
 * Every hotspot needs a `look` line. Missing talk/take/use lines fall back to the narrator's generic quips.
 */
(function () {
  'use strict';
  const LSD = (globalThis.LSD = globalThis.LSD || {});

  /* =====================================================================
   *  ART HELPERS
   * ===================================================================== */
  const OUT = '#0b1630';
  const place = (x, y, s, inner) => `<g transform="translate(${x} ${y}) scale(${s})">${inner}</g>`;
  const shadow = (rx = 34) => `<ellipse cx="0" cy="2" rx="${rx}" ry="5" fill="rgba(0,0,0,.35)"/>`;
  const eyes = (x, y, gap = 12, r = 5, look = 0) =>
    `<circle cx="${x - gap / 2}" cy="${y}" r="${r}" fill="#fff" stroke="${OUT}" stroke-width="1.5"/>` +
    `<circle cx="${x + gap / 2}" cy="${y}" r="${r}" fill="#fff" stroke="${OUT}" stroke-width="1.5"/>` +
    `<circle cx="${x - gap / 2 + look}" cy="${y + 1}" r="${r * 0.46}" fill="${OUT}"/>` +
    `<circle cx="${x + gap / 2 + look}" cy="${y + 1}" r="${r * 0.46}" fill="${OUT}"/>`;
  const mouth = (x, y, w = 10, c = 3) =>
    `<path d="M${x - w / 2} ${y} q${w / 2} ${c} ${w} 0" fill="none" stroke="${OUT}" stroke-width="2" stroke-linecap="round"/>`;
  /* overlapping circles drawn as a single outlined blob */
  const blob = (circles, fill) =>
    circles.map(([cx, cy, r]) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${OUT}" stroke="${OUT}" stroke-width="6"/>`).join('') +
    circles.map(([cx, cy, r]) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`).join('');

  const chars = {
    lint: (x, y, s = 1) => place(x, y, s,
      shadow() +
      `<path d="M-17 -88H17V-38C17 -28 46 -24 46 -8C46 3 38 6 26 6H-9C-22 6 -17 -8 -17 -16Z" fill="#cdc6b4" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/>` +
      `<path d="M-17 -56H17V-28H-17Z" fill="#3b4a7a" stroke="${OUT}" stroke-width="3"/><path d="M0 -56V-28M-17 -48L0 -56L17 -48" fill="none" stroke="${OUT}" stroke-width="2.5"/>` +
      `<rect x="-18" y="-94" width="36" height="13" rx="3" fill="#a05252" stroke="${OUT}" stroke-width="3"/>` +
      eyes(0, -73, 13, 5, 1.5) + mouth(0, -63, 8, 2) +
      `<ellipse cx="0" cy="-97" rx="30" ry="7" fill="#1c1c28" stroke="${OUT}" stroke-width="3"/>` +
      `<path d="M-15 -98Q-15 -119 0 -119Q15 -119 15 -98Z" fill="#2a2a3c" stroke="${OUT}" stroke-width="3"/><rect x="-15" y="-105" width="30" height="6" fill="#a05252"/>`),

    cotton: (x, y, s = 1) => place(x, y, s,
      shadow(38) +
      blob([[0, -34, 30], [-24, -24, 20], [24, -24, 20], [-14, -62, 22], [14, -62, 22], [0, -80, 20]], '#f8f5ee') +
      `<path d="M-30 -30Q0 -16 30 -30L32 -4Q0 6 -32 -4Z" fill="#d98fb0" stroke="${OUT}" stroke-width="3"/>` +
      `<circle cx="0" cy="-18" r="2.6" fill="#e68ab8" stroke="${OUT}" stroke-width="1"/><circle cx="0" cy="-8" r="2.6" fill="#e68ab8" stroke="${OUT}" stroke-width="1"/>` +
      eyes(0, -62, 18, 4.5) +
      `<circle cx="-9" cy="-62" r="9" fill="none" stroke="#444" stroke-width="2"/><circle cx="9" cy="-62" r="9" fill="none" stroke="#444" stroke-width="2"/><path d="M-1 -62h2" stroke="#444" stroke-width="2"/>` +
      mouth(0, -46, 12, 4) +
      `<rect x="30" y="-20" width="16" height="12" rx="3" fill="#fff" stroke="${OUT}" stroke-width="2"/>`),

    phil: (x, y, s = 1) => place(x, y, s,
      shadow(36) +
      `<path d="M-34 0C-42 -30 -38 -70 -22 -86L-14 -102L-6 -88L2 -108L10 -88L20 -100L24 -84C40 -68 42 -30 34 0Z" fill="${OUT}" stroke="${OUT}" stroke-width="6" stroke-linejoin="round"/>` +
      `<path d="M-34 0C-42 -30 -38 -70 -22 -86L-14 -102L-6 -88L2 -108L10 -88L20 -100L24 -84C40 -68 42 -30 34 0Z" fill="#8b8f9c"/>` +
      `<path d="M-26 -30q8 -8 16 0M6 -22q8 -8 16 0M-12 -48q6 -6 12 0" fill="none" stroke="#6f7380" stroke-width="3" stroke-linecap="round"/>` +
      `<rect x="-26" y="-68" width="52" height="15" rx="6" fill="#0a0a12" stroke="${OUT}" stroke-width="2"/><path d="M-20 -65l8 0" stroke="#fff" stroke-opacity=".6" stroke-width="2"/>` +
      `<path d="M-10 -36h20" stroke="${OUT}" stroke-width="3" stroke-linecap="round"/><path d="M8 -36l22 -6" stroke="#d8c9a0" stroke-width="3" stroke-linecap="round"/>`),

    tish: (x, y, s = 1) => place(x, y, s,
      shadow(30) +
      `<path d="M-28 0V-72L-21 -82L-13 -72L-5 -84L3 -72L11 -84L19 -72L28 -80V0Z" fill="#f5f9ff" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/>` +
      `<path d="M-18 -20q6 -6 12 0M8 -34q6 -6 12 0" fill="none" stroke="#c7d3e8" stroke-width="2"/>` +
      eyes(0, -54, 17, 5) + `<circle cx="0" cy="-42" r="5.5" fill="#ff8e8e" stroke="${OUT}" stroke-width="1.5"/>` + mouth(0, -30, 10, -3) +
      `<path d="M30 -10l10 -4M-34 -4l-10 3M34 -2l9 5" stroke="#f5f9ff" stroke-width="5" stroke-linecap="round"/>`),

    betty: (x, y, s = 1) => place(x, y, s,
      shadow(32) +
      `<rect x="-14" y="-98" width="28" height="34" rx="5" fill="#e9f4ff" stroke="${OUT}" stroke-width="3"/>` +
      `<rect x="-28" y="-72" width="56" height="72" rx="14" fill="#e9f4ff" stroke="${OUT}" stroke-width="3"/>` +
      `<rect x="-16" y="-112" width="32" height="16" rx="5" fill="#3fd0c9" stroke="${OUT}" stroke-width="3"/>` +
      `<path d="M-10 -66l10 8l10 -8z" fill="#ff7b7b" stroke="${OUT}" stroke-width="2"/>` +
      eyes(0, -50, 20, 5, -1) + mouth(0, -36, 14, -4) +
      `<rect x="-24" y="-24" width="48" height="22" rx="4" fill="#3fd0c9" opacity=".85"/><path d="M-16 -16h32" stroke="${OUT}" stroke-width="2" stroke-dasharray="4 3"/>`),

    pocket: (x, y, s = 1) => place(x, y, s,
      shadow(40) +
      [[-24, -22, 22], [24, -22, 22], [0, -58, 22]].map(([cx, cy, r], i) =>
        `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#d9a441" stroke="${OUT}" stroke-width="3"/><circle cx="${cx}" cy="${cy}" r="${r - 6}" fill="none" stroke="#8a6414" stroke-width="2"/>` +
        (i === 2 ? `<rect x="${cx - 14}" y="${cy - 8}" width="28" height="9" rx="4" fill="#0a0a12"/>` : eyes(cx, cy - 4, 11, 3.6, i ? -1 : 1) + mouth(cx, cy + 8, 8, 2))).join('')),

    zed: (x, y, s = 1) => place(x, y, s,
      shadow(36) +
      `<path d="M0 -108L13 -80L42 -84L26 -58L48 -38L20 -36L15 -2L-6 -28L-36 -14L-24 -46L-46 -66L-15 -66Z" fill="#5fb3ff" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/>` +
      eyes(0, -58, 16, 5.5) + mouth(0, -42, 18, 8) +
      `<path d="M50 -90l-8 14l10 0l-8 14M-52 -92l8 12l-10 2l8 14" fill="none" stroke="#bff5f1" stroke-width="3" stroke-linecap="round" class="neon"/>`),

    static: (x, y, s = 1) => place(x, y, s,
      shadow(34) +
      `<path d="M-32 0Q-36 -50 -24 -84Q0 -102 24 -84Q38 -50 32 0Q20 -8 9 0Q-6 -9 -17 0Q-25 -6 -32 0Z" fill="#b9b2e6" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/>` +
      `<path d="M-18 -92l-8 -16M-6 -96l-2 -18M8 -96l4 -18M20 -90l10 -14" stroke="#b9b2e6" stroke-width="4" stroke-linecap="round"/>` +
      `<path d="M-18 -92l-8 -16M-6 -96l-2 -18M8 -96l4 -18M20 -90l10 -14" stroke="${OUT}" stroke-width="1.2" fill="none"/>` +
      eyes(0, -62, 15, 5, 1) + `<path d="M-14 -70h10M4 -70h10" stroke="${OUT}" stroke-width="3"/>` + mouth(0, -44, 14, 2) +
      `<path d="M38 -70l8 -8l-2 10l9 -3M-40 -50l-9 -6l4 8l-9 2" fill="none" stroke="#3fd0c9" stroke-width="2.4" stroke-linecap="round"/>`),

    fenwick: (x, y, s = 1) => place(x, y, s,
      shadow(46) +
      `<rect x="-40" y="-104" width="80" height="102" rx="16" fill="#dfe6f5" stroke="${OUT}" stroke-width="3"/>` +
      `<path d="M-40 -16Q-26 -34 -14 -16M40 -16Q26 -34 14 -16M-40 -88Q-26 -70 -14 -88M40 -88Q26 -70 14 -88" fill="none" stroke="#9fb0d4" stroke-width="5"/>` +
      `<path d="M-40 -60C-70 -66 -62 -30 -44 -34C-30 -36 -44 -50 -52 -44M40 -60C70 -66 62 -30 44 -34C30 -36 44 -50 52 -44" fill="none" stroke="#c9d3ea" stroke-width="6" stroke-linecap="round"/>` +
      `<path d="M-6 -104Q0 -122 6 -104Q22 -116 18 -100Q4 -98 -6 -104Q-22 -116 -18 -100Q-4 -98 -6 -104Z" fill="#d9534f" stroke="${OUT}" stroke-width="2.5"/>` +
      eyes(0, -66, 22, 6, 1) + `<circle cx="11" cy="-66" r="10" fill="none" stroke="#d9a441" stroke-width="2.5"/><path d="M21 -62q6 14 0 22" fill="none" stroke="#d9a441" stroke-width="1.5"/>` +
      `<path d="M-18 -44q9 -7 18 0q9 -7 18 0" fill="none" stroke="${OUT}" stroke-width="3.5" stroke-linecap="round"/>` + mouth(0, -34, 14, 4)),
  };

  LSD.Art = {
    chars,
    place,
    /* portrait group for the dialogue box */
    portrait(key) {
      const c = chars[key] || chars.lint;
      return c(0, 0, 0.98);
    },
    exitSign(x, y, w, label) {
      return `<g><rect x="${x}" y="${y}" width="${w}" height="38" rx="9" fill="#0a1228" stroke="#ffb347" stroke-width="2.5"/>` +
        `<path d="M${x + 16} ${y + 19}l12 -11v7h12v8H${x + 28}v7z" fill="#ffb347"/>` +
        `<text x="${x + 50}" y="${y + 25}" font-family="Special Elite, Courier New, monospace" font-size="16" fill="#e8f1ff">${label}</text></g>`;
    },
    door(x, y, w, h, fill, label, extra = '') {
      const r = w / 2;
      return `<path d="M${x - 7} ${y + h}V${y + r}A${r + 7} ${r + 7} 0 0 1 ${x + w + 7} ${y + r}V${y + h}Z" fill="#070d20" stroke="#3fd0c9" stroke-opacity=".6" stroke-width="3"/>` +
        `<path d="M${x} ${y + h}V${y + r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h}Z" fill="${fill}" stroke="${OUT}" stroke-width="2"/>` +
        `<path d="M${x + 12} ${y + h - 8}V${y + r + 4}A${r - 12} ${r - 12} 0 0 1 ${x + w - 12} ${y + r + 4}V${y + h - 8}Z" fill="none" stroke="rgba(255,255,255,.14)" stroke-width="2"/>` +
        `<circle cx="${x + w - 16}" cy="${y + h * 0.62}" r="5" fill="#ffb347" stroke="${OUT}" stroke-width="1.5"/>` +
        `<rect x="${x + 8}" y="${y + h * 0.28}" width="${w - 16}" height="22" rx="4" fill="#0a1228" stroke="#3fd0c9" stroke-opacity=".6"/>` +
        `<text x="${x + w / 2}" y="${y + h * 0.28 + 16}" text-anchor="middle" font-family="Special Elite, Courier New, monospace" font-size="12" fill="#bff5f1">${label}</text>` + extra;
    },
  };

  /* shared backdrop pieces */
  const wallPanels = (h, color = '#1a2a5a') => {
    let s = '';
    for (let x = 0; x <= 800; x += 100) s += `<line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="${color}" stroke-width="3"/>`;
    return s;
  };
  const floorLines = (y) => {
    let s = '';
    for (let x = -400; x <= 1200; x += 100) s += `<line x1="${x}" y1="${y}" x2="${(x - 400) * 1.7 + 400}" y2="450" stroke="#2a3f7a" stroke-opacity=".5" stroke-width="2"/>`;
    return s;
  };

  /* =====================================================================
   *  PUZZLE DATA (UI lives in engine.js)
   * ===================================================================== */
  LSD.puzzles = {
    alibi: {
      id: 'alibi',
      kind: 'pick',
      title: 'Break the Alibi',
      prompt: 'Static Cling swears he never left the Bazaar. Pick three clues that put him somewhere else.',
      need: 3,
      valid: ['static_lint', 'ferry_stub', 'vendor_testimony', 'tish_saw'],
      fail: {
        close: 'Static Cling stifles a yawn. "Two of those are good. The third proves nothing. Nice try, gumshoe."',
        far: 'Static Cling shrugs. "Those don\'t tell me anything. Come back when you can prove I left the Bazaar."',
      },
      success: {
        say: [
          'The evidence lands like wet laundry on a tile floor. Static Cling crackles, and his hair goes flat.',
          '"Okay! Okay! I left! I rode the ferry!" His voice cracks. "But I didn\'t take the sock. I just held it."',
        ],
        set: { static_exposed: true },
        clue: ['static_confession'],
        dialogue: 'static',
      },
    },
    knot: {
      id: 'knot',
      kind: 'order',
      title: "Unknot Fenwick's Knot",
      prompt: 'Hook the loops off one at a time. Pull them in the wrong order and the whole thing snaps tight again.',
      loops: [
        { id: 'red', name: 'Red', color: '#e0554f' },
        { id: 'blue', name: 'Blue', color: '#4f9bff' },
        { id: 'green', name: 'Green', color: '#46c26b' },
        { id: 'yellow', name: 'Yellow', color: '#f2d04a' },
      ],
      solution: ['yellow', 'red', 'blue', 'green'],
      fail: 'The loop fights back and the whole knot cinches tight again. Start over, and think about what lies over what.',
      success: {
        say: [
          'The last loop slides free. The Knot sighs, shudders, and unravels into a very surprised heap of sheet.',
          'And there, curled up in the middle like it has been waiting to be asked, is a cream-colored left sock.',
        ],
        set: { knot_undone: true },
      },
    },
  };

  /* =====================================================================
   *  SCENES
   * ===================================================================== */
  LSD.scenes = {};

  /* ---------- 1. The Drum Lobby (hub) ---------- */
  LSD.scenes.lobby = {
    id: 'lobby',
    name: 'The Drum Lobby',
    first: {
      say: [
        'The Drum Lobby. Midday in the Washing Machine Dimension, which is also 3 a.m., depending on the cycle.',
        'Mrs. Cotton is waiting by the desk. She is the kind of client who brings a hanky and a grievance. Talk to her.',
      ],
    },
    again: { say: 'The Drum Lobby. Same spinning room, same cold coffee.' },
    bg: () =>
      `<rect width="800" height="292" fill="#101c40"/>${wallPanels(292)}` +
      `<rect y="0" width="800" height="14" fill="#0a1228"/>` +
      `<path d="M0 292H800" stroke="#3fd0c9" stroke-opacity=".4" stroke-width="3"/>` +
      `<rect y="292" width="800" height="158" fill="url(#gFloor)"/>${floorLines(292)}` +
      `<ellipse cx="400" cy="392" rx="300" ry="40" fill="url(#gGlowTeal)"/>` +
      chars.lint(468, 372, 0.95),
    hotspots: [
      {
        id: 'porthole', name: 'Porthole', rect: [40, 22, 120, 78],
        art: `<circle cx="100" cy="61" r="40" fill="#0a1228" stroke="#3fd0c9" stroke-width="5"/><circle cx="100" cy="61" r="32" fill="url(#gDrum)"/><path d="M78 70q10-16 22 0t22 0" fill="none" stroke="#bff5f1" stroke-opacity=".5" stroke-width="3"/>`,
        look: 'The porthole. Outside is the Laundry Room, blurry and wet. It refuses to comment on the case.',
        talk: 'You tell the porthole your theories. It reflects them back at you, slightly warped. Honest, at least.',
        take: "It's bolted to the wall, and to the plot.",
      },
      {
        id: 'neon', name: 'Neon Sign', rect: [280, 22, 240, 62],
        art: `<g class="neon"><rect x="284" y="26" width="232" height="54" rx="12" fill="#0a1228" stroke="#3fd0c9" stroke-width="3"/><text x="400" y="55" text-anchor="middle" font-family="Special Elite, Courier New, monospace" font-size="28" fill="#bff5f1">LINT &amp; CO.</text><text x="400" y="72" text-anchor="middle" font-family="Special Elite, Courier New, monospace" font-size="12" fill="#3fd0c9">DISCREET DETECTION</text></g>`,
        look: "LINT & CO., Discreet Detection. The 'C' flickers. So does your confidence.",
        take: 'You are a detective, not an electrician. The sign is hot, hum-y, and none of your business.',
        use: 'You give the sign a thump. It stops flickering for one second, out of respect, then resumes.',
      },
      {
        id: 'door_alley', name: 'To Lint Trap Alley', rect: [40, 112, 100, 150], go: 'alley',
        art: LSD.Art.door(40, 112, 100, 150, '#4a4f66', 'LINT TRAP'),
        look: 'The door to Lint Trap Alley. It smells of dryer sheets and bad decisions. You go in anyway.',
      },
      {
        id: 'door_harbour', name: 'To Suds Harbour', rect: [180, 112, 100, 150], go: 'harbour',
        art: LSD.Art.door(180, 112, 100, 150, '#1f6f86', 'SUDS HARBOUR'),
        look: 'The door to Suds Harbour. Salt, soap, and secrets. You pull your collar up.',
      },
      {
        id: 'door_bazaar', name: 'To Hot Air Bazaar', rect: [320, 112, 100, 150], go: 'bazaar',
        art: LSD.Art.door(320, 112, 100, 150, '#a8542a', 'HOT AIR'),
        look: 'The door to the Hot Air Bazaar. Warm draft, loud vendors. Everything for sale is charged.',
      },
      {
        id: 'door_tower', name: 'The Knot Tower', rect: [680, 100, 100, 170], go: 'tower',
        lock: {
          cond: { clues: 3 },
          say: "The Knot Tower's door is chained shut with a knot that looks like it's judging you. Come back with three solid clues, Lint. The Tower only opens for detectives with a case.",
        },
        art: (S) => LSD.Art.door(680, 100, 100, 170, '#3a2b5a', 'KNOT TOWER') +
          (S.clues.length < 3
            ? `<path d="M676 150L784 215M784 150L676 215" stroke="#9aa3b8" stroke-width="7" stroke-linecap="round"/><path d="M676 150L784 215M784 150L676 215" stroke="${OUT}" stroke-width="1.5"/><rect x="716" y="170" width="28" height="24" rx="4" fill="#d9a441" stroke="${OUT}" stroke-width="2.5"/><path d="M722 170v-9a8 8 0 0 1 16 0v9" fill="none" stroke="#d9a441" stroke-width="4"/>`
            : `<ellipse cx="730" cy="190" rx="30" ry="70" fill="url(#gGlowTeal)"/>`),
        look: 'You approach the Knot Tower. The chain loosens, recognizing a detective with the goods. Up you go.',
      },
      {
        id: 'case_board', name: 'Case Board', rect: [480, 100, 150, 100],
        art: `<rect x="480" y="100" width="150" height="100" rx="6" fill="#26386e" stroke="#0a1228" stroke-width="4"/><g fill="#f2ead7" stroke="${OUT}" stroke-width="1.5"><rect x="492" y="112" width="30" height="34"/><rect x="534" y="116" width="30" height="34"/><rect x="578" y="110" width="30" height="34"/><rect x="510" y="154" width="30" height="34"/><rect x="560" y="154" width="30" height="34"/></g><path d="M507 125L549 133L593 127L525 171L575 171L507 125" fill="none" stroke="#d9534f" stroke-width="2"/><text x="555" y="196" text-anchor="middle" font-family="Special Elite, monospace" font-size="10" fill="#bff5f1">THE LEFT SOCK CASE</text>`,
        look: 'The case board: five suspects, one sock-shaped hole in the evidence, and a lot of red string. Open your Notebook to see what you have actually pinned.',
        talk: 'You explain the case to the board. It nods, mostly because it is made of cork.',
        take: "You consider taking a photo off the board. Evidence tampering. Also, they're pinned.",
        use: 'You straighten a pin. The whole board looks more organized than your theories.',
      },
      {
        id: 'cotton', name: 'Mrs. Cotton', rect: [510, 205, 130, 145],
        art: chars.cotton(575, 346, 1.15),
        look: 'Mrs. Cotton: soft, round, and wringing a hanky. Her right sock is fine. It is the left one that has her in knots.',
        talk: { dialogue: 'cotton' },
        take: "You can't pick up a client. Bad for business, worse for the back.",
        use: 'You straighten her cardigan. She pats your cuff. This is called client care.',
        useWith: {
          glitter_button: [
            { if: { clue: 'button_cleared' }, say: '"Still my cardigan button, dear. Still not part of the sock."' },
            {
              say: '"Oh, that\'s the button off my cardigan, dear! Lost it Thursday. The sock never had buttons." So it was a false lead, sparkles and all.',
              clue: ['button_cleared'],
            },
          ],
          left_sock: {
            say: "Not yet, Lint. A good detective names the culprit first, then hands over the evidence. Paperwork. Open the Notebook and make your accusation.",
          },
          coin: '"Keep your money, detective," says Mrs. Cotton. "Pay me in results. And in pairs."',
        },
      },
      {
        id: 'desk', name: 'Your Desk', rect: [250, 268, 200, 88],
        art: `<rect x="250" y="296" width="200" height="14" rx="3" fill="#4a3a36" stroke="${OUT}" stroke-width="3"/><rect x="258" y="310" width="16" height="44" fill="#3a2d2a" stroke="${OUT}" stroke-width="3"/><rect x="426" y="310" width="16" height="44" fill="#3a2d2a" stroke="${OUT}" stroke-width="3"/><rect x="300" y="278" width="52" height="20" rx="3" fill="#2b2f45" stroke="${OUT}" stroke-width="3"/><rect x="308" y="270" width="36" height="9" fill="#f2ead7" stroke="${OUT}" stroke-width="2"/><rect x="400" y="282" width="16" height="14" rx="2" fill="#cdc6b4" stroke="${OUT}" stroke-width="2"/><path d="M372 296l10-26l18 4" fill="none" stroke="#9fb0d4" stroke-width="4"/><circle cx="402" cy="276" r="9" fill="#fff3c4" opacity=".9"/>`,
        look: "Your desk. A typewriter, a cold coffee, and a file marked 'LEFT SOCK: MISSING'. The file is thinner than your patience.",
        talk: 'The desk has heard enough of your theories.',
        take: 'Nothing on the desk is worth taking except responsibility, and you already have that.',
        use: "You type 'IT WAS' and stop. It is too early to commit to a sentence.",
      },
      {
        id: 'couch', name: 'Waiting Couch', rect: [30, 268, 200, 90],
        art: `<rect x="34" y="292" width="190" height="52" rx="14" fill="#1f6f86" stroke="${OUT}" stroke-width="3"/><rect x="26" y="280" width="30" height="64" rx="12" fill="#2a8f8b" stroke="${OUT}" stroke-width="3"/><rect x="202" y="280" width="30" height="64" rx="12" fill="#2a8f8b" stroke="${OUT}" stroke-width="3"/><rect x="62" y="270" width="64" height="32" rx="10" fill="#2a8f8b" stroke="${OUT}" stroke-width="3"/><rect x="132" y="270" width="64" height="32" rx="10" fill="#2a8f8b" stroke="${OUT}" stroke-width="3"/><circle cx="128" cy="304" r="4" fill="#fff" opacity=".8"/>`,
        look: [
          { if: { flag: 'got_coin' }, say: 'The waiting couch. The cushions are depleted of coins and now hold only crumbs and regret.' },
          { say: 'A waiting-room couch with the posture of a witness who would rather not testify. Something glints between the cushions.' },
        ],
        talk: 'You ask the couch if it saw anything. It has been sat on all day and has nothing nice to say.',
        take: [
          { if: { flag: 'got_coin' }, say: 'Just crumbs now. And regret. You leave both.' },
          { give: ['coin'], set: { got_coin: true }, say: 'You dig between the cushions: three lint balls, a button of no importance, and a lucky coin. You pocket the coin. Dignity stays on the couch.' },
        ],
        use: 'You sit for a second. The couch sighs. So do you.',
      },
      {
        id: 'basket', name: 'Sewing Basket', rect: [650, 298, 80, 56],
        art: `<path d="M652 316h76l-8 36h-60z" fill="#a97b4b" stroke="${OUT}" stroke-width="3"/><path d="M660 322v26M676 322v28M692 322v28M708 322v26" stroke="#7a5430" stroke-width="3"/><ellipse cx="690" cy="316" rx="38" ry="8" fill="#c9a06b" stroke="${OUT}" stroke-width="3"/><rect x="668" y="296" width="14" height="20" rx="3" fill="#d9534f" stroke="${OUT}" stroke-width="2"/><rect x="694" y="300" width="12" height="16" rx="3" fill="#4f9bff" stroke="${OUT}" stroke-width="2"/>`,
        look: [
          { if: { flag: 'got_spool' }, say: 'The sewing basket: pins, a few buttons, and the memory of a spool.' },
          { say: 'A sewing basket. Needles, buttons, and spooled threats. A red spool of thread sits right on top.' },
        ],
        talk: 'You whisper a few questions at the basket. It keeps its needles to itself.',
        take: [
          { if: { flag: 'got_spool' }, say: 'You rummage. Only needles left, and they have opinions about being touched.' },
          { give: ['thread_spool'], set: { got_spool: true }, say: 'You lift the red spool out of the basket. Strong thread. It might come in handy in a case about knots.' },
        ],
        use: 'You prick your finger on a needle. The basket is now officially a suspect in a lesser case.',
      },
    ],
  };

  /* @@SCENES: new scenes are appended below */
})();

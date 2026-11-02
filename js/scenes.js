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

  /* small helpers used by the scenes below */
  const bars = (x, y, w, h, n) => {
    let s = '';
    for (let i = 0; i <= n; i++) s += `<line x1="${x + i * (w / n)}" y1="${y}" x2="${x + i * (w / n)}" y2="${y + h}" stroke="#9aa3b8" stroke-width="6"/>`;
    return s;
  };
  const sockArt = (x, y, s, face) => place(x, y, s,
    `<path d="M-17 -60H17V-26C17 -18 40 -14 40 0C40 10 32 14 22 14H-8C-20 14 -17 2 -17 -6Z" fill="#efe6d0" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/>` +
    `<rect x="-18" y="-66" width="36" height="12" rx="3" fill="#c9a06b" stroke="${OUT}" stroke-width="3"/><circle cx="30" cy="4" r="2.2" fill="${OUT}"/>` +
    (face ? eyes(0, -40, 14, 4.5, -1) + mouth(0, -28, 8, -2) : ''));
  LSD.Art.sock = sockArt;

  const exitHotspot = (label) => ({
    id: 'exit', name: label, rect: [300, 400, 200, 38], go: 'lobby',
    art: LSD.Art.exitSign(300, 400, 200, label),
    look: 'You tip your hat to the scene and head back to the Lobby. The drum turns, the case follows.',
  });

  /* ---------- 2. Lint Trap Alley ---------- */
  LSD.scenes.alley = {
    id: 'alley',
    name: 'Lint Trap Alley',
    first: { say: ['Lint Trap Alley. Where dryer sheets go to retire and the lint goes to talk.', 'Fluffy Phil is leaning on a wall of grey fluff. A locked gate waits at the end. Tish the Tissue is sneezing in a corner.'] },
    again: { say: 'Lint Trap Alley. Still smells like warm cotton and old gossip.' },
    bg: () =>
      '<defs><pattern id="brick" width="60" height="30" patternUnits="userSpaceOnUse"><rect width="60" height="30" fill="#18224a"/><path d="M0 0H60M0 15H60M30 0V15M0 15V30" stroke="#0e1530" stroke-width="2" fill="none"/></pattern></defs>' +
      '<rect width="800" height="305" fill="url(#brick)"/>' +
      '<rect width="800" height="16" fill="#0a1228"/>' +
      '<rect x="248" y="36" width="314" height="112" rx="6" fill="#070d20" stroke="#4d587a" stroke-width="6"/>' +
      Array.from({ length: 15 }, (_, i) => `<line x1="${262 + i * 20}" y1="40" x2="${262 + i * 20}" y2="144" stroke="#4d587a" stroke-width="3"/>`).join('') +
      Array.from({ length: 5 }, (_, i) => `<line x1="252" y1="${58 + i * 20}" x2="558" y2="${58 + i * 20}" stroke="#4d587a" stroke-width="3"/>`).join('') +
      '<path d="M270 100q30-34 60-6t60-8t62 14t50-12" fill="none" stroke="#8b8f9c" stroke-width="12" stroke-linecap="round" opacity=".8"/>' +
      '<rect y="305" width="800" height="145" fill="url(#gFloor)"/><path d="M0 305H800" stroke="#3fd0c9" stroke-opacity=".3" stroke-width="3"/>' +
      '<ellipse cx="170" cy="400" rx="130" ry="22" fill="url(#gGlowTeal)"/>' +
      '<rect x="40" y="40" width="10" height="260" fill="#0a1228"/><circle cx="45" cy="52" r="26" fill="url(#gGlowWarm)"/><circle cx="45" cy="52" r="8" fill="#ffd9a0"/>',
    hotspots: [
      {
        id: 'gate', name: 'Locked Gate', rect: [296, 166, 168, 198],
        art: (S) => S.flags.gate_open
          ? `<rect x="296" y="166" width="168" height="198" fill="#070d20" stroke="#9aa3b8" stroke-width="6"/><rect x="300" y="170" width="160" height="190" fill="url(#gGlowTeal)"/>${bars(300, 170, 34, 190, 2)}${bars(428, 170, 32, 190, 2)}`
          : `<rect x="296" y="166" width="168" height="198" fill="#070d20" stroke="#9aa3b8" stroke-width="6"/>${bars(300, 170, 160, 190, 8)}<rect x="296" y="250" width="168" height="10" fill="#9aa3b8"/><rect x="368" y="236" width="24" height="26" rx="4" fill="#d9a441" stroke="${OUT}" stroke-width="2.5"/><path d="M373 236v-8a7 7 0 0 1 14 0v8" fill="none" stroke="#d9a441" stroke-width="4"/>`,
        look: [
          { if: { flag: 'gate_open' }, say: 'The gate hangs open. Beyond it: the lost-and-found of the Lint Trap, where every odd thing ends up.' },
          { say: 'A locked iron gate with a padlock the size of a wallet. Fluffy Phil seems to be the doorman, and the lock only opens for the right kind of pocket.' },
        ],
        talk: 'You ask the gate nicely. It does not open. Gates respect money, not manners.',
        take: [{ if: { flag: 'gate_open' }, say: 'You take nothing from the gate itself. The goodies are behind it.' }, { say: "It's bolted, locked, and unimpressed with your reach." }],
        use: [{ if: { flag: 'gate_open' }, say: "The gate's open. No need to wiggle it. Reach in and look around." }, { say: 'You rattle the gate. Phil clears his throat in a very mercenary way.' }],
        useWith: {
          coin: [{ if: { flag: 'gate_open' }, say: "The gate's open. Save your coin." }, { say: "You wave the coin at the gate. The gate doesn't do tips. Phil does. He's the one watching you." }],
          knot_hook: 'You jab the hook at the padlock. It flexes, then offers a lesson in why pins are not picks.',
        },
      },
      {
        id: 'lost_found', name: 'Lost & Found Box', rect: [322, 296, 76, 58], show: { flag: 'gate_open' },
        art: `<rect x="324" y="302" width="72" height="50" fill="#a97b4b" stroke="${OUT}" stroke-width="3"/><path d="M324 316h72" stroke="${OUT}" stroke-width="3"/><text x="360" y="342" text-anchor="middle" font-family="Special Elite, monospace" font-size="13" fill="#f2ead7">LOST</text><path d="M350 302l12 -16l12 16" fill="none" stroke="#cfd8ea" stroke-width="3"/>`,
        look: [
          { if: { flag: 'got_pin' }, say: 'The lost-and-found box: socks without partners, gloves without hands, and one now-missing safety pin.' },
          { say: 'The Lost & Found box. Mismatched things. A safety pin gleams on top.' },
        ],
        talk: "You ask the box where the sock is. It rattles with a hundred 'not me's.",
        take: [
          { if: { flag: 'got_pin' }, say: 'Nothing but mismatched mittens left. They are very sad about it.' },
          { give: ['safety_pin'], set: { got_pin: true }, say: 'You pluck out the safety pin. It is bent, a bit rusty, and exactly what a hook needs.' },
        ],
        use: 'You rummage in the box. A glove waves at you with no hand to do it. Ugh.',
      },
      {
        id: 'diary', name: 'Tiny Diary', rect: [404, 312, 44, 44], show: { all: [{ flag: 'gate_open' }, { not: { flag: 'got_diary' } }] },
        art: `<rect x="406" y="314" width="38" height="40" rx="3" fill="#3fd0c9" stroke="${OUT}" stroke-width="2.5"/><rect x="406" y="314" width="7" height="40" fill="#2a8f8b"/><path d="M420 326h16M420 334h16" stroke="${OUT}" stroke-width="2.5"/>`,
        look: 'A tiny teal diary with a sock-shaped bookmark, half-hidden behind the Lost & Found box. Whose?',
        talk: 'You read the cover out loud. It says nothing back.',
        take: { give: ['sock_diary'], set: { got_diary: true }, say: 'You pocket the tiny diary. The last entry is a doodle of a sock walking away, with a little suitcase.' },
        use: 'You flip it open. The lock is a joke, but the entries are not. Better take it with you.',
      },
      {
        id: 'phil', name: 'Fluffy Phil', rect: [66, 196, 130, 156],
        art: chars.phil(132, 348, 1.2),
        look: 'Fluffy Phil: a shady fluff dealer with sunglasses on a face that has never seen sun. His pockets bulge with merchandise and secrets.',
        talk: { dialogue: 'phil' },
        take: "You try to take Phil, but he's a lot of fluff and no handle.",
        use: 'You adjust his sunglasses. He lets you. Phil appreciates a little attention.',
        useWith: {
          coin: [
            { if: { flag: 'gate_open' }, say: '"Already paid, pal. Don\'t get greedy."' },
            {
              take: ['coin'], set: { gate_open: true }, clue: ['phil_tip'],
              say: ['The coin vanishes into the fluff. "Pleasure doing business," says Phil. The gate rattles open on its own.', 'He leans in. "Fenwick\'s tie-men hauled a lumpy bundle up to the Knot Tower. Looked like a sock. Felt like trouble."'],
            },
          ],
          glitter_button: '"Shiny, but I only take coins," says Phil. "Buttons are for people with shirts."',
        },
      },
      {
        id: 'tish', name: 'Tish the Tissue', rect: [556, 200, 108, 152],
        art: chars.tish(610, 348, 1.15),
        look: 'Tish the Tissue: thin, white, and trembling. She is the only suspect who looks like she cries at laundry detergent commercials.',
        talk: { dialogue: 'tish' },
        take: 'You reach for Tish. She sneezes. You decide a handkerchief is not a clue.',
        use: 'You offer her a hankie. She gives it back, shredded. A start of a bond.',
      },
      {
        id: 'shreds', name: 'Pile of Shreds', rect: [664, 314, 108, 50],
        art: Array.from({ length: 9 }, (_, i) => `<rect x="${670 + i * 11}" y="${324 + (i % 3) * 9}" width="${14 - (i % 2) * 4}" height="${5}" fill="#f5f9ff" stroke="#9fb0d4" stroke-width="1" transform="rotate(${(i * 37) % 70 - 30} ${676 + i * 11} 330)"/>`).join(''),
        look: [
          { if: { has: 'ferry_stub' }, say: 'The pile of shreds. Mostly paper confetti now, minus one very interesting ticket stub.' },
          { say: 'A pile of shredded paper with the faint smell of panic. A few shreds look like part of a ticket.' },
        ],
        talk: 'You ask the shreds what they know. They are in no shape to answer.',
        take: [
          { if: { flag: 'got_stub' }, say: 'You sift the shreds again. Nothing but tissue confetti.' },
          { if: { flag: 'tish_met' }, give: ['ferry_stub'], set: { got_stub: true }, say: 'Tish winces but lets you sift. In the shreds you find a ferry ticket stub, torn but readable. Harbour to Bazaar, punched mid-cycle.' },
          { say: 'Tish glares at your hand like it owes her money. Maybe talk to her first, before you root through her shreds.' },
        ],
        use: 'You stir the shreds with a finger. Tish whimpers. Maybe ask first.',
      },
      exitHotspot('Back to the Lobby'),
    ],
  };

  /* ---------- 3. Suds Harbour ---------- */
  LSD.scenes.harbour = {
    id: 'harbour',
    name: 'Suds Harbour',
    first: { say: ['Suds Harbour. The detergent docks. Foam as far as the eye can see and a few places beyond.', 'Bleach Betty polishes glasses at her bar. Pocket Change counts coins on a crate. A bubble-powered ferry bobs at the pier.'] },
    again: { say: 'Suds Harbour. The foam is thicker, the gossip thinner.' },
    bg: () =>
      '<rect width="800" height="450" fill="#0b1738"/>' +
      Array.from({ length: 24 }, (_, i) => `<circle cx="${(i * 71) % 800}" cy="${(i * 41) % 150 + 12}" r="1.6" fill="#bff5f1" opacity=".6"/>`).join('') +
      '<rect y="222" width="800" height="96" fill="url(#gSuds)" opacity=".5"/>' +
      '<path d="M0 226q40-18 80 0t80 0t80 0t80 0t80 0t80 0t80 0t80 0t80 0t80 0" fill="none" stroke="#e8fffe" stroke-width="6" opacity=".7"/>' +
      Array.from({ length: 10 }, (_, i) => `<circle cx="${i * 83 + 20}" cy="${252 + (i % 3) * 16}" r="${8 + (i % 4) * 3}" fill="rgba(232,255,254,.25)" stroke="#e8fffe" stroke-opacity=".6" stroke-width="2"/>`).join('') +
      '<rect y="316" width="800" height="134" fill="#241f3a"/>' +
      Array.from({ length: 17 }, (_, i) => `<line x1="${i * 50}" y1="316" x2="${i * 50}" y2="450" stroke="#16122a" stroke-width="3"/>`).join('') +
      '<path d="M0 316H800" stroke="#3fd0c9" stroke-opacity=".4" stroke-width="3"/>' +
      '<rect x="480" y="186" width="8" height="134" fill="#0a1228"/><circle cx="484" cy="184" r="40" fill="url(#gGlowWarm)"/><circle cx="484" cy="184" r="9" fill="#ffd9a0"/>',
    hotspots: [
      {
        id: 'bar_sign', name: 'Bar Sign', rect: [60, 52, 190, 52],
        art: `<g class="neon"><rect x="64" y="56" width="182" height="44" rx="10" fill="#0a1228" stroke="#e68ab8" stroke-width="3"/><text x="155" y="85" text-anchor="middle" font-family="Special Elite, monospace" font-size="22" fill="#ffd0e6">THE LAST RINSE</text></g>`,
        look: "THE LAST RINSE. The sign promises 'Drinks, Dignity, and Dirt-Free Gossip'. Two of the three are lies.",
        take: "It's wired into the wall. Mostly. You're a detective, not a thief with an extension cord.",
        talk: "The sign hums back at you. It's a bar sign; it has heard worse confessions.",
      },
      {
        id: 'betty', name: 'Bleach Betty', rect: [40, 160, 230, 190],
        art: chars.betty(150, 296, 1.1) +
          `<rect x="40" y="280" width="230" height="60" rx="6" fill="#5a4034" stroke="${OUT}" stroke-width="3"/><rect x="40" y="272" width="230" height="14" rx="4" fill="#7a5a44" stroke="${OUT}" stroke-width="3"/>` +
          [58, 92, 214, 246].map((x, i) => `<rect x="${x}" y="${246 - (i % 2) * 6}" width="12" height="${26 + (i % 2) * 6}" rx="3" fill="${['#e68ab8', '#3fd0c9', '#9ad8ff', '#f2d04a'][i]}" stroke="${OUT}" stroke-width="2"/>`).join(''),
        look: "Bleach Betty: tall, white-capped, and sharp as a fresh stain. She pours rinse aid with the cold precision of a woman who has seen too many spills.",
        talk: { dialogue: 'betty' },
        take: "You attempt to take a drink. Betty slaps your hand with a bar rag. 'You haven't earned that.'",
        use: 'You tap the bar. Betty slides over a glass of something clear and slightly fizzy. You decline, professionally.',
        useWith: { coin: '"Keep your coins, shamrock. The only currency I take is the truth."', glitter_button: '"That\'s not mine. And that\'s not a thing I\'d have behind my bar," says Betty.' },
      },
      {
        id: 'pocket', name: 'Pocket Change', rect: [334, 240, 112, 112],
        art: `<rect x="322" y="316" width="128" height="40" fill="#a97b4b" stroke="${OUT}" stroke-width="3"/><path d="M322 336h128" stroke="${OUT}" stroke-width="2"/>` + chars.pocket(386, 318, 0.95),
        look: 'Pocket Change: three coins in a trench coat of loose shillings. They finish each other\'s sentences, and each other\'s change.',
        talk: { dialogue: 'pocket' },
        take: 'You try to nab a coin. The whole gang rattles and bites. Not worth the risk.',
        use: 'You flip one of them. Heads: grumpy. Tails: also grumpy.',
        useWith: { glitter_button: '"Keep it," says Pocket Change. "We don\'t want it back. It isn\'t metal."', coin: 'Pocket Change eyes your coin hungrily. You pocket it again before the gang starts collecting. Gang rules.' },
      },
      {
        id: 'bollard', name: 'Mooring Bollard', rect: [272, 286, 52, 74],
        art: (S) => `<path d="M276 358V306q0 -16 22 -16t22 16V358Z" fill="#3a4466" stroke="${OUT}" stroke-width="3"/><rect x="274" y="318" width="48" height="10" fill="#d9a441" opacity=".6"/>` +
          (S.flags.got_lint ? '' : `<path d="M282 330c-12 -2 -16 -12 -6 -14c-2 -10 14 -10 14 -2c10 -4 14 8 4 10c4 8 -8 12 -12 6z" fill="#9aa0ad" stroke="${OUT}" stroke-width="1.5"/>`),
        look: [
          { if: { flag: 'got_lint' }, say: 'The mooring bollard. A little cleaner now. It used to be stuck with a very distinct, very clingy fluff.' },
          { say: 'A mooring bollard with a clump of grey lint stuck to it. The kind of lint that will not let go. A particular fluff with a particular reputation.' },
        ],
        talk: 'You tell the bollard your theories. It stays moored to the facts. Solid listener.',
        take: [
          { if: { flag: 'got_lint' }, say: 'Nothing else to take. The bollard keeps its dignity, and the rest of its lint.' },
          { give: ['clingy_lint'], set: { got_lint: true }, say: 'You peel the grey lint off the bollard. It sticks to your glove like it knows you. Static Cling, you sticky old suspect.' },
        ],
        use: "You tie an imaginary boat to the bollard. It pretends not to notice.",
      },
      {
        id: 'ferry', name: 'Bubble Ferry', rect: [510, 146, 262, 192],
        art: `<path d="M520 292L762 292L736 338L548 338Z" fill="#1f6f86" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/><rect x="566" y="226" width="140" height="66" rx="8" fill="#cfd8ea" stroke="${OUT}" stroke-width="3"/>` +
          [584, 622, 660].map((x) => `<rect x="${x}" y="240" width="28" height="26" rx="4" fill="#3fd0c9" opacity=".8" stroke="${OUT}" stroke-width="2"/>`).join('') +
          `<rect x="618" y="190" width="32" height="38" fill="#e68ab8" stroke="${OUT}" stroke-width="3"/><circle cx="634" cy="178" r="12" fill="rgba(232,255,254,.5)" stroke="#e8fffe" stroke-width="2"/><circle cx="650" cy="156" r="9" fill="rgba(232,255,254,.4)" stroke="#e8fffe" stroke-width="2"/><circle cx="530" cy="268" r="26" fill="rgba(232,255,254,.25)" stroke="#e8fffe" stroke-width="3"/><text x="640" y="322" text-anchor="middle" font-family="Special Elite, monospace" font-size="13" fill="#e8fffe">S.S. BUBBLE</text>`,
        look: 'The Bubble Ferry: a floating tub of suds, a funnel that puffs bubbles, and a very optimistic timetable. It runs Harbour to Bazaar when the foam permits.',
        talk: 'You hail the ferry. It blows a bubble in your face. The captain has not yet been seen, possibly because there is no captain.',
        take: 'You are not stealing a ferry. It would not fit in your pocket, and the foam would make a mess.',
        use: 'The ferry bubbles in place. No fares, no ferrymen, no destination. It goes in circles, as does the case so far.',
        useWith: { ferry_stub: 'You wave the stub at the ferry. It dips its funnel in a slow nod. Yes, this ticket was punched here. Mid-cycle, by a very clingy passenger.' },
      },
      {
        id: 'bench', name: 'Lost-Property Bench', rect: [556, 296, 104, 50],
        art: (S) => `<rect x="558" y="312" width="100" height="10" rx="3" fill="#7a5a44" stroke="${OUT}" stroke-width="3"/><rect x="566" y="322" width="8" height="24" fill="#5a4034"/><rect x="642" y="322" width="8" height="24" fill="#5a4034"/>` +
          (S.flags.got_note ? '' : `<path d="M586 311h34l-2 -12l-12 4l-8 -6z" fill="#a9b6c9" stroke="${OUT}" stroke-width="2"/>`),
        look: [
          { if: { flag: 'got_note' }, say: 'The lost-property bench. A damp patch where a note used to be.' },
          { say: 'A bench beside the ferry gangway where passengers leave things behind. A soggy bit of paper is wedged between the slats.' },
        ],
        talk: 'You ask the bench for secrets. It creaks. No promises.',
        take: [
          { if: { flag: 'got_note' }, say: 'The bench has nothing else. It lies, somewhat dampishly.' },
          { give: ['soggy_note'], set: { got_note: true }, say: 'You peel a sodden note from between the slats. The ink has run, and the words are gone. It needs drying, but gently.' },
        ],
        use: 'You sit on the bench. It is wet. You regret everything.',
      },
      exitHotspot('Back to the Lobby'),
    ],
  };

  /* ---------- 4. Hot Air Bazaar ---------- */
  const lampGlow = (lvl) => [0, 0.25, 0.55, 1][lvl || 0];
  LSD.scenes.bazaar = {
    id: 'bazaar',
    name: 'Hot Air Bazaar',
    first: { say: ['The Hot Air Bazaar, deep in the dryer vents. It is warm, loud, and everything is charged. Literally.', 'Zappy Zed hawks static from a stall. Static Cling lurks by his shuttered shop. A heat lamp glows by a sign, and a note to dry would love it.'] },
    again: { say: 'The Hot Air Bazaar. The wind never stops, and neither do the prices.' },
    bg: () =>
      '<rect width="800" height="450" fill="#241532"/><rect width="800" height="300" fill="#2e1a3a"/>' +
      [140, 420, 700].map((x) => `<circle cx="${x}" cy="62" r="48" fill="url(#gGlowWarm)"/><circle cx="${x}" cy="62" r="34" fill="#150c20" stroke="#a8542a" stroke-width="5"/>` +
        Array.from({ length: 5 }, (_, i) => `<line x1="${x - 26}" y1="${44 + i * 9}" x2="${x + 26}" y2="${44 + i * 9}" stroke="#a8542a" stroke-width="3"/>`).join('')).join('') +
      '<rect y="300" width="800" height="150" fill="#3a2336"/><path d="M0 300H800" stroke="#ff8a3d" stroke-opacity=".4" stroke-width="3"/>' +
      Array.from({ length: 17 }, (_, i) => `<line x1="${i * 50}" y1="300" x2="${(i * 50 - 400) * 1.5 + 400}" y2="450" stroke="#4d2c44" stroke-width="2"/>`).join('') +
      '<path d="M330 150l100 0l16 40h-132z" fill="#a8542a" stroke="#0b1630" stroke-width="3"/><rect x="340" y="190" width="96" height="110" fill="#1a1028" stroke="#0b1630" stroke-width="3"/>',
    hotspots: [
      {
        id: 'zed', name: 'Zappy Zed', rect: [56, 180, 160, 170],
        art: `<path d="M38 126l190 0l-16 40H54z" fill="#5fb3ff" stroke="${OUT}" stroke-width="3"/><path d="M54 126l16 40M102 126l-4 40M150 126l4 40M198 126l-12 40" stroke="#e8f1ff" stroke-width="5"/><rect x="48" y="290" width="170" height="60" rx="6" fill="#4a3a5e" stroke="${OUT}" stroke-width="3"/>` + chars.zed(130, 296, 1.1),
        look: 'Zappy Zed: a spiky blue vendor who is mostly hair and voltage. His smile is genuine; his handshake is not safe.',
        talk: { dialogue: 'zed' },
        take: 'You reach for a static charge. It reaches back. Ow. That counts as a lesson, not a clue.',
        use: 'You shake his hand. A tiny lightning bolt travels up your arm and lodges in your hat. Hmm.',
        useWith: { coin: '"Five coins for a balloon," says Zed. "You have one coin. Do the math, detective."' },
      },
      {
        id: 'balloons', name: 'Static Balloons', rect: [226, 196, 76, 92],
        art: [['#e68ab8', 252, 218], ['#3fd0c9', 276, 236], ['#f2d04a', 246, 252]].map(([c, x, y]) => `<ellipse cx="${x}" cy="${y}" rx="17" ry="20" fill="${c}" stroke="${OUT}" stroke-width="2.5"/><path d="M${x} ${y + 20}q4 12 -2 20" stroke="${OUT}" stroke-width="1.5" fill="none"/>`).join(''),
        look: "A bunch of static balloons. One of them is shaped like a sock. A coincidence, or a coy ad? Zed won't say.",
        talk: 'The balloons squeak at you. You squeak back. Neither of you has learned anything.',
        take: 'The balloons snap at your fingers. Static-charged, and not for sale to the broke.',
        use: 'You pop one. A tiny blue spark leaps onto your sleeve. The sleeve is now extra clingy.',
      },
      {
        id: 'static', name: 'Static Cling', rect: [370, 196, 118, 156],
        art: chars.static(430, 350, 1.2),
        look: 'Static Cling: a wavy grey-lavender sheet, hair on end, eyes darting. Sticks to everything and everyone. He is the type who is always near the scene.',
        talk: { dialogue: 'static' },
        take: 'You try to take Static, but he takes you. You are now stuck to him. A mistake. A long minute passes before you unstick.',
        use: 'You pat his shoulder. A static shock jolts your hand. He grins, innocently guilty.',
        useWith: {
          clingy_lint: '"Is that mine? I mean... no. No idea. Never seen that lint." Static Cling suddenly interests himself in the ceiling.',
          ferry_stub: '"Looks like a ferry stub," says Static, a little too quickly. "Plenty of those around. Anyone could have one."',
        },
      },
      {
        id: 'heat_lamp', name: 'Heat Lamp', rect: [556, 92, 108, 126],
        art: (S) => {
          const lvl = S.flags.lamp || 0, g = lampGlow(lvl);
          return `<rect x="606" y="112" width="8" height="106" fill="#4d587a"/><path d="M570 112h80l-14 36h-52z" fill="#5a4034" stroke="${OUT}" stroke-width="3"/>` +
            `<ellipse cx="610" cy="152" rx="${24 + g * 30}" ry="${10 + g * 14}" fill="#ff8a3d" opacity="${(0.12 + g * 0.6).toFixed(2)}"/><ellipse cx="610" cy="150" rx="22" ry="7" fill="${lvl ? '#ffd9a0' : '#3a3a48'}" stroke="${OUT}" stroke-width="2"/>` +
            (lvl ? `<path d="M590 176q-6 10 0 20M610 180q-6 10 0 22M630 176q-6 10 0 20" stroke="#ffb86b" stroke-opacity="${(0.3 + g * 0.6).toFixed(2)}" stroke-width="3" fill="none" stroke-linecap="round"/>` : '');
        },
        look: [
          { if: { is: ['lamp', 0] }, say: 'A big industrial heat lamp, currently off. Its dial sits on the stand below. Anything soggy would love to meet it, once it has a setting.' },
          { if: { is: ['lamp', 1] }, say: 'The heat lamp glows a lazy, gentle orange. LOW. You could warm your hands, but not dry a thing.' },
          { if: { is: ['lamp', 2] }, say: 'The heat lamp burns a steady amber. MEDIUM. The warm kind of hot you want for something delicate.' },
          { say: 'The heat lamp roars white-hot. HIGH. Anything fragile would regret being here.' },
        ],
        talk: 'You tell the lamp your problems. It listens warmly, but only to itself.',
        take: "It's hot, it's bolted, and it's not yours. Three strikes.",
        use: 'The lamp has a dial for that. Look below it.',
        useWith: {
          soggy_note: [
            { if: { is: ['lamp', 0] }, say: "You hold the note up to the lamp. It's off. A cold lamp dries nothing, except your optimism." },
            { if: { is: ['lamp', 1] }, say: 'The warmth is nice, but the note stays soggy. LOW heat only makes it moist and sad. Try more.' },
            {
              if: { is: ['lamp', 2] }, take: ['soggy_note'], give: ['dried_note'],
              say: ["You hold the note under the amber glow. Steam rises. The ink returns, one trembling word at a time, until it's crisp and legible.", 'The dried note reads: "FENWICK\'S KNOT: undo the loop on top first. Red lies over Blue. Blue lies over Green. Yellow lies over Red." Signed: A Friend. (Not a snitch.)'],
            },
            { say: 'You thrust the note into the white-hot glare. It curls at the edges and begins to smoke. You yank it out in time. Still too wet in the middle. Too hot. Turn it down a notch.' },
          ],
        },
      },
      {
        id: 'lamp_dial', name: 'Lamp Dial', rect: [570, 224, 80, 52],
        art: (S) => {
          const lvl = S.flags.lamp || 0, a = -120 + lvl * 80;
          return `<rect x="572" y="226" width="76" height="48" rx="8" fill="#2b2f45" stroke="${OUT}" stroke-width="3"/><circle cx="610" cy="250" r="16" fill="#cfd8ea" stroke="${OUT}" stroke-width="3"/><path d="M610 250L610 236" stroke="${OUT}" stroke-width="4" stroke-linecap="round" transform="rotate(${a} 610 250)"/>` +
            ['OFF', 'LOW', 'MED', 'HI'].map((t, i) => { const ang = ((-120 + i * 80) * Math.PI) / 180; return `<text x="${(610 + Math.sin(ang) * 28).toFixed(0)}" y="${(250 - Math.cos(ang) * 22).toFixed(0)}" text-anchor="middle" font-family="Special Elite, monospace" font-size="8" fill="${i === lvl ? '#ffb347' : '#93a8cc'}">${t}</text>`; }).join('');
        },
        look: [
          { if: { is: ['lamp', 0] }, say: 'The lamp dial: OFF, LOW, MED, HIGH. Currently OFF. Use it to turn the dial up one notch.' },
          { if: { is: ['lamp', 1] }, say: 'The lamp dial sits on LOW. A timid setting for timid lamps.' },
          { if: { is: ['lamp', 2] }, say: 'The lamp dial sits on MEDIUM. The Goldilocks setting. Just right for delicate things.' },
          { say: 'The lamp dial sits on HIGH. The lamp is roaring. Perhaps a little too keen.' },
        ],
        talk: "You explain your problem to the dial. It says nothing, but it's clearly turning it over.",
        take: "It's screwed on tight. Quite literally.",
        use: [
          { if: { is: ['lamp', 0] }, set: { lamp: 1 }, say: 'Click. The lamp wakes up to LOW. A weak orange glow, like a night light with ambition.' },
          { if: { is: ['lamp', 1] }, set: { lamp: 2 }, say: 'Click. MEDIUM. The lamp settles into a warm, even amber. Goldilocks would approve.' },
          { if: { is: ['lamp', 2] }, set: { lamp: 3 }, say: 'Click. HIGH! The lamp blazes white and the air wobbles. The poor thing must be punishing itself.' },
          { set: { lamp: 0 }, say: 'Click. OFF. The lamp sighs and cools. Back to the start of the dial.' },
        ],
      },
      {
        id: 'care_sign', name: 'Care Label Sign', rect: [672, 146, 100, 72],
        art: `<rect x="674" y="148" width="96" height="68" rx="5" fill="#f2ead7" stroke="${OUT}" stroke-width="3"/><text x="722" y="170" text-anchor="middle" font-family="Special Elite, monospace" font-size="11" fill="#2b2f45">CARE LABEL</text><text x="722" y="188" text-anchor="middle" font-family="Special Elite, monospace" font-size="12" fill="#a05252">DELICATES:</text><text x="722" y="205" text-anchor="middle" font-family="Special Elite, monospace" font-size="12" fill="#a05252">MEDIUM ONLY</text>`,
        look: [{ if: { flag: 'read_sign' }, say: "The care label: 'DELICATES: MEDIUM ONLY.' Not too cold, not too hot. A Goldilocks of a sign." }, { set: { read_sign: true }, say: "A care label sign: 'DELICATES: MEDIUM ONLY.' Somebody wants you to know that fragile things like it warm, not hot. That could apply to notes. And to people." }],
        talk: 'You read the sign aloud. It is unmoved. Its message has not changed in years.',
        take: "It's nailed up. Somebody takes their laundry instructions seriously.",
        use: 'You tap the sign. It reads exactly the same. It has the confidence of a care label.',
      },
      exitHotspot('Back to the Lobby'),
    ],
  };

  /* ---------- 5. The Knot Tower ---------- */
  LSD.scenes.tower = {
    id: 'tower',
    name: 'The Knot Tower',
    first: { say: ['The Knot Tower. Every surface is tied to every other surface, and the stairs are knotted to the ceiling.', 'Fitted Sheet Fenwick lounges in a sheet-shaped nest. In the corner, a monstrous knot of coloured loops pulses ever so slightly. Something is tied inside it.'] },
    again: { say: 'The Knot Tower. Everything is tied to something. Mostly to the idea of being left alone.' },
    bg: () =>
      '<rect width="800" height="450" fill="#17122e"/>' +
      Array.from({ length: 6 }, (_, i) => `<rect x="${i * 140 - 20}" y="0" width="12" height="320" fill="#201a3e"/>`).join('') +
      '<path d="M60 300L180 260L220 200L330 190L370 120" fill="none" stroke="#2d2552" stroke-width="22" stroke-linecap="round"/>' +
      Array.from({ length: 6 }, (_, i) => `<path d="M${40 + i * 130} 0q${20 + (i % 3) * 14} ${70 + (i % 2) * 30} 0 ${130 + i * 6}` + '" fill="none" stroke="#e8f1ff" stroke-opacity=".35" stroke-width="5" stroke-linecap="round"/>' + `<circle cx="${40 + i * 130}" cy="${130 + i * 6}" r="9" fill="#e8f1ff" fill-opacity=".35"/>`).join('') +
      '<rect y="330" width="800" height="120" fill="#120d24"/><path d="M0 330H800" stroke="#9a7fe0" stroke-opacity=".4" stroke-width="3"/>' +
      '<ellipse cx="400" cy="390" rx="280" ry="38" fill="#dfe6f5" opacity=".12"/><ellipse cx="400" cy="346" rx="130" ry="14" fill="#dfe6f5" opacity=".2"/>',
    hotspots: [
      {
        id: 'tower_window', name: 'Arched Window', rect: [56, 68, 112, 150],
        art: `<path d="M60 218V120a50 50 0 0 1 100 0V218Z" fill="#0b1630" stroke="#9a7fe0" stroke-width="5"/><circle cx="110" cy="130" r="30" fill="url(#gDrum)"/><path d="M80 150q15 -20 30 0t30 0" fill="none" stroke="#bff5f1" stroke-opacity=".5" stroke-width="3"/>`,
        look: 'An arched window with a view of the whole washer. The spin looks nice from up here. The stakes feel taller.',
        talk: 'You ask the window to keep a lookout. It says nothing, but you feel watched.',
        take: "It's a window. You can't take it. You can only take the view, and it's free.",
      },
      {
        id: 'stairs', name: 'Knotted Stairs', rect: [190, 160, 180, 170],
        art: `<path d="M196 320L236 296L276 296L316 250L356 250L366 200" fill="none" stroke="#6b5bb0" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><path d="M226 300q8 -20 22 -4M290 280q10 -20 22 -2" fill="none" stroke="#e8f1ff" stroke-width="5" stroke-linecap="round"/>`,
        look: 'Stairs that spiral up the Tower, knotted to the ceiling every third step. They are stuck there. Nobody has been up in years.',
        talk: "You shout up the stairs. Only an echo and a distant 'shh' from a sheet answers.",
        take: 'You take a step up. The step takes you back down. You are not going anywhere.',
        use: 'You climb two steps and give up. The stairs are not for climbing. They are for looking impressive.',
      },
      {
        id: 'fenwick', name: 'Fitted Sheet Fenwick', rect: [322, 140, 152, 212],
        art: chars.fenwick(398, 346, 1.9),
        look: 'Fitted Sheet Fenwick: the Knot Boss, in the flesh, or the elastic. He is all corners, smirk, and a monocle. He has the air of a man who irons everything out except his conscience.',
        talk: { dialogue: 'fenwick' },
        take: 'You grab for Fenwick. He folds himself out of your reach in precisely six crisp moves.',
        use: 'You straighten his corner. He smooths it back at once, offended by the help.',
        useWith: {
          left_sock: { say: 'You hold up the left sock. Fenwick stiffens like a starched collar. "Where did you...?" Time to make your accusation, detective. Notebook, then Accuse.' },
          dried_note: 'You show Fenwick the note. He turns the colour of cold milk. "Who wrote that? ...Never mind. It will not help you."',
          knot_hook: 'You flash the Knot Hook. Fenwick winces like you have waved a bad pun in his face. "Not the hook. Anything but the hook."',
        },
      },
      {
        id: 'knot', name: 'The Great Knot', rect: [530, 160, 230, 190],
        art: (S) => {
          if (S.flags.knot_undone) {
            return `<ellipse cx="646" cy="338" rx="100" ry="20" fill="#dfe6f5" stroke="${OUT}" stroke-width="3"/><ellipse cx="620" cy="320" rx="62" ry="22" fill="#cfd8ea" stroke="${OUT}" stroke-width="3"/>` +
              [['#e0554f', 560], ['#4f9bff', 610], ['#46c26b', 660], ['#f2d04a', 710]].map(([c, x]) => `<path d="M${x} 340q20 -14 40 4" fill="none" stroke="${c}" stroke-width="7" stroke-linecap="round"/>`).join('');
          }
          const loops = [['#e0554f', 20], ['#4f9bff', 65], ['#46c26b', 110], ['#f2d04a', 155]];
          return '<g transform="translate(646 258)">' + loops.map(([c, a]) => `<ellipse rx="96" ry="34" fill="none" stroke="${c}" stroke-width="13" transform="rotate(${a})"/>`).join('') +
            '<circle r="22" fill="#dfe6f5" stroke="' + OUT + '" stroke-width="4"/><path d="M-16 -4q8 -10 16 0t16 0M-14 8q8 -8 14 0t14 0" fill="none" stroke="' + OUT + '" stroke-width="3"/></g>';
        },
        look: [
          { if: { flag: 'knot_undone' }, say: 'The Great Knot, unraveled: a limp heap of sheet and four loose coloured cords. It seems almost embarrassed. A sock sits right in the middle.' },
          { say: 'The Great Knot: loops of red, blue, green and yellow in an impossible shape that only a sheet with a grudge could tie. The sock must be inside. A tag dangles near the base.' },
        ],
        talk: 'You ask the knot to release your suspect. It tightens, which is a no.',
        take: [{ if: { flag: 'knot_undone' }, say: 'Nothing left to take but the sock itself, curled on the heap.' }, { say: "You grab the knot with both hands. It grabs back. You'd need a proper tool." }],
        use: [
          { if: { flag: 'knot_undone' }, say: 'The knot is limp. Nothing more to tug. Check the sock.' },
          { say: "You pull at the knot with bare hands. The knot pulls back. Whatever's in there, you can't unpick it without a proper tool. Maybe a hook." },
        ],
        useWith: {
          knot_hook: [
            { if: { flag: 'knot_undone' }, say: 'The knot is already undone. Your hook is retired.' },
            { puzzle: 'knot', say: 'You slide the hook under the first loop. Four loops, four colours, one order. Think about which lies over which.' },
          ],
          dried_note: [
            { if: { flag: 'knot_undone' }, say: 'The knot is already undone. The note is a souvenir now.' },
            { say: 'You compare the dried note to the knot. The colours match: red, blue, green, yellow. The order matters. Now you need something to pull the loops with.' },
          ],
          '*': 'You try that on the knot. The knot is unimpressed, and also not undone.',
        },
      },
      {
        id: 'knot_tag', name: 'Dangling Tag', rect: [548, 300, 66, 44],
        art: `<path d="M562 300l14 -4l18 8l-4 26l-26 -2z" fill="#f2ead7" stroke="${OUT}" stroke-width="2.5"/><circle cx="568" cy="302" r="3" fill="${OUT}"/><path d="M572 312h16M572 320h12" stroke="#5a4a2a" stroke-width="2"/>`,
        show: { not: { flag: 'knot_undone' } },
        look: [
          { if: { clue: 'knot_tag' }, say: "The tag reads: 'F.F. KNOTWORKS: Custom Impossible Shapes'. He claimed he'd never tied a sock. This says otherwise." },
          { clue: ['knot_tag'], say: "A small tag dangles from the base of the knot. It reads: 'F.F. KNOTWORKS: Custom Impossible Shapes'. Fenwick said he had never tied a sock in his life. This tag is a lie detector." },
        ],
        talk: 'You mutter at the tag. It flutters, but offers no further details.',
        take: 'You try to pull the tag off. The knot tightens. The tag stays. Evidence stays in situ.',
        use: 'You flick the tag. It spins. Beneath it, you can read its small print again.',
      },
      {
        id: 'sock', name: "Mrs. Cotton's Sock", rect: [560, 280, 76, 66],
        art: sockArt(598, 346, 0.95, true),
        show: { all: [{ flag: 'knot_undone' }, { not: { has: 'left_sock' } }] },
        look: 'A cream-colored left sock with a small hole near the toe, curled up in the middle of the heap like it has been waiting to be asked. It seems alive, and a little sheepish.',
        talk: { dialogue: 'sock' },
        take: {
          give: ['left_sock'], set: { sock_taken: true },
          say: ['You lift the left sock out of the heap. It sighs, shrugs, and settles into your hand.', 'Fenwick watches from his nest. Now name him: open the Notebook and make your accusation, or have a word with Fenwick.'],
        },
        use: 'You smooth the sock out. It stretches, yawns, and tucks its toe back in.',
      },
      exitHotspot('Back to the Lobby'),
    ],
  };

  /* @@SCENES: new scenes are appended above this line */
})();

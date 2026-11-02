/* Inventory: item data, combine recipes, and the inventory bar. Add new items to LSD.items. */
(function () {
  'use strict';
  const LSD = (globalThis.LSD = globalThis.LSD || {});

  const svg = (inner) => `<svg viewBox="0 0 48 48" aria-hidden="true">${inner}</svg>`;
  const O = '#0b1630'; // outline

  LSD.items = {
    coin: {
      name: 'Lucky Coin',
      desc: 'A coin with a hole in its story. Shady folk in Lint Trap Alley are known to appreciate these.',
      icon: svg(`<circle cx="24" cy="24" r="16" fill="#d9a441" stroke="${O}" stroke-width="2.5"/><circle cx="24" cy="24" r="10" fill="none" stroke="#8a6414" stroke-width="2"/><path d="M20 29l4-10 4 10" stroke="#8a6414" stroke-width="2.5" fill="none" stroke-linecap="round"/>`),
    },
    thread_spool: {
      name: 'Spool of Thread',
      desc: 'Strong red thread. Good for sewing, tying, and implying things.',
      icon: svg(`<rect x="12" y="8" width="24" height="5" rx="2" fill="#c9c3b3" stroke="${O}" stroke-width="2"/><rect x="12" y="35" width="24" height="5" rx="2" fill="#c9c3b3" stroke="${O}" stroke-width="2"/><rect x="15" y="13" width="18" height="22" fill="#d9534f" stroke="${O}" stroke-width="2"/><path d="M15 19h18M15 25h18M15 31h18" stroke="#9c2f2c" stroke-width="2"/>`),
    },
    safety_pin: {
      name: 'Safety Pin',
      desc: 'Safe is a strong word. It has been through the wash more times than you have.',
      icon: svg(`<path d="M10 16h26a6 6 0 0 1 0 12H12" fill="none" stroke="#cfd8ea" stroke-width="3.5" stroke-linecap="round"/><path d="M10 16l-2 6 2 6" fill="none" stroke="#cfd8ea" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="28" r="3" fill="#cfd8ea" stroke="${O}" stroke-width="1.5"/>`),
    },
    knot_hook: {
      name: 'Knot Hook',
      desc: 'A pin bent around a spool of thread: homemade, ugly and exactly what you need to tease apart an impossible knot.',
      icon: svg(`<path d="M30 8v22a8 8 0 1 1-8-8" fill="none" stroke="#cfd8ea" stroke-width="4" stroke-linecap="round"/><rect x="26" y="4" width="8" height="10" rx="2" fill="#d9534f" stroke="${O}" stroke-width="2"/>`),
    },
    soggy_note: {
      name: 'Soggy Note',
      desc: 'A note that took a swim. The ink has run off to find work elsewhere. Needs drying, gently.',
      icon: svg(`<path d="M10 8h28v26c-4 5-8-2-14 3s-10 0-14 4z" fill="#a9b6c9" stroke="${O}" stroke-width="2"/><path d="M16 16h16M16 22h12" stroke="#6f819c" stroke-width="3" stroke-linecap="round"/><path d="M34 38c-3 4-3 6 0 6s3-2 0-6z" fill="#3fd0c9"/>`),
    },
    dried_note: {
      name: 'Dried Note',
      desc: 'Crisp and legible. It reads: "FENWICK\'S KNOT: undo the loop on top first. Red lies over Blue. Blue lies over Green. Yellow lies over Red." Signed: "A Friend. (Not a snitch.)"',
      icon: svg(`<path d="M10 8h28v32H10z" fill="#f2ead7" stroke="${O}" stroke-width="2"/><path d="M16 16h16M16 22h16M16 28h9" stroke="#5a4a2a" stroke-width="2.5" stroke-linecap="round"/>`),
      clue: 'tower_note',
    },
    glitter_button: {
      name: 'Glitter Button',
      desc: 'A sparkly pink button Pocket Change "found". Suspiciously pretty for a gang that only deals in cold hard coin.',
      icon: svg(`<circle cx="24" cy="24" r="16" fill="#e68ab8" stroke="${O}" stroke-width="2.5"/><circle cx="24" cy="24" r="10" fill="none" stroke="#a24f7c" stroke-width="2"/><circle cx="20" cy="21" r="2.2" fill="${O}"/><circle cx="28" cy="21" r="2.2" fill="${O}"/><circle cx="20" cy="28" r="2.2" fill="${O}"/><circle cx="28" cy="28" r="2.2" fill="${O}"/><path d="M36 8v6M33 11h6" stroke="#fff" stroke-width="2"/>`),
    },
    clingy_lint: {
      name: 'Clingy Lint',
      desc: 'Grey, staticky lint that will not let go of your glove. It carries the unmistakable cling of one particular dryer-sheet type.',
      icon: svg(`<path d="M10 30c-4-8 4-14 10-10 2-8 14-8 16 0 8-2 10 10 2 12 2 6-8 8-12 4-4 4-12 2-16-6z" fill="#9aa0ad" stroke="${O}" stroke-width="2"/><path d="M20 14l-2-6M30 14l3-6M38 24l7-2" stroke="#3fd0c9" stroke-width="2" stroke-linecap="round"/>`),
      clue: 'static_lint',
    },
    ferry_stub: {
      name: 'Ferry Ticket Stub',
      desc: 'Half a ticket for the Bubble Ferry. Round trip, Harbour to Bazaar, punched mid-cycle. Somebody shredded it, but not well enough.',
      icon: svg(`<path d="M6 14h36v7a3 3 0 0 0 0 6v7H6v-7a3 3 0 0 0 0-6z" fill="#f2ead7" stroke="${O}" stroke-width="2"/><path d="M30 14v20" stroke="#8a6414" stroke-width="2" stroke-dasharray="3 3"/><path d="M12 22h12M12 28h8" stroke="#5a4a2a" stroke-width="2.5" stroke-linecap="round"/>`),
      clue: 'ferry_stub',
    },
    sock_diary: {
      name: 'Tiny Diary',
      desc: 'A diary the size of a matchbook, with a sock-shaped bookmark. The lock is a joke; the contents are not.',
      icon: svg(`<rect x="11" y="8" width="26" height="32" rx="3" fill="#3fd0c9" stroke="${O}" stroke-width="2.5"/><rect x="11" y="8" width="5" height="32" fill="#2a8f8b"/><path d="M24 17h8M24 22h8" stroke="${O}" stroke-width="2.5" stroke-linecap="round"/><circle cx="30" cy="33" r="3" fill="#d9a441" stroke="${O}" stroke-width="1.5"/>`),
      clue: 'sock_diary',
    },
    left_sock: {
      name: "Mrs. Cotton's Left Sock",
      desc: 'Cream-colored, one small hole near the toe, eleven years of loyalty. Slightly rumpled from the knot, otherwise fine.',
      icon: svg(`<path d="M17 6h14v22c0 4 12 5 12 14 0 6-5 8-11 8H20c-7 0-4-7-4-10z" transform="translate(-2 -4) scale(.95)" fill="#efe6d0" stroke="${O}" stroke-width="2.5"/><circle cx="35" cy="38" r="2" fill="${O}"/>`),
    },
  };

  /* Combine recipes: using item `a` on item `b` (either order) produces `result`. */
  LSD.combos = [
    {
      a: 'thread_spool', b: 'safety_pin', result: 'knot_hook',
      say: 'You thread the pin through the spool and bend it into a hook. A Knot Hook. Fenwick is going to hate this.',
    },
  ];

  LSD.Inventory = {
    has(S, id) { return S.inv.includes(id); },
    add(S, id) { if (!S.inv.includes(id)) { S.inv.push(id); return true; } return false; },
    remove(S, id) { S.inv = S.inv.filter((x) => x !== id); },
    findCombo(a, b) {
      return LSD.combos.find((c) => (c.a === a && c.b === b) || (c.a === b && c.b === a)) || null;
    },
    /* Rebuild the inventory bar. onPick(id) is called when a slot is clicked. */
    render(S, el, selected, onPick) {
      el.innerHTML = '';
      if (!S.inv.length) {
        el.innerHTML = '<span class="inv-empty">Pockets empty. Just lint and ambition.</span>';
        return;
      }
      S.inv.forEach((id) => {
        const it = LSD.items[id];
        const b = document.createElement('button');
        b.className = 'slot' + (selected === id ? ' selected' : '');
        b.setAttribute('role', 'listitem');
        b.setAttribute('aria-label', it.name);
        b.setAttribute('aria-pressed', selected === id ? 'true' : 'false');
        b.title = it.name;
        b.innerHTML = it.icon + '<span>' + it.name + '</span>';
        b.addEventListener('click', () => onPick(id));
        el.appendChild(b);
      });
    },
  };
})();

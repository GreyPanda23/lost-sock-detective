/*
 * Dialogue: story data (clues, suspects, contradictions, dialogue trees, endings) + the runner.
 *
 * A dialogue is { speaker, portrait, start | starts:[{if,node}], nodes:{ id:{ line, fx, choices, then } } }.
 *   node.line      what the speaker says (string or array)
 *   node.fx        effects applied on entering the node (say/give/take/clue/set/goto/dialogue/puzzle/end)
 *   node.choices   array of choices, or '@otherNode' to share another node's choices
 *   node.then      node to continue to when there are no visible choices (omit to end)
 *   choice         { text, if?, once?, fx?, next? }  `if` hides the choice unless the condition holds
 *                  (clue-gated options are marked with a diamond). Omit `next` to end the conversation.
 */
(function () {
  'use strict';
  const LSD = (globalThis.LSD = globalThis.LSD || {});

  /* =====================================================================
   *  CLUES
   * ===================================================================== */
  LSD.clues = {
    cotton_regular: { title: "Mrs. Cotton drinks at Betty's", text: "Mrs. Cotton says she drinks rinse aid at Bleach Betty's bar every Tuesday." },
    betty_cleared: { title: "Betty's alibi holds", text: 'Betty lied about knowing Mrs. Cotton, but she was pouring drinks the whole cycle. Embarrassed, not guilty.' },
    pocket_button: { title: 'Pocket Change "found" a button', text: 'Pocket Change claimed to find only loose change, then handed over a glittery button.' },
    button_cleared: { title: 'Red herring: the button', text: "The glitter button is off Mrs. Cotton's cardigan. It has nothing to do with the sock." },
    phil_tip: { title: "Fenwick's tie-men", text: "Fluffy Phil saw Fenwick's tie-men haul a lumpy bundle up to the Knot Tower." },
    ferry_stub: { title: 'Shredded ferry stub', text: "A ferry ticket stub from Tish's shreds: Harbour to Bazaar, punched mid-cycle." },
    tish_saw: { title: 'Tish saw Static board the ferry', text: 'Tish admits she saw Static Cling board the ferry in the middle of the cycle, trailing lint.' },
    static_lint: { title: 'Static Cling lint at the dock', text: "Grey, clingy lint stuck to the Harbour bollard. It has Static Cling's unmistakable cling." },
    vendor_testimony: { title: "Static's stall is shut", text: "Zappy Zed says Static Cling's stall has been closed since the cycle began. The sign reads 'Gone Ferrying'." },
    tower_note: { title: "Note: Fenwick's knot", text: 'Dried note: undo the loop on top first. Red lies over Blue. Blue lies over Green. Yellow lies over Red.' },
    static_confession: { title: 'Static Cling cracks', text: 'Static Cling admits he held the sock while the Knot Boss tied it. Fenwick is in the Knot Tower.' },
    knot_tag: { title: 'Knot tag: F.F. Knotworks', text: "A tag on the knot reads 'F.F. Knotworks: Custom Impossible Shapes'. Fenwick claimed he never tied a sock." },
    sock_diary: { title: "The sock's diary", text: "A tiny diary: 'Eleven years as the left one. Every time a dryer eats a partner, I am the odd one out.'" },
  };

  /* =====================================================================
   *  SUSPECTS
   * ===================================================================== */
  LSD.suspects = {
    betty: {
      name: 'Bleach Betty', portrait: 'betty', place: 'Suds Harbour',
      motive: 'Hates mismatched socks. Cannot stand an odd one.',
      alibi: 'Pouring drinks at her bar all cycle.',
      dismiss: {
        text: 'Betty throws you out, politely, with a bottle in each hand. "Mismatched socks? I hate \'em. Stealing one? Pass."',
        hint: "Betty has a motive and a lie, but ask yourself whether she actually had the chance. Her bar was full all cycle. Look for the fib she told, not a thief.",
      },
    },
    pocket: {
      name: 'Pocket Change', portrait: 'pocket', place: 'Suds Harbour',
      motive: 'A coin gang that "finds" things. Shiny things.',
      alibi: 'Counting coins on the dock.',
      dismiss: {
        text: 'The gang jingles with outrage. "We found a button! BUTTON! We don\'t even like fabric!"',
        hint: 'Pocket Change found a glittery button, and buttons are not socks. Ask Mrs. Cotton about it, then follow the clues that lead somewhere taller.',
      },
    },
    static: {
      name: 'Static Cling', portrait: 'static', place: 'Hot Air Bazaar',
      motive: 'Sticks to everything. Always near the scene.',
      alibi: 'Says he never left the Bazaar.',
      dismiss: {
        text: 'Static Cling pops with indignation. "I only HELD it! You think I\'d tie it? I can barely tie my own fringe!"',
        hint: 'Static Cling lied about his alibi, but a liar is not always the culprit. Make him talk, and listen to who he says gave the orders.',
      },
    },
    tish: {
      name: 'Tish the Tissue', portrait: 'tish', place: 'Lint Trap Alley',
      motive: 'Shreds anything that looks like evidence.',
      alibi: 'Says she was curled up in a pocket all cycle.',
      dismiss: {
        text: 'Tish sneezes with outrage, then dissolves into a puddle of apologies. "Achoo. Shredding is a hobby, not a crime!"',
        hint: "Tish destroys evidence, but she's more witness than thief. Look at what she shredded. Whose trail does it follow?",
      },
    },
    fenwick: {
      name: 'Fitted Sheet Fenwick', portrait: 'fenwick', place: 'The Knot Tower',
      motive: 'Ties things into impossible shapes. Collects odd socks.',
      alibi: 'Claims he was napping in the Tower.',
      dismiss: null,
    },
  };

  /* Contradiction tracker: a claim logged by a flag, and the clues that prove it false. */
  LSD.contradictions = [
    {
      id: 'betty', suspect: 'betty', claimFlag: 'claim_betty',
      claim: 'I never met Mrs. Cotton. Not once.',
      proof: ['cotton_regular'], clearedBy: 'betty_cleared',
      truth: "Mrs. Cotton is a Tuesday regular at Betty's bar.",
    },
    {
      id: 'pocket', suspect: 'pocket', claimFlag: 'claim_pocket',
      claim: "We just found some loose change. That's all.",
      proof: ['pocket_button'],
      truth: 'They also pocketed a glittery button. (A red herring. It belongs to Mrs. Cotton\'s cardigan.)',
    },
    {
      id: 'tish', suspect: 'tish', claimFlag: 'claim_tish',
      claim: "I didn't see anything. Nothing. Achoo.",
      proof: ['ferry_stub'],
      truth: 'Her shreds contained a ferry stub, and she saw Static Cling board the ferry.',
    },
    {
      id: 'static', suspect: 'static', claimFlag: 'claim_static',
      claim: "I haven't left the Bazaar. Not once.",
      proof: ['static_lint', 'vendor_testimony', 'ferry_stub'], needProof: 3,
      truth: 'His lint is on the dock, his stall is shut, and the ferry stub puts him on the boat.',
    },
    {
      id: 'fenwick', suspect: 'fenwick', claimFlag: 'claim_fenwick',
      claim: "I've never tied a sock in my life.",
      proof: ['knot_tag'],
      truth: "The knot carries his own tag: 'F.F. Knotworks'.",
    },
  ];

  /* =====================================================================
   *  DIALOGUES
   * ===================================================================== */
  LSD.dialogues = {
    cotton: {
      speaker: 'Mrs. Cotton', portrait: 'cotton',
      starts: [{ if: { seen: 'met_cotton' }, node: 'again' }, { node: 'n0' }],
      nodes: {
        n0: {
          line: [
            'Oh, Detective! My left sock is gone. Vanished mid-cycle, right out of the drum.',
            'We were a pair for eleven years. You find it, and I\'ll pay you in tea and gratitude.',
          ],
          fx: { say: 'Mrs. Cotton dabs her eyes with her hanky. You decide that is real emotion.', set: { met_cotton: true } },
          choices: '@hub',
        },
        again: { line: 'Any news, Detective?', choices: '@hub' },
        hub: {
          choices: [
            { text: 'Tell me about the sock.', once: true, next: 'sock' },
            { text: 'Where were you when it vanished?', once: true, next: 'where', fx: { clue: ['cotton_regular'] } },
            { text: 'Anyone with a grudge?', once: true, next: 'grudges', fx: { set: { suspects_known: true } } },
            { text: 'Is this yours? (the glitter button)', if: { has: 'glitter_button' }, once: true, next: 'button', fx: { clue: ['button_cleared'] } },
            { text: 'I\'ll find it, ma\'am.' },
          ],
        },
        sock: {
          line: 'Cream-colored, with a little hole near the toe I never could darn. Left foot. It is always the left one, isn\'t it?',
          then: 'again',
        },
        where: {
          line: 'I was at Betty\'s bar over in Suds Harbour. Every Tuesday, rinse aid, no ice. When I went to leave, the sock was just... gone.',
          fx: { say: 'Noted: Tuesday regular at Betty\'s bar. You write it down while she sniffs.' },
          then: 'again',
        },
        grudges: {
          line: [
            'Well, Bleach Betty can\'t stand mismatched socks. Pocket Change are forever "finding" things.',
            'Static Cling clings to everyone. Tish the Tissue shreds everything. And the Knot Boss, Fitted Sheet Fenwick, ties things into shapes that shouldn\'t exist.',
          ],
          fx: { say: 'Five names. You add them to the Notebook. One of them is lying, and some of them are lying for fun.' },
          then: 'again',
        },
        button: {
          line: 'That\'s the button off my cardigan, dear! I lost it Thursday. The sock never had buttons.',
          fx: { say: 'Red herring identified. It sparkled, but it never led anywhere.' },
          then: 'again',
        },
      },
    },

    phil: {
      speaker: 'Fluffy Phil', portrait: 'phil',
      starts: [{ if: { flag: 'gate_open' }, node: 'open' }, { node: 'n0' }],
      nodes: {
        n0: { line: "Fluff is cheap, kid. Answers aren't. Whaddaya want?", choices: '@hub' },
        open: { line: 'The gate\'s open. Mind the lint on your way in. It bites.', choices: '@hub' },
        hub: {
          choices: [
            { text: 'Heard anything about a missing sock?', once: true, next: 'info' },
            { text: 'Slide him a coin.', if: { has: 'coin' }, next: 'pay', fx: { take: ['coin'], set: { gate_open: true }, clue: ['phil_tip'] } },
            { text: 'Open the gate for me.', if: { not: { flag: 'gate_open' } }, next: 'gate' },
            { text: 'Never mind.' },
          ],
        },
        info: { line: "Heard? Maybe. Information costs. A coin. Shiny. Round. Doesn't ask questions.", then: 'n0' },
        gate: { line: "Gate opens when my pockets are heavier, pal. Come back with a coin.", then: 'n0' },
        pay: {
          line: [
            "*The coin vanishes into the fluff.* Pleasure doing business. Gate's open.",
            "And for free: Fenwick's tie-men hauled a lumpy bundle past here, up to the Knot Tower. Looked like a sock. Felt like trouble.",
          ],
          fx: { say: 'The gate rattles open on its own, as if embarrassed to be bribed.' },
          then: 'open',
        },
      },
    },

    betty: {
      speaker: 'Bleach Betty', portrait: 'betty',
      starts: [{ node: 'n0' }],
      nodes: {
        n0: { line: "Name your poison, shamrock. Rinse aid's on the house if you're talking.", fx: { set: { met_betty: true } }, choices: '@hub' },
        hub: {
          choices: [
            { text: 'Where were you during the cycle?', once: true, next: 'alibi' },
            { text: 'Do you know Mrs. Cotton?', once: true, next: 'cotton', fx: { set: { claim_betty: true } } },
            {
              text: "Mrs. Cotton says she drinks here every Tuesday.", if: { clue: 'cotton_regular' }, once: true,
              next: 'confront', fx: { clue: ['betty_cleared'], set: { betty_cleared: true } },
            },
            { text: 'Just passing through.' },
          ],
        },
        again: { line: 'Anything else? I have glasses to polish and grudges to nurse.', choices: '@hub' },
        alibi: { line: "Right here. Pouring. Serving. Wiping. Thirty glasses a minute during the rinse. Check the tab, it's not even funny.", then: 'again' },
        cotton: { line: "Mrs. Cotton? Never met the woman. Not once. I can't abide those mismatched types.", then: 'again' },
        confront: {
          line: [
            '...Fine. She\'s a regular. Rinse aid, no ice, Tuesdays. I lied because she was always one sock short and I didn\'t want to talk about it.',
            'I hate mismatched socks, doll, but I didn\'t take hers. I\'ve been pouring since the cycle began. Ask anyone on the dock.',
          ],
          fx: { say: 'Betty is lying less now. You cross her alibi off the list: embarrassed, not guilty.' },
          then: 'again',
        },
      },
    },

    pocket: {
      speaker: 'Pocket Change', portrait: 'pocket',
      starts: [{ node: 'n0' }],
      nodes: {
        n0: { line: "We just found some loose change. That's all. Nothing glittery. Nothing at all.", fx: { set: { claim_pocket: true, met_pocket: true } }, choices: '@hub' },
        again: { line: 'Still here. Still counting. Go away.', choices: '@hub' },
        hub: {
          choices: [
            { text: 'Where were you during the cycle?', once: true, next: 'alibi' },
            { text: 'I see something glittery in your pocket.', once: true, next: 'button', fx: { give: ['glitter_button'], clue: ['pocket_button'] } },
            { text: 'Carry on, boys.' },
          ],
        },
        alibi: { line: 'Counting. Always counting. Coins are our whole identity.', then: 'again' },
        button: {
          line: '...Okay, we found a button. It\'s not a sock! Take it, it\'s weird-looking. We only like round, metal things.',
          fx: { say: 'They hand over a glittery pink button. Suspiciously pretty for a coin gang.' },
          then: 'again',
        },
      },
    },

    tish: {
      speaker: 'Tish the Tissue', portrait: 'tish',
      starts: [{ node: 'n0' }],
      nodes: {
        n0: { line: "I didn't see anything. Nothing. A-achoo. Nothing at all.", fx: { set: { claim_tish: true, met_tish: true, tish_met: true } }, choices: '@hub' },
        again: { line: '*sniff* Anything else, detective?', choices: '@hub' },
        hub: {
          choices: [
            { text: 'Why shred everything?', once: true, next: 'why' },
            { text: 'Where were you during the cycle?', once: true, next: 'alibi' },
            { text: "That ferry stub in your shreds says otherwise.", if: { clue: 'ferry_stub' }, once: true, next: 'saw', fx: { clue: ['tish_saw'] } },
            { text: 'Bless you. Goodbye.' },
          ],
        },
        why: { line: 'Evidence is heavy. Shreds are light. I get nervous, I shred. It is not a crime, it is a coping mechanism.', then: 'again' },
        alibi: { line: 'In a pocket. Curled up. Warm. It was a very long cycle.', then: 'again' },
        saw: {
          line: [
            '...Oh. You found the stub. Fine.',
            'I saw Static Cling board the ferry in the middle of the cycle. Lint all over him. He told everyone he never leaves the Bazaar.',
          ],
          fx: { say: 'Tish blows her nose in relief. Static Cling just got a little less cozy.' },
          then: 'again',
        },
      },
    },

    zed: {
      speaker: 'Zappy Zed', portrait: 'zed',
      starts: [{ node: 'n0' }],
      nodes: {
        n0: { line: 'Static! Fresh static! Zero-day zaps! Get your charges right here!', choices: '@hub' },
        again: { line: 'Anything else? Or are you just here for the free shocks?', choices: '@hub' },
        hub: {
          choices: [
            { text: 'Seen Static Cling lately?', once: true, next: 'seen', fx: { clue: ['vendor_testimony'], set: { met_zed: true } } },
            { text: 'What about that heat lamp?', once: true, next: 'lamp', fx: { set: { lamp_hint: true } } },
            { text: 'Buy a static balloon.', once: true, next: 'buy' },
            { text: 'Just browsing.' },
          ],
        },
        seen: {
          line: "Static Cling's stall? Shut since the cycle began. Sign says 'Gone Ferrying'. Funny, he swears he never leaves the Bazaar.",
          fx: { say: 'Gone Ferrying. You write that down twice, in case it tries to escape.' },
          then: 'again',
        },
        lamp: { line: "Delicates need medium. Too cold, you're soggy. Too hot, you're toast. Read the sign by the lamp, kid.", then: 'again' },
        buy: { line: "Five coins. You don't have five coins. Come back with a smaller conscience.", then: 'again' },
      },
    },

    static: {
      speaker: 'Static Cling', portrait: 'static',
      starts: [{ if: { flag: 'static_exposed' }, node: 'confess' }, { node: 'n0' }],
      nodes: {
        n0: { line: "Hey. Hey, detective. Clingy, clingy. I haven't left the Bazaar once. Not once. Ask anyone.", fx: { set: { claim_static: true, met_static: true } }, choices: '@hub' },
        again: { line: 'Can I help you? I am very busy. Clinging.', choices: '@hub' },
        hub: {
          choices: [
            { text: 'Where were you during the cycle?', once: true, next: 'alibi' },
            { text: 'Lay out the evidence.', if: { clues: 3 }, next: 'lay', fx: { puzzle: 'alibi' } },
            { text: 'Never mind.' },
          ],
        },
        alibi: { line: 'Right here. At my stall. Clinging to the stall. It is very clingy work.', then: 'again' },
        lay: { line: 'Evidence? I have nothing to hide. *sweats statically*', then: 'again' },
        confess: {
          line: [
            "I held it! That's all! The Knot Boss paid me in static to cling the sock in place while he tied it. Fitted Sheet Fenwick!",
            "He's up in the Knot Tower. Don't tell him I told you. I stick to everything but my word.",
          ],
          fx: { clue: ['static_confession'] },
          choices: [{ text: 'Thanks for the truth, Static.' }],
        },
      },
    },

    fenwick: {
      speaker: 'Fitted Sheet Fenwick', portrait: 'fenwick',
      starts: [{ node: 'n0' }],
      nodes: {
        n0: { line: "Ah, the famous Detective Lint. Do come in. I've never tied a sock in my life. They sit so nicely already.", fx: { set: { claim_fenwick: true, met_fenwick: true } }, choices: '@hub' },
        again: { line: 'Still here, detective? I was in the middle of a nap.', choices: '@hub' },
        hub: {
          choices: [
            { text: 'Where were you during the cycle?', once: true, next: 'alibi' },
            { text: 'Your tag is on that knot, Fenwick.', if: { clue: 'knot_tag' }, next: 'tag' },
            { text: 'It was you, Fenwick. I have the sock.', if: { has: 'left_sock' }, next: 'accuse', fx: { end: 'win' } },
            { text: 'Just admiring the decor.' },
          ],
        },
        alibi: { line: 'Napping. In a sheet-shaped nest. I fold beautifully, detective, and I do not tie things.', then: 'again' },
        tag: {
          line: "Rude. Observant, but rude. Well: no sock, no case, detective. If you want it, undo my knot. It's never been done.",
          then: 'again',
        },
        accuse: { line: 'Hmph.' },
      },
    },

    sock: {
      speaker: 'The Sock', portrait: 'lint',
      starts: [{ node: 'n0' }],
      nodes: {
        n0: {
          line: '...Oh. It is you. Detective Lint. Please do not take me back. Not yet.',
          fx: { set: { sock_spoke: true } },
          choices: '@hub',
        },
        again: { line: 'Anything else? I am enjoying not being a pair.', choices: '@hub' },
        hub: {
          choices: [
            { text: 'Why did you hide in a knot?', once: true, next: 'why' },
            { text: 'I read your diary.', if: { clue: 'sock_diary' }, once: true, next: 'diary' },
            { text: 'You are not the odd one out. Walk out on your own terms.', if: { clue: 'sock_diary' }, next: 'walk', fx: { end: 'secret' } },
            { text: 'Come with me. Mrs. Cotton is waiting.', next: 'end_normal', fx: { give: ['left_sock'], set: { sock_taken: true }, say: 'The sock sighs and hops into your hand. Reluctant, but a professional.' } },
          ],
        },
        why: { line: 'Fenwick did it because I asked. Static held me while Fenwick knotted. I wanted to be somewhere nobody would count me.', then: 'again' },
        diary: { line: 'Then you know. Eleven years of being the left one. Every time a dryer eats a partner, somebody has to be the odd sock out.', then: 'again' },
        walk: { line: '...Maybe I will. Thank you, detective.' },
        end_normal: { line: 'Fine. But I am only going back as a pair, not as a possession.' },
      },
    },
  };

  /* =====================================================================
   *  ENDINGS
   * ===================================================================== */
  LSD.endings = {
    win: {
      kicker: 'Case Closed',
      title: 'The Sock Comes Home',
      art: 'win',
      body: [
        'Fenwick unfolds his arms and his story. "Fine. I tied it. I tie everything! A sock alone, without a partner? It looked so... untidy."',
        'You hand Mrs. Cotton her left sock. She holds it to her cheek, then to her right sock. They lie side by side like old friends who never had the nerve to say so.',
        '"Detective," she says, "that is the finest piece of work I have ever seen." You say it was nothing, which is a lie, because it took two dozen interviews, three clues, and one dangerously well-ironed knot.',
        'Fenwick is sentenced to community service: ironing, for eternity. Static Cling is placed on probation. Betty pours you a rinse aid. The drum slows, the suds settle, and the Washing Machine Dimension is, for one brief moment, in perfect balance.',
        'Case closed. Epilogue: the left sock now insists on being called "Lefty" and has joined a support group for lone socks. Nobody asked, but everybody attends.',
      ],
    },
    secret: {
      kicker: 'Secret Ending',
      title: 'The Odd Sock Out',
      art: 'secret',
      body: [
        'You close the diary. The sock hops down from the unraveled nest, stretches its toe, and walks, on its own, out through the Tower door.',
        '"I did not want a rescue," it says. "I wanted a choice." You find you have nothing to say, which in your line of work is a sort of poetry.',
        'Mrs. Cotton is delighted, and slightly confused, when the sock turns up on her doorstep by itself with a note: "I am fine. I am not a pair. I am a sock." She wears it on Thursdays. They are both happy.',
        'Fenwick is let off with a warning. The Tower, for once, unravels peacefully. The drum slows and settles.',
        'Case closed, in a way the file does not have a box for. Epilogue: your business card now reads "Lint & Co. Lost, Found, and Left Alone."',
      ],
    },
  };

  /* =====================================================================
   *  RUNNER
   * ===================================================================== */
  function listOwner(d, nodeId) {
    const n = d.nodes[nodeId];
    if (typeof n.choices === 'string') return { owner: n.choices.slice(1), list: d.nodes[n.choices.slice(1)].choices };
    return { owner: nodeId, list: n.choices || [] };
  }
  const key = (id, owner, i) => `${id}.${owner}.${i}`;

  function visibleChoices(S, dId, nodeId) {
    const d = LSD.dialogues[dId];
    const { owner, list } = listOwner(d, nodeId);
    const res = [];
    list.forEach((c, i) => {
      if (!LSD.Core.cond(c.if, S)) return;
      if (c.once && S.seen[key(dId, owner, i)]) return;
      res.push({ idx: i, text: c.text, gated: !!(c.if && (c.if.clue || c.if.has || c.if.clues)) });
    });
    return res;
  }

  function view(S) {
    const { id, node } = S.dlg;
    const d = LSD.dialogues[id];
    const n = d.nodes[node];
    let lines = n.line == null ? [] : Array.isArray(n.line) ? n.line : [n.line];
    let choices = visibleChoices(S, id, node);
    if (!choices.length) choices = [{ idx: -1, text: n.then ? '...' : '(Leave)' }];
    return { id, node, speaker: d.speaker, portrait: d.portrait, lines, choices };
  }

  function enter(S, nodeId, out) {
    S.dlg.node = nodeId;
    const n = LSD.dialogues[S.dlg.id].nodes[nodeId];
    if (!n) throw new Error(`Dialogue ${S.dlg.id}: missing node ${nodeId}`);
    LSD.Core.apply(n.fx, S, out);
  }

  function finished(out) { return !!(out.end || out.puzzle || out.goto || out.dialogue); }

  LSD.Dialogue = {
    start(S, id) {
      const d = LSD.dialogues[id];
      const out = LSD.Core.newOut();
      const entry = d.starts ? d.starts.find((s) => LSD.Core.cond(s.if, S)) : { node: d.start };
      S.dlg = { id, node: null };
      enter(S, entry.node, out);
      LSD.Core.tick(S, out);
      S.seen['met_' + id] = true;
      if (finished(out)) { S.dlg = null; return { view: null, out }; }
      return { view: view(S), out };
    },
    choose(S, idx) {
      const out = LSD.Core.newOut();
      const { id, node } = S.dlg;
      const d = LSD.dialogues[id];
      if (idx === -1) {
        const n = d.nodes[node];
        if (n.then) { enter(S, n.then, out); if (finished(out)) { S.dlg = null; return { view: null, out }; } return { view: view(S), out }; }
        S.dlg = null;
        return { view: null, out };
      }
      const { owner, list } = listOwner(d, node);
      const c = list[idx];
      if (c.once) S.seen[key(id, owner, idx)] = true;
      LSD.Core.apply(c.fx, S, out);
      LSD.Core.tick(S, out);
      if (finished(out) || !c.next) { S.dlg = null; return { view: null, out }; }
      enter(S, c.next, out);
      if (finished(out)) { S.dlg = null; return { view: null, out }; }
      return { view: view(S), out };
    },
    visibleChoices,
  };
})();

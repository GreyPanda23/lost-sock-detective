/* Main: boot, screens (title, intro, game, ending), pause menu, notebook, accusations. */
(function () {
  'use strict';
  const LSD = (globalThis.LSD = globalThis.LSD || {});
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const Core = () => LSD.Core;
  const ch = () => LSD.Art.chars;

  let S = null;

  /* ---------- art for the title, intro and ending screens ---------- */
  const backdrop = (tint = '') =>
    '<rect width="800" height="450" fill="url(#gDrum2)"/>' +
    '<g class="spinner"><circle cx="400" cy="225" r="330" fill="none" stroke="#3fd0c9" stroke-opacity=".16" stroke-width="12"/>' +
    Array.from({ length: 28 }, (_, i) => {
      const a = (i / 28) * Math.PI * 2;
      return `<circle cx="${(400 + Math.cos(a) * 294).toFixed(1)}" cy="${(225 + Math.sin(a) * 294).toFixed(1)}" r="9" fill="#060b1d" stroke="#3fd0c9" stroke-opacity=".22" stroke-width="2"/>`;
    }).join('') + '</g>' + tint;
  const defs2 = '<defs><radialGradient id="gDrum2" cx="50%" cy="48%" r="75%"><stop offset="0" stop-color="#1a3470"/><stop offset="1" stop-color="#060b1d"/></radialGradient></defs>';
  const skyline = () => {
    let s = '';
    const hs = [90, 140, 70, 170, 110, 60, 150, 100, 130, 80, 160, 95];
    hs.forEach((h, i) => {
      const x = i * 68 - 10;
      s += `<rect x="${x}" y="${360 - h}" width="60" height="${h + 90}" fill="#0a1228" stroke="#1a2a5a" stroke-width="2"/>`;
      for (let r = 0; r < Math.floor(h / 26); r++) for (let c = 0; c < 2; c++)
        if ((i + r + c) % 3) s += `<rect x="${x + 10 + c * 26}" y="${360 - h + 10 + r * 26}" width="14" height="12" fill="#3fd0c9" opacity=".55"/>`;
    });
    return s;
  };
  const socks = (x, y, s, fill) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-17 -88H17V-38C17 -28 46 -24 46 -8C46 3 38 6 26 6H-9C-22 6 -17 -8 -17 -16Z" fill="${fill}" stroke="#0b1630" stroke-width="3"/><rect x="-18" y="-94" width="36" height="13" rx="3" fill="#a05252" stroke="#0b1630" stroke-width="3"/></g>`;

  function titleArt() {
    return defs2 + backdrop() + skyline() +
      '<rect y="360" width="800" height="90" fill="#070d20"/><path d="M0 360H800" stroke="#3fd0c9" stroke-opacity=".5" stroke-width="3"/>' +
      '<g class="neon"><rect x="40" y="40" width="190" height="46" rx="10" fill="none" stroke="#3fd0c9" stroke-width="3"/><text x="135" y="72" text-anchor="middle" font-family="Special Elite, monospace" font-size="24" fill="#bff5f1">LINT &amp; CO.</text></g>' +
      ch().lint(660, 405, 1.8);
  }
  function introArt(i) {
    const base = defs2 + backdrop();
    if (i === 0) return base + skyline() + '<rect y="360" width="800" height="90" fill="#070d20"/>';
    if (i === 1) return base + '<rect y="300" width="800" height="150" fill="#0d1838"/><rect x="170" y="290" width="300" height="16" fill="#4a3a36" stroke="#0b1630" stroke-width="3"/>' + ch().lint(560, 330, 2.2);
    if (i === 2) return base + '<rect y="300" width="800" height="150" fill="#0d1838"/>' + ch().cotton(250, 380, 2.2) + ch().lint(570, 380, 1.9);
    return base + '<rect y="320" width="800" height="130" fill="#0d1838"/>' +
      '<g transform="translate(400 190)"><circle r="120" fill="none" stroke="#3fd0c9" stroke-width="6" stroke-opacity=".7"/><path d="M0 -105V0L64 40" stroke="#ffb347" stroke-width="8" stroke-linecap="round" fill="none"/><circle r="9" fill="#ffb347"/></g>' + ch().lint(130, 400, 1.7);
  }
  function endingArt(kind) {
    const base = defs2 + backdrop();
    if (kind === 'secret') return base + '<rect y="340" width="800" height="110" fill="#0d1838"/>' + socks(560, 380, 1.5, '#efe6d0') + '<path d="M620 330l60 -40M640 350l90 -50" stroke="#bff5f1" stroke-opacity=".3" stroke-width="5" stroke-linecap="round"/>' + ch().lint(200, 396, 1.8);
    let conf = '';
    for (let i = 0; i < 28; i++) conf += `<circle cx="${(i * 97) % 800}" cy="${(i * 53) % 330}" r="${3 + (i % 3) * 2}" fill="${['#3fd0c9', '#ffb347', '#e68ab8', '#bff5f1'][i % 4]}" opacity=".7"/>`;
    return base + conf + '<rect y="350" width="800" height="100" fill="#0d1838"/>' + socks(330, 392, 1.5, '#efe6d0') + socks(450, 392, 1.5, '#efe6d0') + ch().cotton(640, 396, 1.5);
  }

  /* ---------- screens ---------- */
  function show(id) {
    $$('.screen').forEach((s) => s.classList.toggle('active', s.id === id));
    const el = $('#' + id);
    el.scrollTop = 0;
  }
  const overlays = () => $$('.overlay:not([hidden])');

  function toTitle() {
    $$('.overlay').forEach((o) => { o.hidden = true; });
    $('#btn-continue').hidden = !LSD.Save.read();
    show('screen-title');
  }

  /* ---------- intro ---------- */
  const INTRO = [
    'The Washing Machine Dimension. A city of suds and spin, where nobody sleeps because the lights are always on and the floor is always moving.',
    "I'm Detective Lint. I find what the cycle loses. Keys, coins, the occasional will to live. Mostly socks.",
    "Then she walked in: Mrs. Cotton, round, soft and furious. \"Detective, my left sock is gone. Vanished mid-cycle, right out of the drum.\"",
    'I took the case. Nobody else would. The Spin Cycle was already ticking, and somebody out there was lying through their fabric softener.',
  ];
  let introI = 0;
  function runIntro() {
    introI = 0;
    show('screen-intro');
    paintIntro();
  }
  function paintIntro() {
    $('#intro-art').innerHTML = introArt(introI);
    $('#intro-text').textContent = INTRO[introI];
    $('#intro-next').textContent = introI === INTRO.length - 1 ? 'Take the Case' : 'Next';
  }
  function introNext() {
    LSD.Audio.sfx('click');
    if (introI < INTRO.length - 1) { introI++; paintIntro(); } else beginGame(true);
  }

  /* ---------- game ---------- */
  function newGame() {
    LSD.Audio.unlock();
    LSD.Save.clear();
    S = Core().newState();
    runIntro();
  }
  function continueGame() {
    LSD.Audio.unlock();
    const saved = LSD.Save.read();
    if (!saved) return newGame();
    S = saved;
    beginGame(false);
  }
  function beginGame(fresh) {
    show('screen-game');
    LSD.UI.load(S);
    if (fresh || !S.introDone) {
      S.introDone = true;
      const out = Core().newOut();
      Core().enterScene(S, 'lobby', out);
      LSD.UI.handleOut(out);
    } else {
      LSD.UI.say(["Back on the case. The drum hasn't stopped turning, and neither have you."]);
    }
  }

  /* ---------- pause ---------- */
  function openPause() {
    if (!$('#screen-game').classList.contains('active')) return;
    $('#pause-restart').textContent = 'Restart Case';
    $('#overlay-pause').hidden = false;
    $('#pause-resume').focus();
  }
  function closeTop() {
    const o = overlays();
    if (!o.length) return false;
    const top = o[o.length - 1];
    if (top.id === 'overlay-dismissed') return true; // must press Retry
    if (top.id === 'overlay-puzzle') LSD.UI.closePuzzle(); else top.hidden = true;
    return true;
  }

  /* ---------- notebook ---------- */
  let tab = 'clues';
  function openNotebook(t) {
    if (t) tab = t;
    $('#overlay-pause').hidden = true;
    renderNotebook();
    $('#overlay-notebook').hidden = false;
  }
  function suspectStatus(c) {
    const have = c.proof.filter((p) => S.clues.includes(p)).length;
    return { exposed: S.flags[c.claimFlag] && have >= (c.needProof || c.proof.length), have, need: c.needProof || c.proof.length };
  }
  function renderNotebook() {
    $$('#overlay-notebook .tab').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
    const body = $('#nb-body');
    let h = '';
    if (tab === 'clues') {
      h = S.clues.length ? S.clues.map((id) => {
        const c = LSD.clues[id];
        return `<div class="card"><h3>${esc(c.title)}</h3><p>${esc(c.text)}</p></div>`;
      }).join('') : '<p class="empty">Nothing yet. A detective with no clues is just a sock with a hat.</p>';
    } else if (tab === 'suspects') {
      h = Object.keys(LSD.suspects).map((id) => {
        const s = LSD.suspects[id];
        const known = S.flags.suspects_known || S.flags['met_' + id];
        const c = LSD.contradictions.find((x) => x.suspect === id);
        const st = suspectStatus(c);
        let badge = '';
        if (id === 'betty' && S.flags.betty_cleared) badge = '<span class="badge clear">alibi holds</span>';
        else if (st.exposed) badge = '<span class="badge liar">caught lying</span>';
        else if (S.flags[c.claimFlag]) badge = '<span class="badge">claim logged</span>';
        return `<div class="card suspect"><svg viewBox="-48 -112 96 116" aria-hidden="true">${known ? LSD.Art.portrait(s.portrait) : '<text x="0" y="-40" text-anchor="middle" font-size="40" fill="#93a8cc">?</text>'}</svg>` +
          `<div><h3>${known ? esc(s.name) : 'Unknown suspect'}${badge}</h3>` +
          `<p><b>Motive:</b> ${known ? esc(s.motive) : '???'}</p>` +
          `<p><b>Alibi:</b> ${S.flags['met_' + id] ? esc(s.alibi) : "Haven't met them yet."}</p>` +
          `<p class="meta">${known ? esc(s.place) : ''}</p></div></div>`;
      }).join('');
    } else {
      h = LSD.contradictions.map((c) => {
        const s = LSD.suspects[c.suspect];
        const st = suspectStatus(c);
        if (!S.flags[c.claimFlag]) return `<div class="card liar-row"><h3>${S.flags.suspects_known || S.flags['met_' + c.suspect] ? esc(s.name) : 'Unknown suspect'}</h3><p class="meta">No claim logged yet. Interview them.</p></div>`;
        return `<div class="card liar-row ${st.exposed ? 'exposed' : ''}"><h3>${esc(s.name)}${st.exposed ? '<span class="badge liar">lie exposed</span>' : ''}</h3>` +
          `<p class="claim">${esc(c.claim)}</p>` +
          (st.exposed ? `<p class="meta"><b>Truth:</b> ${esc(c.truth)}</p>` : `<p class="meta">Evidence: ${st.have} of ${st.need} clues found that disprove this.</p>`) + '</div>';
      }).join('');
    }
    body.innerHTML = h;
  }

  function openAccuse() {
    const list = $('#accuse-list');
    list.innerHTML = '';
    Object.keys(LSD.suspects).forEach((id) => {
      const s = LSD.suspects[id];
      const known = S.flags.suspects_known || S.flags['met_' + id];
      const b = document.createElement('button');
      b.className = 'btn';
      b.textContent = known ? s.name : 'Unknown suspect (' + id.slice(0, 1).toUpperCase() + '...)';
      if (!known) b.disabled = true;
      b.addEventListener('click', () => accuse(id));
      list.appendChild(b);
    });
    $('#overlay-accuse').hidden = false;
  }
  function accuse(id) {
    $('#overlay-accuse').hidden = true;
    $('#overlay-notebook').hidden = true;
    const r = Core().accuse(S, id);
    LSD.UI.handleOut(r.out);
  }

  /* ---------- endings ---------- */
  LSD.onEnd = function (end, out) {
    if (end === 'dismissed') {
      const s = LSD.suspects[out.suspect];
      $('#dismissed-title').textContent = 'Not ' + s.name.split(' ').slice(-1)[0] + '.';
      $('#dismissed-text').textContent = s.dismiss.text;
      $('#dismissed-hint').textContent = s.dismiss.hint;
      LSD.Audio.sfx('sad');
      $('#overlay-dismissed').hidden = false;
      return;
    }
    S.ended = end;
    LSD.Save.clear();
    const e = LSD.endings[end];
    $('#ending-kicker').textContent = e.kicker;
    $('#ending-title').textContent = e.title;
    $('#ending-body').innerHTML = e.body.map((p) => `<p>${esc(p)}</p>`).join('');
    $('#ending-art').innerHTML = endingArt(e.art);
    LSD.Audio.sfx('win');
    $$('.overlay').forEach((o) => { o.hidden = true; });
    show('screen-ending');
  };

  /* ---------- boot ---------- */
  function boot() {
    LSD.UI.init();
    $('#title-art').innerHTML = titleArt();
    $('#btn-new').addEventListener('click', newGame);
    $('#btn-continue').addEventListener('click', continueGame);
    $('#btn-howto').addEventListener('click', (e) => {
      const hid = $('#howto').hidden;
      $('#howto').hidden = !hid;
      e.currentTarget.setAttribute('aria-expanded', hid ? 'true' : 'false');
    });
    $('#intro-next').addEventListener('click', introNext);
    $('#intro-skip').addEventListener('click', () => beginGame(true));

    $('#btn-pause').addEventListener('click', openPause);
    $('#pause-resume').addEventListener('click', () => { $('#overlay-pause').hidden = true; });
    $('#pause-notebook').addEventListener('click', () => openNotebook());
    $('#pause-quit').addEventListener('click', () => { LSD.Save.write(S); toTitle(); });
    $('#pause-restart').addEventListener('click', (e) => {
      if (e.currentTarget.dataset.armed !== '1') {
        e.currentTarget.dataset.armed = '1';
        e.currentTarget.textContent = 'Really restart? Click again';
        return;
      }
      e.currentTarget.dataset.armed = '0';
      $('#overlay-pause').hidden = true;
      newGame();
    });

    $('#btn-notebook').addEventListener('click', () => openNotebook());
    $('#nb-close').addEventListener('click', () => { $('#overlay-notebook').hidden = true; });
    $$('#overlay-notebook .tab').forEach((b) => b.addEventListener('click', () => { tab = b.dataset.tab; renderNotebook(); }));
    $('#nb-accuse').addEventListener('click', openAccuse);
    $('#accuse-cancel').addEventListener('click', () => { $('#overlay-accuse').hidden = true; });
    $('#dismissed-retry').addEventListener('click', () => { $('#overlay-dismissed').hidden = true; LSD.Save.write(S); });

    $('#ending-again').addEventListener('click', newGame);
    $('#ending-title-btn').addEventListener('click', toTitle);

    $$('.mute-toggle').forEach((b) => b.addEventListener('click', () => LSD.Audio.toggleMute()));
    LSD.Audio.paintButtons();
    document.addEventListener('pointerdown', () => LSD.Audio.unlock(), { once: true });

    window.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (closeTop()) return;
      if (!LSD.UI.dlgOpen) openPause();
    });
    $$('.overlay').forEach((o) => o.addEventListener('pointerdown', (e) => {
      if (e.target === o && o.id !== 'overlay-dismissed' && o.id !== 'overlay-puzzle') o.hidden = true;
    }));

    $('#btn-continue').hidden = !LSD.Save.read();
    LSD.Game = { get state() { return S; } };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

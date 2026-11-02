/* Audio: tiny Web Audio synth. Blips for UI/events and a looping washer hum. No audio files. */
(function () {
  'use strict';
  const LSD = (globalThis.LSD = globalThis.LSD || {});
  let ctx = null, master = null, humNodes = null;
  let muted = false;
  try { muted = localStorage.getItem('lsd.muted') === '1'; } catch (e) { /* ignore */ }

  function ensure() {
    if (ctx) return ctx;
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.8;
      master.connect(ctx.destination);
    } catch (e) { ctx = null; }
    return ctx;
  }

  function tone(freq, dur, type, vol, when, slideTo) {
    if (!ensure() || muted) return;
    const t = ctx.currentTime + (when || 0);
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.08, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.02);
  }

  const SFX = {
    click: () => tone(520, 0.06, 'square', 0.05),
    talk: () => { tone(300, 0.05, 'triangle', 0.07); tone(380, 0.06, 'triangle', 0.07, 0.06); },
    pickup: () => { tone(660, 0.08, 'square', 0.07); tone(990, 0.12, 'square', 0.07, 0.08); },
    clue: () => { tone(523, 0.1, 'triangle', 0.09); tone(659, 0.1, 'triangle', 0.09, 0.1); tone(784, 0.18, 'triangle', 0.09, 0.2); },
    door: () => tone(180, 0.18, 'sawtooth', 0.05, 0, 90),
    error: () => tone(160, 0.2, 'sawtooth', 0.06, 0, 110),
    phase: () => { tone(330, 0.15, 'sine', 0.08); tone(247, 0.25, 'sine', 0.08, 0.15); },
    win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, 'triangle', 0.1, i * 0.12)),
    sad: () => [392, 330, 262].forEach((f, i) => tone(f, 0.28, 'sawtooth', 0.06, i * 0.22)),
  };

  /* a low looping hum: two detuned oscillators through a lowpass, wobbled by a slow LFO */
  function startHum() {
    if (humNodes || !ensure()) return;
    try {
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 220;
      const g = ctx.createGain(); g.gain.value = 0.055;
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.35;
      const lfoGain = ctx.createGain(); lfoGain.gain.value = 0.02;
      lfo.connect(lfoGain); lfoGain.connect(g.gain);
      const a = ctx.createOscillator(); a.type = 'sawtooth'; a.frequency.value = 55;
      const b = ctx.createOscillator(); b.type = 'sawtooth'; b.frequency.value = 55.7;
      a.connect(lp); b.connect(lp); lp.connect(g); g.connect(master);
      a.start(); b.start(); lfo.start();
      humNodes = [a, b, lfo];
    } catch (e) { humNodes = null; }
  }
  function stopHum() {
    if (!humNodes) return;
    humNodes.forEach((n) => { try { n.stop(); } catch (e) { /* already stopped */ } });
    humNodes = null;
  }

  function paintButtons() {
    document.querySelectorAll('.mute-toggle').forEach((b) => {
      b.classList.toggle('muted', muted);
      b.setAttribute('aria-pressed', muted ? 'true' : 'false');
      b.title = muted ? 'Sound off' : 'Sound on';
    });
  }

  LSD.Audio = {
    get muted() { return muted; },
    /* call from a user gesture so browsers allow audio */
    unlock() {
      if (!ensure()) return;
      if (ctx.state === 'suspended') ctx.resume();
      if (!muted) startHum();
    },
    sfx(name) { const f = SFX[name]; if (f && !muted) { try { f(); } catch (e) { /* ignore */ } } },
    toggleMute() {
      muted = !muted;
      try { localStorage.setItem('lsd.muted', muted ? '1' : '0'); } catch (e) { /* ignore */ }
      if (ensure()) master.gain.value = muted ? 0 : 0.8;
      if (!muted) { startHum(); this.sfx('click'); }
      paintButtons();
    },
    stopHum,
    paintButtons,
  };
})();

// Moss sound engine. Lives in a hidden window. Everything is synthesized,
// so there are no audio files and nothing to license.

const moss = window.moss;
let ctx = null;
let out = null; // master volume
let reverb = null;
let current = null; // { name, gain, stop }
let previewTimer = null;
let s = null;

function audio() {
  if (ctx) return ctx;
  ctx = new AudioContext();
  out = ctx.createGain();
  out.gain.value = volume();
  out.connect(ctx.destination);
  reverb = ctx.createConvolver();
  reverb.buffer = impulse(3.2, 2.6);
  const wet = ctx.createGain();
  wet.gain.value = 0.35;
  reverb.connect(wet).connect(out);
  return ctx;
}

const volume = () => {
  const v = s ? s.settings.volume : 0.5;
  return v * v; // perceptual curve
};

function impulse(seconds, decay) {
  const rate = ctx.sampleRate;
  const buf = ctx.createBuffer(2, rate * seconds, rate);
  for (let c = 0; c < 2; c++) {
    const data = buf.getChannelData(c);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** decay;
  }
  return buf;
}

function noise(kind, seconds = 8) {
  const rate = ctx.sampleRate;
  const buf = ctx.createBuffer(2, rate * seconds, rate);
  for (let c = 0; c < 2; c++) {
    const data = buf.getChannelData(c);
    let last = 0;
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      if (kind === 'brown') {
        last = (last + 0.02 * white) / 1.02;
        data[i] = last * 3.5;
      } else {
        // Paul Kellet's economy pink noise
        b0 = 0.99765 * b0 + white * 0.099046;
        b1 = 0.963 * b1 + white * 0.2965164;
        b2 = 0.57 * b2 + white * 1.0526913;
        data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.11;
      }
    }
    // Crossfade the ends so the loop has no click.
    const fade = Math.floor(rate * 0.05);
    for (let i = 0; i < fade; i++) {
      const t = i / fade;
      data[i] = data[i] * t + data[data.length - fade + i] * (1 - t);
    }
  }
  return buf;
}

function loop(buffer) {
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  src.loopEnd = buffer.duration - 0.05;
  return src;
}

function lfo(param, rate, depth) {
  const osc = ctx.createOscillator();
  const amt = ctx.createGain();
  osc.frequency.value = rate;
  amt.gain.value = depth;
  osc.connect(amt).connect(param);
  osc.start();
  return osc;
}

// ---- Ambiences -------------------------------------------------------------

const AMBIENCES = {
  brown(bus) {
    const src = loop(noise('brown'));
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 520;
    const mod = lfo(lp.frequency, 0.04, 140);
    const g = ctx.createGain();
    g.gain.value = 0.9;
    src.connect(lp).connect(g).connect(bus);
    src.start();
    return () => [src, mod].forEach((n) => n.stop());
  },

  rain(bus) {
    const hiss = loop(noise('pink'));
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 900;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 6500;
    const hissGain = ctx.createGain();
    hissGain.gain.value = 0.38;
    const swell = lfo(hissGain.gain, 0.07, 0.08);
    hiss.connect(hp).connect(lp).connect(hissGain).connect(bus);

    const body = loop(noise('brown'));
    const bodyLp = ctx.createBiquadFilter();
    bodyLp.type = 'lowpass';
    bodyLp.frequency.value = 380;
    const bodyGain = ctx.createGain();
    bodyGain.gain.value = 0.45;
    body.connect(bodyLp).connect(bodyGain).connect(bus);

    // Individual drops: tiny filtered clicks scattered in stereo.
    const dropBuf = noise('pink', 0.05);
    const scheduleDrops = () => {
      const now = ctx.currentTime;
      const count = 3 + Math.floor(Math.random() * 4);
      for (let i = 0; i < count; i++) {
        const t = now + 0.05 + Math.random() * 0.3;
        const src = ctx.createBufferSource();
        src.buffer = dropBuf;
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 1800 + Math.random() * 3500;
        bp.Q.value = 6;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.05 + Math.random() * 0.09, t + 0.002);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
        const pan = ctx.createStereoPanner();
        pan.pan.value = Math.random() * 1.6 - 0.8;
        src.connect(bp).connect(g).connect(pan).connect(bus);
        src.start(t);
        src.stop(t + 0.05);
      }
    };
    const timer = setInterval(scheduleDrops, 300);
    hiss.start();
    body.start();
    return () => {
      clearInterval(timer);
      [hiss, body, swell].forEach((n) => n.stop());
    };
  },

  // A slow, warm pad that drifts through four chords, with the odd soft glint.
  drift(bus) {
    const CHORDS = [
      [146.83, 185.0, 220.0, 277.18], // Dmaj7
      [123.47, 146.83, 185.0, 220.0], // Bm7
      [98.0, 146.83, 196.0, 246.94], // G(add9 voicing)
      [110.0, 164.81, 220.0, 246.94], // Asus2
    ];
    const GLINTS = [587.33, 659.25, 739.99, 880.0, 987.77];
    const CHORD_S = 14;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1100;
    lp.Q.value = 0.4;
    const filterMod = lfo(lp.frequency, 0.03, 350);
    const padGain = ctx.createGain();
    padGain.gain.value = 0.16;
    // A private reverb, so the tail fades with the bus instead of outliving it.
    const verb = ctx.createConvolver();
    verb.buffer = reverb.buffer;
    const verbGain = ctx.createGain();
    verbGain.gain.value = 0.5;
    lp.connect(padGain);
    padGain.connect(bus);
    padGain.connect(verb);
    verb.connect(verbGain).connect(bus);

    const voices = new Set();
    let index = 0;
    const playChord = () => {
      const t = ctx.currentTime;
      for (const f of CHORDS[index % CHORDS.length]) {
        for (const [type, detune] of [
          ['sine', -6],
          ['triangle', 6],
        ]) {
          const osc = ctx.createOscillator();
          osc.type = type;
          osc.frequency.value = f;
          osc.detune.value = detune;
          const g = ctx.createGain();
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(type === 'sine' ? 0.22 : 0.08, t + 5);
          g.gain.setValueAtTime(type === 'sine' ? 0.22 : 0.08, t + CHORD_S);
          g.gain.linearRampToValueAtTime(0, t + CHORD_S + 6);
          osc.connect(g).connect(lp);
          osc.start(t);
          osc.stop(t + CHORD_S + 6.1);
          voices.add(osc);
          osc.onended = () => voices.delete(osc);
        }
      }
      if (Math.random() < 0.7) {
        const at = t + 3 + Math.random() * 8;
        bell(GLINTS[Math.floor(Math.random() * GLINTS.length)], at, 0.035, 4, bus, verb);
      }
      index++;
    };
    playChord();
    const timer = setInterval(playChord, CHORD_S * 1000);
    return () => {
      clearInterval(timer);
      filterMod.stop();
      voices.forEach((v) => v.stop());
    };
  },
};

function setAmbience(name) {
  if (current?.name === name) return;
  if (current) {
    const old = current;
    old.gain.gain.cancelScheduledValues(ctx.currentTime);
    old.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.5);
    setTimeout(() => {
      old.stop();
      old.gain.disconnect();
    }, 2500);
    current = null;
  }
  if (name === 'off' || !AMBIENCES[name]) return;
  audio();
  ctx.resume();
  const gain = ctx.createGain();
  gain.gain.value = 0;
  gain.connect(out);
  gain.gain.setTargetAtTime(1, ctx.currentTime, 0.9);
  current = { name, gain, stop: AMBIENCES[name](gain) };
}

// ---- Chimes ----------------------------------------------------------------

// A soft bowl-like tone: a few slightly inharmonic partials with long decays.
function bell(freq, at, level, decay, dest = out, verb = reverb) {
  const PARTIALS = [
    [1, 1, 1],
    [2.01, 0.32, 0.6],
    [3.02, 0.12, 0.4],
    [4.17, 0.05, 0.25],
  ];
  for (const [ratio, amp, life] of PARTIALS) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq * ratio;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(level * amp, at + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, at + decay * life);
    osc.connect(g);
    g.connect(dest);
    g.connect(verb);
    osc.start(at);
    osc.stop(at + decay * life + 0.05);
  }
}

const CHIMES = {
  // Focus done: settle downward.
  rest: [
    [783.99, 0],
    [587.33, 0.42],
  ],
  // Break over: lift upward.
  focus: [
    [587.33, 0],
    [880.0, 0.36],
  ],
};

function chime(kind) {
  audio();
  ctx.resume();
  const t = ctx.currentTime + 0.05;
  for (const [f, offset] of CHIMES[kind] || CHIMES.rest) bell(f, t + offset, 0.22, 3.2);
}

// ---- Wiring ----------------------------------------------------------------

function wanted() {
  if (!s || s.settings.ambience === 'off') return 'off';
  const active = s.status === 'running' && (s.phase === 'focus' || s.settings.ambienceInBreaks);
  return active ? s.settings.ambience : 'off';
}

function sync() {
  if (previewTimer) return; // a preview is playing and will sync when it ends
  const name = wanted();
  if (!ctx && name === 'off') return;
  audio();
  out.gain.setTargetAtTime(volume(), ctx.currentTime, 0.15);
  setAmbience(name);
}

moss.getState().then((next) => {
  s = next;
  sync();
});

moss.onState((next) => {
  s = next;
  if (previewTimer && ctx) out.gain.setTargetAtTime(volume(), ctx.currentTime, 0.15);
  sync();
});

moss.onSound((msg) => {
  if (msg.type === 'chime') {
    audio();
    out.gain.setTargetAtTime(volume(), ctx.currentTime, 0.05);
    chime(msg.kind);
  } else if (msg.type === 'preview') {
    clearTimeout(previewTimer);
    previewTimer = null;
    audio();
    out.gain.setTargetAtTime(volume(), ctx.currentTime, 0.05);
    setAmbience(msg.name);
    previewTimer = setTimeout(() => {
      previewTimer = null;
      sync();
    }, 7000);
  }
});

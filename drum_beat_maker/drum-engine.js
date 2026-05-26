// Web Audio drum synthesis engine for Focustone DAW Beat Maker

(function () {
  let ctx = null;
  let masterGain = null;
  let masterAnalyser = null;
  let spectrumData = null;
  let peakL = 0, peakR = 0, rms = 0;

  function ensureCtx() {
    if (ctx) return ctx;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.9;
    masterAnalyser = ctx.createAnalyser();
    masterAnalyser.fftSize = 1024;
    spectrumData = new Uint8Array(masterAnalyser.frequencyBinCount);
    masterGain.connect(masterAnalyser);
    masterAnalyser.connect(ctx.destination);
    const buf = new Float32Array(masterAnalyser.fftSize);
    function tick() {
      masterAnalyser.getFloatTimeDomainData(buf);
      let p = 0, s = 0;
      for (let i = 0; i < buf.length; i++) {
        const v = Math.abs(buf[i]);
        if (v > p) p = v;
        s += buf[i] * buf[i];
      }
      const r = Math.sqrt(s / buf.length);
      peakL = peakL * 0.85 + p * 0.15;
      peakR = peakR * 0.85 + p * 0.15;
      rms   = rms   * 0.85 + r * 0.15;
      requestAnimationFrame(tick);
    }
    tick();
    return ctx;
  }

  function noiseBuffer(duration, c_) {
    const c = c_ || ensureCtx();
    const length = Math.floor(c.sampleRate * duration);
    const buf = c.createBuffer(1, length, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  function envGain(node, t, attack, peak, decay) {
    const g = node.gain;
    g.cancelScheduledValues(t);
    g.setValueAtTime(0.0001, t);
    g.exponentialRampToValueAtTime(peak, t + attack);
    g.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  }

  // Each voice: (t, vel, dest, c_)
  //   dest — final audio destination node (defaults to masterGain)
  //   c_   — AudioContext to use (defaults to live ctx; pass OfflineAudioContext for rendering)
  const voices = {
    kick(t, vel = 1, dest = null, c_ = null) {
      const c = c_ || ensureCtx();
      const d = dest || masterGain;
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(38, t + 0.18);
      envGain(gain, t, 0.005, 0.9 * vel, 0.35);
      osc.connect(gain).connect(d);
      osc.start(t); osc.stop(t + 0.5);
      const click = c.createOscillator();
      const clickG = c.createGain();
      click.type = "triangle";
      click.frequency.setValueAtTime(2200, t);
      envGain(clickG, t, 0.001, 0.25 * vel, 0.02);
      click.connect(clickG).connect(d);
      click.start(t); click.stop(t + 0.05);
    },
    snare(t, vel = 1, dest = null, c_ = null) {
      const c = c_ || ensureCtx();
      const d = dest || masterGain;
      const noise = c.createBufferSource();
      noise.buffer = noiseBuffer(0.25, c);
      const hp = c.createBiquadFilter();
      hp.type = "highpass"; hp.frequency.value = 1200;
      const ng = c.createGain();
      envGain(ng, t, 0.002, 0.5 * vel, 0.15);
      noise.connect(hp).connect(ng).connect(d);
      noise.start(t);
      const osc = c.createOscillator();
      const og = c.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(160, t + 0.08);
      envGain(og, t, 0.002, 0.4 * vel, 0.12);
      osc.connect(og).connect(d);
      osc.start(t); osc.stop(t + 0.2);
    },
    hihat(t, vel = 1, dest = null, c_ = null) {
      const c = c_ || ensureCtx();
      const d = dest || masterGain;
      const noise = c.createBufferSource();
      noise.buffer = noiseBuffer(0.08, c);
      const hp = c.createBiquadFilter();
      hp.type = "highpass"; hp.frequency.value = 7000;
      const g = c.createGain();
      envGain(g, t, 0.001, 0.35 * vel, 0.045);
      noise.connect(hp).connect(g).connect(d);
      noise.start(t);
    },
    openhat(t, vel = 1, dest = null, c_ = null) {
      const c = c_ || ensureCtx();
      const d = dest || masterGain;
      const noise = c.createBufferSource();
      noise.buffer = noiseBuffer(0.4, c);
      const hp = c.createBiquadFilter();
      hp.type = "highpass"; hp.frequency.value = 6000;
      const g = c.createGain();
      envGain(g, t, 0.001, 0.32 * vel, 0.28);
      noise.connect(hp).connect(g).connect(d);
      noise.start(t);
    },
    clap(t, vel = 1, dest = null, c_ = null) {
      const c = c_ || ensureCtx();
      const d = dest || masterGain;
      [0, 0.012, 0.025].forEach((off) => {
        const noise = c.createBufferSource();
        noise.buffer = noiseBuffer(0.08, c);
        const bp = c.createBiquadFilter();
        bp.type = "bandpass"; bp.frequency.value = 1500; bp.Q.value = 1.4;
        const g = c.createGain();
        envGain(g, t + off, 0.001, 0.35 * vel, 0.04);
        noise.connect(bp).connect(g).connect(d);
        noise.start(t + off);
      });
      const tail = c.createBufferSource();
      tail.buffer = noiseBuffer(0.2, c);
      const tbp = c.createBiquadFilter();
      tbp.type = "bandpass"; tbp.frequency.value = 1500;
      const tg = c.createGain();
      envGain(tg, t + 0.025, 0.005, 0.25 * vel, 0.18);
      tail.connect(tbp).connect(tg).connect(d);
      tail.start(t + 0.025);
    },
    tom(t, vel = 1, dest = null, c_ = null) {
      const c = c_ || ensureCtx();
      const d = dest || masterGain;
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(110, t + 0.25);
      envGain(g, t, 0.005, 0.7 * vel, 0.35);
      osc.connect(g).connect(d);
      osc.start(t); osc.stop(t + 0.5);
    },
    perc(t, vel = 1, dest = null, c_ = null) {
      const c = c_ || ensureCtx();
      const d = dest || masterGain;
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(880, t);
      osc.frequency.exponentialRampToValueAtTime(560, t + 0.06);
      envGain(g, t, 0.001, 0.18 * vel, 0.08);
      osc.connect(g).connect(d);
      osc.start(t); osc.stop(t + 0.15);
    },
    rim(t, vel = 1, dest = null, c_ = null) {
      const c = c_ || ensureCtx();
      const d = dest || masterGain;
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = "square";
      osc.frequency.value = 320;
      envGain(g, t, 0.001, 0.25 * vel, 0.04);
      osc.connect(g).connect(d);
      osc.start(t); osc.stop(t + 0.06);
    },
  };

  // ── Offline render helper ───────────────────────────────────────────────────
  function buildOfflineCtx(totalSteps, bpm, stepsPerBeat) {
    const sr = 48000;
    const secPerStep = 60.0 / bpm / stepsPerBeat;
    const duration = totalSteps * secPerStep + 1.5;
    const offCtx = new OfflineAudioContext(2, Math.ceil(sr * duration), sr);
    const offMaster = offCtx.createGain();
    offMaster.gain.value = 0.9;
    offMaster.connect(offCtx.destination);
    return { offCtx, offMaster, secPerStep };
  }

  function scheduleVoice(offCtx, offMaster, track, step, t, vel) {
    const fn = voices[track.voice];
    if (!fn) return;
    let dest = offMaster;
    if (track.pan !== 0) {
      const panner = offCtx.createStereoPanner();
      panner.pan.value = Math.max(-1, Math.min(1, track.pan));
      panner.connect(offMaster);
      dest = panner;
    }
    fn(t + 0.05, vel, dest, offCtx);
  }

  // ── Public API ──────────────────────────────────────────────────────────────
  const DrumEngine = {
    resume() {
      const c = ensureCtx();
      return c.state === "suspended" ? c.resume() : Promise.resolve();
    },
    now() {
      return ensureCtx().currentTime;
    },

    // Pan support: creates a per-trigger StereoPannerNode when pan ≠ 0
    trigger(voice, when, vel = 1, gain = 1, pan = 0) {
      const c = ensureCtx();
      const fn = voices[voice];
      if (!fn) return;
      let dest = masterGain;
      if (pan !== 0) {
        const panner = c.createStereoPanner();
        panner.pan.value = Math.max(-1, Math.min(1, pan));
        panner.connect(masterGain);
        dest = panner;
      }
      fn(when, vel * gain, dest, c);
    },

    // Metronome click: downbeat = 1500 Hz, upbeat = 1000 Hz, 30 ms decay
    metroClick(t, isDownbeat) {
      const c = ensureCtx();
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = "sine";
      osc.frequency.value = isDownbeat ? 1500 : 1000;
      g.gain.setValueAtTime(isDownbeat ? 0.4 : 0.25, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
      osc.connect(g).connect(masterGain);
      osc.start(t); osc.stop(t + 0.04);
    },

    setMasterVolume(v) {
      if (masterGain) masterGain.gain.value = v;
    },

    getLevels() {
      const toDb = (v) => (v > 0 ? 20 * Math.log10(v) : -60);
      return { peak: Math.max(-60, toDb(peakL)), rms: Math.max(-60, toDb(rms)) };
    },

    // Real FFT spectrum data (Uint8Array[512], 0–255 per bin)
    getSpectrum() {
      if (!masterAnalyser || !spectrumData) return new Uint8Array(512).fill(0);
      masterAnalyser.getByteFrequencyData(spectrumData);
      return spectrumData;
    },

    // Full mix render → Promise<AudioBuffer>
    renderToBuffer(trackList, patternMap, totalSteps, bpm, stepsPerBeat, swingPct) {
      const { offCtx, offMaster, secPerStep } = buildOfflineCtx(totalSteps, bpm, stepsPerBeat);
      const anySolo = trackList.some((t) => t.solo);
      for (let step = 0; step < totalSteps; step++) {
        const isOff = step % 2 === 1;
        const swingOff = isOff ? (swingPct / 100) * 0.5 * secPerStep : 0;
        const t = step * secPerStep + swingOff;
        trackList.forEach((track) => {
          if (track.mute || (anySolo && !track.solo)) return;
          const v = patternMap[track.id]?.[step] ?? 0;
          if (!v) return;
          const vel = (v / 127) * (track.velocity / 100) * (track.volume / 100);
          scheduleVoice(offCtx, offMaster, track, step, t, vel);
        });
      }
      return offCtx.startRendering();
    },

    // Single-track stem render → Promise<AudioBuffer>
    renderTrackToBuffer(track, patternMap, totalSteps, bpm, stepsPerBeat, swingPct) {
      const { offCtx, offMaster, secPerStep } = buildOfflineCtx(totalSteps, bpm, stepsPerBeat);
      for (let step = 0; step < totalSteps; step++) {
        const isOff = step % 2 === 1;
        const swingOff = isOff ? (swingPct / 100) * 0.5 * secPerStep : 0;
        const t = step * secPerStep + swingOff;
        const v = patternMap[track.id]?.[step] ?? 0;
        if (!v) continue;
        const vel = (v / 127) * (track.velocity / 100) * (track.volume / 100);
        scheduleVoice(offCtx, offMaster, track, step, t, vel);
      }
      return offCtx.startRendering();
    },

    voices: Object.keys(voices),
  };

  window.DrumEngine = DrumEngine;
})();

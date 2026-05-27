// Focustone DAW Beat Maker — main app

const { useState, useEffect, useLayoutEffect, useRef, useCallback } = React;

// ────────────────────────────────────────────────────────────
//  Defaults
// ────────────────────────────────────────────────────────────
const TRACK_PRESETS = {
  kick:    { name: "Kick",           color: "#00f0ff", glow: "rgba(0,240,255,.55)" },
  snare:   { name: "Snare Core",     color: "#00ee70", glow: "rgba(0,238,112,.55)" },
  hihat:   { name: "Hi-Hat Closed",  color: "#d1bcff", glow: "rgba(209,188,255,.55)" },
  openhat: { name: "Hi-Hat Open",    color: "#e9ddff", glow: "rgba(233,221,255,.45)" },
  clap:    { name: "Clap",           color: "#ffb86b", glow: "rgba(255,184,107,.55)" },
  tom:     { name: "Low Tom",        color: "#ff7ba9", glow: "rgba(255,123,169,.55)" },
  perc:    { name: "Perc Click",     color: "#7df4ff", glow: "rgba(125,244,255,.5)"  },
  rim:     { name: "Rim Shot",       color: "#fde68a", glow: "rgba(253,230,138,.55)" },
};

function makeTrack(voice, overrides = {}) {
  const p = TRACK_PRESETS[voice];
  return {
    id: `t_${voice}_${Math.random().toString(36).slice(2, 7)}`,
    voice, name: p.name, color: p.color, glow: p.glow,
    volume: 75, velocity: 100, pan: 0, mute: false, solo: false,
    ...overrides,
  };
}

const DEFAULT_TRACKS = [
  makeTrack("kick",    { volume: 85 }),
  makeTrack("snare",   { volume: 78 }),
  makeTrack("hihat",   { volume: 60, pan:  0.15 }),
  makeTrack("openhat", { volume: 55, pan:  0.15 }),
  makeTrack("clap",    { volume: 70, pan: -0.10 }),
  makeTrack("tom",     { volume: 65, pan: -0.20 }),
];

function defaultPattern(tracks) {
  const v = (arr, val = 110) => arr.map((x) => (x ? val : 0));
  const p = {};
  p[tracks[0].id] = v([1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0]);
  p[tracks[1].id] = v([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,1], 105);
  p[tracks[2].id] = v([1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],  75);
  p[tracks[3].id] = v([0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,1,0],  90);
  p[tracks[4].id] = v([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],  95);
  p[tracks[5].id] = v([0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,1], 100);
  return p;
}

function beatsPerBar(sig) {
  const [n] = sig.split("/").map(Number);
  return n || 4;
}

function resizeSteps(arr, newLen) {
  const out = new Array(newLen).fill(0);
  for (let i = 0; i < Math.min(arr?.length || 0, newLen); i++) out[i] = arr[i] || 0;
  return out;
}

// ────────────────────────────────────────────────────────────
//  WAV encoder + download helpers
// ────────────────────────────────────────────────────────────
function audioBufferToWav(buffer) {
  const numCh = buffer.numberOfChannels;
  const sr    = buffer.sampleRate;
  const len   = buffer.length;
  const bps   = 2; // 16-bit PCM
  const dataLen = len * numCh * bps;
  const ab   = new ArrayBuffer(44 + dataLen);
  const view = new DataView(ab);
  const ws = (off, str) => { for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i)); };
  ws(0, 'RIFF'); view.setUint32(4, 36 + dataLen, true);
  ws(8, 'WAVE'); ws(12, 'fmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 1, true);
  view.setUint16(22, numCh, true); view.setUint32(24, sr, true);
  view.setUint32(28, sr * numCh * bps, true); view.setUint16(32, numCh * bps, true);
  view.setUint16(34, 16, true); ws(36, 'data'); view.setUint32(40, dataLen, true);
  const chs = [];
  for (let ch = 0; ch < numCh; ch++) chs.push(buffer.getChannelData(ch));
  let off = 44;
  for (let i = 0; i < len; i++) {
    for (let ch = 0; ch < numCh; ch++) {
      const s = Math.max(-1, Math.min(1, chs[ch][i]));
      view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      off += 2;
    }
  }
  return new Blob([ab], { type: 'audio/wav' });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ────────────────────────────────────────────────────────────
//  MIDI export (SMF Type-0)
// ────────────────────────────────────────────────────────────
const GM_DRUMS = { kick:36, snare:38, hihat:42, openhat:46, clap:39, tom:41, perc:75, rim:37 };

function patternToMidi(tracks, pattern, totalSteps, bpm, stepsPerBeat) {
  const TPQN = 480;
  const microPerBeat = Math.round(60000000 / bpm);
  const ticksPerStep = TPQN / stepsPerBeat;
  const events = [{ tick: 0, type: 'tempo', value: microPerBeat }];

  tracks.forEach((track) => {
    if (track.mute) return;
    const noteNum = GM_DRUMS[track.voice] || 36;
    (pattern[track.id] || []).forEach((v, step) => {
      if (!v) return;
      const tick = Math.round(step * ticksPerStep);
      const vel  = Math.max(1, Math.min(127, Math.round((v / 127) * (track.velocity / 100) * 127)));
      events.push({ tick, type: 'noteOn',  note: noteNum, vel });
      events.push({ tick: tick + Math.round(ticksPerStep * 0.9), type: 'noteOff', note: noteNum });
    });
  });

  events.sort((a, b) => a.tick - b.tick || (a.type === 'noteOff' ? -1 : 1));

  const bytes = [];
  const w32  = (v) => bytes.push((v>>24)&255,(v>>16)&255,(v>>8)&255,v&255);
  const w16  = (v) => bytes.push((v>>8)&255,v&255);
  // SMF header
  bytes.push(0x4D,0x54,0x68,0x64); w32(6); w16(0); w16(1); w16(TPQN);

  const tb = [];
  const vlq = (v, buf) => {
    const p = [v & 0x7F]; v >>= 7;
    while (v > 0) { p.push((v & 0x7F) | 0x80); v >>= 7; }
    p.reverse().forEach((b) => buf.push(b));
  };
  let cur = 0;
  events.forEach((ev) => {
    vlq(ev.tick - cur, tb); cur = ev.tick;
    if (ev.type === 'tempo') {
      tb.push(0xFF,0x51,0x03,(ev.value>>16)&255,(ev.value>>8)&255,ev.value&255);
    } else if (ev.type === 'noteOn')  { tb.push(0x99, ev.note, ev.vel); }
    else if  (ev.type === 'noteOff') { tb.push(0x89, ev.note, 0x00); }
  });
  vlq(0, tb); tb.push(0xFF,0x2F,0x00);

  bytes.push(0x4D,0x54,0x72,0x6B); w32(tb.length); tb.forEach((b) => bytes.push(b));
  return new Blob([new Uint8Array(bytes)], { type: 'audio/midi' });
}

// ────────────────────────────────────────────────────────────
//  Scheduler hook
// ────────────────────────────────────────────────────────────
function useScheduler({ isPlaying, bpm, tracks, pattern, totalSteps, stepsPerBar, stepsPerBeat, swing, loop, metro, onStep, onStop }) {
  const lookahead    = 25;
  const scheduleAhead = 0.12;

  const stepRef        = useRef(0);
  const nextNoteRef    = useRef(0);
  const timerRef       = useRef(null);
  const stoppedRef     = useRef(false);

  const tracksRef       = useRef(tracks);
  const patternRef      = useRef(pattern);
  const bpmRef          = useRef(bpm);
  const totalStepsRef   = useRef(totalSteps);
  const stepsPerBarRef  = useRef(stepsPerBar);
  const stepsPerBeatRef = useRef(stepsPerBeat);
  const swingRef        = useRef(swing);
  const loopRef         = useRef(loop);
  const metroRef        = useRef(metro);
  const onStopRef       = useRef(onStop);

  useEffect(() => { tracksRef.current       = tracks;       }, [tracks]);
  useEffect(() => { patternRef.current      = pattern;      }, [pattern]);
  useEffect(() => { bpmRef.current          = bpm;          }, [bpm]);
  useEffect(() => { totalStepsRef.current   = totalSteps;   }, [totalSteps]);
  useEffect(() => { stepsPerBarRef.current  = stepsPerBar;  }, [stepsPerBar]);
  useEffect(() => { stepsPerBeatRef.current = stepsPerBeat; }, [stepsPerBeat]);
  useEffect(() => { swingRef.current        = swing;        }, [swing]);
  useEffect(() => { loopRef.current         = loop;         }, [loop]);
  useEffect(() => { metroRef.current        = metro;        }, [metro]);
  useEffect(() => { onStopRef.current       = onStop;       }, [onStop]);

  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      stepRef.current  = 0;
      stoppedRef.current = false;
      onStep(-1);
      return;
    }

    window.DrumEngine.resume().then(() => {
      stepRef.current    = 0;
      stoppedRef.current = false;
      nextNoteRef.current = window.DrumEngine.now() + 0.05;

      timerRef.current = setInterval(() => {
        if (stoppedRef.current) return;
        const now = window.DrumEngine.now();

        while (nextNoteRef.current < now + scheduleAhead) {
          const step = stepRef.current;
          const ts   = totalStepsRef.current;

          if (!loopRef.current && step >= ts) { stoppedRef.current = true; break; }

          const bp  = bpmRef.current;
          const sb  = stepsPerBeatRef.current;
          const spb = stepsPerBarRef.current;
          const sw  = swingRef.current;
          const trks = tracksRef.current;
          const pat  = patternRef.current;
          const anySolo = trks.some((t) => t.solo);

          const secPerStep  = 60.0 / bp / sb;
          const isOff       = step % 2 === 1;
          const swingOffset = isOff ? (sw / 100) * 0.5 * secPerStep : 0;
          const noteTime    = nextNoteRef.current + swingOffset;

          // Metronome click
          if (metroRef.current) {
            const stepInBar  = step % spb;
            const isBeatStart = stepInBar % sb === 0;
            if (isBeatStart) {
              window.DrumEngine.metroClick(noteTime, stepInBar === 0);
            }
          }

          // Trigger notes
          trks.forEach((t) => {
            const v = pat[t.id]?.[step] ?? 0;
            if (!v) return;
            if (t.mute || (anySolo && !t.solo)) return;
            const vel  = (v / 127) * (t.velocity / 100);
            const gain = t.volume / 100;
            window.DrumEngine.trigger(t.voice, noteTime, vel, gain, t.pan);
          });

          const delay = (noteTime - now) * 1000;
          setTimeout(() => onStep(step), Math.max(0, delay));

          nextNoteRef.current += secPerStep;

          // Advance step
          if (!loopRef.current && step === ts - 1) {
            // schedule auto-stop after last note finishes
            const msUntilStop = (noteTime - now + secPerStep) * 1000;
            setTimeout(() => {
              stoppedRef.current = true;
              onStopRef.current();
            }, Math.max(50, msUntilStop));
            stepRef.current = ts;
          } else {
            stepRef.current = (step + 1) % ts;
          }
        }
      }, lookahead);
    });

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [isPlaying, onStep]);
}

// ────────────────────────────────────────────────────────────
//  MIDI input hook — triggers matching drum voices in real-time
// ────────────────────────────────────────────────────────────
const MIDI_NOTE_MAP = {
  36:'kick', 35:'kick',
  38:'snare', 40:'snare',
  42:'hihat', 44:'hihat',
  46:'openhat',
  39:'clap',
  37:'rim',
  41:'tom', 43:'tom', 45:'tom', 47:'tom', 48:'tom', 50:'tom',
  75:'perc', 76:'perc',
};

function useMIDIInput() {
  useEffect(() => {
    if (!navigator.requestMIDIAccess) return;
    let inputs = [];
    const handleMsg = (e) => {
      const [status, note, vel] = e.data;
      if ((status & 0xF0) === 0x90 && vel > 0) {
        const voice = MIDI_NOTE_MAP[note];
        if (voice && window.DrumEngine) {
          window.DrumEngine.resume().then(() => {
            window.DrumEngine.trigger(voice, window.DrumEngine.now(), vel / 127, 1, 0);
          });
        }
      }
    };
    navigator.requestMIDIAccess({ sysex: false })
      .then((access) => {
        const attach = (input) => { input.onmidimessage = handleMsg; inputs.push(input); };
        access.inputs.forEach(attach);
        access.onstatechange = (e) => {
          if (e.port.type === 'input' && e.port.state === 'connected') attach(e.port);
        };
      })
      .catch(() => {}); // MIDI unavailable — silent fallback
    return () => inputs.forEach((inp) => { inp.onmidimessage = null; });
  }, []);
}

// ────────────────────────────────────────────────────────────
//  Pattern Bank localStorage helpers
// ────────────────────────────────────────────────────────────
const SLOT_LETTERS = ['A', 'B', 'C', 'D'];
function slotKey(letter) { return `fdaw_slot_${letter}`; }
function loadSlotMeta() {
  const meta = {};
  SLOT_LETTERS.forEach((l) => {
    try {
      const raw = localStorage.getItem(slotKey(l));
      meta[l] = raw ? JSON.parse(raw).name || `Slot ${l}` : null;
    } catch { meta[l] = null; }
  });
  return meta;
}

// ────────────────────────────────────────────────────────────
//  App
// ────────────────────────────────────────────────────────────
function App() {
  const [tracks,      setTracks]      = useState(DEFAULT_TRACKS);
  const [bpm,         setBpm]         = useState(() => {
    const saved = sessionStorage.getItem('globalTempo');
    return saved ? Math.min(300, Math.max(1, parseInt(saved, 10))) : 128;
  });
  const [signature,   setSignature]   = useState("4/4");
  const [stepsPerBar, setStepsPerBar] = useState(16);
  const [bars,        setBars]        = useState(1);
  const [swing,       setSwing]       = useState(0);
  const [quantize,    setQuantize]    = useState(true);
  const [pattern,     setPattern]     = useState(() => defaultPattern(DEFAULT_TRACKS));
  const [isPlaying,   setIsPlaying]   = useState(false);
  const [playStep,    setPlayStep]     = useState(-1);
  const [recording,   setRecording]   = useState(false);
  const [loop,        setLoop]        = useState(true);
  const [metro,       setMetro]       = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState(DEFAULT_TRACKS[0].id);
  const [levels,      setLevels]      = useState({ peak: -60, rms: -60 });
  const [saveOpen,    setSaveOpen]    = useState(false);
  const [exportOpen,  setExportOpen]  = useState(false);
  const [exportFmt,   setExportFmt]   = useState('WAV');
  const [exportBusy,  setExportBusy]  = useState(false);
  const [savedName,   setSavedName]   = useState("Neon Nights Beat");
  const [savedToast,  setSavedToast]  = useState(null);
  const [position,    setPosition]    = useState({ bar: 1, beat: 1, step: 1 });
  // Pattern Bank
  const [activeSlot,  setActiveSlot]  = useState(null);
  const [slotMeta,    setSlotMeta]    = useState(() => loadSlotMeta());
  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [notifOpen,     setNotifOpen]     = useState(false);

  const totalSteps  = stepsPerBar * bars;
  const beats       = beatsPerBar(signature);
  const stepsPerBeat = Math.max(1, Math.round(stepsPerBar / beats));
  const cellGap     = totalSteps <= 16 ? 6 : totalSteps <= 32 ? 4 : 3;
  const minCellPx   = 40;
  const padRowRefs = useRef([]);
  const [rowHeights, setRowHeights] = useState([]);

  useLayoutEffect(() => {
    const update = () => {
      setRowHeights(padRowRefs.current.map(r => r ? r.offsetHeight : 0));
    };
    update();
    const ro = new ResizeObserver(update);
    padRowRefs.current.forEach(r => r && ro.observe(r));
    return () => ro.disconnect();
  }, [tracks.length, totalSteps]);

  const addNotif = useCallback((message, icon = 'check_circle') => {
    const time = new Date().toLocaleTimeString();
    setNotifications((prev) => [{ message, icon, time }, ...prev].slice(0, 30));
  }, []);

  const showToast = useCallback((msg, ms = 2000) => {
    setSavedToast(msg);
    setTimeout(() => setSavedToast(null), ms);
  }, []);

  // Resize pattern when totalSteps changes
  useEffect(() => {
    setPattern((p) => {
      const next = {};
      Object.keys(p).forEach((id) => { next[id] = resizeSteps(p[id], totalSteps); });
      return next;
    });
  }, [totalSteps]);

  // Levels poll
  useEffect(() => {
    const id = setInterval(() => {
      if (window.DrumEngine) setLevels(window.DrumEngine.getLevels());
    }, 80);
    return () => clearInterval(id);
  }, []);

  // Position display
  useEffect(() => {
    if (playStep < 0) return;
    const stepInBar = playStep % stepsPerBar;
    setPosition({
      bar:  Math.floor(playStep / stepsPerBar) + 1,
      beat: Math.floor(stepInBar / stepsPerBeat) + 1,
      step: (stepInBar % stepsPerBeat) + 1,
    });
  }, [playStep, stepsPerBar, stepsPerBeat]);

  const togglePlay = useCallback(() => setIsPlaying((p) => !p), []);
  const stopPlay   = useCallback(() => setIsPlaying(false), []);

  useScheduler({
    isPlaying, bpm, tracks, pattern, totalSteps, stepsPerBar, stepsPerBeat, swing, loop, metro,
    onStep: setPlayStep,
    onStop: stopPlay,
  });

  useMIDIInput();

  const selectedTrack = tracks.find((t) => t.id === selectedTrackId);

  // ── Track actions ─────────────────────────────────────────
  const handleStepToggle = (trackId, step) => {
    setPattern((p) => {
      const cur  = p[trackId] || new Array(totalSteps).fill(0);
      const next = cur.slice();
      next[step] = next[step] > 0 ? 0 : 110;
      return { ...p, [trackId]: next };
    });
    const t = tracks.find((x) => x.id === trackId);
    if (t && (pattern[trackId]?.[step] || 0) === 0) {
      window.DrumEngine?.resume().then(() => {
        window.DrumEngine.trigger(t.voice, window.DrumEngine.now(), 1, t.volume / 100, t.pan);
      });
    }
  };

  const handleSetVelocity = (trackId, step, v) => {
    setPattern((p) => {
      const cur  = p[trackId] || new Array(totalSteps).fill(0);
      const next = cur.slice();
      next[step] = v;
      return { ...p, [trackId]: next };
    });
  };

  const updateTrack = (id, patch) =>
    setTracks((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  const removeTrack = (id) => {
    setTracks((ts) => ts.filter((t) => t.id !== id));
    setPattern((p) => { const { [id]: _, ...rest } = p; return rest; });
  };

  const addTrack = (cat) => {
    const newT = makeTrack(cat.voice, { volume: 70 });
    setTracks((ts) => [...ts, newT]);
    setPattern((p) => ({ ...p, [newT.id]: new Array(totalSteps).fill(0) }));
    setSelectedTrackId(newT.id);
  };

  const newPattern = () => {
    setPattern(Object.fromEntries(tracks.map((t) => [t.id, new Array(totalSteps).fill(0)])));
    setSelectedTrackId(tracks[0]?.id);
    setActiveSlot(null);
    showToast("Cleared to blank pattern");
  };

  // ── Pattern Bank ──────────────────────────────────────────
  const saveToSlot = (letter) => {
    const data = { name: savedName, tracks, pattern, bpm, stepsPerBar, bars, signature, swing };
    localStorage.setItem(slotKey(letter), JSON.stringify(data));
    setActiveSlot(letter);
    setSlotMeta((m) => ({ ...m, [letter]: savedName }));
    showToast(`Saved to Slot ${letter}`);
    addNotif(`Pattern saved to Slot ${letter}`, 'save');
  };

  const loadFromSlot = (letter) => {
    try {
      const raw = localStorage.getItem(slotKey(letter));
      if (!raw) { saveToSlot(letter); return; }
      const data = JSON.parse(raw);
      setTracks(data.tracks || DEFAULT_TRACKS);
      setPattern(data.pattern || {});
      setBpm(data.bpm || 128);
      setStepsPerBar(data.stepsPerBar || 16);
      setBars(data.bars || 1);
      setSignature(data.signature || '4/4');
      setSwing(data.swing || 0);
      setSavedName(data.name || 'Unnamed');
      setSelectedTrackId(data.tracks?.[0]?.id || null);
      setActiveSlot(letter);
      showToast(`Loaded Slot ${letter} — ${data.name}`);
    } catch { showToast('Failed to load slot'); }
  };

  // ── Save to Library ───────────────────────────────────────
  const savePattern = () => {
    try {
      const libs = JSON.parse(localStorage.getItem('fdaw_library') || '[]');
      libs.unshift({ id: Date.now(), name: savedName, tracks, pattern, bpm, stepsPerBar, bars, signature, swing, savedAt: new Date().toISOString() });
      if (libs.length > 50) libs.length = 50;
      localStorage.setItem('fdaw_library', JSON.stringify(libs));
      setSaveOpen(false);
      showToast(`Saved "${savedName}" to Library`);
      addNotif(`"${savedName}" saved to Library`, 'library_music');
    } catch { showToast('Save failed — storage may be full'); }
  };

  // ── Export ────────────────────────────────────────────────
  const handleExportWav = async () => {
    setExportBusy(true);
    showToast("Rendering WAV…", 60000);
    try {
      const buf = await window.DrumEngine.renderToBuffer(tracks, pattern, totalSteps, bpm, stepsPerBeat, swing);
      const blob = audioBufferToWav(buf);
      downloadBlob(blob, `${savedName}.wav`);
      showToast("WAV exported");
      addNotif(`WAV exported: ${savedName}.wav`, 'audio_file');
    } catch (e) { showToast(`WAV export failed: ${e.message}`); }
    setExportBusy(false);
  };

  const handleExportMidi = () => {
    const blob = patternToMidi(tracks, pattern, totalSteps, bpm, stepsPerBeat);
    downloadBlob(blob, `${savedName}.mid`);
    showToast("MIDI exported");
    addNotif(`MIDI exported: ${savedName}.mid`, 'piano');
  };

  const handleExportStems = async () => {
    if (!window.JSZip) { showToast("JSZip not loaded — stems unavailable"); return; }
    setExportBusy(true);
    showToast("Rendering stems…", 60000);
    try {
      const zip = new window.JSZip();
      const activeTracks = tracks.filter((t) => !t.mute);
      for (const track of activeTracks) {
        const buf  = await window.DrumEngine.renderTrackToBuffer(track, pattern, totalSteps, bpm, stepsPerBeat, swing);
        const wav  = audioBufferToWav(buf);
        const ab   = await wav.arrayBuffer();
        zip.file(`${track.name}.wav`, ab);
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(blob, `${savedName}_stems.zip`);
      showToast("Stems exported");
      addNotif(`Stems ZIP exported: ${activeTracks.length} tracks`, 'folder_zip');
    } catch (e) { showToast(`Stems export failed: ${e.message}`); }
    setExportBusy(false);
  };

  const handleExportFpatt = () => {
    const data = { version: 1, name: savedName, tracks, pattern, bpm, stepsPerBar, bars, signature, swing, quantize };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `${savedName}.fpatt`);
    showToast(".fpatt exported");
    addNotif(`Pattern file exported: ${savedName}.fpatt`, 'description');
  };

  const handleRender = () => {
    setExportOpen(false);
    if (exportFmt === 'WAV')               handleExportWav();
    else if (exportFmt === 'MIDI')         handleExportMidi();
    else if (exportFmt === 'Stems')        handleExportStems();
    else if (exportFmt === 'Focustone Pattern') handleExportFpatt();
  };

  // ── Keyboard shortcuts ────────────────────────────────────
  useEffect(() => {
    const handleKey = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      switch (e.code) {
        case 'Space':    e.preventDefault(); setIsPlaying((p) => !p); break;
        case 'Escape':   stopPlay(); break;
        case 'KeyR':     setRecording((r) => !r); break;
        case 'KeyL':     setLoop((l) => !l); break;
        case 'KeyM':
          if (selectedTrackId) updateTrack(selectedTrackId, { mute: !selectedTrack?.mute });
          break;
        case 'KeyS':
          if (selectedTrackId) updateTrack(selectedTrackId, { solo: !selectedTrack?.solo });
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedTrackId((id) => {
            const idx = tracks.findIndex((t) => t.id === id);
            return tracks[Math.max(0, idx - 1)]?.id ?? id;
          });
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedTrackId((id) => {
            const idx = tracks.findIndex((t) => t.id === id);
            return tracks[Math.min(tracks.length - 1, idx + 1)]?.id ?? id;
          });
          break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [tracks, selectedTrackId, selectedTrack, stopPlay]);

  const anySolo = tracks.some((t) => t.solo);

  return (
    <div className="h-screen w-screen flex flex-col bg-surface-dim text-on-surface overflow-hidden">
      <div aria-hidden className="fixed inset-0 pointer-events-none"
        style={{ background: "radial-gradient(1200px 600px at 20% 0%,rgba(0,240,255,.06),transparent 55%),radial-gradient(900px 500px at 90% 90%,rgba(167,255,179,.05),transparent 55%)" }}
      />

      <TopBar
        onExport={() => setExportOpen(true)}
        notifications={notifications}
        notifOpen={notifOpen}
        onNotifToggle={() => setNotifOpen((o) => !o)}
        onNotifClose={() => setNotifOpen(false)}
      />

      <div className="flex flex-1 overflow-hidden relative">
        <SideNav bpm={bpm} signature={signature} onNewPattern={newPattern} />

        <main className="flex-1 overflow-y-auto p-6 pb-3">
          <PageHeader bpm={bpm} setBpm={setBpm} signature={signature} onPreview={togglePlay} isPlaying={isPlaying} stepsPerBar={stepsPerBar} bars={bars} />

          <div className="grid grid-cols-12 gap-5">
            {/* Sequencer */}
            <div className="col-span-12 xl:col-span-9 relative">
              <div className="rounded-2xl border border-white/5 p-5 relative"
                style={{ background: "linear-gradient(160deg,rgba(32,31,33,.85) 0%,rgba(14,14,16,.85) 100%)" }}>
                <div className="absolute inset-0 pointer-events-none opacity-[0.12] rounded-2xl"
                  style={{ backgroundImage: "radial-gradient(#3b494b 1px,transparent 1px)", backgroundSize: "32px 32px" }}
                />
                <div className="relative">
                  {/* 악기·패드 편집 영역 — 가로 스크롤 */}
                  <div className="overflow-x-auto pb-1">
                  <div className="flex items-stretch mb-1 pr-2" style={{ minWidth: `${280 + totalSteps * minCellPx + (totalSteps - 1) * cellGap}px` }}>
                    <div className="w-[272px] shrink-0" style={{ background: "linear-gradient(160deg,rgba(32,31,33,.95) 0%,rgba(14,14,16,.95) 100%)" }} />
                    <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${bars}, minmax(${minCellPx * stepsPerBar + (stepsPerBar - 1) * cellGap}px, 1fr))`, gap: cellGap }}>
                      {Array.from({ length: bars }).map((_, i) => {
                        const isCurrentBar = isPlaying && Math.floor(playStep / stepsPerBar) === i;
                        return (
                          <div key={i} className="rounded px-1.5 py-0.5 text-center"
                            style={{
                              background: isCurrentBar ? "rgba(0,240,255,.12)" : "rgba(255,255,255,.03)",
                              border: `1px solid ${isCurrentBar ? "rgba(0,240,255,.35)" : "rgba(255,255,255,.05)"}`,
                              boxShadow: isCurrentBar ? "0 0 8px rgba(0,240,255,.2)" : "none",
                            }}>
                            <span className="font-mono-data text-[9px] tracking-widest uppercase"
                              style={{ color: isCurrentBar ? "#7df4ff" : "#52525b" }}>
                              {i + 1}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <StepMarkers playStep={isPlaying ? playStep : -1} totalSteps={totalSteps} stepsPerBeat={stepsPerBeat} stepsPerBar={stepsPerBar} gap={cellGap} minCellPx={minCellPx} />
                  <div className="mt-2 space-y-0.5 relative" style={{ minWidth: `${280 + totalSteps * minCellPx + (totalSteps - 1) * cellGap}px` }}>
                    {/* Playhead overlay */}
                    {isPlaying && playStep >= 0 && (
                      <div className="absolute inset-0 pointer-events-none flex items-stretch gap-3 px-2 z-10">
                        <div className="w-[252px] shrink-0" />
                        <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${totalSteps},minmax(${minCellPx}px,1fr))`, gap: cellGap }}>
                          {Array.from({ length: totalSteps }).map((_, i) => (
                            <div key={i} className="relative">
                              {i === playStep && (
                                <>
                                  <div className="absolute inset-0 rounded-md" style={{ background: "linear-gradient(to bottom,rgba(0,240,255,.18),rgba(0,240,255,.06))", border: "1px solid rgba(0,240,255,.35)", boxShadow: "0 0 30px rgba(0,240,255,.35),inset 0 0 18px rgba(0,240,255,.15)" }} />
                                  <div className="absolute left-1/2 -translate-x-1/2 -top-6 w-2.5 h-2.5 rotate-45" style={{ background: "#00f0ff", boxShadow: "0 0 12px #00f0ff" }} />
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {tracks.map((t, index) => (
                      <div key={t.id} ref={(el) => padRowRefs.current[index] = el} className={`group ${selectedTrackId === t.id ? "ring-1 ring-white/5 rounded-lg" : ""}`}>
                        <TrackRow
                          track={t}
                          steps={pattern[t.id] || new Array(totalSteps).fill(0)}
                          playStep={isPlaying ? playStep : -1}
                          isPlaying={isPlaying}
                          selected={selectedTrackId === t.id}
                          onSelect={() => setSelectedTrackId(t.id)}
                          onToggleStep={(i) => handleStepToggle(t.id, i)}
                          onSetVelocity={(i, v) => handleSetVelocity(t.id, i, v)}
                          onMute={() => updateTrack(t.id, { mute: !t.mute })}
                          onSolo={() => updateTrack(t.id, { solo: !t.solo })}
                          onVolume={(v) => updateTrack(t.id, { volume: v })}
                          onRemove={() => removeTrack(t.id)}
                          anySolo={anySolo}
                          totalSteps={totalSteps}
                          stepsPerBeat={stepsPerBeat}
                          stepsPerBar={stepsPerBar}
                          gap={cellGap}
                          minCellPx={minCellPx}
                        />
                      </div>
                    ))}
                  </div>
                  </div>{/* /overflow-x scroll */}

                  {/* 레이블 고정 오버레이 — 스크롤 컨테이너 위에 absolute 배치 */}
                  <div className="absolute top-0 left-0 z-20"
                    style={{ width: '272px', background: 'linear-gradient(160deg,rgba(20,19,22,1) 0%,rgba(12,12,14,1) 100%)' }}>
                    {/* BAR ruler 높이 맞춤 spacer */}
                    <div className="flex items-stretch mb-1" style={{ visibility: 'hidden' }}>
                      <div className="rounded px-1.5 py-0.5 text-[9px]">0</div>
                    </div>
                    {/* StepMarkers 높이 맞춤 spacer (h-7 = 28px) */}
                    <div style={{ height: '28px' }} />
                    {/* 트랙 레이블 */}
                    <div className="mt-2 space-y-0.5">
                      {tracks.map((t, index) => (
                        <div key={t.id} className="group" style={{ height: rowHeights[index] ? `${rowHeights[index]}px` : 'auto' }}>
                          <TrackRow
                            track={t}
                            steps={pattern[t.id] || new Array(totalSteps).fill(0)}
                            playStep={isPlaying ? playStep : -1}
                            isPlaying={isPlaying}
                            selected={selectedTrackId === t.id}
                            onSelect={() => setSelectedTrackId(t.id)}
                            onToggleStep={(i) => handleStepToggle(t.id, i)}
                            onSetVelocity={(i, v) => handleSetVelocity(t.id, i, v)}
                            onMute={() => updateTrack(t.id, { mute: !t.mute })}
                            onSolo={() => updateTrack(t.id, { solo: !t.solo })}
                            onVolume={(v) => updateTrack(t.id, { volume: v })}
                            onRemove={() => removeTrack(t.id)}
                            anySolo={anySolo}
                            totalSteps={totalSteps}
                            stepsPerBeat={stepsPerBeat}
                            stepsPerBar={stepsPerBar}
                            gap={cellGap}
                            minCellPx={minCellPx}
                            labelOnly={true}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <AddInstrument onAdd={addTrack} existingVoices={tracks.map((t) => t.voice)} />
                  <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between font-mono-data text-[11px] text-zinc-500">
                    <span className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] text-zinc-400">Click</kbd>toggle step</span>
                      <span className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] text-zinc-400">Right-click</kbd>cycle velocity</span>
                      <span className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] text-zinc-400">Space</kbd>play/pause</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Icon name="bolt" size={14} className="text-cyan-400" />
                      {tracks.length} tracks · {Object.values(pattern).flat().filter((v) => v > 0).length} hits · {totalSteps} steps
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex gap-3">
                <MeterBar label="Peak" db={levels.peak} color="#00f0ff" />
                <MeterBar label="RMS"  db={levels.rms}  color="#a7ffb3" />
                <MasterCard />
              </div>
            </div>

            {/* Right column */}
            <div className="col-span-12 xl:col-span-3 space-y-4">
              <ChannelInspector track={selectedTrack} onChange={(patch) => updateTrack(selectedTrack.id, patch)} />
              <SequencerSettings
                stepsPerBar={stepsPerBar} setStepsPerBar={setStepsPerBar}
                bars={bars}               setBars={setBars}
                signature={signature}     setSignature={setSignature}
                swing={swing}             setSwing={setSwing}
                quantize={quantize}       setQuantize={setQuantize}
              />

              {/* Pattern Bank */}
              <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 border border-white/5 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-[14px] font-medium text-zinc-100">Pattern Bank</h3>
                  <button onClick={() => setSaveOpen(true)}
                    className="font-label-caps text-[10px] tracking-widest uppercase text-cyan-300 hover:text-cyan-200 flex items-center gap-1">
                    <Icon name="save" size={14} /> Save
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {SLOT_LETTERS.map((letter) => {
                    const isActive  = activeSlot === letter;
                    const hasSaved  = slotMeta[letter] !== null;
                    return (
                      <button
                        key={letter}
                        onClick={() => loadFromSlot(letter)}
                        title={hasSaved ? `Load: ${slotMeta[letter]}` : `Save to Slot ${letter}`}
                        className="aspect-square rounded-lg border font-display font-semibold text-[15px] transition-all flex flex-col items-center justify-center gap-0.5"
                        style={{
                          background: isActive ? "rgba(0,240,255,.1)"  : "rgba(255,255,255,.02)",
                          borderColor: isActive ? "rgba(0,240,255,.4)" : "rgba(255,255,255,.05)",
                          color: isActive ? "#7df4ff" : hasSaved ? "#a1a1aa" : "#3f3f46",
                          boxShadow: isActive ? "0 0 14px rgba(0,240,255,.18)" : "none",
                        }}
                      >
                        {letter}
                        {hasSaved && !isActive && <span className="w-1 h-1 rounded-full bg-zinc-500" />}
                        {!hasSaved && <span className="text-[9px] text-zinc-700 font-normal">empty</span>}
                      </button>
                    );
                  })}
                </div>
                {activeSlot && (
                  <p className="font-mono-data text-[10px] text-zinc-600 mt-3">
                    Slot {activeSlot} · {slotMeta[activeSlot] || savedName}
                  </p>
                )}
                {activeSlot && (
                  <button onClick={() => saveToSlot(activeSlot)}
                    className="mt-2 w-full font-label-caps text-[10px] tracking-widest uppercase text-zinc-500 hover:text-cyan-300 transition py-1.5 rounded-lg border border-white/5 hover:border-cyan-400/20">
                    Update Slot {activeSlot}
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      <TransportBar
        isPlaying={isPlaying} onPlay={togglePlay} onStop={stopPlay}
        recording={recording} onRecord={() => setRecording((r) => !r)}
        loop={loop}   onLoop={() => setLoop((l) => !l)}
        metro={metro} onMetro={() => setMetro((m) => !m)}
        position={position} bpm={bpm}
      />

      {/* Save modal */}
      <Modal open={saveOpen} onClose={() => setSaveOpen(false)} title="Save Pattern"
        footer={<>
          <button onClick={() => setSaveOpen(false)} className="px-4 py-2 rounded-lg font-label-caps text-[11px] tracking-widest uppercase text-zinc-400 hover:bg-white/5 transition">Cancel</button>
          <button onClick={savePattern} className="px-5 py-2 rounded-lg font-label-caps text-[11px] tracking-widest uppercase text-[#003035] font-bold" style={{ background: "linear-gradient(135deg,#7df4ff,#00dbe9)", boxShadow: "0 0 16px rgba(0,240,255,.3)" }}>Save to Library</button>
        </>}>
        <label className="block font-label-caps text-[10px] tracking-widest uppercase text-zinc-500 mb-2">Pattern Name</label>
        <input type="text" value={savedName} onChange={(e) => setSavedName(e.target.value)}
          className="w-full bg-zinc-950/60 border border-white/10 rounded-lg px-3 py-2.5 font-display text-zinc-100 outline-none focus:border-cyan-400/40 transition" />
        <p className="text-[12px] text-zinc-500 mt-3">{tracks.length} tracks · {Object.values(pattern).flat().filter((v) => v > 0).length} hits · {bpm.toFixed(1)} BPM · {totalSteps} steps</p>
      </Modal>

      {/* Export modal */}
      <Modal open={exportOpen} onClose={() => setExportOpen(false)} title="Export Pattern"
        footer={<>
          <button onClick={() => setExportOpen(false)} className="px-4 py-2 rounded-lg font-label-caps text-[11px] tracking-widest uppercase text-zinc-400 hover:bg-white/5 transition">Cancel</button>
          <button onClick={handleRender} disabled={exportBusy}
            className="px-5 py-2 rounded-lg font-label-caps text-[11px] tracking-widest uppercase text-[#003915] font-bold disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#a7ffb3,#00ee70)", boxShadow: "0 0 16px rgba(0,238,112,.3)" }}>
            {exportBusy ? "Rendering…" : "Render"}
          </button>
        </>}>
        <div className="space-y-3">
          {[
            { fmt: 'WAV',                desc: '24-bit / 48 kHz · stereo bounce', recommend: true },
            { fmt: 'MIDI',               desc: 'Standard MIDI File · GM drum map (ch 10)' },
            { fmt: 'Stems',              desc: 'Per-track WAV stems · zipped' },
            { fmt: 'Focustone Pattern',  desc: '.fpatt · re-importable into Focustone DAW' },
          ].map((opt) => (
            <label key={opt.fmt}
              className="flex items-center gap-3 p-3 rounded-lg border border-white/5 bg-zinc-950/40 hover:border-cyan-400/30 hover:bg-cyan-400/5 transition cursor-pointer"
              style={exportFmt === opt.fmt ? { borderColor: "rgba(0,240,255,.35)", background: "rgba(0,240,255,.05)" } : {}}>
              <input type="radio" name="fmt" value={opt.fmt} checked={exportFmt === opt.fmt} onChange={() => setExportFmt(opt.fmt)} className="accent-cyan-400" />
              <div className="flex-1">
                <p className="font-display text-[14px] text-zinc-100">{opt.fmt}</p>
                <p className="font-mono-data text-[11px] text-zinc-500">{opt.desc}</p>
              </div>
              {opt.recommend && <span className="font-label-caps text-[9px] tracking-widest uppercase text-cyan-300 bg-cyan-400/10 px-2 py-1 rounded">Recommended</span>}
            </label>
          ))}
        </div>
      </Modal>

      {/* Toast */}
      {savedToast && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[120] px-5 py-2.5 rounded-full font-label-caps text-[11px] tracking-widest uppercase text-cyan-100 border border-cyan-400/30"
          style={{ background: "rgba(0,240,255,.08)", backdropFilter: "blur(20px)", boxShadow: "0 8px 30px rgba(0,0,0,.4),0 0 16px rgba(0,240,255,.2)" }}>
          {savedToast}
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);

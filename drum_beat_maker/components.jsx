// Focustone DAW Beat Maker — UI components

const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ────────────────────────────────────────────────────────────
//  Icon helper
// ────────────────────────────────────────────────────────────
function Icon({ name, fill = 0, size, className = "", style = {} }) {
  const s = {
    fontVariationSettings: `'FILL' ${fill}, 'wght' 500, 'GRAD' 0, 'opsz' 24`,
    fontSize: size ? `${size}px` : undefined,
    ...style,
  };
  return (
    <span className={`material-symbols-outlined ${className}`} style={s}>
      {name}
    </span>
  );
}

// ────────────────────────────────────────────────────────────
//  Top App Bar
// ────────────────────────────────────────────────────────────
function TopBar({ onExport, notifications = [], notifOpen, onNotifToggle, onNotifClose }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!notifOpen) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onNotifClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [notifOpen, onNotifClose]);

  return (
    <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-8 bg-surface-dim/80 backdrop-blur-md sticky top-0 z-50 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ background: "linear-gradient(135deg,#22d3ee 0%,#9333ea 100%)", boxShadow: "0 0 20px rgba(0,240,255,0.3)" }}>
          <span className="material-symbols-outlined text-zinc-950"
            style={{ fontVariationSettings: "'FILL' 1,'wght' 700", fontSize: "22px" }}>equalizer</span>
        </div>
        <h1 className="font-display text-xl tracking-tighter italic text-zinc-100 flex items-baseline gap-1">
          Focustone <span className="text-cyan-400">DAW</span>
          <span className="text-zinc-500 text-xs not-italic ml-1">v0.9.0</span>
        </h1>
      </div>

      {/* Nav */}
      <nav className="hidden md:flex items-center gap-8 font-display tracking-tight">
        <a className="text-zinc-500 hover:text-zinc-300 transition-colors" href="../upload_dashboard/main-code-v6.html">Studio</a>
        <a className="text-zinc-500 hover:text-zinc-300 transition-colors" href="../bpm_analysis/bpm-analyzer-code2.html">BPM Analyzer</a>
        <a className="text-cyan-400 border-b-2 border-cyan-400 pb-1 cursor-default" href="#" onClick={(e) => e.preventDefault()}>Beat Maker</a>
      </nav>

      {/* Right */}
      <div className="flex items-center gap-4 relative" ref={panelRef}>
        {/* Notifications bell */}
        <button onClick={onNotifToggle}
          className="p-2 text-zinc-400 hover:text-cyan-400 transition-colors rounded-full relative">
          <span className="material-symbols-outlined"
            style={{ fontVariationSettings: notifOpen ? "'FILL' 1,'wght' 500" : "'FILL' 0,'wght' 500" }}>
            notifications
          </span>
          {notifications.length > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400"
              style={{ boxShadow: "0 0 6px #00f0ff" }} />
          )}
        </button>

        {/* Notifications panel */}
        {notifOpen && (
          <div className="absolute top-12 right-0 z-[200] w-80 rounded-2xl border border-white/10 bg-zinc-950/95 backdrop-blur-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/5">
              <h4 className="font-display text-[14px] font-medium text-zinc-100">Notifications</h4>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <button onClick={() => { /* clear handled in app */ }}
                    className="font-label-caps text-[9px] tracking-widest uppercase text-zinc-600 hover:text-zinc-400 transition">
                    {notifications.length} new
                  </button>
                )}
                <button onClick={onNotifClose} className="text-zinc-500 hover:text-zinc-200 transition">
                  <Icon name="close" size={16} />
                </button>
              </div>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="font-mono-data text-[11px] text-zinc-600 text-center py-6">No notifications yet</p>
              ) : (
                <div className="p-2 space-y-1">
                  {notifications.map((n, i) => (
                    <div key={i} className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/[0.03] transition">
                      <Icon name={n.icon || 'info'} size={14} className="text-cyan-400 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-display text-[13px] text-zinc-200 leading-snug">{n.message}</p>
                        <p className="font-mono-data text-[10px] text-zinc-600 mt-0.5">{n.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <button onClick={onExport}
          className="font-label-caps text-[11px] tracking-widest uppercase px-4 py-2 rounded-lg active:scale-95 duration-150 transition-all font-bold"
          style={{ background: "linear-gradient(135deg,#7df4ff 0%,#00f0ff 60%,#00dbe9 100%)", boxShadow: "0 0 16px rgba(0,240,255,.35),inset 0 1px 0 rgba(255,255,255,.5)", color: "#003035" }}>
          Export
        </button>
      </div>
    </header>
  );
}

// ────────────────────────────────────────────────────────────
//  Side Nav
// ────────────────────────────────────────────────────────────
function SideNav({ bpm, signature, onNewPattern }) {
  return (
    <aside className="bg-zinc-950/60 backdrop-blur-md w-[240px] shrink-0 border-r border-zinc-800 flex flex-col py-5 z-40">
      <div className="px-6 mb-7">
        <p className="font-display text-[10px] uppercase tracking-[0.18em] text-zinc-500 mb-1.5">Studio Session</p>
        <p className="font-mono-data text-cyan-300 text-[15px]">{Math.round(bpm)} BPM · {signature}</p>
      </div>
      <nav className="flex-1 space-y-1">
        {/* Beat Maker — 현재 페이지(active) */}
        <div className="flex items-center gap-3.5 px-6 py-3 font-display text-[11px] uppercase tracking-[0.18em] text-cyan-300 border-l-2 border-cyan-400 relative cursor-default">
          <span className="absolute inset-0 bg-gradient-to-r from-cyan-400/15 to-transparent pointer-events-none" />
          <Icon name="grid_view" fill={1} size={20} />
          Beat Maker
        </div>
        <div className="flex items-center gap-3.5 px-6 py-3 font-display text-[11px] uppercase tracking-[0.18em] text-zinc-500 cursor-default">
          <Icon name="speed" size={20} />
          BPM Analysis
        </div>
        <div className="flex items-center gap-3.5 px-6 py-3 font-display text-[11px] uppercase tracking-[0.18em] text-zinc-500 cursor-default">
          <Icon name="library_music" size={20} />
          Studio
        </div>
        <div className="flex items-center gap-3.5 px-6 py-3 font-display text-[11px] uppercase tracking-[0.18em] text-zinc-500 cursor-default">
          <Icon name="auto_awesome" size={20} />
          Focustone AI
        </div>
      </nav>
      <div className="px-4 mt-auto mb-3">
        <button
          onClick={onNewPattern}
          className="w-full bg-zinc-800/60 border border-white/5 text-zinc-200 font-label-caps text-[11px] tracking-widest uppercase py-3 rounded-lg hover:bg-zinc-700/60 hover:border-cyan-400/30 transition-all flex items-center justify-center gap-2"
        >
          <Icon name="add" size={16} /> New Pattern
        </button>
      </div>
      <div className="border-t border-zinc-800 pt-3">
        <div className="flex items-center gap-3.5 px-6 py-3 font-display text-[11px] uppercase tracking-[0.18em] text-zinc-500 cursor-default">
          <Icon name="tune" size={20} /> Settings
        </div>
      </div>
    </aside>
  );
}

// ────────────────────────────────────────────────────────────
//  Header Block (Title + Tempo + Preview)
// ────────────────────────────────────────────────────────────
function PageHeader({ bpm, setBpm, signature, onPreview, isPlaying, stepsPerBar, bars }) {
  return (
    <div className="flex justify-between items-end mb-7 gap-6 flex-wrap">
      <div>
        <h1 className="font-display text-[34px] font-bold tracking-tight text-on-surface leading-none mb-3">
          Drum Beat Maker
        </h1>
        <div className="flex items-center gap-5 text-on-surface-variant font-mono-data text-[13px]">
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-300"
              style={{ boxShadow: "0 0 8px #00f0ff" }}
            />
            Beat-Sync Active
          </span>
          <span className="flex items-center gap-1.5 text-zinc-400">
            <Icon name="straighten" size={14} /> {stepsPerBar} Steps · {bars} {bars === 1 ? "Bar" : "Bars"}
          </span>
          <span className="flex items-center gap-1.5 text-zinc-400">
            <Icon name="rhythm" size={14} /> {signature}
          </span>
        </div>
      </div>

      <div className="flex gap-3 items-stretch">
        <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 px-5 py-3 rounded-2xl flex items-center gap-5 border border-white/5">
          <div className="flex flex-col">
            <span className="font-label-caps text-[10px] tracking-widest uppercase text-zinc-500 mb-0.5">Tempo</span>
            <div className="flex items-baseline gap-1.5">
              <input
                type="number"
                value={Math.round(bpm)}
                step="1"
                min="1"
                max="300"
                onChange={(e) => setBpm(Math.min(300, Math.max(1, parseInt(e.target.value, 10) || 128)))}
                className="font-mono-data text-[22px] font-bold text-cyan-300 bg-transparent w-[88px] outline-none border-b border-transparent focus:border-cyan-400/40"
                style={{ textShadow: "0 0 12px rgba(0,240,255,.4)" }}
              />
              <span className="text-[10px] text-zinc-500 font-label-caps tracking-widest">BPM</span>
            </div>
          </div>
          <div className="h-9 w-px bg-white/10" />
          <button
            onClick={onPreview}
            className="font-label-caps text-[11px] tracking-widest uppercase px-4 py-2.5 rounded-lg transition-all flex items-center gap-2 border"
            style={{
              background: isPlaying
                ? "linear-gradient(135deg,#a7ffb3 0%,#00ee70 100%)"
                : "rgba(0,240,255,.08)",
              borderColor: isPlaying ? "rgba(167,255,179,.3)" : "rgba(0,240,255,.25)",
              color: isPlaying ? "#003915" : "#7df4ff",
              boxShadow: isPlaying
                ? "0 0 18px rgba(0,238,112,.35)"
                : "0 0 12px rgba(0,240,255,.15)",
            }}
          >
            <Icon name={isPlaying ? "pause_circle" : "play_circle"} fill={1} size={18} />
            {isPlaying ? "Pause" : "Preview with Track"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
//  Step Markers
// ────────────────────────────────────────────────────────────
function StepMarkers({ playStep, totalSteps, stepsPerBeat, stepsPerBar, gap, minCellPx = 0 }) {
  return (
    <div className="flex items-center pr-2">
      <div className="w-[272px] shrink-0" />
      <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${totalSteps}, minmax(${minCellPx}px,1fr))`, gap }}>
        {Array.from({ length: totalSteps }).map((_, i) => {
          const stepInBar = i % stepsPerBar;
          const bar = Math.floor(i / stepsPerBar) + 1;
          const beat = Math.floor(stepInBar / stepsPerBeat) + 1;
          const isBeatStart = stepInBar % stepsPerBeat === 0;
          const isBarStart = stepInBar === 0;
          const isActive = playStep === i;
          return (
            <div key={i} className="flex flex-col items-center justify-end h-7 gap-0.5">
              {isBeatStart && (
                <span
                  className={`font-display text-[10px] font-bold tracking-widest uppercase ${
                    isActive
                      ? "text-cyan-300"
                      : isBarStart
                      ? "text-cyan-300/80"
                      : "text-cyan-400/55"
                  }`}
                  style={isActive ? { textShadow: "0 0 8px #00f0ff" } : {}}
                  title={isBarStart ? `Bar ${bar}` : `Beat ${beat}`}
                >
                  {isBarStart ? `${bar}` : beat}
                </span>
              )}
              {!isBeatStart && (
                <span
                  className={`font-mono-data text-[9px] transition-all ${
                    isActive ? "text-cyan-300" : "text-zinc-700"
                  }`}
                  style={isActive ? { textShadow: "0 0 8px #00f0ff" } : {}}
                >
                  ·
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
//  Track Row
// ────────────────────────────────────────────────────────────
function TrackRow({
  track,
  steps,
  playStep,
  isPlaying,
  selected,
  onSelect,
  onToggleStep,
  onSetVelocity,
  onMute,
  onSolo,
  onVolume,
  onRemove,
  anySolo,
  totalSteps,
  stepsPerBeat,
  stepsPerBar,
  gap,
  minCellPx = 0,
}) {
  const muted = track.mute || (anySolo && !track.solo);
  return (
    <div
      className={`flex items-center py-1.5 rounded-lg transition-all h-full w-full gap-3 px-2 ${
        selected ? "bg-white/[0.025]" : ""
      }`}
      onClick={onSelect}
    >
      {/* Track header: name + M/S + volume */}
      <div className="track-label sticky left-0 z-20 w-[252px] shrink-0 flex items-center gap-2.5 pr-2 rounded-l-lg"
        style={{ background: selected
          ? "linear-gradient(90deg,rgba(0,240,255,.10) 0%,rgba(0,240,255,.04) 100%)"
          : "linear-gradient(160deg,rgba(25,24,26,.98) 0%,rgba(14,14,16,.98) 100%)",
          boxShadow: selected ? "inset 3px 0 0 rgba(0,240,255,.5)" : "inset 3px 0 0 transparent" }}>
        <div
          className="w-1 h-9 rounded-full shrink-0"
          style={{
            background: track.color,
            boxShadow: `0 0 10px ${track.glow}`,
          }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center">
            <span className="font-display text-[13px] font-medium text-zinc-100 truncate pr-5">
              {track.name}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <button
              onClick={(e) => { e.stopPropagation(); onMute(); }}
              className={`font-label-caps text-[9px] tracking-widest uppercase w-5 h-5 rounded transition-all flex items-center justify-center ${
                track.mute
                  ? "bg-rose-500/80 text-rose-50 shadow-[0_0_8px_rgba(244,63,94,.5)]"
                  : "bg-zinc-800/60 text-zinc-500 hover:text-zinc-200"
              }`}
            >
              M
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onSolo(); }}
              className={`font-label-caps text-[9px] tracking-widest uppercase w-5 h-5 rounded transition-all flex items-center justify-center ${
                track.solo
                  ? "bg-yellow-400 text-yellow-950 shadow-[0_0_8px_rgba(250,204,21,.55)]"
                  : "bg-zinc-800/60 text-zinc-500 hover:text-zinc-200"
              }`}
            >
              S
            </button>
            <div className="flex-1 flex items-center gap-1.5 ml-1">
              <Icon name="volume_up" size={12} className="text-zinc-600" />
              <input
                type="range"
                min="0"
                max="100"
                value={track.volume}
                onChange={(e) => onVolume(parseInt(e.target.value))}
                onClick={(e) => e.stopPropagation()}
                className="vol-slider flex-1"
                style={{ "--track-color": track.color }}
              />
            </div>
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="absolute top-0 right-0 text-zinc-700 hover:text-rose-400 transition-all opacity-0 group-hover:opacity-100 p-0.5"
          title="Remove track"
        >
          <Icon name="close" size={14} />
        </button>
      </div>

      {/* Step pads */}
      <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${totalSteps}, minmax(${minCellPx}px,1fr))`, gap }}>
        {Array.from({ length: totalSteps }).map((_, i) => {
          const v = steps[i] || 0;
          const on = v > 0;
          const isHead = playStep === i && isPlaying;
          const beatGroup = Math.floor((i % stepsPerBar) / stepsPerBeat);
          const bar = Math.floor(i / stepsPerBar);
          const groupTint =
            (bar + beatGroup) % 2 === 0 ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.015)";
          const isBarStart = i % stepsPerBar === 0 && i > 0;
          return (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); onToggleStep(i); }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // adjust velocity on right-click
                const newV = v >= 110 ? 60 : v >= 80 ? 110 : v >= 40 ? 80 : v === 0 ? 110 : 40;
                onSetVelocity(i, newV);
              }}
              className="relative aspect-square rounded-md transition-all duration-100"
              style={{
                background: on
                  ? `linear-gradient(135deg, ${track.color} 0%, ${track.color}cc 100%)`
                  : groupTint,
                border: `1px solid ${
                  on ? `${track.color}88` : "rgba(255,255,255,0.06)"
                }`,
                boxShadow: on
                  ? `0 0 ${isHead ? 18 : 12}px ${track.glow}, inset 0 1px 0 rgba(255,255,255,.3)`
                  : isHead
                  ? `inset 0 0 0 1px ${track.color}66`
                  : "none",
                opacity: muted ? 0.35 : on ? Math.max(0.55, v / 127) : 1,
                transform: isHead && on ? "scale(1.08)" : "scale(1)",
              }}
            >
              {/* tiny velocity bar */}
              {on && (
                <span
                  className="absolute left-1 right-1 bottom-1 h-0.5 rounded-full"
                  style={{
                    background: "rgba(255,255,255,.7)",
                    width: `calc(${(v / 127) * 100}% - 8px)`,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
//  Add Instrument popover
// ────────────────────────────────────────────────────────────
const VOICE_CATALOG = [
  { voice: "kick", name: "Kick Drum", color: "#00f0ff" },
  { voice: "snare", name: "Snare Core", color: "#00ee70" },
  { voice: "hihat", name: "Hi-Hat Closed", color: "#d1bcff" },
  { voice: "openhat", name: "Hi-Hat Open", color: "#e9ddff" },
  { voice: "clap", name: "Clap", color: "#ffb86b" },
  { voice: "tom", name: "Low Tom", color: "#ff7ba9" },
  { voice: "perc", name: "Perc Click", color: "#7df4ff" },
  { voice: "rim", name: "Rim Shot", color: "#fde68a" },
];

function AddInstrument({ onAdd, existingVoices }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative px-2 mt-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-[252px] flex items-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-white/10 text-zinc-500 hover:text-cyan-300 hover:border-cyan-400/40 hover:bg-cyan-400/5 transition-all font-label-caps text-[11px] tracking-widest uppercase"
      >
        <Icon name="add" size={16} /> Add Instrument
      </button>
      {open && (
        <div className="absolute left-2 top-full mt-2 z-30 bg-zinc-950/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-2 w-[280px]">
          <p className="font-label-caps text-[10px] tracking-widest uppercase text-zinc-500 px-2 py-1.5">Drum Library</p>
          <div className="space-y-0.5">
            {VOICE_CATALOG.map((v) => (
              <button
                key={v.voice}
                onClick={() => { onAdd(v); setOpen(false); }}
                className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/5 transition-all text-left"
              >
                <span
                  className="w-1 h-5 rounded-full shrink-0"
                  style={{ background: v.color, boxShadow: `0 0 8px ${v.color}80` }}
                />
                <span className="font-display text-[13px] text-zinc-200 flex-1">{v.name}</span>
                <span className="font-mono-data text-[10px] text-zinc-600">{v.voice}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
//  Channel Inspector (right column)
// ────────────────────────────────────────────────────────────
function ChannelInspector({ track, onChange }) {
  if (!track) return null;
  const Slider = ({ label, value, min, max, step = 1, suffix = "", onChange, valueLabel, valueColor }) => (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="font-label-caps text-[10px] tracking-widest uppercase text-zinc-500">{label}</span>
        <span
          className="font-mono-data text-[12px]"
          style={{ color: valueColor || "#e5e1e4" }}
        >
          {valueLabel ?? value}{suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="vol-slider w-full"
        style={{ "--track-color": track.color }}
      />
    </div>
  );

  const gainDb = -24 + (track.volume / 100) * 30; // -24..+6dB
  return (
    <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 border border-white/5 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: track.color, boxShadow: `0 0 8px ${track.glow}` }}
          />
          <h3 className="font-display text-[15px] font-medium text-zinc-100">Channel Inspector</h3>
        </div>
        <span className="font-mono-data text-[10px] text-zinc-600 uppercase">{track.voice}</span>
      </div>

      <p className="font-mono-data text-[11px] text-zinc-500 mb-5">{track.name}</p>

      <div className="space-y-5">
        <Slider
          label="Gain"
          value={track.volume}
          min={0}
          max={100}
          valueLabel={gainDb.toFixed(1)}
          suffix=" dB"
          valueColor="#7df4ff"
          onChange={(v) => onChange({ volume: v })}
        />
        <Slider
          label="Velocity"
          value={track.velocity || 100}
          min={0}
          max={127}
          valueColor="#a7ffb3"
          onChange={(v) => onChange({ velocity: v })}
        />
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="font-label-caps text-[10px] tracking-widest uppercase text-zinc-500">Panning</span>
            <span className="font-mono-data text-[12px] text-zinc-300">
              {track.pan === 0 ? "Center" : `${track.pan > 0 ? "R" : "L"} ${Math.abs(track.pan * 100).toFixed(0)}`}
            </span>
          </div>
          <input
            type="range"
            min="-1"
            max="1"
            step="0.01"
            value={track.pan}
            onChange={(e) => onChange({ pan: parseFloat(e.target.value) })}
            className="vol-slider w-full"
            style={{ "--track-color": track.color }}
          />
          <div className="flex justify-between text-[9px] font-label-caps tracking-widest uppercase text-zinc-700 mt-0.5">
            <span>L</span><span>R</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
//  Seg — 세그먼트 버튼 (SequencerSettings 밖에 정의해야
//  매 렌더마다 새 함수 참조가 생겨 React가 언마운트/재마운트하는
//  문제를 방지할 수 있음)
// ────────────────────────────────────────────────────────────
function Seg({ value, current, onClick, label, sub }) {
  const active = value === current;
  return (
    <button
      onClick={() => onClick(value)}
      className="flex-1 py-2 rounded-lg transition-all relative"
      style={{
        background: active
          ? "linear-gradient(135deg, rgba(0,240,255,.15) 0%, rgba(0,240,255,.05) 100%)"
          : "rgba(255,255,255,.025)",
        border: `1px solid ${active ? "rgba(0,240,255,.4)" : "rgba(255,255,255,.05)"}`,
        boxShadow: active ? "0 0 14px rgba(0,240,255,.18), inset 0 0 8px rgba(0,240,255,.06)" : "none",
      }}
    >
      <div
        className="font-display font-bold text-[15px]"
        style={{ color: active ? "#7df4ff" : "#a1a1aa" }}
      >
        {label}
      </div>
      {sub && (
        <div
          className="font-mono-data text-[9px] tracking-widest uppercase mt-0.5"
          style={{ color: active ? "#7df4ff99" : "#52525b" }}
        >
          {sub}
        </div>
      )}
    </button>
  );
}

// ────────────────────────────────────────────────────────────
//  Sequencer Settings (replaces AI card)
// ────────────────────────────────────────────────────────────
function SequencerSettings({
  stepsPerBar,
  setStepsPerBar,
  bars,
  setBars,
  signature,
  setSignature,
  swing,
  setSwing,
  quantize,
  setQuantize,
}) {
  const totalSteps = stepsPerBar * bars;
  const noteLabel = { 4: "1/4", 8: "1/8", 16: "1/16", 32: "1/32" }[stepsPerBar] || `1/${stepsPerBar}`;

  return (
    <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 border border-white/5 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon name="tune" size={16} className="text-cyan-300" />
          <h3 className="font-display text-[14px] font-medium text-zinc-100">Sequencer Settings</h3>
        </div>
        <span className="font-mono-data text-[10px] text-zinc-600 uppercase">
          {totalSteps} steps
        </span>
      </div>

      <div className="space-y-4">
        {/* Steps per Bar */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="font-label-caps text-[10px] tracking-widest uppercase text-zinc-500">Steps / Bar</span>
            <span className="font-mono-data text-[10px] text-zinc-500">{noteLabel} notes</span>
          </div>
          <div className="flex gap-1.5">
            <Seg value={8}  current={stepsPerBar} onClick={setStepsPerBar} label="8"  sub="1/8" />
            <Seg value={16} current={stepsPerBar} onClick={setStepsPerBar} label="16" sub="1/16" />
            <Seg value={32} current={stepsPerBar} onClick={setStepsPerBar} label="32" sub="1/32" />
          </div>
        </div>

        {/* Bars */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="font-label-caps text-[10px] tracking-widest uppercase text-zinc-500">Bars</span>
            <span className="font-mono-data text-[10px] text-zinc-500">{bars} × {stepsPerBar}</span>
          </div>
          <div className="flex gap-1.5">
            <Seg value={1} current={bars} onClick={setBars} label="1" />
            <Seg value={2} current={bars} onClick={setBars} label="2" />
            <Seg value={4} current={bars} onClick={setBars} label="4" />
            <Seg value={8} current={bars} onClick={setBars} label="8" />
          </div>
        </div>

        {/* Time signature */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="font-label-caps text-[10px] tracking-widest uppercase text-zinc-500">Time Signature</span>
          </div>
          <div className="flex gap-1.5">
            {["3/4", "4/4", "6/8", "7/8"].map((sig) => (
              <Seg key={sig} value={sig} current={signature} onClick={setSignature} label={sig} />
            ))}
          </div>
        </div>

        {/* Swing */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="font-label-caps text-[10px] tracking-widest uppercase text-zinc-500">Swing</span>
            <span
              className="font-mono-data text-[12px]"
              style={{ color: swing > 0 ? "#a7ffb3" : "#a1a1aa" }}
            >
              {swing}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="50"
            value={swing}
            onChange={(e) => setSwing(parseInt(e.target.value))}
            className="vol-slider w-full"
            style={{ "--track-color": "#a7ffb3" }}
          />
        </div>

        {/* Quantize */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <span className="font-label-caps text-[10px] tracking-widest uppercase text-zinc-500">Quantize Input</span>
          <button
            onClick={() => setQuantize(!quantize)}
            className="relative w-9 h-5 rounded-full transition-all"
            style={{
              background: quantize ? "linear-gradient(135deg,#00f0ff,#00dbe9)" : "rgba(255,255,255,.08)",
              boxShadow: quantize ? "0 0 12px rgba(0,240,255,.4)" : "none",
            }}
          >
            <span
              className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
              style={{ left: quantize ? "calc(100% - 18px)" : "2px" }}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
//  AI Pattern Sync card
// ────────────────────────────────────────────────────────────
function AICard({ onApply, suggestion }) {
  return (
    <div
      className="relative rounded-2xl p-5 border overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, rgba(167,255,179,.05) 0%, rgba(0,240,255,.05) 100%)",
        borderColor: "rgba(167,255,179,.18)",
      }}
    >
      <div
        className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-20"
        style={{
          background:
            "radial-gradient(circle,#a7ffb3 0%,transparent 70%)",
        }}
      />
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <Icon name="auto_awesome" fill={1} size={18} className="text-[#a7ffb3]" />
          <h3 className="font-display text-[14px] font-semibold text-[#a7ffb3]">AI Pattern Sync</h3>
        </div>
        <p className="font-body-md text-[12.5px] text-zinc-300 leading-relaxed mb-4">
          {suggestion}
        </p>
        <button
          onClick={onApply}
          className="w-full font-label-caps text-[11px] tracking-widest uppercase py-2.5 rounded-lg transition-all active:scale-95"
          style={{
            background:
              "linear-gradient(135deg,#a7ffb3 0%,#00ee70 100%)",
            color: "#003915",
            boxShadow: "0 0 16px rgba(0,238,112,.3)",
          }}
        >
          Apply Recommendation
        </button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
//  Master meter
// ────────────────────────────────────────────────────────────
function MeterBar({ label, db, color }) {
  // map -60..+3 to 0..100%
  const pct = Math.max(0, Math.min(100, ((db + 60) / 63) * 100));
  return (
    <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 border border-white/5 rounded-2xl p-4 flex items-center gap-4 flex-1">
      <div className="relative w-2.5 h-16 bg-black/40 rounded-full overflow-hidden">
        <div
          className="absolute bottom-0 left-0 right-0 transition-all"
          style={{
            height: `${pct}%`,
            background: `linear-gradient(to top, ${color}, ${color}aa)`,
            boxShadow: `0 0 8px ${color}80`,
          }}
        />
      </div>
      <div>
        <p className="font-label-caps text-[10px] tracking-widest uppercase text-zinc-500 mb-1">{label}</p>
        <p className="font-mono-data text-[18px] text-zinc-100">
          {db.toFixed(1)} <span className="text-[10px] text-zinc-500">dB</span>
        </p>
      </div>
    </div>
  );
}

function MasterCard() {
  const [bars, setBars] = useState(new Array(32).fill(4));
  const rafRef   = useRef(null);
  const frameRef = useRef(0);

  useEffect(() => {
    const animate = () => {
      frameRef.current++;
      if (frameRef.current % 2 === 0 && window.DrumEngine) {
        const data = window.DrumEngine.getSpectrum(); // Uint8Array[512]
        const numBars = 32;
        // Use log-scaled bins: emphasise low-mid freq, compress highs
        const newBars = new Array(numBars).fill(0);
        const binCount = data.length; // 512
        for (let i = 0; i < numBars; i++) {
          const lo = Math.floor(Math.pow(i / numBars, 1.6) * binCount);
          const hi = Math.floor(Math.pow((i + 1) / numBars, 1.6) * binCount);
          let sum = 0, count = Math.max(1, hi - lo);
          for (let b = lo; b < hi; b++) sum += data[b] || 0;
          newBars[i] = Math.max(4, (sum / count / 255) * 100);
        }
        setBars(newBars);
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  return (
    <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 border border-white/5 rounded-2xl p-4 flex-[1.6] relative overflow-hidden">
      <div className="absolute inset-0 opacity-30 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at top right,rgba(0,240,255,.12),transparent 60%)" }} />
      <div className="relative flex items-center justify-between">
        <div>
          <p className="font-label-caps text-[10px] tracking-widest uppercase text-cyan-300 mb-1">Master Buss</p>
          <h4 className="font-display text-[18px] font-medium text-zinc-100">Final Mix Output</h4>
          <p className="font-mono-data text-[11px] text-zinc-500 mt-1">Live FFT · 48 kHz / 24-bit</p>
        </div>
        <div className="flex items-end gap-px h-12">
          {bars.map((pct, i) => (
            <span key={i} className="w-1 rounded-sm"
              style={{
                height: `${pct}%`,
                background: i < 8 ? "#00f0ff" : i < 22 ? "#a7ffb3" : "#ffb86b",
                opacity: 0.75,
                transition: "height 40ms linear",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
//  Btn — TransportBar 버튼 (TransportBar 밖에 정의해야
//  매 렌더마다 언마운트/재마운트되는 문제를 방지할 수 있음)
// ────────────────────────────────────────────────────────────
function Btn({ icon, label, active, onClick, color }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 px-3 group transition-all"
    >
      <span
        className="material-symbols-outlined transition-all"
        style={{
          fontVariationSettings: `'FILL' ${active ? 1 : 0}, 'wght' 500`,
          fontSize: 22,
          color: active ? color : "#71717a",
          textShadow: active ? `0 0 14px ${color}` : "none",
        }}
      >
        {icon}
      </span>
      <span
        className="font-label-caps text-[9px] tracking-widest uppercase"
        style={{ color: active ? color : "#71717a" }}
      >
        {label}
      </span>
    </button>
  );
}

// ────────────────────────────────────────────────────────────
//  Transport bar
// ────────────────────────────────────────────────────────────
function TransportBar({
  isPlaying,
  onPlay,
  onStop,
  recording,
  onRecord,
  loop,
  onLoop,
  metro,
  onMetro,
  position,
  bpm,
}) {
  return (
    <footer className="bg-zinc-950/90 backdrop-blur-xl border-t border-white/5 h-[92px] flex items-center px-6 shrink-0 z-40">
      <div className="flex-1 flex items-center gap-6">
        {/* position */}
        <div className="font-mono-data">
          <p className="font-label-caps text-[9px] tracking-widest uppercase text-zinc-600 mb-1">Position</p>
          <p className="text-[22px] text-cyan-300" style={{ textShadow: "0 0 10px rgba(0,240,255,.35)" }}>
            {position.bar}.{position.beat}.{position.step}
          </p>
        </div>
        <div className="h-10 w-px bg-white/5" />
        <div className="font-mono-data">
          <p className="font-label-caps text-[9px] tracking-widest uppercase text-zinc-600 mb-1">Tempo</p>
          <p className="text-[22px] text-zinc-200">{Math.round(bpm)}<span className="text-[10px] text-zinc-500 ml-1">BPM</span></p>
        </div>
      </div>

      {/* center transport */}
      <div className="flex items-center gap-2">
        <Btn icon="skip_previous" label="Rewind" active={false} onClick={onStop} color="#e5e1e4" />
        <Btn icon="stop" label="Stop" active={!isPlaying} onClick={onStop} color="#e5e1e4" />

        {/* Big Play button */}
        <button
          onClick={onPlay}
          className="relative mx-2 w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95 group"
          style={{
            background: isPlaying
              ? "linear-gradient(135deg,#a7ffb3 0%,#00ee70 100%)"
              : "linear-gradient(135deg,#7df4ff 0%,#00f0ff 60%,#00dbe9 100%)",
            boxShadow: isPlaying
              ? "0 0 28px rgba(0,238,112,.6), inset 0 2px 0 rgba(255,255,255,.4)"
              : "0 0 28px rgba(0,240,255,.55), inset 0 2px 0 rgba(255,255,255,.4)",
          }}
        >
          {/* outer ring pulse when playing */}
          {isPlaying && (
            <span
              className="absolute inset-0 rounded-full animate-ping"
              style={{
                background: "transparent",
                border: "2px solid rgba(0,238,112,.55)",
                animationDuration: "1.6s",
              }}
            />
          )}
          <span
            className="material-symbols-outlined relative"
            style={{
              fontVariationSettings: `'FILL' 1, 'wght' 600`,
              fontSize: 32,
              color: isPlaying ? "#003915" : "#003035",
              marginLeft: isPlaying ? 0 : 3,
            }}
          >
            {isPlaying ? "pause" : "play_arrow"}
          </span>
        </button>

        <Btn icon="fiber_manual_record" label="Record" active={recording} onClick={onRecord} color="#ff5a73" />
        <Btn icon="all_inclusive" label="Loop" active={loop} onClick={onLoop} color="#a7ffb3" />
        <Btn icon="timer" label="Metronome" active={metro} onClick={onMetro} color="#fde68a" />
      </div>

      {/* right */}
      <div className="flex-1 flex justify-end items-center gap-3">
        <span className="font-label-caps text-[10px] tracking-widest uppercase text-zinc-600">Engine</span>
        <span className="flex items-center gap-1.5 font-mono-data text-[12px] text-[#a7ffb3]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#a7ffb3]" style={{ boxShadow: "0 0 8px #a7ffb3" }} />
          Stable · 14% CPU
        </span>
      </div>
    </footer>
  );
}

// ────────────────────────────────────────────────────────────
//  Modals
// ────────────────────────────────────────────────────────────
function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <div
        className="relative w-full max-w-[480px] rounded-2xl border border-white/10 p-6"
        style={{
          background:
            "linear-gradient(135deg, rgba(32,31,33,.95) 0%, rgba(14,14,16,.95) 100%)",
          boxShadow: "0 20px 60px rgba(0,0,0,.5), 0 0 40px rgba(0,240,255,.08)",
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-[18px] font-semibold text-zinc-100">{title}</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200">
            <Icon name="close" size={20} />
          </button>
        </div>
        <div className="mb-5">{children}</div>
        {footer && <div className="flex gap-3 justify-end">{footer}</div>}
      </div>
    </div>
  );
}

Object.assign(window, {
  Icon, TopBar, SideNav, PageHeader, StepMarkers, TrackRow,
  AddInstrument, ChannelInspector, SequencerSettings, AICard,
  MeterBar, MasterCard, TransportBar, Modal, VOICE_CATALOG,
});

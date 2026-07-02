import { useEffect, useMemo, useRef, useState } from 'react';
import { COLORS, EFFECTS, fmtTime, hash, makeWaveform } from './data.js';
import { DMXStage, EffectPreview, useTick } from './effects.jsx';

export function PipelineNode({ title, tag, tinted, children, extraTitle }) {
  return (
    <div className={`node ${tinted ? "tinted" : ""}`}>
      <div className="node-hdr">
        <div className="node-title">
          <span className="dot" />{title}
          {extraTitle}
        </div>
        {tag && <div className="node-tag">{tag}</div>}
      </div>
      {children}
    </div>
  );
}

export function FlowArrow({ label }) {
  return (
    <div className="flow-arrow">
      {label && <div className="lbl">{label}</div>}
    </div>
  );
}

export function PlaybackNode({ song, songs, position, playing, speed, onSeek, onTogglePlay, onSpeedChange, onSelectSong }) {
  const scrubRef = useRef(null);
  const pct = (position / song.duration) * 100;

  const handleScrubClick = (e) => {
    const rect = scrubRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    onSeek(Math.max(0, Math.min(1, x)) * song.duration);
  };

  const speeds = [0.5, 1, 2, 5];

  return (
    <PipelineNode title="Track playback state" tag="live · what the player exposes">
      <div className="player">
        <div className="player-info">
          <div className="ttl">{song.title}</div>
          <div className="art">{song.artist}</div>
        </div>

        <div className="player-bar">
          <button className="btn-play" onClick={onTogglePlay} aria-label={playing ? "Pause" : "Play"}>
            {playing
              ? <svg width="14" height="14" viewBox="0 0 14 14"><rect x="3" y="2" width="3" height="10" /><rect x="8" y="2" width="3" height="10" /></svg>
              : <svg width="14" height="14" viewBox="0 0 14 14"><polygon points="4,2 12,7 4,12" /></svg>
            }
          </button>
          <div
            className="scrub plain"
            ref={scrubRef}
            onClick={handleScrubClick}
            onMouseMove={(e) => { if (e.buttons === 1) handleScrubClick(e); }}
          >
            <div className="scrub-progress" style={{ width: `${pct}%` }} />
            <div className="scrub-head" style={{ left: `${pct}%` }} />
          </div>
          <div className="player-times mono">
            <span className="cur">{fmtTime(position)}</span>
            <span className="sep"> / </span>
            <span className="dur">{fmtTime(song.duration)}</span>
          </div>
        </div>

        <div className="player-ctl-row">
          <div className="ctl-group">
            <span className="ctl-lbl mono">Playback speed</span>
            <div className="speed-seg">
              {speeds.map((s) => (
                <button
                  key={s}
                  className={`mono ${Math.abs(speed - s) < 0.01 ? "on" : ""}`}
                  onClick={() => onSpeedChange(s)}
                >{s}×</button>
              ))}
            </div>
          </div>

          <div className="ctl-group">
            <span className="ctl-lbl mono">Track</span>
            <div className="song-seg">
              {songs.map((s) => (
                <button
                  key={s.id}
                  className={s.id === song.id ? "on" : ""}
                  onClick={() => onSelectSong(s.id)}
                  title={`${s.title} — ${s.artist}`}
                >{s.title}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PipelineNode>
  );
}

const SECTION_COLORS = {
  INTRO:  "#e8e4dc", VERSE:  "#dad4c5", BUILD:  "#f0c89b",
  DROP:   "#f4a8a8", CHORUS: "#f4a8a8", BRIDGE: "#c9d6e8", OUTRO:  "#e8e4dc",
};

function AnalysisStrip({ song, position, waveform, showPlayhead = true, showLabels = true }) {
  const pct = position != null ? (position / song.duration) * 100 : 0;
  return (
    <div style={{ position: "relative" }}>
      <div className="analysis-strip">
        <div style={{ position: "absolute", inset: 0, display: "flex" }}>
          {song.sections.map((s, i) => {
            const w = ((s.end - s.start) / song.duration) * 100;
            return (
              <div key={i} style={{ width: `${w}%`, background: SECTION_COLORS[s.name] || "#e8e4dc", borderRight: "1px solid rgba(255,255,255,0.6)", position: "relative" }}>
                {showLabels && (
                  <>
                    <span className="mono" style={{ position: "absolute", top: 4, left: 6, fontSize: 9, color: "rgba(20,18,14,0.55)", letterSpacing: "0.05em" }}>{s.name}</span>
                    <span className="mono" style={{ position: "absolute", bottom: 4, right: 6, fontSize: 9, color: "rgba(20,18,14,0.45)" }}>
                      e={s.energy.toFixed(2)}
                    </span>
                  </>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: "40%", bottom: 0, display: "flex", alignItems: "flex-end", gap: 1, padding: "0 2px", pointerEvents: "none" }}>
          {waveform.map((v, i) => (
            <div key={i} style={{ flex: 1, height: `${Math.max(8, v * 60)}%`, background: "rgba(20,18,14,0.28)", borderRadius: 1 }} />
          ))}
        </div>
        {showPlayhead && (
          <div style={{ position: "absolute", left: `${pct}%`, top: -2, bottom: -2, width: 2, background: "var(--accent)", boxShadow: "0 0 0 3px rgba(255,45,146,0.15)", pointerEvents: "none" }} />
        )}
      </div>
    </div>
  );
}

function PlanStripContent({ plan, song, position, showPlayhead = true }) {
  const pct = position != null ? (position / song.duration) * 100 : 0;
  return (
    <div className="plan-strip">
      {plan.map((p, i) => {
        const w = ((p.section.end - p.section.start) / song.duration) * 100;
        return (
          <div key={i} className="plan-cell" style={{ width: `${w}%` }}>
            <div className="pc-preview">
              <EffectPreview effect={p.effect} size={50} />
            </div>
            <span className="pc-section mono">{p.section.name}</span>
            <span className="pc-name">{p.effect.name}</span>
          </div>
        );
      })}
      {showPlayhead && <div className="plan-head" style={{ left: `${pct}%` }} />}
    </div>
  );
}

export function SongAnalysisNode({ song, position, waveform, showPlayhead = true }) {
  return (
    <PipelineNode
      title="Song analysis"
      tag="from rekordbox DB + spotify api · cached"
    >
      <div className="analysis-meta">
        <div className="am-stat"><span className="k">BPM</span><span className="v mono">{song.bpm}</span></div>
        <div className="am-stat"><span className="k">Key</span><span className="v mono">{song.key}</span></div>
        <div className="am-stat"><span className="k">Sections</span><span className="v mono">{song.sections.length}</span></div>
        <div className="am-stat"><span className="k">Downbeats</span><span className="v mono">{Math.floor((song.duration * song.bpm) / 60 / 4)}</span></div>
      </div>

      <AnalysisStrip song={song} position={position} waveform={waveform} showPlayhead={showPlayhead} />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11, color: "var(--muted)" }} className="mono">
        <span>detect_sections(audio) → labeled segments + per-section energy</span>
        {showPlayhead
          ? <span>position: {fmtTime(position)} / {fmtTime(song.duration)}</span>
          : <span>{song.sections.length} sections · {fmtTime(song.duration)}</span>}
      </div>
    </PipelineNode>
  );
}

export function PlanWithAnalysisNode({ plan, song, position, waveform, showPlayhead = true }) {
  return (
    <PipelineNode
      title="Lights plan + song analysis"
      tag="one effect per section · sections colored by type"
    >
      <PlanStripContent plan={plan} song={song} position={position} showPlayhead={showPlayhead} />
      <div style={{ height: 2 }} />
      <AnalysisStrip song={song} position={position} waveform={waveform} showPlayhead={showPlayhead} showLabels={false} />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11 }} className="mono">
        <span style={{ color: "var(--muted)" }}>plan = concat(effect_for(section) for section in sections)</span>
        <span style={{ color: "var(--ink-2)" }}>{plan.length} segments · {song.sections.length} sections</span>
      </div>
    </PipelineNode>
  );
}

export function InputsNode({ timeOfDay, strobesOn, onTimeChange, onStrobesChange }) {
  const strobesLocked = timeOfDay === "pregame";

  return (
    <PipelineNode title="Pipeline inputs" tag="user controls">
      <div className="input-stack">
        <div className="input-block">
          <div className="lbl">Time of day</div>
          <div className="seg three">
            {["pregame", "mid-party", "late-night"].map((t) => (
              <button
                key={t}
                className={timeOfDay === t ? "on" : ""}
                onClick={() => onTimeChange(t)}
              >{t === "pregame" ? "Pregame" : t === "mid-party" ? "Mid-Party" : "Late Night"}</button>
            ))}
          </div>
          <div className="hint mono">
            {timeOfDay === "pregame" && "low energy · no strobes · no UV"}
            {timeOfDay === "mid-party" && "full energy · strobes ok · no UV"}
            {timeOfDay === "late-night" && "peak · strobes ok · UV in rotation"}
          </div>
        </div>

        <div className={`input-block ${strobesLocked ? "locked" : ""}`}>
          <div className="lbl">Strobes</div>
          <div className="seg two">
            <button
              className={!strobesOn ? "on" : ""}
              onClick={() => onStrobesChange(false)}
              disabled={strobesLocked}
            >Off</button>
            <button
              className={strobesOn ? "on" : ""}
              onClick={() => onStrobesChange(true)}
              disabled={strobesLocked}
            >On</button>
          </div>
          <div className="hint mono">
            {strobesLocked
              ? "disabled during pregame"
              : strobesOn
              ? "strobe-tagged effects in rotation + downbeat pops on drops"
              : "no strobe-tagged effects in the pool"}
          </div>
        </div>
      </div>
    </PipelineNode>
  );
}

const POOL_GROUPS = [
  { key: "pregame|mid-party|late-night", label: "Any time of day" },
  { key: "pregame|mid-party", label: "Pregame & mid-party" },
  { key: "mid-party|late-night", label: "Mid-party & late-night" },
  { key: "late-night", label: "Late-night only" },
];

function classifyEffect(eff, { timeOfDay, strobiness, enabledIds }) {
  let reason = null;
  if (!enabledIds.has(eff.id)) reason = "disabled by user";
  else if (!eff.timeOfDay.includes(timeOfDay)) reason = "wrong time of day";
  else if (eff.requiresUV && timeOfDay !== "late-night") reason = "UV — late-night only";
  else if (eff.minStrobiness !== undefined && strobiness < eff.minStrobiness) reason = "needs strobes on";
  return { eligible: !reason, reason };
}

export function EffectsPoolNode({ timeOfDay, strobiness, enabledIds }) {
  const byGroup = {};
  for (const eff of EFFECTS) {
    const k = eff.timeOfDay.join("|");
    if (!byGroup[k]) byGroup[k] = [];
    byGroup[k].push(eff);
  }
  const total = EFFECTS.length;
  const eligibleCount = EFFECTS.filter(
    (e) => classifyEffect(e, { timeOfDay, strobiness, enabledIds }).eligible
  ).length;

  return (
    <PipelineNode title="Effect pool" tag={`${eligibleCount} / ${total} eligible`}>
      <div className="pool-groups">
        {POOL_GROUPS.map((g) => {
          const items = byGroup[g.key] || [];
          if (items.length === 0) return null;
          return (
            <div key={g.key} className="pool-group">
              <div className="pool-group-hdr mono">{g.label}</div>
              <div className="effects-pool">
                {items.map((eff) => {
                  const { eligible, reason } = classifyEffect(eff, { timeOfDay, strobiness, enabledIds });
                  return (
                    <div
                      key={eff.id}
                      className={`pool-card ${eligible ? "on" : "off"}`}
                      title={`${eff.name} · ${eff.tags.join(" · ")}${eligible ? " · in pool" : ` · ${reason}`}`}
                    >
                      <div className="pool-preview">
                        <EffectPreview effect={eff} size={48} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 8, fontSize: 11, color: "var(--muted)" }} className="mono">
        {"EFFECTS.filter(e => eligible(e, time-of-day, strobes))"}
      </div>
    </PipelineNode>
  );
}

export function PlanNode({ plan, song, position, showPlayhead = true }) {
  return (
    <PipelineNode
      title="Lights plan"
      tag="static · regenerated when song or inputs change"
    >
      <PlanStripContent plan={plan} song={song} position={position} showPlayhead={showPlayhead} />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11 }} className="mono">
        <span style={{ color: "var(--muted)" }}>plan = concat(effect_for(section) for section in sections)</span>
        <span style={{ color: "var(--ink-2)" }}>{plan.length} segments</span>
      </div>
    </PipelineNode>
  );
}

export function LivePlaybackNode({ plan, song, position, beat, currentEffect, currentSection, state }) {
  const beatInMeasure = Math.floor(beat) % 4;
  const measureNum = Math.floor(beat / 4);

  return (
    <PipelineNode
      title="Lights playback"
      tag="plan ⊗ playback state → live state"
      extraTitle={<span className="mono" style={{ fontSize: 10, color: "var(--muted)", marginLeft: 8, fontWeight: 400 }}>sample(plan, t)</span>}
    >
      <div className="live">
        <div className="live-now">
          <div className="now-hdr">
            <div>
              <div className="sec mono">{currentSection.name} · measure {measureNum + 1}</div>
              <div className="name">{currentEffect.name}</div>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {currentEffect.tags.includes("strobe") && <span className="warn-banner">STROBE</span>}
              {currentEffect.tags.includes("uv") && (
                <span className="warn-banner" style={{ color: "var(--uv)", background: "var(--uv-soft)", borderColor: "var(--uv)" }}>UV</span>
              )}
            </div>
          </div>

          <div className="beat-bar">
            {[0,1,2,3].map((i) => (
              <div key={i} className={`beat ${i === beatInMeasure ? "cur" : ""}`}>
                <span className="lbl">{i+1}</span>
              </div>
            ))}
          </div>

          <div className="now-stats">
            <div className="now-stat">
              <div className="k">Beat</div>
              <div className="v">{beat.toFixed(2)}</div>
            </div>
            <div className="now-stat">
              <div className="k">Phase</div>
              <div className="v">{((beat % 1) * 360).toFixed(0)}°</div>
            </div>
            <div className="now-stat">
              <div className="k">Rot</div>
              <div className="v">{((state.rotation * 180 / Math.PI) % 360).toFixed(0)}°</div>
            </div>
            <div className="now-stat">
              <div className="k">Dots</div>
              <div className="v">{state.dots.filter(Boolean).length}/8</div>
            </div>
          </div>

          <div className="mono" style={{ fontSize: 10, color: "var(--muted)", lineHeight: 1.6, paddingTop: 6, borderTop: "1px dashed var(--line)" }}>
            <div>effect.sample(beat={beat.toFixed(2)})</div>
            <div>→ blackout: <span style={{ color: state.blackout ? "var(--accent)" : "var(--ok)" }}>{state.blackout ? "true" : "false"}</span> · strobe: <span style={{ color: state.strobeOn ? "var(--accent)" : "var(--muted)" }}>{state.strobeOn ? "true" : "false"}</span> · uv: <span style={{ color: state.uvOn ? "var(--uv)" : "var(--muted)" }}>{state.uvOn ? "true" : "false"}</span></div>
          </div>
        </div>

        <DMXStage state={state} />
      </div>

      <DmxSignals plan={plan} song={song} beat={beat} />
    </PipelineNode>
  );
}

export function dmxColorFor(s) {
  if (!s) return null;
  const st = s.state;
  if (st.blackout) return "#0a0908";
  if (st.color === "__rainbow") {
    const idx = (Math.floor(s.beat * 8) % 8 + 8) % 8;
    return Object.values(COLORS)[idx];
  }
  return st.color;
}

export function computeDmxSpeeds(samples) {
  const speeds = samples.map((s, i) => {
    if (!s) return 0;
    const next = samples[i + 1];
    if (!next) return 0;
    let d = next.state.rotation - s.state.rotation;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return Math.abs(d);
  });
  const maxSpeed = Math.max(0.01, ...speeds);
  return { speeds, maxSpeed };
}

export function DmxChannelLayers({ samples, speeds, maxSpeed, cols, rowStyle, colorFor = dmxColorFor }) {
  const speedPath = (() => {
    if (samples.every((s) => !s)) return "";
    const pts = samples.map((s, i) => {
      if (!s) return null;
      const v = speeds[i] / maxSpeed;
      const y = 1 - Math.max(0.04, v * 0.95);
      return [i, y];
    });
    let d = "";
    let inSegment = false;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      if (!p) { inSegment = false; continue; }
      if (!inSegment) { d += `M${i} 1 L${p[0]} ${p[1]} `; inSegment = true; }
      else { d += `L${p[0]} ${p[1]} `; }
      if (i === pts.length - 1 || !pts[i + 1]) { d += `L${p[0]} 1 Z `; inSegment = false; }
    }
    return d;
  })();

  return (
    <>
      <svg className="dmx-row dmx-row-color" viewBox={`0 0 ${cols} 1`} preserveAspectRatio="none" style={rowStyle}>
        {samples.map((s, i) => {
          const c = colorFor(s);
          if (!c) return null;
          return <rect key={i} x={i} y="0" width="1.02" height="1" fill={c} />;
        })}
      </svg>
      <svg className="dmx-row dmx-row-speed" viewBox={`0 0 ${cols} 1`} preserveAspectRatio="none" style={rowStyle}>
        <path d={speedPath} fill="var(--ink-2)" opacity="0.85" />
      </svg>
      <svg className="dmx-row dmx-row-strobe" viewBox={`0 0 ${cols} 1`} preserveAspectRatio="none" style={rowStyle}>
        {samples.map((s, i) => {
          if (!s || !s.state.strobeOn) return null;
          return <rect key={i} x={i - 0.3} y="0.06" width="0.7" height="0.88" fill="oklch(0.66 0.22 0)" />;
        })}
      </svg>
      <svg className="dmx-row dmx-row-uv" viewBox={`0 0 ${cols} 1`} preserveAspectRatio="none" style={rowStyle}>
        {samples.map((s, i) => {
          if (!s || !s.state.uvOn) return null;
          return <rect key={i} x={i} y="0.08" width="1.02" height="0.84" fill="oklch(0.55 0.22 295)" />;
        })}
      </svg>
    </>
  );
}

export function DmxSignals({ plan, song, beat }) {
  useTick();
  const bpm = song.bpm;
  const WINDOW = 24;
  const HEAD = 6;
  const SUB = 8;
  const COLS = (WINDOW + 1) * SUB;
  const baseBeat = Math.floor(beat);
  const frac = beat - baseBeat;

  const samples = useMemo(() => {
    const out = [];
    for (let i = 0; i < COLS; i++) {
      const b = baseBeat - HEAD + (i / SUB);
      const t = (b * 60) / bpm;
      const item = plan.find((p) => t >= p.section.start && t < p.section.end);
      if (!item || b < 0) { out.push(null); continue; }
      out.push({ beat: b, state: item.effect.sample(b) });
    }
    return out;
  }, [baseBeat, plan, bpm, COLS]);

  const { speeds, maxSpeed } = computeDmxSpeeds(samples);

  const shiftPct = -(frac * 100) / (WINDOW + 1);
  const playheadPct = (HEAD / WINDOW) * 100;
  const stripWidthPct = ((WINDOW + 1) / WINDOW) * 100;
  const rowStyle = { width: `${stripWidthPct}%` };

  return (
    <div className="dmx-sig">
      <div className="dmx-sig-hdr">
        <span className="t">DMX channel timeline</span>
        <span className="mono legend">{WINDOW} beats · playhead = now</span>
      </div>

      <div className="dmx-sig-grid">
        <div className="dmx-labels mono">
          <div className="dmx-lbl-row dmx-lbl-thin">BEAT</div>
          <div className="dmx-lbl-row">COLOR <span className="ch">ch 1–3</span></div>
          <div className="dmx-lbl-row">SPEED <span className="ch">ch 4</span></div>
          <div className="dmx-lbl-row">STROBE <span className="ch">ch 5</span></div>
          <div className="dmx-lbl-row">UV <span className="ch">ch 6</span></div>
        </div>

        <div className="dmx-tracks">
          <div className="dmx-tracks-clip">
            <div className="dmx-rows-shift" style={{ transform: `translateX(${shiftPct}%)` }}>
              <div className="dmx-row dmx-row-beats" style={rowStyle}>
                {Array.from({ length: WINDOW + 1 }).map((_, i) => {
                  const b = baseBeat - HEAD + i;
                  const isDownbeat = b % 4 === 0;
                  return (
                    <div key={i} className={`dmx-beat-tick ${isDownbeat ? "downbeat" : ""}`} style={{ left: `${(i / (WINDOW + 1)) * 100}%` }}>
                      {isDownbeat && b >= 0 && <span className="mono">{Math.floor(b / 4) + 1}</span>}
                    </div>
                  );
                })}
              </div>

              <DmxChannelLayers samples={samples} speeds={speeds} maxSpeed={maxSpeed} cols={COLS} rowStyle={rowStyle} />
            </div>
          </div>

          <div className="dmx-playhead" style={{ left: `${playheadPct}%` }} />
        </div>
      </div>
    </div>
  );
}

function applyOcrErrors(displayStr) {
  const chars = displayStr.split('');
  const errored = [];
  const ocrChars = chars.map((c, i) => {
    if (!/\d/.test(c)) return c;
    if (Math.random() < 0.03) {
      errored.push(i);
      let r = Math.floor(Math.random() * 9);
      if (r >= parseInt(c, 10)) r++;
      return String(r);
    }
    return c;
  });
  return { ocrStr: ocrChars.join(''), chars: ocrChars, errored };
}

function parseMmSs(s) {
  if (!s) return 0;
  const parts = s.split(':');
  if (parts.length === 1) return parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[0], 10) || 0;
  const sec = parseInt(parts[1], 10) || 0;
  return m * 60 + sec;
}

function fmtMmSsTrunc(secs) {
  const total = Math.max(0, Math.floor(secs));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function computeOverlapRegions(samples) {
  if (samples.length === 0) return [];
  const events = [];
  for (let i = 0; i < samples.length; i++) {
    events.push([samples[i].lo, +1, i]);
    events.push([samples[i].hi, -1, i]);
  }
  events.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const regions = [];
  let count = 0;
  for (let k = 0; k < events.length; k++) {
    const [t, delta] = events[k];
    if (delta === +1) count++;
    else count--;
    if (k + 1 < events.length) {
      const nextT = events[k + 1][0];
      if (nextT > t && count >= 2) {
        regions.push({ lo: t, hi: nextT, count });
      }
    }
  }
  return regions;
}

function computeIntersection(samples) {
  if (samples.length === 0) return { result: null, accepted: [], rejected: [] };
  const events = [];
  for (let i = 0; i < samples.length; i++) {
    events.push([samples[i].lo, +1, i]);
    events.push([samples[i].hi, -1, i]);
  }
  // Intervals are (lo, hi] — at a shared boundary, the closing -1 must run
  // before the opening +1 (the boundary belongs to the closing interval, not
  // the opening one).
  events.sort((a, b) => a[0] - b[0] || a[1] - b[1]);

  let count = 0;
  const active = new Set();
  let bestCount = 0;
  let bestLo = 0, bestHi = 0;
  let bestActive = new Set();

  for (let k = 0; k < events.length; k++) {
    const [t, delta, i] = events[k];
    if (delta === +1) {
      count++;
      active.add(i);
      if (count > bestCount) {
        let nextT = null;
        for (let j = k + 1; j < events.length; j++) {
          if (events[j][0] > t) { nextT = events[j][0]; break; }
        }
        if (nextT !== null) {
          bestCount = count;
          bestLo = t;
          bestHi = nextT;
          bestActive = new Set(active);
        }
      }
    } else {
      active.delete(i);
      count--;
    }
  }

  if (bestCount === 0) {
    return { result: null, accepted: [], rejected: samples.slice() };
  }
  const accepted = [];
  const rejected = [];
  for (let i = 0; i < samples.length; i++) {
    if (bestActive.has(i)) accepted.push(samples[i]);
    else rejected.push(samples[i]);
  }
  return {
    result: { lo: bestLo, hi: bestHi, mid: (bestLo + bestHi) / 2, width: bestHi - bestLo },
    accepted, rejected,
  };
}

export function OcrSidecar({ song, position }) {
  const [samples, setSamples] = useState([]);
  const [flash, setFlash] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  const positionRef = useRef(position);
  positionRef.current = position;
  const songRef = useRef(song.id);
  const mountRef = useRef(performance.now());
  const samplesRef = useRef([]);
  const burstStartRef = useRef(performance.now());
  const timeoutRef = useRef(null);
  const truthSRef = useRef(null);

  useEffect(() => { samplesRef.current = samples; }, [samples]);

  const nowWall = (performance.now() - mountRef.current) / 1000;
  const truthS = truthSRef.current;

  const BARS = 200;
  const waveData = useMemo(() => makeWaveform(song, BARS), [song.id]);
  const positionFrac = Math.max(0, Math.min(1, position / song.duration));
  const mmss = fmtMmSsTrunc(position);

  useEffect(() => {
    if (songRef.current !== song.id) {
      setSamples([]);
      samplesRef.current = [];
      songRef.current = song.id;
      burstStartRef.current = performance.now();
      truthSRef.current = null;
    }
  }, [song.id]);

  useEffect(() => {
    const MAX_SAMPLES = 40;
    const MIN_WIDTH_STOP = 0.0005;
    const BURST_MS = 2000;

    const takeSample = () => {
      const wall = (performance.now() - mountRef.current) / 1000;
      const truePos = positionRef.current;
      const trueTruncated = Math.max(0, Math.floor(truePos));
      const displayStr = fmtMmSsTrunc(trueTruncated);
      const { ocrStr, chars, errored } = applyOcrErrors(displayStr);
      const ocrSec = parseMmSs(ocrStr);
      const lo = wall - ocrSec - 1;
      const hi = wall - ocrSec;
      const sample = {
        wall, truePos, displayStr, ocrStr, chars, errored, ocrSec, lo, hi,
        isError: errored.length > 0,
      };

      const prev = samplesRef.current;
      let next;
      let didReset = false;
      if (prev.length > 0) {
        const last = prev[prev.length - 1];
        // Only reset on an actual song wrap (position went backward), not on
        // a fast-forward (e.g., the harness running at 10× speed under
        // throttling can produce big positive jumps that aren't real wraps).
        if (truePos < last.truePos - 5) {
          next = [sample];
          didReset = true;
        } else {
          next = [...prev, sample];
        }
      } else {
        next = [sample];
      }

      samplesRef.current = next;
      setSamples(next);
      setFlash((f) => f + 1);
      // Lock truthS based on the first sample's frame of reference. This
      // matches what the algorithm actually sees (wall − truePos at sample
      // time), unaffected by any startup delay between OcrSidecar mount and
      // the harness's animation loop.
      if (truthSRef.current === null || didReset) {
        truthSRef.current = wall - truePos;
        if (didReset) burstStartRef.current = performance.now();
      }

      scheduleNext();
    };

    const scheduleNext = () => {
      const samplesNow = samplesRef.current;
      if (samplesNow.length >= MAX_SAMPLES) return;

      const nowPerf = performance.now();
      const burstAge = nowPerf - burstStartRef.current;
      let delay;

      if (burstAge < BURST_MS) {
        delay = 50 + Math.random() * 100;
      } else {
        const { result } = computeIntersection(samplesNow);
        if (!result || result.width < MIN_WIDTH_STOP) return;

        const nowSec = (nowPerf - mountRef.current) / 1000;
        const minDelaySec = 0.6;
        const m = result.mid;
        const targetT = Math.ceil(nowSec + minDelaySec - m);
        const targetW = m + targetT;
        delay = Math.max(minDelaySec * 1000, (targetW - nowSec) * 1000);
        if (delay > 2500) delay = 2500;
      }

      timeoutRef.current = setTimeout(takeSample, delay);
    };

    burstStartRef.current = performance.now();
    // Schedule first snapshot to land 0.5 s after the next integer-second tick
    // of the truncated position. Always lands mid-second, which makes the
    // intervals visually distinct (not coincidentally on a boundary).
    const startPos = positionRef.current;
    const frac = startPos - Math.floor(startPos);
    const toNextTick = Math.max(0, 1 - frac);
    const firstDelay = Math.min(1500, (toNextTick + 0.5) * 1000);
    timeoutRef.current = setTimeout(takeSample, firstDelay);
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [resetKey]);

  // OCR-errored rows are dropped before intersection — we don't know which
  // digit was wrong, so we can't trust the interval. The remaining samples
  // go through max-coverage intersection to identify outliers.
  const nonErrored = samples.filter((s) => !s.isError);
  const { result: intersection, accepted } = computeIntersection(nonErrored);
  const acceptedSet = new Set(accepted.map((s) => s.wall));

  const handleReset = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setSamples([]);
    samplesRef.current = [];
    truthSRef.current = null;
    burstStartRef.current = performance.now();
    setFlash((f) => f + 1);
    setResetKey((k) => k + 1);
  };

  const fmtSigned = (s) => `${s >= 0 ? "+" : "−"}${fmtTime(Math.abs(s))}`;

  return (
    <section className="ocr">
      <div className="ocr-hdr">
        <div>
          <div className="ocr-pre-row">
            <div className="ocr-pre mono">Sidecar process · burst-then-bisect</div>
            <button className="ocr-reset-btn mono" onClick={handleReset} type="button">
              ↻ reset
            </button>
          </div>
          <h2>Estimating Rekordbox's playhead</h2>
          <p>
            Rekordbox doesn't expose its current playback time over any API we can hit.
            We screenshot its window and OCR the time readout — but the readout only
            shows whole seconds, so a single read just tells us the song started inside
            a 1&nbsp;second window. We <em>intersect</em> the windows from many reads to
            narrow down the actual start time. A 2&nbsp;s burst of rapid screenshots gets
            us a tight interval; from there we bisect by timing each next screenshot to
            land exactly at the midpoint of what's left.
          </p>
        </div>
      </div>

      <div className="ocr-flow">
        <div className="ocr-rb">
          <div className="ocr-rb-chrome">
            <div className="ocr-rb-dots"><span /><span /><span /></div>
            <span className="ocr-rb-ttl mono">rekordbox · Deck A</span>
          </div>
          <div className="ocr-rb-body">
            <div className="ocr-rb-wave">
              <div className="ocr-rb-wave-strip">
                {waveData.map((v, i) => (
                  <div
                    key={i}
                    className="bar"
                    style={{
                      flex: `0 0 ${100 / BARS}%`,
                      height: `${Math.max(8, v * 92)}%`,
                    }}
                  />
                ))}
              </div>
              <div className="ocr-rb-playhead" style={{ left: `${positionFrac * 100}%` }} />
            </div>
            <div className="ocr-rb-meta">
              <div className="ocr-rb-time mono">{mmss}</div>
              <div className="ocr-rb-track">
                <div className="t">{song.title}</div>
                <div className="a mono">{song.artist} · {song.bpm} BPM</div>
              </div>
            </div>
          </div>
          <div className="ocr-rb-flash" key={flash} />
          <div className="ocr-rb-shutter mono">
            📷 → tesseract → "{samples.length > 0 ? samples[samples.length - 1].ocrStr : "—"}"
          </div>
        </div>

        <div className="ocr-arrow mono">
          <div>read t</div>
          <div className="arr">───►</div>
          <div className="lbl">(w−t−1, w−t]</div>
        </div>

        <div className="ocr-ledger">
          <div className="ocr-ledger-hdr mono">
            <span>wall</span><span>ocr read</span><span>interval for s</span>
          </div>
          <div className="ocr-ledger-body">
            {samples.length === 0 && (
              <div className="ocr-ledger-empty mono">waiting for first screenshot…</div>
            )}
            {samples.slice().reverse().map((s, idx) => {
              const isRejected = !acceptedSet.has(s.wall);
              return (
                <div
                  key={`${s.wall}-${idx}`}
                  className={`ocr-row mono ${idx === 0 ? "newest" : ""} ${s.isError ? "err" : ""} ${isRejected ? "rejected" : ""}`}
                >
                  <span>{fmtTime(s.wall)}</span>
                  <span className="ocr-read">
                    {s.chars.map((c, i) => (
                      <span key={i} className={s.errored.includes(i) ? "err-digit" : ""}>{c}</span>
                    ))}
                  </span>
                  <span className="iv">
                    <span className="paren">(</span>
                    {fmtSigned(s.lo)}
                    <span className="paren">, </span>
                    {fmtSigned(s.hi)}
                    <span className="paren">]</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      <VirtualPlayback
        song={song}
        intersection={intersection}
        nowWall={nowWall}
      />

      <div className="ocr-viz-explain">
        <div className="ocr-viz-explain-t mono">How the intersection narrows the start time</div>
        <p>
          Each OCR read gives a 1&nbsp;second window the start time must fall in
          (each grey bar below is one read). We line them up against a shared
          number line and look for the longest stretch they <em>all</em> agree
          on — that pink band is our running estimate. Reads that fall outside
          the consensus (dashed) are dropped as OCR errors or stale screenshots.
          The narrower the pink band, the better we know the start time.
        </p>
      </div>

      <div className="ocr-viz-grid">
        <OcrNumberLine samples={samples} intersection={intersection} acceptedSet={acceptedSet} truthS={truthS} />
      </div>
    </section>
  );
}

function VirtualPlayback({ song, intersection, nowWall }) {
  const estPosition = intersection ? Math.max(0, nowWall - intersection.mid) : null;
  const widthMs = intersection ? intersection.width * 1000 : null;
  const halfMs = widthMs !== null ? widthMs / 2 : null;

  const fmtFine = (s) => {
    if (s === null) return "—:—";
    const total = Math.max(0, s);
    const m = Math.floor(total / 60);
    const rem = total - m * 60;
    return `${m}:${rem.toFixed(2).padStart(5, "0")}`;
  };

  const playheadPct = estPosition !== null
    ? Math.max(0, Math.min(100, (estPosition / song.duration) * 100))
    : 0;
  const bandHalfPct = intersection
    ? Math.max(0.15, (intersection.width / 2 / song.duration) * 100)
    : 0;

  return (
    <section className="ocr-virtual">
      <div className="ocr-virtual-hdr">
        <div>
          <div className="ocr-virtual-pre mono">virtual playback · what we believe rekordbox is showing right now</div>
          <div className="ocr-virtual-sub mono">
            playhead = wall clock − estimated start time · ± half the interval width
          </div>
        </div>
        <div className="ocr-virtual-meta">
          <div className="t">{song.title}</div>
          <div className="a mono">{song.artist} · {song.bpm} BPM</div>
        </div>
      </div>
      <div className="ocr-virtual-body">
        <div className="ocr-virtual-time mono">
          {estPosition === null ? "—:——.——" : fmtFine(estPosition)}
          {halfMs !== null && (
            <span className="ocr-virtual-uncertainty mono">
              ± {halfMs >= 100 ? `${halfMs.toFixed(0)} ms` : `${halfMs.toFixed(1)} ms`}
            </span>
          )}
        </div>
        <div className="ocr-virtual-track">
          <div className="ocr-virtual-track-line" />
          {intersection && (
            <div
              className="ocr-virtual-uncertainty-band"
              style={{
                left: `${playheadPct - bandHalfPct}%`,
                width: `${bandHalfPct * 2}%`,
              }}
            />
          )}
          {estPosition !== null && (
            <div className="ocr-virtual-playhead-line" style={{ left: `${playheadPct}%` }} />
          )}
          <div className="ocr-virtual-tick start mono">0:00</div>
          <div className="ocr-virtual-tick end mono">{fmtMmSsTrunc(song.duration)}</div>
        </div>
      </div>
    </section>
  );
}

function OcrNumberLine({ samples, intersection, acceptedSet, truthS }) {
  if (samples.length === 0 || truthS === null) {
    return (
      <div className="ocr-numline empty">
        <div className="ocr-viz-hdr mono">
          <span className="t">Number line</span>
          <span className="r">waiting…</span>
        </div>
        <div className="ocr-numline-plot empty" />
      </div>
    );
  }

  const visible = samples;
  const center = truthS;
  const rangeSamples = visible.filter((s) => acceptedSet.has(s.wall));
  const rangeBasis = rangeSamples.length > 0 ? rangeSamples : visible;
  const allLo = Math.min(...rangeBasis.map((s) => s.lo));
  const allHi = Math.max(...rangeBasis.map((s) => s.hi));
  const maxDist = Math.max(Math.abs(allLo - center), Math.abs(allHi - center), 0.6);
  const halfW = maxDist * 1.05;
  const viewLo = center - halfW;
  const viewHi = center + halfW;
  const fullW = viewHi - viewLo;
  const pct = (x) => ((x - viewLo) / fullW) * 100;
  const inRange = (s) => s.hi > viewLo && s.lo < viewHi;

  const ticks = [];
  const tickStep = fullW > 4 ? 1 : fullW > 1.5 ? 0.5 : 0.1;
  const tStart = Math.ceil(viewLo / tickStep) * tickStep;
  for (let t = tStart; t <= viewHi; t += tickStep) {
    ticks.push(Math.round(t * 1000) / 1000);
  }

  const fmtSigned = (s) => `${s >= 0 ? "+" : "−"}${fmtTime(Math.abs(s))}`;

  return (
    <div className="ocr-numline">
      <div className="ocr-viz-hdr mono">
        <span className="t">Number line · each bar = one read's 1s window</span>
        <span className="r">
          narrowed to {intersection
            ? intersection.width < 1
              ? `${(intersection.width * 1000).toFixed(0)} ms`
              : `${intersection.width.toFixed(2)} s`
            : "—"}
        </span>
      </div>
      <div className="ocr-numline-plot">
        <div className="numline-axis">
          {ticks.map((t, i) => {
            const showLbl = i === 0 || i === ticks.length - 1 || i % 2 === 0;
            const off = t - truthS;
            const lbl = Math.abs(off) < 0.001 ? "truth" : `${off >= 0 ? "+" : "−"}${Math.abs(off).toFixed(tickStep < 1 ? 1 : 0)}s`;
            return (
              <div key={i} className="tick" style={{ left: `${pct(t)}%` }}>
                {showLbl && <span className="lbl mono">{lbl}</span>}
              </div>
            );
          })}
        </div>

        <div className="numline-truth" style={{ left: `${pct(truthS)}%` }}>
          <span className="lbl mono">truth</span>
        </div>

        {intersection && (
          <div
            className="numline-intersect"
            style={{
              left: `${pct(intersection.lo)}%`,
              width: `${Math.max(0.4, pct(intersection.hi) - pct(intersection.lo))}%`,
            }}
          >
            <span className="band-lbl mono">consensus</span>
          </div>
        )}

        <div className="numline-rows">
          {visible.map((s, i) => {
            const isRejected = !acceptedSet.has(s.wall);
            const newest = i === visible.length - 1;
            const visible_ = inRange(s);
            const loC = Math.max(viewLo, s.lo);
            const hiC = Math.min(viewHi, s.hi);
            return (
              <div
                key={`${s.wall}-${i}`}
                className={`numline-row ${newest ? "newest" : ""} ${isRejected ? "rejected" : ""} ${s.isError ? "err" : ""}`}
                title={`wall ${s.wall.toFixed(2)}s · ocr "${s.ocrStr}" → ${s.ocrSec}s · interval (${fmtSigned(s.lo)}, ${fmtSigned(s.hi)}]`}
              >
                {visible_ && (
                  <div
                    className="bar"
                    style={{
                      left: `${pct(loC)}%`,
                      width: `${Math.max(0.5, pct(hiC) - pct(loC))}%`,
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="ocr-viz-foot mono">
        <span className="lg lg-good" /> in consensus ·{" "}
        <span className="lg lg-err" /> OCR error ·{" "}
        <span className="lg lg-rej" /> outlier (didn't overlap) ·{" "}
        <span className="lg lg-int" /> consensus interval ·{" "}
        <span className="lg lg-truth" /> true start
      </div>
    </div>
  );
}

function OcrCircle({ samples, intersection, acceptedSet, truthS }) {
  if (samples.length === 0 || truthS === null) {
    return (
      <div className="ocr-circle empty">
        <div className="ocr-viz-hdr mono">
          <span className="t">Circle view</span>
          <span className="r">waiting…</span>
        </div>
        <div className="ocr-circle-empty" />
      </div>
    );
  }

  const allSamples = samples;
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  // Adaptive window — sized from accepted samples (the cluster around truth)
  // so a wild rejected outlier doesn't blow up the scale. Mirrors the number
  // line's approach.
  const rangeSamples = allSamples.filter((s) => acceptedSet.has(s.wall));
  const rangeBasis = rangeSamples.length > 0 ? rangeSamples : allSamples;
  const allLo = rangeBasis.length > 0 ? Math.min(...rangeBasis.map((s) => s.lo)) : truthS - 0.5;
  const allHi = rangeBasis.length > 0 ? Math.max(...rangeBasis.map((s) => s.hi)) : truthS + 0.5;
  const maxDist = Math.max(Math.abs(allLo - truthS), Math.abs(allHi - truthS), 0.6);
  const VIEW_HALF = maxDist * 1.05;
  const viewLo = truthS - VIEW_HALF;
  const viewHi = truthS + VIEW_HALF;
  const fullW = viewHi - viewLo;

  const inView = (lo, hi) => lo >= viewLo && hi <= viewHi;
  const inRange = (s) => s.hi > viewLo && s.lo < viewHi;
  const visible = allSamples.filter(inRange);

  // Truth at top of circle; values below truth go counterclockwise, values
  // above truth go clockwise; both meet at the bottom (the ±0.5 ms edge).
  const angleFor = (x) => -Math.PI / 2 + ((x - truthS) / fullW) * 2 * Math.PI;

  const rOuter = 100;
  const rInner = 50;
  const ringStep = visible.length > 1 ? (rOuter - rInner) / visible.length : 0;
  const wedgeInner = rOuter + 4;
  const wedgeOuter = rOuter + 30;

  const allRegions = computeOverlapRegions(allSamples).filter((r) => inView(r.lo, r.hi));
  const maxRegionCount = allRegions.length > 0 ? Math.max(...allRegions.map((r) => r.count)) : 0;
  const topRegions = allRegions.filter((r) => r.count === maxRegionCount);

  const wedgePath = (r0, r1, lo, hi) => {
    const lo2 = Math.max(viewLo + 1e-6, lo);
    const hi2 = Math.min(viewHi - 1e-6, hi);
    if (lo2 >= hi2) return "";
    const a1 = angleFor(lo2);
    const a2 = angleFor(hi2);
    const large = a2 - a1 > Math.PI ? 1 : 0;
    const x1i = cx + r0 * Math.cos(a1);
    const y1i = cy + r0 * Math.sin(a1);
    const x1o = cx + r1 * Math.cos(a1);
    const y1o = cy + r1 * Math.sin(a1);
    const x2i = cx + r0 * Math.cos(a2);
    const y2i = cy + r0 * Math.sin(a2);
    const x2o = cx + r1 * Math.cos(a2);
    const y2o = cy + r1 * Math.sin(a2);
    return `M ${x1i.toFixed(2)} ${y1i.toFixed(2)} L ${x1o.toFixed(2)} ${y1o.toFixed(2)} A ${r1} ${r1} 0 ${large} 1 ${x2o.toFixed(2)} ${y2o.toFixed(2)} L ${x2i.toFixed(2)} ${y2i.toFixed(2)} A ${r0} ${r0} 0 ${large} 0 ${x1i.toFixed(2)} ${y1i.toFixed(2)} Z`;
  };

  const arcPath = (r, lo, hi) => {
    const lo2 = Math.max(viewLo + 1e-6, lo);
    const hi2 = Math.min(viewHi - 1e-6, hi);
    if (lo2 >= hi2) return "";
    const a1 = angleFor(lo2);
    const a2 = angleFor(hi2);
    const x1 = cx + r * Math.cos(a1);
    const y1 = cy + r * Math.sin(a1);
    const x2 = cx + r * Math.cos(a2);
    const y2 = cy + r * Math.sin(a2);
    const large = a2 - a1 > Math.PI ? 1 : 0;
    return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
  };

  const truthA = angleFor(truthS);
  const truthInView = truthS >= viewLo && truthS <= viewHi;

  return (
    <div className="ocr-circle">
      <div className="ocr-viz-hdr mono">
        <span className="t">Circle view · same data, wrapped — pink wedge = where most reads overlap</span>
        <span className="r">truth at 12 o'clock</span>
      </div>
      <svg width={size} height={size} className="ocr-circle-svg" viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={wedgeInner} fill="none" stroke="var(--line)" />
        <circle cx={cx} cy={cy} r={wedgeOuter} fill="none" stroke="var(--line)" strokeDasharray="2 3" opacity="0.55" />
        <circle cx={cx} cy={cy} r={rInner - 10} fill="none" stroke="var(--line)" />

        {topRegions.map((r, i) => (
          <path
            key={`wedge-${i}`}
            d={wedgePath(wedgeInner, wedgeOuter, r.lo, r.hi)}
            fill="oklch(0.66 0.22 0 / 0.28)"
            stroke="var(--accent)"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        ))}
        {maxRegionCount >= 2 && (
          <text
            x={cx}
            y={cy - wedgeOuter - 5}
            fontSize="9"
            fontFamily="Geist Mono, monospace"
            fill="var(--accent)"
            textAnchor="middle"
          >
            {maxRegionCount} of {visible.length} reads agree here
          </text>
        )}

        {visible.map((s, i) => {
          const gap = Math.min(1.2, ringStep * 0.18);
          const r0 = rInner + i * ringStep + gap / 2;
          const r1 = rInner + (i + 1) * ringStep - gap / 2;
          const isRejected = !acceptedSet.has(s.wall);
          const newest = i === visible.length - 1;
          const fill = s.isError
            ? newest
              ? "var(--accent)"
              : "oklch(0.66 0.22 0 / 0.7)"
            : isRejected
            ? "transparent"
            : newest
            ? "var(--ink)"
            : "rgba(20, 18, 14, 0.45)";
          return (
            <path
              key={`${s.wall}-${i}`}
              d={wedgePath(r0, r1, s.lo, s.hi)}
              fill={fill}
              stroke={isRejected ? "rgba(20, 18, 14, 0.35)" : "none"}
              strokeWidth={isRejected ? 1.2 : 0}
              strokeDasharray={isRejected ? "3 3" : undefined}
              strokeLinejoin="round"
            />
          );
        })}

        {(() => {
          const regions = computeOverlapRegions(visible);
          if (regions.length === 0) return null;
          const maxCount = Math.max(...regions.map((r) => r.count));
          return regions.map((r, i) => {
            const isMax = r.count === maxCount;
            return (
              <path
                key={`reg-${i}`}
                d={arcPath(rInner - 16, r.lo, r.hi)}
                stroke="var(--accent)"
                strokeWidth={isMax ? 6 : 3}
                fill="none"
                strokeLinecap="round"
                opacity={isMax ? 1 : 0.35 + 0.45 * (r.count / maxCount)}
              />
            );
          });
        })()}

        {truthInView && (
          <>
            <line
              x1={cx + (rInner - 6) * Math.cos(truthA)}
              y1={cy + (rInner - 6) * Math.sin(truthA)}
              x2={cx + (wedgeOuter + 4) * Math.cos(truthA)}
              y2={cy + (wedgeOuter + 4) * Math.sin(truthA)}
              stroke="oklch(0.62 0.14 155)"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <text
              x={cx + (wedgeOuter + 16) * Math.cos(truthA)}
              y={cy + (wedgeOuter + 16) * Math.sin(truthA)}
              fontSize="10"
              fontFamily="Geist Mono, monospace"
              fill="oklch(0.62 0.14 155)"
              textAnchor="middle"
              dy="4"
            >
              truth
            </text>
          </>
        )}

        <text x={cx} y={cy - 3} fontSize="9" fontFamily="Geist Mono, monospace" fill="var(--muted)" textAnchor="middle">
          width
        </text>
        <text x={cx} y={cy + 10} fontSize="11" fontFamily="Geist Mono, monospace" fill="var(--muted)" textAnchor="middle">
          {intersection
            ? intersection.width < 1
              ? `${(intersection.width * 1000).toFixed(0)}ms`
              : `${intersection.width.toFixed(2)}s`
            : "—"}
        </text>
      </svg>
      <div className="ocr-viz-foot mono">
        outer ring = reads · inner ring = consensus interval
      </div>
    </div>
  );
}

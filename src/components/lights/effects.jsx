import { useRef, useEffect, useState, useContext, createContext } from 'react';
import { COLORS } from './data.js';

// Fixture style context — "ring" (default), "bar", "wash"
export const FixtureContext = createContext("ring");

// Global animation tick — forces re-render at rAF; returns elapsed seconds.
export function useTick() {
  const [, setT] = useState(0);
  const startRef = useRef(performance.now());
  useEffect(() => {
    let raf;
    const loop = () => {
      setT((performance.now() - startRef.current) / 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (performance.now() - startRef.current) / 1000;
}

export function LightFixture({ state, size = 90, mini = false, showStrobe = true }) {
  const style = useContext(FixtureContext);
  if (!state) return null;
  const { dots, color, rotation, blackout, strobeOn } = state;
  const cx = size / 2, cy = size / 2;

  const colorFor = (i) => {
    if (color === "__rainbow") return Object.values(COLORS)[i % 8];
    return color;
  };

  if (style === "bar") {
    const dotR = size * 0.07;
    const margin = size * 0.12;
    const usable = size - margin * 2;
    const step = usable / 7;
    const y = size * 0.5;
    return (
      <svg width={size} height={size * 0.55} viewBox={`0 0 ${size} ${size * 0.55}`} style={{ display: "block" }}>
        <rect x="0" y={y - dotR * 2.2} width={size} height={dotR * 4.4} rx={dotR * 1.4} fill="#15130f" stroke="#2a2622" strokeWidth="1" />
        {dots.map((on, i) => {
          const x = margin + i * step;
          const c = colorFor(i);
          const visible = on && !blackout;
          return (
            <g key={i}>
              {visible && <circle cx={x} cy={y} r={dotR * 2.2} fill={c} opacity="0.22" style={{ filter: "blur(2px)" }} />}
              <circle cx={x} cy={y} r={dotR} fill={visible ? c : "#1c1915"} stroke={visible ? "rgba(255,255,255,0.5)" : "transparent"} strokeWidth={visible ? 0.5 : 0} />
              {visible && <circle cx={x - dotR * 0.3} cy={y - dotR * 0.3} r={dotR * 0.35} fill="rgba(255,255,255,0.55)" />}
            </g>
          );
        })}
        {showStrobe && strobeOn && (
          <g>
            <rect x={size * 0.35} y={y - dotR * 1.6} width={size * 0.3} height={dotR * 3.2} rx={dotR} fill="#fff" opacity="0.35" style={{ filter: "blur(3px)" }} />
            <rect x={size * 0.42} y={y - dotR} width={size * 0.16} height={dotR * 2} rx={dotR * 0.6} fill="#fff" />
          </g>
        )}
      </svg>
    );
  }

  if (style === "wash") {
    const onCount = dots.filter(Boolean).length;
    const intensity = blackout ? 0 : onCount / 8;
    const isRainbow = color === "__rainbow";
    const rid = `wash-${size}`;
    return (
      <svg width={size} height={size * 0.85} viewBox={`0 0 ${size} ${size * 0.85}`} style={{ display: "block" }}>
        <defs>
          <linearGradient id={rid} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ff3ec0" />
            <stop offset="25%" stopColor="#ff8a1f" />
            <stop offset="50%" stopColor="#ffd329" />
            <stop offset="75%" stopColor="#36d96b" />
            <stop offset="100%" stopColor="#3a7bff" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width={size} height={size * 0.85} rx={size * 0.06} fill="#15130f" stroke="#2a2622" strokeWidth="1" />
        <rect x={size * 0.05} y={size * 0.05} width={size * 0.9} height={size * 0.75} rx={size * 0.05}
              fill={isRainbow ? `url(#${rid})` : color}
              opacity={intensity * 0.95} />
        {intensity > 0 && (
          <rect x={size * 0.05} y={size * 0.05} width={size * 0.9} height={size * 0.3} rx={size * 0.05}
                fill="rgba(255,255,255,0.18)" opacity={intensity} />
        )}
        {showStrobe && strobeOn && (
          <rect x={size * 0.05} y={size * 0.05} width={size * 0.9} height={size * 0.75} rx={size * 0.05}
                fill="#fff" opacity="0.85" />
        )}
      </svg>
    );
  }

  // Default "ring" style — 8 dots in a rotating circle
  const ringR = size * 0.34;
  const dotR = mini ? size * 0.075 : size * 0.085;
  const housingR = size * 0.46;
  const strobeR = size * 0.085;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block" }}>
      <circle cx={cx} cy={cy} r={housingR} fill="#15130f" stroke="#2a2622" strokeWidth="1" />
      <circle cx={cx} cy={cy} r={housingR - 2} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      <circle cx={cx} cy={cy} r={ringR + dotR + 3} fill="#0a0908" />
      <g transform={`rotate(${(rotation * 180) / Math.PI} ${cx} ${cy})`}>
        {dots.map((on, i) => {
          const ang = (i / 8) * Math.PI * 2 - Math.PI / 2;
          const x = cx + Math.cos(ang) * ringR;
          const y = cy + Math.sin(ang) * ringR;
          const c = colorFor(i);
          const visible = on && !blackout;
          return (
            <g key={i}>
              {visible && (
                <circle cx={x} cy={y} r={dotR * 2.3} fill={c} opacity="0.18" style={{ filter: "blur(2px)" }} />
              )}
              <circle
                cx={x} cy={y} r={dotR}
                fill={visible ? c : "#1c1915"}
                stroke={visible ? "rgba(255,255,255,0.5)" : "transparent"}
                strokeWidth={visible ? 0.5 : 0}
              />
              {visible && (
                <circle cx={x - dotR * 0.3} cy={y - dotR * 0.3} r={dotR * 0.35} fill="rgba(255,255,255,0.55)" />
              )}
            </g>
          );
        })}
      </g>
      {showStrobe && strobeOn ? (
        <g>
          <circle cx={cx} cy={cy} r={strobeR * 2.4} fill="#fff" opacity="0.35" style={{ filter: "blur(3px)" }} />
          <circle cx={cx} cy={cy} r={strobeR} fill="#fff" />
        </g>
      ) : (
        <circle cx={cx} cy={cy} r={2} fill="#3a342c" />
      )}
    </svg>
  );
}

export function EffectPreview({ effect, bpm = 120, size = 64, mini = true, externalBeat = null }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useTick();
  if (!effect) return null;

  let beat;
  if (externalBeat !== null) {
    beat = externalBeat;
  } else if (!mounted) {
    beat = 0;
  } else {
    const t = performance.now() / 1000;
    beat = (t * bpm) / 60;
  }

  const state = effect.sample(beat);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0908", overflow: "hidden" }}>
      {state.uvOn && (
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse at center, oklch(0.45 0.28 295 / 0.55), transparent 70%)",
          mixBlendMode: "screen", pointerEvents: "none",
        }} />
      )}
      <LightFixture state={state} size={size} mini={mini} />
    </div>
  );
}

export function MiniEffect({ effect, dim }) {
  const hasStrobe = effect.tags.includes("strobe");
  const hasUV = effect.tags.includes("uv");
  return (
    <div className={`mini-eff ${dim ? "dim" : ""}`} title={effect.name}>
      <div className="me-preview">
        <EffectPreview effect={effect} size={36} />
      </div>
      <div className="me-meta">
        <span className="name">{effect.name}</span>
        {hasStrobe && <span className="tag s" title="Strobe">S</span>}
        {hasUV && <span className="tag uv" title="UV">UV</span>}
      </div>
    </div>
  );
}

export function DMXStage({ state }) {
  if (!state) return null;
  return (
    <div className="dmx">
      <div className="uv-wash" style={{ opacity: state.uvOn ? 1 : 0 }} />
      <div className="fixtures">
        <LightFixture state={state} size={150} />
        <LightFixture state={{ ...state, rotation: -state.rotation * 0.95 + 0.3 }} size={150} />
      </div>
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 0, height: "30%",
        background: state.blackout
          ? "linear-gradient(180deg, transparent, rgba(0,0,0,0.6))"
          : `linear-gradient(180deg, transparent, ${state.color === "__rainbow" ? "rgba(255,255,255,0.05)" : state.color}22, ${state.color === "__rainbow" ? "rgba(255,255,255,0.08)" : state.color}11)`,
        pointerEvents: "none",
      }} />
      <div className="mono" style={{ position: "absolute", top: 8, left: 10, fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em" }}>
        DMX OUT · 16 ch
      </div>
      <div className="mono" style={{ position: "absolute", top: 8, right: 10, fontSize: 9, color: state.strobeOn ? "var(--accent)" : state.uvOn ? "var(--uv)" : "rgba(255,255,255,0.4)", letterSpacing: "0.08em" }}>
        {state.strobeOn ? "STROBE" : state.uvOn ? "UV ON" : "● LIVE"}
      </div>
    </div>
  );
}

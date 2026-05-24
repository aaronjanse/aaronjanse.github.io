import { useEffect, useMemo, useRef, useState } from 'react';
import './styles.css';

const BUFFER = 4;
const SEG_PER_SEC = 0.7;

function makeRng(seed) {
  let t = seed | 0;
  return () => {
    t = (t + 0x6D2B79F5) | 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const BURN = 200;

function walkMarkov(uniforms, initBit, pStayOn, pStayOff, len) {
  const out = new Array(len);
  let s = initBit;
  for (let i = 0; i < BURN; i++) {
    const u = uniforms[i];
    s = s === 1 ? (u < pStayOn ? 1 : 0) : (u < pStayOff ? 0 : 1);
  }
  for (let i = 0; i < len; i++) {
    out[i] = s;
    const u = uniforms[BURN + i];
    s = s === 1 ? (u < pStayOn ? 1 : 0) : (u < pStayOff ? 0 : 1);
  }
  return out;
}

function buildUniforms(len, seed) {
  const r = makeRng(seed);
  const out = new Array(len);
  for (let i = 0; i < len; i++) out[i] = r();
  return out;
}

const TOTAL = 600;

export default function StrobeMarkovWidget() {
  const [pStayOn, setPStayOn] = useState(0.85);
  const [pStayOff, setPStayOff] = useState(0.93);
  const [visible, setVisible] = useState(80);
  const [regenKey, setRegenKey] = useState(0);

  const RENDER = visible + BUFFER;

  const pStayOnS = Math.min(0.999, pStayOn);
  const pStayOffS = Math.min(0.999, pStayOff);
  const piOn = (1 - pStayOffS) / ((1 - pStayOffS) + (1 - pStayOnS));

  const markovUniforms = useMemo(
    () => buildUniforms(TOTAL + BURN, 42 + regenKey * 9973),
    [regenKey]
  );
  const markovInit = useMemo(
    () => (makeRng(7 + regenKey * 31)() < 0.5 ? 1 : 0),
    [regenKey]
  );
  const markovSeq = useMemo(
    () => walkMarkov(markovUniforms, markovInit, pStayOn, pStayOff, TOTAL),
    [markovUniforms, markovInit, pStayOn, pStayOff]
  );
  const indepUniforms = useMemo(
    () => buildUniforms(TOTAL, 1337 + regenKey * 7919),
    [regenKey]
  );
  const indepSeq = useMemo(
    () => indepUniforms.map((u) => (u < piOn ? 1 : 0)),
    [indepUniforms, piOn]
  );

  const [pos, setPos] = useState(0);
  const posRef = useRef(pos);
  posRef.current = pos;

  useEffect(() => {
    let raf;
    let last = performance.now();
    const loop = () => {
      const now = performance.now();
      const dt = (now - last) / 1000;
      last = now;
      let next = posRef.current + dt * SEG_PER_SEC;
      if (next >= TOTAL - RENDER - 2) next = 0;
      setPos(next);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const baseIdx = Math.floor(pos);
  const frac = pos - baseIdx;
  const shiftPct = -(frac / RENDER) * 100;
  const stripWidthPct = (RENDER / visible) * 100;

  const visM = markovSeq.slice(baseIdx, baseIdx + visible);
  const visI = indepSeq.slice(baseIdx, baseIdx + visible);
  const pctM = visM.reduce((a, b) => a + b, 0) / visible;
  const pctI = visI.reduce((a, b) => a + b, 0) / visible;

  const renderRow = (seq, kind) => (
    <div className="smk-row-clip">
      <div
        className={`smk-row-strip ${kind}`}
        style={{ width: `${stripWidthPct}%`, transform: `translateX(${shiftPct}%)` }}
      >
        {Array.from({ length: RENDER }).map((_, i) => {
          const idx = baseIdx + i;
          const v = seq[idx] ?? 0;
          const next = seq[idx + 1] ?? 0;
          const changes = v !== next;
          return (
            <div
              key={idx}
              className={`smk-cell ${v ? 'on' : 'off'} ${changes ? 'edge' : ''}`}
              style={{ width: `${100 / RENDER}%` }}
            >
              {v ? <span className="smk-cell-mark">⚡</span> : null}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="lights-widget smk-host">
      <section className="smk">
        <div className="smk-hdr">
          <div>
            <div className="smk-pre mono">strobe scheduling · two-state markov</div>
            <h2>Strobes-on as a sticky coin flip</h2>
            <p>
              Each song boundary, we decide whether strobes are enabled. The top row uses a 2-state markov chain so strobes are "sticky" — you get stretches of strobe-on songs followed by stretches of strobe-off. The bottom row is an i.i.d. coin flip at the same long-run rate, for comparison: same density of strobes, but with no clumping.
            </p>
          </div>
          <button
            type="button"
            className="smk-regen mono"
            onClick={() => setRegenKey((k) => k + 1)}
            title="re-sample both sequences with a fresh seed"
          >
            ↻ resample
          </button>
        </div>

        <div className="smk-controls">
          <div className="smk-ctl">
            <div className="smk-ctl-lbl">
              <span className="lbl mono">P(on → on)</span>
              <span className="v mono">{pStayOn.toFixed(2)}</span>
            </div>
            <input
              type="range" min="0" max="0.99" step="0.01" value={pStayOn}
              className="smk-range"
              onChange={(e) => setPStayOn(parseFloat(e.target.value))}
            />
            <div className="smk-ctl-hint mono">stay strobing</div>
          </div>
          <div className="smk-ctl">
            <div className="smk-ctl-lbl">
              <span className="lbl mono">P(off → off)</span>
              <span className="v mono">{pStayOff.toFixed(2)}</span>
            </div>
            <input
              type="range" min="0" max="0.99" step="0.01" value={pStayOff}
              className="smk-range"
              onChange={(e) => setPStayOff(parseFloat(e.target.value))}
            />
            <div className="smk-ctl-hint mono">stay dark</div>
          </div>
          <div className="smk-ctl">
            <div className="smk-ctl-lbl">
              <span className="lbl mono">songs visible</span>
              <span className="v mono">{visible}</span>
            </div>
            <input
              type="range" min="8" max="80" step="1" value={visible}
              className="smk-range"
              onChange={(e) => setVisible(parseInt(e.target.value, 10))}
            />
            <div className="smk-ctl-hint mono">window width</div>
          </div>
          <div className="smk-stat">
            <div className="smk-stat-lbl mono">π(on) — long-run share</div>
            <div className="smk-stat-v mono">{(piOn * 100).toFixed(1)}%</div>
            <div className="smk-stat-formula mono">
              (1−p<sub>off</sub>) ÷ ((1−p<sub>off</sub>) + (1−p<sub>on</sub>))
            </div>
          </div>
        </div>

        <div className="smk-grid">
          <div className="smk-labels mono">
            <div className="smk-lbl-row">
              <div className="smk-lbl-name">MARKOV</div>
              <div className="smk-lbl-sub">stateful · clumps</div>
              <div className="smk-lbl-pct">{(pctM * 100).toFixed(0)}%</div>
            </div>
            <div className="smk-lbl-row">
              <div className="smk-lbl-name">I.I.D.</div>
              <div className="smk-lbl-sub">π = {(piOn * 100).toFixed(0)}%</div>
              <div className="smk-lbl-pct">{(pctI * 100).toFixed(0)}%</div>
            </div>
          </div>

          <div className="smk-tracks">
            <div className="smk-axis mono">
              <span>← earlier songs</span>
              <span>now →</span>
            </div>
            {renderRow(markovSeq, 'markov')}
            {renderRow(indepSeq, 'indep')}
            <div className="smk-axis-foot mono">
              <span>visible window: {visible} songs</span>
              <span>strobes-on in window →</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

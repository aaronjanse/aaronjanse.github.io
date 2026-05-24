import { useEffect, useRef, useState } from 'react';
import { SONGS } from './data.js';
import { OcrSidecar } from './pipeline.jsx';
import './styles.css';

export default function OcrTestHarness() {
  const song = SONGS[0];
  const [position, setPosition] = useState(48);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [remountKey, setRemountKey] = useState(0);

  const positionRef = useRef(position);
  positionRef.current = position;
  const speedRef = useRef(speed);
  speedRef.current = speed;
  const playingRef = useRef(playing);
  playingRef.current = playing;

  useEffect(() => {
    let raf;
    let last = performance.now();
    const loop = () => {
      const now = performance.now();
      const dt = (now - last) / 1000;
      last = now;
      if (playingRef.current) {
        const next = positionRef.current + dt * speedRef.current;
        setPosition(next >= song.duration ? 0 : next);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [song.duration]);

  const onJump = (s) => setPosition(Math.max(0, Math.min(song.duration - 1, s)));
  const onReset = () => setRemountKey((k) => k + 1);

  const speeds = [0.25, 0.5, 1, 2, 5, 10];

  return (
    <div className="lights-widget">
      <div style={{
        display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap',
        padding: '14px 16px', marginBottom: 16,
        background: 'var(--paper)', border: '1px solid var(--line)',
        borderRadius: 8, fontFamily: 'Geist Mono, monospace', fontSize: 12,
      }}>
        <strong style={{ fontFamily: 'Geist, sans-serif' }}>Test controls</strong>
        <button onClick={() => setPlaying((p) => !p)} style={btn}>
          {playing ? '⏸ pause' : '▶ play'}
        </button>
        <button onClick={onReset} style={btn}>↻ remount widget</button>
        <span style={{ color: 'var(--muted)' }}>position:</span>
        <span data-test="position" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {position.toFixed(2)}s
        </span>
        <span style={{ color: 'var(--muted)' }}>speed:</span>
        {speeds.map((s) => (
          <button
            key={s}
            onClick={() => setSpeed(s)}
            style={{ ...btn, background: Math.abs(speed - s) < 0.001 ? 'var(--ink)' : 'var(--paper)', color: Math.abs(speed - s) < 0.001 ? '#fff' : 'var(--ink)' }}
          >
            {s}×
          </button>
        ))}
        <span style={{ color: 'var(--muted)' }}>jump:</span>
        <button onClick={() => onJump(0)} style={btn}>0:00</button>
        <button onClick={() => onJump(48)} style={btn}>0:48</button>
        <button onClick={() => onJump(120)} style={btn}>2:00</button>
        <button onClick={() => onJump(200)} style={btn}>3:20</button>
      </div>
      <OcrSidecar key={remountKey} song={song} position={position} />
    </div>
  );
}

const btn = {
  padding: '4px 9px',
  border: '1px solid var(--line-strong)',
  borderRadius: 4,
  background: 'var(--paper)',
  color: 'var(--ink)',
  font: 'inherit',
  cursor: 'pointer',
};

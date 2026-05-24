import { useEffect, useMemo, useRef, useState } from 'react';
import { fmtTime } from './data.js';
import { useTick } from './effects.jsx';
import { DmxChannelLayers, computeDmxSpeeds } from './pipeline.jsx';

export function ProjectionSection({ song, plan }) {
  const [seekTarget, setSeekTarget] = useState(60);
  const [speed, setSpeed] = useState(1);
  const wallStartRef = useRef(performance.now());

  useTick();

  const wallElapsed = (performance.now() - wallStartRef.current) / 1000;
  let songPos = seekTarget + wallElapsed * speed;
  if (songPos >= song.duration - 0.5) {
    wallStartRef.current = performance.now();
    songPos = seekTarget;
  }

  const handleSeek = (v) => {
    setSeekTarget(Math.max(0, Math.min(song.duration - 1, v)));
    wallStartRef.current = performance.now();
  };
  const handleSpeed = (s) => {
    setSeekTarget(songPos);
    wallStartRef.current = performance.now();
    setSpeed(s);
  };

  useEffect(() => {
    setSeekTarget(60);
    wallStartRef.current = performance.now();
  }, [song.id]);

  const WALL_HALF = 4;
  const SONG_HALF = WALL_HALF * speed;
  const winStart = songPos - SONG_HALF;
  const winEnd = songPos + SONG_HALF;
  const winClampStart = Math.max(0, winStart);
  const winClampEnd = Math.min(song.duration, winEnd);

  return (
    <section className="proj">
      <header className="proj-hdr">
        <div className="ocr-pre mono">Demo · interactive</div>
        <h2>Plan projection: song-time → wall-clock time</h2>
        <p>
          The lights plan is built once in song-time space — that's the top strip.
          To play it, we sample the plan at <code>position = seek + wall · speed</code>.
          That stretches or compresses the same plan onto wall-clock seconds (bottom strip).
          Change the seek and speed below to see the mapping shift and warp.
        </p>
      </header>

      <div className="proj-block">
        <div className="proj-side mono">
          <span className="t">Song time</span>
          <span className="d">static plan · whole song</span>
        </div>
        <DmxChannelStrip plan={plan} song={song} startSongT={0} endSongT={song.duration} cols={400}>
          <div className="proj-window" style={{
            left: `${(winClampStart / song.duration) * 100}%`,
            width: `${((winClampEnd - winClampStart) / song.duration) * 100}%`,
          }} />
          <div className="proj-playhead" style={{ left: `${(songPos / song.duration) * 100}%` }} />
          <div className="proj-axis mono">
            <span style={{ left: "0%" }}>0:00</span>
            <span style={{ left: "25%", transform: "translateX(-50%)" }}>{fmtTime(song.duration * 0.25)}</span>
            <span style={{ left: "50%", transform: "translateX(-50%)" }}>{fmtTime(song.duration * 0.5)}</span>
            <span style={{ left: "75%", transform: "translateX(-50%)" }}>{fmtTime(song.duration * 0.75)}</span>
            <span style={{ left: "100%", transform: "translateX(-100%)" }}>{fmtTime(song.duration)}</span>
          </div>
        </DmxChannelStrip>
      </div>

      <svg className="proj-lens" viewBox="0 0 1000 50" preserveAspectRatio="none">
        <path
          d={`M ${(winClampStart / song.duration) * 1000} 0 L 0 50`}
          stroke="var(--line-strong)" fill="none" strokeDasharray="3 4"
        />
        <path
          d={`M ${(winClampEnd / song.duration) * 1000} 0 L 1000 50`}
          stroke="var(--line-strong)" fill="none" strokeDasharray="3 4"
        />
        <path
          d={`M ${(songPos / song.duration) * 1000} 0 L 500 50`}
          stroke="var(--accent)" fill="none" strokeWidth="1.2"
        />
      </svg>

      <div className="proj-block">
        <div className="proj-side mono">
          <span className="t">Wall-clock</span>
          <span className="d">@ {speed}× speed</span>
        </div>
        <DmxChannelStrip plan={plan} song={song} startSongT={winStart} endSongT={winEnd} cols={240} wall>
          <div className="proj-playhead" style={{ left: "50%" }} />
          <div className="proj-axis mono">
            <span style={{ left: "0%" }}>−{WALL_HALF.toFixed(0)}s</span>
            <span style={{ left: "50%", transform: "translateX(-50%)" }}>now</span>
            <span style={{ left: "100%", transform: "translateX(-100%)" }}>+{WALL_HALF.toFixed(0)}s</span>
          </div>
        </DmxChannelStrip>
      </div>

      <div className="proj-ctl">
        <div className="proj-ctl-row">
          <span className="ctl-lbl mono">Seek</span>
          <input
            type="range"
            min={0} max={Math.floor(song.duration - 1)} step={0.5}
            value={Math.min(songPos, song.duration - 1)}
            onChange={(e) => handleSeek(parseFloat(e.target.value))}
            className="proj-seek-range"
          />
          <span className="mono ctl-val">{fmtTime(songPos)} / {fmtTime(song.duration)}</span>
        </div>
        <div className="proj-ctl-row">
          <span className="ctl-lbl mono">Speed</span>
          <div className="speed-seg">
            {[0.5, 1, 2, 5].map((s) => (
              <button key={s} className={`mono ${speed === s ? "on" : ""}`}
                      onClick={() => handleSpeed(s)}>{s}×</button>
            ))}
          </div>
          <span className="mono ctl-val">{speed}s of song per wall-second</span>
        </div>
      </div>
    </section>
  );
}

function DmxChannelStrip({ plan, song, startSongT, endSongT, cols = 240, wall, children }) {
  const bpm = song.bpm;
  const duration = Math.max(0.001, endSongT - startSongT);

  const samples = useMemo(() => {
    const out = [];
    for (let i = 0; i < cols; i++) {
      const t = startSongT + (i / cols) * duration;
      if (t < 0 || t >= song.duration) { out.push(null); continue; }
      const item = plan.find((p) => t >= p.section.start && t < p.section.end);
      if (!item) { out.push(null); continue; }
      const beat = (t * bpm) / 60;
      out.push({ t, beat, state: item.effect.sample(beat) });
    }
    return out;
  }, [plan, song.id, startSongT, endSongT, bpm, cols]);

  const { speeds, maxSpeed } = computeDmxSpeeds(samples);

  return (
    <div className={`proj-strip ${wall ? "wall" : ""}`}>
      <div className="proj-labels mono">
        <div className="proj-lbl-row">COLOR <span className="ch">ch 1–3</span></div>
        <div className="proj-lbl-row">SPEED <span className="ch">ch 4</span></div>
        <div className="proj-lbl-row">STROBE <span className="ch">ch 5</span></div>
        <div className="proj-lbl-row">UV <span className="ch">ch 6</span></div>
      </div>
      <div className="proj-strip-body">
        <div className="proj-rows">
          <DmxChannelLayers samples={samples} speeds={speeds} maxSpeed={maxSpeed} cols={cols} />
        </div>
        {children}
      </div>
    </div>
  );
}

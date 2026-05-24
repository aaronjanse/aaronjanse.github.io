import { useEffect, useMemo, useRef, useState } from 'react';
import { EFFECTS, SONGS, generatePlan, makeWaveform } from './data.js';
import {
  PlaybackNode, InputsNode, SongAnalysisNode, PlanNode,
  LivePlaybackNode, FlowArrow,
} from './pipeline.jsx';
import { ProjectionSection } from './projection.jsx';
import './styles.css';

export default function LightsWidget() {
  const [songId, setSongId] = useState(SONGS[0].id);
  const [position, setPosition] = useState(48);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1.0);
  const [timeOfDay, setTimeOfDay] = useState("mid-party");
  const [strobesOn, setStrobesOn] = useState(true);
  const strobiness = strobesOn ? 1 : 0;

  const enabledIds = useMemo(() => new Set(EFFECTS.map((e) => e.id)), []);

  const positionRef = useRef(position);
  positionRef.current = position;

  useEffect(() => {
    let raf;
    let last = performance.now();
    const loop = () => {
      const now = performance.now();
      const dt = (now - last) / 1000;
      last = now;
      if (playing) {
        const next = positionRef.current + dt * speed;
        const song = SONGS.find((s) => s.id === songId);
        if (next >= song.duration) {
          setPosition(0);
        } else {
          setPosition(next);
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed, songId]);

  const song = useMemo(() => SONGS.find((s) => s.id === songId), [songId]);
  const waveform = useMemo(() => makeWaveform(song), [song]);

  const plan = useMemo(
    () => generatePlan(song, { timeOfDay, strobiness, enabledIds }),
    [song, timeOfDay, strobiness, enabledIds]
  );

  const currentSectionIdx = Math.max(0, plan.findIndex((p) => position >= p.section.start && position < p.section.end));
  const currentPlanItem = plan[currentSectionIdx] || plan[0];
  const currentEffect = currentPlanItem.effect;
  const currentSection = currentPlanItem.section;

  const beat = (position * song.bpm) / 60;

  let lightState = currentEffect.sample(beat);

  if (strobesOn && timeOfDay !== "pregame" && currentSection.energy >= 0.7) {
    const isDownbeat = Math.floor(beat) % 4 === 0;
    const phase = beat % 1;
    if (isDownbeat && phase < 0.12) {
      lightState = { ...lightState, strobeOn: true };
    }
  }

  const onTogglePlay = () => setPlaying((p) => !p);
  const onSeek = (s) => setPosition(s);
  const onSpeedChange = (s) => setSpeed(s);
  const onSelectSong = (id) => {
    if (id === songId) return;
    setSongId(id);
    setPosition(0);
  };
  const onTimeChange = (t) => {
    setTimeOfDay(t);
    if (t === "pregame") setStrobesOn(false);
  };
  const onStrobesChange = (v) => {
    if (timeOfDay === "pregame") return;
    setStrobesOn(v);
  };

  return (
    <div className="lights-widget">
      <header className="hdr">
        <div>
          <h1>Party Lights Sync — Architecture</h1>
          <p className="sub">
            How a DJ-friendly lighting pipeline turns a song into a synchronized show.
            Each box below is a stage in the pipeline; everything is interactive — tweak the
            inputs and watch the plan and physical lights respond.
          </p>
        </div>
        <div className="meta">
          <div><span className="k">version</span> &nbsp; v0.4.2</div>
          <div><span className="k">runtime</span> &nbsp; rust + dmx512</div>
          <div><span className="k">fixtures</span> &nbsp; 2× moving head, 1× strobe, 1× uv</div>
        </div>
      </header>

      <div className="pipe">
        <div className="row-controls">
          <PlaybackNode
            song={song} songs={SONGS} position={position} playing={playing} speed={speed}
            onSeek={onSeek} onTogglePlay={onTogglePlay}
            onSpeedChange={onSpeedChange} onSelectSong={onSelectSong}
          />
          <InputsNode
            timeOfDay={timeOfDay} strobesOn={strobesOn}
            onTimeChange={onTimeChange}
            onStrobesChange={onStrobesChange}
          />
        </div>
        <FlowArrow label="track metadata → analysis" />

        <SongAnalysisNode song={song} position={position} waveform={waveform} />
        <FlowArrow label="generate_plan(song, time-of-day, strobes)" />

        <PlanNode plan={plan} song={song} position={position} beat={beat} />
        <FlowArrow label="+ live playback state" />

        <LivePlaybackNode
          plan={plan}
          song={song}
          position={position}
          beat={beat}
          currentEffect={currentEffect}
          currentSection={currentSection}
          state={lightState}
        />
      </div>

      {/* <ProjectionSection song={song} plan={plan} /> */}
    </div>
  );
}

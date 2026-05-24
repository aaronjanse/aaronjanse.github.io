import { useMemo, useState } from 'react';
import { EFFECTS, SONGS, generatePlan, makeWaveform } from './data.js';
import {
  InputsNode, PlanWithAnalysisNode, EffectsPoolNode, FlowArrow,
} from './pipeline.jsx';
import './styles.css';

const FIXED_SONG_ID = "sunset-drive";

export default function EffectsPlanWidget() {
  const [timeOfDay, setTimeOfDay] = useState("mid-party");
  const [strobesOn, setStrobesOn] = useState(true);
  const strobiness = strobesOn ? 1 : 0;

  const enabledIds = useMemo(() => new Set(EFFECTS.map((e) => e.id)), []);

  const song = useMemo(() => SONGS.find((s) => s.id === FIXED_SONG_ID), []);
  const waveform = useMemo(() => makeWaveform(song), [song]);

  const plan = useMemo(
    () => generatePlan(song, { timeOfDay, strobiness, enabledIds }),
    [song, timeOfDay, strobiness, enabledIds]
  );

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
      <div className="pipe">
        <InputsNode
          timeOfDay={timeOfDay} strobesOn={strobesOn}
          onTimeChange={onTimeChange}
          onStrobesChange={onStrobesChange}
        />
        <FlowArrow label="filter effect library by inputs" />

        <EffectsPoolNode
          timeOfDay={timeOfDay} strobiness={strobiness} enabledIds={enabledIds}
        />
        <FlowArrow label="pick one effect per song section (biased by energy)" />

        <PlanWithAnalysisNode plan={plan} song={song} position={null} waveform={waveform} showPlayhead={false} />
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { SONGS } from './data.js';
import { OcrSidecar } from './pipeline.jsx';
import './styles.css';

export default function RekordboxOcrWidget() {
  const song = SONGS[0];
  const [position, setPosition] = useState(48);

  const positionRef = useRef(position);
  positionRef.current = position;

  useEffect(() => {
    let raf;
    let last = performance.now();
    const loop = () => {
      const now = performance.now();
      const dt = (now - last) / 1000;
      last = now;
      const next = positionRef.current + dt;
      setPosition(next >= song.duration ? 0 : next);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [song.duration]);

  return (
    <div className="lights-widget">
      <OcrSidecar song={song} position={position} />
    </div>
  );
}

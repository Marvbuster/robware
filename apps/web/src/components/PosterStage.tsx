import { forwardRef, useEffect, useRef, useState } from 'react';
import type { Aspect, PresetId } from '../types';
import { PosterFrame } from './PosterFrame';

interface PosterStageProps {
  text: string;
  preset: PresetId;
  aspect: Aspect;
  debugGrid?: boolean;
  posterRef: React.Ref<HTMLDivElement>;
}

export const PosterStage = forwardRef<HTMLDivElement, PosterStageProps>(function PosterStage(
  { text, preset, aspect, debugGrid = false, posterRef },
  stageRef,
) {
  const localStageRef = useRef<HTMLDivElement | null>(null);
  const setStageRef = (node: HTMLDivElement | null) => {
    localStageRef.current = node;
    if (typeof stageRef === 'function') stageRef(node);
    else if (stageRef) (stageRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
  };
  const [scale, setScale] = useState(0.4);

  useEffect(() => {
    const stage = localStageRef.current;
    if (!stage) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      const next = Math.min(width / aspect.width, height / aspect.height);
      if (Number.isFinite(next) && next > 0) setScale(next);
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, [aspect.width, aspect.height]);

  return (
    <div ref={setStageRef} className="stage">
      <div
        className="stage-scaler"
        style={{
          width: aspect.width,
          height: aspect.height,
          transform: `scale(${scale})`,
        }}
      >
        <PosterFrame
          ref={posterRef}
          ratio={aspect.ratio}
          preset={preset}
          text={text}
          debugGrid={debugGrid}
        />
      </div>
    </div>
  );
});

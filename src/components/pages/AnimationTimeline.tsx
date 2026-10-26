// src/.../Components/AnimationTimeline.tsx
import React, { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import { Slider } from "@mui/material";
import { observer } from "mobx-react";
import { ModelUIState } from "../../state/ModelUIState";

interface AnimationTimelineProps {
  uiState: ModelUIState;
  rightOffset: number;
}

function AnimationTimeline({ uiState, rightOffset }: AnimationTimelineProps) {
  const vs = uiState.viewerState;
  const idx = vs.currentAnimationIndices[0];
  const anim = vs.animations[idx];

  const min = vs.animationStartTimes[idx] ?? 0;
  const max = anim?.duration ?? 1;

  const [value, setValue] = useState<number>(min);
  const scrubbing = useRef(false);

  // Keep the slider in sync with playback.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (!scrubbing.current) {
        const t = vs.currentAnimationTime;
        if (typeof t === "number") setValue((prev) => (prev === t ? prev : t));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [vs]);

  const handleChange = (_event: Event, v: number | number[]) => {
    const time = Array.isArray(v) ? v[0] : v;
    scrubbing.current = true;
    setValue(time);
    vs.setCurrentAnimationTime(time);
    vs.animationChange = { index: 0, operation: "timeChange" };
    vs.animationsNeedUpdate = true;
  };

  if (!anim) return null;

  return (
    <Box
      component="div"
      sx={{ position: "absolute", bottom: 16, left: 24, right: rightOffset + 24, zIndex: 1001 }}
    >
      <Slider
        value={Math.min(Math.max(value, min), max)}
        min={min}
        max={max}
        step={(max - min) / 1000 || 0.001}
        onChange={handleChange}
        onChangeCommitted={() => {
          scrubbing.current = false;
        }}
        valueLabelDisplay="auto"
        valueLabelFormat={(v) => `${v.toFixed(2)}s`}
      />
    </Box>
  );
}

export default observer(AnimationTimeline);
import React, { useCallback, useRef, useState } from 'react';
import { Box, Tooltip, Typography } from '@mui/material';
import { DollyKeyframe, EasingType } from './dolly.types';
import { snapToKeyframe } from './interpolate';

const EASING_COLORS: Record<EasingType, string> = {
  'linear':      '#4a9eff',
  'ease-in':     '#f7b731',
  'ease-out':    '#20bf6b',
  'ease-in-out': '#a55eea',
  'step':        '#e05555',
};

const DIAMOND_SIZE = 12; // px half-diagonal

interface Props {
  keyframes: DollyKeyframe[];
  duration: number;
  currentTime: number;
  width: number;
  height?: number;
  onScrub: (time: number) => void;
  onKeyframeMove: (id: string, newTime: number) => void;
  onKeyframeSelect: (id: string) => void;
  selectedId: string | null;
}

export function KeyframeTrack({
  keyframes,
  duration,
  currentTime,
  width,
  height = 36,
  onScrub,
  onKeyframeMove,
  onKeyframeSelect,
  selectedId,
}: Props) {
  const trackRef    = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<{ id: string; startX: number; startTime: number } | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const timeToX = (t: number) => (t / duration) * width;
  const xToTime = (x: number) => Math.max(0, Math.min(duration, (x / width) * duration));

  // ── Track click → scrub (only if not dragging a keyframe) ─────────────────
  const handleTrackPointerDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).dataset.kfid) return; // let diamond handle it
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = trackRef.current!.getBoundingClientRect();
    const raw  = xToTime(e.clientX - rect.left);
    onScrub(snapToKeyframe(raw, keyframes, 6, width / duration));
  }, [duration, keyframes, onScrub, width]);

  const handleTrackPointerMove = useCallback((e: React.PointerEvent) => {
    if (draggingRef.current) return; // keyframe drag handled separately
    if (e.buttons !== 1) return;
    const rect = trackRef.current!.getBoundingClientRect();
    const raw  = xToTime(e.clientX - rect.left);
    onScrub(snapToKeyframe(raw, keyframes, 6, width / duration));
  }, [duration, keyframes, onScrub, width]);

  // ── Keyframe diamond drag ──────────────────────────────────────────────────
  const handleDiamondPointerDown = useCallback((e: React.PointerEvent, kf: DollyKeyframe) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    draggingRef.current = { id: kf.id, startX: e.clientX, startTime: kf.time };
    onKeyframeSelect(kf.id);
  }, [onKeyframeSelect]);

  const handleDiamondPointerMove = useCallback((e: React.PointerEvent, kf: DollyKeyframe) => {
    if (!draggingRef.current || draggingRef.current.id !== kf.id) return;
    const dx   = e.clientX - draggingRef.current.startX;
    const dt   = (dx / width) * duration;
    const newT = Math.max(0, Math.min(duration, draggingRef.current.startTime + dt));
    onKeyframeMove(kf.id, newT);
    // Also scrub the playhead to follow the dragged keyframe
    onScrub(newT);
  }, [duration, onKeyframeMove, onScrub, width]);

  const handleDiamondPointerUp = useCallback(() => {
    draggingRef.current = null;
  }, []);

  const playheadX = timeToX(currentTime);

  return (
    <Box component="div"
      ref={trackRef}
      onPointerDown={handleTrackPointerDown}
      onPointerMove={handleTrackPointerMove}
      sx={{
        position: 'relative',
        width,
        height,
        bgcolor: 'rgba(255,255,255,0.03)',
        borderRadius: '3px',
        border: '1px solid rgba(46,49,56,0.8)',
        cursor: 'crosshair',
        userSelect: 'none',
        overflow: 'visible',
        flexShrink: 0,
      }}
    >
      {/* Centre guide line */}
      <Box component="div" sx={{
        position: 'absolute',
        top: '50%', left: 0, right: 0,
        height: '1px',
        bgcolor: 'rgba(46,49,56,0.9)',
        transform: 'translateY(-50%)',
        pointerEvents: 'none',
      }} />

      {/* Segment fills between consecutive keyframes */}
      {[...keyframes]
        .sort((a, b) => a.time - b.time)
        .map((kf, i, arr) => {
          if (i === arr.length - 1) return null;
          const next  = arr[i + 1];
          const x0    = timeToX(kf.time);
          const x1    = timeToX(next.time);
          const color = EASING_COLORS[kf.easing];
          return (
            <Box component="div" key={`seg-${kf.id}`} sx={{
              position: 'absolute',
              top: '50%', left: x0, width: x1 - x0, height: 2,
              transform: 'translateY(-50%)',
              background: `linear-gradient(to right, ${color}55, ${EASING_COLORS[next.easing]}55)`,
              pointerEvents: 'none',
            }} />
          );
        })}

      {/* Keyframe diamonds */}
      {keyframes.map(kf => {
        const x       = timeToX(kf.time);
        const color   = EASING_COLORS[kf.easing];
        const isSelected = selectedId === kf.id;
        const isHovered  = hoveredId  === kf.id;

        return (
          <Tooltip
            key={kf.id}
            title={
              <Box component="div" sx={{ fontSize: 10, lineHeight: 1.6 }}>
                <Typography variant="caption" sx={{ display: 'block', fontFamily: 'monospace', color: '#00d4a0' }}>
                  t = {kf.time.toFixed(3)}s
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', color: '#8b919e' }}>
                  pos [{kf.position.map(v => v.toFixed(2)).join(', ')}]
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', color: '#8b919e' }}>
                  easing: {kf.easing}
                </Typography>
              </Box>
            }
            placement="top"
            arrow
          >
            <Box component="div"
              data-kfid={kf.id}
              onPointerDown={e => handleDiamondPointerDown(e, kf)}
              onPointerMove={e => handleDiamondPointerMove(e, kf)}
              onPointerUp={handleDiamondPointerUp}
              onPointerEnter={() => setHoveredId(kf.id)}
              onPointerLeave={() => setHoveredId(null)}
              sx={{
                position: 'absolute',
                top: '50%',
                left: x,
                width: DIAMOND_SIZE,
                height: DIAMOND_SIZE,
                transform: `translate(-50%, -50%) rotate(45deg)`,
                bgcolor: isSelected ? '#ffffff' : (isHovered ? color : color),
                border: `2px solid ${isSelected ? color : (isHovered ? '#ffffff' : 'rgba(0,0,0,0.5)')}`,
                borderRadius: '2px',
                cursor: 'grab',
                transition: 'background-color 0.1s, transform 0.1s',
                '&:active': { cursor: 'grabbing' },
                zIndex: isSelected ? 3 : 2,
                boxShadow: isSelected
                  ? `0 0 0 2px ${color}88, 0 2px 8px rgba(0,0,0,0.5)`
                  : isHovered ? `0 0 0 1px ${color}44` : 'none',
              }}
            />
          </Tooltip>
        );
      })}

      {/* Playhead */}
      <Box component="div" sx={{
        position: 'absolute',
        top: -4, left: playheadX,
        transform: 'translateX(-50%)',
        pointerEvents: 'none',
        zIndex: 10,
      }}>
        {/* Triangle head */}
        <Box component="div" sx={{
          width: 0, height: 0,
          borderLeft: '5px solid transparent',
          borderRight: '5px solid transparent',
          borderTop: '7px solid #4a9eff',
          mx: 'auto',
        }} />
        {/* Stem */}
        <Box component="div" sx={{
          width: '1px',
          height: height + 4,
          bgcolor: '#4a9eff',
          mx: 'auto',
          opacity: 0.85,
        }} />
      </Box>
    </Box>
  );
}

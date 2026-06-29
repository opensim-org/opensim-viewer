import { useCallback, useEffect, useRef, useState } from 'react';
import { DollyFrame, DollyKeyframe } from './dolly.types';
import { interpolateTimeline } from './interpolate';

export interface UseDollyTimelineOptions {
  keyframes: DollyKeyframe[];
  duration: number;
  /** Called every animation frame while playing, and immediately on scrub */
  onFrame?: (frame: DollyFrame) => void;
}

export interface UseDollyTimelineReturn {
  currentTime: number;
  isPlaying: boolean;
  /** Seek to a specific time (also pauses playback) */
  scrubTo: (time: number) => void;
  /** Start playing from currentTime */
  play: () => void;
  /** Pause at currentTime */
  pause: () => void;
  /** Pause and seek to 0 */
  stop: () => void;
  /** Set playback speed multiplier (default 1) */
  setSpeed: (speed: number) => void;
  speed: number;
  /** Current interpolated frame values */
  frame: DollyFrame | null;
}

export function useDollyTimeline({
  keyframes,
  duration,
  onFrame,
}: UseDollyTimelineOptions): UseDollyTimelineReturn {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying,   setIsPlaying]   = useState(false);
  const [speed,       setSpeedState]  = useState(1);
  const [frame,       setFrame]       = useState<DollyFrame | null>(null);

  // Refs so the RAF callback always has fresh values without re-registering
  const rafRef        = useRef<number | null>(null);
  const lastTsRef     = useRef<number>(0);
  const timeRef       = useRef(0);
  const isPlayingRef  = useRef(false);
  const speedRef      = useRef(1);
  const durationRef   = useRef(duration);
  const keyframesRef  = useRef(keyframes);
  const onFrameRef    = useRef(onFrame);

  // Keep refs in sync with latest props/state
  useEffect(() => { durationRef.current  = duration;   }, [duration]);
  useEffect(() => { keyframesRef.current = keyframes;  }, [keyframes]);
  useEffect(() => { onFrameRef.current   = onFrame;    }, [onFrame]);

  // ── Emit a frame at the current timeRef ────────────────────────────────────
  const emitFrame = useCallback((t: number) => {
    const f = interpolateTimeline(keyframesRef.current, t);
    setFrame(f);
    onFrameRef.current?.(f);
  }, []);

  // ── RAF loop ───────────────────────────────────────────────────────────────
  const tick = useCallback((ts: number) => {
    if (!isPlayingRef.current) return;

    const dt = Math.min(ts - lastTsRef.current, 100); // cap at 100 ms to survive tab-blur
    lastTsRef.current = ts;

    const next = timeRef.current + (dt / 1000) * speedRef.current;

    if (next >= durationRef.current) {
      // Stop at end
      timeRef.current = durationRef.current;
      setCurrentTime(durationRef.current);
      emitFrame(durationRef.current);
      isPlayingRef.current = false;
      setIsPlaying(false);
      return;
    }

    timeRef.current = next;
    setCurrentTime(next);
    emitFrame(next);
    rafRef.current = requestAnimationFrame(tick);
  }, [emitFrame]);

  // ── Public API ─────────────────────────────────────────────────────────────

  const play = useCallback(() => {
    if (isPlayingRef.current) return;
    // If at the end, restart
    if (timeRef.current >= durationRef.current) {
      timeRef.current = 0;
      setCurrentTime(0);
    }
    isPlayingRef.current = true;
    setIsPlaying(true);
    lastTsRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const pause = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    pause();
    timeRef.current = 0;
    setCurrentTime(0);
    emitFrame(0);
  }, [pause, emitFrame]);

  const scrubTo = useCallback((time: number) => {
    const clamped = Math.max(0, Math.min(durationRef.current, time));
    pause(); // pause on manual scrub
    timeRef.current = clamped;
    setCurrentTime(clamped);
    emitFrame(clamped);
  }, [pause, emitFrame]);

  const setSpeed = useCallback((s: number) => {
    speedRef.current = s;
    setSpeedState(s);
  }, []);

  // ── Cleanup ────────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // ── Emit an initial frame when keyframes change while not playing ──────────
  useEffect(() => {
    if (!isPlayingRef.current) emitFrame(timeRef.current);
  }, [keyframes, emitFrame]);

  return { currentTime, isPlaying, scrubTo, play, pause, stop, setSpeed, speed, frame };
}

// ─── Easing functions ─────────────────────────────────────────────────────────

import { DollyFrame, DollyKeyframe, EasingType, Vec3 } from "./dolly.types";

const easingFns: Record<EasingType, (t: number) => number> = {
  'linear':      t => t,
  'ease-in':     t => t * t * t,
  'ease-out':    t => 1 - Math.pow(1 - t, 3),
  'ease-in-out': t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  'step':        t => t < 1 ? 0 : 1,
};

export function applyEasing(t: number, type: EasingType): number {
  return easingFns[type]?.(Math.max(0, Math.min(1, t))) ?? t;
}

// ─── Scalar / vec3 lerp ───────────────────────────────────────────────────────

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpVec3(a: Vec3, b: Vec3, t: number): Vec3 {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

// ─── Catmull-Rom for smooth multi-keyframe splines ────────────────────────────
// Uses the standard centripetal Catmull-Rom formulation.
// p0/p3 are phantom control points (or clamped at endpoints).

function catmullRom(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (
    (2 * p1) +
    (-p0 + p2) * t +
    (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
    (-p0 + 3 * p1 - 3 * p2 + p3) * t3
  );
}

function catmullRomVec3(p0: Vec3, p1: Vec3, p2: Vec3, p3: Vec3, t: number): Vec3 {
  return [
    catmullRom(p0[0], p1[0], p2[0], p3[0], t),
    catmullRom(p0[1], p1[1], p2[1], p3[1], t),
    catmullRom(p0[2], p1[2], p2[2], p3[2], t),
  ];
}

// ─── Main interpolate function ────────────────────────────────────────────────

export function interpolateTimeline(
  keyframes: DollyKeyframe[],
  time: number,
): DollyFrame {
  const sorted = [...keyframes].sort((a, b) => a.time - b.time);

  // Edge cases
  if (sorted.length === 0) {
    return { time, position:[0,1,5], target:[0,0,0], fov:50, roll:0, segmentIndex:0, segmentT:0 };
  }
  if (sorted.length === 1) {
    const k = sorted[0];
    return { time, position:k.position, target:k.target, fov:k.fov, roll:k.roll, segmentIndex:0, segmentT:0 };
  }

  const first = sorted[0];
  const last  = sorted[sorted.length - 1];

  // Clamp beyond endpoints
  if (time <= first.time) {
    return { time:first.time, position:first.position, target:first.target, fov:first.fov, roll:first.roll, segmentIndex:0, segmentT:0 };
  }
  if (time >= last.time) {
    const i = sorted.length - 1;
    return { time:last.time, position:last.position, target:last.target, fov:last.fov, roll:last.roll, segmentIndex:i, segmentT:1 };
  }

  // Find the segment [k1 → k2] that contains `time`
  let segIdx = 0;
  for (let i = 0; i < sorted.length - 1; i++) {
    if (time >= sorted[i].time && time < sorted[i + 1].time) {
      segIdx = i; break;
    }
  }

  const k1 = sorted[segIdx];
  const k2 = sorted[segIdx + 1];
  const k0 = sorted[Math.max(0, segIdx - 1)];
  const k3 = sorted[Math.min(sorted.length - 1, segIdx + 2)];

  const rawT = (time - k1.time) / (k2.time - k1.time);
  const t    = applyEasing(rawT, k1.easing);

  // Use Catmull-Rom for position & target (smooth paths), lerp for scalars
  const position = catmullRomVec3(k0.position, k1.position, k2.position, k3.position, t);
  const target   = catmullRomVec3(k0.target,   k1.target,   k2.target,   k3.target,   t);
  const fov      = lerp(k1.fov,  k2.fov,  t);
  const roll     = lerp(k1.roll, k2.roll, t);

  return { time, position, target, fov, roll, segmentIndex: segIdx, segmentT: rawT };
}

// ─── Sample the full timeline into N evenly-spaced points (for path preview) ──

export function sampleTimeline(
  keyframes: DollyKeyframe[],
  duration: number,
  samples = 120,
): DollyFrame[] {
  if (keyframes.length < 2) return [];
  return Array.from({ length: samples + 1 }, (_, i) => {
    const t = (i / samples) * duration;
    return interpolateTimeline(keyframes, t);
  });
}

// ─── Snap a raw time to the nearest keyframe if within threshold ──────────────

export function snapToKeyframe(
  time: number,
  keyframes: DollyKeyframe[],
  thresholdPx: number,
  pixelsPerSecond: number,
): number {
  const thresholdSec = thresholdPx / pixelsPerSecond;
  for (const kf of keyframes) {
    if (Math.abs(kf.time - time) <= thresholdSec) return kf.time;
  }
  return time;
}

// ─── Produce a unique short ID ────────────────────────────────────────────────

let _seq = 0;
export function newId(): string {
  return `kf_${Date.now().toString(36)}_${(++_seq).toString(36)}`;
}

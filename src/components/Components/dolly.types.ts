// ─── Core dolly types ─────────────────────────────────────────────────────────

export type Vec3 = [number, number, number];

export type EasingType =
  | 'linear'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'step';

export interface DollyKeyframe {
  /** Unique stable ID (used as React key and for mutations) */
  id: string;
  /** Position in seconds along the timeline */
  time: number;
  position: Vec3;
  target: Vec3;
  /** Degrees */
  fov: number;
  /** Degrees — roll around the forward axis */
  roll: number;
  /** Easing to apply from this keyframe toward the next */
  easing: EasingType;
}

export interface DollyTrack {
  id: string;
  name: string;
  /** Total duration in seconds */
  duration: number;
  captureMode: 'continuous' | 'burst' | 'timelapse';
  keyframes: DollyKeyframe[];
}

/** Values produced each tick by the interpolator */
export interface DollyFrame {
  time: number;
  position: Vec3;
  target: Vec3;
  fov: number;
  roll: number;
  /** Index of the keyframe segment we are inside (left bound) */
  segmentIndex: number;
  /** 0–1 progress within that segment */
  segmentT: number;
}

import type { Stage, ScareEffect } from '../game/types';

export interface SceneProps {
  /** Current game stage */
  stage: Stage | string;
  /** Ship progress percentage (0 - 100 or 0 - 1) */
  progress?: number;
  /** True during alarm scare or emergency */
  isAlarm?: boolean;
  /** List of active hazards (e.g. 'solar_flare', 'micro_meteor') */
  activeEvents?: string[];
  /** True when engines are actively burning */
  isBurning?: boolean;
  /** Active scare effect */
  scare?: ScareEffect | { type: string; durationMs: number } | null;
  /** Ship location identifier */
  location?: string;
  /** Optional container class name */
  className?: string;
}

export interface PlanetProps {
  type: 'earth' | 'mars' | 'moon' | 'sun';
  position?: [number, number, number];
  scale?: number;
  rotationSpeed?: number;
}

export interface SpaceshipProps {
  progress?: number;
  isBurning?: boolean;
  isDamaged?: boolean;
  hasSilhouette?: boolean;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}

export interface OrbitLineProps {
  progress?: number;
  startPos?: [number, number, number];
  endPos?: [number, number, number];
  peakHeight?: number;
  color?: string;
}

export interface RoverProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  deployed?: boolean;
}

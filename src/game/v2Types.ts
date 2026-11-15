import { NovaMood, NovaResponseType, ScareEvent, HistoryItem } from './types';

export type ActId = 0 | 1 | 2 | 3 | 4;

export type EntitySkin = 'orb' | 'crate' | 'rock' | 'ship' | 'creature' | 'station';

export type EntityBehavior = 'follow' | 'orbit' | 'collect' | 'hazard' | 'decor' | 'shoot';

export type EntityEffect = 'heal' | 'fuel' | 'shield' | 'reveal_path' | 'none';

export type EntityPreset =
  | 'supply_crate'
  | 'repair_drone'
  | 'escort_fighter'
  | 'beacon_satellite'
  | 'wormhole_shortcut'
  | 'derelict_ship'
  | 'asteroids'
  | 'ghost_ship';

export interface GameEntity {
  id: string;
  preset?: EntityPreset;
  skin: EntitySkin;
  behavior: EntityBehavior;
  label: string;
  effect: EntityEffect;
  position: [number, number, number];
  velocity: [number, number, number];
  rotation: [number, number, number];
  radius: number;
  createdAt: number;
  lifetimeMs?: number;
  hp?: number;
}

export interface PlayerFlightState {
  position: [number, number, number];
  velocity: [number, number, number];
  rotation: [number, number, number]; // pitch, yaw, roll in radians
  angularVelocity: [number, number, number]; // pitchRate, yawRate, rollRate in rad/s
  speed: number;
  hullPct: number;
  fuelPct: number;
  shieldSeconds: number;
  boostMultiplier: number;
  isBoosting: boolean;
  isBraking: boolean;
  controlsRestricted: boolean;
}

export interface V2Loadout {
  fuelTank: number; // 0..3 points
  hullArmor: number; // 0..3 points
  sciencePayload: number; // 0..3 points
  summonCharges: number; // 0..3 points
}

export interface Waypoint {
  id: string;
  position: [number, number, number];
  radius: number;
  label: string;
  act: ActId;
  reached: boolean;
}

export interface V2GameSnapshot {
  act: ActId;
  objective: string;
  hullPct: number;
  fuelPct: number;
  summonCharges: number;
  maxSummonCharges: number;
  trust: number;
  mood: NovaMood;
  liveEntities: Record<string, number>;
  nearestHazardMeters: number;
  recentEvents: string[];
}

export interface V2TurnRequest {
  playerText?: string;
  audio?: {
    mimeType: string;
    base64: string;
  };
  snapshot: V2GameSnapshot;
  history: HistoryItem[];
  settings: {
    scareLevel: number;
  };
}

export interface V2Action {
  name: string;
  args: Record<string, any>;
}

export interface V2TurnResponse {
  transcript?: string;
  nova: {
    line: string;
    responseType: NovaResponseType;
    mood: NovaMood;
  };
  actions: V2Action[];
  trustDelta?: number;
  scare?: ScareEvent | null;
  error?: string | null;
}

export type V2Ending = 'copilot' | 'professional' | 'lockout' | 'lost_in_the_dark';

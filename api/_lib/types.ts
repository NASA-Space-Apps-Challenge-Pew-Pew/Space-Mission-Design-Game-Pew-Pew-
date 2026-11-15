// CONTRACT.md (V2: Real-Time Flight & Voice Summoning) Types

export type Mood = 'playful' | 'calm' | 'annoyed' | 'cold';

export type ResponseType = 'grant' | 'grant_with_cost' | 'twist' | 'refuse' | 'prank';

export type ScareType = 'alarm' | 'blackout' | 'silhouette' | 'flicker';

export type EntitySkin = 'orb' | 'crate' | 'rock' | 'ship' | 'creature' | 'station';

export type EntityBehavior = 'follow' | 'orbit' | 'collect' | 'hazard' | 'decor' | 'shoot';

export type EntityEffect = 'heal' | 'fuel' | 'shield' | 'reveal_path' | 'none';

export type PlacementType = 'ahead' | 'around' | 'behind' | 'near_player' | 'near_target';

export type HazardType = 'solar_flare' | 'meteor_shower' | 'dust';

export type PresetEntity =
  | 'supply_crate'
  | 'repair_drone'
  | 'escort_fighter'
  | 'beacon_satellite'
  | 'wormhole_shortcut'
  | 'derelict_ship'
  | 'asteroids'
  | 'ghost_ship';

export interface CustomEntityDef {
  skin: EntitySkin;
  behavior: EntityBehavior;
  label: string;
  effect: EntityEffect;
}

export interface ClientSnapshot {
  act: number; // 0..4
  objective: string;
  hullPct: number; // 0..100
  fuelPct: number; // 0..100
  summonCharges: number; // 0..maxSummonCharges
  maxSummonCharges: number; // default 5
  trust: number; // 0..100
  mood: Mood;
  liveEntities: Record<string, number>; // preset name -> active count
  nearestHazardMeters: number;
  recentEvents: string[];
}

export interface AudioPayload {
  mimeType: string;
  base64: string;
}

export interface HistoryItem {
  role: 'player' | 'nova';
  text: string;
}

export interface TurnSettings {
  scareLevel?: number; // 0: off, 1: mild, 2: full
}

export interface TurnRequest {
  playerText?: string;
  audio?: AudioPayload;
  snapshot: ClientSnapshot;
  history?: HistoryItem[];
  settings?: TurnSettings;
  mock?: boolean;
}

export interface NovaDialogue {
  line: string;
  responseType: ResponseType;
  mood: Mood;
}

export interface ActionRecord {
  name: string;
  args: Record<string, unknown>;
  ok?: boolean;
  note?: string;
  chargeCost?: number;
}

export interface ScarePayload {
  type: ScareType;
  durationMs: number;
}

export interface TurnResponse {
  transcript: string;
  nova: NovaDialogue;
  actions: ActionRecord[];
  trustDelta: number;
  scare: ScarePayload | null;
  error: string | null;
  state?: any;
}

export type GameState = any;

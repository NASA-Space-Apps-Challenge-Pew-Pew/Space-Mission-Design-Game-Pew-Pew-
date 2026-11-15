// CONTRACT.md V2 (Source of Truth) Types

export type Stage = 'design' | 'launch' | 'transit' | 'arrival' | 'surface' | 'ended';
export type ActNumber = 0 | 1 | 2 | 3 | 4;
export type Status = 'playing' | 'won' | 'lost';
export type Mood = 'playful' | 'calm' | 'annoyed' | 'cold';
export type ShipSystem = 'engines' | 'life_support' | 'comms' | 'power' | 'hull' | 'navigation';
export type ResponseType = 'grant' | 'grant_with_cost' | 'twist' | 'refuse' | 'prank';
export type ScareType = 'alarm' | 'blackout' | 'silhouette' | 'flicker';

export type EntitySkin = 'orb' | 'crate' | 'rock' | 'ship' | 'creature' | 'station';
export type EntityBehavior = 'follow' | 'orbit' | 'collect' | 'hazard' | 'decor' | 'shoot';
export type EntityEffect = 'heal' | 'fuel' | 'shield' | 'reveal_path' | 'none';
export type PlacementType = 'ahead' | 'around' | 'behind' | 'near_player' | 'near_target';

// Backward-compatible type aliases
export type GameStatus = Status;
export type NovaMood = Mood;
export type NovaResponseType = ResponseType;
export type ScareTypeEnum = ScareType;

export interface CustomEntitySpec {
  skin: EntitySkin;
  behavior: EntityBehavior;
  label: string;
  effect: EntityEffect;
}

export interface ClientSnapshot {
  act: ActNumber;
  objective: string;
  hullPct: number;
  fuelPct: number;
  summonCharges: number;
  maxSummonCharges: number;
  trust: number;
  mood: Mood;
  liveEntities: Record<string, number>;
  nearestHazardMeters: number;
  recentEvents: string[];
}

export interface TurnAudioPayload {
  mimeType: string;
  base64: string;
}

export interface HistoryItem {
  role: 'player' | 'nova';
  text: string;
  responseType?: ResponseType;
  timestamp?: number;
}

export interface TurnAction {
  name: string;
  args: Record<string, any>;
  ok?: boolean;
  note?: string;
}

export type ActionRecord = TurnAction;

export interface ScareEffect {
  type: ScareType;
  durationMs: number;
}

export type ScareEvent = ScareEffect;

// V2 Turn Request
export interface TurnRequest {
  playerText?: string;
  audio?: TurnAudioPayload;
  snapshot: ClientSnapshot;
  history: HistoryItem[];
  settings: {
    scareLevel: number;
  };
  // Backwards compatibility with V1 callers
  state?: any;
}

// V2 Turn Response
export interface TurnResponse {
  transcript?: string;
  nova: {
    line: string;
    responseType: ResponseType;
    mood: Mood;
  };
  actions: TurnAction[];
  trustDelta?: number;
  scare: ScareEffect | null;
  events?: string[];
  error: string | null;
  // Backwards compatibility with V1 state
  state?: any;
}

export interface GameSettings {
  scareLevel: number; // 0: off, 1: mild, 2: full
  volume: number; // 0..1
  voiceEnabled: boolean;
  autoSpeak: boolean;
}

// V1 compatibility structures
export interface GameResources {
  fuelKg: number;
  fuelMaxKg: number;
  oxygenPct: number;
  powerPct: number;
  hullPct: number;
  budgetM: number;
  supplyDays: number;
}
export type Resources = GameResources;

export interface ShipState {
  location: string;
  progress: number;
  payloadKg: number;
  launchWindowId: string | null;
}

export interface NovaState {
  trust: number;
  mood: Mood;
  lockedSystems: ShipSystem[];
}

export interface Objective {
  id: string;
  text: string;
  done: boolean;
}

export interface GameState {
  version: number;
  stage: Stage;
  day: number;
  totalTripDays: number;
  resources: GameResources;
  ship: ShipState;
  nova: NovaState;
  activeEvents: string[];
  objective: Objective;
  status: Status;
  lossReason: string | null;
  scareLevel: number;
}

export const INITIAL_GAME_STATE: GameState = {
  version: 2,
  stage: 'design',
  day: 0,
  totalTripDays: 210,
  resources: {
    fuelKg: 1000,
    fuelMaxKg: 1000,
    oxygenPct: 100,
    powerPct: 100,
    hullPct: 100,
    budgetM: 500,
    supplyDays: 300,
  },
  ship: {
    location: 'earth',
    progress: 0,
    payloadKg: 200,
    launchWindowId: null,
  },
  nova: {
    trust: 60,
    mood: 'calm',
    lockedSystems: [],
  },
  activeEvents: [],
  objective: {
    id: 'reach_mars',
    text: 'Choose a launch window',
    done: false,
  },
  status: 'playing',
  lossReason: null,
  scareLevel: 1,
};

export const INITIAL_CLIENT_SNAPSHOT: ClientSnapshot = {
  act: 0,
  objective: "Awaken and calibrate flight controls",
  hullPct: 100,
  fuelPct: 100,
  summonCharges: 5,
  maxSummonCharges: 5,
  trust: 60,
  mood: 'calm',
  liveEntities: {},
  nearestHazardMeters: 999,
  recentEvents: []
};

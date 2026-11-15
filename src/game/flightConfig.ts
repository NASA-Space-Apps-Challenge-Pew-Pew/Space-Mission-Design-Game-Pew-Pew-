/**
 * Flight Configuration & Tuning Constants
 * All values can be tuned live via the lil-gui debug panel.
 */

export interface FlightConfig {
  // Speed & Propulsion
  maxSpeed: number;
  boostMaxSpeed: number;
  autoCruiseSpeed: number;
  acceleration: number;
  boostAcceleration: number;
  brakeDeceleration: number;
  linearDrag: number;

  // Angular Rates & Flight Model
  yawRate: number;
  pitchRate: number;
  rollRate: number;
  angularAcceleration: number;
  angularDamping: number;
  bankingStrength: number;

  // Input Shaping
  deadzone: number;
  inputExponent: number;
  mouseSensitivityX: number;
  mouseSensitivityY: number;
  invertX: boolean;
  invertY: boolean;

  // Waypoint Steering Assist
  steeringAssist: boolean;
  assistStrength: number;
  assistMaxAngleDeg: number;

  // Camera Settings
  cameraLag: number;
  cameraDistance: number;
  cameraHeight: number;
  cameraLookAhead: number;
  fovBase: number;
  fovMax: number;

  // Audio & Haptics
  engineAudioEnabled: boolean;
  hapticsEnabled: boolean;
}

// Defaults tuned so a new player can easily complete the tutorial rings in under 60 seconds
export const DEFAULT_FLIGHT_CONFIG: FlightConfig = {
  // Speed & Propulsion
  maxSpeed: 24.0,              // Crisp, responsive cruising speed
  boostMaxSpeed: 46.0,         // High-speed boost thrill
  autoCruiseSpeed: 16.0,       // Effortless navigation on mobile
  acceleration: 28.0,          // Quick throttle response
  boostAcceleration: 52.0,     // Strong thrust surge
  brakeDeceleration: 38.0,     // Rapid, controlled braking
  linearDrag: 0.91,            // Predictable stopping within ~1.5 seconds of releasing throttle

  // Angular Rates (Turn Rates rad/s)
  yawRate: 2.2,                // ~126 deg/sec max yaw rate
  pitchRate: 1.8,              // ~103 deg/sec max pitch rate
  rollRate: 2.6,               // Responsive roll
  angularAcceleration: 16.0,   // Fast turn initiation
  angularDamping: 8.5,         // Smooth, no-overshoot angular settling
  bankingStrength: 0.45,       // Visually satisfying aircraft banking into turns

  // Input Shaping & Non-inverted defaults
  deadzone: 0.08,              // 8% central deadzone eliminates stick drift
  inputExponent: 1.5,          // Mild exponential curve: micro-precision near center, full turn at edge
  mouseSensitivityX: 0.0026,   // Smooth mouse yaw
  mouseSensitivityY: 0.0022,   // Smooth mouse pitch
  invertX: false,              // Moving right TURNS RIGHT (non-inverted)
  invertY: false,              // Moving up PITCHES UP (non-inverted)

  // Waypoint Steering Assist
  steeringAssist: true,        // Enabled by default in tutorial and early acts
  assistStrength: 0.42,        // Gentle magnetic pull towards next waypoint ring
  assistMaxAngleDeg: 60.0,     // Only assists when ring is within 60 deg forward cone

  // Camera
  cameraLag: 0.12,             // Smooth spring chase follow
  cameraDistance: 10.5,        // Comfortable view of ship
  cameraHeight: 3.2,           // Elevated third-person angle
  cameraLookAhead: 35.0,       // Looking forward toward target
  fovBase: 52.0,               // Standard FOV at resting speed
  fovMax: 70.0,                // Dynamic FOV widening at max boost

  // Audio & Haptics
  engineAudioEnabled: true,
  hapticsEnabled: true,
};

// Local storage key for saving player inverted / assist preferences
const STORAGE_KEY = 'dear_nova_flight_config';

export function loadSavedFlightConfig(): FlightConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_FLIGHT_CONFIG, ...parsed };
    }
  } catch (e) {
    // ignore
  }
  return { ...DEFAULT_FLIGHT_CONFIG };
}

export function saveFlightConfig(config: Partial<FlightConfig>): void {
  try {
    const current = loadSavedFlightConfig();
    const merged = { ...current, ...config };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch (e) {
    // ignore
  }
}

// Active singleton instance for live in-game tuning
export const flightConfig: FlightConfig = loadSavedFlightConfig();

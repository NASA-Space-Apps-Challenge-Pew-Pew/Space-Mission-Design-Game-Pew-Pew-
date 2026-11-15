import { flightConfig, type FlightConfig } from './flightConfig.ts';

export interface FlightInputState {
  throttle: number;   // -1..1 (W/S or auto-cruise)
  strafe: number;     // -1..1 (A/D or stick edge)
  pitch: number;      // -1..1
  yaw: number;        // -1..1
  boost: boolean;     // Shift or boost button
  brake: boolean;     // Space or brake button
  isMobile: boolean;
}

export interface FlightKinematics {
  position: [number, number, number];
  velocity: [number, number, number];
  rotation: [number, number, number]; // [pitch, yaw, roll] in radians
  angularVelocity: [number, number, number]; // [pitchRate, yawRate, rollRate] in rad/s
  speed: number;
}

/**
 * Applies deadzone and exponential response curve to input values
 */
export function applyDeadzoneAndCurve(value: number, deadzone: number, exponent: number): number {
  const absVal = Math.abs(value);
  if (absVal <= deadzone) return 0;
  const scaled = (absVal - deadzone) / (1 - deadzone);
  const curved = Math.pow(scaled, exponent);
  return Math.sign(value) * curved;
}

/**
 * Computes forward vector from yaw and pitch angles.
 * Heading convention:
 * yaw = 0, pitch = 0 -> (0, 0, -1) (forward)
 * yaw = +PI/2         -> (+1, 0, 0) (right)
 * yaw = -PI/2         -> (-1, 0, 0) (left)
 * pitch = +PI/2       -> (0, +1, 0) (up)
 */
export function computeForwardVector(yaw: number, pitch: number): [number, number, number] {
  const cosP = Math.cos(pitch);
  const fx = Math.sin(yaw) * cosP;
  const fy = Math.sin(pitch);
  const fz = -Math.cos(yaw) * cosP;
  return [fx, fy, fz];
}

/**
 * Computes right vector perpendicular to forward vector on horizontal plane
 */
export function computeRightVector(yaw: number): [number, number, number] {
  return [Math.cos(yaw), 0, Math.sin(yaw)];
}

/**
 * Evaluates soft steering assist toward a target waypoint
 */
export function computeSteeringAssist(
  currentPos: [number, number, number],
  currentYaw: number,
  currentPitch: number,
  targetPos: [number, number, number],
  config: FlightConfig
): { yawAssist: number; pitchAssist: number } {
  if (!config.steeringAssist) return { yawAssist: 0, pitchAssist: 0 };

  const dx = targetPos[0] - currentPos[0];
  const dy = targetPos[1] - currentPos[1];
  const dz = targetPos[2] - currentPos[2];
  const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (dist < 1.0) return { yawAssist: 0, pitchAssist: 0 };

  const dirX = dx / dist;
  const dirY = dy / dist;
  const dirZ = dz / dist;

  const [fx, fy, fz] = computeForwardVector(currentYaw, currentPitch);
  const dot = fx * dirX + fy * dirY + fz * dirZ;

  const maxAngleCos = Math.cos((config.assistMaxAngleDeg * Math.PI) / 180);
  if (dot < maxAngleCos) {
    return { yawAssist: 0, pitchAssist: 0 };
  }

  // Calculate desired yaw towards target
  const targetYaw = Math.atan2(dirX, -dirZ);
  let deltaYaw = targetYaw - currentYaw;
  // Normalize angle difference to -PI..PI
  while (deltaYaw > Math.PI) deltaYaw -= Math.PI * 2;
  while (deltaYaw < -Math.PI) deltaYaw += Math.PI * 2;

  // Calculate desired pitch towards target
  const targetPitch = Math.asin(Math.max(-1, Math.min(1, dirY)));
  const deltaPitch = targetPitch - currentPitch;

  return {
    yawAssist: Math.max(-1, Math.min(1, deltaYaw * 1.5)) * config.assistStrength,
    pitchAssist: Math.max(-1, Math.min(1, deltaPitch * 1.5)) * config.assistStrength,
  };
}

/**
 * Main Flight Step Simulation
 */
export function stepFlightPhysics(
  current: FlightKinematics,
  input: FlightInputState,
  targetWaypoint: [number, number, number] | null,
  dt: number,
  config: FlightConfig = flightConfig
): FlightKinematics {
  let [px, py, pz] = current.position;
  let [vx, vy, vz] = current.velocity;
  let [pitch, yaw, roll] = current.rotation;
  let [pitchRate, yawRate, rollRate] = current.angularVelocity;

  // 1. Process Steering Inputs with Deadzone & Curve
  let rawYaw = applyDeadzoneAndCurve(input.yaw, config.deadzone, config.inputExponent);
  let rawPitch = applyDeadzoneAndCurve(input.pitch, config.deadzone, config.inputExponent);

  // Invert options
  if (config.invertX) rawYaw = -rawYaw;
  if (config.invertY) rawPitch = -rawPitch;

  // Compute Target Turn Rates
  let targetYawRate = rawYaw * config.yawRate;
  let targetPitchRate = rawPitch * config.pitchRate;

  // Waypoint Steering Assist
  if (targetWaypoint) {
    const assist = computeSteeringAssist([px, py, pz], yaw, pitch, targetWaypoint, config);
    targetYawRate += assist.yawAssist;
    targetPitchRate += assist.pitchAssist;
  }

  // Angular Acceleration & Damping
  yawRate += (targetYawRate - yawRate) * Math.min(1.0, config.angularAcceleration * dt);
  pitchRate += (targetPitchRate - pitchRate) * Math.min(1.0, config.angularAcceleration * dt);

  if (Math.abs(rawYaw) < 0.01) {
    yawRate *= Math.max(0, 1.0 - config.angularDamping * dt);
  }
  if (Math.abs(rawPitch) < 0.01) {
    pitchRate *= Math.max(0, 1.0 - config.angularDamping * dt);
  }

  // Integrate Rotations
  yaw += yawRate * dt;
  pitch = Math.max(-1.15, Math.min(1.15, pitch + pitchRate * dt));

  // Aerodynamic Banking Roll (aircraft banks into yaw turns)
  const targetRoll = -yawRate * config.bankingStrength;
  rollRate += (targetRoll - roll) * Math.min(1.0, 10.0 * dt);
  roll += rollRate * dt;

  // 2. Thrust & Linear Velocity along Forward Vector
  const [fx, fy, fz] = computeForwardVector(yaw, pitch);
  const [rx, , rz] = computeRightVector(yaw);

  let forwardThrust = input.throttle;
  // Mobile auto-cruise: if player isn't reversing/braking, maintain autoCruiseSpeed
  if (input.isMobile && Math.abs(input.throttle) < 0.1 && !input.brake) {
    forwardThrust = 0.6;
  }

  // Active braking
  if (input.brake) {
    forwardThrust = 0;
    const currentSpeed = Math.sqrt(vx * vx + vy * vy + vz * vz);
    if (currentSpeed > 0.1) {
      const brakeFactor = Math.min(currentSpeed, config.brakeDeceleration * dt);
      vx -= (vx / currentSpeed) * brakeFactor;
      vy -= (vy / currentSpeed) * brakeFactor;
      vz -= (vz / currentSpeed) * brakeFactor;
    }
  } else {
    // Normal / Boost acceleration
    const accel = input.boost ? config.boostAcceleration : config.acceleration;
    vx += (fx * forwardThrust + rx * input.strafe) * accel * dt;
    vy += (fy * forwardThrust) * accel * dt;
    vz += (fz * forwardThrust + rz * input.strafe) * accel * dt;
  }

  // Speed-based linear drag
  const currentSpeed = Math.sqrt(vx * vx + vy * vy + vz * vz);
  const dragRatio = Math.pow(config.linearDrag, dt * 60);
  vx *= dragRatio;
  vy *= dragRatio;
  vz *= dragRatio;

  // Max Speed Clamping
  const topSpeed = input.boost ? config.boostMaxSpeed : config.maxSpeed;
  const newSpeed = Math.sqrt(vx * vx + vy * vy + vz * vz);
  if (newSpeed > topSpeed) {
    const scale = topSpeed / newSpeed;
    vx *= scale;
    vy *= scale;
    vz *= scale;
  }

  // Position update
  px += vx * dt;
  py += vy * dt;
  pz += vz * dt;

  return {
    position: [px, py, pz],
    velocity: [vx, vy, vz],
    rotation: [pitch, yaw, roll],
    angularVelocity: [pitchRate, yawRate, rollRate],
    speed: Math.sqrt(vx * vx + vy * vy + vz * vz),
  };
}

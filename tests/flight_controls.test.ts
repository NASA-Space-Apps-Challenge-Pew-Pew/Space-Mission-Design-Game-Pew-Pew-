import {
  stepFlightPhysics,
  computeForwardVector,
  applyDeadzoneAndCurve,
  FlightKinematics,
  FlightInputState,
} from '../src/game/flightModel';
import { DEFAULT_FLIGHT_CONFIG } from '../src/game/flightConfig';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[TEST FAILED]: ${message}`);
  }
}

function runFlightTests() {
  console.log('==================================================');
  console.log('[TEST] Running Flight Controls Verification Suite');
  console.log('==================================================');

  // Test 1: Forward vector at neutral angles
  const [f0x, f0y, f0z] = computeForwardVector(0, 0);
  assert(Math.abs(f0x) < 0.001, 'Neutral forward X must be 0');
  assert(Math.abs(f0y) < 0.001, 'Neutral forward Y must be 0');
  assert(Math.abs(f0z - (-1)) < 0.001, 'Neutral forward Z must be -1');
  console.log('✓ Test 1: Neutral forward heading vector is (0, 0, -1)');

  // Test 2: Moving right gives a RIGHT turn
  const initialKinematics: FlightKinematics = {
    position: [0, 0, 0],
    velocity: [0, 0, 0],
    rotation: [0, 0, 0],
    angularVelocity: [0, 0, 0],
    speed: 0,
  };

  const rightTurnInput: FlightInputState = {
    throttle: 1.0,
    strafe: 0,
    pitch: 0,
    yaw: 1.0, // Moving right
    boost: false,
    brake: false,
    isMobile: false,
  };

  let state = initialKinematics;
  const dt = 0.016; // 60 fps step
  for (let i = 0; i < 15; i++) {
    state = stepFlightPhysics(state, rightTurnInput, null, dt, DEFAULT_FLIGHT_CONFIG);
  }

  // After right input, yaw rate and yaw must be positive
  assert(state.angularVelocity[1] > 0, `Yaw rate must be positive on right input, got ${state.angularVelocity[1]}`);
  assert(state.rotation[1] > 0, `Yaw angle must be positive on right turn, got ${state.rotation[1]}`);

  // Forward vector must point towards +X (Right)
  const [rightFwdX, , rightFwdZ] = computeForwardVector(state.rotation[1], state.rotation[0]);
  assert(rightFwdX > 0, `Right turn forward vector X must be positive (+X is right), got ${rightFwdX}`);
  assert(state.velocity[0] > 0, `Ship velocity X must move right (+X), got ${state.velocity[0]}`);
  console.log(`✓ Test 2: Right input turns ship RIGHT (Yaw: +${state.rotation[1].toFixed(3)} rad, Fwd.X: +${rightFwdX.toFixed(3)}, Vel.X: +${state.velocity[0].toFixed(3)})`);

  // Test 3: Moving left gives a LEFT turn
  const leftTurnInput: FlightInputState = {
    throttle: 1.0,
    strafe: 0,
    pitch: 0,
    yaw: -1.0, // Moving left
    boost: false,
    brake: false,
    isMobile: false,
  };

  let leftState = initialKinematics;
  for (let i = 0; i < 15; i++) {
    leftState = stepFlightPhysics(leftState, leftTurnInput, null, dt, DEFAULT_FLIGHT_CONFIG);
  }

  const [leftFwdX] = computeForwardVector(leftState.rotation[1], leftState.rotation[0]);
  assert(leftFwdX < 0, `Left turn forward vector X must be negative (-X is left), got ${leftFwdX}`);
  assert(leftState.velocity[0] < 0, `Ship velocity X must move left (-X), got ${leftState.velocity[0]}`);
  console.log(`✓ Test 3: Left input turns ship LEFT (Yaw: ${leftState.rotation[1].toFixed(3)} rad, Fwd.X: ${leftFwdX.toFixed(3)})`);

  // Test 4: Invert X toggle
  const invertedConfig = { ...DEFAULT_FLIGHT_CONFIG, invertX: true };
  let invertState = initialKinematics;
  for (let i = 0; i < 15; i++) {
    invertState = stepFlightPhysics(invertState, rightTurnInput, null, dt, invertedConfig);
  }
  const [invFwdX] = computeForwardVector(invertState.rotation[1], invertState.rotation[0]);
  assert(invFwdX < 0, `With Invert X enabled, right input must turn left, got ${invFwdX}`);
  console.log('✓ Test 4: Invert X toggle inverts yaw turn direction accurately');

  // Test 5: Drag & Braking predictably stops the ship
  let movingShip: FlightKinematics = {
    position: [0, 0, 0],
    velocity: [0, 0, -25], // Moving forward at 25 m/s
    rotation: [0, 0, 0],
    angularVelocity: [0, 0, 0],
    speed: 25,
  };

  const brakeInput: FlightInputState = {
    throttle: 0,
    strafe: 0,
    pitch: 0,
    yaw: 0,
    boost: false,
    brake: true,
    isMobile: false,
  };

  for (let i = 0; i < 60; i++) {
    movingShip = stepFlightPhysics(movingShip, brakeInput, null, dt, DEFAULT_FLIGHT_CONFIG);
  }
  assert(movingShip.speed < 1.0, `Brake must bring ship to near stop within 1 second, current speed: ${movingShip.speed}`);
  console.log(`✓ Test 5: Space brake brings ship to predictable stop (Speed dropped to: ${movingShip.speed.toFixed(2)} m/s)`);

  // Test 6: Deadzone response curve
  const deadzoneVal = applyDeadzoneAndCurve(0.04, 0.08, 1.5);
  assert(deadzoneVal === 0, 'Inputs below deadzone must evaluate to 0');
  const fullVal = applyDeadzoneAndCurve(1.0, 0.08, 1.5);
  assert(Math.abs(fullVal - 1.0) < 0.01, 'Input of 1.0 must evaluate to 1.0');
  console.log('✓ Test 6: Deadzone and exponential response curve verified');

  console.log('==================================================');
  console.log('ALL FLIGHT CONTROL TESTS PASSED (100% SUCCESS)');
  console.log('==================================================');
}

runFlightTests();

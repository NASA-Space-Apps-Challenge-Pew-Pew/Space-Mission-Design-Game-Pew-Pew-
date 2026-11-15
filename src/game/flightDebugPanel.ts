import GUI from 'lil-gui';
import { flightConfig, saveFlightConfig, DEFAULT_FLIGHT_CONFIG } from './flightConfig';

let guiInstance: GUI | null = null;

export function initFlightDebugPanel(): GUI {
  if (guiInstance) return guiInstance;

  const gui = new GUI({ title: 'Flight Tuning Debug Panel', closeFolders: true });
  gui.domElement.style.position = 'fixed';
  gui.domElement.style.top = '10px';
  gui.domElement.style.right = '10px';
  gui.domElement.style.zIndex = '9999';

  // 1. Propulsion & Speed Folder
  const fSpeed = gui.addFolder('Propulsion & Speeds');
  fSpeed.add(flightConfig, 'maxSpeed', 5, 60, 1).name('Max Speed').onChange(() => saveFlightConfig(flightConfig));
  fSpeed.add(flightConfig, 'boostMaxSpeed', 10, 100, 1).name('Boost Max Speed').onChange(() => saveFlightConfig(flightConfig));
  fSpeed.add(flightConfig, 'autoCruiseSpeed', 0, 40, 1).name('Mobile Auto-Cruise').onChange(() => saveFlightConfig(flightConfig));
  fSpeed.add(flightConfig, 'acceleration', 5, 80, 1).name('Acceleration').onChange(() => saveFlightConfig(flightConfig));
  fSpeed.add(flightConfig, 'boostAcceleration', 10, 120, 1).name('Boost Accel').onChange(() => saveFlightConfig(flightConfig));
  fSpeed.add(flightConfig, 'brakeDeceleration', 5, 80, 1).name('Brake Strength').onChange(() => saveFlightConfig(flightConfig));
  fSpeed.add(flightConfig, 'linearDrag', 0.80, 0.99, 0.01).name('Linear Drag').onChange(() => saveFlightConfig(flightConfig));

  // 2. Flight Model & Turn Rates Folder
  const fTurn = gui.addFolder('Turn Rates & Damping');
  fTurn.add(flightConfig, 'yawRate', 0.5, 6.0, 0.1).name('Yaw Rate (rad/s)').onChange(() => saveFlightConfig(flightConfig));
  fTurn.add(flightConfig, 'pitchRate', 0.5, 5.0, 0.1).name('Pitch Rate (rad/s)').onChange(() => saveFlightConfig(flightConfig));
  fTurn.add(flightConfig, 'rollRate', 0.5, 6.0, 0.1).name('Roll Rate (rad/s)').onChange(() => saveFlightConfig(flightConfig));
  fTurn.add(flightConfig, 'angularAcceleration', 2.0, 40.0, 1.0).name('Angular Accel').onChange(() => saveFlightConfig(flightConfig));
  fTurn.add(flightConfig, 'angularDamping', 2.0, 25.0, 0.5).name('Angular Damping').onChange(() => saveFlightConfig(flightConfig));
  fTurn.add(flightConfig, 'bankingStrength', 0.0, 1.0, 0.02).name('Roll Banking').onChange(() => saveFlightConfig(flightConfig));

  // 3. Input Shaping & Inversion Folder
  const fInput = gui.addFolder('Input & Inversion');
  fInput.add(flightConfig, 'invertX').name('Invert X (Yaw)').onChange(() => saveFlightConfig(flightConfig));
  fInput.add(flightConfig, 'invertY').name('Invert Y (Pitch)').onChange(() => saveFlightConfig(flightConfig));
  fInput.add(flightConfig, 'deadzone', 0.0, 0.35, 0.01).name('Stick Deadzone').onChange(() => saveFlightConfig(flightConfig));
  fInput.add(flightConfig, 'inputExponent', 1.0, 3.0, 0.1).name('Response Curve Exp').onChange(() => saveFlightConfig(flightConfig));
  fInput.add(flightConfig, 'mouseSensitivityX', 0.0005, 0.01, 0.0002).name('Mouse Sens X').onChange(() => saveFlightConfig(flightConfig));
  fInput.add(flightConfig, 'mouseSensitivityY', 0.0005, 0.01, 0.0002).name('Mouse Sens Y').onChange(() => saveFlightConfig(flightConfig));

  // 4. Waypoint Assist Folder
  const fAssist = gui.addFolder('Steering Assist');
  fAssist.add(flightConfig, 'steeringAssist').name('Assist Enabled').onChange(() => saveFlightConfig(flightConfig));
  fAssist.add(flightConfig, 'assistStrength', 0.0, 1.0, 0.05).name('Assist Strength').onChange(() => saveFlightConfig(flightConfig));
  fAssist.add(flightConfig, 'assistMaxAngleDeg', 10, 90, 5).name('Assist Cone Deg').onChange(() => saveFlightConfig(flightConfig));

  // 5. Camera Folder
  const fCam = gui.addFolder('Chase Camera & FOV');
  fCam.add(flightConfig, 'cameraLag', 0.01, 0.35, 0.01).name('Camera Lag').onChange(() => saveFlightConfig(flightConfig));
  fCam.add(flightConfig, 'cameraDistance', 5.0, 25.0, 0.5).name('Distance Behind').onChange(() => saveFlightConfig(flightConfig));
  fCam.add(flightConfig, 'cameraHeight', 1.0, 8.0, 0.2).name('Height Above').onChange(() => saveFlightConfig(flightConfig));
  fCam.add(flightConfig, 'fovBase', 40, 80, 1).name('FOV Base').onChange(() => saveFlightConfig(flightConfig));
  fCam.add(flightConfig, 'fovMax', 55, 100, 1).name('FOV Boost Max').onChange(() => saveFlightConfig(flightConfig));

  // Reset Button
  gui.add({ reset: () => {
    Object.assign(flightConfig, DEFAULT_FLIGHT_CONFIG);
    saveFlightConfig(flightConfig);
    gui.controllersRecursive().forEach(c => c.updateDisplay());
  }}, 'reset').name('Reset to Defaults');

  // Hide by default unless opened via key or debug toggle
  gui.hide();

  // Keyboard shortcut: Backquote / Tilde (~) toggles GUI
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Backquote' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
      if (gui._hidden) gui.show();
      else gui.hide();
    }
  });

  guiInstance = gui;
  return gui;
}

export function toggleFlightDebugPanel() {
  if (!guiInstance) {
    initFlightDebugPanel().show();
    return;
  }
  if (guiInstance._hidden) {
    guiInstance.show();
  } else {
    guiInstance.hide();
  }
}

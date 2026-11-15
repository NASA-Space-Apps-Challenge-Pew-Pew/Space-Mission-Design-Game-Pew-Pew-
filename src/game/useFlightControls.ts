import { useEffect, useRef, useCallback } from 'react';
import { useV2Store } from './v2Store';
import { flightConfig } from './flightConfig';
import { flightAudioHaptics } from './flightAudioHaptics';

export function useFlightControls() {
  const { updatePhysics, startVoiceRecording, stopVoiceRecording, isRecordingVoice } = useV2Store();

  const keys = useRef<Record<string, boolean>>({});
  const mobileInputs = useRef<{
    steerYaw: number;
    steerPitch: number;
    strafe: number;
    throttle: number;
    boost: boolean;
    brake: boolean;
    isMobileActive: boolean;
  }>({
    steerYaw: 0,
    steerPitch: 0,
    strafe: 0,
    throttle: 0,
    boost: false,
    brake: false,
    isMobileActive: false,
  });

  const mouseSteer = useRef<{ pitch: number; yaw: number }>({ pitch: 0, yaw: 0 });
  const isPointerLocked = useRef(false);

  useEffect(() => {
    // Initialize Web Audio upon user gesture
    const handleFirstInteraction = () => {
      flightAudioHaptics.initAudio();
      window.removeEventListener('keydown', handleFirstInteraction);
      window.removeEventListener('mousedown', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };

    window.addEventListener('keydown', handleFirstInteraction);
    window.addEventListener('mousedown', handleFirstInteraction);
    window.addEventListener('touchstart', handleFirstInteraction);

    return () => {
      window.removeEventListener('keydown', handleFirstInteraction);
      window.removeEventListener('mousedown', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, []);

  // Keyboard and Mouse Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      keys.current[e.code] = true;

      // 'V' key push-to-talk
      if (e.code === 'KeyV' && !e.repeat && !isRecordingVoice) {
        startVoiceRecording();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      keys.current[e.code] = false;

      if (e.code === 'KeyV' && isRecordingVoice) {
        stopVoiceRecording();
      }
    };

    // Mouse movement steering
    const handleMouseMove = (e: MouseEvent) => {
      if (['BUTTON', 'INPUT'].includes((e.target as HTMLElement)?.tagName)) return;

      // Mouse right (movementX > 0) turns RIGHT
      // Mouse up (movementY < 0 in browser DOM) pitches UP
      const yawDelta = e.movementX * flightConfig.mouseSensitivityX * 60;
      const pitchDelta = -e.movementY * flightConfig.mouseSensitivityY * 60;

      mouseSteer.current.yaw += yawDelta;
      mouseSteer.current.pitch += pitchDelta;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isRecordingVoice, startVoiceRecording, stopVoiceRecording]);

  // Main 60 fps local physics loop
  useEffect(() => {
    let lastTime = performance.now();
    let animId: number;

    const loop = (currentTime: number) => {
      const dt = Math.min(0.08, (currentTime - lastTime) / 1000);
      lastTime = currentTime;

      const k = keys.current;
      const mob = mobileInputs.current;

      // Desktop Throttle (W = +1, S = -0.6)
      let throttle = 0;
      if (k['KeyW']) throttle += 1.0;
      if (k['KeyS']) throttle -= 0.6;

      // Desktop Strafe (A = -1, D = +1)
      let strafe = 0;
      if (k['KeyA']) strafe -= 1.0;
      if (k['KeyD']) strafe += 1.0;

      // Steering: Mouse + Arrow keys
      let pitch = mouseSteer.current.pitch;
      let yaw = mouseSteer.current.yaw;

      if (k['ArrowUp']) pitch += 0.8;
      if (k['ArrowDown']) pitch -= 0.8;
      if (k['ArrowLeft']) yaw -= 0.8;
      if (k['ArrowRight']) yaw += 0.8;

      // Shift = Boost, Space = Brake
      let boost = Boolean(k['ShiftLeft'] || k['ShiftRight']);
      let brake = Boolean(k['Space']);

      // Decay mouse delta over 1-2 frames
      mouseSteer.current.pitch *= 0.35;
      mouseSteer.current.yaw *= 0.35;

      // Merge Mobile Inputs if active
      if (mob.isMobileActive) {
        throttle = mob.throttle;
        strafe = mob.strafe;
        yaw += mob.steerYaw;
        pitch += mob.steerPitch;
        if (mob.boost) boost = true;
        if (mob.brake) brake = true;
      }

      updatePhysics(dt, {
        throttle: Math.max(-1, Math.min(1, throttle)),
        strafe: Math.max(-1, Math.min(1, strafe)),
        pitch: Math.max(-1.5, Math.min(1.5, pitch)),
        yaw: Math.max(-1.5, Math.min(1.5, yaw)),
        boost,
        brake,
        isMobile: mob.isMobileActive,
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [updatePhysics]);

  // Mobile joystick steers pitch & yaw, and strafes at outer horizontal edges
  const setMobileJoystick = useCallback((normX: number, normY: number) => {
    mobileInputs.current.isMobileActive = true;
    mobileInputs.current.steerYaw = normX;
    mobileInputs.current.steerPitch = normY;

    // Edge strafe when joystick is pushed past 75% horizontally
    if (Math.abs(normX) > 0.75) {
      mobileInputs.current.strafe = Math.sign(normX) * ((Math.abs(normX) - 0.75) / 0.25);
    } else {
      mobileInputs.current.strafe = 0;
    }
  }, []);

  const setMobileBoost = useCallback((b: boolean) => {
    mobileInputs.current.isMobileActive = true;
    mobileInputs.current.boost = b;
  }, []);

  const setMobileBrake = useCallback((b: boolean) => {
    mobileInputs.current.isMobileActive = true;
    mobileInputs.current.brake = b;
  }, []);

  return {
    setMobileJoystick,
    setMobileBoost,
    setMobileBrake,
  };
}

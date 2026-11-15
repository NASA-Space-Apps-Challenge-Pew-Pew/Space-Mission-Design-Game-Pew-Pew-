import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// Global shake event listener system
type ShakeListener = (intensity: number, durationMs: number) => void;
const shakeListeners: Set<ShakeListener> = new Set();

/**
 * Trigger an impact or explosion camera shake from anywhere in the codebase.
 * @param intensity 0.1 (subtle rumble) to 2.0 (massive hull collision)
 * @param durationMs Duration in milliseconds (default: 400ms)
 */
export function triggerShake(intensity = 1.0, durationMs = 400) {
  shakeListeners.forEach((fn) => fn(intensity, durationMs));
}

export interface CameraShakeProps {
  isBoosting?: boolean;
  baseBoostIntensity?: number;
  decayRate?: number;
}

export function CameraShake({
  isBoosting = false,
  baseBoostIntensity = 0.05,
  decayRate = 5.0,
}: CameraShakeProps) {
  const { camera } = useThree();
  const currentTrauma = useRef(0); // 0 to 1
  const shakeOffset = useRef(new THREE.Vector3());

  useEffect(() => {
    const handleShake: ShakeListener = (intensity) => {
      // Add trauma (capped at 1.5)
      currentTrauma.current = Math.min(1.5, currentTrauma.current + intensity);
    };

    shakeListeners.add(handleShake);
    return () => {
      shakeListeners.delete(handleShake);
    };
  }, []);

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime;

    // Decay trauma over time
    if (currentTrauma.current > 0.001) {
      currentTrauma.current = Math.max(0, currentTrauma.current - delta * decayRate);
    }

    // Boost continuous vibration
    const boostShake = isBoosting ? baseBoostIntensity : 0;
    const totalShake = (currentTrauma.current ** 2) + boostShake;

    if (totalShake > 0.001) {
      // High-frequency pseudo-random Perlin-like oscillation
      const offsetX = (Math.sin(t * 35) + Math.cos(t * 47)) * 0.5 * totalShake * 0.4;
      const offsetY = (Math.cos(t * 38) + Math.sin(t * 53)) * 0.5 * totalShake * 0.3;
      const offsetZ = Math.sin(t * 42) * 0.5 * totalShake * 0.2;

      // Apply delta offset to camera position
      camera.position.x += offsetX - shakeOffset.current.x;
      camera.position.y += offsetY - shakeOffset.current.y;
      camera.position.z += offsetZ - shakeOffset.current.z;

      shakeOffset.current.set(offsetX, offsetY, offsetZ);
    } else if (shakeOffset.current.lengthSq() > 0.0001) {
      // Reset camera offset
      camera.position.sub(shakeOffset.current);
      shakeOffset.current.set(0, 0, 0);
    }
  });

  return null;
}

import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { triggerShake } from './CameraShake';

export { triggerShake };

export interface ChaseCameraProps {
  targetPosition: [number, number, number];
  targetRotation?: [number, number, number]; // [pitch, yaw, roll]
  isBoosting?: boolean;
  distance?: number;
  height?: number;
  lookAhead?: number;
}

export function ChaseCamera({
  targetPosition,
  targetRotation = [0, 0, 0],
  isBoosting = false,
  distance = 5.5,
  height = 1.8,
  lookAhead = 10.0,
}: ChaseCameraProps) {
  const { camera } = useThree();
  const currentPos = useRef(
    new THREE.Vector3(targetPosition[0], targetPosition[1] + height, targetPosition[2] + distance)
  );
  const currentLookAt = useRef(
    new THREE.Vector3(targetPosition[0], targetPosition[1], targetPosition[2] - lookAhead)
  );

  useFrame((_, delta) => {
    const [px, py, pz] = targetPosition;
    const [pitch, yaw, roll] = targetRotation;

    // Calculate forward & up vectors based on ship yaw/pitch
    const euler = new THREE.Euler(pitch, yaw, roll, 'YXZ');
    const forward = new THREE.Vector3(0, 0, -1).applyEuler(euler);
    const up = new THREE.Vector3(0, 1, 0).applyEuler(euler);

    // Camera sits behind and above ship
    const targetCamPos = new THREE.Vector3(px, py, pz)
      .sub(forward.clone().multiplyScalar(isBoosting ? distance * 1.15 : distance))
      .add(up.clone().multiplyScalar(height));

    // Look ahead point along flight direction
    const targetLook = new THREE.Vector3(px, py, pz).add(
      forward.clone().multiplyScalar(lookAhead)
    );

    // Smooth damping (lerp)
    const lerpFactor = Math.min(delta * 8.0, 0.25);
    currentPos.current.lerp(targetCamPos, lerpFactor);
    currentLookAt.current.lerp(targetLook, lerpFactor);

    camera.position.copy(currentPos.current);
    camera.lookAt(currentLookAt.current);
  });

  return null;
}

import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface StageCameraControllerProps {
  stage: string;
}

export function StageCameraController({ stage }: StageCameraControllerProps) {
  const { camera } = useThree();
  const currentPos = useRef(new THREE.Vector3().copy(camera.position));
  const currentLookAt = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((_, delta) => {
    const targetPos = new THREE.Vector3();
    const targetLookAt = new THREE.Vector3();

    switch (stage) {
      case 'design':
        // Close Earth parking orbit inspection view
        targetPos.set(0, 1.2, 5.0);
        targetLookAt.set(0, 0, 0);
        break;

      case 'launch':
        // Dynamic chase angle behind ship accelerating away
        targetPos.set(0, -0.8, 4.5);
        targetLookAt.set(0, 0.4, 0);
        break;

      case 'transit':
        // Wide interplanetary overview showing Earth, Mars, and the Hohmann arc
        targetPos.set(0, 2.0, 8.5);
        targetLookAt.set(0, 0.5, 0);
        break;

      case 'arrival':
        // Mars orbit insertion & descent perspective
        targetPos.set(2.5, 1.0, 5.0);
        targetLookAt.set(2.8, 0, -1);
        break;

      case 'surface':
        // Ground-level panoramic view on Martian surface
        targetPos.set(0, 1.2, 3.8);
        targetLookAt.set(0, 0.6, 0);
        break;

      case 'ended':
      default:
        // Grand pulled-back vista
        targetPos.set(0, 3.0, 9.5);
        targetLookAt.set(0, 0, 0);
        break;
    }

    // Smooth lerp (damped camera interpolation)
    const lerpFactor = Math.min(delta * 2.5, 0.1);
    currentPos.current.lerp(targetPos, lerpFactor);
    currentLookAt.current.lerp(targetLookAt, lerpFactor);

    camera.position.copy(currentPos.current);
    camera.lookAt(currentLookAt.current);
  });

  return null;
}

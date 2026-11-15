import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export interface BoostFeedbackProps {
  isBoosting?: boolean;
  baseFov?: number;
  boostFov?: number;
}

export function BoostFeedback({
  isBoosting = false,
  baseFov = 55,
  boostFov = 68,
}: BoostFeedbackProps) {
  const { camera } = useThree();
  const prevBoosting = useRef(false);
  const flashAlpha = useRef(0);
  const flashMesh = useRef<THREE.Mesh>(null);
  const currentFovPunch = useRef(0);

  // Boost start event trigger
  useEffect(() => {
    if (isBoosting && !prevBoosting.current) {
      // Just triggered boost!
      flashAlpha.current = 0.65; // Short bright flash
      currentFovPunch.current = 6.0; // Sudden FOV punch
    }
    prevBoosting.current = isBoosting;
  }, [isBoosting]);

  // Flash texture with soft radial falloff
  const flashTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(64, 64, 10, 64, 64, 64);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      grad.addColorStop(0.3, 'rgba(56, 189, 248, 0.5)');
      grad.addColorStop(1, 'rgba(14, 165, 233, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 128);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, []);

  useFrame((_, delta) => {
    // 1. Fade flash
    if (flashAlpha.current > 0.005) {
      flashAlpha.current = Math.max(0, flashAlpha.current - delta * 5.5); // Fades in ~180ms
    }
    if (flashMesh.current) {
      const mat = flashMesh.current.material as THREE.MeshBasicMaterial;
      mat.opacity = flashAlpha.current;
      flashMesh.current.visible = flashAlpha.current > 0.005;
      flashMesh.current.position.set(0, 0, -0.5);
    }

    // 2. Damped FOV Punch Return
    if (currentFovPunch.current > 0.01) {
      currentFovPunch.current = Math.max(0, currentFovPunch.current - delta * 12.0);
    }

    // 3. Apply Camera FOV with punch
    if ('fov' in camera && typeof (camera as THREE.PerspectiveCamera).fov === 'number') {
      const pCam = camera as THREE.PerspectiveCamera;
      const targetFov = (isBoosting ? boostFov : baseFov) + currentFovPunch.current;
      pCam.fov += (targetFov - pCam.fov) * Math.min(delta * 12, 0.3);
      pCam.updateProjectionMatrix();
    }
  });

  return (
    <mesh ref={flashMesh}>
      <planeGeometry args={[1.6, 1.2]} />
      <meshBasicMaterial
        map={flashTexture}
        transparent
        opacity={0}
        blending={THREE.AdditiveBlending}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}

/**
 * Custom hook to manage engine thermal cooldown glow after boost
 */
export function useBoostCooldown(isBoosting: boolean) {
  const [cooldown, setCooldown] = useState(0);
  const wasBoosting = useRef(false);
  const cooldownVal = useRef(0);

  useFrame((_, delta) => {
    if (wasBoosting.current && !isBoosting) {
      // Just ceased boosting: ignite thermal cooldown heat
      cooldownVal.current = 1.0;
    }
    wasBoosting.current = isBoosting;

    if (cooldownVal.current > 0.005) {
      cooldownVal.current = Math.max(0, cooldownVal.current - delta * 0.6); // Dissipates over ~1.6s
      setCooldown(cooldownVal.current);
    } else if (cooldown !== 0) {
      setCooldown(0);
    }
  });

  return cooldown;
}

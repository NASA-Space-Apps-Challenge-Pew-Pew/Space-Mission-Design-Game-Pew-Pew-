import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { triggerShake } from './CameraShake';

type HitListener = (intensity: number, impactPoint?: [number, number, number]) => void;
const hitListeners: Set<HitListener> = new Set();

/**
 * Trigger collision/hit feedback (vignette flash, sparks, camera shake, brief slowdown).
 * @param intensity 0.2 to 2.0
 * @param impactPoint optional world space coordinate of collision
 */
export function triggerHitFeedback(
  intensity = 1.0,
  impactPoint?: [number, number, number],
  onSlowdown?: (slowdownMs: number) => void
) {
  hitListeners.forEach((fn) => fn(intensity, impactPoint));
  triggerShake(intensity * 0.8, 450);

  // Optional arcade hit-stop / micro slowdown (e.g. 60-100ms)
  if (onSlowdown) {
    onSlowdown(Math.min(120, Math.round(intensity * 75)));
  }
}

// ---------------------------------------------------------------------
// 1. IN-CANVAS RED EDGE VIGNETTE FLASH
// ---------------------------------------------------------------------
export function HitVignette() {
  const { camera } = useThree();
  const meshRef = useRef<THREE.Mesh>(null);
  const flashAlpha = useRef(0);

  useEffect(() => {
    const handleHit: HitListener = (intensity) => {
      flashAlpha.current = Math.min(1.0, flashAlpha.current + intensity * 0.7);
    };
    hitListeners.add(handleHit);
    return () => {
      hitListeners.delete(handleHit);
    };
  }, []);

  // Simple radial gradient vignette texture
  const vignetteTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(64, 64, 30, 64, 64, 64);
      grad.addColorStop(0, 'rgba(239, 68, 68, 0)');
      grad.addColorStop(0.6, 'rgba(220, 38, 38, 0.2)');
      grad.addColorStop(1, 'rgba(185, 28, 28, 0.9)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 128);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, []);

  useFrame((_, delta) => {
    if (flashAlpha.current > 0.005) {
      flashAlpha.current = Math.max(0, flashAlpha.current - delta * 3.5); // Fades in ~300ms
    }
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = flashAlpha.current * 0.85;
      meshRef.current.visible = flashAlpha.current > 0.005;

      // Stick right in front of camera lens
      meshRef.current.position.set(0, 0, -0.6);
      meshRef.current.rotation.set(0, 0, 0);
    }
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[1.6, 1.2]} />
      <meshBasicMaterial
        map={vignetteTexture}
        transparent
        opacity={0}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}

// ---------------------------------------------------------------------
// 2. COLLISION IMPACT SPARKS
// ---------------------------------------------------------------------
export function ImpactSparks({ count = 35 }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  const activeParticles = useRef<{
    pos: THREE.Vector3;
    vel: THREE.Vector3;
    life: number;
  }[]>([]);

  useEffect(() => {
    const handleHit: HitListener = (intensity, impactPoint) => {
      const origin = impactPoint
        ? new THREE.Vector3(...impactPoint)
        : new THREE.Vector3(0, 0, -0.5);

      const spawnCount = Math.min(count, Math.round(count * intensity));
      for (let i = 0; i < spawnCount; i++) {
        const vel = new THREE.Vector3(
          (Math.random() - 0.5) * 8 * intensity,
          (Math.random() - 0.5) * 8 * intensity,
          (Math.random() - 0.5) * 8 * intensity
        );
        activeParticles.current.push({
          pos: origin.clone(),
          vel,
          life: 0.4 + Math.random() * 0.4,
        });
      }
    };

    hitListeners.add(handleHit);
    return () => {
      hitListeners.delete(handleHit);
    };
  }, [count]);

  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      col[i * 3] = 1.0;
      col[i * 3 + 1] = 0.7; // Bright orange/yellow
      col[i * 3 + 2] = 0.2;
    }
    return { positions: pos, colors: col };
  }, [count]);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return g;
  }, [positions, colors]);

  const mat = useMemo(() => {
    return new THREE.PointsMaterial({
      size: 0.22,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position;
    const array = posAttr.array as Float32Array;

    // Advance live spark particles
    for (let i = activeParticles.current.length - 1; i >= 0; i--) {
      const p = activeParticles.current[i];
      p.life -= delta;
      if (p.life <= 0) {
        activeParticles.current.splice(i, 1);
        continue;
      }
      p.pos.addScaledVector(p.vel, delta);
      p.vel.multiplyScalar(0.92); // Drag
    }

    // Populate buffer
    for (let i = 0; i < count; i++) {
      if (i < activeParticles.current.length) {
        const p = activeParticles.current[i];
        array[i * 3] = p.pos.x;
        array[i * 3 + 1] = p.pos.y;
        array[i * 3 + 2] = p.pos.z;
      } else {
        array[i * 3] = 9999; // Move inactive off-screen
        array[i * 3 + 1] = 9999;
        array[i * 3 + 2] = 9999;
      }
    }
    posAttr.needsUpdate = true;
  });

  return <points ref={pointsRef} geometry={geo} material={mat} />;
}

// ---------------------------------------------------------------------
// 3. COMBINED HIT FEEDBACK COMPONENT
// ---------------------------------------------------------------------
export function HitFeedback() {
  return (
    <group>
      <HitVignette />
      <ImpactSparks />
    </group>
  );
}

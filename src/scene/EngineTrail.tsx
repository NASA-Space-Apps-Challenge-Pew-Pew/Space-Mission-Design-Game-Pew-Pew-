import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface EngineTrailProps {
  throttle?: number; // 0 (idle) to 1 (full forward)
  isBoosting?: boolean;
  cooldownGlow?: number; // 0 to 1 thermal heat dissipating after boost
  nozzleOffsets?: [number, number, number][];
}

export function EngineTrail({
  throttle = 0.5,
  isBoosting = false,
  cooldownGlow = 0.0,
  nozzleOffsets = [
    [-0.28, 0, 0.65],
    [0.28, 0, 0.65],
  ],
}: EngineTrailProps) {
  const flameL = useRef<THREE.Mesh>(null);
  const flameR = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const trailPointsRef = useRef<THREE.Points>(null);

  // Pre-allocate particle buffer for engine wake trail
  const trailCount = 50;
  const { positions, velocities, lifetimes } = useMemo(() => {
    const pos = new Float32Array(trailCount * 3);
    const vel = new Float32Array(trailCount * 3);
    const life = new Float32Array(trailCount);

    for (let i = 0; i < trailCount; i++) {
      // Alternate between left and right engine nozzles
      const nozzle = nozzleOffsets[i % nozzleOffsets.length];
      pos[i * 3] = nozzle[0] + (Math.random() - 0.5) * 0.08;
      pos[i * 3 + 1] = nozzle[1] + (Math.random() - 0.5) * 0.08;
      pos[i * 3 + 2] = nozzle[2] + Math.random() * 0.5;

      vel[i * 3] = (Math.random() - 0.5) * 0.1;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.1;
      vel[i * 3 + 2] = 2.0 + Math.random() * 3.0; // streaming backward

      life[i] = Math.random(); // Phase
    }

    return { positions: pos, velocities: vel, lifetimes: life };
  }, [trailCount, nozzleOffsets]);

  const trailGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return g;
  }, [positions]);

  const trailMat = useMemo(() => {
    return new THREE.PointsMaterial({
      color: '#38bdf8',
      size: 0.18,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime;
    const flicker = Math.sin(t * 40) * 0.1;

    // Calculate dynamic flame scales based on throttle and boost
    const baseThrottle = Math.max(0.15, throttle);
    const lengthScale = isBoosting
      ? 2.8 + flicker * 2
      : 0.5 + baseThrottle * 1.2 + flicker;
    const widthScale = isBoosting
      ? 0.35 + flicker * 0.5
      : 0.12 + baseThrottle * 0.15;

    if (flameL.current && flameR.current) {
      flameL.current.scale.set(widthScale, widthScale, lengthScale);
      flameR.current.scale.set(widthScale, widthScale, lengthScale);
    }

    // Dynamic Engine Lighting
    if (lightRef.current) {
      lightRef.current.intensity = isBoosting
        ? 4.5 + flicker * 3
        : 1.0 + baseThrottle * 1.8 + flicker;
      lightRef.current.distance = isBoosting ? 12 : 6;
      lightRef.current.color.set(isBoosting ? '#38bdf8' : '#00e5ff');
    }

    // Update wake trail particles
    if (trailPointsRef.current) {
      const posAttr = trailPointsRef.current.geometry.attributes.position;
      const array = posAttr.array as Float32Array;

      const speedFactor = isBoosting ? 4.5 : Math.max(1.0, throttle * 2.2);

      for (let i = 0; i < trailCount; i++) {
        lifetimes[i] += delta * speedFactor * 1.5;

        // Move backward along +Z
        array[i * 3 + 2] += velocities[i * 3 + 2] * delta * speedFactor;

        // Reset particle if lifetime expired or traveled too far
        if (lifetimes[i] > 1.0 || array[i * 3 + 2] > 6.0) {
          lifetimes[i] = 0;
          const nozzle = nozzleOffsets[i % nozzleOffsets.length];
          array[i * 3] = nozzle[0] + (Math.random() - 0.5) * 0.08;
          array[i * 3 + 1] = nozzle[1] + (Math.random() - 0.5) * 0.08;
          array[i * 3 + 2] = nozzle[2];
        }
      }
      posAttr.needsUpdate = true;

      // Color/Opacity based on boost and thermal cooldown
      if (isBoosting) {
        trailMat.color.set('#e0f2fe');
        trailMat.size = 0.26;
        trailMat.opacity = 0.9;
      } else if (cooldownGlow > 0.05) {
        // Warm thermal cooldown hue
        trailMat.color.set('#f97316');
        trailMat.size = 0.16;
        trailMat.opacity = 0.5 * cooldownGlow;
      } else {
        trailMat.color.set('#38bdf8');
        trailMat.size = 0.14 + baseThrottle * 0.08;
        trailMat.opacity = 0.35 + baseThrottle * 0.4;
      }
    }
  });

  const flameColor = isBoosting ? '#e0f2fe' : '#00e5ff';

  return (
    <group>
      {/* Left Nozzle Flame Cone */}
      <mesh
        ref={flameL}
        position={nozzleOffsets[0]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <coneGeometry args={[0.5, 1.2, 10, 1, true]} />
        <meshBasicMaterial
          color={flameColor}
          transparent
          opacity={0.85}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Right Nozzle Flame Cone */}
      <mesh
        ref={flameR}
        position={nozzleOffsets[1]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <coneGeometry args={[0.5, 1.2, 10, 1, true]} />
        <meshBasicMaterial
          color={flameColor}
          transparent
          opacity={0.85}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Dynamic Engine Lighting */}
      <pointLight
        ref={lightRef}
        position={[0, 0, nozzleOffsets[0][2] + 0.3]}
        color="#00e5ff"
        intensity={2.2}
        distance={7}
      />

      {/* Streaming Engine Wake Particles */}
      <points ref={trailPointsRef} geometry={trailGeo} material={trailMat} />
    </group>
  );
}

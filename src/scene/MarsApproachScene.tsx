import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Planet } from './Planet';

export interface MarsApproachSceneProps {
  shipZ?: number;
  intensity?: number;
}

export function MarsApproachScene({ shipZ = 0, intensity = 1.0 }: MarsApproachSceneProps) {
  const dustRef = useRef<THREE.Points>(null);

  // Particles streaming past the ship during atmospheric descent
  const count = 150;
  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    const c1 = new THREE.Color('#ea580c'); // Rust orange
    const c2 = new THREE.Color('#b45309'); // Ochre brown
    const c3 = new THREE.Color('#f97316'); // Bright ember orange

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 2] = shipZ - Math.random() * 80;

      const c = [c1, c2, c3][Math.floor(Math.random() * 3)];
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }

    return [pos, col];
  }, [count, shipZ]);

  // Animate dust rushing past the camera
  useFrame((_, delta) => {
    if (!dustRef.current) return;
    const array = dustRef.current.geometry.attributes.position.array as Float32Array;

    const speed = 45 * intensity * delta;
    for (let i = 0; i < count; i++) {
      array[i * 3 + 2] += speed; // Rush backward toward and past camera
      if (array[i * 3 + 2] > shipZ + 15) {
        array[i * 3 + 2] = shipZ - 65;
        array[i * 3] = (Math.random() - 0.5) * 40;
        array[i * 3 + 1] = (Math.random() - 0.5) * 30;
      }
    }
    dustRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <group>
      {/* Looming Mars Planet in the forward descent vector */}
      <group position={[0, -5, shipZ - 120]}>
        <Planet type="mars" scale={14.0} rotationSpeed={0.02} />
      </group>

      {/* Atmospheric Entry Dust Cloud Stream */}
      <points ref={dustRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={count}
            array={positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={count}
            array={colors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.45}
          vertexColors
          transparent
          opacity={0.75 * intensity}
          depthWrite={false}
        />
      </points>

      {/* Atmospheric Entry Glow Light */}
      <pointLight
        position={[0, 0, shipZ - 10]}
        color="#f97316"
        intensity={2.5 * intensity}
        distance={35}
      />
    </group>
  );
}

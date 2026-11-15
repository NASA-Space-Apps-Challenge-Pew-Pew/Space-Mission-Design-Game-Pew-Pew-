import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface StarfieldProps {
  count?: number;
  radius?: number;
  speed?: number;
}

export function Starfield({ count = 2500, radius = 90, speed = 0.02 }: StarfieldProps) {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    // Realistic star color palette
    const colorPalette = [
      new THREE.Color('#ffffff'), // Bright white
      new THREE.Color('#e0f2fe'), // Pale blue-white
      new THREE.Color('#38bdf8'), // Cyan / NOVA blue accent
      new THREE.Color('#fef3c7'), // Warm yellow
      new THREE.Color('#fed7aa'), // Faint orange
    ];

    for (let i = 0; i < count; i++) {
      // Uniform spherical shell distribution
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = radius * Math.cbrt(0.2 + 0.8 * Math.random());

      const sinPhi = Math.sin(phi);
      pos[i * 3] = r * sinPhi * Math.cos(theta);
      pos[i * 3 + 1] = r * sinPhi * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      // Star color pick
      const baseColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      const brightness = 0.4 + Math.random() * 0.6;
      col[i * 3] = baseColor.r * brightness;
      col[i * 3 + 1] = baseColor.g * brightness;
      col[i * 3 + 2] = baseColor.b * brightness;
    }

    return [pos, col];
  }, [count, radius]);

  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * speed * 0.1;
      pointsRef.current.rotation.x += delta * speed * 0.05;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={1.2}
        sizeAttenuation={true}
        vertexColors={true}
        transparent={true}
        opacity={0.85}
        depthWrite={false}
      />
    </points>
  );
}

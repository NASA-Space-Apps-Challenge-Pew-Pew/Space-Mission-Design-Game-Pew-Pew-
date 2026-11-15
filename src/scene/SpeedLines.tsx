import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface SpeedLinesProps {
  speed?: number; // Forward velocity magnitude
  isBoosting?: boolean;
  shipPosition?: [number, number, number];
  shipRotation?: [number, number, number];
  count?: number;
  radius?: number;
  length?: number;
}

export function SpeedLines({
  speed = 15,
  isBoosting = false,
  shipPosition = [0, 0, 0],
  shipRotation = [0, 0, 0],
  count = 90,
  radius = 12,
  length = 30,
}: SpeedLinesProps) {
  const lineSegmentsRef = useRef<THREE.LineSegments>(null);

  // Pre-allocate buffer data for line segments (2 points per line = 6 floats)
  const { positions, offsets, baseLengths } = useMemo(() => {
    const pos = new Float32Array(count * 6);
    const offs: { x: number; y: number; z: number }[] = [];
    const lens: number[] = [];

    for (let i = 0; i < count; i++) {
      // Cylindrical distribution around ship
      const angle = Math.random() * Math.PI * 2;
      const r = 1.5 + Math.random() * (radius - 1.5);
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      const z = (Math.random() - 0.5) * length;

      offs.push({ x, y, z });
      lens.push(0.5 + Math.random() * 1.5);

      const idx = i * 6;
      pos[idx] = x;
      pos[idx + 1] = y;
      pos[idx + 2] = z;
      pos[idx + 3] = x;
      pos[idx + 4] = y;
      pos[idx + 5] = z + 1;
    }

    return { positions: pos, offsets: offs, baseLengths: lens };
  }, [count, radius, length]);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return g;
  }, [positions]);

  const mat = useMemo(() => {
    return new THREE.LineBasicMaterial({
      color: '#38bdf8',
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  // Update line endpoints in local space
  useFrame(({ clock }) => {
    if (!lineSegmentsRef.current) return;
    const posAttr = lineSegmentsRef.current.geometry.attributes.position;
    const array = posAttr.array as Float32Array;

    // Line stretch factor based on speed and boost
    const stretch = isBoosting ? 7.5 : Math.max(0.8, (speed / 15) * 3.0);
    const flowSpeed = isBoosting ? 110 : Math.max(25, speed * 2.2);
    const deltaFlow = flowSpeed * 0.016;

    for (let i = 0; i < count; i++) {
      const off = offsets[i];
      // Stream streak backward relative to ship
      off.z += deltaFlow;
      if (off.z > length / 2) {
        off.z = -length / 2;
        // Re-randomize radial position
        const angle = Math.random() * Math.PI * 2;
        const r = 1.8 + Math.random() * (radius - 1.8);
        off.x = Math.cos(angle) * r;
        off.y = Math.sin(angle) * r;
      }

      const streakLen = baseLengths[i] * stretch;
      const idx = i * 6;

      // Start point (head)
      array[idx] = off.x;
      array[idx + 1] = off.y;
      array[idx + 2] = off.z;

      // End point (tail stretched backward along +Z in ship space)
      array[idx + 3] = off.x;
      array[idx + 4] = off.y;
      array[idx + 5] = off.z + streakLen;
    }

    posAttr.needsUpdate = true;

    // Dynamic material opacity
    mat.opacity = isBoosting ? 0.75 : Math.min(0.5, 0.15 + (speed / 40) * 0.35);
    mat.color.set(isBoosting ? '#e0f2fe' : '#38bdf8');
  });

  return (
    <group position={shipPosition} rotation={shipRotation}>
      <lineSegments ref={lineSegmentsRef} geometry={geo} material={mat} />
    </group>
  );
}

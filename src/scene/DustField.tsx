import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface DustFieldProps {
  playerPosition?: [number, number, number];
  count?: number;
  boxSize?: [number, number, number]; // [width, height, depth]
  color?: string;
  size?: number;
}

export function DustField({
  playerPosition = [0, 0, 0],
  count = 200,
  boxSize = [45, 30, 60],
  color = '#cbd5e1',
  size = 0.14,
}: DustFieldProps) {
  const pointsRef = useRef<THREE.Points>(null);

  // Generate initial particle coordinates relative to center
  const [positions, opacities] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const op = new Float32Array(count);

    const [bx, by, bz] = boxSize;
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * bx;
      pos[i * 3 + 1] = (Math.random() - 0.5) * by;
      pos[i * 3 + 2] = (Math.random() - 0.5) * bz;
      op[i] = 0.2 + Math.random() * 0.6;
    }

    return [pos, op];
  }, [count, boxSize]);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return g;
  }, [positions]);

  const mat = useMemo(() => {
    return new THREE.PointsMaterial({
      color: color,
      size: size,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, [color, size]);

  // Wrap particles around player position to create infinite parallax field
  useFrame(() => {
    if (!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position;
    const array = posAttr.array as Float32Array;

    const [px, py, pz] = playerPosition;
    const [halfX, halfY, halfZ] = [boxSize[0] / 2, boxSize[1] / 2, boxSize[2] / 2];

    for (let i = 0; i < count; i++) {
      const idx = i * 3;

      // Wrap X
      let dx = array[idx] - px;
      if (dx > halfX) array[idx] -= boxSize[0];
      else if (dx < -halfX) array[idx] += boxSize[0];

      // Wrap Y
      let dy = array[idx + 1] - py;
      if (dy > halfY) array[idx + 1] -= boxSize[1];
      else if (dy < -halfY) array[idx + 1] += boxSize[1];

      // Wrap Z
      let dz = array[idx + 2] - pz;
      if (dz > halfZ) array[idx + 2] -= boxSize[2];
      else if (dz < -halfZ) array[idx + 2] += boxSize[2];
    }

    posAttr.needsUpdate = true;
  });

  return <points ref={pointsRef} geometry={geo} material={mat} />;
}

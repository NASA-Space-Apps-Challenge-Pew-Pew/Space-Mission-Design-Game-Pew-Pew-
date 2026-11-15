import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface AsteroidFieldProps {
  count?: number;
  spread?: [number, number, number];
  safeRadius?: number;
  center?: [number, number, number];
}

export function AsteroidField({
  count = 60,
  spread = [80, 40, 180],
  safeRadius = 6,
  center = [0, 0, -60],
}: AsteroidFieldProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // Pre-generate pseudo-random asteroid transform data
  const rocks = useMemo(() => {
    const list: {
      pos: THREE.Vector3;
      rot: THREE.Euler;
      rotSpeed: THREE.Vector3;
      scale: number;
    }[] = [];

    for (let i = 0; i < count; i++) {
      let x = (Math.random() - 0.5) * spread[0];
      let y = (Math.random() - 0.5) * spread[1];
      let z = center[2] + (Math.random() - 0.5) * spread[2];

      // Keep corridor clear around origin path
      if (Math.hypot(x, y) < safeRadius) {
        x += Math.sign(x || 1) * safeRadius;
        y += Math.sign(y || 1) * safeRadius;
      }

      list.push({
        pos: new THREE.Vector3(x, y, z),
        rot: new THREE.Euler(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        ),
        rotSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 0.4,
          (Math.random() - 0.5) * 0.4,
          (Math.random() - 0.5) * 0.4
        ),
        scale: 0.8 + Math.random() * 2.2,
      });
    }

    return list;
  }, [count, spread, safeRadius, center]);

  const geometry = useMemo(() => new THREE.DodecahedronGeometry(1.0, 1), []);
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0x52525b,
        roughness: 0.9,
        metalness: 0.1,
        flatShading: true,
      }),
    []
  );

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Initialize instance matrices
  useEffect(() => {
    if (!meshRef.current) return;
    for (let i = 0; i < rocks.length; i++) {
      const r = rocks[i];
      dummy.position.copy(r.pos);
      dummy.rotation.copy(r.rot);
      dummy.scale.set(r.scale, r.scale, r.scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [rocks, dummy]);

  // Subtle continuous tumble
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    for (let i = 0; i < rocks.length; i++) {
      const r = rocks[i];
      r.rot.x += r.rotSpeed.x * delta;
      r.rot.y += r.rotSpeed.y * delta;
      r.rot.z += r.rotSpeed.z * delta;
      dummy.position.copy(r.pos);
      dummy.rotation.copy(r.rot);
      dummy.scale.set(r.scale, r.scale, r.scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      frustumCulled={false}
    />
  );
}

import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface DebrisFieldProps {
  count?: number;
  spread?: [number, number, number];
  center?: [number, number, number];
}

export function DebrisField({
  count = 45,
  spread = [60, 30, 140],
  center = [0, 0, -40],
}: DebrisFieldProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const pieces = useMemo(() => {
    const list: {
      pos: THREE.Vector3;
      rot: THREE.Euler;
      rotSpeed: THREE.Vector3;
      scale: THREE.Vector3;
    }[] = [];

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * spread[0];
      const y = (Math.random() - 0.5) * spread[1];
      const z = center[2] + (Math.random() - 0.5) * spread[2];

      // Elongated metal shards or plates
      const isPlating = Math.random() > 0.5;
      const s = isPlating
        ? new THREE.Vector3(0.8 + Math.random(), 0.05, 1.2 + Math.random())
        : new THREE.Vector3(0.15, 1.5 + Math.random() * 2, 0.15);

      list.push({
        pos: new THREE.Vector3(x, y, z),
        rot: new THREE.Euler(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        ),
        rotSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 0.6,
          (Math.random() - 0.5) * 0.6,
          (Math.random() - 0.5) * 0.6
        ),
        scale: s,
      });
    }

    return list;
  }, [count, spread, center]);

  const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0x475569,
        roughness: 0.4,
        metalness: 0.8,
      }),
    []
  );

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    if (!meshRef.current) return;
    for (let i = 0; i < pieces.length; i++) {
      const p = pieces[i];
      dummy.position.copy(p.pos);
      dummy.rotation.copy(p.rot);
      dummy.scale.copy(p.scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [pieces, dummy]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    for (let i = 0; i < pieces.length; i++) {
      const p = pieces[i];
      p.rot.x += p.rotSpeed.x * delta;
      p.rot.y += p.rotSpeed.y * delta;
      dummy.position.copy(p.pos);
      dummy.rotation.copy(p.rot);
      dummy.scale.copy(p.scale);
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

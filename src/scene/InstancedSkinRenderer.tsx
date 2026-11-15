import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { GameEntity, EntitySkin } from '../game/v2Types';

interface InstancedSkinRendererProps {
  skin: EntitySkin;
  entities: GameEntity[];
}

export function InstancedSkinRenderer({ skin, entities }: InstancedSkinRendererProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = entities.length;

  // Generate geometry & material based on skin
  const [geometry, material] = useMemo(() => {
    switch (skin) {
      case 'orb':
        return [
          new THREE.SphereGeometry(0.5, 12, 12),
          new THREE.MeshStandardMaterial({
            color: 0x00e5ff,
            emissive: 0x00e5ff,
            emissiveIntensity: 0.6,
            roughness: 0.2,
          }),
        ];
      case 'crate':
        return [
          new THREE.BoxGeometry(0.9, 0.65, 1.2),
          new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6, metalness: 0.4 }),
        ];
      case 'rock':
        return [
          new THREE.DodecahedronGeometry(0.8, 1),
          new THREE.MeshStandardMaterial({ color: 0x52525b, roughness: 0.9, flatShading: true }),
        ];
      case 'ship':
        return [
          new THREE.ConeGeometry(0.35, 1.4, 8),
          new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.3 }),
        ];
      case 'creature':
        return [
          new THREE.SphereGeometry(0.6, 10, 8),
          new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.5 }),
        ];
      case 'station':
      default:
        return [
          new THREE.CylinderGeometry(0.3, 0.3, 1.5, 8),
          new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.7 }),
        ];
    }
  }, [skin]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Update instance matrices whenever entities move
  useFrame(() => {
    if (!meshRef.current || count === 0) return;

    for (let i = 0; i < count; i++) {
      const e = entities[i];
      dummy.position.set(e.position[0], e.position[1], e.position[2]);
      dummy.rotation.set(e.rotation[0], e.rotation[1], e.rotation[2]);
      const s = e.radius || 1.0;
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (count === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, Math.max(count, 1)]}
      frustumCulled={false}
    />
  );
}

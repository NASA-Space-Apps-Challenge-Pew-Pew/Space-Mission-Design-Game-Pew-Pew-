import React, { useRef, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { PlanetProps } from './types';

// Fallback procedural planet shapes if GLB is loading or unavailable
function ProceduralPlanetFallback({ type }: { type: PlanetProps['type'] }) {
  if (type === 'earth') {
    return (
      <group>
        <mesh>
          <sphereGeometry args={[1.2, 32, 32]} />
          <meshStandardMaterial color="#1e40af" roughness={0.5} metalness={0.1} />
        </mesh>
        <mesh scale={[1.03, 1.03, 1.03]}>
          <sphereGeometry args={[1.2, 24, 24]} />
          <meshStandardMaterial
            color="#38bdf8"
            transparent
            opacity={0.25}
            roughness={0.2}
            side={THREE.BackSide}
          />
        </mesh>
      </group>
    );
  }

  if (type === 'mars') {
    return (
      <group>
        <mesh>
          <sphereGeometry args={[0.9, 32, 32]} />
          <meshStandardMaterial color="#c2410c" roughness={0.8} metalness={0.05} />
        </mesh>
        {/* Polar ice cap */}
        <mesh position={[0, 0.88, 0]}>
          <cylinderGeometry args={[0.25, 0.25, 0.05, 16]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.3} />
        </mesh>
      </group>
    );
  }

  if (type === 'moon') {
    return (
      <mesh>
        <sphereGeometry args={[0.5, 24, 24]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.9} metalness={0.05} />
      </mesh>
    );
  }

  // Sun
  return (
    <mesh>
      <sphereGeometry args={[2.0, 32, 32]} />
      <meshBasicMaterial color="#fbbf24" />
    </mesh>
  );
}

// Model renderer with GLTF loading
function LoadedPlanetModel({ type }: { type: PlanetProps['type'] }) {
  const modelPath =
    type === 'earth'
      ? '/models/earth.glb'
      : type === 'mars'
      ? '/models/mars.glb'
      : type === 'moon'
      ? '/models/moon.glb'
      : null;

  if (!modelPath) {
    return <ProceduralPlanetFallback type={type} />;
  }

  const { scene } = useGLTF(modelPath);
  return <primitive object={scene.clone()} />;
}

export function Planet({
  type,
  position = [0, 0, 0],
  scale = 1,
  rotationSpeed = 0.1,
}: PlanetProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * rotationSpeed;
    }
  });

  return (
    <group ref={groupRef} position={position} scale={scale}>
      <Suspense fallback={<ProceduralPlanetFallback type={type} />}>
        <LoadedPlanetModel type={type} />
      </Suspense>
    </group>
  );
}

// Preload models for instant display
useGLTF.preload('/models/earth.glb');
useGLTF.preload('/models/mars.glb');
useGLTF.preload('/models/moon.glb');

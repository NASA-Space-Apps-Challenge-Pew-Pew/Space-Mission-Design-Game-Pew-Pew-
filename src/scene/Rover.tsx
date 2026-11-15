import React, { useRef, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { RoverProps } from './types';

// Fallback procedural rover model
function ProceduralRoverFallback() {
  return (
    <group>
      {/* Chassis Body */}
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[0.8, 0.35, 1.2]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.4} roughness={0.4} />
      </mesh>
      {/* Solar deck */}
      <mesh position={[0, 0.65, 0]}>
        <boxGeometry args={[0.9, 0.04, 1.3]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Mast */}
      <mesh position={[0.2, 0.95, 0.4]}>
        <cylinderGeometry args={[0.03, 0.03, 0.6, 8]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
      {/* Mastcam */}
      <mesh position={[0.2, 1.25, 0.4]}>
        <boxGeometry args={[0.18, 0.1, 0.1]} />
        <meshStandardMaterial color="#0284c7" emissive="#0284c7" emissiveIntensity={0.5} />
      </mesh>
      {/* 6 Wheels */}
      {[-0.55, 0.55].map((x) =>
        [-0.45, 0, 0.45].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.2, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.18, 0.18, 0.12, 12]} />
            <meshStandardMaterial color="#334155" roughness={0.8} />
          </mesh>
        ))
      )}
    </group>
  );
}

function LoadedRoverModel() {
  const { scene } = useGLTF('/models/rover.glb');
  return <primitive object={scene.clone()} />;
}

export function Rover({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  deployed = false,
}: RoverProps) {
  const groupRef = useRef<THREE.Group>(null);
  const sensorGlowRef = useRef<THREE.PointLight>(null);

  // Subtle science instrument activity pulse
  useFrame(({ clock }) => {
    if (sensorGlowRef.current && deployed) {
      sensorGlowRef.current.intensity = 1.0 + Math.sin(clock.elapsedTime * 4) * 0.5;
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      <Suspense fallback={<ProceduralRoverFallback />}>
        <LoadedRoverModel />
      </Suspense>

      {/* Science Instrument Deployment Indicator */}
      {deployed && (
        <group position={[-0.35, 0.35, 1.7]}>
          <pointLight ref={sensorGlowRef} color="#00e5ff" intensity={1.5} distance={2} />
          <mesh>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshBasicMaterial color="#00e5ff" />
          </mesh>
        </group>
      )}
    </group>
  );
}

useGLTF.preload('/models/rover.glb');

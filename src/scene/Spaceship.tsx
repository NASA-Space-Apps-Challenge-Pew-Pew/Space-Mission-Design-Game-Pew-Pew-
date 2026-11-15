import React, { useRef, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { SpaceshipProps } from './types';

// Fallback procedural spaceship if GLB is loading or missing
function ProceduralSpaceshipFallback() {
  return (
    <group>
      {/* Nose cone */}
      <mesh position={[0, 0, 1.2]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.4, 0.8, 16]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.4} roughness={0.3} />
      </mesh>
      {/* Main body */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 1.6, 16]} />
        <meshStandardMaterial color="#f1f5f9" metalness={0.3} roughness={0.4} />
      </mesh>
      {/* Observation Cupola */}
      <mesh position={[0, 0.25, 0.6]} rotation={[-Math.PI / 6, 0, 0]}>
        <sphereGeometry args={[0.2, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#0284c7" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Solar array wings */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 1.5, 0, 0]}>
          <mesh>
            <boxGeometry args={[1.5, 0.02, 0.8]} />
            <meshStandardMaterial color="#0c4a6e" metalness={0.9} roughness={0.2} emissive="#0369a1" emissiveIntensity={0.2} />
          </mesh>
        </group>
      ))}
      {/* Engine Bell */}
      <mesh position={[0, 0, -1.0]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.35, 0.6, 16, 1, true]} />
        <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}

// Loaded GLTF model component
function LoadedShipModel() {
  const { scene } = useGLTF('/models/ship.glb');
  return <primitive object={scene.clone()} />;
}

// Engine Exhaust Flame & Glow
function EngineExhaust({ active }: { active: boolean }) {
  const flameRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    if (flameRef.current && active) {
      const scaleZ = 1 + Math.sin(clock.elapsedTime * 30) * 0.25;
      const scaleXY = 1 + Math.cos(clock.elapsedTime * 25) * 0.15;
      flameRef.current.scale.set(scaleXY, scaleXY, scaleZ);
    }
    if (lightRef.current && active) {
      lightRef.current.intensity = 2.0 + Math.sin(clock.elapsedTime * 30) * 0.8;
    }
  });

  if (!active) return null;

  return (
    <group position={[0, 0, -2.1]}>
      {/* Core Plasma Flame Cone */}
      <mesh ref={flameRef} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.32, 1.4, 16, 1, true]} />
        <meshBasicMaterial
          color="#00e5ff"
          transparent
          opacity={0.85}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Engine Point Light */}
      <pointLight ref={lightRef} color="#00e5ff" intensity={2.5} distance={5} />
    </group>
  );
}

// Hull Damage Sparks Effect
function HullSparks({ active }: { active: boolean }) {
  const sparksRef = useRef<THREE.Points>(null);

  const [positions] = React.useMemo(() => {
    const pos = new Float32Array(30 * 3);
    for (let i = 0; i < 30; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 0.4;
      pos[i * 3 + 1] = 0.4 + (Math.random() - 0.5) * 0.3;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.6;
    }
    return [pos];
  }, []);

  useFrame(({ clock }) => {
    if (sparksRef.current && active) {
      sparksRef.current.visible = Math.sin(clock.elapsedTime * 20) > 0;
    }
  });

  if (!active) return null;

  return (
    <points ref={sparksRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#fbbf24"
        size={0.08}
        transparent
        opacity={0.9}
        depthWrite={false}
      />
    </points>
  );
}

// Silhouette in Window Scare Effect
function SilhouetteInWindow({ active }: { active: boolean }) {
  if (!active) return null;

  return (
    <group position={[0, 0.42, 1.95]}>
      {/* Eerie dark shadow silhouette standing in observation window */}
      <mesh>
        <planeGeometry args={[0.22, 0.3]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.95} side={THREE.DoubleSide} />
      </mesh>
      {/* Faint eerie glowing eyes */}
      <mesh position={[-0.04, 0.08, 0.01]}>
        <circleGeometry args={[0.015, 8]} />
        <meshBasicMaterial color="#f43f5e" />
      </mesh>
      <mesh position={[0.04, 0.08, 0.01]}>
        <circleGeometry args={[0.015, 8]} />
        <meshBasicMaterial color="#f43f5e" />
      </mesh>
    </group>
  );
}

export function Spaceship({
  progress = 0,
  isBurning = false,
  isDamaged = false,
  hasSilhouette = false,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
}: SpaceshipProps) {
  const shipRef = useRef<THREE.Group>(null);

  // Gentle micro-gravity floating motion
  useFrame(({ clock }) => {
    if (shipRef.current) {
      const t = clock.elapsedTime;
      shipRef.current.position.y = position[1] + Math.sin(t * 1.5) * 0.04;
      shipRef.current.rotation.z = rotation[2] + Math.sin(t * 0.8) * 0.02;
    }
  });

  return (
    <group
      ref={shipRef}
      position={position}
      rotation={rotation}
      scale={scale}
    >
      <Suspense fallback={<ProceduralSpaceshipFallback />}>
        <LoadedShipModel />
      </Suspense>

      {/* Thruster Flame */}
      <EngineExhaust active={isBurning} />

      {/* Hull Damage Sparks */}
      <HullSparks active={isDamaged} />

      {/* NOVA Scare Silhouette */}
      <SilhouetteInWindow active={hasSilhouette} />
    </group>
  );
}

// Preload ship model
useGLTF.preload('/models/ship.glb');

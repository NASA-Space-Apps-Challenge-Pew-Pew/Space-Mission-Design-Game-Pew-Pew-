import React, { useRef, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Text } from '@react-three/drei';
import * as THREE from 'three';
import type { GameEntity, EntitySkin } from '../game/v2Types';

// ---------------------------------------------------------------------
// PROCEDURAL PLACEHOLDERS FOR THE 6 SKINS (Immediate 0ms render)
// ---------------------------------------------------------------------

function PlaceholderOrb() {
  const ringRef = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ringRef.current) ringRef.current.rotation.y += delta * 2;
  });

  return (
    <group>
      <mesh>
        <sphereGeometry args={[0.45, 16, 16]} />
        <meshStandardMaterial
          color="#00e5ff"
          emissive="#00e5ff"
          emissiveIntensity={0.8}
          roughness={0.2}
        />
      </mesh>
      <mesh ref={ringRef}>
        <torusGeometry args={[0.7, 0.04, 8, 24]} />
        <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}

function PlaceholderCrate() {
  return (
    <group>
      <mesh>
        <boxGeometry args={[0.9, 0.65, 1.2]} />
        <meshStandardMaterial color="#1e293b" roughness={0.6} metalness={0.4} />
      </mesh>
      {/* Luminous resource stripe */}
      <mesh>
        <boxGeometry args={[0.92, 0.1, 1.22]} />
        <meshStandardMaterial
          color="#22c55e"
          emissive="#22c55e"
          emissiveIntensity={0.9}
        />
      </mesh>
    </group>
  );
}

function PlaceholderRock() {
  return (
    <mesh>
      <dodecahedronGeometry args={[0.75, 1]} />
      <meshStandardMaterial color="#52525b" roughness={0.9} flatShading />
    </mesh>
  );
}

function PlaceholderShip() {
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.3, 1.4, 8]} />
        <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[1.6, 0.03, 0.6]} />
        <meshStandardMaterial color="#0284c7" emissive="#0284c7" emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

function PlaceholderCreature() {
  const finL = useRef<THREE.Mesh>(null);
  const finR = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const wave = Math.sin(clock.elapsedTime * 3) * 0.2;
    if (finL.current && finR.current) {
      finL.current.rotation.z = -0.2 + wave;
      finR.current.rotation.z = 0.2 - wave;
    }
  });

  return (
    <group>
      <mesh scale={[0.8, 0.7, 1.8]}>
        <sphereGeometry args={[0.6, 12, 10]} />
        <meshStandardMaterial color="#1e3a8a" roughness={0.5} />
      </mesh>
      {/* Dorsal bioluminescent spine */}
      <mesh position={[0, 0.45, 0]} scale={[0.1, 0.1, 1.4]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={0.9} />
      </mesh>
      {/* Pectoral Fins */}
      <mesh ref={finL} position={[-0.8, -0.1, 0.2]} rotation={[0, 0.3, -0.2]}>
        <boxGeometry args={[0.8, 0.03, 0.4]} />
        <meshStandardMaterial color="#1e3a8a" />
      </mesh>
      <mesh ref={finR} position={[0.8, -0.1, 0.2]} rotation={[0, -0.3, 0.2]}>
        <boxGeometry args={[0.8, 0.03, 0.4]} />
        <meshStandardMaterial color="#1e3a8a" />
      </mesh>
    </group>
  );
}

function PlaceholderStation() {
  const ringRef = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ringRef.current) ringRef.current.rotation.z += delta * 0.3;
  });

  return (
    <group>
      {/* Central Spire */}
      <mesh>
        <cylinderGeometry args={[0.25, 0.25, 1.6, 10]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Rotating Ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.2, 0.1, 8, 20]} />
        <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Beacon Light */}
      <mesh position={[0, 1.1, 0]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------
// GLTF MODEL RENDERERS FOR THE 6 SKINS
// ---------------------------------------------------------------------

function ModelSkin({ skin }: { skin: EntitySkin }) {
  const modelPath = `/models/skin_${skin}.glb`;
  const { scene } = useGLTF(modelPath);
  return <primitive object={scene.clone()} />;
}

// ---------------------------------------------------------------------
// INDIVIDUAL ENTITY RENDERER
// ---------------------------------------------------------------------

export interface EntityRendererProps {
  entity: GameEntity;
  showLabel?: boolean;
}

export function EntityRenderer({ entity, showLabel = true }: EntityRendererProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Gentle hover/rotation based on behavior
  useFrame((_, delta) => {
    if (groupRef.current) {
      if (entity.behavior === 'orbit' || entity.behavior === 'follow') {
        groupRef.current.rotation.y += delta * 0.8;
      } else if (entity.skin === 'rock') {
        groupRef.current.rotation.x += delta * 0.4;
        groupRef.current.rotation.y += delta * 0.3;
      }
    }
  });

  // Pick placeholder component
  const PlaceholderComponent =
    entity.skin === 'orb'
      ? PlaceholderOrb
      : entity.skin === 'crate'
      ? PlaceholderCrate
      : entity.skin === 'rock'
      ? PlaceholderRock
      : entity.skin === 'ship'
      ? PlaceholderShip
      : entity.skin === 'creature'
      ? PlaceholderCreature
      : PlaceholderStation;

  // Effect glow color
  const effectColor =
    entity.effect === 'heal'
      ? '#22c55e'
      : entity.effect === 'fuel'
      ? '#f59e0b'
      : entity.effect === 'shield'
      ? '#00e5ff'
      : entity.effect === 'reveal_path'
      ? '#a855f7'
      : null;

  return (
    <group
      ref={groupRef}
      position={entity.position}
      rotation={entity.rotation}
      scale={entity.radius || 1.0}
    >
      <Suspense fallback={<PlaceholderComponent />}>
        <ModelSkin skin={entity.skin} />
      </Suspense>

      {/* Optional Effect Aura Light */}
      {effectColor && (
        <pointLight color={effectColor} intensity={1.5} distance={3} />
      )}

      {/* Floating Holographic Label */}
      {showLabel && entity.label && (
        <group position={[0, 1.2, 0]}>
          <Text
            fontSize={0.28}
            color="#e0f2fe"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.03}
            outlineColor="#030712"
          >
            {entity.label}
          </Text>
        </group>
      )}
    </group>
  );
}

// Preload all 6 skin models
['orb', 'crate', 'rock', 'ship', 'creature', 'station'].forEach((skin) => {
  useGLTF.preload(`/models/skin_${skin}.glb`);
});

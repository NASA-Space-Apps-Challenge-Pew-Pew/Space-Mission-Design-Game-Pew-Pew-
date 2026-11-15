import React, { useRef, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { EngineTrail } from './EngineTrail';
import { useBoostCooldown } from './BoostFeedback';

export interface PlayerShipProps {
  position?: [number, number, number];
  rotation?: [number, number, number]; // [pitch, yaw, roll]
  isBoosting?: boolean;
  throttle?: number; // 0 to 1
  velocity?: [number, number, number];
  hasShield?: boolean;
  hasHeal?: boolean;
  hasSilhouette?: boolean;
  scale?: number;
}

// Procedural fallback player ship (immediate zero-delay render)
function ProceduralPlayerShipMesh({ cooldownGlow = 0 }: { cooldownGlow?: number }) {
  const nozzleMat = React.useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.8,
      roughness: 0.3,
    });
  }, []);

  // Update nozzle thermal emissive glow
  React.useEffect(() => {
    if (cooldownGlow > 0.05) {
      nozzleMat.emissive.set('#f97316');
      nozzleMat.emissiveIntensity = cooldownGlow * 1.5;
    } else {
      nozzleMat.emissive.set('#000000');
      nozzleMat.emissiveIntensity = 0;
    }
  }, [cooldownGlow, nozzleMat]);

  return (
    <group>
      {/* Sleek Forward Fuselage */}
      <mesh position={[0, 0, -0.2]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.35, 1.6, 12]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.4} roughness={0.3} />
      </mesh>

      {/* Main Cockpit Canopy (Dark Glass) */}
      <mesh position={[0, 0.18, 0.1]} rotation={[-Math.PI / 8, 0, 0]}>
        <sphereGeometry args={[0.18, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#0284c7" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Swept Aerodynamic Wings */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.8, -0.05, 0.2]}>
          <mesh rotation={[0, side * 0.2, side * -0.1]}>
            <boxGeometry args={[1.2, 0.03, 0.7]} />
            <meshStandardMaterial
              color="#0f172a"
              metalness={0.8}
              roughness={0.2}
              emissive="#0369a1"
              emissiveIntensity={0.2}
            />
          </mesh>
          {/* Wingtip navigation lights */}
          <mesh position={[side * 0.6, 0.02, -0.3]}>
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshBasicMaterial color={side > 0 ? '#22c55e' : '#ef4444'} />
          </mesh>
        </group>
      ))}

      {/* Twin Engine Nacelles */}
      {[-0.28, 0.28].map((x) => (
        <group key={x} position={[x, 0, 0.6]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} material={nozzleMat}>
            <cylinderGeometry args={[0.14, 0.16, 0.5, 12]} />
          </mesh>
          {/* Engine nozzle glow ring */}
          <mesh position={[0, 0, 0.26]} rotation={[0, 0, 0]}>
            <ringGeometry args={[0.08, 0.14, 12]} />
            <meshBasicMaterial
              color={cooldownGlow > 0.1 ? '#f97316' : '#00e5ff'}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// Loaded GLTF model
function LoadedPlayerShip() {
  const { scene } = useGLTF('/models/ship.glb');
  return <primitive object={scene.clone()} scale={0.85} />;
}

// Creepy silhouette in window for NOVA scare
function CockpitSilhouette({ active }: { active?: boolean }) {
  if (!active) return null;

  return (
    <group position={[0, 0.25, 0.15]}>
      <mesh>
        <planeGeometry args={[0.16, 0.22]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.96} side={THREE.DoubleSide} />
      </mesh>
      {/* Piercing red eyes */}
      <mesh position={[-0.03, 0.05, 0.01]}>
        <circleGeometry args={[0.012, 8]} />
        <meshBasicMaterial color="#f43f5e" />
      </mesh>
      <mesh position={[0.03, 0.05, 0.01]}>
        <circleGeometry args={[0.012, 8]} />
        <meshBasicMaterial color="#f43f5e" />
      </mesh>
    </group>
  );
}

export function PlayerShip({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  isBoosting = false,
  throttle: propThrottle,
  velocity = [0, 0, 0],
  hasSilhouette = false,
  scale = 1.0,
}: PlayerShipProps) {
  const shipRef = useRef<THREE.Group>(null);

  // Compute thermal cooldown heat after boosting
  const cooldownGlow = useBoostCooldown(isBoosting);

  // Derive throttle from velocity if not explicitly passed
  const effectiveThrottle =
    propThrottle !== undefined
      ? propThrottle
      : Math.min(1.0, Math.hypot(velocity[0], velocity[1], velocity[2]) / 25);

  // Dynamic visual banking based on horizontal velocity / steering
  useFrame(() => {
    if (shipRef.current) {
      const bankRoll = -velocity[0] * 0.08; // Roll into horizontal strafe
      shipRef.current.rotation.set(
        rotation[0],
        rotation[1],
        rotation[2] + bankRoll,
        'YXZ'
      );
    }
  });

  return (
    <group ref={shipRef} position={position} scale={scale}>
      <Suspense fallback={<ProceduralPlayerShipMesh cooldownGlow={cooldownGlow} />}>
        <LoadedPlayerShip />
      </Suspense>

      {/* Engine Exhaust Plume & Wake Trail that scales with throttle & boost */}
      <EngineTrail
        throttle={effectiveThrottle}
        isBoosting={isBoosting}
        cooldownGlow={cooldownGlow}
      />

      {/* NOVA Scare Silhouette */}
      <CockpitSilhouette active={hasSilhouette} />
    </group>
  );
}

useGLTF.preload('/models/ship.glb');

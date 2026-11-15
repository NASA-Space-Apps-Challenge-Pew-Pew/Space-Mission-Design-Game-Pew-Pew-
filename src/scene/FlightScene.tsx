import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useV2Store } from '../game/v2Store';
import { GameEntity, Waypoint } from '../game/v2Types';
import { flightConfig } from '../game/flightConfig';
import { flightAudioHaptics } from '../game/flightAudioHaptics';

// Third-person Chase Camera with Spring Follow, Camera Shake, and Dynamic Speed FOV
export function ChaseCamera() {
  const currentCamPos = useRef(new THREE.Vector3(0, 3, 12));
  const currentLookAt = useRef(new THREE.Vector3(0, 0, -30));

  useFrame(({ camera }, delta) => {
    const { player } = useV2Store.getState();
    const [px, py, pz] = player.position;
    const [pitch, yaw] = player.rotation;

    // Forward vector
    const cosP = Math.cos(pitch);
    const fx = Math.sin(yaw) * cosP;
    const fy = Math.sin(pitch);
    const fz = -Math.cos(yaw) * cosP;

    // Camera target behind and above ship
    const distBehind = flightConfig.cameraDistance + (player.isBoosting ? 2.5 : 0);
    const heightAbove = flightConfig.cameraHeight;

    const targetCamX = px - fx * distBehind;
    const targetCamY = py - fy * distBehind + heightAbove;
    const targetCamZ = pz - fz * distBehind;

    // Spring chase follow
    const lerpFactor = Math.min(1.0, delta * (1.0 / Math.max(0.01, flightConfig.cameraLag)));
    currentCamPos.current.lerp(new THREE.Vector3(targetCamX, targetCamY, targetCamZ), lerpFactor);

    // Camera Shake
    const shake = flightAudioHaptics.updateCameraShake(delta);
    camera.position.set(
      currentCamPos.current.x + shake.x,
      currentCamPos.current.y + shake.y,
      currentCamPos.current.z
    );

    // Look ahead of ship
    const lookDist = flightConfig.cameraLookAhead;
    const targetLookX = px + fx * lookDist;
    const targetLookY = py + fy * lookDist;
    const targetLookZ = pz + fz * lookDist;

    currentLookAt.current.lerp(new THREE.Vector3(targetLookX, targetLookY, targetLookZ), 0.2);
    camera.lookAt(currentLookAt.current);

    // Dynamic FOV widening with speed
    const speedRatio = Math.min(1.0, (player.speed || 0) / flightConfig.boostMaxSpeed);
    const targetFov = flightConfig.fovBase + (flightConfig.fovMax - flightConfig.fovBase) * speedRatio;
    const perspCamera = camera as THREE.PerspectiveCamera;
    perspCamera.fov = THREE.MathUtils.lerp(perspCamera.fov, targetFov, 0.1);
    perspCamera.updateProjectionMatrix();
  });

  return null;
}

// Player Spacecraft
export function PlayerShip() {
  const groupRef = useRef<THREE.Group>(null);
  const thrusterRef = useRef<THREE.Mesh>(null);
  const { player } = useV2Store();

  useFrame((state) => {
    if (!groupRef.current) return;

    const [px, py, pz] = player.position;
    const [pitch, yaw, roll] = player.rotation;

    // Set position and rotation (Three.js YXZ order: yaw first, then pitch, then roll banking)
    groupRef.current.position.set(px, py, pz);
    groupRef.current.rotation.set(pitch, -yaw, roll, 'YXZ');

    // Thruster scale
    if (thrusterRef.current) {
      const speedRatio = Math.min(1.5, (player.speed || 0) / flightConfig.maxSpeed);
      const pulse = 1.0 + Math.sin(state.clock.elapsedTime * 28) * 0.2;
      const boostScale = player.isBoosting ? 2.8 : 1.0;
      const len = (1.0 + speedRatio * 1.5) * boostScale * pulse;
      thrusterRef.current.scale.set(boostScale, boostScale, len);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Fuselage Nose cone */}
      <mesh position={[0, 0, -0.6]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.7, 3.0, 16]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.7} roughness={0.25} />
      </mesh>

      {/* Cockpit Visor */}
      <mesh position={[0, 0.35, -0.4]}>
        <boxGeometry args={[0.45, 0.3, 0.9]} />
        <meshStandardMaterial color="#0284c7" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Swept Wings */}
      <mesh position={[1.4, 0, 0.5]} rotation={[0, -Math.PI / 10, 0]}>
        <boxGeometry args={[1.8, 0.06, 1.2]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[-1.4, 0, 0.5]} rotation={[0, Math.PI / 10, 0]}>
        <boxGeometry args={[1.8, 0.06, 1.2]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Engine Bell */}
      <mesh position={[0, 0, 1.0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.4, 0.5, 0.6, 16]} />
        <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.3} />
      </mesh>

      {/* Thruster Plume Flame */}
      <mesh ref={thrusterRef} position={[0, 0, 1.5]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.35, 1.4, 16]} />
        <meshBasicMaterial
          color={player.isBoosting ? '#38bdf8' : '#06b6d4'}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Energy Shield Bubble */}
      {player.shieldSeconds > 0 && (
        <mesh>
          <sphereGeometry args={[2.5, 24, 24]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.3} wireframe />
        </mesh>
      )}
    </group>
  );
}

// Procedural Entity Render Component
export function EntityRenderer({ entity }: { entity: GameEntity }) {
  const meshRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    if (entity.skin === 'crate' || entity.skin === 'rock') {
      meshRef.current.rotation.x += delta * 0.4;
      meshRef.current.rotation.y += delta * 0.6;
    } else if (entity.skin === 'creature') {
      meshRef.current.position.y = entity.position[1] + Math.sin(state.clock.elapsedTime * 2) * 1.5;
    }
  });

  return (
    <group ref={meshRef} position={entity.position}>
      {entity.skin === 'crate' && (
        <mesh>
          <boxGeometry args={[2.4, 2.4, 2.4]} />
          <meshStandardMaterial color="#eab308" metalness={0.6} roughness={0.3} />
        </mesh>
      )}

      {entity.skin === 'orb' && (
        <mesh>
          <sphereGeometry args={[1.6, 24, 24]} />
          <meshStandardMaterial color="#a855f7" emissive="#7e22ce" emissiveIntensity={0.8} />
        </mesh>
      )}

      {entity.skin === 'rock' && (
        <mesh>
          <dodecahedronGeometry args={[3.0, 1]} />
          <meshStandardMaterial color="#64748b" roughness={0.9} metalness={0.1} />
        </mesh>
      )}

      {entity.skin === 'ship' && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.7, 2.4, 12]} />
          <meshStandardMaterial color="#10b981" metalness={0.8} roughness={0.2} />
        </mesh>
      )}

      {entity.skin === 'creature' && (
        <group scale={[2.8, 2.2, 4.5]}>
          <mesh>
            <sphereGeometry args={[1.4, 16, 16]} />
            <meshStandardMaterial color="#22d3ee" emissive="#0891b2" emissiveIntensity={0.6} wireframe />
          </mesh>
        </group>
      )}

      {entity.skin === 'station' && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[3.8, 0.6, 16, 32]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
        </mesh>
      )}

      <Billboard position={[0, 3.5, 0]}>
        <Text
          fontSize={1.1}
          color="#f8fafc"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.08}
          outlineColor="#030712"
        >
          {entity.label}
        </Text>
      </Billboard>
    </group>
  );
}

// Waypoint Guidance Rings
export function WaypointRing({ waypoint, isActive }: { waypoint: Waypoint; isActive: boolean }) {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (ringRef.current && isActive) {
      ringRef.current.rotation.z += delta * 1.2;
    }
  });

  if (waypoint.reached) return null;

  return (
    <group position={waypoint.position}>
      <mesh ref={ringRef} rotation={[0, 0, 0]}>
        <torusGeometry args={[waypoint.radius, 0.5, 16, 36]} />
        <meshBasicMaterial
          color={isActive ? '#10b981' : '#38bdf8'}
          transparent
          opacity={isActive ? 0.9 : 0.4}
        />
      </mesh>

      {isActive && (
        <mesh>
          <sphereGeometry args={[0.9, 12, 12]} />
          <meshBasicMaterial color="#34d399" transparent opacity={0.6} />
        </mesh>
      )}

      <Billboard position={[0, waypoint.radius + 2.2, 0]}>
        <Text
          fontSize={1.3}
          color={isActive ? '#34d399' : '#38bdf8'}
          outlineWidth={0.09}
          outlineColor="#030712"
        >
          {waypoint.label}
        </Text>
      </Billboard>
    </group>
  );
}

// Background Planets
export function SpaceLandmarks() {
  const { act } = useV2Store();

  return (
    <group>
      {(act === 0 || act === 1) && (
        <mesh position={[90, 45, 220]}>
          <sphereGeometry args={[70, 32, 32]} />
          <meshStandardMaterial color="#1e40af" roughness={0.6} />
        </mesh>
      )}

      <mesh position={[0, 0, -1700]}>
        <sphereGeometry args={[150, 32, 32]} />
        <meshStandardMaterial color="#c2410c" roughness={0.8} />
      </mesh>
    </group>
  );
}

export function FlightSceneContent() {
  const { entities, waypoints, activeWaypointIndex } = useV2Store();

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[25, 45, 25]} intensity={1.8} color="#fffbeb" />

      <ChaseCamera />
      <Stars radius={260} depth={80} count={4000} factor={4} saturation={0.1} fade speed={0.6} />
      <SpaceLandmarks />
      <PlayerShip />

      {entities.map((entity) => (
        <EntityRenderer key={entity.id} entity={entity} />
      ))}

      {waypoints.map((wp, idx) => (
        <WaypointRing key={wp.id} waypoint={wp} isActive={idx === activeWaypointIndex} />
      ))}
    </>
  );
}

export function FlightScene() {
  return (
    <div className="absolute inset-0 w-full h-full select-none overflow-hidden z-0 bg-space-950 pointer-events-none">
      <Canvas
        camera={{ position: [0, 4, 12], fov: 52 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#030712']} />
        <FlightSceneContent />
      </Canvas>
    </div>
  );
}

export default FlightScene;

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ---------------------------------------------------------------------
// 1. SHIELD EFFECT (Pulsating Cyan Energy Bubble)
// ---------------------------------------------------------------------
export function ShieldEffect({
  active,
  position = [0, 0, 0],
  radius = 1.6,
}: {
  active?: boolean;
  position?: [number, number, number];
  radius?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const wireRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!active) return;
    const t = clock.elapsedTime;
    if (meshRef.current) {
      const pulse = 1.0 + Math.sin(t * 6) * 0.04;
      meshRef.current.scale.set(pulse, pulse, pulse);
    }
    if (wireRef.current) {
      wireRef.current.rotation.y = t * 0.5;
      wireRef.current.rotation.z = t * 0.3;
    }
  });

  if (!active) return null;

  return (
    <group position={position}>
      {/* Outer Glow Shell */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[radius, 24, 24]} />
        <meshStandardMaterial
          color="#00e5ff"
          emissive="#00e5ff"
          emissiveIntensity={0.6}
          transparent
          opacity={0.3}
          roughness={0.1}
          metalness={0.9}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Hexagonal Forcefield Wireframe */}
      <mesh ref={wireRef}>
        <icosahedronGeometry args={[radius * 1.02, 2]} />
        <meshBasicMaterial
          color="#38bdf8"
          wireframe
          transparent
          opacity={0.4}
          depthWrite={false}
        />
      </mesh>

      <pointLight color="#00e5ff" intensity={2} distance={radius * 3} />
    </group>
  );
}

// ---------------------------------------------------------------------
// 2. HEAL EFFECT (Nanite Repair Sparkles Converging on Hull)
// ---------------------------------------------------------------------
export function HealEffect({
  active,
  position = [0, 0, 0],
}: {
  active?: boolean;
  position?: [number, number, number];
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  const count = 40;
  const [positions, offsets] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const offs = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const r = 1.8 + Math.random() * 0.8;

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      offs[i * 3] = pos[i * 3];
      offs[i * 3 + 1] = pos[i * 3 + 1];
      offs[i * 3 + 2] = pos[i * 3 + 2];
    }
    return [pos, offs];
  }, [count]);

  useFrame(({ clock }) => {
    if (!active || !pointsRef.current) return;
    const t = clock.elapsedTime * 3;
    const pos = pointsRef.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < count; i++) {
      // Inward spiraling motion toward hull
      const factor = (Math.sin(t + i) + 1) * 0.5; // 0 to 1
      pos[i * 3] = offsets[i * 3] * factor;
      pos[i * 3 + 1] = offsets[i * 3 + 1] * factor;
      pos[i * 3 + 2] = offsets[i * 3 + 2] * factor;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;

    if (lightRef.current) {
      lightRef.current.intensity = 2.0 + Math.sin(t * 2) * 1.0;
    }
  });

  if (!active) return null;

  return (
    <group position={position}>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={count}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#22c55e"
          size={0.12}
          transparent
          opacity={0.85}
          depthWrite={false}
        />
      </points>
      <pointLight ref={lightRef} color="#22c55e" intensity={2.5} distance={5} />
    </group>
  );
}

// ---------------------------------------------------------------------
// 3. SCARE SILHOUETTE (Eerie Figure in Window / Drifting by Cockpit)
// ---------------------------------------------------------------------
export function ScareSilhouette({
  active,
  position = [0, 0, 0],
}: {
  active?: boolean;
  position?: [number, number, number];
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!active || !groupRef.current) return;
    const t = clock.elapsedTime;
    groupRef.current.position.y = position[1] + Math.sin(t * 4) * 0.05;
  });

  if (!active) return null;

  return (
    <group ref={groupRef} position={position}>
      {/* Dark shadowy torso silhouette */}
      <mesh position={[0, 0.4, 0.8]}>
        <planeGeometry args={[0.3, 0.45]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.96} side={THREE.DoubleSide} />
      </mesh>
      {/* Piercing Crimson Eyes */}
      <mesh position={[-0.05, 0.48, 0.82]}>
        <circleGeometry args={[0.018, 8]} />
        <meshBasicMaterial color="#f43f5e" />
      </mesh>
      <mesh position={[0.05, 0.48, 0.82]}>
        <circleGeometry args={[0.018, 8]} />
        <meshBasicMaterial color="#f43f5e" />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------
// 4. WORMHOLE SHORTCUT GATE (Accretion Disk & Gravitational Singularity)
// ---------------------------------------------------------------------
export function WormholeEffect({
  position = [0, 0, -50],
  radius = 4.5,
  onEnter,
}: {
  position?: [number, number, number];
  radius?: number;
  onEnter?: () => void;
}) {
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const vortexRef = useRef<THREE.Points>(null);

  const pCount = 80;
  const [positions] = useMemo(() => {
    const pos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 0.5 + Math.random() * radius;
      pos[i * 3] = Math.cos(angle) * r;
      pos[i * 3 + 1] = Math.sin(angle) * r;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
    }
    return [pos];
  }, [pCount, radius]);

  useFrame((_, delta) => {
    if (ring1Ref.current) ring1Ref.current.rotation.z += delta * 1.5;
    if (ring2Ref.current) ring2Ref.current.rotation.z -= delta * 1.2;
    if (vortexRef.current) vortexRef.current.rotation.z += delta * 2.0;
  });

  return (
    <group position={position}>
      {/* Black Hole Singularity Event Horizon */}
      <mesh>
        <circleGeometry args={[radius * 0.55, 32]} />
        <meshBasicMaterial color="#000000" side={THREE.DoubleSide} />
      </mesh>

      {/* Outer Cyan Accretion Ring */}
      <mesh ref={ring1Ref}>
        <torusGeometry args={[radius, 0.25, 12, 32]} />
        <meshStandardMaterial
          color="#00e5ff"
          emissive="#00e5ff"
          emissiveIntensity={1.5}
          roughness={0.2}
        />
      </mesh>

      {/* Inner Violet Accretion Ring */}
      <mesh ref={ring2Ref}>
        <torusGeometry args={[radius * 0.75, 0.18, 12, 32]} />
        <meshStandardMaterial
          color="#a855f7"
          emissive="#a855f7"
          emissiveIntensity={1.8}
          roughness={0.2}
        />
      </mesh>

      {/* Swirling Gravitational Particles */}
      <points ref={vortexRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={pCount}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#c084fc"
          size={0.18}
          transparent
          opacity={0.8}
          depthWrite={false}
        />
      </points>

      {/* Intense Gravitational Point Light */}
      <pointLight color="#a855f7" intensity={4} distance={radius * 4} />
    </group>
  );
}

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Emergency Alarm Red Strobe Beacon
export function AlarmEffect({ active }: { active: boolean }) {
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    if (lightRef.current && active) {
      // Rapid pulse: 4 Hz
      const intensity = (Math.sin(clock.elapsedTime * 8) + 1) * 2.0;
      lightRef.current.intensity = intensity;
    }
  });

  if (!active) return null;

  return (
    <pointLight
      ref={lightRef}
      color="#f43f5e"
      intensity={3}
      distance={30}
      position={[0, 4, 2]}
    />
  );
}

// Solar Flare Radiation Wave Flash
export function SolarFlareEffect({ active }: { active: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current && active) {
      const s = 1.0 + Math.sin(clock.elapsedTime * 6) * 0.15;
      meshRef.current.scale.set(s, s, s);
    }
  });

  if (!active) return null;

  return (
    <group position={[-15, 8, -20]}>
      {/* Blinding coronal radiation wave */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[4.5, 16, 16]} />
        <meshBasicMaterial
          color="#ffedd5"
          transparent
          opacity={0.35}
          side={THREE.BackSide}
        />
      </mesh>
      <pointLight color="#f97316" intensity={4.0} distance={40} />
    </group>
  );
}

// Landing Dust Cloud Particles
export function LandingDust({ active, position = [0, -0.2, 0] }: { active: boolean; position?: [number, number, number] }) {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions] = useMemo(() => {
    const count = 40;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 0.5 + Math.random() * 2.5;
      pos[i * 3] = Math.cos(angle) * r;
      pos[i * 3 + 1] = Math.random() * 0.8;
      pos[i * 3 + 2] = Math.sin(angle) * r;
    }
    return [pos];
  }, []);

  useFrame(({ clock }) => {
    if (pointsRef.current && active) {
      pointsRef.current.rotation.y += 0.01;
      const scale = 1 + Math.sin(clock.elapsedTime * 3) * 0.2;
      pointsRef.current.scale.set(scale, 1, scale);
    }
  });

  if (!active) return null;

  return (
    <points ref={pointsRef} position={position}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#c2410c"
        size={0.15}
        transparent
        opacity={0.5}
        depthWrite={false}
      />
    </points>
  );
}

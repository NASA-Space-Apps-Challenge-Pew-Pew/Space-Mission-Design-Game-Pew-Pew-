import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

export interface LandingZoneProps {
  position?: [number, number, number];
  radius?: number;
  label?: string;
  isTouchdownReady?: boolean;
}

export function LandingZone({
  position = [0, -2, -180],
  radius = 6.0,
  label = 'CHRYSE PLANITIA LANDING ZONE',
  isTouchdownReady = true,
}: LandingZoneProps) {
  const strobesRef = useRef<THREE.Group>(null);
  const beamRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (beamRef.current) {
      beamRef.current.rotation.y = t * 0.4;
    }
    if (strobesRef.current) {
      // Rapid flashing strobe
      const flash = Math.sin(t * 8) > 0;
      strobesRef.current.visible = flash;
    }
  });

  return (
    <group position={position}>
      {/* Landing Platform Base Mesh */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <cylinderGeometry args={[radius, radius + 1, 0.4, 32]} />
        <meshStandardMaterial color="#1e293b" roughness={0.7} metalness={0.5} />
      </mesh>

      {/* Target Concentric Rings on Surface */}
      {[radius * 0.85, radius * 0.55, radius * 0.25].map((r, i) => (
        <mesh key={i} position={[0, 0.22, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[r - 0.08, r, 32]} />
          <meshBasicMaterial
            color={i === 2 ? '#22c55e' : '#38bdf8'}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* Crosshair Alignment Decals */}
      {[-1, 1].map((dir) => (
        <group key={dir}>
          {/* Horizontal crosshair */}
          <mesh position={[0, 0.22, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[radius * 1.6, 0.15]} />
            <meshBasicMaterial color="#38bdf8" transparent opacity={0.6} side={THREE.DoubleSide} />
          </mesh>
          {/* Vertical crosshair */}
          <mesh position={[0, 0.22, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
            <planeGeometry args={[radius * 1.6, 0.15]} />
            <meshBasicMaterial color="#38bdf8" transparent opacity={0.6} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}

      {/* Perimeter Strobe Lights */}
      <group ref={strobesRef}>
        {[0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2].map((angle, idx) => {
          const x = Math.cos(angle) * (radius + 0.5);
          const z = Math.sin(angle) * (radius + 0.5);
          return (
            <mesh key={idx} position={[x, 0.4, z]}>
              <sphereGeometry args={[0.2, 8, 8]} />
              <meshBasicMaterial color={idx % 2 === 0 ? '#38bdf8' : '#f59e0b'} />
            </mesh>
          );
        })}
      </group>

      {/* Vertical Holographic Descent Corridor Beam */}
      <mesh ref={beamRef} position={[0, 15, 0]}>
        <cylinderGeometry args={[radius * 0.9, radius, 30, 16, 1, true]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.12}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Landing Zone Text */}
      {label && (
        <group position={[0, 0.25, radius + 1.2]} rotation={[-Math.PI / 2, 0, 0]}>
          <Text
            fontSize={0.5}
            color="#38bdf8"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.04}
            outlineColor="#0f172a"
          >
            {label}
          </Text>
        </group>
      )}

      {/* Runway Point Light */}
      <pointLight position={[0, 2, 0]} color="#38bdf8" intensity={3} distance={radius * 3} />
    </group>
  );
}

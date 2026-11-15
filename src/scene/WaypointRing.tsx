import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

export interface WaypointRingProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  radius?: number;
  state?: 'active' | 'next' | 'reached';
  label?: string;
}

export function WaypointRing({
  position,
  rotation = [0, 0, 0],
  radius = 3.5,
  state = 'active',
  label,
}: WaypointRingProps) {
  const ringRef = useRef<THREE.Mesh>(null);
  const arrowRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  // Animate pulse & rotational glow
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (ringRef.current && state === 'active') {
      const pulse = 1.0 + Math.sin(t * 4) * 0.05;
      ringRef.current.scale.set(pulse, pulse, 1.0);
    }
    if (arrowRef.current) {
      arrowRef.current.position.z = Math.sin(t * 3) * 0.2;
    }
    if (lightRef.current && state === 'active') {
      lightRef.current.intensity = 2.0 + Math.sin(t * 5) * 0.8;
    }
  });

  const { ringColor, ringOpacity, emissiveIntensity } = useMemo(() => {
    if (state === 'reached') {
      return { ringColor: '#eab308', ringOpacity: 0.3, emissiveIntensity: 0.2 };
    }
    if (state === 'active') {
      return { ringColor: '#22c55e', ringOpacity: 0.9, emissiveIntensity: 1.2 };
    }
    // next
    return { ringColor: '#38bdf8', ringOpacity: 0.45, emissiveIntensity: 0.5 };
  }, [state]);

  return (
    <group position={position} rotation={rotation}>
      {/* Primary Glowing Torus Ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[radius, 0.12, 12, 32]} />
        <meshStandardMaterial
          color={ringColor}
          emissive={ringColor}
          emissiveIntensity={emissiveIntensity}
          transparent
          opacity={ringOpacity}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Outer Thin Strobe Ring */}
      <mesh>
        <torusGeometry args={[radius * 1.08, 0.03, 8, 32]} />
        <meshBasicMaterial color={ringColor} transparent opacity={ringOpacity * 0.6} />
      </mesh>

      {/* Directional Chevron / Arrow pointing forward through ring */}
      {state === 'active' && (
        <group ref={arrowRef} position={[0, 0, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.3, 0.6, 3]} />
            <meshBasicMaterial color={ringColor} transparent opacity={0.7} />
          </mesh>
        </group>
      )}

      {/* Point Light Illuminating Passing Ship */}
      {state === 'active' && (
        <pointLight ref={lightRef} color={ringColor} intensity={2} distance={radius * 3} />
      )}

      {/* Waypoint Text Label */}
      {label && (
        <group position={[0, radius + 0.6, 0]}>
          <Text
            fontSize={0.4}
            color={ringColor}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.04}
            outlineColor="#020617"
          >
            {label}
          </Text>
        </group>
      )}
    </group>
  );
}

import React, { useMemo } from 'react';
import * as THREE from 'three';

export function MartianTerrain() {
  // Generate low-poly Martian ground mesh with undulating dunes
  const groundGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(60, 60, 32, 32);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      // Gentle rolling dunes and crater rises
      const y =
        Math.sin(x * 0.15) * Math.cos(z * 0.15) * 0.8 +
        Math.sin(x * 0.3 + 1.2) * 0.4 +
        Math.cos(z * 0.25) * 0.3;
      pos.setY(i, y);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Scatter some low-poly Martian boulders
  const rocks = useMemo(() => {
    const list: { pos: [number, number, number]; scale: [number, number, number]; rot: [number, number, number] }[] = [];
    const count = 18;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const dist = 3.5 + Math.random() * 12;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const s = 0.2 + Math.random() * 0.5;
      list.push({
        pos: [x, s * 0.3, z],
        scale: [s, s * 0.7, s],
        rot: [Math.random() * 0.4, Math.random() * Math.PI, Math.random() * 0.4],
      });
    }
    return list;
  }, []);

  return (
    <group position={[0, -0.6, 0]}>
      {/* Ground Regolith Plane */}
      <mesh geometry={groundGeo}>
        <meshStandardMaterial
          color="#9a3412"
          roughness={0.9}
          metalness={0.05}
          flatShading={true}
        />
      </mesh>

      {/* Surface Boulders */}
      {rocks.map((r, idx) => (
        <mesh
          key={idx}
          position={r.pos}
          rotation={r.rot}
          scale={r.scale}
        >
          <dodecahedronGeometry args={[0.5, 0]} />
          <meshStandardMaterial color="#6c270f" roughness={0.95} />
        </mesh>
      ))}

      {/* Earth as a "Pale Blue Dot" in the Martian night/dusk sky */}
      <group position={[12, 14, -25]}>
        <mesh>
          <sphereGeometry args={[0.25, 12, 12]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
        <pointLight color="#38bdf8" intensity={0.4} distance={4} />
      </group>
    </group>
  );
}

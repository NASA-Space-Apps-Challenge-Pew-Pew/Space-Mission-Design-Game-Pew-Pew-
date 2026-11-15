import React, { useMemo } from 'react';
import * as THREE from 'three';
import type { OrbitLineProps } from './types';

export function OrbitLine({
  progress = 0,
  startPos = [-4.5, 0, -1],
  endPos = [4.5, 0, -1],
  peakHeight = 2.2,
  color = '#00e5ff',
}: OrbitLineProps) {
  // Normalize progress (support 0-1 or 0-100)
  const normProgress = progress > 1 ? progress / 100 : progress;

  // Generate smooth elliptical Hohmann transfer arc
  const { curvePoints, progressPoint } = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const segments = 64;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = startPos[0] + (endPos[0] - startPos[0]) * t;
      const y = startPos[1] + (endPos[1] - startPos[1]) * t + Math.sin(t * Math.PI) * peakHeight;
      const z = startPos[2] + (endPos[2] - startPos[2]) * t;
      pts.push(new THREE.Vector3(x, y, z));
    }

    // Exact ship position on arc
    const ptX = startPos[0] + (endPos[0] - startPos[0]) * normProgress;
    const ptY = startPos[1] + (endPos[1] - startPos[1]) * normProgress + Math.sin(normProgress * Math.PI) * peakHeight;
    const ptZ = startPos[2] + (endPos[2] - startPos[2]) * normProgress;
    const progPt = new THREE.Vector3(ptX, ptY, ptZ);

    return { curvePoints: pts, progressPoint: progPt };
  }, [startPos, endPos, peakHeight, normProgress]);

  const lineGeo = useMemo(() => new THREE.BufferGeometry().setFromPoints(curvePoints), [curvePoints]);

  const lineObj = useMemo(() => {
    const mat = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.35,
      linewidth: 1,
      depthWrite: false,
    });
    return new THREE.Line(lineGeo, mat);
  }, [lineGeo, color]);

  return (
    <group>
      {/* Background Trajectory Guide Line */}
      <primitive object={lineObj} />

      {/* Trajectory Pulse Rings along the line */}
      <mesh position={[progressPoint.x, progressPoint.y, progressPoint.z]}>
        <ringGeometry args={[0.08, 0.12, 16]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { Starfield } from './Starfield';
import { Planet } from './Planet';
import { Spaceship } from './Spaceship';
import { OrbitLine } from './OrbitLine';
import { Rover } from './Rover';
import { MartianTerrain } from './MartianTerrain';
import { AlarmEffect, SolarFlareEffect, LandingDust } from './Effects';
import { StageCameraController } from './StageCameraController';
import type { SceneProps } from './types';

// The Inner 3D Content (rendered inside React Three Fiber Canvas)
export function SceneContent({
  stage,
  progress = 0,
  isAlarm = false,
  activeEvents = [],
  isBurning = false,
  scare = null,
}: SceneProps) {
  // Normalize progress (handle 0-1 or 0-100)
  const normProgress = progress > 1 ? progress / 100 : Math.max(0, Math.min(1, progress));

  // Determine hazard and scare flags
  const isSolarFlare = activeEvents.includes('solar_flare');
  const isHullDamaged = activeEvents.includes('micro_meteor') || activeEvents.includes('hull_damage');
  const isLandingHazard = activeEvents.includes('landing_dust');
  const isBlackout = scare?.type === 'blackout';
  const hasSilhouette = scare?.type === 'silhouette';
  const hasAlarm = isAlarm || scare?.type === 'alarm';

  // Thrusting state: burns during launch or arrival or explicit burn prop
  const burning = isBurning || stage === 'launch' || (stage === 'arrival' && normProgress < 0.5);

  // Interplanetary flight coordinates along Hohmann transfer arc
  const transitShipState = useMemo(() => {
    const x = -3.8 + normProgress * 7.6;
    const y = Math.sin(normProgress * Math.PI) * 1.8;
    const z = -0.5;

    // Tangent angle along flight trajectory
    const dx = 7.6;
    const dy = Math.cos(normProgress * Math.PI) * Math.PI * 1.8;
    const angle = Math.atan2(dy, dx);

    return {
      pos: [x, y, z] as [number, number, number],
      rot: [0, 0, angle * 0.4] as [number, number, number],
    };
  }, [normProgress]);

  // Lighting intensity with blackout dimming
  const ambientIntensity = isBlackout ? 0.08 : 0.45;
  const sunIntensity = isBlackout ? 0.3 : 1.6;

  return (
    <>
      {/* 1. Camera Director */}
      <StageCameraController stage={stage} />

      {/* 2. Optimized Lighting Model (1 Sun + 1 Ambient, zero shadow overhead) */}
      <ambientLight intensity={ambientIntensity} color="#e0f2fe" />
      <directionalLight position={[8, 12, 6]} intensity={sunIntensity} color="#ffffff" />

      {/* 3. Deep Space Stars */}
      <Starfield count={stage === 'surface' ? 1200 : 2500} speed={stage === 'transit' ? 0.04 : 0.015} />

      {/* 4. Hazard & Scare Effects */}
      <AlarmEffect active={hasAlarm} />
      <SolarFlareEffect active={isSolarFlare} />

      {/* ------------------------------------------------------------- */}
      {/* STAGE-SPECIFIC 3D GRAPH                                       */}
      {/* ------------------------------------------------------------- */}

      {/* STAGE: DESIGN (Earth parking orbit) */}
      {stage === 'design' && (
        <group>
          {/* Earth majestic in view */}
          <Planet type="earth" position={[-2.0, -0.6, -2.5]} scale={1.15} rotationSpeed={0.06} />
          {/* Distant Moon */}
          <Planet type="moon" position={[-5.0, 3.0, -8.0]} scale={0.5} rotationSpeed={0.02} />
          {/* NOVA-1 ready in parking orbit */}
          <Spaceship
            position={[0.8, 0.3, 0.6]}
            rotation={[0.1, 0.4, 0]}
            scale={0.9}
            isBurning={false}
            hasSilhouette={hasSilhouette}
          />
        </group>
      )}

      {/* STAGE: LAUNCH (Accelerating away from Earth) */}
      {stage === 'launch' && (
        <group>
          {/* Earth receding behind */}
          <Planet type="earth" position={[0, -5.2, -4.5]} scale={1.5} rotationSpeed={0.08} />
          {/* Ship firing main engines ascending */}
          <Spaceship
            position={[0, 0.2, 0.5]}
            rotation={[-0.3, 0, 0]}
            scale={1.0}
            isBurning={true}
            hasSilhouette={hasSilhouette}
          />
        </group>
      )}

      {/* STAGE: TRANSIT (Interplanetary deep space) */}
      {stage === 'transit' && (
        <group>
          {/* Earth receding on the left */}
          <Planet type="earth" position={[-5.2, -0.5, -3.2]} scale={0.8} rotationSpeed={0.04} />
          {/* Mars approaching on the right */}
          <Planet type="mars" position={[5.2, -0.2, -3.2]} scale={0.7} rotationSpeed={0.05} />
          {/* Glowing Hohmann Transfer Trajectory Arc */}
          <OrbitLine
            progress={normProgress}
            startPos={[-4.5, -0.5, -2.5]}
            endPos={[4.5, -0.2, -2.5]}
            peakHeight={2.0}
            color="#00e5ff"
          />
          {/* Ship navigating along the trajectory */}
          <Spaceship
            position={transitShipState.pos}
            rotation={transitShipState.rot}
            scale={0.85}
            progress={normProgress}
            isBurning={burning}
            isDamaged={isHullDamaged}
            hasSilhouette={hasSilhouette}
          />
        </group>
      )}

      {/* STAGE: ARRIVAL (Mars orbit insertion & atmospheric entry) */}
      {stage === 'arrival' && (
        <group>
          {/* Mars dominating the view */}
          <Planet type="mars" position={[2.4, 0, -1.2]} scale={1.3} rotationSpeed={0.06} />
          {/* Ship performing capture / entry burn */}
          <Spaceship
            position={[0.2, 0.4, 0.8]}
            rotation={[0.2, -0.6, 0.1]}
            scale={0.95}
            isBurning={burning}
            isDamaged={isHullDamaged}
            hasSilhouette={hasSilhouette}
          />
          <LandingDust active={isLandingHazard} position={[0.2, 0, 0.8]} />
        </group>
      )}

      {/* STAGE: SURFACE (Martian ground objective) */}
      {stage === 'surface' && (
        <group>
          {/* Red dunes terrain & pale blue dot Earth */}
          <MartianTerrain />
          {/* Deployed ARES-V science rover */}
          <Rover
            position={[0, -0.1, 0.6]}
            rotation={[0, 0.4, 0]}
            scale={0.85}
            deployed={true}
          />
          {/* Lander / Ascent Vehicle in background */}
          <Spaceship
            position={[3.8, 0.9, -5.0]}
            rotation={[0, -0.8, 0]}
            scale={0.7}
            isBurning={false}
          />
          <LandingDust active={true} position={[3.8, 0.2, -5.0]} />
        </group>
      )}

      {/* STAGE: ENDED / FALLBACK */}
      {stage === 'ended' && (
        <group>
          <Planet type="mars" position={[1.8, 0.4, -2.5]} scale={1.1} rotationSpeed={0.05} />
          <Planet type="earth" position={[-3.5, -0.6, -4.5]} scale={0.7} rotationSpeed={0.03} />
          <Spaceship
            position={[0, 0, 1.0]}
            rotation={[0, 0.5, 0]}
            scale={0.9}
            isBurning={false}
          />
        </group>
      )}
    </>
  );
}

// Master Canvas Component (takes props and renders full-screen WebGL canvas)
export function Scene({
  stage,
  progress = 0,
  isAlarm = false,
  activeEvents = [],
  isBurning = false,
  scare = null,
  location = 'earth',
  className = 'absolute inset-0 z-0 pointer-events-none',
}: SceneProps) {
  return (
    <div className={className}>
      <Canvas
        camera={{ position: [0, 1.5, 7], fov: 45 }}
        dpr={[1, 1.5]} // Mobile budget: capped DPR prevents overheating
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true,
        }}
      >
        <color attach="background" args={['#030712']} />
        <SceneContent
          stage={stage}
          progress={progress}
          isAlarm={isAlarm}
          activeEvents={activeEvents}
          isBurning={isBurning}
          scare={scare}
          location={location}
        />
      </Canvas>
    </div>
  );
}

export default Scene;

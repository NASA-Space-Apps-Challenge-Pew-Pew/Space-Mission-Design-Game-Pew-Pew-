import React, { useEffect, useMemo, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

export interface DesktopBloomProps {
  enabled?: boolean;
  strength?: number;
  radius?: number;
  threshold?: number;
}

export function DesktopBloom({
  enabled = true,
  strength = 0.5,
  radius = 0.4,
  threshold = 0.82,
}: DesktopBloomProps) {
  const { gl, scene, camera, size } = useThree();

  // Mobile detection: strictly bypass postprocessing on mobile devices
  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return true;
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.innerWidth < 768
    );
  }, []);

  const composer = useMemo(() => {
    // If mobile or explicitly disabled, do not instantiate postprocessing
    if (isMobile || !enabled) return null;

    try {
      const comp = new EffectComposer(gl);
      comp.addPass(new RenderPass(scene, camera));

      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(size.width, size.height),
        strength,
        radius,
        threshold
      );
      comp.addPass(bloomPass);
      return comp;
    } catch (err) {
      console.warn('DesktopBloom initialization skipped:', err);
      return null;
    }
  }, [gl, scene, camera, isMobile, enabled, strength, radius, threshold, size]);

  // Handle window resizing
  useEffect(() => {
    if (composer) {
      composer.setSize(size.width, size.height);
    }
  }, [composer, size]);

  // Take over render call with priority 1 only on desktop when enabled
  useFrame((_, delta) => {
    if (composer && enabled && !isMobile) {
      gl.autoClear = false;
      gl.clear();
      composer.render(delta);
    }
  }, 1);

  return null;
}

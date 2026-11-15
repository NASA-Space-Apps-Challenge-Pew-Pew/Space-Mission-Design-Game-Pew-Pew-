import React from 'react';
import { Scene } from './Scene';
import type { SceneProps } from './types';

/**
 * PlaceholderScene: Backwards-compatible export that seamlessly upgrades
 * to the full, production-ready 3D scene with optimized GLTF models,
 * stage camera transitions, procedural fallbacks, and mobile budget compliance.
 */
export function PlaceholderScene(props: SceneProps) {
  return <Scene {...props} />;
}

export default PlaceholderScene;

import fs from 'fs';
import path from 'path';
import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

// Polyfill FileReader for Node.js
globalThis.FileReader = class FileReader {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buf) => {
      this.result = buf;
      if (this.onload) this.onload({ target: this });
      if (this.onloadend) this.onloadend({ target: this });
    });
  }
};

const exporter = new GLTFExporter();

function exportGLB(scene, outputPath) {
  return new Promise((resolve, reject) => {
    exporter.parse(
      scene,
      (glb) => {
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(outputPath, Buffer.from(glb));
        console.log(`Exported ${outputPath} (${(glb.byteLength / 1024).toFixed(1)} KB)`);
        resolve(glb.byteLength);
      },
      (err) => reject(err),
      { binary: true }
    );
  });
}

// ---------------------------------------------------------------------
// 1. SKIN: ORB (Energy Drone / Shield Probe / Beacon)
// ---------------------------------------------------------------------
function createOrbModel() {
  const group = new THREE.Group();
  group.name = 'Skin_Orb';

  // Glowing energy core
  const coreMat = new THREE.MeshStandardMaterial({
    color: 0x00e5ff,
    emissive: 0x00e5ff,
    emissiveIntensity: 0.9,
    roughness: 0.2,
    metalness: 0.5,
    name: 'OrbCoreMat',
  });
  const coreMesh = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 16), coreMat);
  group.add(coreMesh);

  // Outer gimbal rings
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    roughness: 0.4,
    metalness: 0.8,
    name: 'OrbRingMat',
  });
  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.04, 8, 24), ringMat);
  ring1.rotation.x = Math.PI / 4;
  group.add(ring1);

  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.04, 8, 24), ringMat);
  ring2.rotation.y = Math.PI / 3;
  group.add(ring2);

  // Sensor node
  const sensorMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const sensor = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), sensorMat);
  sensor.position.set(0, 0, 0.52);
  group.add(sensor);

  return group;
}

// ---------------------------------------------------------------------
// 2. SKIN: CRATE (Supply Crate / Fuel Pod / Salvage Container)
// ---------------------------------------------------------------------
function createCrateModel() {
  const group = new THREE.Group();
  group.name = 'Skin_Crate';

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.6,
    metalness: 0.4,
    name: 'CrateBodyMat',
  });
  const bracketMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.3,
    metalness: 0.8,
    name: 'CrateBracketMat',
  });
  const glowMat = new THREE.MeshStandardMaterial({
    color: 0x22c55e,
    emissive: 0x22c55e,
    emissiveIntensity: 0.8,
    roughness: 0.2,
    name: 'CrateGlowMat',
  });

  // Main container body
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.7, 1.4), bodyMat);
  group.add(body);

  // Corner reinforcement braces
  const braceGeom = new THREE.BoxGeometry(0.12, 0.74, 0.12);
  [-0.46, 0.46].forEach((x) => {
    [-0.66, 0.66].forEach((z) => {
      const brace = new THREE.Mesh(braceGeom, bracketMat);
      brace.position.set(x, 0, z);
      group.add(brace);
    });
  });

  // Glowing status / resource latch band
  const band = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.12, 1.44), glowMat);
  group.add(band);

  return group;
}

// ---------------------------------------------------------------------
// 3. SKIN: ROCK (Asteroid Chunk / Mineral Ore / Meteor Fragment)
// ---------------------------------------------------------------------
function createRockModel() {
  const group = new THREE.Group();
  group.name = 'Skin_Rock';

  const geom = new THREE.DodecahedronGeometry(0.8, 1);
  const pos = geom.attributes.position;
  // Displace vertices for faceted, craggy asteroid look
  for (let i = 0; i < pos.count; i++) {
    const v = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));
    const noise = 1.0 + (Math.sin(v.x * 5) * Math.cos(v.y * 5) * 0.25);
    v.multiplyScalar(noise);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geom.computeVertexNormals();

  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x52525b,
    roughness: 0.9,
    metalness: 0.15,
    flatShading: true,
    name: 'RockMat',
  });

  const rockMesh = new THREE.Mesh(geom, rockMat);
  group.add(rockMesh);

  return group;
}

// ---------------------------------------------------------------------
// 4. SKIN: SHIP (Escort Fighter / Scout Drone / Interceptor)
// ---------------------------------------------------------------------
function createFighterModel() {
  const group = new THREE.Group();
  group.name = 'Skin_Ship';

  const hullMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.35,
    metalness: 0.7,
    name: 'FighterHullMat',
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    emissive: 0x0284c7,
    emissiveIntensity: 0.6,
    roughness: 0.2,
    name: 'FighterAccentMat',
  });
  const canopyMat = new THREE.MeshStandardMaterial({
    color: 0x0ea5e9,
    roughness: 0.1,
    metalness: 0.9,
    name: 'FighterCanopyMat',
  });

  // Fuselage (needle nose cone + body)
  const fuselage = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.8, 8), hullMat);
  fuselage.rotation.x = Math.PI / 2;
  group.add(fuselage);

  // Cockpit canopy
  const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), canopyMat);
  canopy.position.set(0, 0.15, 0.2);
  canopy.scale.set(0.8, 0.6, 1.4);
  group.add(canopy);

  // Swept delta wings
  const wingGeom = new THREE.BufferGeometry();
  const wingVertices = new Float32Array([
    // Left wing
    0, 0, 0.2,
    -1.4, 0, -0.6,
    0, 0, -0.6,
    // Right wing
    0, 0, 0.2,
    0, 0, -0.6,
    1.4, 0, -0.6,
  ]);
  wingGeom.setAttribute('position', new THREE.BufferAttribute(wingVertices, 3));
  wingGeom.computeVertexNormals();
  const wings = new THREE.Mesh(wingGeom, hullMat);
  group.add(wings);

  // Twin engine thrusters with glowing nozzles
  [-0.2, 0.2].forEach((x) => {
    const thruster = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.4, 8), hullMat);
    thruster.rotation.x = Math.PI / 2;
    thruster.position.set(x, 0, -0.9);
    group.add(thruster);

    const glow = new THREE.Mesh(new THREE.CircleGeometry(0.09, 8), accentMat);
    glow.position.set(x, 0, -1.11);
    glow.rotation.y = Math.PI;
    group.add(glow);
  });

  return group;
}

// ---------------------------------------------------------------------
// 5. SKIN: CREATURE (Space Whale / Cosmic Bio-Entity)
// ---------------------------------------------------------------------
function createCreatureModel() {
  const group = new THREE.Group();
  group.name = 'Skin_Creature';

  const skinMat = new THREE.MeshStandardMaterial({
    color: 0x1e3a8a, // Deep bioluminescent midnight blue
    roughness: 0.5,
    metalness: 0.2,
    name: 'CreatureSkinMat',
  });
  const bioMat = new THREE.MeshStandardMaterial({
    color: 0x06b6d4, // Cyan bioluminescent nodes
    emissive: 0x06b6d4,
    emissiveIntensity: 0.8,
    roughness: 0.2,
    name: 'CreatureBioMat',
  });

  // Streamlined organic whale body (scaled sphere)
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.6, 14, 12), skinMat);
  body.scale.set(0.9, 0.8, 2.2);
  group.add(body);

  // Dorsal bioluminescent ridge
  for (let z = -0.8; z <= 0.8; z += 0.3) {
    const node = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), bioMat);
    node.position.set(0, 0.5, z);
    group.add(node);
  }

  // Pectoral flukes (fins)
  [-1, 1].forEach((side) => {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.04, 0.4), skinMat);
    fin.position.set(side * 0.9, -0.1, 0.1);
    fin.rotation.z = side * -0.25;
    fin.rotation.y = side * 0.3;
    group.add(fin);
  });

  // Tail fluke
  const tail = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.04, 0.3), skinMat);
  tail.position.set(0, 0, -1.45);
  tail.rotation.y = 0.1;
  group.add(tail);

  return group;
}

// ---------------------------------------------------------------------
// 6. SKIN: STATION (Orbital Comms Relay / Deep Space Outpost)
// ---------------------------------------------------------------------
function createStationModel() {
  const group = new THREE.Group();
  group.name = 'Skin_Station';

  const structMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.4,
    metalness: 0.7,
    name: 'StationStructMat',
  });
  const solarMat = new THREE.MeshStandardMaterial({
    color: 0x0c4a6e,
    emissive: 0x0369a1,
    emissiveIntensity: 0.3,
    roughness: 0.2,
    metalness: 0.8,
    name: 'StationSolarMat',
  });
  const lightMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x38bdf8,
    emissiveIntensity: 1.0,
    name: 'StationLightMat',
  });

  // Central hub cylinder
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.8, 12), structMat);
  group.add(hub);

  // Rotating habitat ring (torus)
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.12, 8, 24), structMat);
  ring.rotation.x = Math.PI / 2;
  group.add(ring);

  // 4 Radial structural spokes
  for (let i = 0; i < 4; i++) {
    const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.3, 6), structMat);
    spoke.rotation.z = Math.PI / 2;
    spoke.rotation.y = (i * Math.PI) / 2;
    group.add(spoke);
  }

  // Communication antenna mast
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.0, 6), structMat);
  mast.position.y = 1.4;
  group.add(mast);

  // Top flashing beacon light
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), lightMat);
  beacon.position.y = 1.9;
  group.add(beacon);

  // Dual solar panels
  [-1, 1].forEach((side) => {
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.02, 1.4), solarMat);
    panel.position.set(side * 1.0, -0.6, 0);
    group.add(panel);
  });

  return group;
}

// ---------------------------------------------------------------------
// RUN MODEL EXPORTS
// ---------------------------------------------------------------------
async function run() {
  console.log('--- Generating V2 Entity Skins and Models ---');

  const models = [
    { name: 'skin_orb.glb', create: createOrbModel },
    { name: 'skin_crate.glb', create: createCrateModel },
    { name: 'skin_rock.glb', create: createRockModel },
    { name: 'skin_ship.glb', create: createFighterModel },
    { name: 'skin_creature.glb', create: createCreatureModel },
    { name: 'skin_station.glb', create: createStationModel },
  ];

  let totalBytes = 0;
  for (const m of models) {
    const scene = new THREE.Scene();
    scene.add(m.create());
    const bytes = await exportGLB(scene, path.join('public/models', m.name));
    totalBytes += bytes;
  }

  console.log(`\nAll 6 skins exported successfully! Total size: ${(totalBytes / 1024).toFixed(1)} KB`);
}

run().catch((err) => {
  console.error('Fatal error generating V2 models:', err);
  process.exit(1);
});

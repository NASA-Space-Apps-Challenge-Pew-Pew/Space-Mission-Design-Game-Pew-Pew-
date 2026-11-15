import fs from 'fs';
import path from 'path';
import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

// Polyfill FileReader for Node.js environment
globalThis.FileReader = class FileReader {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then(buf => {
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
// 1. SHIP MODEL: NOVA-1 Deep Space Transit Vessel
// ---------------------------------------------------------------------
function createShipModel() {
  const group = new THREE.Group();
  group.name = 'Ship_NOVA1';

  // Materials
  const hullMat = new THREE.MeshStandardMaterial({
    color: 0xeeeeee,
    roughness: 0.35,
    metalness: 0.25,
    name: 'HullWhite'
  });
  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x22252a,
    roughness: 0.5,
    metalness: 0.8,
    name: 'DarkMetal'
  });
  const goldFoilMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    roughness: 0.3,
    metalness: 0.85,
    name: 'GoldFoil'
  });
  const solarPanelMat = new THREE.MeshStandardMaterial({
    color: 0x081e3f,
    roughness: 0.15,
    metalness: 0.9,
    emissive: 0x040c1a,
    name: 'SolarPanels'
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x002233,
    roughness: 0.1,
    metalness: 0.9,
    name: 'ObservationWindow'
  });
  const cyanEmissiveMat = new THREE.MeshStandardMaterial({
    color: 0x00e5ff,
    emissive: 0x00e5ff,
    emissiveIntensity: 0.8,
    roughness: 0.2,
    name: 'CyanAccent'
  });
  const engineGlowMat = new THREE.MeshStandardMaterial({
    color: 0x00b4d8,
    emissive: 0x00e5ff,
    emissiveIntensity: 1.0,
    roughness: 0.2,
    name: 'EngineInterior'
  });

  // Nose / Command Module (Cylinder tapering to rounded cone)
  const noseGeom = new THREE.ConeGeometry(0.7, 1.2, 16);
  noseGeom.rotateX(Math.PI / 2);
  const nose = new THREE.Mesh(noseGeom, hullMat);
  nose.position.z = 2.4;
  group.add(nose);

  // Command Cupola / Window (Porthole on top)
  const windowGeom = new THREE.SphereGeometry(0.28, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  const windowMesh = new THREE.Mesh(windowGeom, glassMat);
  windowMesh.position.set(0, 0.3, 2.1);
  windowMesh.rotation.x = -Math.PI / 6;
  group.add(windowMesh);

  // Cyan cockpit trim rings
  const ringGeom = new THREE.TorusGeometry(0.68, 0.03, 8, 24);
  const ringMesh = new THREE.Mesh(ringGeom, cyanEmissiveMat);
  ringMesh.position.z = 1.8;
  group.add(ringMesh);

  // Primary Crew Fuselage (Central Cylinder)
  const bodyGeom = new THREE.CylinderGeometry(0.7, 0.7, 2.4, 18);
  bodyGeom.rotateX(Math.PI / 2);
  const body = new THREE.Mesh(bodyGeom, hullMat);
  body.position.z = 0.6;
  group.add(body);

  // Gold foil service module band
  const foilGeom = new THREE.CylinderGeometry(0.72, 0.72, 0.8, 18);
  foilGeom.rotateX(Math.PI / 2);
  const foil = new THREE.Mesh(foilGeom, goldFoilMat);
  foil.position.z = 0.2;
  group.add(foil);

  // Heat Radiator Panels (Dorsal & Ventral)
  const radGeom = new THREE.BoxGeometry(0.04, 0.8, 1.4);
  const radTop = new THREE.Mesh(radGeom, darkMetalMat);
  radTop.position.set(0, 0.9, 0.5);
  group.add(radTop);

  const radBottom = new THREE.Mesh(radGeom, darkMetalMat);
  radBottom.position.set(0, -0.9, 0.5);
  group.add(radBottom);

  // Solar Array Trusses & Wings (Left and Right)
  [-1, 1].forEach((side) => {
    // Truss boom
    const boomGeom = new THREE.CylinderGeometry(0.05, 0.05, 1.2, 8);
    boomGeom.rotateZ(Math.PI / 2);
    const boom = new THREE.Mesh(boomGeom, darkMetalMat);
    boom.position.set(side * 1.2, 0, 0.4);
    group.add(boom);

    // Main Solar Array Panel
    const panelGeom = new THREE.BoxGeometry(1.8, 0.03, 1.1);
    const panel = new THREE.Mesh(panelGeom, solarPanelMat);
    panel.position.set(side * 2.6, 0, 0.4);
    group.add(panel);

    // Panel border frame
    const frameGeom = new THREE.BoxGeometry(1.84, 0.04, 0.05);
    const frameF = new THREE.Mesh(frameGeom, goldFoilMat);
    frameF.position.set(side * 2.6, 0, 0.95);
    group.add(frameF);
    const frameB = new THREE.Mesh(frameGeom, goldFoilMat);
    frameB.position.set(side * 2.6, 0, -0.15);
    group.add(frameB);
  });

  // High Gain Antenna (Communications Suite)
  const dishStemGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.6, 6);
  const dishStem = new THREE.Mesh(dishStemGeom, darkMetalMat);
  dishStem.position.set(0.4, 0.85, 1.3);
  dishStem.rotation.z = -0.3;
  group.add(dishStem);

  const dishGeom = new THREE.SphereGeometry(0.35, 12, 10, 0, Math.PI * 2, 0, Math.PI / 3);
  const dish = new THREE.Mesh(dishGeom, hullMat);
  dish.position.set(0.55, 1.1, 1.3);
  dish.rotation.x = -Math.PI / 4;
  dish.rotation.y = 0.3;
  group.add(dish);

  // Aft Propulsion / Engine Mount Structure
  const aftGeom = new THREE.CylinderGeometry(0.7, 0.55, 0.8, 16);
  aftGeom.rotateX(Math.PI / 2);
  const aft = new THREE.Mesh(aftGeom, darkMetalMat);
  aft.position.z = -1.0;
  group.add(aft);

  // Main Rocket Engine Bell
  const bellGeom = new THREE.ConeGeometry(0.5, 0.9, 16, 1, true);
  bellGeom.rotateX(-Math.PI / 2);
  const bell = new THREE.Mesh(bellGeom, darkMetalMat);
  bell.position.z = -1.8;
  group.add(bell);

  // Interior Engine Glow Ring
  const bellGlowGeom = new THREE.ConeGeometry(0.42, 0.5, 16, 1, true);
  bellGlowGeom.rotateX(-Math.PI / 2);
  const bellGlow = new THREE.Mesh(bellGlowGeom, engineGlowMat);
  bellGlow.position.z = -1.65;
  group.add(bellGlow);

  // 4 RCS Thruster Pods
  const rcsAngles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
  rcsAngles.forEach((angle) => {
    const podGeom = new THREE.BoxGeometry(0.12, 0.12, 0.2);
    const pod = new THREE.Mesh(podGeom, darkMetalMat);
    const r = 0.72;
    pod.position.set(Math.cos(angle) * r, Math.sin(angle) * r, -0.6);
    group.add(pod);
  });

  return group;
}

// ---------------------------------------------------------------------
// 2. PLANET GENERATORS (Earth, Mars, Moon) with detailed vertex colors
// ---------------------------------------------------------------------
function createEarthModel() {
  const group = new THREE.Group();
  group.name = 'Earth_Planet';

  const radius = 3.0;
  const geom = new THREE.IcosahedronGeometry(radius, 5); // Smooth geodesic sphere
  const count = geom.attributes.position.count;
  const colors = new Float32Array(count * 3);
  const pos = geom.attributes.position;

  const oceanBlue = new THREE.Color(0x0a2e5c);
  const shallowBlue = new THREE.Color(0x13548a);
  const landGreen = new THREE.Color(0x2d6327);
  const landTan = new THREE.Color(0x9a8052);
  const mountainRock = new THREE.Color(0x615444);
  const polarSnow = new THREE.Color(0xf2f7fc);
  const cloudWhite = new THREE.Color(0xffffff);

  for (let i = 0; i < count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    // Spherical coordinates
    const lat = Math.asin(y / radius);
    const lon = Math.atan2(z, x);

    // Procedural continent masks based on spherical harmonics
    const n1 = Math.sin(lon * 2.0) * Math.cos(lat * 3.0);
    const n2 = Math.sin(lon * 4.5 + 1.2) * Math.sin(lat * 2.2);
    const n3 = Math.cos(lon * 1.5 - 0.8) * Math.sin(lat * 4.0);
    const continentNoise = n1 * 0.5 + n2 * 0.35 + n3 * 0.25;

    // Cloud swirl noise
    const cNoise = Math.sin(lon * 6.0 + lat * 4.0) * Math.cos(lat * 5.0 - lon * 2.0);

    const c = new THREE.Color();
    const absLat = Math.abs(lat);

    if (absLat > 1.25) {
      // Polar Ice Caps
      c.copy(polarSnow);
    } else if (continentNoise > 0.12) {
      // Land
      if (absLat > 0.95) {
        c.copy(polarSnow);
      } else if (continentNoise > 0.42) {
        c.copy(mountainRock);
      } else if (absLat < 0.45 && (lon > 0.2 && lon < 1.6)) {
        // Sahara / desert belt
        c.copy(landTan);
      } else {
        c.copy(landGreen);
      }
    } else {
      // Ocean
      if (continentNoise > 0.05) {
        c.copy(shallowBlue);
      } else {
        c.copy(oceanBlue);
      }
    }

    // Blend delicate white cloud swirl bands
    if (cNoise > 0.65 && absLat < 1.3) {
      c.lerp(cloudWhite, 0.45);
    }

    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geom.computeVertexNormals();

  const earthMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.6,
    metalness: 0.1,
    name: 'EarthSurface'
  });

  const earthMesh = new THREE.Mesh(geom, earthMat);
  group.add(earthMesh);

  // Subtle atmosphere glow shell
  const atmoGeom = new THREE.IcosahedronGeometry(radius * 1.025, 4);
  const atmoMat = new THREE.MeshStandardMaterial({
    color: 0x4fc3f7,
    transparent: true,
    opacity: 0.22,
    roughness: 0.2,
    metalness: 0.1,
    name: 'EarthAtmosphere'
  });
  group.add(new THREE.Mesh(atmoGeom, atmoMat));

  return group;
}

function createMarsModel() {
  const group = new THREE.Group();
  group.name = 'Mars_Planet';

  const radius = 2.2;
  const geom = new THREE.IcosahedronGeometry(radius, 5);
  const count = geom.attributes.position.count;
  const colors = new Float32Array(count * 3);
  const pos = geom.attributes.position;

  const rustRed = new THREE.Color(0xb54316);
  const ochreOrange = new THREE.Color(0xd16930);
  const darkBasalt = new THREE.Color(0x4a2417);
  const canyonShadow = new THREE.Color(0x2f140c);
  const polarIce = new THREE.Color(0xf6f6f6);
  const olympusMonsPeak = new THREE.Color(0x8a391a);

  for (let i = 0; i < count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    const lat = Math.asin(y / radius);
    const lon = Math.atan2(z, x);

    // Mars topographic harmonics: Syrtis Major, Valles Marineris, Olympus Mons
    const n1 = Math.sin(lon * 2.5) * Math.cos(lat * 3.0);
    const n2 = Math.sin(lon * 5.0 + 0.8) * Math.sin(lat * 4.0);
    const regolithNoise = n1 * 0.6 + n2 * 0.4;

    // Valles Marineris canyon feature: thin east-west trench near equator
    const canyonDist = Math.abs(lat + 0.2) + Math.abs(Math.sin(lon * 1.5 - 0.5)) * 0.3;
    const isCanyon = canyonDist < 0.15 && (lon > -1.5 && lon < 0.5);

    // Olympus Mons caldera peak: prominent spot
    const olympusDist = Math.hypot(lat - 0.32, lon + 2.3);
    const isOlympus = olympusDist < 0.28;

    const c = new THREE.Color();

    if (lat > 1.35 || lat < -1.4) {
      // Polar ice caps (Planum Boreale & Australe)
      c.copy(polarIce);
    } else if (isOlympus) {
      c.copy(olympusMonsPeak);
    } else if (isCanyon) {
      c.copy(canyonShadow);
    } else if (regolithNoise < -0.2) {
      // Dark volcanic basalt regions (Syrtis Major, Acidalia)
      c.copy(darkBasalt);
    } else if (regolithNoise > 0.2) {
      // High iron oxide dunes
      c.copy(ochreOrange);
    } else {
      c.copy(rustRed);
    }

    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geom.computeVertexNormals();

  const marsMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.85,
    metalness: 0.05,
    name: 'MarsSurface'
  });

  const marsMesh = new THREE.Mesh(geom, marsMat);
  group.add(marsMesh);

  // Thin Martian atmosphere shell
  const atmoGeom = new THREE.IcosahedronGeometry(radius * 1.02, 4);
  const atmoMat = new THREE.MeshStandardMaterial({
    color: 0xffa07a,
    transparent: true,
    opacity: 0.15,
    roughness: 0.4,
    name: 'MarsAtmosphere'
  });
  group.add(new THREE.Mesh(atmoGeom, atmoMat));

  return group;
}

function createMoonModel() {
  const group = new THREE.Group();
  group.name = 'Moon_Planet';

  const radius = 1.2;
  const geom = new THREE.IcosahedronGeometry(radius, 4);
  const count = geom.attributes.position.count;
  const colors = new Float32Array(count * 3);
  const pos = geom.attributes.position;

  const highlandGrey = new THREE.Color(0xb2b9c0);
  const lightGrey = new THREE.Color(0xd2d7dc);
  const mariaDark = new THREE.Color(0x454b52);
  const craterRay = new THREE.Color(0xe6ebf0);

  for (let i = 0; i < count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    const lat = Math.asin(y / radius);
    const lon = Math.atan2(z, x);

    const n1 = Math.sin(lon * 3.0) * Math.cos(lat * 2.5);
    const n2 = Math.cos(lon * 5.0) * Math.sin(lat * 4.0);
    const noise = n1 * 0.6 + n2 * 0.4;

    const c = new THREE.Color();
    if (noise < -0.15 && lat > -0.5 && lat < 0.6) {
      // Lunar maria (Tranquillitatis, Serenitatis)
      c.copy(mariaDark);
    } else if (noise > 0.4) {
      // Tycho/Copernicus crater rays
      c.copy(craterRay);
    } else if (noise > 0.1) {
      c.copy(lightGrey);
    } else {
      c.copy(highlandGrey);
    }

    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geom.computeVertexNormals();

  const moonMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.9,
    metalness: 0.05,
    name: 'MoonSurface'
  });

  const moonMesh = new THREE.Mesh(geom, moonMat);
  group.add(moonMesh);

  return group;
}

// ---------------------------------------------------------------------
// 3. SURFACE ROVER / PROBE MODEL: ARES-V
// ---------------------------------------------------------------------
function createRoverModel() {
  const group = new THREE.Group();
  group.name = 'Rover_ARES5';

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xeeeeee,
    roughness: 0.4,
    metalness: 0.3,
    name: 'RoverBody'
  });
  const goldFoilMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    roughness: 0.3,
    metalness: 0.85,
    name: 'RoverGoldFoil'
  });
  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x22252a,
    roughness: 0.5,
    metalness: 0.8,
    name: 'RoverDarkMetal'
  });
  const wheelMat = new THREE.MeshStandardMaterial({
    color: 0x474e59,
    roughness: 0.7,
    metalness: 0.4,
    name: 'MachinedWheel'
  });
  const lensCyanMat = new THREE.MeshStandardMaterial({
    color: 0x00e5ff,
    emissive: 0x00e5ff,
    emissiveIntensity: 0.6,
    roughness: 0.1,
    name: 'MastcamLens'
  });

  // Main Chassis Box (Equipment Bay)
  const chassisGeom = new THREE.BoxGeometry(1.2, 0.45, 1.6);
  const chassis = new THREE.Mesh(chassisGeom, bodyMat);
  chassis.position.y = 0.65;
  group.add(chassis);

  // Gold insulation thermal wrap on lower bay
  const foilGeom = new THREE.BoxGeometry(1.22, 0.25, 1.62);
  const foil = new THREE.Mesh(foilGeom, goldFoilMat);
  foil.position.y = 0.55;
  group.add(foil);

  // Top Solar & Instrument Deck
  const deckGeom = new THREE.BoxGeometry(1.3, 0.04, 1.7);
  const deck = new THREE.Mesh(deckGeom, darkMetalMat);
  deck.position.y = 0.9;
  group.add(deck);

  // Sensor Mast & Stereo Mastcam Head
  const mastPoleGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.9, 8);
  const mastPole = new THREE.Mesh(mastPoleGeom, darkMetalMat);
  mastPole.position.set(0.35, 1.35, 0.5);
  group.add(mastPole);

  const mastHeadGeom = new THREE.BoxGeometry(0.25, 0.15, 0.15);
  const mastHead = new THREE.Mesh(mastHeadGeom, bodyMat);
  mastHead.position.set(0.35, 1.8, 0.5);
  group.add(mastHead);

  // Stereo Camera Lenses (Cyan glows)
  [-0.06, 0.06].forEach((xOffset) => {
    const lensGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.05, 10);
    lensGeom.rotateX(Math.PI / 2);
    const lens = new THREE.Mesh(lensGeom, lensCyanMat);
    lens.position.set(0.35 + xOffset, 1.8, 0.58);
    group.add(lens);
  });

  // Robotic Arm (Articulated forward with science tool)
  const armShoulder = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), darkMetalMat);
  armShoulder.position.set(-0.35, 0.7, 0.82);
  group.add(armShoulder);

  const armUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.6, 6), darkMetalMat);
  armUpper.position.set(-0.35, 0.7, 1.15);
  armUpper.rotation.x = Math.PI / 4;
  group.add(armUpper);

  const armFore = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 6), darkMetalMat);
  armFore.position.set(-0.35, 0.45, 1.5);
  armFore.rotation.x = -Math.PI / 6;
  group.add(armFore);

  // Arm Instrument Tool Head (Spectrometer & Drill)
  const toolHead = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.18, 10), goldFoilMat);
  toolHead.position.set(-0.35, 0.35, 1.7);
  toolHead.rotation.x = Math.PI / 2;
  group.add(toolHead);

  // High-Gain Dish Antenna
  const dishStem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.4, 6), darkMetalMat);
  dishStem.position.set(-0.35, 1.1, -0.4);
  group.add(dishStem);

  const dishGeom = new THREE.SphereGeometry(0.24, 12, 8, 0, Math.PI * 2, 0, Math.PI / 3);
  const dish = new THREE.Mesh(dishGeom, bodyMat);
  dish.position.set(-0.35, 1.3, -0.4);
  dish.rotation.x = -0.5;
  dish.rotation.z = 0.3;
  group.add(dish);

  // 6 Wheels on Rocker-Bogie Suspension
  const wheelPositions = [
    [-0.75, 0.25, 0.65],
    [0.75, 0.25, 0.65],
    [-0.8, 0.25, 0.0],
    [0.8, 0.25, 0.0],
    [-0.75, 0.25, -0.65],
    [0.75, 0.25, -0.65]
  ];

  wheelPositions.forEach(([x, y, z]) => {
    // Wheel cylinder
    const wGeom = new THREE.CylinderGeometry(0.25, 0.25, 0.22, 14);
    wGeom.rotateZ(Math.PI / 2);
    const wheel = new THREE.Mesh(wGeom, wheelMat);
    wheel.position.set(x, y, z);
    group.add(wheel);

    // Suspension strut
    const strutGeom = new THREE.CylinderGeometry(0.025, 0.025, 0.5, 6);
    const strut = new THREE.Mesh(strutGeom, darkMetalMat);
    const targetX = x > 0 ? 0.58 : -0.58;
    strut.position.set((x + targetX) / 2, 0.45, z);
    strut.rotation.z = x > 0 ? 0.5 : -0.5;
    group.add(strut);
  });

  return group;
}

// ---------------------------------------------------------------------
// RUN ALL EXPORTS
// ---------------------------------------------------------------------
async function run() {
  console.log('--- Generating Optimized GLB 3D Models ---');

  const models = [
    { name: 'ship.glb', create: createShipModel },
    { name: 'earth.glb', create: createEarthModel },
    { name: 'mars.glb', create: createMarsModel },
    { name: 'moon.glb', create: createMoonModel },
    { name: 'rover.glb', create: createRoverModel }
  ];

  let totalBytes = 0;
  for (const m of models) {
    const scene = new THREE.Scene();
    const model = m.create();
    scene.add(model);
    const bytes = await exportGLB(scene, path.join('public/models', m.name));
    totalBytes += bytes;
  }

  console.log(`\nAll models generated successfully!`);
  console.log(`Total 3D Asset Size: ${(totalBytes / 1024).toFixed(1)} KB (Budget: 6,000 KB)`);
  console.log(`Budget utilization: ${((totalBytes / (6 * 1024 * 1024)) * 100).toFixed(1)}%`);
}

run().catch((err) => {
  console.error('Fatal error generating models:', err);
  process.exit(1);
});

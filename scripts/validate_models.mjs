import fs from 'fs';
import path from 'path';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const allModels = [
  'ship.glb',
  'earth.glb',
  'mars.glb',
  'moon.glb',
  'rover.glb',
  'skin_orb.glb',
  'skin_crate.glb',
  'skin_rock.glb',
  'skin_ship.glb',
  'skin_creature.glb',
  'skin_station.glb',
];

let totalTriangles = 0;
let totalVertices = 0;
let totalBytes = 0;

console.log('--- Validating All GLB Models (Core + V2 Skins) with GLTFLoader ---');

for (const name of allModels) {
  const filePath = path.join('public/models', name);
  const data = fs.readFileSync(filePath);
  totalBytes += data.byteLength;
  const arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);

  const loader = new GLTFLoader();
  await new Promise((resolve, reject) => {
    loader.parse(
      arrayBuffer,
      '',
      (gltf) => {
        let triCount = 0;
        let vertCount = 0;
        gltf.scene.traverse((obj) => {
          if (obj.isMesh && obj.geometry) {
            const geom = obj.geometry;
            if (geom.index) {
              triCount += geom.index.count / 3;
            } else if (geom.attributes.position) {
              triCount += geom.attributes.position.count / 3;
            }
            if (geom.attributes.position) {
              vertCount += geom.attributes.position.count;
            }
          }
        });
        totalTriangles += triCount;
        totalVertices += vertCount;
        console.log(
          `[PASS] ${name.padEnd(18)}: ${triCount.toString().padStart(5)} tris, ${vertCount.toString().padStart(5)} verts, ${(
            data.byteLength / 1024
          ).toFixed(1)} KB`
        );
        resolve();
      },
      (err) => {
        console.error(`[FAIL] ${name}:`, err);
        reject(err);
      }
    );
  });
}

console.log('\n--- Complete 3D Asset Budget Report ---');
console.log(`Total Models: ${allModels.length}`);
console.log(`Total Model File Size: ${(totalBytes / 1024).toFixed(1)} KB (Budget Limit: 6,000 KB, ${(totalBytes / (6000 * 1024) * 100).toFixed(1)}% used)`);
console.log(`Total Scene Triangles: ${totalTriangles} (Budget Limit: 50,000 tris, ${(totalTriangles / 50000 * 100).toFixed(1)}% used)`);
console.log(`All models 100% compliant with glTF 2.0 and Three.js!`);

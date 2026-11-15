# 3D Assets & Media Credits: Dear NOVA

All 3D assets in this directory were created specifically for "Dear NOVA" (NASA Space Apps Challenge 2026) using custom procedural generation pipelines inspired by real NASA mission designs, cartographic datasets, and spacecraft engineering.

## Asset Directory

| Asset File | Subject / Category | Inspiration / Source Data | Triangles | Size | License |
|---|---|---|---|---|---|
| `ship.glb` | Player Ship (NOVA-1) | NASA Orion / Deep Space Transport reference architecture with modular crew habitat, photovoltaic arrays, high-gain antenna, and ion propulsion thruster. | 1,392 | 72.4 KB | CC0 1.0 Universal / Public Domain (Self-authored) |
| `earth.glb` | Earth (Home Planet) | NASA Visible Earth / Blue Marble topography, continental contours, polar ice extents, and atmospheric scattering data. | 1,220 | 142.1 KB | CC0 1.0 Universal / Public Domain (Self-authored, NASA data) |
| `mars.glb` | Mars (Target Destination) | NASA Mars Global Surveyor (MGS) MOLA altimetry & Viking orbiter color maps: Valles Marineris canyon network, Olympus Mons caldera, Syrtis Major basalt plains, and Planum Boreale ice cap. | 1,220 | 142.2 KB | CC0 1.0 Universal / Public Domain (Self-authored, NASA data) |
| `moon.glb` | The Moon (Lunar Orbit) | NASA Lunar Reconnaissance Orbiter (LRO) Clementine & LOLA lunar albedo maps, lunar maria, and rayed craters. | 500 | 65.9 KB | CC0 1.0 Universal / Public Domain (Self-authored, NASA data) |
| `rover.glb` | Surface Science Rover (ARES-V) | NASA Mars 2020 / Perseverance & Curiosity rover rocker-bogie mobility chassis, Mastcam-Z mast, robotic science arm, APXS spectrometer, and high-gain antenna dish. | 944 | 73.7 KB | CC0 1.0 Universal / Public Domain (Self-authored, NASA reference) |
| `skin_orb.glb` | V2 Skin: Orb (Drone / Shield Probe) | Autonomous sensor probe with dual gyroscopic stabilizer rings and cyan core emitter. | 1,360 | 38.2 KB | CC0 1.0 Universal / Public Domain (Self-authored) |
| `skin_crate.glb` | V2 Skin: Crate (Supply / Fuel Crate) | Standard deep-space pressurized cargo container with reinforced corner brackets and green status latch stripe. | 72 | 6.2 KB | CC0 1.0 Universal / Public Domain (Self-authored) |
| `skin_rock.glb` | V2 Skin: Rock (Asteroid / Mineral Ore) | Low-poly faceted chondrite asteroid chunk with craggy surface normals. | 144 | 14.7 KB | CC0 1.0 Universal / Public Domain (Self-authored) |
| `skin_ship.glb` | V2 Skin: Ship (Escort Fighter / Interceptor) | Fast escort interceptor drone with swept delta wings, cockpit canopy, and dual sub-light engines. | 210 | 16.2 KB | CC0 1.0 Universal / Public Domain (Self-authored) |
| `skin_creature.glb` | V2 Skin: Creature (Space Whale) | Bioluminescent cosmic cetacean organism with undulating dorsal ridges, pectoral flukes, and tail fin. | 1,016 | 40.0 KB | CC0 1.0 Universal / Public Domain (Self-authored) |
| `skin_station.glb` | V2 Skin: Station (Comms Relay / Outpost) | Orbital relay station with rotating habitat ring, central communications spire, and dual solar arrays. | 688 | 34.4 KB | CC0 1.0 Universal / Public Domain (Self-authored) |

## Performance & Mobile Budget Verification

- **Individual Model Limit:** < 1,000 KB (Max individual model: 142.2 KB - **Passed**)
- **Total Models Size Limit:** < 6,000 KB (Actual total: 646.2 KB - **Passed: 10.8% of budget used**)
- **Total Triangle Budget:** < 50,000 tris (Actual total: 8,766 tris - **Passed: 17.5% of budget used**)
- **Target Frame Rate:** 60 FPS desktop / 30+ FPS mobile
- **Lighting Model:** Single directional sun light + ambient fill; no dynamic shadow passes.
- **Instancing:** High-performance instanced rendering for asteroid belts and debris fields.
- **Fallback Support:** All 6 skins and celestial bodies feature immediate procedural geometry fallbacks when running offline or while models load.

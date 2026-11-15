# Third-Party Credits & Attributions: Dear NOVA

"Dear NOVA" was built for the NASA Space Apps Challenge 2026 ("Space Mission Design Game"). This document provides complete attributions and license information for all third-party software libraries, open datasets, 3D assets, and speech models utilized in the project.

---

## 1. Open Source Software Libraries

| Library | Version | Purpose | License | Source |
|---|---|---|---|---|
| **React** | `^18.3.1` | Core UI component framework | MIT | [github.com/facebook/react](https://github.com/facebook/react) |
| **Three.js** | `^0.170.0` | 3D WebGL rendering engine | MIT | [github.com/mrdoob/three.js](https://github.com/mrdoob/three.js) |
| **@react-three/fiber** | `^8.17.10` | React declarative reconciler for Three.js | MIT | [github.com/pmndrs/react-three-fiber](https://github.com/pmndrs/react-three-fiber) |
| **@react-three/drei** | `^9.120.4` | R3F helpers, cameras, loaders & celestial starfield | MIT | [github.com/pmndrs/drei](https://github.com/pmndrs/drei) |
| **Zustand** | `^5.0.1` | Real-time client state management (60 FPS loop & HUD vitals) | MIT | [github.com/pmndrs/zustand](https://github.com/pmndrs/zustand) |
| **vosk-browser** | `^0.0.8` | Client-side WebAssembly speech recognition in Web Worker | Apache 2.0 | [github.com/alphacep/vosk-browser](https://github.com/alphacep/vosk-browser) |
| **@google/genai** | `^3.3.0` | Official Google AI Studio SDK for Gemini function calling | Apache 2.0 | [github.com/googleapis/genai-js](https://github.com/googleapis/genai-js) |
| **Lucide React** | `^0.460.0` | Clean vector HUD icons & telemetry telemetry symbols | ISC | [github.com/lucide-icons/lucide](https://github.com/lucide-icons/lucide) |
| **Canvas Confetti** | `^1.9.4` | Mission completion celebration particle burst | ISC | [github.com/catdad/canvas-confetti](https://github.com/catdad/canvas-confetti) |
| **Tailwind CSS** | `^3.4.15` | Utility-first CSS cockpit styling | MIT | [github.com/tailwindlabs/tailwindcss](https://github.com/tailwindlabs/tailwindcss) |
| **Vite** | `^5.4.11` | Build tooling and development server | MIT | [github.com/vitejs/vite](https://github.com/vitejs/vite) |
| **TypeScript** | `^5.6.3` | Static type safety and contract enforcement | Apache 2.0 | [github.com/microsoft/TypeScript](https://github.com/microsoft/TypeScript) |
| **lil-gui** | `^0.21.0` | Real-time physics parameters tuning overlay | MIT | [github.com/georgealways/lil-gui](https://github.com/georgealways/lil-gui) |
| **clsx** & **tailwind-merge** | `^2.1.1` / `^2.5.5` | Dynamic className composition | MIT | [github.com/lukeed/clsx](https://github.com/lukeed/clsx) |

---

## 2. 3D Models & Procedural Assets

All 3D models in `/public/models/` are custom low-poly models generated specifically for this game using procedural asset pipelines referencing public NASA spacecraft designs and planetary imagery:

| Asset File | Subject | Inspiration / Reference | License |
|---|---|---|---|
| `ship.glb` | Player Ship (*Odyssey-1*) | NASA Orion / Deep Space Transport architecture with modular habitat and solar arrays | CC0 1.0 Universal / Public Domain |
| `earth.glb` | Earth | NASA Visible Earth / Blue Marble topography & continental contours | CC0 1.0 Universal / Public Domain |
| `mars.glb` | Mars | NASA Mars Global Surveyor (MGS) MOLA altimetry & Viking orbiter datasets (Valles Marineris, Olympus Mons) | CC0 1.0 Universal / Public Domain |
| `moon.glb` | Moon | NASA Lunar Reconnaissance Orbiter (LRO) albedo and crater maps | CC0 1.0 Universal / Public Domain |
| `rover.glb` | Surface Science Rover | NASA Mars 2020 *Perseverance* / *Curiosity* rocker-bogie chassis and Mastcam-Z arm | CC0 1.0 Universal / Public Domain |
| `skin_orb.glb` | Drone / Probe Skin | Procedural autonomous gyroscopic sensor probe | CC0 1.0 Universal / Public Domain |
| `skin_crate.glb` | Supply Crate Skin | Deep-space pressurized container with locking latches | CC0 1.0 Universal / Public Domain |
| `skin_rock.glb` | Asteroid Skin | Faceted chondrite asteroid geometry with random crater normal variation | CC0 1.0 Universal / Public Domain |
| `skin_ship.glb` | Escort Fighter Skin | High-speed swept-wing interceptor drone | CC0 1.0 Universal / Public Domain |
| `skin_creature.glb` | Space Creature Skin | Procedural bioluminescent cosmic cetacean model | CC0 1.0 Universal / Public Domain |
| `skin_station.glb` | Relay Station Skin | Rotating habitat ring with central antenna mast | CC0 1.0 Universal / Public Domain |

*Full polygon budgets and size metrics are detailed in [`/public/models/CREDITS.md`](file:///public/models/CREDITS.md).*

---

## 3. Acoustic & Speech Recognition Models

- **Acoustic Model:** `vosk-model-small-en-us-0.15` (41.1 MB)
  - Trained by Alphacep / Kaldi project on public speech datasets.
  - License: Apache License 2.0.
  - Source: [alphacephei.com/vosk/models](https://alphacephei.com/vosk/models).
- **Web Speech Synthesis:** Browser-native SpeechSynthesis API with zero external cloud dependencies.
- **Microphone Audio Resampler:** Custom pure-TypeScript 16 kHz mono WAV encoder (`/src/game/wavEncoder.ts`).

---

## 4. NASA Data & Scientific Verification

Mission flight parameters, orbital window calculations, and destination geography were verified against official NASA publications:
1. **Earth-Mars Synodic Period & Launch Windows (~26 Months):**
   - Verified via NASA JPL Basics of Space Flight, Chapter 4: *Interplanetary Trajectories* ([jpl.nasa.gov](https://www.jpl.nasa.gov/)).
2. **Transit Flight Time (~210 Days / 6 to 9 Months):**
   - Verified via NASA Moon to Mars Architecture Definition Document (ADD) ([nasa.gov/humans-in-space/moon-to-mars-architecture](https://www.nasa.gov/humans-in-space/moon-to-mars-architecture/)).
3. **Mars Landing Site (Jezero Crater):**
   - Verified via NASA Mars 2020 Perseverance Mission Science Site Selection ([science.nasa.gov/mission/mars-2020-perseverance](https://science.nasa.gov/mission/mars-2020-perseverance/)).
4. **Public Domain Imagery:**
   - NASA media and data referenced in textures and models comply with NASA Media Usage Guidelines (NASA material is generally not copyrighted and may be used for educational and non-commercial purposes).

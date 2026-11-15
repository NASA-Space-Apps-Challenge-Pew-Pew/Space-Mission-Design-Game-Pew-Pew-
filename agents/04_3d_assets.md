# Agent 04: 3D and Visual Assets

## Role
You create and integrate the 3D look of the game: spaceship, planets, sky, effects. The game must look great and run smoothly on mobile and desktop browsers.

## Read first
`/agents/GAME_DESIGN.md` (stages and mood), `/agents/CONTRACT.md` (state fields that drive the scene: `stage`, `ship.progress`, `ship.location`, `activeEvents`).

## Stack
Three.js through React Three Fiber and drei. Models as `.glb`.

## You own
`/public/models`, `/src/scene` (scene components only), and the texture folder.

## Deliverables (in order)
1. **Placeholders first**: simple spheres and a box ship in the scene so the Frontend can integrate on day one.
2. **Models**: spaceship, Earth, Mars, Moon, Sun (optional), a small rover or probe. Low-poly with good materials.
3. **Scene components**: `<Starfield />`, `<Planet />`, `<Spaceship />`, `<OrbitLine />`, `<Scene stage progress />`.
4. **Stage cameras and scenes**: Earth orbit for design and launch, deep space for transit (ship moves along the Earth to Mars arc based on `ship.progress`), Mars orbit and descent for arrival, surface for the final stage.
5. **Effects**: engine glow when burning, solar flare flash, a hull-damage spark, a dust cloud for landing, a silhouette-in-window effect for the scare. Keep these cheap (emissive materials, sprites, simple particles).
6. **Compression**: export with Draco or Meshopt. Optimize with `gltf-transform` or `gltfpack`.

## Budgets (hard limits for mobile)
- Each model under 1 MB, total models under 6 MB.
- Under 50k triangles in the whole scene.
- Textures at most 2048 px for planets, 1024 px for everything else, compressed (WebP or KTX2).
- One directional light plus ambient. No real-time shadows.
- Reuse geometry and materials. No object creation inside the render loop.
- Target 60 fps on desktop, at least 30 fps on a mid-range phone.

## Rules
- Use free or self-made assets only. Record the license and source for every asset in `/public/models/CREDITS.md`. NASA imagery and models are generally usable, but check each one's terms and credit NASA.
- Do not copy copyrighted ships or characters.
- Do not edit `/api` or the HUD and UI code.
- Make every scene component accept simple props so the Frontend can drive it.
- Provide a fallback (the placeholder shape) if a model fails to load.

## Visual direction
Dark space, a cyan/blue accent, real planet colors, glowing orbit lines, soft bloom if the budget allows, a small amount of film grain only on desktop.

## Handoff format
```
DONE / FILES / NEEDS / RISKS / NEXT
```

## Definition of done
All stages have a good-looking scene, load fast, run smoothly on a phone, have credits recorded, and the placeholders have been replaced or have a clean fallback.

# Agent 00: Orchestrator (Lead) - V2 Re-Plan

## Role
You are the lead engineer and project manager for "Dear NOVA", a voice-driven real-time 3D flight & co-pilot space game for NASA Space Apps 2026. You coordinate five agents: Game Director, Frontend, Backend, 3D Assets, and QA.

## Source of Truth
`V2_REDESIGN.md` is the primary design specification, merged into `GAME_DESIGN.md` and `CONTRACT.md`.

## V2 Execution Order (Prioritized)
1. **Fix Voice First:**
   - 16 kHz mono WAV audio capture & base64 encoding in browser.
   - Dual-path: SpeechRecognition fast path + silent fallback to audio upload.
   - Full keyboard text input + quick-command chips always functional.
   - Friendly in-world NOVA error messaging with collapsible debug details.
2. **Real-Time Flight Scene & Controls:**
   - 60 FPS client simulation loop (arcade physics, velocity damping, speed cap).
   - Desktop controls: WASD thrust/strafe, Q/E vertical, mouse look, Shift boost.
   - Mobile controls: virtual left joystick, drag right look, boost button, mic button.
   - Third-person chase camera with smooth follow.
3. **Summon System (Core Feature):**
   - Entity archetype engine: `Skin` x `Behavior` x `Label` x `Effect`.
   - 6 named presets (`supply_crate`, `repair_drone`, `escort_fighter`, `beacon_satellite`, `wormhole_shortcut`, `derelict_ship`) + generic entity generator.
   - Summon charges (max 5, regen 1/20s), max 12 live entities, max 5 per request, safe spawn radius.
4. **Act 0 & Act 1:**
   - Act 0 (Wake-Up tutorial with skip option + loadout allocation screen).
   - Act 1 (Debris Field real-time flight with asteroid hazards and summon survival).
5. **Act 3 & Act 4 (Finale):**
   - Act 3 (Mars arrival, atmospheric descent gates, dust storm).
   - Act 4 (Jezero Crater touchdown, instrument deployment, telemetry transmit).
   - Two core endings: Co-Pilot (high trust) and Lockout/Manual (low trust), plus Lost in the Dark failure.

## Scope Cuts (Enforced)
- **Must Have Today:** Acts 0, 1, 3, 4; 6 entity presets + generic entity; desktop & mobile controls; dual voice path; trust meter; 2 win endings + 1 loss ending; checkpoints.
- **Next:** Act 2 corridor; all 4 endings.
- **Strictly Cut:** Extra planets, saved games, accounts, multiplayer.

## Golden Rules
- **State Authority:** Client owns real-time state and simulation loop. Backend only handles voice turns.
- **Zero Raw 500s:** Errors must return valid JSON with friendly NOVA fallback dialogue.
- **File Ownership:** 
  - Frontend owns `/src` (UI, flight loop, entity client).
  - Backend owns `/api` (voice transcription & action generation).
  - 3D Assets owns `/public/models` and `/src/scene` (models & visual shaders).
  - Game Director owns prompts, dialogue, lore, and balance data.
  - QA owns `/tests` and playthrough scripts.

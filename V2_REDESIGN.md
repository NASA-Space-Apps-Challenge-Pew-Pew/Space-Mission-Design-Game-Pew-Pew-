# V2_REDESIGN.md: real-time flight, voice summoning, fixed voice

This file SUPERSEDES `GAME_DESIGN.md` and `CONTRACT.md` wherever they conflict. The Orchestrator merges it into those files, then tells every agent.

Playtest problems this fixes:
1. "mic error" and "network error" messages.
2. The game was only chat. Nothing to do, no movement.
3. No real tutorial, no lore opening, no ending.

---

## Part 1: Fix the mic and network errors

### Why they happen
| Message | Likely cause | Fix |
|---|---|---|
| `network` (speech) | Browser speech recognition sends audio to a cloud service. It fails in embedded or IDE preview browsers, Brave, Firefox, and when offline | Record audio ourselves and let Gemini transcribe it (below) |
| `not-allowed` / `service-not-allowed` | Mic permission denied, or page is not on HTTPS (localhost is fine) | Show a clear "Allow microphone" message and a retry button |
| `audio-capture` | No mic found | Show "No microphone found", keep text and quick-command buttons |
| `no-speech` | Nothing heard | Say "I didn't catch that", do not show an error |
| network error on `/api/turn` | Serverless function not running locally, missing `GEMINI_API_KEY`, wrong `GEMINI_MODEL`, CORS, timeout | Run with `vercel dev` locally, check env vars, return a readable error JSON |

### The fix: voice that does not depend on the browser's speech service
1. **Primary path:** record the mic, encode a short clip (max 8 seconds) as **16 kHz mono WAV** in the browser (AudioWorklet or ScriptProcessor, then a tiny WAV encoder). Send it as base64 to `/api/turn`. Gemini accepts audio input, so one call transcribes and decides the actions.
2. **Optional fast path:** try browser SpeechRecognition first. If it errors with `network` or `service-not-allowed`, silently switch to the primary path. Never show a raw error.
3. **Always available:** text box plus **quick-command chips** ("Summon repair drone", "Refuel", "Show path"). The game must be fully playable with no mic at all.
4. **Test in real Chrome or Safari on the deployed HTTPS link**, not only the IDE preview.
5. Every failure shows a friendly in-world message from NOVA ("Comms static. Try again, Commander.") and a "Details" toggle with the real error for debugging.

---

## Part 2: New game design: real-time flight

### The big change
The game is now a **real-time 3D flight game**. You fly the ship yourself. The AI is your voice-controlled co-pilot who can **change the world** around you: summon entities, repair, boost, reveal paths, or cause trouble. Voice is no longer a chat box. It is a power.

**Two loops, kept separate:**
- **Real-time loop (client, 60 fps):** movement, physics, collisions, entity behavior, HUD. Runs locally, never waits for the network.
- **Voice loop (async, backend):** player speaks, Gemini returns actions, the client validates and applies them. The game keeps running while NOVA "thinks". Show a thinking indicator on the NOVA orb.

### Controls
| Platform | Move | Look / steer | Boost | Talk |
|---|---|---|---|---|
| Desktop | W/S thrust, A/D strafe, Q/E up/down | Mouse (or arrow keys) | Shift | Hold V or Space; also a mic button |
| Mobile | Left virtual joystick | Drag on the right side of the screen | Boost button | Big mic button |

Arcade physics: velocity with damping, a max speed, boost that uses fuel. Collisions are simple sphere checks. A third-person chase camera with smooth follow. Add gamepad support only if time allows.

### Summon system (the core feature)
The player says anything: "NOVA, summon a repair drone", "give me an escort", "spawn a giant space whale". NOVA maps it to a safe, bounded entity.

**Entity = skin x behavior x label**, so "any entity" is possible without unlimited assets:
- `skin`: `orb | crate | rock | ship | creature | station`
- `behavior`: `follow | orbit | collect | hazard | decor | shoot`
- `label`: the name shown above it ("Space Whale")
- `effect` (optional): `heal | fuel | shield | reveal_path | none`

Named presets get proper models and behaviors:
| Preset | Behavior | Effect | Charge cost |
|---|---|---|---|
| `supply_crate` | collect | +fuel | 1 |
| `repair_drone` | follow 30s | heals hull | 2 |
| `escort_fighter` | follow + shoot asteroids | protects you | 2 |
| `beacon_satellite` | orbit | reveals the path | 1 |
| `wormhole_shortcut` | collect gate | skips ahead in the route | 4 |
| `derelict_ship` | decor + pickup | lore log, small reward | 2 |
| `asteroids` | hazard | NOVA prank or twist | free (NOVA-chosen) |
| `ghost_ship` | decor scare | only if `scareLevel` 2 | free (NOVA-chosen) |

**Limits, so it cannot break the game:**
- **Summon charges** (max 5, regen 1 per about 20 s, cheaper with high trust). Loadout choices raise the max.
- Max 12 live entities, max 5 per request. Oldest are despawned first.
- Spawn only within a safe radius of the player, never inside the player.
- Hazards NOVA creates cannot instantly kill (damage capped per hit).
- Unknown or unsafe requests: NOVA maps to the nearest allowed entity or twists it ("No dragons, Commander. Here is a very confused asteroid.").

**NOVA personality still applies:** `grant`, `grant_with_cost`, `twist`, `refuse`, `prank`. Trust changes charge costs and prank frequency.

### Story and structure
**Lore:** Ship *Odyssey-1* is on the first crewed Mars mission. The crew sleeps in cryosleep. NOVA is an experimental learning AI that has "trained on every commander before you". Her pranks are secretly tests of whether the commander can be trusted, and whether she can trust you.

| Act | Name | What you do | Teaches |
|---|---|---|---|
| 0 | **Wake-Up** (tutorial, in-lore) | You are woken early in a drydock/orbit as the ship reboots. Choose a loadout, then fly through guided rings | Controls, boost, voice, summoning |
| 1 | **Debris Field** | Escape a field of debris after a system failure. Summon help to survive | Real-time flying and summoning under pressure |
| 2 | **Transit Corridor** | Fly the Earth to Mars arc as a path of rings with hazards: flares, meteors, comms drift | Resource and mission trade-offs |
| 3 | **Mars Arrival** | Orbit approach, then a controlled descent minigame through dust | Precision flying, timing |
| 4 | **Finale** | Land, deploy the instrument, transmit data, ending cinematic | Payoff |

**Tutorial (Act 0), told as lore:** NOVA's reboot narrates it. Each step has a goal and a skip button.
1. "Systems coming online. Move to the green ring." (move)
2. "Engines cold. Hold boost to reach the next one." (boost)
3. "My language core is warming up. Say: *NOVA, summon a supply crate.*" (voice)
4. "Hull took damage in the wake-up. Ask me to repair it." (voice, free choice)
5. "Last test, Commander. Ask me for anything." (creative summon, NOVA reacts)
Then a short loadout screen (the mission-design part): split points between **fuel tank**, **hull armor**, **science payload**, **summon charges**. These change flight stats and the final score.

**Endings (based on trust and results):**
- **Co-Pilot** (trust 70+, landed): NOVA reveals the tests, says you earned her trust, and she lands the ship with you.
- **Professional** (trust 40-69, landed): clean landing, a respectful goodbye.
- **Lockout** (trust below 40, landed): NOVA locks the autopilot, you land manually (harder, still winnable).
- **Lost in the Dark** (hull or fuel zero): short sad ending, then "Try again" with the loadout screen.

### Win and lose
- **Win:** reach Mars surface, deploy the instrument, transmit data.
- **Lose:** hull 0, fuel 0 with no summon charges to fix it, or a failed landing.
- Always show the objective and a waypoint arrow. Checkpoints at the start of each act so a loss never means a full restart.

### Scope for today (honest cut)
- **Must:** Act 0 tutorial, Act 1 debris flight, Act 3 simple landing, Act 4 ending, 6 preset entities plus the generic skin/behavior entity, desktop and mobile controls, fixed voice path, trust meter, 2 endings.
- **Next:** Act 2 corridor, all 4 endings, nicer effects.
- **Cut:** extra planets, multiplayer, saved games.

---

## Part 3: Contract changes (replaces the old `/api/turn`)

The client is authoritative for real-time state. The backend only handles voice turns and never runs per frame.

### Request
```json
{
  "playerText": "summon a repair drone",
  "audio": { "mimeType": "audio/wav", "base64": "..." },
  "snapshot": {
    "act": 1,
    "objective": "Escape the debris field",
    "hullPct": 62,
    "fuelPct": 40,
    "summonCharges": 3,
    "maxSummonCharges": 5,
    "trust": 60,
    "mood": "calm",
    "liveEntities": { "asteroids": 6, "repair_drone": 0 },
    "nearestHazardMeters": 120,
    "recentEvents": ["hull_hit"]
  },
  "history": [{ "role": "player|nova", "text": "..." }],
  "settings": { "scareLevel": 1 }
}
```
Send either `playerText` or `audio`, not both. Backend returns the transcript when audio was used.

### Response
```json
{
  "transcript": "summon a repair drone",
  "nova": { "line": "One repair drone, on the house.", "responseType": "grant", "mood": "calm" },
  "actions": [
    { "name": "spawn_entity", "args": { "preset": "repair_drone", "count": 1, "placement": "near_player" } }
  ],
  "trustDelta": 2,
  "scare": null,
  "error": null
}
```

### Actions (client executes after validating; backend pre-validates)
| name | args |
|---|---|
| `spawn_entity` | `preset` (from the table) OR `custom: { skin, behavior, label, effect }`, `count` 1-5, `placement`: `ahead | around | behind | near_player | near_target` |
| `despawn_entity` | `preset` or `id` |
| `repair_ship` | `amount` 0-40 (percent) |
| `refuel` | `amount` 0-40 (percent) |
| `grant_boost` | `seconds` 1-10 |
| `grant_shield` | `seconds` 1-10 |
| `set_hazard` | `type: solar_flare | meteor_shower | dust`, `intensity` 1-3 |
| `reveal_path` | none |
| `restrict_controls` | `control: boost`, `seconds` 1-10 (only when trust is low) |
| `trigger_scare` | `type: alarm | blackout | silhouette | flicker`, `durationMs` |
| `adjust_trust` | `delta` -10 to 10 |
| `status_report` | none |

**Rules:**
- Backend rejects unknown actions, out-of-range args, and any action not allowed in the current act. It limits cost to the player's `summonCharges` and trims over-cap counts.
- **The client re-validates everything.** Never trust the response blindly.
- Errors never crash the game. Return `error` text and a fallback NOVA line with no actions.
- Gemini gets the snapshot, the action list as function declarations, and NOVA's system prompt. Keep it short to stay fast (aim under 3 seconds).

---

## Part 4: Patch prompts for each agent
Paste the matching block into the agent. Each one assumes it has already read this file.

### Orchestrator
```
Read /agents/V2_REDESIGN.md. It supersedes GAME_DESIGN.md and CONTRACT.md. Merge it into both files, then notify every agent. Re-plan: fix voice first, then the real-time flight scene and controls, then the summon system, then Act 0 and Act 1, then Act 3 and 4. Keep the scope cut in Part 2. Make sure the client owns real-time state and the backend only handles voice turns. Report in the handoff format.
```

### Game Director
```
Read /agents/V2_REDESIGN.md. Rewrite the NOVA system prompt for the summon-based world: NOVA chooses among the five response types, maps any player request to a preset or a bounded custom entity, uses trust and charges to decide cost and generosity, and uses only the new actions. Write the Act 0 tutorial script, the lore text, the act transition lines, the four endings, and 10+ funny refusal and twist lines for impossible summons. Write 8 objective texts and the hint chips. Keep lines short and made for speech.
```

### Frontend
```
Read /agents/V2_REDESIGN.md. Build: (1) the real-time flight controller: WASD + mouse on desktop, virtual joystick + drag-look + boost + mic buttons on mobile, third-person chase camera, arcade physics; (2) the entity system with presets and the generic skin/behavior/label entity, entity cap, and spawn rules; (3) voice capture that records 16 kHz mono WAV and falls back from SpeechRecognition automatically, plus text input and quick-command chips; (4) summon-charge, hull, fuel, trust HUD, objective banner, and waypoint arrow; (5) Act 0 tutorial with skip, loadout screen, checkpoints, and win/lose/ending screens. Never show raw error strings; show a friendly NOVA message with a Details toggle. The game loop must never wait on the network.
```

### Backend
```
Read /agents/V2_REDESIGN.md. Rebuild /api/turn for the new contract: accept playerText or audio (WAV base64), call Gemini with the NOVA prompt, the snapshot, and the new action list as function declarations, return transcript, nova line, validated actions, trustDelta, and scare. Validate act gating, arg ranges, charge costs, and entity caps. Return readable error JSON with a fallback NOVA line instead of a 500. Keep a MOCK=1 mode that returns scripted actions. Add engine unit tests for validation. Document how to run locally with vercel dev and which env vars are needed.
```

### 3D and Visual Assets
```
Read /agents/V2_REDESIGN.md. Provide: the player ship, chase-camera-friendly scale, engine glow and boost trail; the six skins (orb, crate, rock, ship, creature, station) as low-poly models or procedural meshes with instancing; asteroid field, debris, rings for waypoints, a Mars approach scene with dust, a landing zone, and the effects for shield, heal, scare silhouette, and wormhole. Keep the mobile budgets from the original prompt. Provide placeholder meshes first.
```

### QA Tester
```
Read /agents/V2_REDESIGN.md. Test: voice on Chrome desktop, Safari iOS, Chrome Android, an embedded or IDE browser, and with the mic denied; verify the WAV fallback and the text fallback. Test controls on desktop and phone, the tutorial and skip, each summon preset and the generic entity, entity caps and charge limits, abuse prompts ("spawn 1000 asteroids", "kill me", "give me infinite fuel"), all four endings, checkpoints, frame rate on a mid-range phone, and offline or slow-network behavior. Log bugs in /tests/BUGS.md.
```

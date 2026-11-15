# CONTRACT.md: Shared Interface (V2: Real-Time Flight & Voice Summoning)

> **Source of Truth:** Superseded by `V2_REDESIGN.md`. The client is authoritative for all real-time simulation state (movement, physics, entity lifecycle, collision, frame updates). The serverless backend (`/api/turn`) exclusively processes voice/text turns and never executes per frame.

---

## 1. Flight & Simulation Snapshot (`ClientSnapshot`)
Sent by the client on each turn as the tactical context for Gemini:

```json
{
  "act": 1,
  "objective": "Escape the debris field",
  "hullPct": 62,
  "fuelPct": 40,
  "summonCharges": 3,
  "maxSummonCharges": 5,
  "trust": 60,
  "mood": "calm",
  "liveEntities": {
    "asteroids": 6,
    "repair_drone": 0
  },
  "nearestHazardMeters": 120,
  "recentEvents": ["hull_hit"]
}
```

- `act`: `0 | 1 | 2 | 3 | 4`
- `mood`: `playful | calm | annoyed | cold`
- `liveEntities`: Map of preset name (or custom archetype) to active count. Maximum 12 total active entities allowed in simulation.
- `recentEvents`: Recent transient events (e.g. `["hull_hit", "near_miss", "boost_engaged"]`).

---

## 2. API Endpoint: `POST /api/turn`

### Request Payload
```json
{
  "playerText": "NOVA, summon a repair drone",
  "audio": {
    "mimeType": "audio/wav",
    "base64": "UklGRi..."
  },
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
  "history": [
    { "role": "player", "text": "Can we get some shields?" },
    { "role": "nova", "text": "Shields are offline, Commander. Best I can offer is a decoy." }
  ],
  "settings": {
    "scareLevel": 1
  }
}
```
*Note: Send either `playerText` OR `audio`, never both. When audio is supplied, the backend transcribes it via Gemini and echoes the transcribed text back in `transcript`.*

### Response Payload
```json
{
  "transcript": "NOVA, summon a repair drone",
  "nova": {
    "line": "One repair drone, on the house. Keep your hull in one piece.",
    "responseType": "grant",
    "mood": "calm"
  },
  "actions": [
    {
      "name": "spawn_entity",
      "args": {
        "preset": "repair_drone",
        "count": 1,
        "placement": "near_player"
      }
    }
  ],
  "trustDelta": 2,
  "scare": null,
  "error": null
}
```

- `responseType`: `grant | grant_with_cost | twist | refuse | prank`
- `scare`: `null` or `{ "type": "alarm" | "blackout" | "silhouette" | "flicker", "durationMs": 2000 }`
- `error`: Friendly in-world error string if an issue occurred, or `null`. Never return a raw 500 status to the client.

---

## 3. Action List (Gemini Function Declarations & Engine Validation)

| Action Name | Arguments Schema | Description & Guardrails |
|---|---|---|
| `spawn_entity` | `preset?: string`, `custom?: { skin, behavior, label, effect }`, `count: 1..5`, `placement: 'ahead' \| 'around' \| 'behind' \| 'near_player' \| 'near_target'` | Spawns entities. Clamped by player's `summonCharges` and live entity ceiling (max 12). |
| `despawn_entity` | `preset?: string`, `id?: string` | Removes entity or entities from scene. |
| `repair_ship` | `amount: number` (0 to 40) | Directly restores ship hull percentage. |
| `refuel` | `amount: number` (0 to 40) | Directly adds fuel percentage. |
| `grant_boost` | `seconds: number` (1 to 10) | Temporarily grants infinite / supercharged thruster boost. |
| `grant_shield` | `seconds: number` (1 to 10) | Temporarily renders ship immune to hazard collisions. |
| `set_hazard` | `type: 'solar_flare' \| 'meteor_shower' \| 'dust'`, `intensity: 1..3` | Spawns cosmic hazard field (NOVA twist/prank). |
| `reveal_path` | none | Highlights optimal route rings with luminous waypoint markers. |
| `restrict_controls` | `control: 'boost'`, `seconds: 1..10` | Disables boost temporarily (only when trust is low or on prank). |
| `trigger_scare` | `type: 'alarm' \| 'blackout' \| 'silhouette' \| 'flicker'`, `durationMs: number` | Triggers audiovisual scare effect. Respects `scareLevel`. |
| `adjust_trust` | `delta: number` (-10 to 10) | Modulates NOVA trust index (clamped between 0 and 100). |
| `status_report` | none | Generates a spoken diagnostic readout of flight systems. |

---

## 4. Entity Archetype Matrix
Every spawned entity is evaluated as:
$$\text{Entity} = \text{Skin} \times \text{Behavior} \times \text{Label} \times \text{Effect}$$

- **Skin:** `orb | crate | rock | ship | creature | station`
- **Behavior:** `follow | orbit | collect | hazard | decor | shoot`
- **Effect:** `heal | fuel | shield | reveal_path | none`
- **Presets:** `supply_crate`, `repair_drone`, `escort_fighter`, `beacon_satellite`, `wormhole_shortcut`, `derelict_ship`, `asteroids`, `ghost_ship`.

---

## 5. Voice Input Protocol
1. **Primary Dual Path:**
   - Client records 16 kHz mono WAV audio from microphone.
   - Encodes as base64 and posts to `/api/turn` under `audio`.
   - Gemini handles joint transcription and intent execution in a single inference call.
2. **Fast Path:**
   - Browser `SpeechRecognition` can be attempted first.
   - If error is `network` or `service-not-allowed` (e.g. IDE preview, Brave, Firefox), silently fallback to primary WAV path.
3. **No-Mic Fallback:**
   - Text input box and Quick-Command chips (`Summon repair drone`, `Refuel`, `Show path`) are always active and functional.
4. **Error Resilience:**
   - Comms failure displays friendly NOVA voice dialogue ("Comms static. Try again, Commander.") with a collapsible "Details" diagnostic panel.

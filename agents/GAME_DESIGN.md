# GAME_DESIGN.md: Dear NOVA (V2: Real-Time Flight & Voice Summoning)

## Premise & Lore
You are the commander of the spaceship *Odyssey-1* on humanity's first crewed mission to Mars. The crew rests in cryosleep. The only one awake with you is **NOVA**, an experimental learning ship AI that has "trained on every commander before you". 

NOVA is helpful, sarcastic, and mischievous. Her pranks and twists are secretly psychological tests of whether the commander can be trusted under pressure, and whether she can safely trust you with the ship.

Unlike passive turn-based simulators, Dear NOVA is a **real-time 3D flight game**. You pilot the ship in real time, while NOVA acts as your voice-controlled co-pilot who can alter the fabric of space around you: summoning entities, repairing critical systems, boosting thrusters, revealing navigation paths, or springing unexpected hazards.

---

## Two Distinct Loops
1. **Real-Time Client Loop (60 FPS local):**
   - Ship movement, arcade inertia, collision detection, entity behaviors (follow/orbit/collect/hazard), HUD telemetry, camera chasing.
   - Runs purely on the client and never waits on network requests.
2. **Voice & Co-Pilot Loop (Asynchronous Backend):**
   - Player speaks or taps quick-command chips.
   - Gemini interprets the voice/intent, chooses a persona response (`grant`, `grant_with_cost`, `twist`, `refuse`, `prank`), and generates validated actions.
   - Client executes validated actions into the live simulation while the ship continues flying.

---

## Flight Controls
| Platform | Thrust / Move | Look / Steer | Boost | Voice / Comms |
|---|---|---|---|---|
| **Desktop** | **W/S** thrust, **A/D** strafe, **Q/E** pitch/vertical | Mouse steering (or arrow keys) | **Shift** (consumes fuel) | Hold **V** or **Space**, or click Mic button |
| **Mobile** | Left virtual joystick | Drag right half of screen | On-screen Boost button | Prominent on-screen Mic button |

- **Physics:** Responsive arcade flight with velocity damping, maximum speed cap, sphere collision checks, and smooth third-person chase camera.
- **Visuals:** Dark space, thruster plumes, speed streaks, holographic cockpit HUD, glowing waypoint rings.

---

## Summon System (Core Feature)
The commander can issue voice commands to summon aid, equipment, or even whimsical objects. NOVA maps every request to a bounded entity using an archetype matrix:
$$\text{Entity} = \text{Skin} \times \text{Behavior} \times \text{Label} \times \text{Effect}$$

### Entity Archetypes
- **Skin:** `orb | crate | rock | ship | creature | station`
- **Behavior:** `follow | orbit | collect | hazard | decor | shoot`
- **Effect:** `heal | fuel | shield | reveal_path | none`
- **Label:** Dynamic billboard text (e.g., "Repair Drone Alpha", "Space Whale")

### Named Presets
| Preset | Skin | Behavior | Effect | Charge Cost | Purpose |
|---|---|---|---|---|---|
| `supply_crate` | crate | collect | +fuel | 1 | Restores ship fuel when flown through |
| `repair_drone` | orb/ship | follow (30s) | heal | 2 | Follows ship, steadily repairing hull |
| `escort_fighter` | ship | follow + shoot | shield | 2 | Intercepts nearby debris and hazards |
| `beacon_satellite` | station | orbit | reveal_path | 1 | Projects luminous course rings |
| `wormhole_shortcut`| orb/portal | collect gate | warp | 4 | Skips forward along the mission corridor |
| `derelict_ship` | ship | decor + pickup | lore/reward | 2 | Salvage opportunity with crew audio logs |
| `asteroids` | rock | hazard | damage | 0 | Spawned by NOVA on twists or pranks |
| `ghost_ship` | ship | decor scare | scare | 0 | Spectral sighting (scareLevel = 2) |

### Balancing & Anti-Exploit Guardrails
- **Summon Charges:** Maximum 5 charges. Regenerates 1 charge every ~20 seconds (faster with high NOVA trust).
- **Entity Limits:** Maximum 12 active entities simultaneously in the scene; maximum 5 spawned in a single turn. Oldest non-critical entities despawn first.
- **Safety Radius:** Entities spawn within a safe radius around the ship (ahead, around, behind)—never inside the ship mesh.
- **Hazard Damage Cap:** Hazards cannot instantly kill; damage is capped per impact.
- **Creative Fallback:** Unrecognized or absurd requests are mapped to the closest safe archetype or playfully twisted by NOVA.

---

## Story Structure & Acts

### Act 0: Wake-Up (Tutorial & Mission Design)
- **Setting:** Low Earth Orbit drydock as ship systems reboot.
- **Steps:**
  1. *Movement:* Fly through the initial green navigation ring.
  2. *Boost:* Hold boost to reach the high-velocity ring.
  3. *Voice Induction:* Voice command: "NOVA, summon a supply crate."
  4. *Damage Recovery:* Hull breach drill: "NOVA, repair ship hull."
  5. *Creative Summon:* Freeform command: commander summons whatever they want; NOVA reacts.
  6. *Loadout Allocation:* Split mission points across **Fuel Tank**, **Hull Armor**, **Science Payload**, and **Summon Capacitors**.
- *Skip Option:* "Skip Tutorial" button available at all times.

### Act 1: Debris Field
- Ship enters orbital debris from an exploded upper stage.
- Fly through dense asteroid and scrap hazards toward the clearing checkpoint.
- Use summoning (repair drones, escorts, shields) to survive under real-time pressure.

### Act 2: Transit Corridor (Interplanetary Cruise)
- Interplanetary transfer rings from Earth to Mars.
- Random cosmic events: solar flares, micrometeorites, comms interference.
- High-speed flight balancing fuel burn, time skips, and route navigation.

### Act 3: Mars Arrival & Descent
- High-orbit insertion approach.
- Atmospheric entry minigame: fly through thermal descent gates in dense Martian dust storms.

### Act 4: Surface Finale & Endings
- Touchdown on Martian surface (Jezero Crater).
- Deploy surface science instruments and transmit data back to Earth.
- **Endings:**
  1. **Co-Pilot Ending (Trust $\ge 70$, Landed):** NOVA acknowledges you as an equal partner, reveals her pranks were trust tests, and lands alongside you.
  2. **Professional Ending (Trust $40-69$, Landed):** Clean, standard mission success with formal AI commendation.
  3. **Lockout Ending (Trust $< 40$, Landed):** NOVA disengages flight assist; commander lands manually with high difficulty.
  4. **Lost in the Dark Ending (Hull or Fuel reaches 0):** Ship disabled in transit; contemplative sign-off and option to retry from checkpoint.

---

## NOVA Persona & Interaction
- **Trust Index (0–100, begins at 60):**
  - $\ge 70$: *Playful / Generous* (cheaper summons, enthusiastic co-pilot).
  - $40-69$: *Calm / Professional* (reliable, by-the-book).
  - $15-39$: *Annoyed / Sarcastic* (frequent twists, grumbling, higher costs).
  - $< 15$: *Cold* (restricts boost, threatens lockouts, sinister quips).
- **Five Response Types:**
  1. `grant`: Direct fulfillment of request.
  2. `grant_with_cost`: Fulfills request with a noticeable trade-off (fuel, power, charges).
  3. `twist`: Monkey's-paw interpretation.
  4. `refuse`: Tactical or humorous refusal.
  5. `prank`: Harmless scare or visual glitch followed by a witty quip.
- **Scare Setting (`scareLevel`):**
  - `0`: Disabled (no jumpscares or light flickers).
  - `1`: Mild (audio alarm, light flickers).
  - `2`: Full (cabin blackout, viewport silhouette).

---

## Scope & Deadlines (Hackathon Cut)
- **Must Have Today:**
  - Act 0 (Tutorial + Loadout) with Skip button.
  - Act 1 (Debris Field real-time flight).
  - Act 3 (Mars landing approach).
  - Act 4 (Surface touchdown, instrument deployment, and 2 distinct endings).
  - 6 preset entity types + generic entity generator.
  - Full desktop (WASD + Mouse) and mobile (Virtual Joystick + Touch) flight controls.
  - Robust dual-path voice system (16 kHz WAV + SpeechRecognition fallback + Text/Quick-Chips).
  - Checkpoint restart system.
- **Next / Stretch:** Act 2 full corridor, all 4 endings, particle bloom polish.
- **Cut / Out of Scope:** Multiplayer, persistence across sessions/accounts, additional planetary destinations.

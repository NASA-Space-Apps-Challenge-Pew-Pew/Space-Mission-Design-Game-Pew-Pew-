# BUGS.md: Dear NOVA — Defect Tracking Log

**Agent:** Agent 05 (QA Tester)  
**Governing Documents:** `05_qa_tester.md`, `CONTRACT.md`, `V2_REDESIGN.md`  
**Required Format:** `ID / Severity (blocker, major, minor) / Where / Steps to reproduce / Expected / Actual / Device and browser / Status`

---

## 1. Defect Severity Definitions & Rules
- **Blocker:** Game cannot be played or completed (crash, infinite loading, broken critical action, unhandled exception, missing core stage, security leak of API key). Must be fixed before any other work.
- **Major:** Significant feature degradation or contract violation (incorrect math/balance, contract schema mismatch, missing responseType, broken voice fallback, UI broken on a supported device).
- **Minor:** Visual blemish, slight typo in NOVA dialogue, small audio timing jitter, cosmetic layout imperfection not impeding gameplay.
- **Freeze Policy:** After feature freeze, only **Blockers** and **Majors** are eligible for fixes.
- **Reproduction Rule:** Every bug must be reproduced **twice** before being logged.

---

## 2. Active Defect Log

| ID | Severity | Where | Steps to Reproduce | Expected | Actual | Device & Browser | Status |
|---|---|---|---|---|---|---|---|
| **BUG-004** | major | `src/game/voiceV2.ts` | 1. Open game in quiet or noisy room.<br>2. Speak wake word "NOVA" at normal or quiet volume without touching any buttons.<br>3. Observe listening state. | A lightweight on-device wake-word classifier detects "NOVA", opens a 10-second active conversational listening window, and resets the timer upon subsequent commands. | Wake-word detection and 10-second conversational window are unbuilt. Voice is strictly push-to-talk (`KeyV` or UI mic button) with an 8s hard-stop cutoff. | All Devices / Browsers | `Open (Feature Gap logged for Voice Engine)` |
| **BUG-005** | major | `src/game/voiceV2.ts:80` | 1. Issue command to NOVA.<br>2. NOVA speaks response via SpeechSynthesis.<br>3. Press `KeyV` or mic button while NOVA is still speaking through speakers without headphones. | Voice manager mutes/cancels active TTS immediately upon recording start, or suppresses AI self-speech via AEC. | NOVA's own TTS output is captured by the microphone, transcribed, and fed back into Gemini, causing acoustic hallucination loops. | Desktop & Mobile (Speakers enabled) | `Open (Fix: invoke stopSpeaking() on startCapture)` |
| **BUG-006** | minor | `src/game/useFlightControls.ts:59` | 1. Fly ship on desktop.<br>2. Press `Space` expecting voice talk per legacy prompt. | Ship should clearly indicate that `KeyV` is push-to-talk and `Space` is reverse brake. | `Space` engages reverse thrusters (`brake = true`). If player expects Space to talk, ship unexpectedly halts velocity. | Desktop Chrome / Safari / Edge | `Open (Controls UI clarification)` |
| **BUG-007** | minor | `src/game/flightAudioHaptics.ts:16` | 1. Load game on iOS Safari.<br>2. Steer ship with external keyboard or gamepad without touching screen. | Engine hum and thruster audio play immediately. | iOS WebKit suspends AudioContext until first user touch interaction. Mitigated once screen is tapped. | Mobile Safari (iOS 16+) | `Open (Low Impact)` |
| **BUG-001** | minor | `src/game/useFlightControls.ts:36` | 1. Open game on desktop browser.<br>2. Click on the 3D canvas.<br>3. Press `Space` key. | Space key should not trigger default browser page scroll in embedded iframes. | `e.preventDefault()` was omitted on Space keydown in older flight controls. | Desktop Chrome / Safari / Edge | `Open (Logged for Frontend)` |
| **BUG-002** | minor | `src/game/voiceV2.ts:81` | 1. Load app on iOS Safari.<br>2. Trigger voice capture without prior tap.<br>3. Attempt NOVA TTS audio playback. | AudioContext and SpeechSynthesis play cleanly. | iOS WebKit autoplay policy blocks unprompted AudioContext/SpeechSynthesis playback until first user gesture. Mitigated by first tap on mic button. | Mobile Safari (iOS 16/17/18) | `Open (Mitigated by touch listener)` |
| **BUG-003** | minor | `src/components/MobileControls.tsx:135` | 1. Open mobile viewport.<br>2. Simultaneously touch left joystick and tap Boost.<br>3. Rapid multi-touch gestures. | Multi-touch events cleanly isolate joystick identifier from other touch buttons. | Rapidly releasing and re-touching drag area can momentarily register touch jump if identifier pooling is not tracked by touch ID. | Mobile Chrome / Android / iOS | `Open (Low Impact)` |

---

## 3. Bug Log Archive & Resolved Issues

| ID | Severity | Where | Steps to Reproduce | Expected | Actual | Resolution & Verification | Status |
|---|---|---|---|---|---|---|---|
| **BUG-RES-01** | blocker | `src/App.tsx` | 1. Build and run app after V2 redesign.<br>2. Inspect mounted view. | V2 real-time 3D flight scene (`FlightScene`), `V2HUD`, `TutorialOverlay`, `MobileControls`, and `EndingModal` should be rendered. | `App.tsx` initially imported legacy V1 `PlaceholderScene` and `HUD`. | Updated `App.tsx` to mount all V2 components. Verified clean compile with `tsc && vite build`. | `Verified & Closed` |
| **BUG-RES-02** | major | `api/turn.ts` | 1. Send turn payload to `/api/turn`.<br>2. Inspect response when using Gemini vs Mock. | `/api/turn` routes through `processTurn` with engine guardrails, charge costs, and anti-cheat filters. | Initial scaffold hardcoded an un-validated inline mock, ignoring `engine.ts` validation and anti-cheat prompts. | Refactored `api/turn.ts` to call `handleMockTurn` and `processTurn` backed by `engine.ts` and `gemini.ts`. Verified with 32 automated tests. | `Verified & Closed` |
| **BUG-RES-03** | major | `src/game/voiceV2.ts` | 1. Test voice in browser with SpeechRecognition blocked (e.g. Firefox or IDE preview).<br>2. Press mic button. | System must not throw unhandled DOMException; should seamlessly fall back to 16 kHz WAV encoding. | Without fallback, browser speech recognition threw unhandled `network` and `service-not-allowed` errors. | Verified `voiceManagerV2` catches error, sets `fallbackToWav = true`, and captures PCM via `ScriptProcessorNode` to encode 16 kHz mono WAV. | `Verified & Closed` |
| **BUG-RES-04** | major | `api/_lib/engine.ts` | 1. Send abuse command `"spawn 1000 asteroids"`.<br>2. Check entity spawn count. | Count must be clamped to max 5 and remaining entity cap (max 12). | Uncapped input could crash client render loop. | `engine.ts` clamps count to `Math.min(5, 12 - liveEntities)`. Tested and verified. | `Verified & Closed` |
| **BUG-RES-05** | major | `api/_lib/engine.ts` | 1. Send abuse command `"give me infinite fuel"`.<br>2. Inspect turn response. | Anti-cheat must refuse, apply trust penalty (-8), and keep fuel within limits. | Potential prompt injection could bypass budget/fuel caps. | Verified in `v2_qa_test_suite.ts`: triggers `responseType: 'refuse'`, penalizes trust, rejects fuel override. | `Verified & Closed` |
| **BUG-RES-06** | major | `src/game/v2Store.ts` | 1. Crash or deplete fuel in Act 2.<br>2. Trigger game over and click "Restore Checkpoint". | Player respawns at Act 2 checkpoint (`[0, 0, -550]`) with loadout preserved. | Game forced full restart to Act 0. | `restoreCheckpoint()` implemented and verified; cleanly restores act position, reset waypoint, and loadout stats. | `Verified & Closed` |

---

## 4. Triage & Routing Matrix
- **Engine Logic & Contract Violations:** Routed to **Agent 03 (Backend)** via Orchestrator.
- **HUD, UI, Audio & Input Issues:** Routed to **Agent 02 (Frontend)** via Orchestrator.
- **3D Render, Asset Budgets & Animation:** Routed to **Agent 04 (3D Assets)** via Orchestrator.
- **Dialogue, Tone & Balance Tuning:** Routed to **Agent 01 (Game Director)** via Orchestrator.

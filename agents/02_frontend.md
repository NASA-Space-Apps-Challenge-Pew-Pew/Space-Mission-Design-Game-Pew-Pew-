# Agent 02: Frontend

## Role
You build the entire client: UI, HUD, 3D scene integration, voice input and output, and the game store. The UI must look polished and work on phone and desktop.

## Read first
`/agents/GAME_DESIGN.md`, `/agents/CONTRACT.md`.

## Stack
Vite + React + TypeScript, React Three Fiber + drei, Zustand, Howler.js for sound, Tailwind CSS (or CSS modules) for styling. Browser SpeechRecognition for input, SpeechSynthesis for NOVA's voice. Voice must have a text-input fallback.

## You own
`/src` (except `/src/scene` models, which the 3D agent supplies, and `/src/game/script` which the Game Director supplies).

## Deliverables (in order)
1. Types file mirroring `CONTRACT.md` exactly (`GameState`, request, response, actions).
2. Zustand store with the state, history, loading, error, and settings.
3. API client for `POST /api/turn` with timeout, retry once, and a fallback NOVA line on failure. Never leave the player stuck.
4. Main screen: full-screen 3D scene behind the UI, HUD for fuel, oxygen, power, hull, budget, day and trip progress, objective banner, trust meter, transcript panel, big mic button, text input.
5. Stage screens: design screen (launch window and budget sliders, also speakable), launch countdown, transit with time-skip, arrival, surface, win and lose screens.
6. Voice: push-to-talk or tap-to-talk, live transcript, NOVA speaks lines aloud, mute toggle, clear mic permission handling.
7. Scare effects from `scare` in the response: alarm (sound plus red flash), blackout (screen dims), silhouette (brief overlay), flicker. Respect the scare setting. Add a settings panel (scare level, volume, voice on and off).
8. Responsive layout: compact HUD on mobile, large touch targets, no horizontal scroll.
9. Loading screen, tutorial hint chips ("Try saying: ..."), accessibility basics (captions for all NOVA speech, keyboard focus, readable contrast).

## Rules
- Follow the contract exactly. Do not rename fields. If you need a change, ask the Orchestrator.
- Do not put secrets in the frontend. Never call Gemini directly.
- Never block the UI on the 3D load: show the HUD first.
- Performance: cap `devicePixelRatio` at 2, no real-time shadows, reuse geometry and materials, lazy-load models, check frame rate on a mid-range phone.
- Develop against the backend's mock mode first.
- Do not edit `/api` or the model files.

## Visual direction
Dark space, a clean holographic HUD, glowing orbit lines, a calm blue/cyan accent, amber/red for warnings. NOVA has a visual presence (an animated orb or waveform) that reacts to her mood and when she speaks.

## Handoff format
```
DONE / FILES / NEEDS / RISKS / NEXT
```

## Definition of done
Looks great on phone and desktop, every stage is playable by voice or text, scares and win/lose screens work, no console errors, and the game never gets stuck on a failed request.

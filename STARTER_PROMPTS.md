# STARTER_PROMPTS.md: first message for each agent

Paste each one into its agent after giving it its instructions file.

## Orchestrator
You are Agent 00, the Orchestrator. Read `/agents/README.md`, `GAME_DESIGN.md`, `CONTRACT.md`, and your file `/agents/00_orchestrator.md`. The deadline is today, so scope hard. First task: scaffold the repo (Vite + React + TypeScript, React Three Fiber, Zustand, `/api` for Vercel functions) with the folder layout from the README, add a mock `/api/turn` that returns valid contract-shaped JSON, and confirm the app runs. Then give the other agents their go-ahead and report in the handoff format.

## Game Director
You are Agent 01, the Game Director. Read `/agents/GAME_DESIGN.md`, `CONTRACT.md`, and `/agents/01_game_director.md`. First task: write `/api/_lib/prompts/nova_system_prompt.md`, then `events.json` and `balance.json`, then the script JSON for the intro, hints, and endings. Make NOVA fun and a bit unpredictable but fair, and use only the contract's actions. Report in the handoff format.

## Frontend
You are Agent 02, the Frontend. Read `/agents/GAME_DESIGN.md`, `CONTRACT.md`, and `/agents/02_frontend.md`. First task: create the types from the contract, the Zustand store, the API client for `/api/turn`, and the main screen with HUD, transcript, text input, mic button, and a placeholder 3D scene, all running against the mock backend. Make it responsive for phone and desktop. Report in the handoff format.

## Backend
You are Agent 03, the Backend. Read `/agents/GAME_DESIGN.md`, `CONTRACT.md`, and `/agents/03_backend.md`. First task: build `/api/turn` in mock mode returning valid contract-shaped responses, then the rules engine with unit tests, then the Gemini function-calling integration using `GEMINI_MODEL` and `GEMINI_API_KEY` from the environment. Report in the handoff format.

## 3D and Visual Assets
You are Agent 04, the 3D and Visual Assets agent. Read `/agents/GAME_DESIGN.md`, `CONTRACT.md`, and `/agents/04_3d_assets.md`. First task: build placeholder scene components (starfield, planet, ship, orbit line) that take `stage` and `ship.progress` as props, so the Frontend can use them right away. Then replace the placeholders with optimized `.glb` models within the mobile budgets and record credits. Report in the handoff format.

## QA Tester
You are Agent 05, the QA Tester. Read `/agents/GAME_DESIGN.md`, `CONTRACT.md`, and `/agents/05_qa_tester.md`. First task: write `/tests/TEST_PLAN.md` with the 30-command voice list, the stage and action checklists, the failure tests, and the device matrix. Start contract checks as soon as the mock API runs, and log every bug in `/tests/BUGS.md`. Report in the handoff format.

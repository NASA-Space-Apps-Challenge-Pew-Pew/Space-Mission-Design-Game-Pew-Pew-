# Dear NOVA: Multi-Agent Starter Pack

NASA Space Apps 2026, "Space Mission Design Game". A voice-driven space game where you talk to an unpredictable ship AI (NOVA) to design, fly, and land a mission to Mars.

## Files
| File | Purpose |
|---|---|
| `GAME_DESIGN.md` | Source of truth for the game flow, NOVA behavior, stages, win/lose |
| `CONTRACT.md` | Source of truth for state JSON, action list, `/api/turn` API. Nobody changes it alone |
| `00_orchestrator.md` | Lead agent: plan, order of work, integration, deadline control |
| `01_game_director.md` | Game flow, NOVA persona, Gemini system prompt, events, balance |
| `02_frontend.md` | React + React Three Fiber UI, HUD, voice input/output |
| `03_backend.md` | Serverless `/api/turn`, Gemini function calling, rules engine |
| `04_3d_assets.md` | 3D models, skybox, scene art, performance budgets |
| `05_qa_tester.md` | Test plan, bug reports, demo script |
| `STARTER_PROMPTS.md` | Short first message to paste into each agent |

## How to use in Antigravity
1. Create the repo and copy this whole folder into it as `/agents`.
2. Create one agent per role. Paste the matching `0X_*.md` as that agent's instructions (or tell it to read that file first).
3. Paste the matching message from `STARTER_PROMPTS.md` to start each agent.
4. Every agent must read `GAME_DESIGN.md` and `CONTRACT.md` before writing code.
5. Any change to the contract goes through the Orchestrator. Update `CONTRACT.md`, then tell every agent.

## Suggested repo layout
```
/agents            (these files)
/src               frontend (Vite + React + R3F)
/src/game          store, types, api client, voice
/src/scene         3D scene components
/public/models     .glb files
/public/audio      sounds
/api               serverless functions (Vercel)
/api/_lib          rules engine, gemini client, prompts
/tests             tests and the test log
```

## Environment variables
`GEMINI_API_KEY` (server only, never in the frontend), `GEMINI_MODEL` (set to whichever Flash model AI Studio lists), `ALLOWED_ORIGIN`.

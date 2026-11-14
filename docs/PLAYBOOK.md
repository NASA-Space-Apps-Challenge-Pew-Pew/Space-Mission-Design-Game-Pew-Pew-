# Pew Pew Playbook (H0 = Kickoff; Submission Sunday 11:59 PM)

## 1. Architecture Verdict and Winning Angle
FastAPI + React + Tailwind + SQLite is the ideal stack for a 6-person sprint:
- **Engine**: Pure mathematical functions (easy to unit test, deterministic, and scientifically accurate).
- **Frontend**: Reactive live telemetry polling (120ms debounce), dark-mode HUD aesthetic.
- **Leaderboard**: SQLite local persistence.
- **Single Deploy**: FastAPI mounts and serves `frontend/dist` directly, ensuring one unified URL for judges with zero CORS or login friction.

### Differentiators for NASA Space Apps Global Judges:
1. **Root-Cause Engineering Debrief**: Every failed run displays the exact physics formulas ($dv = I_{sp} g_0 \ln(m_{wet}/m_{dry})$, $1/r^2$ solar flux, $1/d^2$ communication link attenuation) with the player's own numbers.
2. **Real Flight Hardware Data**: Instruments and missions are direct flight analogs of LRO, MAVEN, ExoMars TGO, and Psyche, with verified NASA URLs.
3. **The Margin Lesson**: Random mid-mission events (Solar Storm, DSN Congestion, Thruster Anomalies) reward 20–30% engineering margin—teaching students how NASA flight missions actually manage risk.
4. **Zero-Friction Access**: Six live gauges, one launch button, and under 60 seconds to first launch without login walls.

---

## 2. Hour-by-Hour Roadmap & Responsibilities

### Danlord Farell A. Soriano (Team Lead & Main Pitcher)
- **Phase 1 (H0–4)**: Set up repo access, enforce file ownership boundaries, confirm deployment pipeline on Render/Railway.
- **Phase 2 (H4–20)**: Conduct hourly 5-minute standups (*Blocked? Done? Next?*). Merge PRs into `main` on the hour. Feature freeze at H20.
- **Phase 3 (H20–33)**: Rehearse pitch script with timer 5+ times; conduct mock Q&A defenses; perform submission portal dry-run; complete final submission before H33.

### Justine Roy P. Salvador (CTO / Backend Architect)
- **Phase 1**: Verify `backend/main.py` runs cleanly on port 8000; test `/api/data` and `/api/evaluate`.
- **Phase 2**: Collaborate with Mark to tune `solar_factor`, `link_factor`, and `delta_v_required` so every mission has 2–3 viable engineering solutions.
- **Phase 3**: Code freeze, pin requirements, verify `/api/health` and test production deployment.

### Shawn Michael E. Hitalada (Full-Stack / HUD Lead)
- **Phase 1**: Maintain and extend `/frontend/src/components/hud/` (`Hud.jsx`, `Gauge.jsx`).
- **Phase 2**: Implement visual margin markers at 80%, delta-v indicators, and warning chips.
- **Phase 3**: Responsive mobile checks, color-blind accessible indicators, and offline fallback states.

### John Kurt D. Montero (CPO / UI & Interactive Gameplay Lead)
- **Phase 1**: Maintain and polish `/frontend/src/components/builder/` (`Builder.jsx`, `Choice.jsx`).
- **Phase 2**: Add dynamic component delta comparisons (mass/power change on hover), recommended scenario presets, and mission objective chips.
- **Phase 3**: Visual hierarchy, card spacing, 44px touch targets for mobile accessibility.

### Pia Ceniza Pacana (Frontend, UI/UX & Presentation Lead)
- **Phase 1**: Establish dark Mission Control color palette and typography in Tailwind.
- **Phase 2**: Polish HUD and Debrief modal; capture high-resolution screenshots of failure and success states.
- **Phase 3**: Finalize 7-slide pitch deck (export to PDF); record backup 30-second gameplay video.

### Mark (Research, QA & Submission Lead)
- **Phase 1**: Open every NASA source URL in `missions_data.json`; verify instrument specs against NASA NSSDCA / mission pages; log updates in `docs/DATA_LOG.md`.
- **Phase 2**: Test 30+ spacecraft configurations (minimum cost, maximum mass, science extremes); test edge cases; refine educational tooltips to Grade 9 reading level.
- **Phase 3**: Populate NASA Space Apps portal fields; verify word counts (50–200 words); confirm all URLs open publicly in incognito.

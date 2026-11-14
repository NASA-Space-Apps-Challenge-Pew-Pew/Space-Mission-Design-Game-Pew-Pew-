# Pew Pew: Space Mission Design Game
**NASA Space Apps Challenge 2026** — Local Hub: Iligan City (Virtual)  
**Challenge:** [Space Mission Design Game](https://www.spaceappschallenge.org/2026/challenges/space-mission-design-game/)  
**Live Demo:** *(Deployed on Render/Railway)* · **Pitch Video:** [30-Second Gameplay Demo](https://youtu.be/_hl-36j6C54)

---

## Overview
**Pew Pew** is an interactive, browser-based systems engineering game that puts students in command of a deep space flight mission. Instead of presenting abstract equations, Pew Pew allows players to design, balance, and simulate a space mission from concept to orbital operation while managing **six live core resources**:
1. **Mass:** Total wet mass vs. launch vehicle throw capacity to target orbital energy.
2. **Power:** Solar array generation ($1/r^2$ attenuation) vs. avionics and payload power demand.
3. **Budget:** Vehicle, bus, and instrument development costs vs. mission cap.
4. **Data:** Science observation volume vs. onboard solid-state recorder capacity.
5. **Communications:** Data downlink bandwidth vs. Deep Space Network contact windows ($1/d^2$ path loss).
6. **Time:** Development timeline and orbital transit time vs. synodic planetary launch windows.

Every design choice carries an engineering trade-off. When a mission fails, Pew Pew provides a **pedagogical root-cause debrief** with the player's exact numbers and physical formulas ($dv = I_{sp} g_0 \ln(m_{wet}/m_{dry})$, power balance, link budget) rather than an arbitrary "Game Over".

---

## Quickstart (Run Locally)

### 1. Backend (FastAPI Simulation Engine)
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
API runs on `http://localhost:8000`. Test interactive Swagger documentation at `http://localhost:8000/docs`.

### 2. Frontend (React + Tailwind CSS HUD)
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser. All API requests are proxied automatically to `http://localhost:8000`.

---

## Single-Container Production Deployment (Render / Railway)
FastAPI is configured to mount and serve the built React frontend (`frontend/dist`) directly from root `/`, providing **one unified URL** with zero CORS and no login walls:

1. **Build Step:**
   ```bash
   pip install -r backend/requirements.txt && cd frontend && npm install && npm run build
   ```
2. **Start Command:**
   ```bash
   cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

---

## Repository Ownership & Team Allocation
To eliminate Git merge conflicts during the 48-hour sprint, each team member owns dedicated directories:

| Folder / File | Primary Owner | Responsibilities |
| :--- | :--- | :--- |
| `/data/missions_data.json` | **Mark + Justine** | NASA hardware specs, mission constraints, JSON schema |
| `/backend/main.py` | **Justine** | Physics equations, scoring engine, debrief logic, SQLite API |
| `/frontend/src/components/hud/` | **Shawn** | Live telemetry gauges, margin indicators, error chips |
| `/frontend/src/components/builder/` | **John Kurt** | Spacecraft builder cards, sliders, mission selectors |
| `/frontend/src/components/debrief/` | **Pia + Shawn** | Post-mission debrief modal, telemetry animations |
| `/frontend/src/styles/` | **Pia** | NASA Mission Control dark theme, color palette, typography |
| `/frontend/src/App.jsx` | **Danlord** | Integration layer; merges only after branch testing |
| `/docs/` | **Danlord, Pia, Mark** | Playbook, pitch script, 7-slide deck, portal submission text |

### Contribution Rule
- Never commit directly to `main`.
- Create a feature branch (e.g., `feat/hud-shawn`, `feat/builder-kurt`, `feat/backend-justine`).
- Open a Pull Request into `main`. Danlord conducts testing and merges on the hour.

---

## Scientific Citations & NASA Data Sources
All mission scenarios and spacecraft components are modeled on flight-proven NASA hardware:
- **Lunar Reconnaissance Orbiter (LRO):** LEND, LAMP, Diviner, LOLA, Mini-RF — [NASA LRO](https://science.nasa.gov/mission/lro/)
- **MAVEN (Mars Atmosphere and Volatile EvolutioN):** NGIMS Spectrometer — [NASA MAVEN](https://science.nasa.gov/mission/maven/)
- **Psyche Asteroid Mission:** GRNS, Magnetometer, Multispectral Imager, Gravity Science — [NASA Psyche](https://science.nasa.gov/mission/psyche/)
- **Deep Space Network (DSN):** Ground station scheduling and link budgets — [NASA DSN Now](https://eyes.nasa.gov/dsn/dsn.html)
- **NASA Planetary Data System (PDS):** [NASA PDS](https://pds.nasa.gov/)
- **NASA NSSDCA Master Catalog:** [NASA NSSDCA](https://nssdc.gsfc.nasa.gov/nmc/)

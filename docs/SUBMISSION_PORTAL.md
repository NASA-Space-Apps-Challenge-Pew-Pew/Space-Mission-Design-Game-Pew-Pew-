# NASA Space Apps Challenge 2026 — Official Submission Portal Copy
**Hub:** Iligan City (Virtual)  
**Challenge:** Space Mission Design Game  
**Team:** Pew Pew  

---

### Field 1: Project Name
```text
Pew Pew: Space Mission Design Game
```

---

### Field 2: Summary * (Strictly 50–200 Words)
*(Word count: 131 words)*
```text
Mission Design Game is a free, browser-based game where players design a spacecraft and learn why real missions are compromises. Choose a NASA-inspired mission (Artemis lunar south pole ice, Mars methane, or Psyche asteroid), then pick a launch vehicle, bus and science instruments modeled on LRO, MAVEN, ExoMars and Psyche hardware. Six live gauges track mass, power, budget, data, communications and time. Launch to face random events such as solar storms and Deep Space Network congestion. When a mission fails, an engineering debrief shows the exact physics, using the player's own numbers: the rocket equation, inverse-square solar power and link-budget limits. Players learn that margin, not maximum capability, makes missions succeed. The game needs no login, runs on phones and laptops, and is open source, so teachers anywhere can use it.
```

---

### Field 3: Project Demonstration * (Public Link)
*(Option A: Slide presentation strictly max 7 slides, OR Option B: Video strictly 30 seconds or less)*
```text
https://youtu.be/_hl-36j6C54
```
*(Ensure YouTube privacy is set to Public or Unlisted).*

---

### Field 4: Project * (Public Link)
*(Publicly accessible live playable web app or repository)*
```text
https://github.com/NASA-Space-Apps-Challenge-Pew-Pew/Space-Mission-Design-Game-Pew-Pew-
```

---

### Field 5: Project Details *
```markdown
### What Does It Do and How Does It Work?
Pew Pew is an interactive systems engineering simulator designed to teach students the multi-variable trade-offs inherent in deep-space exploration. Players choose an objective (Artemis Lunar South Pole Ice Scout, Mars Methane Orbiter, or Psyche Metal Asteroid) and design a complete spacecraft by selecting launch vehicles, spacecraft buses, propellant margins, and scientific instruments.

As choices are made, a reactive telemetry HUD updates six core live resources in real time:
1. Mass: Total wet mass vs. rocket throw capacity to target orbital energy.
2. Power: Solar generation (modeled by solar distance) vs. payload power demand.
3. Budget: Vehicle, bus, and instrument development costs vs. mission cap.
4. Data: Daily observation generation vs. onboard buffer capacity.
5. Communications: Data volume vs. Deep Space Network contact bandwidth.
6. Time: Development and transit timeline vs. synodic planetary launch windows.

Upon launch, the spacecraft undergoes orbital insertion, testing system resilience against mid-mission stochastic events (e.g., Coronal Mass Ejections, DSN tracking reallocations). If a mission fails, the simulator provides an educational root-cause debrief calculating the exact physical bottleneck using the user's flight data.

### Educational Impact & Benefits
In traditional coursework, systems engineering is presented as abstract formulas. Pew Pew transforms these concepts into intuitive cause-and-effect discoveries. Students learn that maximizing instrument count leads to brownouts or launch mass violations, and that mission success requires balancing capability with engineering margins.

### Tools, Languages, and Architecture
- Frontend: React 18, Tailwind CSS, Vite.
- Backend & Physics Engine: Python 3, FastAPI, SQLite.
- Deployment: Single-container architecture where FastAPI directly serves the compiled Vite bundle, eliminating login walls, API latency, and CORS constraints.

### Scientific Credibility & Engineering Factors
The simulation model implements core astronautical equations:
- Tsiolkovsky Rocket Equation: $dv = I_{sp} \cdot g_0 \cdot \ln(m_{wet} / m_{dry})$
- Inverse-Square Solar Irradiance: $P(r) = P_0 / r^2$
- Free-Space Path Loss & Link Budget Scaling: $R(d) \propto 1 / d^2$
- Synodic planetary launch window cadence and integration buffers.
```

---

### Field 6: Use of Super Intelligence (SI) *
**Checkbox Selection:** Code and data / Text editing assistance.

**Disclosure Statement:**
```text
Super Intelligence tools (Claude by Anthropic and Google Antigravity) were utilized during the 48-hour hackathon sprint to scaffold software architecture, generate boilerplate FastAPI and React component structures, and assist in formatting public NASA spacecraft metrics into standardized JSON schemas. All scientific calculations, equations, gameplay balance logic, and NASA citations were reviewed, verified, and authored by Team Pew Pew.
```

---

### Field 7: NASA Data *
*(Enter each as Link Text and full Link URL)*
- **Link Text:** NASA Science: Lunar Reconnaissance Orbiter (LRO) Instruments
  - **Link URL:** `https://science.nasa.gov/mission/lro/`
- **Link Text:** NASA Science: MAVEN (Mars Atmosphere and Volatile EvolutioN)
  - **Link URL:** `https://science.nasa.gov/mission/maven/`
- **Link Text:** NASA Science: Psyche Asteroid Mission
  - **Link URL:** `https://science.nasa.gov/mission/psyche/`
- **Link Text:** NASA NSSDCA Master Catalog (Spacecraft and Instrument Specs)
  - **Link URL:** `https://nssdc.gsfc.nasa.gov/nmc/`
- **Link Text:** NASA Planetary Data System (PDS)
  - **Link URL:** `https://pds.nasa.gov/`
- **Link Text:** NASA Eyes on the Solar System: Deep Space Network Now
  - **Link URL:** `https://eyes.nasa.gov/dsn/dsn.html`

---

### Field 8: Space Agency Partner & Other Data
- **Link Text:** ESA ExoMars Trace Gas Orbiter (TGO) Instrument Overview
  - **Link URL:** `https://www.esa.int/Science_Exploration/Human_and_Robotic_Exploration/Exploration/ExoMars`
- **Link Text:** SpaceX Falcon 9 Launch Vehicle User's Guide
  - **Link URL:** `https://www.spacex.com/vehicles/falcon-9/`
- **Link Text:** United Launch Alliance Vulcan Centaur Cutaway & Capabilities
  - **Link URL:** `https://www.ulalaunch.com/rockets/vulcan-centaur`

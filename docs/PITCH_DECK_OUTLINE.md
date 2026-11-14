# Pia's Official 7-Slide Pitch Presentation Outline
**Strict Rule:** Max 7 slides including title and intro.

---

### Slide 1: Title & Hook
- **Headline:** Fail Like an Engineer. Learn Like NASA.
- **Product:** Pew Pew: Space Mission Design Game
- **Meta:** NASA Space Apps Challenge 2026 — Local Hub: Iligan City (Virtual)
- **Visual:** High-contrast screenshot of the dark-mode Mission Control HUD with active live telemetry gauges.

### Slide 2: The Systems Engineering Problem
- **Headline:** Spaceflight Isn't Just Rockets—It's Trade-Offs
- **Key Points:**
  - Traditional education highlights launch events and pretty images, ignoring systems engineering constraints.
  - Adding scientific capability impacts mass, power, communications, and budget simultaneously.
  - Students lack intuitive, zero-barrier tools to experience complete mission life cycles.

### Slide 3: Our Solution
- **Headline:** Systems Engineering in 60 Seconds
- **Key Points:**
  - Interactive browser-based mission simulator with zero login or installation required.
  - 6 Live Reactive Resources: Mass, Power, Budget, Data, Communications, and Time.
  - Built on real mathematical relationships (Tsiolkovsky rocket equation, $1/r^2$ solar and RF attenuation).

### Slide 4: Authentic NASA Scenarios & Spacecraft Builder
- **Headline:** Real Missions, Real Hardware
- **Key Points:**
  - 3 authentic mission profiles: Artemis Lunar South Pole, Mars Methane Tracer, and 16 Psyche Asteroid Core.
  - Selection of commercial and NASA rockets (Falcon 9, Vulcan Centaur, SLS).
  - Authentic scientific instrument suites modeled after LRO, MAVEN, ExoMars TGO, and Psyche.

### Slide 5: The Differentiator — Root-Cause Pedagogical Debrief
- **Headline:** Not Just "You Lost"—Here is Why
- **Key Points:**
  - Dynamic failure analysis that teaches the underlying physics with the user's specific telemetry.
  - Mid-mission stochastic events (Solar flares, DSN bandwidth contention, orbital drift).
  - Teaches why 20–30% engineering margin is essential for spaceflight survival.

### Slide 6: Technical Architecture & 48-Hour Execution
- **Headline:** Fast, Deterministic, and Cloud-Ready
- **Key Points:**
  - **Backend:** Python FastAPI calculating deterministic orbital delta-v and power equations.
  - **Frontend:** React + Tailwind CSS with debounced telemetry polling.
  - **Single Deployment:** FastAPI serves the compiled React application from a single URL.
  - **Open Source:** Public GitHub repository and zero-friction access across desktop and mobile.

### Slide 7: Educational Impact & Roadmap
- **Headline:** Inspiring the Next Generation of Aerospace Innovators
- **Key Points:**
  - Ready for immediate integration in high school and university STEM classrooms.
  - Future roadmap: orbital trajectory sandbox mode, customizable user payloads, multi-language support.
  - **Links:** Public Live Demo URL & Public GitHub Repository QR Code.
  - **Disclosure:** Super Intelligence (SI) tool disclosure compliant.

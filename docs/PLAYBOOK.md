# Pew Pew Playbook v2 (NASA Space Apps 2026)

**Rule for every slide, script line and portal sentence: claim only what the live build does.** The current engine models: wet mass vs launch throw, Tsiolkovsky delta-v, 1/r² solar power, budget, data vs recorder, 1/d² downlink vs DSN contact time, development time vs launch window, and 2 random events per flight (solar storm, DSN congestion, thruster anomaly, cost overrun, launch slip).

---
## SECTION 1: Gameplay Flow & Interface Architecture (Pia + John Kurt)

```
[1 MISSION SELECT]──►[2 ASSEMBLY BAY]──►[3 LIVE GAUGES]──►[4 LAUNCH SEQUENCE]──►[5 DEBRIEF]
 3 mission cards      Rocket / Bus /      always visible     4 stages tick on    outcome, score,
 brief + goal text    Instruments /       beside the bay     a timeline, events  stage results,
 (exists as tabs)     Propellant slider   (right column)     pop in, ~6 s total  physics cards
```

| Screen | Must show | Status in repo |
|---|---|---|
| 1 Mission Select | Name, tagline, one-line science goal, required instrument text, budget ceiling, launch window | Implemented as top selection tabs with detailed brief |
| 2 Assembly Bay | Rocket cards, bus cards, propellant slider, instrument cards sorted by relevance, stat-delta chips ("+26 kg, +20 W") | Implemented with live delta tags in `Builder.jsx` |
| 3 Gauges | 6 bars, % label, used/limit, colour thresholds, delta-v and science readouts, blocking-issues list | Implemented with 85% margin markers in `Gauge.jsx` |
| 4 Launch sequence | Full-screen overlay: the 4 stage chips light one by one (Design review → Launch → Cruise → Science ops); hazard banners pop in; failure stage stops sequence | Implemented in `LaunchSequence.jsx` |
| 5 Debrief | Outcome, score, grade, stage row, event list, physics cards ("What happened / The physics / Try this") | Implemented in `Debrief.jsx` |

### Mission Control Styling (Pia + John Kurt)
- **Palette:** deep blue-black panels (`#0b1018`, `#111826`), hairline slate borders, three status colours only (teal OK, amber warn, red fail), one cyan accent for the active selection and launch button.
- **Layout:** telemetry column pinned right, builder left, thin top bar with mission status and T-00:00 mission clock.
- **Typography:** clean sans-serif UI, tabular numerals for all telemetry to prevent visual jitter.
- **Audio (Mark):** UI click, launch rumble, alarm on red, calm tone on success; mute button visible; no autoplay.
- **Mobile Touch:** cards and buttons minimum 44px tall; right column stacks below builder on mobile screens.

---
## SECTION 2: 7-Slide Pitch Presentation (Pia — Strictly 7 Pages PDF)

| # | Slide Title & Core Message | Visual Graphic |
|---|---|---|
| 1 | **Fail Like an Engineer. Learn Like NASA.**<br>Mission Design Game · Team Pew Pew · Iligan City Virtual Hub | Full-bleed screenshot of the Assembly Bay with active telemetry gauges |
| 2 | **Spaceflight is taught as photos of rockets.**<br>Students never see the trade-offs: more science needs more power, mass, budget, bandwidth and time. | Left: rocket photo. Right: the six live resource words connected by tension vectors |
| 3 | **Pew Pew: Space Mission Design Game.**<br>You are the Mission Director. Pick a real NASA mission, build the spacecraft, launch it, learn why it worked or failed. | 3 mission profile cards: Lunar South Pole Ice, Mars Methane, Psyche Metal Asteroid |
| 4 | **Build it. Watch six resources move.**<br>Mass · Power · Budget · Data · Comms · Time | Annotated UI screenshot: bay on left, gauges on right, callout: "Add a camera, comms hits 400%" |
| 5 | **No 'Game Over.' A root-cause debrief.**<br>Your numbers, real physics: Δv = Isp·g0·ln(m_wet/m_dry); P ∝ 1/r²; link rate ∝ 1/d² | Screenshot of the failure debrief card highlighting the physical law and actionable fix |
| 6 | **Built to run anywhere.**<br>FastAPI simulation engine · React + Tailwind UI · single cloud container · zero login · open source | Clean 3-box diagram: Browser → FastAPI Engine → missions_data.json (NASA-sourced) |
| 7 | **For every classroom.**<br>Free, no login, phone-friendly, open source. Authentic NASA data. Built with disclosed SI tools. | QR code to live playable game + QR code to GitHub repo, NASA citations, SI disclosure |

---
## SECTION 3: Timed Live Pitch Script (Danlord — 2:45 Target, ~400 Words)

**[0:00]** Every spacecraft ever flown is a compromise. Add a camera, and you need more power. More power needs bigger solar arrays. Bigger arrays need a bigger rocket, and a bigger rocket blows your budget.

**[0:20]** Students never feel that. They see the rocket, not the trade-offs. So we built a game that makes you feel them.

**[0:35]** I'm Danlord, and this is Pew Pew, the Space Mission Design Game from Iligan City. You are the Mission Director. Pick a mission: find water ice at the lunar south pole for Artemis, hunt methane at Mars, or visit Psyche, a metal asteroid. Then step into the assembly bay. Choose a launch vehicle, a spacecraft bus, a propellant load and science instruments modeled on real NASA hardware.

**[1:10]** Now watch the six gauges on the right: mass, power, budget, data, communications and time. Every choice moves them live. Let me add a high-resolution camera at Mars. See communications jump past one hundred percent? That spacecraft would collect far more data than it can ever send home, and real mission teams fight exactly that problem.

**[1:45]** Now we launch. Mid-mission hazards hit: a solar storm, or congestion on the Deep Space Network. And when a mission fails, there is no flat game over screen. We show the root cause with your own numbers: the rocket equation if you ran out of delta-v, inverse-square sunlight if you lost power, link limits if your data overflowed. You learn why, then try again in seconds.

**[2:20]** Is it scientifically valid? The equations are real. Instruments are modeled on LRO, MAVEN, ExoMars and Psyche, and every dataset is cited to NASA.

**[2:35]** The impact: it's free, it runs in a browser with no login, it works on phones, and it's open source, built by six students in one weekend, with Super Intelligence help that we disclose.

**[2:45]** Mission Design Game. Fail like an engineer. Learn like NASA. Thank you.

---
## SECTION 4: Judges' Q&A Cheat Sheet (Danlord)

1. **How scientifically accurate is it?**  
   *"Core equations are real: Tsiolkovsky for delta-v, inverse-square for sunlight and link rate, and data-versus-downlink budgets. Spec numbers are rounded analogs of LRO, MAVEN/TGO and Psyche hardware, tuned for gameplay, and we cite our NASA sources. It's an educational model, not a flight simulator, and we state its simplifications in the debrief."*

2. **How do you know players actually learn?**  
   *"The design forces the learning: every failure maps to one named physical law with the player's own numbers, plus a concrete 'try this' fix. Players iterate in seconds, which is the true engineering loop."*

3. **What did the AI do and what did you do?**  
   *"Super Intelligence helped scaffold the architecture, code, and copy. Our team reviewed and tested all of it, verified the NASA data against its sources, balanced every mission by hand, and made all design decisions. It is disclosed on the portal and on slide 7."*

4. **Can a school actually use it?**  
   *"Yes. It needs only a browser, requires no login, works on mobile phones, and deploys as a single container, so a teacher can also self-host it from our public GitHub repo. Missions are data in one JSON file, allowing teachers to create custom scenarios."*

---
## SECTION 5: Submission Checklist (Danlord)
1. Live URL loads publicly in an incognito window with no login.
2. GitHub repository is public with complete README and SI disclosure.
3. Pitch deck PDF is strictly max 7 pages.
4. Summary word count is strictly between 50 and 200 words (our draft is 131 words).
5. All six NASA data URLs open properly.
6. Final submission completed on the portal hours ahead of the 11:59 PM deadline.

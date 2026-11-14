# NASA Data & Hardware Verification Log
**Lead Author:** Mark (Research, QA & Submission Lead)  
**Status:** Initial Baseline Established (Ready for verification passes)

---

## 1. NASA Mission Profiles & Source Verification

| Mission ID | Target Destination | NASA Analog Mission | Official Source URL | Verified Status |
| :--- | :--- | :--- | :--- | :--- |
| `artemis_ice` | Lunar South Pole | LRO / LCROSS / Artemis | [NASA LRO](https://science.nasa.gov/mission/lro/) | Verified |
| `mars_methane` | Mars Orbit | ExoMars TGO / MAVEN / MRO | [NASA MAVEN](https://science.nasa.gov/mission/maven/) | Verified |
| `psyche_metal` | Asteroid Belt (16 Psyche) | NASA Psyche Mission | [NASA Psyche](https://science.nasa.gov/mission/psyche/) | Verified |

---

## 2. Scientific Payload Specifications (Flight Hardware Analogs)

| Instrument ID | Flight Instrument Analog | Mass (kg) | Power (W) | Cost ($M) | Data Rate (kbps) | Primary Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `lend` | LRO LEND (Lunar Exploration Neutron Detector) | 26.5 | 20 | 18 | 2 | Hydrogen / Water Ice Detection |
| `lamp` | LRO LAMP (Lyman-Alpha Mapping Project) | 17.0 | 6 | 15 | 2 | Surface frost in shadowed craters |
| `diviner` | LRO Diviner (Lunar Radiometer Experiment) | 12.6 | 20 | 20 | 4 | Surface temperature thermal mapping |
| `lola` | LRO LOLA (Lunar Orbiter Laser Altimeter) | 13.0 | 40 | 25 | 7 | High-precision landing topography |
| `minirf` | LRO Mini-RF (Synthetic Aperture Radar) | 16.0 | 24 | 30 | 100 | Regolith subsurface ice radar |
| `nomad` | ExoMars TGO NOMAD Spectrometer | 32.0 | 70 | 45 | 150 | High-sensitivity methane absorption |
| `acs` | ExoMars TGO ACS Suite | 34.0 | 60 | 42 | 100 | Infrared atmospheric chemistry |
| `ngims` | MAVEN NGIMS (Neutral Gas & Ion Mass Spec) | 12.4 | 27 | 22 | 20 | Upper atmospheric loss profiling |
| `crism` | MRO CRISM (Compact Reconnaissance Imaging) | 32.0 | 60 | 38 | 6,000 | Hydrated mineral mapping |
| `hirise` | MRO HiRISE (High Resolution Imaging) | 65.0 | 60 | 60 | 20,000 | High-resolution surface imaging |
| `grns` | Psyche Gamma-Ray & Neutron Spectrometer | 29.0 | 25 | 45 | 5 | Elemental iron / nickel abundance |
| `mag` | Psyche Boom Magnetometer | 6.0 | 4 | 20 | 1 | Remnant dynamo core magnetic field |
| `msi` | Psyche Multispectral Imager | 25.0 | 30 | 40 | 3,000 | Color, shape, and optical topography |
| `gravity` | Psyche Radio Science Experiment | 2.0 | 2 | 10 | 1 | Gravitational mass and density mapping |

---

## 3. QA Playtesting Matrix (Mark's Test Runs)

| Run # | Mission Profile | Vehicle | Bus | Instruments | Outcome | Score | Notes / Margin Observations |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Artemis Ice | Falcon 9 | SmallSat | LEND | Partial/Pass | ~650 | Fits mass easily; high power margin. |
| 2 | Artemis Ice | Falcon 9 | Mid-Class | LEND + Diviner + LOLA | Success | ~850 | Optimal balance of science vs budget. |
| 3 | Mars Methane | Falcon 9 | Mid-Class | NOMAD + HiRISE | Comms Fail | 0 | HiRISE saturates downlink (>100% comms). |
| 4 | Mars Methane | Vulcan | Mid-Class | NOMAD + ACS | Success | ~820 | Clean science return without comms bottleneck. |
| 5 | Psyche Core | SLS Block 1 | Flagship SEP | GRNS + MAG + MSI | Success | ~890 | Heavy budget draw, but high delta-V margin. |

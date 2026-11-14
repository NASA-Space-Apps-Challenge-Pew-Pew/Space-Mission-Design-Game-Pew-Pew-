"""Pew Pew - Space Mission Design Game: simulation engine.

Run:  uvicorn main:app --reload --port 8000   (from /backend)
Deps: pip install fastapi uvicorn pydantic
"""
import json
import math
import random
import sqlite3
import time
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

ROOT = Path(__file__).resolve().parent.parent
DATA_PATH = ROOT / "data" / "missions_data.json"

if not DATA_PATH.exists():
    raise RuntimeError(f"Missing data file at {DATA_PATH}")

DATA = json.loads(DATA_PATH.read_text(encoding="utf-8"))
G0 = DATA["constants"]["g0"]
MISSIONS = {x["id"]: x for x in DATA["missions"]}
VEHICLES = {x["id"]: x for x in DATA["vehicles"]}
BUSES = {x["id"]: x for x in DATA["buses"]}
INSTR = {x["id"]: x for x in DATA["instruments"]}

DB = Path(__file__).with_name("scores.db")


def db():
    con = sqlite3.connect(DB)
    con.execute(
        "CREATE TABLE IF NOT EXISTS runs(id INTEGER PRIMARY KEY, ts REAL, player TEXT,"
        " mission TEXT, score INTEGER, outcome TEXT)"
    )
    return con


app = FastAPI(title="Pew Pew Mission Design API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


class Config(BaseModel):
    mission_id: str
    vehicle_id: str
    bus_id: str
    instrument_ids: List[str] = Field(default_factory=list)
    propellant_kg: float = 0
    seed: Optional[int] = None
    player: Optional[str] = None


def status(pct: float) -> str:
    return "ok" if pct <= 85 else ("warn" if pct <= 100 else "fail")


# --------------------------------------------------------------------------- core model
def evaluate(c: Config) -> dict:
    m, v, b = MISSIONS.get(c.mission_id), VEHICLES.get(c.vehicle_id), BUSES.get(c.bus_id)
    if not (m and v and b):
        raise HTTPException(404, "Unknown mission, vehicle or bus id")
    ins = [INSTR[i] for i in dict.fromkeys(c.instrument_ids) if i in INSTR]
    prop = max(0.0, min(c.propellant_kg, b["max_prop_kg"]))

    dry = b["dry_mass_kg"] + sum(i["mass_kg"] for i in ins)
    wet = dry + prop
    cap = v["payload_kg"][m["destination"]]
    dv = b["isp_s"] * G0 * math.log(wet / dry) if dry > 0 else 0

    gen_w = b["solar_w_1au"] * m["solar_factor"]
    load_w = b["base_power_w"] + sum(i["power_w"] for i in ins)

    cost = b["cost"] + v["cost"] + sum(i["cost"] for i in ins)
    dev_cost = cost - v["cost"]
    dev_months = max([b["dev_months"]] + [i["dev_months"] for i in ins]) + 6  # +6 integration & test
    transit = m["transit_months"][b["propulsion"]]
    ops_avail = b["life_months"] - transit

    gb_day = sum(i["data_kbps"] * i["duty"] * 86400 for i in ins) / 1e6
    link_gb_day = b["downlink_kbps"] * m["link_factor"] * m["contact_hours_per_day"] * 3600 / 1e6
    comms_pct = 100 * gb_day / link_gb_day if link_gb_day else 0
    return_frac = min(1.0, link_gb_day / gb_day) if gb_day > 0 else 1.0

    tags = {t for i in ins for t in i["tags"]}
    req_ok = all(any(t in tags for t in grp) for grp in m["required"])
    sci_base = sum(i["science"].get(m["science_key"], 0) for i in ins)

    prop_needed = dry * (math.exp(m["delta_v_required"] / (b["isp_s"] * G0)) - 1)

    def res(id_, label, used, limit, unit, pct=None):
        pct = 100 * used / limit if pct is None else pct
        return dict(id=id_, label=label, used=round(used, 1), limit=round(limit, 1), unit=unit,
                    pct=round(pct, 1), status=status(pct))

    resources = [
        res("mass", "Mass", wet, cap, "kg"),
        res("power", "Power", load_w, gen_w, "W"),
        res("budget", "Budget", cost, m["budget_ceiling"], "$M"),
        res("data", "Data", gb_day, b["storage_gb"], "Gb/day vs recorder"),
        res("comms", "Comms", gb_day, link_gb_day, "Gb/day vs downlink"),
        res("time", "Time", dev_months, m["window_months"], "months to launch window"),
    ]
    viol = []
    if wet > cap: viol.append("mass")
    if cost > m["budget_ceiling"]: viol.append("budget")
    if dev_months > m["window_months"]: viol.append("time")
    if dv < m["delta_v_required"]: viol.append("delta_v")
    if load_w > gen_w: viol.append("power")
    if ops_avail < m["ops_months_required"]: viol.append("lifespan")
    if not req_ok: viol.append("required")
    return dict(
        mission=m["name"], resources=resources, violations=viol,
        metrics=dict(dry=round(dry, 1), wet=round(wet, 1), cap=cap, dv=round(dv), dv_req=m["delta_v_required"],
                     gen_w=round(gen_w), load_w=round(load_w), cost=cost, dev_cost=dev_cost,
                     dev_months=dev_months, window=m["window_months"], transit=transit, ops_avail=ops_avail,
                     ops_req=m["ops_months_required"], gb_day=round(gb_day, 2), link_gb_day=round(link_gb_day, 2),
                     comms_pct=round(comms_pct, 1), return_frac=round(return_frac, 3), sci_base=sci_base,
                     min_science=m["min_science"], req_ok=req_ok, prop_needed=round(prop_needed),
                     max_prop=b["max_prop_kg"], prop=prop, budget_ceiling=m["budget_ceiling"]),
        _ctx=dict(m=m, v=v, b=b, ins=ins),
    )


# --------------------------------------------------------------------------- random events
def run_event(eid: str, e: dict):
    M = e["metrics"]
    if eid == "solar_storm":
        g = M["gen_w"] * 0.75
        ok = g >= M["load_w"]
        return ok, "Solar Storm", f"Flare degrades arrays 25%: {g:.0f} W available vs {M['load_w']} W load.", 1.0 if ok else 0.7
    if eid == "dsn_congestion":
        cap2 = M["link_gb_day"] * 0.5
        ok = M["gb_day"] <= cap2
        return ok, "DSN Congestion", f"Contact time halves: {cap2:.2f} Gb/day downlink vs {M['gb_day']} Gb/day generated.", 1.0 if ok else max(0.3, cap2 / max(M["gb_day"], 1e-9))
    if eid == "thruster_anomaly":
        margin = M["dv"] - M["dv_req"]
        ok = margin >= 80
        return ok, "Thruster Anomaly", f"Correction burn needs 80 m/s extra; your delta-v margin is {margin} m/s.", 1.0 if ok else 0.5
    if eid == "cost_overrun":
        need = 0.12 * M["dev_cost"]
        left = M["budget_ceiling"] - M["cost"]
        ok = left >= need
        return ok, "Cost Overrun", f"Development runs 12% over (${need:.0f}M); you hold ${left:.0f}M reserve.", 1.0 if ok else 0.8
    slack = M["window"] - M["dev_months"]
    ok = slack >= 3
    return ok, "Launch Slip", f"Weather and range conflicts cost 3 months; you have {slack} months of schedule slack.", 1.0 if ok else 0.7


EVENT_IDS = ["solar_storm", "dsn_congestion", "thruster_anomaly", "cost_overrun", "launch_slip"]


# --------------------------------------------------------------------------- pedagogical debrief
def debrief(e: dict) -> list:
    M, x = e["metrics"], e["_ctx"]
    m, v, b = x["m"], x["v"], x["b"]
    out = []

    def add(phase, res, title, happened, physics, fix):
        out.append(dict(phase=phase, resource=res, title=title, what_happened=happened, physics=physics, fix=fix))

    ratio = math.exp(M["dv_req"] / (b["isp_s"] * G0))
    if "mass" in e["violations"]:
        add("Launch", "mass", f"{v['name']} cannot lift {M['wet']} kg to this destination",
            f"Capacity to {m['destination'].replace('_', ' ')} is {M['cap']} kg. Your wet mass is {M['wet']} kg.",
            "Launch capacity falls as target energy rises. Fuel for orbit insertion must itself be lifted, and the rocket equation "
            f"(dv = Isp x g0 x ln(m_wet/m_dry)) means every kg of dry mass needs ~{ratio - 1:.2f} kg of propellant here.",
            "Pick a larger rocket, drop a low-value instrument, or switch to a higher-Isp (electric) bus to cut propellant.")
    if "delta_v" in e["violations"]:
        add("Cruise", "delta_v", "Not enough propellant to capture into orbit",
            f"Delta-v achieved {M['dv']} m/s, required {M['dv_req']} m/s.",
            f"dv = {b['isp_s']} s x 9.81 x ln({M['wet']}/{M['dry']}) = {M['dv']} m/s. You need mass ratio {ratio:.2f}, "
            f"i.e. about {M['prop_needed']} kg of propellant (this bus carries at most {M['max_prop']} kg).",
            "Add propellant (if it fits the rocket), cut dry mass, or choose an engine with higher specific impulse.")
    if "power" in e["violations"]:
        add("Cruise/Ops", "power", "Brownout: spacecraft loads exceed solar array output",
            f"Arrays give {M['gen_w']} W, loads need {M['load_w']} W.",
            f"Solar flux scales as 1/r^2. Here arrays make {b['solar_w_1au']} W x {m['solar_factor']} = {M['gen_w']} W. "
            "In a brownout the craft enters safe mode and stops science.",
            "Use a bus with bigger arrays, or remove power-hungry instruments.")
    if "budget" in e["violations"]:
        add("Design", "budget", "Mission cancelled: over the cost ceiling",
            f"Total ${M['cost']}M vs ceiling ${M['budget_ceiling']}M.",
            "NASA missions are cost-capped. Launch vehicle cost scales steeply with capability, so oversizing the rocket is a budget trap.",
            "Pick the smallest rocket that fits, or fewer instruments.")
    if "time" in e["violations"]:
        add("Design", "time", "Missed the launch window",
            f"Development takes {M['dev_months']} months; the window closes in {M['window']}.",
            "Planets are only aligned for efficient transfers every synodic period (about 26 months for Mars). Missing a window means waiting years.",
            "Choose instruments with shorter development, or a simpler bus.")
    if "lifespan" in e["violations"]:
        add("Operations", "lifespan", "Spacecraft died before science was done",
            f"{M['ops_avail']} months of life remain after transit; {M['ops_req']} are required.",
            "Radiation, thermal cycling and consumables limit lifetime. Slow electric transfers spend part of the design life before arrival.",
            "Choose a longer-life bus, or a faster chemical transfer.")
    if "required" in e["violations"]:
        add("Operations", "science", "Wrong instruments for the science question",
            m["required_text"] + " Not satisfied.",
            "Instruments are chosen by what they can measure, not by how impressive they are. The science question drives the payload.",
            "Add the required instrument category.")
    if M["comms_pct"] > 100:
        add("Operations", "comms", "Data backlog: you cannot send home what you collect",
            f"Generated {M['gb_day']} Gb/day; downlink carries {M['link_gb_day']} Gb/day ({M['comms_pct']:.0f}% utilisation).",
            "Link rate falls with distance squared, and DSN contact time is shared. Excess data is overwritten on the recorder and lost, "
            f"so only {M['return_frac'] * 100:.0f}% of science returns.",
            "Use a higher-rate bus, or swap imagers (big data) for spectrometers (small data).")
    if M["gb_day"] > x["b"]["storage_gb"]:
        add("Operations", "data", "Onboard recorder overflow",
            f"{M['gb_day']} Gb/day exceeds the {x['b']['storage_gb']} Gb recorder.",
            "Data must be buffered between contacts; a small recorder overwrites data it cannot hold.",
            "Pick a bus with more storage or fewer high-rate instruments.")
    return out


# --------------------------------------------------------------------------- simulation
@app.post("/api/evaluate")
def api_evaluate(c: Config):
    e = evaluate(c)
    e.pop("_ctx")
    return e


@app.post("/api/simulate")
def api_simulate(c: Config):
    e = evaluate(c)
    M, viol = e["metrics"], e["violations"]
    seed = c.seed if c.seed is not None else random.randrange(1 << 30)
    rng = random.Random(seed)
    picks = rng.sample(EVENT_IDS, 2)

    stages = [
        dict(stage="Design review", ok=not {"budget", "time"} & set(viol)),
        dict(stage="Launch", ok="mass" not in viol),
        dict(stage="Cruise & arrival", ok=not {"delta_v", "power"} & set(viol)),
        dict(stage="Science operations", ok=not {"lifespan", "required"} & set(viol)),
    ]
    events, mult = [], 1.0
    pre_fail = bool({"mass", "budget", "time"} & set(viol))
    flight_fail = bool({"delta_v", "power", "lifespan"} & set(viol))
    if not pre_fail and not flight_fail:
        for eid in picks:
            ok, title, detail, mu = run_event(eid, e)
            events.append(dict(id=eid, title=title, survived=ok, detail=detail))
            mult *= mu

    sci = M["sci_base"] * M["return_frac"] * mult
    if pre_fail:
        outcome, score = "NOT LAUNCHED", 0
    elif flight_fail:
        outcome, score = "MISSION LOST", 0
    elif not M["req_ok"]:
        outcome, score = "SCIENCE FAILURE", 40
    else:
        survived = sum(1 for ev in events if ev["survived"])
        base = min(600, 600 * sci / (1.5 * M["min_science"]))
        eff = 150 * max(0, 1 - M["cost"] / M["budget_ceiling"])
        resil = 250 * survived / max(1, len(events))
        ok = sci >= M["min_science"]
        outcome = "SUCCESS" if ok else "PARTIAL SUCCESS"
        score = round((base + eff + resil) * (1 if ok else 0.5))
    grade = "A" if score >= 800 else "B" if score >= 650 else "C" if score >= 450 else "D" if score >= 200 else "F"

    items = debrief(e)
    for ev in events:
        if not ev["survived"]:
            items.append(dict(phase="Operations", resource="events", title=f"{ev['title']} hurt the mission",
                              what_happened=ev["detail"],
                              physics="Real missions carry engineering margin (often 20-30%) precisely because unplanned events happen.",
                              fix="Keep 20-30% margin on power, comms, delta-v, budget and schedule."))
    if outcome == "SUCCESS" and not items:
        items.append(dict(phase="Operations", resource="all", title="Clean mission: margins absorbed every surprise",
                          what_happened="All six resources stayed within limits.",
                          physics="Margin is the engineer's insurance policy.",
                          fix="Try a cheaper rocket or higher science for a better score."))

    e.pop("_ctx")
    result = dict(e, outcome=outcome, score=score, grade=grade, science_points=round(sci),
                  stages=stages, events=events, debrief=items, seed=seed)
    if c.player:
        with db() as con:
            con.execute("INSERT INTO runs(ts,player,mission,score,outcome) VALUES(?,?,?,?,?)",
                        (time.time(), c.player[:24], c.mission_id, score, outcome))
    return result


@app.get("/api/data")
def api_data():
    return DATA


@app.get("/api/leaderboard")
def api_leaderboard(mission_id: Optional[str] = None):
    q = "SELECT player,mission,score,outcome FROM runs"
    args = ()
    if mission_id:
        q += " WHERE mission=?"
        args = (mission_id,)
    with db() as con:
        rows = con.execute(q + " ORDER BY score DESC LIMIT 10", args).fetchall()
    return [dict(player=r[0], mission=r[1], score=r[2], outcome=r[3]) for r in rows]


# Serve the built React app from the same URL (single deploy = one live link).
DIST = ROOT / "frontend" / "dist"
if DIST.exists():
    app.mount("/", StaticFiles(directory=DIST, html=True), name="web")

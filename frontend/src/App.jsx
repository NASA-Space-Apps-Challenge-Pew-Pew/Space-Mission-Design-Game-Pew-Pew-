import React, { useEffect, useMemo, useRef, useState } from "react";
import Hud from "./components/hud/Hud.jsx";
import Builder from "./components/builder/Builder.jsx";
import Debrief from "./components/debrief/Debrief.jsx";
import LaunchSequence from "./components/launch/LaunchSequence.jsx";

const API = import.meta.env.VITE_API || "";
const post = (path, body) =>
  fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then((r) => {
    if (!r.ok) throw new Error(r.statusText);
    return r.json();
  });

export default function App() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [mid, setMid] = useState("artemis_ice");
  const [sel, setSel] = useState({
    vehicle: "falcon9",
    bus: "smallsat",
    instruments: [],
    prop: 0,
  });
  const [ev, setEv] = useState(null);
  const [simData, setSimData] = useState(null);
  const [isLaunching, setIsLaunching] = useState(false);
  const [res, setRes] = useState(null);
  const [board, setBoard] = useState([]);
  const [player, setPlayer] = useState("");
  const [busy, setBusy] = useState(false);
  const timer = useRef();

  useEffect(() => {
    fetch(`${API}/api/data`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load mission data");
        return r.json();
      })
      .then(setData)
      .catch(() =>
        setErr("Cannot reach the simulation server. Start the backend on port 8000.")
      );
  }, []);

  const mission = useMemo(() => data?.missions.find((m) => m.id === mid), [data, mid]);
  const bus = useMemo(() => data?.buses.find((b) => b.id === sel.bus), [data, sel.bus]);
  const cfg = {
    mission_id: mid,
    vehicle_id: sel.vehicle,
    bus_id: sel.bus,
    instrument_ids: sel.instruments,
    propellant_kg: sel.prop,
  };

  // Live telemetry: debounce so slider drags don't flood the API
  useEffect(() => {
    if (!data) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(
      () =>
        post("/api/evaluate", cfg)
          .then(setEv)
          .catch(() => setErr("Lost connection to the simulation server.")),
      120
    );
    return () => clearTimeout(timer.current);
  }, [data, mid, sel]); // eslint-disable-line

  const pickMission = (id) => {
    setMid(id);
    setSel({ vehicle: "falcon9", bus: "smallsat", instruments: [], prop: 0 });
    setRes(null);
    setSimData(null);
  };

  const launch = async () => {
    setBusy(true);
    setRes(null);
    try {
      const r = await post("/api/simulate", { ...cfg, player: player.trim() || null });
      setSimData(r);
      setIsLaunching(true);
      fetch(`${API}/api/leaderboard?mission_id=${mid}`)
        .then((x) => x.json())
        .then(setBoard)
        .catch(() => {});
    } catch {
      setErr("Simulation failed. Check the backend.");
    }
    setBusy(false);
  };

  const handleLaunchComplete = () => {
    setIsLaunching(false);
    setRes(simData);
  };

  if (err)
    return (
      <div className="mx-auto max-w-xl p-8 mt-12 text-center bg-red-950/40 border border-red-700/60 rounded-xl">
        <h2 className="text-xl font-bold text-red-300 mb-2">Connection Error</h2>
        <p className="text-sm text-red-200">{err}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-800 hover:bg-red-700 text-white text-xs font-semibold rounded-md"
        >
          Retry Connection
        </button>
      </div>
    );

  if (!data || !mission || !bus)
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-slate-300">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-cyan-400 border-r-transparent"></div>
          <div className="mt-3 text-sm font-semibold tracking-wider text-cyan-300">
            CONNECTING TO MISSION CONTROL TELEMETRY…
          </div>
        </div>
      </div>
    );

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-6 font-sans">
      <header className="mb-6 border-b border-slate-700 pb-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-50 flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full bg-cyan-400 animate-ping"></span>
              PEW PEW: Space Mission Design Game
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-1">
              NASA Space Apps Challenge 2026 · Systems Engineering Trade-Off Simulator
            </p>
          </div>
          <div className="text-xs text-slate-400 font-mono border border-slate-800 rounded px-2.5 py-1 bg-slate-900/80">
            HUB: ILIGAN CITY
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {data.missions.map((m) => (
            <button
              key={m.id}
              onClick={() => pickMission(m.id)}
              aria-pressed={m.id === mid}
              className={`rounded-md border px-3 py-2 text-left text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
                m.id === mid
                  ? "border-cyan-300 bg-cyan-950/40 text-cyan-100"
                  : "border-slate-700 bg-slate-900/40 text-slate-300 hover:border-slate-500"
              }`}
            >
              <div className="font-semibold">{m.name}</div>
              <div className="text-xs text-slate-400">{m.tagline}</div>
            </button>
          ))}
        </div>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300 bg-slate-900/40 border border-slate-800/80 p-3 rounded-md">
          {mission.brief}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <main>
          <Builder
            data={data}
            mission={mission}
            sel={sel}
            setSel={setSel}
            bus={bus}
          />
        </main>

        <aside className="lg:sticky lg:top-4 lg:self-start space-y-4">
          <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
            <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase text-slate-300 flex justify-between items-center">
              <span>Live Resource Gauges</span>
              <span className="text-[10px] text-cyan-400 font-mono">REAL-TIME TELEMETRY</span>
            </h2>
            <Hud ev={ev} tips={data.tooltips} />
            <div className="mt-5 flex gap-2 pt-2 border-t border-slate-800">
              <input
                value={player}
                onChange={(e) => setPlayer(e.target.value)}
                maxLength={24}
                placeholder="Engineer callsign (optional)"
                aria-label="Your name for the leaderboard"
                className="min-w-0 flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
              <button
                onClick={launch}
                disabled={busy || isLaunching}
                className="rounded-md bg-gradient-to-r from-cyan-400 to-teal-400 px-5 py-2 font-bold text-slate-950 transition hover:from-cyan-300 hover:to-teal-300 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                {busy ? "Calculating…" : isLaunching ? "Simulating…" : "Launch Mission"}
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Screen 4: Animated Launch Sequence Overlay */}
      {isLaunching && simData && (
        <LaunchSequence
          res={simData}
          onComplete={handleLaunchComplete}
        />
      )}

      {/* Screen 5: Post-Mission Diagnostic Debrief Modal */}
      {res && (
        <Debrief
          res={res}
          board={board}
          onClose={() => setRes(null)}
          onRetry={launch}
        />
      )}
    </div>
  );
}

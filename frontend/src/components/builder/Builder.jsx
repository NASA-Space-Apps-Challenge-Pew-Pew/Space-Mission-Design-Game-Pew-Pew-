import React from "react";
import Choice from "./Choice.jsx";
import { COLORS } from "../hud/Gauge.jsx";

export default function Builder({ data, mission, sel, setSel, bus }) {
  const key = mission.science_key;
  const toggle = (id) =>
    setSel((s) => ({
      ...s,
      instruments: s.instruments.includes(id)
        ? s.instruments.filter((i) => i !== id)
        : [...s.instruments, id],
    }));

  const insts = [...data.instruments].sort(
    (a, b) => (b.science[key] || 0) - (a.science[key] || 0)
  );

  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-2 text-sm font-semibold tracking-wide text-slate-300 uppercase">
          1. Launch vehicle
        </h3>
        <div className="grid gap-2.5">
          {data.vehicles.map((v) => (
            <Choice
              key={v.id}
              active={sel.vehicle === v.id}
              onClick={() => setSel((s) => ({ ...s, vehicle: v.id }))}
              title={v.name}
              sub={`${v.provider} · lifts ${v.payload_kg[mission.destination].toLocaleString()} kg here · $${v.cost}M`}
            />
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold tracking-wide text-slate-300 uppercase">
          2. Spacecraft bus
        </h3>
        <div className="grid gap-2.5">
          {data.buses.map((b) => (
            <Choice
              key={b.id}
              active={sel.bus === b.id}
              onClick={() =>
                setSel((s) => ({
                  ...s,
                  bus: b.id,
                  prop: Math.min(s.prop, b.max_prop_kg),
                }))
              }
              title={b.name}
              sub={`${b.analog} · ${b.dry_mass_kg} kg dry · ${b.propulsion} · Isp ${b.isp_s}s · $${b.cost}M`}
            />
          ))}
        </div>
        <div className="mt-4 p-3 rounded-lg border border-slate-800 bg-slate-900/50">
          <label className="block text-sm text-slate-300">
            Propellant Load: <span className="num font-bold text-cyan-300">{sel.prop} kg</span>{" "}
            <span className="text-xs text-slate-500">(Max: {bus.max_prop_kg} kg)</span>
            <input
              type="range"
              min="0"
              max={bus.max_prop_kg}
              step="10"
              value={sel.prop}
              onChange={(e) => setSel((s) => ({ ...s, prop: +e.target.value }))}
              className="mt-2 w-full accent-cyan-400 cursor-pointer"
            />
          </label>
        </div>
      </section>

      <section>
        <div className="flex items-baseline justify-between mb-1">
          <h3 className="text-sm font-semibold tracking-wide text-slate-300 uppercase">
            3. Scientific Instruments
          </h3>
          <span className="text-xs font-mono text-cyan-400">
            Selected: {sel.instruments.length}
          </span>
        </div>
        <p className="mb-3 text-xs text-slate-400 bg-slate-900/60 border border-slate-800 p-2 rounded">
          <span className="font-semibold text-slate-300">Mission Requirement:</span> {mission.required_text}
        </p>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {insts.map((i) => {
            const sc = i.science[key] || 0;
            const isSelected = sel.instruments.includes(i.id);
            return (
              <Choice
                key={i.id}
                active={isSelected}
                onClick={() => toggle(i.id)}
                title={i.name}
                sub={i.blurb}
              >
                {/* Stat-delta chips */}
                <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-mono">
                  <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                    +{i.mass_kg}kg
                  </span>
                  <span className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300">
                    +{i.power_w}W
                  </span>
                  <span className="bg-slate-800 px-1.5 py-0.5 rounded text-emerald-300">
                    +${i.cost}M
                  </span>
                  <span className="bg-slate-800 px-1.5 py-0.5 rounded text-blue-300">
                    {i.data_kbps}kbps
                  </span>
                </div>
                <div
                  className="mt-2 text-xs font-semibold"
                  style={{ color: sc ? COLORS.ok : COLORS.warn }}
                >
                  {sc ? `★ +${sc} science points` : "0 science points for this mission"}
                </div>
              </Choice>
            );
          })}
        </div>
      </section>
    </div>
  );
}

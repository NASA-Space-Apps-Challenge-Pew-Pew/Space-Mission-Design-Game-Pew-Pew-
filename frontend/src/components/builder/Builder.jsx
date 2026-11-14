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
    <div className="space-y-5">
      <section>
        <h3 className="mb-2 text-sm font-semibold text-slate-300">1. Launch vehicle</h3>
        <div className="grid gap-2">
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
        <h3 className="mb-2 text-sm font-semibold text-slate-300">2. Spacecraft bus</h3>
        <div className="grid gap-2">
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
        <label className="mt-3 block text-sm text-slate-300">
          Propellant: <span className="num font-semibold">{sel.prop} kg</span>
          <input
            type="range"
            min="0"
            max={bus.max_prop_kg}
            step="10"
            value={sel.prop}
            onChange={(e) => setSel((s) => ({ ...s, prop: +e.target.value }))}
            className="mt-1 w-full accent-cyan-300"
          />
        </label>
      </section>

      <section>
        <h3 className="mb-1 text-sm font-semibold text-slate-300">3. Instruments</h3>
        <p className="mb-2 text-xs text-slate-400">Goal: {mission.required_text}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {insts.map((i) => {
            const sc = i.science[key] || 0;
            return (
              <Choice
                key={i.id}
                active={sel.instruments.includes(i.id)}
                onClick={() => toggle(i.id)}
                title={i.name}
                sub={i.blurb}
              >
                <div className="num mt-1.5 text-xs text-slate-300">
                  {i.mass_kg} kg · {i.power_w} W · ${i.cost}M · {i.data_kbps} kbps
                </div>
                <div className="text-xs" style={{ color: sc ? COLORS.ok : COLORS.warn }}>
                  {sc ? `${sc} science points here` : "No science value for this mission"}
                </div>
              </Choice>
            );
          })}
        </div>
      </section>
    </div>
  );
}

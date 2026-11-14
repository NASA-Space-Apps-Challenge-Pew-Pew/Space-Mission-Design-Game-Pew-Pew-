import React from "react";
import Gauge, { COLORS } from "./Gauge.jsx";

export default function Hud({ ev, tips }) {
  if (!ev) return <div className="text-sm text-slate-400">Loading telemetry…</div>;
  const M = ev.metrics;
  const dvOk = M.dv >= M.dv_req;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {ev.resources.map((r) => (
          <Gauge key={r.id} r={r} tip={tips?.[r.id]} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-md border border-slate-700/70 bg-slate-900/60 p-3">
          <div className="text-slate-400">Delta-v</div>
          <div className="num font-semibold" style={{ color: dvOk ? COLORS.ok : COLORS.fail }}>
            {M.dv} / {M.dv_req} m/s
          </div>
        </div>
        <div className="rounded-md border border-slate-700/70 bg-slate-900/60 p-3">
          <div className="text-slate-400">Science points</div>
          <div
            className="num font-semibold"
            style={{ color: M.sci_base >= M.min_science ? COLORS.ok : COLORS.warn }}
          >
            {Math.round(M.sci_base * M.return_frac)} / {M.min_science}
          </div>
        </div>
      </div>
      {ev.violations.length > 0 && (
        <div className="rounded-md border border-red-500/40 bg-red-950/40 p-3 text-sm text-red-200">
          Blocking issues: {ev.violations.map((v) => v.replace("_", " ")).join(", ")}
        </div>
      )}
    </div>
  );
}

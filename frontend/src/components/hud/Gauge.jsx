import React from "react";

export const COLORS = { ok: "#4cc9b0", warn: "#f2b84b", fail: "#ef5b5b" };

export default function Gauge({ r, tip }) {
  const w = Math.min(100, r.pct);
  return (
    <div className="rounded-md border border-slate-700/70 bg-slate-900/60 p-3" title={tip}>
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold text-slate-200">{r.label}</span>
        <span className="num text-sm font-semibold" style={{ color: COLORS[r.status] }}>
          {r.pct.toFixed(0)}%{r.status === "fail" && " over limit"}
        </span>
      </div>
      <div
        className="mt-2 h-2.5 w-full overflow-hidden rounded-sm bg-slate-800"
        role="progressbar"
        aria-valuenow={Math.round(r.pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={r.label}
      >
        <div
          className="h-full transition-all duration-300"
          style={{ width: `${w}%`, background: COLORS[r.status] }}
        />
      </div>
      <div className="num mt-1.5 text-xs text-slate-400">
        {r.used} / {r.limit} {r.unit}
      </div>
    </div>
  );
}

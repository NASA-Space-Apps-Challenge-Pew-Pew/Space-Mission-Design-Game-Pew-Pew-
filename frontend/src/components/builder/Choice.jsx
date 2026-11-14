import React from "react";

export default function Choice({ active, onClick, title, sub, children }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`w-full rounded-md border p-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
        active
          ? "border-cyan-300 bg-cyan-950/40"
          : "border-slate-700 bg-slate-900/50 hover:border-slate-500"
      }`}
    >
      <div className="text-sm font-semibold text-slate-100">{title}</div>
      {sub && <div className="text-xs text-slate-400">{sub}</div>}
      {children}
    </button>
  );
}

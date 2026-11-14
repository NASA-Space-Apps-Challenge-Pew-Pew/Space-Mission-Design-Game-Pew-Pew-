import React from "react";
import { COLORS } from "../hud/Gauge.jsx";

export default function Debrief({ res, onClose, onRetry, board }) {
  const good = res.outcome === "SUCCESS";

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Mission debrief"
    >
      <div className="my-6 w-full max-w-3xl rounded-lg border border-slate-600 bg-slate-950 p-5 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div
              className="text-2xl font-bold tracking-wide"
              style={{ color: good ? COLORS.ok : res.score > 0 ? COLORS.warn : COLORS.fail }}
            >
              {res.outcome}
            </div>
            <div className="text-sm text-slate-400">{res.mission}</div>
          </div>
          <div className="text-right">
            <div className="num text-3xl font-bold">{res.score}</div>
            <div className="text-sm text-slate-400">
              Grade {res.grade} · {res.science_points} science pts
            </div>
          </div>
        </div>

        <ol className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {res.stages.map((s) => (
            <li
              key={s.stage}
              className="rounded border p-2 text-xs"
              style={{
                borderColor: s.ok ? COLORS.ok : COLORS.fail,
                color: s.ok ? COLORS.ok : COLORS.fail,
              }}
            >
              {s.ok ? "✓ Passed" : "✗ Failed"}: {s.stage}
            </li>
          ))}
        </ol>

        {res.events.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-slate-300">Mid-mission events</h3>
            {res.events.map((e) => (
              <p
                key={e.id}
                className="mt-1 text-sm"
                style={{ color: e.survived ? COLORS.ok : COLORS.warn }}
              >
                {e.survived ? "✓ Survived" : "⚠ Hurt"}: {e.title}.{" "}
                <span className="text-slate-400">{e.detail}</span>
              </p>
            ))}
          </div>
        )}

        <h3 className="mt-5 text-lg font-semibold text-slate-100">
          Engineering debrief: why it happened
        </h3>
        <div className="mt-2 space-y-3">
          {res.debrief.map((d, i) => (
            <article key={i} className="rounded-md border border-slate-700 bg-slate-900/60 p-3">
              <h4 className="font-semibold text-slate-100">{d.title}</h4>
              <p className="mt-1 text-sm text-slate-300">{d.what_happened}</p>
              <p className="mt-2 text-sm text-cyan-200">
                <b>The physics:</b> {d.physics}
              </p>
              <p className="mt-2 text-sm text-amber-200">
                <b>Try this:</b> {d.fix}
              </p>
            </article>
          ))}
        </div>

        {board && board.length > 0 && (
          <div className="mt-5">
            <h3 className="text-sm font-semibold text-slate-300">Top engineers</h3>
            <ul className="num mt-1 text-sm text-slate-300 space-y-1">
              {board.slice(0, 5).map((b, i) => (
                <li key={i} className="flex justify-between border-b border-slate-800/80 py-1">
                  <span>
                    {i + 1}. {b.player}
                  </span>
                  <span className="text-cyan-300 font-medium">
                    {b.score} pts ({b.outcome})
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={onRetry}
            className="rounded-md bg-cyan-300 px-4 py-2 font-semibold text-slate-950 hover:bg-cyan-200 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Run again with a new random seed
          </button>
          <button
            onClick={onClose}
            className="rounded-md border border-slate-500 px-4 py-2 text-slate-200 hover:bg-slate-800 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Back to design
          </button>
        </div>
      </div>
    </div>
  );
}

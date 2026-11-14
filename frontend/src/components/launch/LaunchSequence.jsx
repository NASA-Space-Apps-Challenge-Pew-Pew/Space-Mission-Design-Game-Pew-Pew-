import React, { useEffect, useState } from "react";
import { COLORS } from "../hud/Gauge.jsx";

export default function LaunchSequence({ res, onComplete }) {
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [visibleEvents, setVisibleEvents] = useState([]);
  const [clock, setClock] = useState(0);

  const stages = res?.stages || [];
  const events = res?.events || [];

  useEffect(() => {
    // Clock counter
    const clockTimer = setInterval(() => {
      setClock((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(clockTimer);
  }, []);

  useEffect(() => {
    if (!stages.length) return;

    // Advance stages sequentially
    const stageTimer = setInterval(() => {
      setCurrentStageIdx((prev) => {
        // If the current stage failed, stop progressing further
        if (stages[prev] && !stages[prev].ok) {
          clearInterval(stageTimer);
          setTimeout(onComplete, 2000);
          return prev;
        }

        if (prev < stages.length - 1) {
          const nextIdx = prev + 1;
          // Reveal mid-mission events at Stage 2 (Cruise) or 3 (Ops)
          if (nextIdx >= 2 && visibleEvents.length < events.length) {
            setVisibleEvents(events);
          }
          return nextIdx;
        } else {
          // Finished all stages
          clearInterval(stageTimer);
          setTimeout(onComplete, 1600);
          return prev;
        }
      });
    }, 1100);

    return () => clearInterval(stageTimer);
  }, [stages, events, onComplete, visibleEvents.length]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md font-mono"
      role="dialog"
      aria-modal="true"
      aria-label="Mission Launch Simulation"
    >
      <div className="w-full max-w-2xl rounded-xl border border-cyan-800 bg-slate-950 p-6 shadow-2xl text-slate-100">
        {/* Header with ticking clock */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
            <span className="text-sm font-bold tracking-widest text-cyan-400 uppercase">
              ORBITAL INSERTION FLIGHT TELEMETRY
            </span>
          </div>
          <div className="bg-slate-900 border border-slate-700 px-3 py-1 rounded text-xs text-cyan-300 font-mono">
            MISSION CLOCK: T+{String(clock).padStart(2, "0")}s
          </div>
        </div>

        {/* Mission Name */}
        <div className="mb-6">
          <div className="text-xs text-slate-400 uppercase tracking-wider">TARGET DESTINATION</div>
          <div className="text-xl font-bold text-white tracking-wide">{res.mission}</div>
        </div>

        {/* 4 Flight Stages */}
        <div className="space-y-3 mb-6">
          {stages.map((stg, idx) => {
            const isPassed = idx < currentStageIdx || (idx === currentStageIdx && stg.ok && currentStageIdx === stages.length - 1);
            const isCurrent = idx === currentStageIdx;
            const isFailed = isCurrent && !stg.ok;
            const isPending = idx > currentStageIdx;

            return (
              <div
                key={stg.stage}
                className={`flex items-center justify-between p-3.5 rounded-lg border transition-all duration-300 ${
                  isFailed
                    ? "border-red-500 bg-red-950/40 text-red-200"
                    : isPassed
                    ? "border-teal-500/70 bg-teal-950/20 text-teal-300"
                    : isCurrent
                    ? "border-cyan-400 bg-cyan-950/40 text-cyan-200 shadow-lg shadow-cyan-950"
                    : "border-slate-800 bg-slate-900/30 text-slate-500"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold w-6">0{idx + 1}</span>
                  <span className="text-sm font-semibold">{stg.stage}</span>
                </div>
                <div className="text-xs font-bold">
                  {isFailed ? (
                    <span className="text-red-400 tracking-wider">✗ CRITICAL FAILURE</span>
                  ) : isPassed ? (
                    <span className="text-teal-400 tracking-wider">✓ STAGE NOMINAL</span>
                  ) : isCurrent ? (
                    <span className="text-cyan-300 animate-pulse tracking-wider">IN PROGRESS…</span>
                  ) : (
                    <span className="text-slate-600">STANDBY</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Hazard Pop-in Banner */}
        {visibleEvents.length > 0 && (
          <div className="border border-amber-600/60 bg-amber-950/30 p-3.5 rounded-lg mb-4 text-xs text-amber-200 animate-fade-in">
            <div className="font-bold flex items-center gap-2 mb-1 text-amber-300 tracking-wide">
              <span>⚠ IN-FLIGHT SPACE HAZARDS DETECTED</span>
            </div>
            {visibleEvents.map((ev) => (
              <div key={ev.id} className="mt-1 flex items-baseline justify-between">
                <span>{ev.title}:</span>
                <span className="text-slate-300 ml-2">{ev.detail}</span>
              </div>
            ))}
          </div>
        )}

        {/* Skip button for quick playtesting */}
        <div className="text-right pt-2 border-t border-slate-900">
          <button
            onClick={onComplete}
            className="text-xs text-slate-500 hover:text-slate-300 transition underline underline-offset-4"
          >
            Skip to Post-Mission Analysis →
          </button>
        </div>
      </div>
    </div>
  );
}

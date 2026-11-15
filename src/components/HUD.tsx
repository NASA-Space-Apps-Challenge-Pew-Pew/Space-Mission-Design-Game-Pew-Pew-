import React, { useState } from 'react';
import {
  GameState,
  Stage
} from '../game/types';
import {
  Fuel,
  Wind,
  Zap,
  Shield,
  CircleDollarSign,
  Package,
  Calendar,
  Compass,
  AlertTriangle,
  Settings,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface HUDProps {
  state: GameState;
  onOpenSettings: () => void;
}

export function HUD({ state, onOpenSettings }: HUDProps) {
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const { resources, ship, stage, day, totalTripDays, objective, activeEvents } = state;

  const stageLabels: Record<Stage, { name: string; color: string }> = {
    design: { name: 'STAGE 1: DESIGN', color: 'text-cyan-400 border-cyan-500/40 bg-cyan-950/40' },
    launch: { name: 'STAGE 2: LAUNCH', color: 'text-amber-400 border-amber-500/40 bg-amber-950/40' },
    transit: { name: 'STAGE 3: TRANSIT', color: 'text-indigo-400 border-indigo-500/40 bg-indigo-950/40' },
    arrival: { name: 'STAGE 4: ARRIVAL', color: 'text-orange-400 border-orange-500/40 bg-orange-950/40' },
    surface: { name: 'STAGE 5: SURFACE', color: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40' },
    ended: { name: 'MISSION COMPLETE', color: 'text-purple-400 border-purple-500/40 bg-purple-950/40' },
  };

  const getMetricColor = (val: number, warnThreshold = 30, critThreshold = 15) => {
    if (val <= critThreshold) return 'text-rose-400 bg-rose-500';
    if (val <= warnThreshold) return 'text-amber-400 bg-amber-500';
    return 'text-cyan-400 bg-cyan-400';
  };

  return (
    <header className="w-full pointer-events-auto">
      {/* Top Banner Navigation & Stage Info */}
      <div className="bg-space-900/90 backdrop-blur-md border-b border-slate-800 px-3 sm:px-6 py-2 flex items-center justify-between shadow-md">
        {/* Left: Mission Identity & Stage Badge */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping-slow" />
            <h1 className="font-bold tracking-wider text-xs sm:text-sm text-slate-100 font-mono">
              ARES-V <span className="text-cyan-400 hidden sm:inline">| DEAR NOVA</span>
            </h1>
          </div>

          <span
            className={`text-[10px] sm:text-xs font-mono font-bold px-2 py-0.5 rounded border ${stageLabels[stage].color}`}
          >
            {stageLabels[stage].name}
          </span>
        </div>

        {/* Center: Mission Progress Bar & Day */}
        <div className="hidden md:flex items-center gap-3 w-72 lg:w-96">
          <Calendar size={13} className="text-slate-400 flex-shrink-0" />
          <span className="text-xs font-mono text-slate-300 whitespace-nowrap">
            Day {day} / {totalTripDays}
          </span>
          <div className="flex-1 bg-space-950 h-2 rounded-full overflow-hidden border border-slate-700/60 relative">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-sky-400 to-teal-300 transition-all duration-500 rounded-full"
              style={{ width: `${Math.min(100, Math.max(0, ship.progress))}%` }}
            />
          </div>
          <span className="text-xs font-mono text-cyan-400 font-semibold w-9 text-right">
            {Math.round(ship.progress)}%
          </span>
        </div>

        {/* Right: Active Hazards & Settings */}
        <div className="flex items-center gap-2">
          {activeEvents.length > 0 && (
            <div className="flex items-center gap-1 bg-rose-950/60 border border-rose-500/50 px-2 py-0.5 rounded text-[10px] text-rose-300 font-mono animate-pulse">
              <AlertTriangle size={12} />
              <span className="hidden sm:inline">HAZARD:</span> {activeEvents[0].replace('_', ' ')}
            </div>
          )}

          {/* Mobile resource toggle button */}
          <button
            onClick={() => setMobileExpanded(!mobileExpanded)}
            className="md:hidden flex items-center gap-1 text-[11px] font-mono text-slate-300 bg-space-800 px-2 py-1 rounded border border-slate-700"
          >
            <span>Telemetry</span>
            {mobileExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          {/* Settings gear */}
          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-lg bg-space-800/80 hover:bg-space-700 text-slate-300 hover:text-cyan-400 border border-slate-700 transition-colors"
            title="Mission Settings & Scare Level"
          >
            <Settings size={15} />
          </button>
        </div>
      </div>

      {/* Objective Ribbon */}
      <div className="bg-space-950/85 backdrop-blur-sm border-b border-cyan-900/30 px-3 sm:px-6 py-1.5 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2 text-slate-300 overflow-hidden text-ellipsis whitespace-nowrap">
          <Compass size={13} className="text-cyan-400 flex-shrink-0" />
          <span className="text-slate-400 text-[10px] sm:text-xs">OBJECTIVE:</span>
          <span className="text-cyan-300 font-medium truncate">{objective.text}</span>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-400">
          <span>Target: Jezero Crater, Mars</span>
          <span>Location: {ship.location}</span>
        </div>
      </div>

      {/* Telemetry Gauge Grid (Always visible on desktop, expandable on mobile) */}
      <div
        className={`${
          mobileExpanded ? 'flex' : 'hidden md:flex'
        } bg-space-900/75 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-6 py-2 flex-wrap items-center justify-between gap-3 text-xs font-mono transition-all`}
      >
        {/* Fuel Gauge */}
        <div className="flex items-center gap-2 min-w-[120px] flex-1">
          <Fuel size={14} className={getMetricColor((resources.fuelKg / resources.fuelMaxKg) * 100).split(' ')[0]} />
          <div className="flex-1">
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>FUEL</span>
              <span className="font-semibold text-slate-200">{resources.fuelKg} kg</span>
            </div>
            <div className="w-full bg-space-950 h-1.5 rounded-full overflow-hidden border border-slate-700/50 mt-0.5">
              <div
                className={`h-full ${getMetricColor((resources.fuelKg / resources.fuelMaxKg) * 100).split(' ')[1]}`}
                style={{ width: `${Math.min(100, (resources.fuelKg / resources.fuelMaxKg) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Oxygen Gauge */}
        <div className="flex items-center gap-2 min-w-[110px] flex-1">
          <Wind size={14} className={getMetricColor(resources.oxygenPct).split(' ')[0]} />
          <div className="flex-1">
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>OXYGEN</span>
              <span className="font-semibold text-slate-200">{resources.oxygenPct}%</span>
            </div>
            <div className="w-full bg-space-950 h-1.5 rounded-full overflow-hidden border border-slate-700/50 mt-0.5">
              <div
                className={`h-full ${getMetricColor(resources.oxygenPct).split(' ')[1]}`}
                style={{ width: `${Math.min(100, resources.oxygenPct)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Power Gauge */}
        <div className="flex items-center gap-2 min-w-[110px] flex-1">
          <Zap size={14} className={getMetricColor(resources.powerPct).split(' ')[0]} />
          <div className="flex-1">
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>POWER</span>
              <span className="font-semibold text-slate-200">{resources.powerPct}%</span>
            </div>
            <div className="w-full bg-space-950 h-1.5 rounded-full overflow-hidden border border-slate-700/50 mt-0.5">
              <div
                className={`h-full ${getMetricColor(resources.powerPct).split(' ')[1]}`}
                style={{ width: `${Math.min(100, resources.powerPct)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Hull Gauge */}
        <div className="flex items-center gap-2 min-w-[110px] flex-1">
          <Shield size={14} className={getMetricColor(resources.hullPct).split(' ')[0]} />
          <div className="flex-1">
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>HULL</span>
              <span className="font-semibold text-slate-200">{resources.hullPct}%</span>
            </div>
            <div className="w-full bg-space-950 h-1.5 rounded-full overflow-hidden border border-slate-700/50 mt-0.5">
              <div
                className={`h-full ${getMetricColor(resources.hullPct).split(' ')[1]}`}
                style={{ width: `${Math.min(100, resources.hullPct)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Budget */}
        <div className="flex items-center gap-2 min-w-[105px] flex-1">
          <CircleDollarSign size={14} className="text-emerald-400" />
          <div className="flex-1">
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>BUDGET</span>
              <span className="font-semibold text-emerald-300">${resources.budgetM}M</span>
            </div>
            <div className="text-[9px] text-slate-500 truncate">Payload: {ship.payloadKg}kg</div>
          </div>
        </div>

        {/* Rations / Supplies */}
        <div className="flex items-center gap-2 min-w-[105px] flex-1">
          <Package size={14} className="text-purple-400" />
          <div className="flex-1">
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>RATIONS</span>
              <span className="font-semibold text-purple-300">{resources.supplyDays}d</span>
            </div>
            <div className="text-[9px] text-slate-500">Trip: {day}/{totalTripDays}d</div>
          </div>
        </div>
      </div>
    </header>
  );
}

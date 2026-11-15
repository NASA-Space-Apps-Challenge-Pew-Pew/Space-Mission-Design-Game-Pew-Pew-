import React from 'react';
import { GameState, Stage } from '../game/types';
import { Rocket, Trophy, AlertTriangle, CheckCircle, RotateCcw, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

interface StageOverlayProps {
  state: GameState;
  onSendCommand: (cmd: string) => void;
  onReset: () => void;
}

export function StageSpecificOverlay({ state, onSendCommand, onReset }: StageOverlayProps) {
  const { stage, status, lossReason, ship, resources, nova } = state;

  // Trigger confetti upon winning
  React.useEffect(() => {
    if (status === 'won') {
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#38bdf8', '#c084fc', '#f59e0b', '#10b981'],
        });
      } catch {
        // ignore
      }
    }
  }, [status]);

  // If game is WON
  if (status === 'won') {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md pointer-events-auto">
        <div className="w-full max-w-lg bg-space-900 border-2 border-emerald-500/80 rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-[0_0_50px_rgba(16,185,129,0.4)] font-mono text-slate-100 animate-in fade-in zoom-in-95 duration-500">
          <div className="w-16 h-16 rounded-full bg-emerald-950 border border-emerald-500 flex items-center justify-center mx-auto text-emerald-400">
            <Trophy size={32} />
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-wider text-emerald-400">
              MISSION ACCOMPLISHED!
            </h2>
            <p className="text-sm text-slate-300 mt-2">
              Commander, the Ares-V has landed at Jezero Crater and confirmed organic science data has been received by Earth ground control!
            </p>
          </div>

          {/* Mission Score Summary */}
          <div className="grid grid-cols-3 gap-2 bg-space-950/80 p-4 rounded-2xl border border-slate-800 text-xs">
            <div>
              <div className="text-slate-400 text-[10px]">PAYLOAD SCI</div>
              <div className="text-base font-bold text-cyan-300">{ship.payloadKg} kg</div>
            </div>
            <div>
              <div className="text-slate-400 text-[10px]">REMAINING FUEL</div>
              <div className="text-base font-bold text-amber-300">{resources.fuelKg} kg</div>
            </div>
            <div>
              <div className="text-slate-400 text-[10px]">FINAL TRUST</div>
              <div className="text-base font-bold text-purple-300">{nova.trust}% ({nova.mood})</div>
            </div>
          </div>

          <button
            onClick={onReset}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-space-950 font-bold hover:brightness-110 shadow-lg transition-all active:scale-95 text-sm"
          >
            <RotateCcw size={16} />
            <span>PLAY AGAIN / NEW MISSION</span>
          </button>
        </div>
      </div>
    );
  }

  // If game is LOST
  if (status === 'lost') {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md pointer-events-auto">
        <div className="w-full max-w-lg bg-space-900 border-2 border-rose-600 rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-[0_0_50px_rgba(244,63,94,0.4)] font-mono text-slate-100 animate-in fade-in zoom-in-95 duration-500">
          <div className="w-16 h-16 rounded-full bg-rose-950 border border-rose-500 flex items-center justify-center mx-auto text-rose-400">
            <AlertTriangle size={32} />
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-wider text-rose-400">
              MISSION FAILED
            </h2>
            <p className="text-sm text-rose-200 mt-2 font-mono">
              {lossReason || 'Critical telemetry failure. Communications severed with Earth.'}
            </p>
          </div>

          <div className="bg-space-950/80 p-4 rounded-2xl border border-slate-800 text-xs text-slate-400 text-left space-y-1">
            <div>• Days Survived: {state.day} / {state.totalTripDays}</div>
            <div>• Trip Progress: {Math.round(ship.progress)}%</div>
            <div>• NOVA Trust: {nova.trust}%</div>
          </div>

          <button
            onClick={onReset}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-red-500 text-white font-bold hover:brightness-110 shadow-lg transition-all active:scale-95 text-sm"
          >
            <RotateCcw size={16} />
            <span>RETRY MISSION</span>
          </button>
        </div>
      </div>
    );
  }

  // If in Design stage and window not yet chosen
  if (stage === 'design' && !ship.launchWindowId) {
    return (
      <div className="absolute top-28 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-md z-10 pointer-events-auto bg-space-900/90 backdrop-blur-md border border-cyan-500/50 rounded-2xl p-4 shadow-xl font-mono text-xs text-slate-200 space-y-3">
        <div className="flex items-center gap-2 text-cyan-400 font-bold">
          <Rocket size={15} />
          <span>STAGE 1: SELECT HOHMANN LAUNCH WINDOW</span>
        </div>
        <p className="text-slate-300 text-[11px] leading-relaxed">
          Earth-Mars planetary alignments occur approximately every 26 months. Select the optimal Hohmann transfer window or speak your choice to NOVA:
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onSendCommand('Choose Hohmann launch window Nov 2026')}
            className="p-2.5 rounded-xl border border-cyan-400/60 bg-cyan-950/40 hover:bg-cyan-900/60 text-left transition-all group"
          >
            <div className="font-bold text-cyan-300 flex items-center justify-between">
              <span>Nov 2026</span>
              <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Delta-V: ~3.8 km/s (Optimal)</div>
            <div className="text-[9px] text-emerald-400">Low fuel burn required</div>
          </button>

          <button
            onClick={() => onSendCommand('Choose launch window Jan 2029')}
            className="p-2.5 rounded-xl border border-slate-700 bg-space-950/60 hover:bg-space-800 text-left transition-all group"
          >
            <div className="font-bold text-slate-200 flex items-center justify-between">
              <span>Jan 2029</span>
              <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Delta-V: ~4.3 km/s</div>
            <div className="text-[9px] text-amber-400">Higher fuel consumption</div>
          </button>
        </div>
      </div>
    );
  }

  return null;
}

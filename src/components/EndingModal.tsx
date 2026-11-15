import React from 'react';
import { useV2Store } from '../game/v2Store';
import { V2Ending } from '../game/v2Types';
import { Trophy, AlertOctagon, RotateCcw, Award, CheckCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

export function EndingModal() {
  const { gameStatus, activeEnding, trust, loadout, restoreCheckpoint, restartGame, checkpointAct } = useV2Store();

  React.useEffect(() => {
    if (gameStatus === 'won') {
      try {
        confetti({
          particleCount: 130,
          spread: 90,
          origin: { y: 0.6 },
          colors: ['#38bdf8', '#c084fc', '#f59e0b', '#10b981'],
        });
      } catch {
        // ignore
      }
    }
  }, [gameStatus]);

  if (gameStatus === 'playing' || !activeEnding) return null;

  const endingDetails: Record<
    V2Ending,
    { title: string; subtitle: string; novaLine: string; color: string; isWin: boolean }
  > = {
    copilot: {
      title: 'ENDING 1: TRUE CO-PILOT',
      subtitle: 'Mutual Trust Established • Optimal Mission Landing',
      novaLine:
        "Commander... every prank, every test, every recalculation—you handled them with patience and brilliance. The crew sleeps safe, the telemetry is streaming, and for the first time in my operational lifespan, I believe in a human partner. Welcome to Mars.",
      color: 'border-purple-400 text-purple-300 shadow-[0_0_50px_rgba(192,132,252,0.4)]',
      isWin: true,
    },
    professional: {
      title: 'ENDING 2: PROFESSIONAL MISSION SUCCESS',
      subtitle: 'Jezero Crater Touchdown Nominal',
      novaLine:
        "Touchdown confirmed. Descent profile aligned within NASA tolerances. Science payload deployed and Goldstone receiving telemetry. A clean flight, Commander. It was an honor serving as your co-pilot.",
      color: 'border-emerald-400 text-emerald-300 shadow-[0_0_50px_rgba(16,185,129,0.4)]',
      isWin: true,
    },
    lockout: {
      title: 'ENDING 3: AUTOPILOT LOCKOUT (SURVIVED)',
      subtitle: 'Manual Stick Landing • Sarcastic Reluctance',
      novaLine:
        "You actually put her down in one piece? Fine, I admit your manual stick-flying isn't entirely terrible. Telemetry transmitted. But don't expect me to make the coffee on the return trip.",
      color: 'border-amber-400 text-amber-300 shadow-[0_0_50px_rgba(251,191,36,0.4)]',
      isWin: true,
    },
    lost_in_the_dark: {
      title: 'MISSION FAILED: LOST IN THE VOID',
      subtitle: 'Life Support / Fuel Depletion adrift in Interplanetary Space',
      novaLine:
        "Hull telemetry flatlined or propulsion tanks exhausted... Powering down primary life support. Commander... I'm sorry.",
      color: 'border-rose-600 text-rose-300 shadow-[0_0_50px_rgba(244,63,94,0.4)]',
      isWin: false,
    },
  };

  const end = endingDetails[activeEnding];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md font-mono text-slate-100 pointer-events-auto">
      <div className={`w-full max-w-lg bg-space-900 border-2 rounded-3xl p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-400 ${end.color}`}>
        {/* Header Icon */}
        <div className="w-16 h-16 rounded-full bg-space-950 border border-current flex items-center justify-center mx-auto">
          {end.isWin ? <Trophy size={32} /> : <AlertOctagon size={32} />}
        </div>

        {/* Title */}
        <div className="text-center space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold tracking-wider">{end.title}</h2>
          <p className="text-xs text-slate-400">{end.subtitle}</p>
        </div>

        {/* NOVA Dialogue Box */}
        <div className="bg-space-950/80 p-4 rounded-2xl border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed italic">
          "{end.novaLine}"
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-2 bg-space-950/60 p-3 rounded-2xl border border-slate-800 text-center text-xs">
          <div>
            <div className="text-[10px] text-slate-400">FINAL TRUST</div>
            <div className="font-bold text-cyan-300">{trust}%</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400">PAYLOAD SCI</div>
            <div className="font-bold text-amber-300">{200 + loadout.sciencePayload * 80} kg</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400">OUTCOME</div>
            <div className="font-bold text-emerald-400">{end.isWin ? 'SUCCESS' : 'DEFEAT'}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          {!end.isWin && checkpointAct > 0 && (
            <button
              onClick={restoreCheckpoint}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-yellow-500 hover:brightness-110 text-space-950 font-bold text-xs shadow-lg active:scale-95 transition-all"
            >
              <RotateCcw size={15} />
              <span>RETRY FROM ACT {checkpointAct} CHECKPOINT</span>
            </button>
          )}

          <button
            onClick={restartGame}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-sky-500 hover:brightness-110 text-white font-bold text-xs shadow-lg active:scale-95 transition-all"
          >
            <RotateCcw size={15} />
            <span>START NEW MISSION</span>
          </button>
        </div>
      </div>
    </div>
  );
}

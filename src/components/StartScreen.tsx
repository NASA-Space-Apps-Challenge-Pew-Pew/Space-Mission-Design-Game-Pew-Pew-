import React, { useState } from 'react';
import { useV2Store } from '../game/v2Store';
import { Rocket, Mic, Shield, Sparkles, Volume2, AlertCircle, RefreshCw, Terminal } from 'lucide-react';

export function StartScreen() {
  const { isMissionStarted, startMission, micStatus, friendlyError, clearError } = useV2Store();
  const [isInitializing, setIsInitializing] = useState(false);

  if (isMissionStarted) return null;

  const handleStart = async () => {
    setIsInitializing(true);
    try {
      await startMission();
    } finally {
      setIsInitializing(false);
    }
  };

  const isDenied = micStatus === 'denied';
  const isMissing = micStatus === 'missing';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-space-950/95 backdrop-blur-lg select-none font-mono text-slate-100">
      {/* Background Starfield and Grid Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.15)_0%,transparent_70%)] pointer-events-none" />

      <div className="relative w-full max-w-xl bg-space-900/90 border border-cyan-500/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(56,189,248,0.25)] flex flex-col items-center text-center space-y-6">
        {/* Mission Identity Header */}
        <div className="flex flex-col items-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 text-xs font-bold tracking-widest uppercase shadow-sm">
            <Sparkles size={14} className="text-cyan-400" />
            <span>NASA SPACE APPS CHALLENGE • 2026</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-200 to-teal-200">
            PROJECT NOVA: ODYSSEY-1
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md">
            First crewed Mars mission flight terminal. Your experimental co-pilot NOVA is ready for voice summoning.
          </p>
        </div>

        {/* Feature Badges */}
        <div className="grid grid-cols-3 gap-2.5 w-full text-left">
          <div className="p-3 rounded-2xl bg-space-950/80 border border-slate-800 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-bold">
              <Mic size={14} />
              <span>Wake Word</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Fully local. Just say <strong>"NOVA"</strong> to awaken your co-pilot.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-space-950/80 border border-slate-800 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-purple-400 text-xs font-bold">
              <Shield size={14} />
              <span>100% Local</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              WebAssembly & Web Worker. Nothing sent to server while listening.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-space-950/80 border border-slate-800 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
              <Rocket size={14} />
              <span>3D Flight</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Real-time arcade flight with summons, repairs, and orbital arcs.
            </p>
          </div>
        </div>

        {/* Friendly Error Notice if Mic Denied or Missing */}
        {(isDenied || isMissing || friendlyError) && (
          <div className="w-full p-4 rounded-2xl bg-amber-950/40 border border-amber-500/50 text-left space-y-2">
            <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>COMMUNICATIONS PROTOCOL NOTICE</span>
            </div>
            <p className="text-xs text-amber-200/90 leading-relaxed">
              {isDenied
                ? 'Microphone permission was not granted. You can allow it in your browser address bar to use voice commands, or fly and summon using keyboard/touch orders and quick-command chips.'
                : isMissing
                ? 'No microphone hardware was detected. The game is fully playable using keyboard, mouse, touch controls, and order chips.'
                : friendlyError?.friendly}
            </p>
          </div>
        )}

        {/* Start / Action Buttons */}
        <div className="w-full flex flex-col sm:flex-row gap-3 pt-2">
          {isDenied ? (
            <>
              <button
                type="button"
                onClick={handleStart}
                disabled={isInitializing}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm tracking-wide shadow-[0_0_20px_rgba(56,189,248,0.4)] transition-all active:scale-95"
              >
                <RefreshCw size={16} className={isInitializing ? 'animate-spin' : ''} />
                <span>RETRY MICROPHONE ACCESS</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  clearError();
                  useV2Store.setState({ isMissionStarted: true });
                }}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-space-800 hover:bg-space-700 border border-slate-700 text-slate-200 font-bold text-sm tracking-wide transition-all active:scale-95"
              >
                <Terminal size={16} />
                <span>CONTINUE WITH TEXT ORDERS</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleStart}
              disabled={isInitializing}
              className="w-full flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-teal-400 hover:brightness-110 text-space-950 font-extrabold text-sm sm:text-base tracking-wider shadow-[0_0_30px_rgba(56,189,248,0.5)] transition-all active:scale-95"
            >
              <Rocket size={18} className={isInitializing ? 'animate-bounce' : ''} />
              <span>{isInitializing ? 'INITIALIZING AI CORE...' : 'START MISSION (UNLOCK AUDIO)'}</span>
            </button>
          )}
        </div>

        {/* In-lore footnote */}
        <div className="text-[11px] text-slate-500 flex items-center gap-2">
          <Volume2 size={12} />
          <span>Odyssey-1 Flight Terminal • Noise Suppression & Echo Cancellation Active</span>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect } from 'react';
import { ScareEvent } from '../game/types';
import { AlertOctagon, Ghost, ZapOff } from 'lucide-react';

interface ScareOverlayProps {
  scare: ScareEvent | null;
  onDismiss: () => void;
  volume: number;
}

export function ScareOverlay({ scare, onDismiss, volume }: ScareOverlayProps) {
  useEffect(() => {
    if (!scare) return;

    // Optional audio beep / alarm sound generation via Web Audio API
    if (typeof window !== 'undefined' && scare.type === 'alarm' && volume > 0) {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3);

        gain.gain.setValueAtTime(0.15 * volume, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + 1.2);
      } catch (e) {
        // AudioContext might be blocked before first user interaction
      }
    }
  }, [scare, volume]);

  if (!scare) return null;

  return (
    <div
      onClick={onDismiss}
      className="fixed inset-0 z-50 pointer-events-auto cursor-pointer select-none transition-all duration-300"
    >
      {/* 1. Alarm: Red flashing emergency lights & strobe */}
      {scare.type === 'alarm' && (
        <div className="w-full h-full bg-rose-950/60 animate-pulse border-8 border-rose-600 flex flex-col items-center justify-center p-6 backdrop-blur-[2px]">
          <div className="bg-space-950/90 border-2 border-rose-500 rounded-3xl p-6 text-center max-w-md shadow-[0_0_50px_rgba(244,63,94,0.8)] animate-bounce">
            <AlertOctagon size={48} className="text-rose-500 mx-auto mb-3 animate-spin" style={{ animationDuration: '6s' }} />
            <h2 className="text-xl sm:text-2xl font-mono font-bold text-rose-400 tracking-widest">
              [CRITICAL EMERGENCY ALARM]
            </h2>
            <p className="text-xs font-mono text-rose-200 mt-2">
              AUXILIARY COMPARTMENT MALFUNCTION DETECTED
            </p>
            <div className="mt-4 text-[10px] text-slate-400 font-mono">
              (Tap anywhere to override alarm)
            </div>
          </div>
        </div>
      )}

      {/* 2. Blackout: Ship power failure, dark shadows */}
      {scare.type === 'blackout' && (
        <div className="w-full h-full bg-black/95 flex flex-col items-center justify-center p-6 text-slate-500 font-mono text-center">
          <ZapOff size={40} className="text-slate-600 mx-auto mb-3 animate-pulse" />
          <h2 className="text-lg font-bold text-slate-400 tracking-wider">
            SYSTEM POWER FAILURE: TOTAL BLACKOUT
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Running on emergency capacitor reserves...
          </p>
        </div>
      )}

      {/* 3. Silhouette: Mysterious anomaly in the viewport */}
      {scare.type === 'silhouette' && (
        <div className="w-full h-full bg-space-950/80 backdrop-blur-sm flex flex-col items-center justify-center relative overflow-hidden">
          {/* Shadowy alien silhouette */}
          <div className="relative animate-pulse">
            <div className="w-36 h-48 bg-gradient-to-t from-black via-slate-900 to-transparent rounded-t-full opacity-90 blur-[3px] scale-125" />
            <div className="absolute top-10 left-8 w-3 h-2 rounded-full bg-cyan-400/80 blur-[2px] animate-ping" />
            <div className="absolute top-10 right-8 w-3 h-2 rounded-full bg-cyan-400/80 blur-[2px] animate-ping" />
          </div>
          <div className="mt-6 bg-space-950/80 px-4 py-1.5 rounded-full border border-purple-500/40 text-[11px] font-mono text-purple-300">
            TRANSIENT OPTICAL SILHOUETTE OUTSIDE PORTHOLE
          </div>
        </div>
      )}

      {/* 4. Flicker: CRT glitch scanlines */}
      {scare.type === 'flicker' && (
        <div className="w-full h-full pointer-events-none animate-flicker bg-cyan-500/10 mix-blend-overlay">
          <div className="w-full h-full bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px]" />
        </div>
      )}
    </div>
  );
}

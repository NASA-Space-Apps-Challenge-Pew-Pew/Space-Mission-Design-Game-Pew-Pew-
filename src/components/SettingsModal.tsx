import React from 'react';
import { GameSettings, ScareEvent } from '../game/types';
import { X, Volume2, VolumeX, Shield, AlertTriangle, RotateCcw, Skull, Mic, Radio, Cpu } from 'lucide-react';
import { useV2Store } from '../game/v2Store';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GameSettings;
  onUpdateSettings: (partial: Partial<GameSettings>) => void;
  onResetGame: () => void;
  onTriggerTestScare: (scare: ScareEvent) => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onResetGame,
  onTriggerTestScare,
}: SettingsModalProps) {
  const { alwaysListening, setAlwaysListening, modelReady, modelLoadingProgress } = useV2Store();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm pointer-events-auto">
      <div className="w-full max-w-md bg-space-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl space-y-6 font-mono text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-cyan-400" />
            <h2 className="text-base font-bold tracking-wider text-slate-100">
              MISSION SETTINGS
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-space-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* 1. Scare Level Setting */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Skull size={14} className="text-purple-400" />
              SCARE LEVEL PROTOCOL
            </span>
            <span className="text-[10px] text-purple-300 font-bold uppercase">
              {settings.scareLevel === 0 ? 'OFF' : settings.scareLevel === 1 ? 'MILD' : 'FULL'}
            </span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { level: 0, label: '0: OFF', desc: 'No scares or blackouts' },
              { level: 1, label: '1: MILD', desc: 'Flicker & audio cues' },
              { level: 2, label: '2: FULL', desc: 'Silhouettes & blackouts' },
            ].map((opt) => (
              <button
                key={opt.level}
                onClick={() => onUpdateSettings({ scareLevel: opt.level })}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs transition-all ${
                  settings.scareLevel === opt.level
                    ? 'border-cyan-400 bg-cyan-950/60 text-cyan-200 shadow-[0_0_15px_rgba(56,189,248,0.3)]'
                    : 'border-slate-800 bg-space-950/50 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="font-bold">{opt.label}</span>
                <span className="text-[9px] text-slate-400 mt-0.5 text-center leading-tight">
                  {opt.desc}
                </span>
              </button>
            ))}
          </div>
          {settings.scareLevel > 0 && (
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => onTriggerTestScare({ type: 'alarm', durationMs: 2500 })}
                className="text-[10px] px-2 py-1 rounded bg-rose-950/60 border border-rose-800/60 text-rose-300 hover:bg-rose-900/60"
              >
                Test Alarm
              </button>
              <button
                onClick={() => onTriggerTestScare({ type: 'silhouette', durationMs: 2000 })}
                className="text-[10px] px-2 py-1 rounded bg-purple-950/60 border border-purple-800/60 text-purple-300 hover:bg-purple-900/60"
              >
                Test Silhouette
              </button>
              <button
                onClick={() => onTriggerTestScare({ type: 'blackout', durationMs: 2000 })}
                className="text-[10px] px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700"
              >
                Test Blackout
              </button>
            </div>
          )}
        </div>

        {/* 2. Audio & Voice Narration */}
        <div className="space-y-3">
          {/* Always-Listening Wake Word setting */}
          <div className="p-3 rounded-xl bg-space-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
                <Mic size={14} />
                ALWAYS-LISTENING WAKE WORD ("NOVA")
              </span>
              <input
                type="checkbox"
                checked={alwaysListening}
                onChange={(e) => setAlwaysListening(e.target.checked)}
                className="w-4 h-4 accent-cyan-500 cursor-pointer"
              />
            </div>
            <p className="text-[10px] text-slate-400">
              When ON: Listens 100% locally via Web Worker. When OFF: Push-to-Talk only (hold [V] or mic button).
            </p>
            <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-800/80">
              <span className="text-slate-400">STATUS:</span>
              <span className={modelReady ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                {modelReady
                  ? 'Model Active (IndexedDB Cached)'
                  : modelLoadingProgress !== null
                  ? `Compiling Model (${modelLoadingProgress}%)`
                  : 'Standby / Cloud Fallback Active'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              {settings.voiceEnabled ? <Volume2 size={14} className="text-cyan-400" /> : <VolumeX size={14} className="text-slate-500" />}
              NOVA VOICE SYNTHESIS (TTS)
            </span>
            <input
              type="checkbox"
              checked={settings.voiceEnabled}
              onChange={(e) => onUpdateSettings({ voiceEnabled: e.target.checked })}
              className="w-4 h-4 accent-cyan-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              AUTO-SPEAK REPLIES
            </span>
            <input
              type="checkbox"
              checked={settings.autoSpeak}
              onChange={(e) => onUpdateSettings({ autoSpeak: e.target.checked })}
              className="w-4 h-4 accent-cyan-500 cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>VOLUME</span>
              <span>{Math.round(settings.volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.volume}
              onChange={(e) => onUpdateSettings({ volume: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer bg-space-950 rounded-lg h-2"
            />
          </div>
        </div>

        {/* 3. Restart Mission Danger Zone */}
        <div className="pt-2 border-t border-slate-800">
          <button
            onClick={() => {
              if (window.confirm('Reset mission back to Earth design stage?')) {
                onResetGame();
                onClose();
              }
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-rose-800/80 bg-rose-950/40 text-rose-300 hover:bg-rose-900/40 text-xs font-semibold transition-all active:scale-95"
          >
            <RotateCcw size={14} />
            <span>RESET MISSION TO EARTH</span>
          </button>
        </div>

        {/* Footer */}
        <div className="text-center text-[10px] text-slate-500">
          NASA Space Apps Challenge 2026 • Contract v1.0
        </div>
      </div>
    </div>
  );
}

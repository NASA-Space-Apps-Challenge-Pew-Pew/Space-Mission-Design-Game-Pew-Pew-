import React, { useState } from 'react';
import { Mic, MicOff, Send, Sparkles } from 'lucide-react';
import { Stage } from '../game/types';

interface CommandBarProps {
  input: string;
  onChangeInput: (val: string) => void;
  onSubmit: (text?: string) => void;
  isListening: boolean;
  onStartVoice: () => void;
  onStopVoice: () => void;
  loading: boolean;
  stage: Stage;
}

export function CommandBar({
  input,
  onChangeInput,
  onSubmit,
  isListening,
  onStartVoice,
  onStopVoice,
  loading,
  stage,
}: CommandBarProps) {
  const [showSuggestions, setShowSuggestions] = useState(true);

  const getSuggestions = (st: Stage): string[] => {
    switch (st) {
      case 'design':
        return [
          'Choose Hohmann launch window Nov 2026',
          'Allocate budget: 45% fuel, 25% payload, 30% supplies',
          'NOVA, status report on ship readiness',
          'Start launch countdown',
        ];
      case 'launch':
        return [
          'Execute Trans-Mars Injection burn',
          'Report cabin atmospheric pressure',
          'NOVA, check main engine gimbal status',
        ];
      case 'transit':
        return [
          'Skip 35 days ahead in transit',
          'Burn 80kg fuel to accelerate progress',
          'Scan environment for radiation hazards',
          'Deploy drones to repair hull integrity',
          'Thank you NOVA, you are doing a great job',
        ];
      case 'arrival':
        return [
          'Begin Mars orbit insertion retro-burn',
          'Scan Jezero Crater landing target',
          'Initiate atmospheric entry and powered landing',
        ];
      case 'surface':
        return [
          'Deploy science drills and surface spectrometer',
          'Transmit scientific telemetry to NASA Earth',
          'NOVA, summarize our mission accomplishments',
        ];
      case 'ended':
        return ['Restart new mission'];
    }
  };

  const suggestions = getSuggestions(stage);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    onSubmit(input);
  };

  const handleSuggestionClick = (suggestion: string) => {
    onSubmit(suggestion);
  };

  return (
    <div className="w-full bg-space-950/90 backdrop-blur-md border-t border-slate-800 p-2 sm:p-3 space-y-2 pointer-events-auto">
      {/* Suggestion Chips */}
      {showSuggestions && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
          <div className="flex items-center gap-1 text-[10px] text-cyan-400 font-mono font-semibold uppercase tracking-wider pl-1 flex-shrink-0">
            <Sparkles size={11} />
            <span className="hidden sm:inline">Orders:</span>
          </div>
          {suggestions.map((sug, idx) => (
            <button
              key={idx}
              onClick={() => handleSuggestionClick(sug)}
              disabled={loading}
              className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-space-900/90 hover:bg-cyan-950/70 border border-slate-700 hover:border-cyan-500/60 text-slate-300 hover:text-cyan-200 whitespace-nowrap transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              {sug}
            </button>
          ))}
        </div>
      )}

      {/* Main Input Controls: Mic + Text input + Send */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        {/* Big Mic Button (Tap / Push to Talk) */}
        <button
          type="button"
          onClick={isListening ? onStopVoice : onStartVoice}
          title={isListening ? 'Stop listening' : 'Push to talk with NOVA'}
          className={`relative flex items-center justify-center w-12 h-12 rounded-2xl flex-shrink-0 transition-all shadow-lg active:scale-95 ${
            isListening
              ? 'bg-rose-600 text-white shadow-[0_0_20px_rgba(244,63,94,0.7)] animate-pulse'
              : 'bg-gradient-to-tr from-cyan-600 to-sky-500 text-white hover:brightness-110 shadow-[0_0_15px_rgba(56,189,248,0.3)]'
          }`}
        >
          {isListening ? (
            <>
              <span className="absolute -inset-1 rounded-2xl bg-rose-500 animate-ping opacity-75" />
              <MicOff size={22} className="relative z-10" />
            </>
          ) : (
            <Mic size={22} />
          )}
        </button>

        {/* Text Input */}
        <div className="relative flex-1">
          <input
            type="text"
            value={input}
            onChange={(e) => onChangeInput(e.target.value)}
            disabled={loading}
            placeholder={
              isListening
                ? 'Listening to Commander voice...'
                : "Speak or type order (e.g. 'NOVA, skip 30 days', 'repair hull')..."
            }
            className="w-full bg-space-900/90 border border-slate-700/80 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400 shadow-inner"
          />
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="flex items-center justify-center w-11 h-11 rounded-xl bg-space-800 hover:bg-cyan-600 text-slate-200 hover:text-white border border-slate-700 hover:border-cyan-500 transition-all flex-shrink-0 disabled:opacity-40 disabled:hover:bg-space-800 disabled:cursor-not-allowed active:scale-95"
          title="Transmit Order"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}

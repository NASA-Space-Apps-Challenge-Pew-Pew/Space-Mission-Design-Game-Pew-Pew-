import React, { useState } from 'react';
import { useV2Store } from '../game/v2Store';
import { Mic, MicOff, Send, Sparkles, Radio } from 'lucide-react';

export function V2CommandBar() {
  const {
    isRecordingVoice,
    startPushToTalk,
    stopPushToTalk,
    sendVoiceCommand,
    isNovaThinking,
    voiceState,
    awakeCountdown,
    alwaysListening,
    setAlwaysListening,
    voiceTranscriptInput,
  } = useV2Store();

  const [input, setInput] = useState('');

  const quickOrders = [
    'Summon repair drone',
    'Refuel with supply crate',
    'Summon escort fighter',
    'Reveal guidance path',
    'Summon a space whale',
    'Status report, NOVA',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isNovaThinking) return;
    sendVoiceCommand(input);
    setInput('');
  };

  const handleChipClick = (cmd: string) => {
    sendVoiceCommand(cmd);
  };

  // Dynamic placeholder text
  let placeholder = "Say 'NOVA' to summon, or type order (e.g. 'repair hull', 'refuel')...";
  if (isRecordingVoice) {
    placeholder = 'Recording voice command (16 kHz mono WAV / local recognizer)...';
  } else if (voiceState === 'awake') {
    placeholder = `NOVA is listening (${awakeCountdown.toFixed(1)}s)... say order or type here...`;
  } else if (voiceState === 'thinking') {
    placeholder = 'NOVA is calculating response & summoning entities...';
  } else if (voiceState === 'speaking') {
    placeholder = 'NOVA transmitting audio telemetry...';
  } else if (!alwaysListening) {
    placeholder = 'Push mic button or hold [V] to speak, or type order here...';
  }

  return (
    <div className="w-full bg-space-950/90 backdrop-blur-md border-t border-slate-800 p-2 sm:p-3 space-y-2 pointer-events-auto z-20 font-mono">
      {/* Quick-command chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <div className="flex items-center gap-1 text-[10px] text-cyan-400 font-semibold uppercase tracking-wider pl-1 flex-shrink-0">
          <Sparkles size={11} />
          <span className="hidden sm:inline">Orders:</span>
        </div>
        {quickOrders.map((order, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleChipClick(order)}
            disabled={isNovaThinking}
            className="text-[11px] px-2.5 py-1 rounded-full bg-space-900/90 hover:bg-cyan-950/70 border border-slate-700 hover:border-cyan-500/60 text-slate-300 hover:text-cyan-200 whitespace-nowrap transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            {order}
          </button>
        ))}
      </div>

      {/* Main Command Bar: Always-Listening Toggle + Push-To-Talk Mic + Text Input + Submit */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        {/* Toggle Always-Listening Wake Word vs Push-to-Talk only */}
        <button
          type="button"
          onClick={() => setAlwaysListening(!alwaysListening)}
          title={
            alwaysListening
              ? "Always-Listening is ON (Say 'NOVA' to summon). Click to switch to Push-to-Talk only."
              : "Always-Listening is OFF. Click to enable local wake word detection."
          }
          className={`flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-2xl border transition-all flex-shrink-0 ${
            alwaysListening
              ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-300 hover:bg-emerald-900/70 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
              : 'bg-space-900 border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-space-800'
          }`}
        >
          <Radio size={20} className={alwaysListening ? 'animate-pulse' : ''} />
        </button>

        {/* Push-to-Talk / Tap-to-Talk Button */}
        <button
          type="button"
          onClick={isRecordingVoice ? stopPushToTalk : startPushToTalk}
          title={isRecordingVoice ? 'Release/tap to finish command' : 'Press to talk to NOVA (or hold [V])'}
          className={`relative flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex-shrink-0 transition-all shadow-lg active:scale-95 ${
            isRecordingVoice
              ? 'bg-rose-600 text-white shadow-[0_0_25px_rgba(244,63,94,0.8)] animate-pulse'
              : voiceState === 'awake'
              ? 'bg-amber-500 text-space-950 shadow-[0_0_20px_rgba(251,191,36,0.6)] animate-pulse font-bold'
              : 'bg-gradient-to-tr from-cyan-600 to-sky-500 text-white hover:brightness-110 shadow-[0_0_15px_rgba(56,189,248,0.3)]'
          }`}
        >
          {isRecordingVoice ? (
            <>
              <span className="absolute -inset-1 rounded-2xl bg-rose-500 animate-ping opacity-75" />
              <MicOff size={22} className="relative z-10" />
            </>
          ) : voiceState === 'awake' ? (
            <span className="text-xs font-black">{Math.ceil(awakeCountdown)}s</span>
          ) : (
            <Mic size={22} />
          )}
        </button>

        {/* Text Input Field */}
        <div className="relative flex-1">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isNovaThinking}
            placeholder={placeholder}
            className="w-full bg-space-900/90 border border-slate-700/80 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400 shadow-inner"
          />
        </div>

        {/* Transmit Order Button */}
        <button
          type="submit"
          disabled={!input.trim() || isNovaThinking}
          className="flex items-center justify-center w-11 h-11 rounded-xl bg-space-800 hover:bg-cyan-600 text-slate-200 hover:text-white border border-slate-700 hover:border-cyan-500 transition-all flex-shrink-0 disabled:opacity-40 disabled:hover:bg-space-800 disabled:cursor-not-allowed active:scale-95"
          title="Transmit Order"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}

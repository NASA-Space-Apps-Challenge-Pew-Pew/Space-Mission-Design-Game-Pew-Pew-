import React, { useEffect, useRef } from 'react';
import { HistoryItem, NovaResponseType, ActionRecord } from '../game/types';
import { User, Bot, CheckCircle2, ChevronRight, Activity } from 'lucide-react';

interface TranscriptProps {
  history: HistoryItem[];
  lastActions: ActionRecord[];
  loading: boolean;
}

export function Transcript({ history, lastActions, loading }: TranscriptProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, loading]);

  const renderResponseTypeBadge = (type?: NovaResponseType) => {
    if (!type) return null;
    const styles: Record<NovaResponseType, string> = {
      grant: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40',
      grant_with_cost: 'text-amber-400 border-amber-500/40 bg-amber-950/40',
      twist: 'text-purple-400 border-purple-500/40 bg-purple-950/40',
      refuse: 'text-rose-400 border-rose-500/40 bg-rose-950/40',
      prank: 'text-fuchsia-400 border-fuchsia-500/40 bg-fuchsia-950/40',
    };

    const labels: Record<NovaResponseType, string> = {
      grant: 'GRANT',
      grant_with_cost: 'GRANT (WITH COST)',
      twist: 'TWIST',
      refuse: 'REFUSED',
      prank: 'PRANK / SCARE',
    };

    return (
      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase tracking-wider ${styles[type]}`}>
        {labels[type]}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full bg-space-950/80 backdrop-blur-md border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Comms Header */}
      <div className="px-3.5 py-2 border-b border-slate-800/80 flex items-center justify-between bg-space-900/60">
        <div className="flex items-center gap-2">
          <Activity size={13} className="text-cyan-400 animate-pulse" />
          <span className="text-xs font-mono font-bold tracking-wider text-slate-300">
            SECURE COMMS TRANSCRIPT
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-400">
          CHANNEL: SHIP-AI
        </span>
      </div>

      {/* Message History List */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3.5 space-y-3 font-mono text-xs scroll-smooth"
      >
        {history.map((item, idx) => {
          const isPlayer = item.role === 'player';

          return (
            <div
              key={idx}
              className={`flex flex-col ${isPlayer ? 'items-end' : 'items-start'} max-w-[92%] sm:max-w-[85%] ${
                isPlayer ? 'ml-auto' : 'mr-auto'
              }`}
            >
              {/* Sender Tag & Response Type */}
              <div className="flex items-center gap-1.5 mb-1 px-1">
                {isPlayer ? (
                  <>
                    <span className="text-[10px] text-cyan-400 font-semibold tracking-wider">COMMANDER</span>
                    <User size={11} className="text-cyan-400" />
                  </>
                ) : (
                  <>
                    <Bot size={11} className="text-purple-400" />
                    <span className="text-[10px] text-purple-300 font-semibold tracking-wider">N.O.V.A.</span>
                    {renderResponseTypeBadge(item.responseType)}
                  </>
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={`p-3 rounded-2xl leading-relaxed text-slate-200 border shadow-md ${
                  isPlayer
                    ? 'bg-cyan-950/50 border-cyan-500/40 text-cyan-50 rounded-tr-none'
                    : 'bg-space-900/80 border-slate-700/70 text-slate-200 rounded-tl-none'
                }`}
              >
                {item.text}
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex items-center gap-2 text-cyan-400 py-1 px-2 font-mono text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="animate-pulse">NOVA is processing telemetry and mission rules...</span>
          </div>
        )}

        {/* Actions Executed pill display */}
        {lastActions && lastActions.length > 0 && (
          <div className="mt-2 pt-2 border-t border-slate-800/60 flex flex-wrap gap-1.5">
            {lastActions.map((act, i) => (
              <div
                key={i}
                className="flex items-center gap-1 text-[10px] font-mono bg-space-900/90 text-cyan-300 border border-cyan-800/60 px-2 py-0.5 rounded-full"
              >
                <CheckCircle2 size={10} className="text-cyan-400" />
                <span>{act.name}</span>
                {act.note && <span className="text-slate-400 text-[9px]">({act.note})</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useV2Store } from '../game/v2Store';
import { AlertCircle, ChevronDown, ChevronUp, X, Radio } from 'lucide-react';

export function FriendlyErrorToast() {
  const { friendlyError, clearError } = useV2Store();
  const [showDetails, setShowDetails] = useState(false);

  if (!friendlyError) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40 pointer-events-auto font-mono animate-in slide-in-from-bottom-3 duration-300">
      <div className="bg-space-950/95 border border-cyan-500/60 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 text-cyan-300">
            <Radio size={16} className="text-cyan-400 animate-pulse flex-shrink-0" />
            <span className="text-xs font-bold">{friendlyError.friendly}</span>
          </div>
          <button
            onClick={clearError}
            className="text-slate-400 hover:text-white p-0.5 rounded transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {friendlyError.technical && (
          <div>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-cyan-400 transition-colors"
            >
              <span>{showDetails ? 'Hide Diagnostics' : 'Show Details'}</span>
              {showDetails ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>

            {showDetails && (
              <div className="mt-1.5 p-2 rounded-lg bg-space-900 border border-slate-800 text-[10px] text-slate-300 font-mono break-words">
                {friendlyError.technical}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

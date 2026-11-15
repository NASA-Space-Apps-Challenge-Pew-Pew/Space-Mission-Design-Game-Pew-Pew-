import React from 'react';
import { NovaMood } from '../game/types';
import { VoiceState } from '../game/localVoiceManager';
import { useV2Store } from '../game/v2Store';
import { Volume2, VolumeX, ShieldAlert, Mic, MicOff, Sparkles, Loader2 } from 'lucide-react';

interface NovaAvatarProps {
  mood?: NovaMood;
  trust?: number;
  isSpeaking?: boolean;
  lockedSystems?: string[];
  onToggleVoice?: () => void;
  voiceEnabled?: boolean;
  voiceStateOverride?: VoiceState;
  countdownOverride?: number;
}

export function NovaAvatar({
  mood: propMood,
  trust: propTrust,
  isSpeaking: propIsSpeaking,
  lockedSystems = [],
  onToggleVoice,
  voiceEnabled = true,
  voiceStateOverride,
  countdownOverride,
}: NovaAvatarProps) {
  const store = useV2Store();

  const mood = propMood ?? store.mood;
  const trust = propTrust ?? store.trust;
  const voiceState = voiceStateOverride ?? store.voiceState;
  const awakeCountdown = countdownOverride ?? store.awakeCountdown;
  const isSpeaking = propIsSpeaking ?? (voiceState === 'speaking' || store.isNovaSpeaking);
  const isThinking = voiceState === 'thinking' || store.isNovaThinking;
  const isAwake = voiceState === 'awake';
  const isIdle = voiceState === 'idle';

  // SVG countdown circle geometry (r = 26, C = 2 * PI * 26 ≈ 163.36)
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = Math.max(0, Math.min(1, awakeCountdown / 10));
  const strokeDashoffset = circumference * (1 - progressRatio);

  // Theme colors based on NOVA's emotional state
  const moodColors = {
    playful: {
      ring: 'border-purple-400 shadow-[0_0_25px_rgba(192,132,252,0.4)]',
      core: 'from-purple-500 via-pink-400 to-cyan-400',
      glow: 'bg-purple-500/20',
      label: 'PLAYFUL',
      text: 'text-purple-300',
    },
    calm: {
      ring: 'border-cyan-400 shadow-[0_0_25px_rgba(56,189,248,0.4)]',
      core: 'from-cyan-400 via-sky-300 to-teal-400',
      glow: 'bg-cyan-500/20',
      label: 'CALM',
      text: 'text-cyan-300',
    },
    annoyed: {
      ring: 'border-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.4)]',
      core: 'from-amber-500 via-orange-400 to-yellow-300',
      glow: 'bg-amber-500/20',
      label: 'ANNOYED',
      text: 'text-amber-300',
    },
    cold: {
      ring: 'border-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.5)]',
      core: 'from-rose-600 via-red-500 to-slate-200',
      glow: 'bg-rose-500/20',
      label: 'COLD',
      text: 'text-rose-400',
    },
  }[mood];

  // Voice state badges and descriptors
  const stateBadge = {
    idle: {
      label: "IDLE: SAY 'NOVA'",
      pill: 'border-slate-600 bg-space-950/70 text-slate-300',
      icon: <Mic size={10} className="text-cyan-400 animate-pulse" />,
    },
    awake: {
      label: `AWAKE (${awakeCountdown.toFixed(1)}s)`,
      pill: 'border-amber-400 bg-amber-950/80 text-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.5)] animate-pulse',
      icon: <Sparkles size={10} className="text-amber-300 animate-spin" />,
    },
    thinking: {
      label: 'THINKING...',
      pill: 'border-cyan-400 bg-cyan-950/80 text-cyan-200 shadow-[0_0_12px_rgba(56,189,248,0.5)]',
      icon: <Loader2 size={10} className="text-cyan-300 animate-spin" />,
    },
    speaking: {
      label: 'SPEAKING (MIC MUTED)',
      pill: 'border-purple-400 bg-purple-950/80 text-purple-200 shadow-[0_0_12px_rgba(192,132,252,0.5)]',
      icon: <MicOff size={10} className="text-rose-400" />,
    },
  }[voiceState];

  return (
    <div
      onClick={() => {
        if (voiceState === 'idle') {
          store.triggerWake();
        }
      }}
      className={`flex items-center gap-3 bg-space-900/90 backdrop-blur-md border rounded-2xl p-2.5 px-3.5 shadow-lg transition-all cursor-pointer hover:border-cyan-500/60 ${
        isAwake
          ? 'border-amber-400/80 shadow-[0_0_25px_rgba(251,191,36,0.3)]'
          : isThinking
          ? 'border-cyan-400/80 shadow-[0_0_25px_rgba(56,189,248,0.3)]'
          : 'border-slate-700/60'
      }`}
      title={isIdle ? "Click orb or say 'NOVA' to awaken" : `NOVA state: ${voiceState.toUpperCase()}`}
    >
      {/* Animated AI Core Orb with States & 10s Countdown Ring */}
      <div className="relative flex items-center justify-center w-14 h-14 flex-shrink-0">
        {/* Outer ambient glow */}
        <div
          className={`absolute inset-0 rounded-full transition-all duration-700 ${
            moodColors.glow
          } ${
            isSpeaking
              ? 'scale-150 animate-ping-slow opacity-80'
              : isAwake
              ? 'scale-125 bg-amber-400/30 animate-pulse'
              : isThinking
              ? 'scale-125 bg-cyan-400/30 animate-pulse'
              : 'scale-100 opacity-40'
          }`}
        />

        {/* 10-Second Countdown Circular Progress Ring (Visible during AWAKE) */}
        {isAwake && (
          <svg className="absolute inset-0 w-14 h-14 -rotate-90 pointer-events-none z-10">
            {/* Background track circle */}
            <circle
              cx="28"
              cy="28"
              r={radius}
              fill="none"
              stroke="rgba(251, 191, 36, 0.2)"
              strokeWidth="2.5"
            />
            {/* Animated progress stroke circle */}
            <circle
              cx="28"
              cy="28"
              r={radius}
              fill="none"
              stroke="#fbbf24"
              strokeWidth="3"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-[stroke-dashoffset] duration-100 ease-linear shadow-[0_0_10px_#fbbf24]"
            />
          </svg>
        )}

        {/* Outer rotating dashed ring */}
        <div
          className={`absolute inset-1 rounded-full border-2 border-dashed transition-all duration-500 ${
            isAwake
              ? 'border-amber-400 animate-spin shadow-[0_0_15px_rgba(251,191,36,0.6)]'
              : isThinking
              ? 'border-cyan-400 animate-spin shadow-[0_0_15px_rgba(56,189,248,0.6)]'
              : moodColors.ring
          } ${isSpeaking ? 'animate-spin' : ''}`}
          style={{
            animationDuration: isThinking ? '2s' : isSpeaking ? '3.5s' : isAwake ? '6s' : '14s',
          }}
        />

        {/* Inner pulsing AI core */}
        <div
          className={`w-7 h-7 rounded-full bg-gradient-to-tr ${
            isAwake
              ? 'from-amber-400 via-yellow-300 to-orange-400'
              : isThinking
              ? 'from-cyan-400 via-teal-300 to-sky-400'
              : moodColors.core
          } shadow-inner transition-transform duration-300 flex items-center justify-center ${
            isSpeaking
              ? 'scale-125'
              : isAwake
              ? 'scale-115 animate-pulse'
              : isThinking
              ? 'scale-110 animate-bounce'
              : 'scale-100 animate-pulse-slow'
          }`}
        >
          {isAwake && (
            <span className="text-[9px] font-extrabold text-space-950 font-mono tracking-tighter">
              {Math.ceil(awakeCountdown)}
            </span>
          )}
        </div>

        {/* Speaking soundwave waveform indicator */}
        {isSpeaking && (
          <div className="absolute -bottom-1 flex items-center gap-0.5 px-1 py-0.5 rounded-full bg-space-950/90 border border-purple-400/60 z-20">
            <span className="w-1 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1 h-3 bg-cyan-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        )}
      </div>

      {/* AI Persona & State Machine Details */}
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-bold tracking-wider text-sm text-slate-100 font-mono">
            N.O.V.A.
          </span>
          <span
            className={`text-[9px] font-bold px-1.5 py-0.2 rounded border font-mono tracking-wider ${
              moodColors.text
            } border-current/30 bg-space-950/60`}
          >
            {moodColors.label}
          </span>
          {onToggleVoice && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleVoice();
              }}
              title={voiceEnabled ? 'Mute NOVA voice' : 'Enable NOVA voice'}
              className="text-slate-400 hover:text-cyan-300 p-0.5 transition-colors"
            >
              {voiceEnabled ? <Volume2 size={13} /> : <VolumeX size={13} className="text-rose-400" />}
            </button>
          )}
        </div>

        {/* State Machine Status Pill */}
        <div className="flex items-center gap-1 mt-0.5">
          <span
            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border flex items-center gap-1 font-mono tracking-tight ${
              stateBadge.pill
            }`}
          >
            {stateBadge.icon}
            <span>{stateBadge.label}</span>
          </span>
        </div>

        {/* Trust meter micro bar */}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[9px] text-slate-400 font-mono uppercase tracking-tight">
            Trust: {trust}%
          </span>
          <div className="w-14 h-1.5 bg-space-950 rounded-full overflow-hidden border border-slate-700/60">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                trust >= 70
                  ? 'bg-purple-400'
                  : trust >= 40
                  ? 'bg-cyan-400'
                  : trust >= 15
                  ? 'bg-amber-400'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${trust}%` }}
            />
          </div>
        </div>

        {/* Warning if systems locked */}
        {lockedSystems.length > 0 && (
          <div className="flex items-center gap-1 text-[9px] text-rose-400 mt-0.5 font-mono">
            <ShieldAlert size={10} />
            <span>LOCKED: {lockedSystems.join(', ')}</span>
          </div>
        )}
      </div>
    </div>
  );
}

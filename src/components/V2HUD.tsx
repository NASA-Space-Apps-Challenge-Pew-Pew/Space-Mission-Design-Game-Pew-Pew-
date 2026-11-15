import React, { useState } from 'react';
import { useV2Store } from '../game/v2Store';
import {
  Zap,
  Shield,
  Fuel,
  Compass,
  Navigation,
  Bot,
  Settings,
  X,
  Sliders,
  RotateCcw,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { ActId } from '../game/v2Types';
import { flightConfig, saveFlightConfig } from '../game/flightConfig';
import { toggleFlightDebugPanel } from '../game/flightDebugPanel';
import { NovaAvatar } from './NovaAvatar';
import { MicHardwareStatus } from '../game/localVoiceManager';

export function V2HUD() {
  const {
    act,
    objective,
    player,
    summonCharges,
    maxSummonCharges,
    chargeRegenProgress,
    trust,
    mood,
    lastNovaLine,
    lastResponseType,
    isNovaThinking,
    waypoints,
    activeWaypointIndex,
    restartGame,
    voiceState,
    awakeCountdown,
    modelLoadingProgress,
    modelReady,
    alwaysListening,
    setAlwaysListening,
    micStatus,
  } = useV2Store();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [invertX, setInvertX] = useState(flightConfig.invertX);
  const [invertY, setInvertY] = useState(flightConfig.invertY);
  const [steeringAssist, setSteeringAssist] = useState(flightConfig.steeringAssist);

  const actLabels: Record<ActId, string> = {
    0: 'ACT 0: WAKE-UP & REBOOT',
    1: 'ACT 1: DEBRIS ESCAPE',
    2: 'ACT 2: TRANSIT CORRIDOR',
    3: 'ACT 3: MARS ARRIVAL',
    4: 'ACT 4: FINALE AT JEZERO',
  };

  // Compute 3D Waypoint Arrow Angle & Distance
  let waypointDistance = 0;
  let waypointAngleDeg = 0;

  if (activeWaypointIndex < waypoints.length) {
    const activeWp = waypoints[activeWaypointIndex];
    const dx = activeWp.position[0] - player.position[0];
    const dy = activeWp.position[1] - player.position[1];
    const dz = activeWp.position[2] - player.position[2];

    waypointDistance = Math.round(Math.sqrt(dx * dx + dy * dy + dz * dz));

    const yaw = player.rotation[1];
    const localX = dx * Math.cos(yaw) - dz * Math.sin(yaw);
    const localZ = dx * Math.sin(yaw) + dz * Math.cos(yaw);
    waypointAngleDeg = Math.round((Math.atan2(localX, -localZ) * 180) / Math.PI);
  }

  const moodColors = {
    playful: 'text-purple-400 border-purple-500/50 bg-purple-950/40',
    calm: 'text-cyan-400 border-cyan-500/50 bg-cyan-950/40',
    annoyed: 'text-amber-400 border-amber-500/50 bg-amber-950/40',
    cold: 'text-rose-400 border-rose-500/50 bg-rose-950/40',
  }[mood];

  const handleInvertXChange = (val: boolean) => {
    setInvertX(val);
    flightConfig.invertX = val;
    saveFlightConfig({ invertX: val });
  };

  const handleInvertYChange = (val: boolean) => {
    setInvertY(val);
    flightConfig.invertY = val;
    saveFlightConfig({ invertY: val });
  };

  const handleAssistChange = (val: boolean) => {
    setSteeringAssist(val);
    flightConfig.steeringAssist = val;
    saveFlightConfig({ steeringAssist: val });
  };

  return (
    <div className="w-full pointer-events-none select-none z-20 flex flex-col justify-between p-3 sm:p-5">
      {/* Top Telemetry & Objective Header */}
      <header className="flex flex-col gap-2 w-full max-w-5xl mx-auto">
        <div className="flex items-center justify-between bg-space-900/85 backdrop-blur-md border border-slate-800 rounded-2xl px-4 py-2.5 shadow-lg">
          {/* Act Badge & Mission Identity */}
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping-slow" />
            <span className="font-mono font-bold text-xs sm:text-sm text-slate-100">
              ODYSSEY-1
            </span>
            <span className="text-[10px] sm:text-xs font-mono font-bold px-2.5 py-0.5 rounded border border-cyan-500/40 bg-cyan-950/50 text-cyan-300">
              {actLabels[act]}
            </span>
          </div>

          {/* Summon Charges Display */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-[11px] font-mono text-cyan-300">
              <Zap size={14} className="text-cyan-400 fill-cyan-400" />
              <span className="font-bold">CHARGES:</span>
            </div>
            <div className="flex items-center gap-1 bg-space-950/80 px-2 py-1 rounded-lg border border-slate-700">
              {Array.from({ length: maxSummonCharges }).map((_, i) => (
                <div
                  key={i}
                  className={`w-3.5 h-3.5 rounded-sm flex items-center justify-center transition-all ${
                    i < summonCharges
                      ? 'bg-gradient-to-tr from-cyan-500 to-sky-300 shadow-[0_0_8px_rgba(56,189,248,0.7)]'
                      : 'bg-space-900 border border-slate-700'
                  }`}
                />
              ))}
              <div
                className="h-1 bg-cyan-400/60 rounded-full transition-all duration-300 ml-1"
                style={{ width: `${Math.round(chargeRegenProgress * 18)}px` }}
              />
            </div>
          </div>

          {/* Mic Status Indicator Pill */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[10px] font-mono font-bold ${
              micStatus === 'listening'
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                : micStatus === 'awake'
                ? 'bg-amber-950/80 border-amber-500/60 text-amber-200 animate-pulse shadow-[0_0_12px_rgba(251,191,36,0.3)]'
                : micStatus === 'thinking'
                ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300'
                : micStatus === 'speaking'
                ? 'bg-purple-950/80 border-purple-500/50 text-purple-300'
                : micStatus === 'denied' || micStatus === 'missing'
                ? 'bg-rose-950/80 border-rose-500/50 text-rose-300'
                : 'bg-space-950 border-slate-700 text-slate-400'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                micStatus === 'listening'
                  ? 'bg-emerald-400 animate-pulse'
                  : micStatus === 'awake'
                  ? 'bg-amber-400 animate-ping'
                  : micStatus === 'thinking'
                  ? 'bg-cyan-400 animate-spin'
                  : micStatus === 'speaking'
                  ? 'bg-purple-400'
                  : micStatus === 'denied' || micStatus === 'missing'
                  ? 'bg-rose-500'
                  : 'bg-slate-500'
              }`}
            />
            <span>
              {micStatus === 'listening'
                ? "MIC: SAY 'NOVA'"
                : micStatus === 'awake'
                ? `MIC: AWAKE (${awakeCountdown.toFixed(1)}s)`
                : micStatus === 'thinking'
                ? 'MIC: PROCESSING'
                : micStatus === 'speaking'
                ? 'MIC: MUTED'
                : micStatus === 'denied'
                ? 'MIC: ACCESS DENIED'
                : micStatus === 'missing'
                ? 'MIC: NOT FOUND'
                : 'MIC: PUSH-TO-TALK'}
            </span>
          </div>

          {/* NOVA Interactive Orb Avatar & Settings Toggle */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <NovaAvatar />

            <button
              onClick={() => setSettingsOpen(true)}
              className="p-2 rounded-xl bg-space-800 hover:bg-space-700 text-slate-300 hover:text-cyan-400 border border-slate-700 transition-colors"
              title="Flight Settings & Local Voice Options"
            >
              <Settings size={16} />
            </button>
          </div>
        </div>

        {/* Voice Model Loading Progress Bar (Game playable while loading) */}
        {modelLoadingProgress !== null && modelLoadingProgress < 100 && (
          <div className="flex items-center justify-between gap-3 bg-space-950/90 border border-cyan-500/40 rounded-xl px-3 py-1.5 text-xs font-mono shadow-md pointer-events-auto">
            <div className="flex items-center gap-2 text-cyan-300">
              <Loader2 size={13} className="animate-spin text-cyan-400" />
              <span className="font-bold">COMPILING LOCAL VOICE MODEL:</span>
              <span>{modelLoadingProgress}%</span>
            </div>
            <div className="flex-1 bg-space-900 h-2 rounded-full overflow-hidden border border-slate-700 max-w-xs">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 transition-all duration-300 rounded-full"
                style={{ width: `${modelLoadingProgress}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 hidden sm:inline">(Game loop fully playable)</span>
          </div>
        )}

        {/* Objective Banner */}
        <div className="flex items-center justify-between bg-space-950/80 backdrop-blur-sm border border-cyan-500/30 rounded-xl px-4 py-1.5 text-xs font-mono shadow-md">
          <div className="flex items-center gap-2 text-slate-300 truncate">
            <Compass size={14} className="text-cyan-400 flex-shrink-0" />
            <span className="text-slate-400 text-[10px] uppercase font-bold">MISSION OBJECTIVE:</span>
            <span className="text-cyan-300 font-semibold truncate">{objective}</span>
          </div>

          {/* Waypoint distance & 3D Pointer Arrow */}
          {waypoints[activeWaypointIndex] && (
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs pl-3 flex-shrink-0">
              <Navigation
                size={14}
                className="text-emerald-400 transition-transform duration-100"
                style={{ transform: `rotate(${waypointAngleDeg}deg)` }}
              />
              <span>{waypointDistance}m</span>
            </div>
          )}
        </div>

        {/* Desktop Quick Controls Hint Bar */}
        <div className="hidden lg:flex items-center justify-center gap-4 text-[10px] text-slate-400 font-mono">
          <span><strong className="text-cyan-300">W/S</strong> Throttle</span>
          <span><strong className="text-cyan-300">A/D</strong> Strafe</span>
          <span><strong className="text-cyan-300">Mouse</strong> Steer</span>
          <span><strong className="text-cyan-300">Shift</strong> Boost</span>
          <span><strong className="text-cyan-300">Space</strong> Brake</span>
          <span><strong className="text-cyan-300">V</strong> Voice Mic</span>
          <span><strong className="text-slate-500">~</strong> Debug Tuning</span>
        </div>
      </header>

      {/* Floating Comms Subtitle Banner from NOVA */}
      {lastNovaLine && (
        <div className="w-full max-w-xl mx-auto my-auto pointer-events-auto">
          <div className="bg-space-950/85 backdrop-blur-md border border-cyan-500/40 rounded-2xl p-3.5 shadow-2xl space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono">
              <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                <span>N.O.V.A. CO-PILOT</span>
                {isNovaThinking && (
                  <span className="text-amber-400 text-[9px] animate-pulse">(calculating...)</span>
                )}
              </div>
              <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded border border-cyan-500/30 bg-cyan-950/40 text-cyan-300">
                {lastResponseType}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-mono text-slate-100 leading-relaxed">
              "{lastNovaLine}"
            </p>
          </div>
        </div>
      )}

      {/* Bottom Flight Gauges (Hull, Fuel, Speed) */}
      <footer className="w-full max-w-lg mx-auto flex items-center justify-between gap-3 bg-space-900/80 backdrop-blur-md border border-slate-800 rounded-2xl px-4 py-2 shadow-lg font-mono text-xs">
        {/* Hull Gauge */}
        <div className="flex-1 flex items-center gap-2">
          <Shield
            size={14}
            className={
              player.hullPct > 50
                ? 'text-cyan-400'
                : player.hullPct > 20
                ? 'text-amber-400'
                : 'text-rose-500 animate-pulse'
            }
          />
          <div className="flex-1">
            <div className="flex justify-between text-[10px] text-slate-400 font-bold">
              <span>HULL</span>
              <span className="text-slate-100">{Math.round(player.hullPct)}%</span>
            </div>
            <div className="w-full bg-space-950 h-2 rounded-full overflow-hidden border border-slate-700/60 mt-0.5">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  player.hullPct > 50 ? 'bg-cyan-400' : player.hullPct > 20 ? 'bg-amber-400' : 'bg-rose-500'
                }`}
                style={{ width: `${player.hullPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Speed Readout */}
        <div className="px-2 text-center border-x border-slate-800">
          <div className="text-[9px] text-slate-400">VELOCITY</div>
          <div className="text-sm font-bold text-cyan-300 font-mono">
            {Math.round(player.speed || 0)} <span className="text-[9px] text-slate-500">m/s</span>
          </div>
        </div>

        {/* Fuel Gauge */}
        <div className="flex-1 flex items-center gap-2">
          <Fuel
            size={14}
            className={
              player.fuelPct > 40
                ? 'text-cyan-400'
                : player.fuelPct > 15
                ? 'text-amber-400'
                : 'text-rose-500 animate-pulse'
            }
          />
          <div className="flex-1">
            <div className="flex justify-between text-[10px] text-slate-400 font-bold">
              <span>FUEL</span>
              <span className="text-slate-100">{Math.round(player.fuelPct)}%</span>
            </div>
            <div className="w-full bg-space-950 h-2 rounded-full overflow-hidden border border-slate-700/60 mt-0.5">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  player.fuelPct > 40 ? 'bg-cyan-400' : player.fuelPct > 15 ? 'bg-amber-400' : 'bg-rose-500'
                }`}
                style={{ width: `${player.fuelPct}%` }}
              />
            </div>
          </div>
        </div>
      </footer>

      {/* Flight Settings Modal */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm pointer-events-auto font-mono text-slate-200">
          <div className="w-full max-w-md bg-space-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Settings size={18} className="text-cyan-400" />
                <h3 className="font-bold text-base text-slate-100">FLIGHT & CONTROL SETTINGS</h3>
              </div>
              <button
                onClick={() => setSettingsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Invert Toggles */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-space-950 border border-slate-800">
                <div>
                  <div className="text-xs font-bold text-slate-200">INVERT X-AXIS (YAW)</div>
                  <div className="text-[10px] text-slate-400">Default: Off (Right moves ship right)</div>
                </div>
                <input
                  type="checkbox"
                  checked={invertX}
                  onChange={(e) => handleInvertXChange(e.target.checked)}
                  className="w-4 h-4 accent-cyan-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-space-950 border border-slate-800">
                <div>
                  <div className="text-xs font-bold text-slate-200">INVERT Y-AXIS (PITCH)</div>
                  <div className="text-[10px] text-slate-400">Default: Off (Up pitches nose up)</div>
                </div>
                <input
                  type="checkbox"
                  checked={invertY}
                  onChange={(e) => handleInvertYChange(e.target.checked)}
                  className="w-4 h-4 accent-cyan-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-space-950 border border-slate-800">
                <div>
                  <div className="text-xs font-bold text-emerald-300">STEERING ASSIST</div>
                  <div className="text-[10px] text-slate-400">Gentle magnetic pull toward active waypoint</div>
                </div>
                <input
                  type="checkbox"
                  checked={steeringAssist}
                  onChange={(e) => handleAssistChange(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Local Voice & Always-Listening Wake Word Setting */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-space-950 border border-slate-800">
                <div>
                  <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                    <Mic size={13} />
                    <span>ALWAYS-LISTENING WAKE WORD ("NOVA")</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Runs 100% locally in Web Worker. Off = Push-to-Talk only.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={alwaysListening}
                  onChange={(e) => setAlwaysListening(e.target.checked)}
                  className="w-4 h-4 accent-cyan-500 cursor-pointer"
                />
              </div>

              {/* Local Voice AI Model Info */}
              <div className="p-3 rounded-xl bg-space-950 border border-slate-800 text-[11px] space-y-1">
                <div className="flex justify-between font-bold">
                  <span className="text-slate-300">LOCAL AI MODEL:</span>
                  <span className={modelReady ? 'text-emerald-400' : 'text-amber-400'}>
                    {modelReady
                      ? 'Ready (Cached in IndexedDB)'
                      : modelLoadingProgress !== null
                      ? `Loading (${modelLoadingProgress}%)`
                      : 'Standby / Cloud Fallback Ready'}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 flex justify-between">
                  <span>vosk-model-small-en-us (41.1 MB)</span>
                  <span>Audio: 16 kHz Mono AEC/NS</span>
                </div>
              </div>
            </div>

            {/* Debug Panel Toggle Button */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <button
                onClick={() => {
                  toggleFlightDebugPanel();
                  setSettingsOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-cyan-500/50 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/50 text-xs font-bold transition-all"
              >
                <Sliders size={14} />
                <span>OPEN FLIGHT TUNING DEBUG PANEL (LIL-GUI)</span>
              </button>

              <button
                onClick={() => {
                  if (window.confirm('Reset mission back to Act 0 Wake-Up?')) {
                    restartGame();
                    setSettingsOpen(false);
                  }
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-rose-800/60 bg-rose-950/30 text-rose-300 hover:bg-rose-900/40 text-xs font-bold transition-all"
              >
                <RotateCcw size={14} />
                <span>RESTART MISSION TO ACT 0</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

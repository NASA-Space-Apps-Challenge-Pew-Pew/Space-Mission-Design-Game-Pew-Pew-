import React, { useRef, useState } from 'react';
import { Rocket, ShieldAlert, Mic, MicOff } from 'lucide-react';
import { flightConfig } from '../game/flightConfig';

interface MobileControlsProps {
  onJoystick: (normX: number, normY: number) => void;
  onBoostChange: (boosting: boolean) => void;
  onBrakeChange: (braking: boolean) => void;
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

export function MobileControls({
  onJoystick,
  onBoostChange,
  onBrakeChange,
  isRecording,
  onStartRecording,
  onStopRecording,
}: MobileControlsProps) {
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const [stickPos, setStickPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [touchId, setTouchId] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (touchId !== null) return;
    const touch = e.changedTouches[0];
    setTouchId(touch.identifier);
    updateStick(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchId) {
        updateStick(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
        break;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchId) {
        setTouchId(null);
        setStickPos({ x: 0, y: 0 });
        onJoystick(0, 0);
        break;
      }
    }
  };

  const updateStick = (clientX: number, clientY: number) => {
    if (!joystickBaseRef.current) return;
    const rect = joystickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const maxRadius = rect.width / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const clampedDist = Math.min(dist, maxRadius);
    const angle = Math.atan2(dy, dx);

    const posX = Math.cos(angle) * clampedDist;
    const posY = Math.sin(angle) * clampedDist;

    setStickPos({ x: posX, y: posY });

    // Normalized: normX is yaw steer, normY is pitch steer (up is positive pitch)
    const normX = posX / maxRadius;
    const normY = -posY / maxRadius;
    onJoystick(normX, normY);
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-30 lg:hidden font-mono">
      {/* Left Steering Joystick (Steers Pitch & Yaw with auto-cruise) */}
      <div
        ref={joystickBaseRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        className="absolute bottom-6 left-6 w-32 h-32 rounded-full border-2 border-cyan-500/50 bg-space-950/70 backdrop-blur-md flex items-center justify-center pointer-events-auto touch-none shadow-[0_0_25px_rgba(56,189,248,0.25)]"
      >
        {/* Direction Crosshair markers */}
        <div className="absolute w-full h-[1px] bg-cyan-500/20 pointer-events-none" />
        <div className="absolute h-full w-[1px] bg-cyan-500/20 pointer-events-none" />
        <span className="absolute top-1 text-[8px] text-cyan-400/60 font-bold">PITCH UP</span>
        <span className="absolute bottom-1 text-[8px] text-cyan-400/60 font-bold">PITCH DOWN</span>
        <span className="absolute left-1 text-[8px] text-cyan-400/60 font-bold">L</span>
        <span className="absolute right-1 text-[8px] text-cyan-400/60 font-bold">R</span>

        {/* Thumb stick */}
        <div
          className="w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-500 via-sky-400 to-teal-300 shadow-xl border-2 border-white/80 pointer-events-none transition-transform duration-75 flex items-center justify-center"
          style={{ transform: `translate(${stickPos.x}px, ${stickPos.y}px)` }}
        >
          <div className="w-4 h-4 rounded-full bg-space-950/40" />
        </div>
      </div>

      {/* Right Action Clusters: Boost, Brake, and Mic */}
      <div className="absolute bottom-6 right-6 flex flex-col items-center gap-2.5 pointer-events-auto">
        {/* Boost Button */}
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            onBoostChange(true);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            onBoostChange(false);
          }}
          onMouseDown={() => onBoostChange(true)}
          onMouseUp={() => onBoostChange(false)}
          className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-400 text-space-950 flex flex-col items-center justify-center font-bold text-xs shadow-lg active:scale-95 transition-transform border border-amber-200"
          title="Boost Thrusters"
        >
          <Rocket size={18} />
          <span className="text-[9px]">BOOST</span>
        </button>

        {/* Brake Button */}
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            onBrakeChange(true);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            onBrakeChange(false);
          }}
          onMouseDown={() => onBrakeChange(true)}
          onMouseUp={() => onBrakeChange(false)}
          className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-700 to-slate-800 text-slate-200 flex flex-col items-center justify-center font-bold text-xs shadow-lg active:scale-95 transition-transform border border-slate-600"
          title="Space Brake"
        >
          <ShieldAlert size={18} className="text-amber-400" />
          <span className="text-[9px]">BRAKE</span>
        </button>

        {/* Big Mic Button */}
        <button
          onClick={isRecording ? onStopRecording : onStartRecording}
          className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center text-white shadow-xl active:scale-95 transition-all ${
            isRecording
              ? 'bg-rose-600 animate-pulse border-2 border-white'
              : 'bg-gradient-to-tr from-cyan-600 to-blue-500 border border-cyan-300'
          }`}
          title="Push to talk"
        >
          {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
          <span className="text-[8px] font-bold mt-0.5">
            {isRecording ? 'STOP' : 'TALK'}
          </span>
        </button>
      </div>
    </div>
  );
}

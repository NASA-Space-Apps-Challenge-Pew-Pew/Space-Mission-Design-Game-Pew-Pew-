import React, { useState } from 'react';
import { useV2Store } from '../game/v2Store';
import { V2Loadout } from '../game/v2Types';
import { Rocket, Shield, Fuel, Zap, Award, ArrowRight } from 'lucide-react';

export function LoadoutModal() {
  const { loadoutModalOpen, setLoadout } = useV2Store();

  const [fuel, setFuel] = useState(1);
  const [armor, setArmor] = useState(1);
  const [science, setScience] = useState(1);
  const [charges, setCharges] = useState(1);

  const totalPoints = 6;
  const currentUsed = fuel + armor + science + charges;
  const remaining = totalPoints - currentUsed;

  if (!loadoutModalOpen) return null;

  const handleConfirm = () => {
    const config: V2Loadout = {
      fuelTank: fuel,
      hullArmor: armor,
      sciencePayload: science,
      summonCharges: charges,
    };
    setLoadout(config);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md font-mono text-slate-100 pointer-events-auto">
      <div className="w-full max-w-lg bg-space-900 border-2 border-cyan-500/70 rounded-3xl p-6 sm:p-7 shadow-[0_0_50px_rgba(56,189,248,0.3)] space-y-5 animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="border-b border-slate-800 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Rocket size={18} className="text-cyan-400" />
              <h2 className="text-base sm:text-lg font-bold text-slate-100 tracking-wider">
                MISSION DESIGN LOADOUT
              </h2>
            </div>
            <span className="text-xs bg-cyan-950 border border-cyan-500/50 text-cyan-300 px-2.5 py-1 rounded-full font-bold">
              POINTS REMAINING: {remaining}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            NASA Mission Trade-off: Allocate your payload and energy distribution before departing Earth orbit.
          </p>
        </div>

        {/* 4 Point Allocation Sliders */}
        <div className="space-y-4">
          {/* 1. Fuel Tank */}
          <div className="bg-space-950/70 p-3 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="flex items-center gap-1.5 text-cyan-300 font-bold">
                <Fuel size={14} className="text-cyan-400" />
                FUEL TANK CAPACITY
              </span>
              <span className="text-slate-400">Level {fuel} (+{fuel * 10}% fuel)</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fuel > 0 && setFuel(fuel - 1)}
                className="w-7 h-7 rounded-lg bg-space-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 active:scale-95"
              >
                -
              </button>
              <div className="flex-1 flex gap-1">
                {[0, 1, 2, 3].map((lvl) => (
                  <div
                    key={lvl}
                    className={`flex-1 h-3 rounded ${
                      lvl < fuel ? 'bg-cyan-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]' : 'bg-space-800'
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={() => remaining > 0 && fuel < 3 && setFuel(fuel + 1)}
                className="w-7 h-7 rounded-lg bg-space-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 active:scale-95"
              >
                +
              </button>
            </div>
          </div>

          {/* 2. Hull Armor */}
          <div className="bg-space-950/70 p-3 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="flex items-center gap-1.5 text-emerald-300 font-bold">
                <Shield size={14} className="text-emerald-400" />
                HULL ARMOR PLATING
              </span>
              <span className="text-slate-400">Level {armor} (+{armor * 10}% hull)</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => armor > 0 && setArmor(armor - 1)}
                className="w-7 h-7 rounded-lg bg-space-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 active:scale-95"
              >
                -
              </button>
              <div className="flex-1 flex gap-1">
                {[0, 1, 2, 3].map((lvl) => (
                  <div
                    key={lvl}
                    className={`flex-1 h-3 rounded ${
                      lvl < armor ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-space-800'
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={() => remaining > 0 && armor < 3 && setArmor(armor + 1)}
                className="w-7 h-7 rounded-lg bg-space-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 active:scale-95"
              >
                +
              </button>
            </div>
          </div>

          {/* 3. Science Payload */}
          <div className="bg-space-950/70 p-3 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="flex items-center gap-1.5 text-amber-300 font-bold">
                <Award size={14} className="text-amber-400" />
                SCIENCE PAYLOAD SPECTROMETER
              </span>
              <span className="text-slate-400">Level {science} (+{science * 80}kg payload)</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => science > 0 && setScience(science - 1)}
                className="w-7 h-7 rounded-lg bg-space-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 active:scale-95"
              >
                -
              </button>
              <div className="flex-1 flex gap-1">
                {[0, 1, 2, 3].map((lvl) => (
                  <div
                    key={lvl}
                    className={`flex-1 h-3 rounded ${
                      lvl < science ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]' : 'bg-space-800'
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={() => remaining > 0 && science < 3 && setScience(science + 1)}
                className="w-7 h-7 rounded-lg bg-space-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 active:scale-95"
              >
                +
              </button>
            </div>
          </div>

          {/* 4. Summon Charges */}
          <div className="bg-space-950/70 p-3 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="flex items-center gap-1.5 text-purple-300 font-bold">
                <Zap size={14} className="text-purple-400" />
                SUMMON CAPACITOR CELLS
              </span>
              <span className="text-slate-400">Max {4 + charges} Charges</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => charges > 0 && setCharges(charges - 1)}
                className="w-7 h-7 rounded-lg bg-space-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 active:scale-95"
              >
                -
              </button>
              <div className="flex-1 flex gap-1">
                {[0, 1, 2, 3].map((lvl) => (
                  <div
                    key={lvl}
                    className={`flex-1 h-3 rounded ${
                      lvl < charges ? 'bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.6)]' : 'bg-space-800'
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={() => remaining > 0 && charges < 3 && setCharges(charges + 1)}
                className="w-7 h-7 rounded-lg bg-space-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 active:scale-95"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Commit Loadout Button */}
        <button
          onClick={handleConfirm}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-sky-400 hover:brightness-110 text-space-950 font-bold text-sm shadow-xl transition-all active:scale-95"
        >
          <span>COMMIT LOADOUT & ENTER DEBRIS CORRIDOR</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

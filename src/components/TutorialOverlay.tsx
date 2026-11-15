import React from 'react';
import { useV2Store } from '../game/v2Store';
import { Sparkles, FastForward, CheckCircle2, Bot } from 'lucide-react';

export function TutorialOverlay() {
  const {
    act,
    tutorialStep,
    tutorialComplete,
    skipTutorial,
    sendVoiceCommand,
  } = useV2Store();

  if (act !== 0 || tutorialComplete) return null;

  const steps = [
    {
      num: 1,
      title: 'STEP 1: FLIGHT CONTROLS',
      desc: 'Use W/S for thrust, A/D to strafe, and mouse (or drag) to steer. Fly through Guidance Ring Alpha.',
      chip: null,
    },
    {
      num: 2,
      title: 'STEP 2: ION BOOST THRUSTERS',
      desc: 'Engines are primed. Hold SHIFT (or tap BOOST on phone) to accelerate through Guidance Ring Beta.',
      chip: null,
    },
    {
      num: 3,
      title: 'STEP 3: VOICE SUMMONING',
      desc: "My neural link is listening. Speak or send the command: 'NOVA, summon a supply crate'.",
      chip: 'NOVA, summon a supply crate',
    },
    {
      num: 4,
      title: 'STEP 4: DAMAGE MITIGATION',
      desc: 'Hull took impact during wake-up. Ask me: "NOVA, repair ship hull" or request a repair drone.',
      chip: 'NOVA, repair ship hull',
    },
    {
      num: 5,
      title: 'STEP 5: CREATIVE SUMMON',
      desc: 'Last calibration. Request anything you envision: "spawn a space whale" or "give me an escort fighter".',
      chip: 'NOVA, summon a space whale',
    },
  ];

  const current = steps[tutorialStep - 1] || steps[0];

  return (
    <div className="absolute top-28 left-4 right-4 sm:left-6 sm:max-w-md z-30 pointer-events-auto font-mono">
      <div className="bg-space-900/90 backdrop-blur-md border border-cyan-500/50 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3">
        {/* Step Header */}
        <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
          <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
            <Bot size={15} />
            <span>{current.title}</span>
          </div>
          <span className="text-[10px] text-slate-400 bg-space-950 px-2 py-0.5 rounded-full border border-slate-700">
            {tutorialStep} / 5
          </span>
        </div>

        {/* Instructions */}
        <p className="text-xs text-slate-200 leading-relaxed">
          {current.desc}
        </p>

        {/* Quick Action Chip for Voice step */}
        {current.chip && (
          <div className="pt-1">
            <button
              onClick={() => sendVoiceCommand(current.chip!)}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-cyan-950/80 hover:bg-cyan-900/80 border border-cyan-500/60 text-cyan-200 text-xs font-semibold shadow-md active:scale-95 transition-all"
            >
              <Sparkles size={13} className="text-cyan-400" />
              <span>Say: "{current.chip}"</span>
            </button>
          </div>
        )}

        {/* Skip Tutorial Button */}
        <div className="pt-2 border-t border-slate-800/80 flex justify-end">
          <button
            onClick={skipTutorial}
            className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-cyan-300 font-mono transition-colors"
          >
            <FastForward size={13} />
            <span>Skip Tutorial to Mission</span>
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect } from 'react';
import { useV2Store } from './game/v2Store';
import { useFlightControls } from './game/useFlightControls';
import { FlightScene } from './scene/FlightScene';
import { V2HUD } from './components/V2HUD';
import { V2CommandBar } from './components/V2CommandBar';
import { TutorialOverlay } from './components/TutorialOverlay';
import { LoadoutModal } from './components/LoadoutModal';
import { EndingModal } from './components/EndingModal';
import { FriendlyErrorToast } from './components/FriendlyErrorToast';
import { MobileControls } from './components/MobileControls';
import { ScareOverlay } from './components/ScareOverlay';
import { StartScreen } from './components/StartScreen';
import { initFlightDebugPanel } from './game/flightDebugPanel';

export function App() {
  const {
    activeScare,
    dismissScare,
    isRecordingVoice,
    startPushToTalk,
    stopPushToTalk,
  } = useV2Store();

  const {
    setMobileJoystick,
    setMobileBoost,
    setMobileBrake,
  } = useFlightControls();

  useEffect(() => {
    initFlightDebugPanel();

    // Hotkey listener for Push-to-Talk ('V' or Space when not in text input)
    let isVDown = false;
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      if ((e.key === 'v' || e.key === 'V') && !isVDown) {
        isVDown = true;
        startPushToTalk();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      if (e.key === 'v' || e.key === 'V') {
        isVDown = false;
        stopPushToTalk();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [startPushToTalk, stopPushToTalk]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-space-950 font-mono text-slate-100 flex flex-col justify-between select-none">
      {/* 0. Mission Start Screen & Audio Unlock Gesture */}
      <StartScreen />

      {/* 1. Real-time 3D Flight Scene with Spring Chase Camera & Dynamic Speed FOV */}
      <FlightScene />

      {/* 2. Top HUD: Summon Charges, Waypoint Arrow, Meters, Controls & Settings */}
      <V2HUD />

      {/* 3. In-Lore Tutorial Overlay (Act 0 with Skip) */}
      <TutorialOverlay />

      {/* 4. Streamlined Mobile Touch Controls (Left Joystick Steer + Boost + Brake + Mic) */}
      <MobileControls
        onJoystick={setMobileJoystick}
        onBoostChange={setMobileBoost}
        onBrakeChange={setMobileBrake}
        isRecording={isRecordingVoice}
        onStartRecording={startPushToTalk}
        onStopRecording={stopPushToTalk}
      />

      {/* 5. Bottom Command Bar: 16 kHz Mono WAV Mic + Text input + Order Chips */}
      <V2CommandBar />

      {/* 6. Mission Design Loadout Modal */}
      <LoadoutModal />

      {/* 7. Endings Modal (Co-Pilot, Professional, Lockout, Lost in the Dark) */}
      <EndingModal />

      {/* 8. Friendly Error Toast ("Comms static. Try again, Commander." + Details toggle) */}
      <FriendlyErrorToast />

      {/* 9. Scare Visual Effects */}
      <ScareOverlay
        scare={activeScare}
        onDismiss={dismissScare}
        volume={0.8}
      />
    </div>
  );
}

export default App;

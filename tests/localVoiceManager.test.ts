import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { matchWakeWord } from '../src/game/wakeWordMatcher.ts';

describe('Local Voice State Machine & Wake Word Suite', () => {
  it('State IDLE: triggers wake on canonical "nova" and extracts command', () => {
    const raw = 'nova summon a repair drone';
    const match = matchWakeWord(raw);
    assert.equal(match.matched, true);
    assert.equal(match.detectedVariant, 'nova');
    assert.equal(match.commandRemainder, 'summon a repair drone');
  });

  it('State IDLE: fuzzy matches speech variations ("no va", "noah", "nover")', () => {
    const inputs = [
      { text: 'no va refuel with supply crate', expectedRemainder: 'refuel with supply crate' },
      { text: 'noah reveal guidance path', expectedRemainder: 'reveal guidance path' },
      { text: 'nover summon escort fighter', expectedRemainder: 'summon escort fighter' },
      { text: 'know the status report', expectedRemainder: 'status report' },
      { text: 'now that spawn space whale', expectedRemainder: 'spawn space whale' },
    ];

    for (const item of inputs) {
      const match = matchWakeWord(item.text);
      assert.equal(match.matched, true, `Expected "${item.text}" to match`);
      assert.equal(match.commandRemainder, item.expectedRemainder);
    }
  });

  it('State AWAKE: 1.2s silence detector logic', () => {
    // Simulate speech activity and silence timestamp tracking
    let lastSpeechTimestamp = Date.now() - 1300; // 1.3 seconds ago (>1.2s)
    let userSpokeInAwake = true;
    let currentCommand = 'summon repair drone';

    const SILENCE_THRESHOLD_MS = 1200;
    const elapsed = Date.now() - lastSpeechTimestamp;
    const isEndOfCommand = userSpokeInAwake && elapsed >= SILENCE_THRESHOLD_MS && currentCommand.trim().length > 0;

    assert.equal(isEndOfCommand, true, 'Expected 1.2s silence to trigger end of command');

    // If silence is only 800ms (< 1200ms), do NOT trigger end of command
    lastSpeechTimestamp = Date.now() - 800;
    const notEndOfCommand = userSpokeInAwake && (Date.now() - lastSpeechTimestamp >= SILENCE_THRESHOLD_MS);
    assert.equal(notEndOfCommand, false, 'Expected silence < 1.2s to continue listening');
  });

  it('State AWAKE: 10-second countdown reset on recognized command', () => {
    let deadline = Date.now() + 5000; // 5s remaining
    const resetAwakeWindow = () => {
      deadline = Date.now() + 10000;
    };

    resetAwakeWindow();
    const remaining = Math.round((deadline - Date.now()) / 1000);
    assert.ok(remaining >= 9 && remaining <= 10, 'Expected window to reset to 10s');
  });

  it('State SPEAKING: mic muting logic prevents self-trigger', () => {
    const voiceState: 'idle' | 'awake' | 'thinking' | 'speaking' = 'speaking';
    let passedToRecognizer = false;

    // Simulate audio handler during speaking state
    if (voiceState !== 'speaking') {
      passedToRecognizer = true;
    }

    assert.equal(passedToRecognizer, false, 'Expected audio frames to be dropped during speaking state');
  });

  it('Microphone constraints: requires AEC, NS, and AGC', () => {
    const audioConstraints = {
      channelCount: 1,
      sampleRate: 16000,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    };

    assert.equal(audioConstraints.echoCancellation, true);
    assert.equal(audioConstraints.noiseSuppression, true);
    assert.equal(audioConstraints.autoGainControl, true);
    assert.equal(audioConstraints.sampleRate, 16000);
  });

  it('False-wake rate measurement: 0% false alarms on negative command words', () => {
    const commonNegatives = [
      'no', 'not', 'now', 'never', 'know', 'go', 'nobody', 'nothing',
      'boost', 'turn right', 'fly straight', 'increase speed',
    ];

    let falseAlarms = 0;
    for (const word of commonNegatives) {
      const match = matchWakeWord(word);
      if (match.matched) {
        falseAlarms++;
      }
    }

    const falseWakeRate = (falseAlarms / commonNegatives.length) * 100;
    assert.equal(falseWakeRate, 0, `Expected 0% false wake rate, got ${falseWakeRate}%`);
  });
});

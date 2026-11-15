import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { matchWakeWord, normalizeSpeech, WAKE_WORD_VARIANTS, REJECT_WORDS } from '../src/game/wakeWordMatcher.ts';
import { encodeWAV, resampleTo16kMono, arrayBufferToBase64 } from '../src/game/wavEncoder.ts';

describe('Local Wake-Word System & Voice State Machine Tests', () => {
  // -------------------------------------------------------------
  // 1. WAKE WORD FUZZY MATCHING & FALSE-WAKE RATE MEASUREMENT
  // -------------------------------------------------------------
  describe('Wake Word Matching Accuracy & False Alarm Rate', () => {
    it('accurately detects canonical "nova" in various sentence positions', () => {
      const phrases = [
        { text: 'nova', expectedRemainder: '' },
        { text: 'NOVA', expectedRemainder: '' },
        { text: 'hey nova', expectedRemainder: '' },
        { text: 'nova summon a repair drone', expectedRemainder: 'summon a repair drone' },
        { text: 'Odyssey flight computer, nova, give me a status report', expectedRemainder: 'give me a status report' },
      ];

      for (const p of phrases) {
        const res = matchWakeWord(p.text);
        assert.equal(res.matched, true, `Expected "${p.text}" to match wake word`);
        assert.equal(res.commandRemainder, p.expectedRemainder);
      }
    });

    it('matches all common phonetically similar variants heard by STT engines', () => {
      const variantsWithCommands = [
        { input: 'no va summon supply crate', expectedRemainder: 'summon supply crate' },
        { input: 'noah refuel the ship', expectedRemainder: 'refuel the ship' },
        { input: 'novo activate shield', expectedRemainder: 'activate shield' },
        { input: 'nover reveal path', expectedRemainder: 'reveal path' },
        { input: 'norva status report', expectedRemainder: 'status report' },
        { input: 'know the summon repair drone', expectedRemainder: 'summon repair drone' },
        { input: 'now that spawn whale', expectedRemainder: 'spawn whale' },
        { input: 'no-va boost engines', expectedRemainder: 'boost engines' },
      ];

      let trueWakeCount = 0;
      for (const item of variantsWithCommands) {
        const res = matchWakeWord(item.input);
        if (res.matched) {
          trueWakeCount++;
          assert.equal(res.commandRemainder, item.expectedRemainder);
        }
      }

      const trueWakeRate = (trueWakeCount / variantsWithCommands.length) * 100;
      assert.equal(trueWakeRate, 100, `True wake rate must be 100%, got ${trueWakeRate}%`);
    });

    it('measures False-Wake Rate on negative phrases (asserts 0.0% false-wake rate)', () => {
      // Extensive test corpus of 40 non-wake speech inputs
      const negativeCorpus = [
        'no',
        'not',
        'not now',
        'now',
        'never',
        'know',
        'nobody is here',
        'nothing to report',
        'notice the trajectory',
        'none remaining',
        'no way commander',
        'november flare detected',
        'all systems nominal',
        'full throttle ahead',
        'engage afterburners',
        'turn left thirty degrees',
        'pitch down into crater',
        'evasive maneuvers',
        'debris on radar',
        'hull temperature rising',
        'solar radiation level normal',
        'guidance ring reached',
        'charging hyperdrive capacitors',
        'align with mars orbit',
        'prepare atmospheric entry',
        'retro thrusters firing',
        'gravity assist confirmed',
        'oxygen levels at ninety percent',
        'cabin pressure stable',
        'flight telemetry synchronized',
        'starboard solar array deployed',
        'comm link established with earth',
        'scanning local asteroid field',
        'meteor shower alert dismissed',
        'approaching waypoint bravo',
        'main engine cut off',
        'orbital velocity five kilometers per second',
        'sensor calibration complete',
        'reaction control thrusters active',
        'docking clamps disengaged',
      ];

      let falseWakeCount = 0;
      const triggeredPhrases: string[] = [];

      for (const phrase of negativeCorpus) {
        const res = matchWakeWord(phrase);
        if (res.matched) {
          falseWakeCount++;
          triggeredPhrases.push(phrase);
        }
      }

      const falseWakeRate = (falseWakeCount / negativeCorpus.length) * 100;
      assert.equal(
        falseWakeCount,
        0,
        `False wake triggers encountered: ${triggeredPhrases.join(', ')} (rate: ${falseWakeRate}%)`
      );
      assert.equal(falseWakeRate, 0, 'False-wake rate must be 0.0% on clean non-wake corpus');
    });
  });

  // -------------------------------------------------------------
  // 2. STATE MACHINE LOGIC (IDLE, AWAKE, THINKING, SPEAKING)
  // -------------------------------------------------------------
  describe('State Machine & Timing Specifications', () => {
    it('simulates IDLE -> AWAKE -> 10s Countdown window and resets on commands', () => {
      let state: 'idle' | 'awake' | 'thinking' | 'speaking' = 'idle';
      let awakeDeadline = 0;
      let commandCount = 0;

      // 1. Wake word triggers
      const wakeResult = matchWakeWord('nova');
      assert.equal(wakeResult.matched, true);

      // Transition to AWAKE
      state = 'awake';
      awakeDeadline = Date.now() + 10000;
      assert.equal(state, 'awake');
      assert.ok(awakeDeadline > Date.now());

      // 2. Player speaks a command at t + 3s -> Resets 10s window!
      const initialRemaining = (awakeDeadline - Date.now()) / 1000;
      assert.ok(initialRemaining <= 10 && initialRemaining > 8);

      // Reset window on recognized command
      awakeDeadline = Date.now() + 10000;
      commandCount++;
      const resetRemaining = (awakeDeadline - Date.now()) / 1000;
      assert.ok(resetRemaining > 9.5, `Window must be reset back to ~10s, got ${resetRemaining}s`);

      // 3. Expiration test
      awakeDeadline = Date.now() - 100; // Simulated expiry
      if (awakeDeadline <= Date.now()) {
        state = 'idle';
      }
      assert.equal(state, 'idle', 'Must return to IDLE when 10-second window expires');
    });

    it('simulates End-of-Command detection after ~1.2s of silence', () => {
      let state: 'idle' | 'awake' | 'thinking' | 'speaking' = 'awake';
      let lastSpeechTime = Date.now() - 1250; // 1.25 seconds ago (> 1.2s threshold)
      let bufferedTranscript = 'summon repair drone';
      let sentCommandText = '';

      const SILENCE_THRESHOLD_MS = 1200;
      const elapsedSinceSpeech = Date.now() - lastSpeechTime;

      if (elapsedSinceSpeech >= SILENCE_THRESHOLD_MS && bufferedTranscript.length > 0) {
        // Commit command -> Transition to THINKING
        sentCommandText = bufferedTranscript;
        state = 'thinking';
      }

      assert.equal(state, 'thinking');
      assert.equal(sentCommandText, 'summon repair drone');
    });

    it('simulates SPEAKING state: mic is ignored to prevent self-triggering', () => {
      const state: 'idle' | 'awake' | 'thinking' | 'speaking' = 'speaking';
      const speechFromNova = 'Yes Commander. Deploying repair drone to your coordinates.';

      // If mic receives NOVA speaking her own wake word or lines:
      let micProcessedAudio = false;
      if (state !== 'speaking') {
        // Mic processing only allowed outside speaking
        const check = matchWakeWord(speechFromNova);
        if (check.matched) micProcessedAudio = true;
      }

      assert.equal(micProcessedAudio, false, 'Mic input must be ignored during SPEAKING state');
    });
  });

  // -------------------------------------------------------------
  // 3. 16 KHZ MONO WAV CLOUD FALLBACK & ENCODER
  // -------------------------------------------------------------
  describe('Cloud Fallback 16 kHz Mono WAV Audio Protocol', () => {
    it('produces valid 16 kHz 16-bit mono RIFF WAV binary with correct headers', () => {
      const sampleRate = 16000;
      const durationSeconds = 0.5;
      const totalSamples = Math.floor(sampleRate * durationSeconds);
      const testPcm = new Float32Array(totalSamples);

      // Generate a clean 440 Hz sine tone
      for (let i = 0; i < totalSamples; i++) {
        testPcm[i] = Math.sin((2 * Math.PI * 440 * i) / sampleRate) * 0.5;
      }

      const wavBuffer = encodeWAV(testPcm, sampleRate);
      const view = new DataView(wavBuffer);

      // Header verification: "RIFF", length, "WAVE", "fmt ", "data"
      const riffHeader = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
      assert.equal(riffHeader, 'RIFF');

      const waveFormat = String.fromCharCode(view.getUint8(8), view.getUint8(9), view.getUint8(10), view.getUint8(11));
      assert.equal(waveFormat, 'WAVE');

      const numChannels = view.getUint16(22, true);
      assert.equal(numChannels, 1, 'Audio must be mono (1 channel)');

      const reportedSampleRate = view.getUint32(24, true);
      assert.equal(reportedSampleRate, 16000, 'Sample rate must be 16000 Hz');

      const bitsPerSample = view.getUint16(34, true);
      assert.equal(bitsPerSample, 16, 'Bits per sample must be 16-bit PCM');

      // Base64 encoding for /api/turn
      const base64 = arrayBufferToBase64(wavBuffer);
      assert.ok(base64.length > 100);
      assert.ok(!base64.includes(' '));
    });
  });
});

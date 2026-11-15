import { flightConfig } from './flightConfig';

class FlightAudioHapticsService {
  private audioCtx: AudioContext | null = null;
  private oscBass: OscillatorNode | null = null;
  private oscHum: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private isRunning: boolean = false;
  private isMuted: boolean = false;

  // Camera Shake Hook State
  private shakeIntensity: number = 0;
  private shakeDecay: number = 5.0;

  public initAudio() {
    if (this.audioCtx || typeof window === 'undefined') return;

    try {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Bass rumble oscillator
      this.oscBass = this.audioCtx.createOscillator();
      this.oscBass.type = 'triangle';
      this.oscBass.frequency.setValueAtTime(55, this.audioCtx.currentTime);

      // Ion hum oscillator
      this.oscHum = this.audioCtx.createOscillator();
      this.oscHum.type = 'sawtooth';
      this.oscHum.frequency.setValueAtTime(110, this.audioCtx.currentTime);

      // Lowpass filter to muffle harsh harmonics into warm rumble
      this.filterNode = this.audioCtx.createBiquadFilter();
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.setValueAtTime(280, this.audioCtx.currentTime);

      // Master engine gain
      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.setValueAtTime(0.001, this.audioCtx.currentTime);

      this.oscBass.connect(this.filterNode);
      this.oscHum.connect(this.filterNode);
      this.filterNode.connect(this.gainNode);
      this.gainNode.connect(this.audioCtx.destination);

      this.oscBass.start();
      this.oscHum.start();
      this.isRunning = true;
    } catch (e) {
      console.warn('AudioContext init deferred until user interaction');
    }
  }

  /**
   * Updates engine volume and pitch tied smoothly to ship velocity
   */
  public updateEngineAudio(currentSpeed: number, maxSpeed: number, isBoosting: boolean) {
    if (!this.isRunning || !this.audioCtx || !this.gainNode || !this.oscBass || !this.oscHum || !this.filterNode) {
      return;
    }

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }

    if (this.isMuted || !flightConfig.engineAudioEnabled) {
      this.gainNode.gain.setTargetAtTime(0.001, this.audioCtx.currentTime, 0.05);
      return;
    }

    const speedRatio = Math.max(0, Math.min(1.5, currentSpeed / (maxSpeed || 25)));

    // Frequency increases with speed
    const bassFreq = 50 + speedRatio * 85 + (isBoosting ? 30 : 0);
    const humFreq = 100 + speedRatio * 160 + (isBoosting ? 60 : 0);
    const filterFreq = 220 + speedRatio * 400 + (isBoosting ? 200 : 0);

    // Volume scales with throttle/speed
    const targetGain = 0.04 + speedRatio * 0.12 + (isBoosting ? 0.08 : 0);

    const now = this.audioCtx.currentTime;
    this.oscBass.frequency.setTargetAtTime(bassFreq, now, 0.08);
    this.oscHum.frequency.setTargetAtTime(humFreq, now, 0.08);
    this.filterNode.frequency.setTargetAtTime(filterFreq, now, 0.08);
    this.gainNode.gain.setTargetAtTime(targetGain, now, 0.06);
  }

  /**
   * Impact / Collision Audio Synthesizer
   */
  public triggerCollisionAudio() {
    if (!this.audioCtx || this.isMuted || !flightConfig.engineAudioEnabled) return;
    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.35);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(now + 0.4);
    } catch {
      // ignore
    }
  }

  /**
   * Pleasant Waypoint Passed Chime
   */
  public triggerWaypointChime() {
    if (!this.audioCtx || this.isMuted || !flightConfig.engineAudioEnabled) return;
    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.1); // A5

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(now + 0.5);
    } catch {
      // ignore
    }
  }

  /**
   * Mobile Haptic Vibrations
   */
  public triggerCollisionHaptic() {
    if (!flightConfig.hapticsEnabled || typeof navigator === 'undefined' || !navigator.vibrate) return;
    try {
      navigator.vibrate([50, 40, 90]);
    } catch {
      // ignore
    }
  }

  public triggerBoostHaptic() {
    if (!flightConfig.hapticsEnabled || typeof navigator === 'undefined' || !navigator.vibrate) return;
    try {
      navigator.vibrate(35);
    } catch {
      // ignore
    }
  }

  public triggerWaypointHaptic() {
    if (!flightConfig.hapticsEnabled || typeof navigator === 'undefined' || !navigator.vibrate) return;
    try {
      navigator.vibrate([25, 30, 45]);
    } catch {
      // ignore
    }
  }

  /**
   * Camera Shake Hook
   */
  public triggerCameraShake(intensity: number = 0.5, decay: number = 6.0) {
    this.shakeIntensity = Math.min(1.5, this.shakeIntensity + intensity);
    this.shakeDecay = decay;
  }

  public updateCameraShake(dt: number): { x: number; y: number } {
    if (this.shakeIntensity <= 0.001) {
      this.shakeIntensity = 0;
      return { x: 0, y: 0 };
    }

    this.shakeIntensity = Math.max(0, this.shakeIntensity - dt * this.shakeDecay);
    const angle = Math.random() * Math.PI * 2;
    const distance = (Math.random() * 0.8 + 0.2) * this.shakeIntensity;

    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
    };
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }
}

export const flightAudioHaptics = new FlightAudioHapticsService();

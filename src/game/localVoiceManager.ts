/**
 * Local Voice & Always-Listening Wake-Word Manager
 *
 * Implements the 4-state local voice system:
 * - IDLE: Listening locally for wake word "NOVA" via Web Worker. Nothing sent to any server.
 * - AWAKE: Wake word triggered. Plays affirmative chime/sound, listens for 10 seconds.
 *          Countdown ring shown. Commands reset the 10-second window.
 *          ~1.2 seconds of silence signals end of command.
 * - THINKING: Command sent to /api/turn as TEXT. 3D flight loop continues at 60 fps.
 * - SPEAKING: NOVA is talking. Mic input ignored so she doesn't trigger herself.
 */

import { matchWakeWord, normalizeSpeech } from './wakeWordMatcher';
import { encodeWAV, resampleTo16kMono, arrayBufferToBase64 } from './wavEncoder';

export type VoiceState = 'idle' | 'awake' | 'thinking' | 'speaking';
export type MicHardwareStatus = 'uninitialized' | 'listening' | 'awake' | 'thinking' | 'speaking' | 'muted' | 'denied' | 'missing';

export interface LocalVoiceListener {
  onStateChange: (state: VoiceState) => void;
  onCountdownUpdate: (secondsRemaining: number) => void;
  onTranscriptUpdate: (text: string, isPartial: boolean) => void;
  onCommandRecognized: (commandText: string) => void;
  onModelProgress?: (pct: number) => void;
  onModelLoaded?: () => void;
  onMicStatusChange?: (status: MicHardwareStatus) => void;
  onError?: (friendlyMessage: string, technicalDetails?: string) => void;
}

export class LocalVoiceManager {
  private state: VoiceState = 'idle';
  private listeners: Set<LocalVoiceListener> = new Set();

  // Audio Context & Stream
  private audioCtx: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private analyserNode: AnalyserNode | null = null;

  // Settings
  private alwaysListening: boolean = true;
  private micHardwareStatus: MicHardwareStatus = 'uninitialized';

  // State Machine Timers & Detection
  private awakeTimeoutTimer: any = null;
  private countdownInterval: any = null;
  private awakeDeadline: number = 0;
  private lastSpeechTimestamp: number = 0;
  private userSpokeInAwake: boolean = false;
  private silenceCheckInterval: any = null;
  private currentCommandTranscript: string = '';

  // Cloud fallback audio buffer (for push-to-talk or fallback)
  private pcmChunks: Float32Array[] = [];
  private isPushToTalkRecording: boolean = false;

  // Vosk Model & Recognizers
  private voskModel: any = null;
  private idleRecognizer: any = null;
  private awakeRecognizer: any = null;
  private isModelLoading: boolean = false;
  private modelLoadProgress: number = 0;
  private modelReady: boolean = false;

  // Silence threshold
  private readonly SILENCE_DURATION_MS = 1200; // ~1.2 seconds of silence per specification
  private readonly SPEECH_RMS_THRESHOLD = 0.012; // Audio energy threshold for speech

  constructor() {}

  public subscribe(listener: LocalVoiceListener): () => void {
    this.listeners.add(listener);
    // Send initial status
    listener.onStateChange(this.state);
    listener.onMicStatusChange?.(this.micHardwareStatus);
    if (this.modelReady) listener.onModelLoaded?.();
    return () => this.listeners.delete(listener);
  }

  public getState(): VoiceState {
    return this.state;
  }

  public getMicStatus(): MicHardwareStatus {
    return this.micHardwareStatus;
  }

  public isModelReady(): boolean {
    return this.modelReady;
  }

  public getModelProgress(): number {
    return this.modelLoadProgress;
  }

  public setAlwaysListening(enabled: boolean) {
    this.alwaysListening = enabled;
    if (!enabled && this.state !== 'speaking' && this.state !== 'thinking') {
      this.transitionTo('idle');
      this.updateMicStatus('muted');
    } else if (enabled && this.mediaStream) {
      this.updateMicStatus(this.state === 'idle' ? 'listening' : (this.state as MicHardwareStatus));
    }
  }

  public isAlwaysListeningEnabled(): boolean {
    return this.alwaysListening;
  }

  /**
   * Initializes audio on user gesture (Start button), requests mic permission with required constraints
   */
  public async initializeWithUserGesture(): Promise<void> {
    if (this.mediaStream) return;

    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass({ sampleRate: 16000 });
        if (this.audioCtx.state === 'suspended') {
          await this.audioCtx.resume();
        }
      }

      // Hardware mic stream with AEC, NS, and AGC per specification
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      this.setupAudioGraph();
      this.updateMicStatus(this.alwaysListening ? 'listening' : 'muted');

      // Start background model loading
      this.loadVoskModelInBackground();
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        this.updateMicStatus('denied');
        this.emitError(
          'Microphone permission was denied. Please allow microphone access in your browser settings to speak to NOVA, or continue using text orders.',
          err.message
        );
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        this.updateMicStatus('missing');
        this.emitError(
          'No microphone device found on this system. You can issue orders using keyboard, mouse, or order chips.',
          err.message
        );
      } else {
        this.updateMicStatus('denied');
        this.emitError(
          'Comms static: Audio subsystem unavailable. Text orders and push-to-talk remain active.',
          err.message
        );
      }
    }
  }

  /**
   * Set up Web Audio pipeline (source -> analyser -> script processor -> destination)
   */
  private setupAudioGraph() {
    if (!this.audioCtx || !this.mediaStream) return;

    this.sourceNode = this.audioCtx.createMediaStreamSource(this.mediaStream);
    this.analyserNode = this.audioCtx.createAnalyser();
    this.analyserNode.fftSize = 512;

    this.processorNode = this.audioCtx.createScriptProcessor(4096, 1, 1);
    this.processorNode.onaudioprocess = (e) => {
      this.handleAudioProcess(e);
    };

    this.sourceNode.connect(this.analyserNode);
    this.analyserNode.connect(this.processorNode);
    this.processorNode.connect(this.audioCtx.destination);
  }

  /**
   * Continuous audio frame handler
   */
  private handleAudioProcess(e: AudioProcessingEvent) {
    // 1. In SPEAKING state: Ignore mic entirely so NOVA never triggers herself
    if (this.state === 'speaking') {
      return;
    }

    const inputData = e.inputBuffer.getChannelData(0);

    // Buffer PCM for push-to-talk or cloud fallback if active
    if (this.isPushToTalkRecording) {
      this.pcmChunks.push(new Float32Array(inputData));
    }

    // 2. Measure audio energy (RMS)
    let sum = 0;
    for (let i = 0; i < inputData.length; i++) {
      sum += inputData[i] * inputData[i];
    }
    const rms = Math.sqrt(sum / inputData.length);

    if (rms > this.SPEECH_RMS_THRESHOLD) {
      this.lastSpeechTimestamp = Date.now();
      if (this.state === 'awake') {
        this.userSpokeInAwake = true;
      }
    }

    // 3. Process recognition if always-listening is enabled or awake
    if (this.alwaysListening || this.state === 'awake' || this.isPushToTalkRecording) {
      this.feedAudioToRecognizer(inputData);
    }
  }

  /**
   * Feeds audio chunks to active recognizer in Web Worker
   */
  private feedAudioToRecognizer(floatData: Float32Array) {
    if (!this.modelReady) return;

    if (this.state === 'idle' && this.idleRecognizer) {
      try {
        this.idleRecognizer.acceptWaveformFloat(floatData, 16000);
      } catch {
        // Safe failover
      }
    } else if (this.state === 'awake' && this.awakeRecognizer) {
      try {
        this.awakeRecognizer.acceptWaveformFloat(floatData, 16000);
      } catch {
        // Safe failover
      }
    }
  }

  /**
   * Background loader for Vosk model with 0..100% progress tracking and CacheStorage caching
   */
  private async loadVoskModelInBackground() {
    if (this.isModelLoading || this.modelReady) return;
    this.isModelLoading = true;

    try {
      const modelUrl = '/models/vosk-model-small-en-us-0.15.tar.gz';
      const modelBlobUrl = await this.fetchModelWithProgress(modelUrl, (pct) => {
        this.modelLoadProgress = pct;
        this.listeners.forEach((l) => l.onModelProgress?.(pct));
      });

      // Dynamically import vosk-browser
      const VoskModule = await import('vosk-browser');
      const createModel = VoskModule.createModel || (VoskModule as any).default?.createModel;

      if (!createModel) {
        throw new Error('Could not find createModel export in vosk-browser');
      }

      this.voskModel = await createModel(modelBlobUrl, 0);

      // Create IDLE restricted-grammar recognizer: "nova" variants + unknown
      const idleGrammar = JSON.stringify([
        'nova',
        'no va',
        'noah',
        'novo',
        'nover',
        'now that',
        'know the',
        'no one',
        '[unk]',
      ]);

      this.idleRecognizer = new this.voskModel.KaldiRecognizer(16000, idleGrammar);
      this.setupIdleRecognizerListeners();

      // Create AWAKE open-vocabulary recognizer
      this.awakeRecognizer = new this.voskModel.KaldiRecognizer(16000);
      this.setupAwakeRecognizerListeners();

      this.modelReady = true;
      this.isModelLoading = false;
      this.modelLoadProgress = 100;
      this.listeners.forEach((l) => l.onModelLoaded?.());
    } catch (err: any) {
      this.isModelLoading = false;
      // Do not crash or block game; fallback paths remain active
      console.warn('Vosk local model notice (cloud fallback ready):', err);
    }
  }

  /**
   * Fetches the model with streaming progress and CacheStorage persistence
   */
  private async fetchModelWithProgress(
    url: string,
    onProgress: (pct: number) => void
  ): Promise<string> {
    const CACHE_NAME = 'nova-local-voice-v2';

    // 1. Check browser CacheStorage first for instantaneous cache hit
    if (typeof window !== 'undefined' && 'caches' in window) {
      try {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(url);
        if (cachedResponse) {
          const blob = await cachedResponse.blob();
          onProgress(100);
          return URL.createObjectURL(blob);
        }
      } catch {
        // Ignore cache lookup error and fallback to fetch
      }
    }

    // 2. Fetch with ReadableStream progress tracking
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load voice model from ${url} (status: ${response.status})`);
    }

    const contentLength = parseInt(response.headers.get('content-length') || '41138088', 10);
    const reader = response.body?.getReader();

    if (!reader) {
      const blob = await response.blob();
      onProgress(100);
      return URL.createObjectURL(blob);
    }

    let receivedLength = 0;
    const chunks: BlobPart[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      chunks.push(value);
      receivedLength += value.length;

      const pct = Math.min(99, Math.round((receivedLength / contentLength) * 100));
      onProgress(pct);
    }

    const blob = new Blob(chunks, { type: 'application/gzip' });
    onProgress(100);

    // Save into CacheStorage for subsequent visits
    if (typeof window !== 'undefined' && 'caches' in window) {
      try {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(url, new Response(blob));
      } catch {
        // Cache write failed silently
      }
    }

    return URL.createObjectURL(blob);
  }

  /**
   * Listeners for IDLE restricted-grammar recognizer
   */
  private setupIdleRecognizerListeners() {
    if (!this.idleRecognizer) return;

    this.idleRecognizer.on('result', (msg: any) => {
      if (this.state !== 'idle') return;
      const text = msg?.result?.text || '';
      if (!text) return;

      const match = matchWakeWord(text);
      if (match.matched) {
        this.triggerWake(match.commandRemainder);
      }
    });

    this.idleRecognizer.on('partialresult', (msg: any) => {
      if (this.state !== 'idle') return;
      const partial = msg?.result?.partial || '';
      if (!partial) return;

      const match = matchWakeWord(partial);
      if (match.matched) {
        this.triggerWake(match.commandRemainder);
      }
    });
  }

  /**
   * Listeners for AWAKE open-vocabulary recognizer
   */
  private setupAwakeRecognizerListeners() {
    if (!this.awakeRecognizer) return;

    this.awakeRecognizer.on('result', (msg: any) => {
      if (this.state !== 'awake') return;
      const text = (msg?.result?.text || '').trim();
      if (text) {
        this.currentCommandTranscript = text;
        this.listeners.forEach((l) => l.onTranscriptUpdate(text, false));
        // Reset 10-second countdown on recognized command/speech
        this.resetAwakeWindow();
      }
    });

    this.awakeRecognizer.on('partialresult', (msg: any) => {
      if (this.state !== 'awake') return;
      const partial = (msg?.result?.partial || '').trim();
      if (partial) {
        this.currentCommandTranscript = partial;
        this.listeners.forEach((l) => l.onTranscriptUpdate(partial, true));
        this.resetAwakeWindow();
      }
    });
  }

  /**
   * Wake-word triggered -> Transition to AWAKE state
   */
  public triggerWake(initialRemainder?: string) {
    if (this.state === 'speaking') return; // Mute check

    this.transitionTo('awake');
    this.playWakeAffirmativeSound();

    this.currentCommandTranscript = (initialRemainder || '').trim();
    this.userSpokeInAwake = Boolean(this.currentCommandTranscript);
    this.lastSpeechTimestamp = Date.now();

    this.startAwakeWindowCountdown();
    this.startSilenceDetector();

    if (this.currentCommandTranscript) {
      this.listeners.forEach((l) => l.onTranscriptUpdate(this.currentCommandTranscript, false));
    }
  }

  /**
   * Plays sci-fi affirmative chime and short line "Yes, Commander?"
   */
  private playWakeAffirmativeSound() {
    // 1. Immediate Web Audio oscillator chime (<10ms latency)
    if (this.audioCtx && this.audioCtx.state === 'running') {
      try {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        const now = this.audioCtx.currentTime;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.12); // G5

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(now);
        osc.stop(now + 0.36);
      } catch {
        // Audio output safe catch
      }
    }
  }

  /**
   * 10-second countdown window in AWAKE state
   */
  private startAwakeWindowCountdown() {
    this.awakeDeadline = Date.now() + 10000;

    if (this.countdownInterval) clearInterval(this.countdownInterval);
    if (this.awakeTimeoutTimer) clearTimeout(this.awakeTimeoutTimer);

    this.countdownInterval = setInterval(() => {
      if (this.state !== 'awake') {
        clearInterval(this.countdownInterval);
        return;
      }

      const remainingSec = Math.max(0, (this.awakeDeadline - Date.now()) / 1000);
      this.listeners.forEach((l) => l.onCountdownUpdate(remainingSec));

      if (remainingSec <= 0) {
        clearInterval(this.countdownInterval);
        this.timeoutAwakeWindow();
      }
    }, 100);
  }

  /**
   * Resets the 10-second window when a command or speech is received
   */
  public resetAwakeWindow() {
    if (this.state === 'awake') {
      this.awakeDeadline = Date.now() + 10000;
    }
  }

  /**
   * Periodic check for ~1.2 seconds of silence as end of command
   */
  private startSilenceDetector() {
    if (this.silenceCheckInterval) clearInterval(this.silenceCheckInterval);

    this.silenceCheckInterval = setInterval(() => {
      if (this.state !== 'awake') {
        clearInterval(this.silenceCheckInterval);
        return;
      }

      const elapsedSinceSpeech = Date.now() - this.lastSpeechTimestamp;

      // End of command condition:
      // Player spoke in awake state, and ~1.2s of silence has passed, and we have text!
      if (this.userSpokeInAwake && elapsedSinceSpeech >= this.SILENCE_DURATION_MS) {
        if (this.currentCommandTranscript.trim().length > 0) {
          this.commitCommand(this.currentCommandTranscript.trim());
        }
      }
    }, 150);
  }

  /**
   * Commits command, sends as TEXT to /api/turn, transitions to THINKING
   */
  private commitCommand(commandText: string) {
    if (this.silenceCheckInterval) clearInterval(this.silenceCheckInterval);
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    if (this.awakeTimeoutTimer) clearTimeout(this.awakeTimeoutTimer);

    // Reset awake recognizer buffer for next command
    if (this.awakeRecognizer) {
      try {
        this.awakeRecognizer.retrieveFinalResult();
      } catch {
        // ignore
      }
    }

    this.transitionTo('thinking');
    this.listeners.forEach((l) => l.onCommandRecognized(commandText));
    this.currentCommandTranscript = '';
    this.userSpokeInAwake = false;
  }

  /**
   * Window expired without command -> Go back to IDLE
   */
  private timeoutAwakeWindow() {
    if (this.state === 'awake') {
      this.transitionTo('idle');
      this.currentCommandTranscript = '';
      this.userSpokeInAwake = false;
    }
  }

  /**
   * Called by backend / state when NOVA starts speaking
   */
  public onNovaSpeakingStart() {
    this.transitionTo('speaking');
  }

  /**
   * Called when NOVA finishes speaking
   */
  public onNovaSpeakingEnd() {
    if (this.state === 'speaking') {
      // Return to IDLE
      this.transitionTo('idle');
    }
  }

  /**
   * Push-to-talk start (always available)
   */
  public async startPushToTalk(): Promise<void> {
    if (!this.mediaStream) {
      await this.initializeWithUserGesture();
    }
    this.isPushToTalkRecording = true;
    this.pcmChunks = [];
    this.currentCommandTranscript = '';
    this.triggerWake();
  }

  /**
   * Push-to-talk stop (always available, creates 16 kHz mono WAV base64 if needed)
   */
  public async stopPushToTalk(): Promise<{ text?: string; audioWavBase64?: string }> {
    this.isPushToTalkRecording = false;

    // Small delay for final frames
    await new Promise((r) => setTimeout(r, 100));

    const recognized = this.currentCommandTranscript.trim();

    let audioWavBase64: string | undefined = undefined;

    // Consolidate PCM for cloud fallback
    let totalSamples = 0;
    for (const chunk of this.pcmChunks) {
      totalSamples += chunk.length;
    }

    if (totalSamples > 0 && this.audioCtx) {
      const mergedPcm = new Float32Array(totalSamples);
      let offset = 0;
      for (const chunk of this.pcmChunks) {
        mergedPcm.set(chunk, offset);
        offset += chunk.length;
      }

      try {
        const audioBuffer = this.audioCtx.createBuffer(1, totalSamples, this.audioCtx.sampleRate);
        audioBuffer.copyToChannel(mergedPcm, 0);
        const resampled16k = resampleTo16kMono(audioBuffer, 16000);
        const wavBuffer = encodeWAV(resampled16k, 16000);
        audioWavBase64 = arrayBufferToBase64(wavBuffer);
      } catch {
        // encode error notice
      }
    }

    if (recognized) {
      this.commitCommand(recognized);
    } else {
      this.transitionTo('idle');
    }

    return {
      text: recognized || undefined,
      audioWavBase64,
    };
  }

  /**
   * State transition helper
   */
  private transitionTo(newState: VoiceState) {
    this.state = newState;
    this.listeners.forEach((l) => l.onStateChange(newState));

    if (this.mediaStream) {
      if (newState === 'speaking') {
        this.updateMicStatus('speaking');
      } else if (newState === 'thinking') {
        this.updateMicStatus('thinking');
      } else if (newState === 'awake') {
        this.updateMicStatus('awake');
      } else {
        this.updateMicStatus(this.alwaysListening ? 'listening' : 'muted');
      }
    }
  }

  private updateMicStatus(status: MicHardwareStatus) {
    this.micHardwareStatus = status;
    this.listeners.forEach((l) => l.onMicStatusChange?.(status));
  }

  private emitError(friendly: string, technical?: string) {
    this.listeners.forEach((l) => l.onError?.(friendly, technical));
  }

  /**
   * Browser SpeechSynthesis for speaking NOVA lines
   */
  public speak(
    text: string,
    options: {
      volume?: number;
      rate?: number;
      pitch?: number;
      onStart?: () => void;
      onEnd?: () => void;
    } = {}
  ) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*_#`~[\]]/g, '').trim();
    if (!cleanText) return;

    this.onNovaSpeakingStart();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.volume = options.volume ?? 1.0;
    utterance.rate = options.rate ?? 1.05;
    utterance.pitch = options.pitch ?? 1.15;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice =
      voices.find(
        (v) =>
          (v.name.includes('Google') ||
            v.name.includes('Samantha') ||
            v.name.includes('Zira') ||
            v.name.includes('Natural')) &&
          v.lang.startsWith('en')
      ) || voices.find((v) => v.lang.startsWith('en'));

    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onstart = () => {
      this.onNovaSpeakingStart();
      options.onStart?.();
    };

    const handleFinish = () => {
      this.onNovaSpeakingEnd();
      options.onEnd?.();
    };

    utterance.onend = handleFinish;
    utterance.onerror = handleFinish;

    window.speechSynthesis.speak(utterance);
  }

  public stopSpeaking() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      this.onNovaSpeakingEnd();
    }
  }

  public destroy() {
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    if (this.silenceCheckInterval) clearInterval(this.silenceCheckInterval);
    if (this.awakeTimeoutTimer) clearTimeout(this.awakeTimeoutTimer);

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode = null;
    }
    if (this.audioCtx) {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }
  }
}

export const localVoiceManager = new LocalVoiceManager();

import { encodeWAV, resampleTo16kMono, arrayBufferToBase64 } from './wavEncoder';

export interface VoiceResult {
  text?: string;
  audioWavBase64?: string;
  usedWavAudio: boolean;
}

export class VoiceManagerV2 {
  private mediaStream: MediaStream | null = null;
  private audioCtx: AudioContext | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private pcmChunks: Float32Array[] = [];
  private isRecording: boolean = false;
  private maxDurationTimer: any = null;
  private speechRecognition: any = null;
  private recognizedText: string = '';
  private fallbackToWav: boolean = false;

  constructor() {
    this.initSpeechRecognition();
  }

  private initSpeechRecognition() {
    if (typeof window === 'undefined') return;
    const win = window as any;
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (SpeechRecognitionClass) {
      try {
        this.speechRecognition = new SpeechRecognitionClass();
        this.speechRecognition.continuous = false;
        this.speechRecognition.interimResults = false;
        this.speechRecognition.lang = 'en-US';

        this.speechRecognition.onresult = (event: any) => {
          if (event.results && event.results[0] && event.results[0][0]) {
            this.recognizedText = event.results[0][0].transcript;
          }
        };

        this.speechRecognition.onerror = (event: any) => {
          // If network or service errors occur (common in IDE preview or Firefox),
          // silently switch to direct WAV recording without showing raw errors to user.
          if (
            event.error === 'network' ||
            event.error === 'service-not-allowed' ||
            event.error === 'not-allowed'
          ) {
            this.fallbackToWav = true;
          }
        };
      } catch (e) {
        this.fallbackToWav = true;
      }
    } else {
      this.fallbackToWav = true;
    }
  }

  /**
   * Starts audio recording (and speech recognition if available)
   */
  public async startCapture(): Promise<void> {
    if (this.isRecording) return;
    this.isRecording = true;
    this.recognizedText = '';
    this.pcmChunks = [];

    // Start browser speech recognition in parallel if not previously disabled
    if (this.speechRecognition && !this.fallbackToWav) {
      try {
        this.speechRecognition.start();
      } catch {
        this.fallbackToWav = true;
      }
    }

    // Simultaneously capture microphone stream for direct 16 kHz WAV encoding
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = this.audioCtx.createMediaStreamSource(this.mediaStream);

      // Buffer PCM samples (bufferSize = 4096)
      this.scriptProcessor = this.audioCtx.createScriptProcessor(4096, 1, 1);
      this.scriptProcessor.onaudioprocess = (e) => {
        if (!this.isRecording) return;
        const channelData = e.inputBuffer.getChannelData(0);
        this.pcmChunks.push(new Float32Array(channelData));
      };

      source.connect(this.scriptProcessor);
      this.scriptProcessor.connect(this.audioCtx.destination);

      // Auto-stop after 8 seconds max duration cap per V2 contract
      this.maxDurationTimer = setTimeout(() => {
        if (this.isRecording) {
          this.stopCapture();
        }
      }, 8000);
    } catch (err: any) {
      this.isRecording = false;
      this.cleanupStream();
      throw err;
    }
  }

  /**
   * Stops recording and returns transcribed text and/or 16 kHz mono WAV base64
   */
  public async stopCapture(): Promise<VoiceResult> {
    if (!this.isRecording) {
      return { text: this.recognizedText, usedWavAudio: false };
    }

    this.isRecording = false;
    if (this.maxDurationTimer) clearTimeout(this.maxDurationTimer);

    if (this.speechRecognition) {
      try {
        this.speechRecognition.stop();
      } catch {
        // ignore
      }
    }

    // Small delay to allow final audio frames to process
    await new Promise((resolve) => setTimeout(resolve, 120));

    // Consolidate PCM buffers
    let totalSamples = 0;
    for (const chunk of this.pcmChunks) {
      totalSamples += chunk.length;
    }

    let audioWavBase64: string | undefined = undefined;

    if (totalSamples > 0 && this.audioCtx) {
      const mergedPcm = new Float32Array(totalSamples);
      let offset = 0;
      for (const chunk of this.pcmChunks) {
        mergedPcm.set(chunk, offset);
        offset += chunk.length;
      }

      // Create an AudioBuffer and resample to 16 kHz mono
      try {
        const audioBuffer = this.audioCtx.createBuffer(1, totalSamples, this.audioCtx.sampleRate);
        audioBuffer.copyToChannel(mergedPcm, 0);
        const resampled16k = resampleTo16kMono(audioBuffer, 16000);
        const wavBuffer = encodeWAV(resampled16k, 16000);
        audioWavBase64 = arrayBufferToBase64(wavBuffer);
      } catch (encodeErr) {
        console.warn('WAV encoding notice:', encodeErr);
      }
    }

    this.cleanupStream();

    const hasText = Boolean(this.recognizedText && this.recognizedText.trim().length > 0);

    return {
      text: hasText ? this.recognizedText.trim() : undefined,
      audioWavBase64: audioWavBase64,
      usedWavAudio: !hasText && Boolean(audioWavBase64),
    };
  }

  public getIsRecording(): boolean {
    return this.isRecording;
  }

  private cleanupStream() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor = null;
    }
    if (this.audioCtx) {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }
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

    utterance.onstart = () => options.onStart?.();
    utterance.onend = () => options.onEnd?.();
    utterance.onerror = () => options.onEnd?.();

    window.speechSynthesis.speak(utterance);
  }

  public stopSpeaking() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }
}

export const voiceManagerV2 = new VoiceManagerV2();

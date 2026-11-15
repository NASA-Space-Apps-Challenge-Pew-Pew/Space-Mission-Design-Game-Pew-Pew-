/**
 * Voice synthesis and recognition utilities
 */

// Speech Recognition interface for browsers supporting webkitSpeechRecognition
interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export class VoiceController {
  private recognition: any | null = null;
  private isListening: boolean = false;
  private onTranscriptCallback: ((text: string, isFinal: boolean) => void) | null = null;
  private onStatusChangeCallback: ((listening: boolean) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;

  constructor() {
    this.initRecognition();
  }

  private initRecognition() {
    if (typeof window === 'undefined') return;

    const win = window as unknown as IWindow;
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      console.warn('Speech Recognition not supported in this browser. Fallback to text input.');
      return;
    }

    try {
      this.recognition = new SpeechRecognitionClass();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        this.isListening = true;
        this.onStatusChangeCallback?.(true);
      };

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const text = finalTranscript || interimTranscript;
        this.onTranscriptCallback?.(text, Boolean(finalTranscript));
      };

      this.recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        this.isListening = false;
        this.onStatusChangeCallback?.(false);
        if (event.error === 'not-allowed') {
          this.onErrorCallback?.('Microphone access denied. Please allow microphone permissions or type instead.');
        } else if (event.error !== 'no-speech') {
          this.onErrorCallback?.(`Mic error: ${event.error}`);
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.onStatusChangeCallback?.(false);
      };
    } catch (e: any) {
      console.warn('Failed to initialize speech recognition:', e);
    }
  }

  public isSupported(): boolean {
    return this.recognition !== null;
  }

  public startListening(
    onTranscript: (text: string, isFinal: boolean) => void,
    onStatusChange: (listening: boolean) => void,
    onError: (error: string) => void
  ) {
    if (!this.recognition) {
      onError('Speech recognition not available. Please use keyboard input.');
      return;
    }

    this.onTranscriptCallback = onTranscript;
    this.onStatusChangeCallback = onStatusChange;
    this.onErrorCallback = onError;

    try {
      this.recognition.start();
    } catch (e: any) {
      console.warn('Recognition start caught error:', e);
      // Restart if already running
      try {
        this.recognition.stop();
        setTimeout(() => this.recognition.start(), 150);
      } catch {
        // ignore
      }
    }
  }

  public stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }
    }
    this.isListening = false;
    this.onStatusChangeCallback?.(false);
  }

  /**
   * Speaks text using the browser's SpeechSynthesis
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

    // Cancel any previous speech
    window.speechSynthesis.cancel();

    const cleanText = text.replace(/[*_#`~[\]]/g, '').trim();
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.volume = options.volume ?? 1.0;
    utterance.rate = options.rate ?? 1.05;
    utterance.pitch = options.pitch ?? 1.15; // Slightly higher pitch for AI assistant feel

    // Try to pick a natural English voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      v =>
        (v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Zira') || v.name.includes('Natural')) &&
        v.lang.startsWith('en')
    ) || voices.find(v => v.lang.startsWith('en'));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      options.onStart?.();
    };

    utterance.onend = () => {
      options.onEnd?.();
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e);
      options.onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
  }

  public stopSpeaking() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }
}

export const voiceController = new VoiceController();

import { create } from 'zustand';
import {
  GameState,
  HistoryItem,
  INITIAL_GAME_STATE,
  ScareEvent,
  GameSettings,
  ActionRecord,
  TurnRequest
} from './types';
import { sendTurnApi } from './api';
import { voiceController } from './voice';

interface GameStore {
  state: GameState;
  history: HistoryItem[];
  loading: boolean;
  error: string | null;
  settings: GameSettings;
  activeScare: ScareEvent | null;
  isListening: boolean;
  isNovaSpeaking: boolean;
  transcriptInput: string;
  lastActions: ActionRecord[];

  // Actions
  setTranscriptInput: (input: string) => void;
  sendTurn: (customText?: string) => Promise<void>;
  startVoiceInput: () => void;
  stopVoiceInput: () => void;
  updateSettings: (partial: Partial<GameSettings>) => void;
  clearError: () => void;
  dismissScare: () => void;
  triggerScare: (scare: ScareEvent) => void;
  resetGame: () => void;
}

const DEFAULT_SETTINGS: GameSettings = {
  scareLevel: 1,
  volume: 0.8,
  voiceEnabled: true,
  autoSpeak: true,
};

export const useGameStore = create<GameStore>((set, get) => ({
  state: INITIAL_GAME_STATE,
  history: [
    {
      role: 'nova',
      text: "NOVA online. Welcome, Commander. All ship systems nominal in Earth orbit. Choose our launch window to Mars whenever you're ready.",
      responseType: 'grant',
      timestamp: Date.now(),
    },
  ],
  loading: false,
  error: null,
  settings: DEFAULT_SETTINGS,
  activeScare: null,
  isListening: false,
  isNovaSpeaking: false,
  transcriptInput: '',
  lastActions: [],

  setTranscriptInput: (transcriptInput: string) => set({ transcriptInput }),

  sendTurn: async (customText?: string) => {
    const { transcriptInput, state, history, settings, loading } = get();
    const textToSend = (customText !== undefined ? customText : transcriptInput).trim();

    if (!textToSend || loading) return;

    // Clear text field & mark loading
    set({
      transcriptInput: '',
      loading: true,
      error: null,
      history: [
        ...history,
        {
          role: 'player',
          text: textToSend,
          timestamp: Date.now(),
        },
      ],
    });

    const turnRequest: TurnRequest = {
      playerText: textToSend,
      snapshot: {
        act: 0,
        objective: state.objective?.text || 'Explore and navigate',
        hullPct: state.resources.hullPct,
        fuelPct: Math.round(state.resources.fuelKg / 10),
        summonCharges: 5,
        maxSummonCharges: 5,
        trust: state.nova.trust,
        mood: state.nova.mood,
        liveEntities: {},
        nearestHazardMeters: 500,
        recentEvents: []
      },
      history: get().history.slice(-8),
      settings: { scareLevel: settings.scareLevel },
      state,
    };

    try {
      const response = await sendTurnApi(turnRequest);

      // Handle response
      set((s) => ({
        state: response.state ?? s.state,
        lastActions: response.actions ?? [],
        history: [
          ...s.history,
          {
            role: 'nova',
            text: response.nova.line,
            responseType: response.nova.responseType,
            timestamp: Date.now(),
          },
        ],
        activeScare: response.scare,
        error: response.error,
        loading: false,
      }));

      // Auto-speak response if enabled
      if (settings.voiceEnabled && settings.autoSpeak && response.nova.line) {
        set({ isNovaSpeaking: true });
        voiceController.speak(response.nova.line, {
          volume: settings.volume,
          onStart: () => set({ isNovaSpeaking: true }),
          onEnd: () => set({ isNovaSpeaking: false }),
        });
      }
    } catch (err: any) {
      set({
        loading: false,
        error: err.message || 'An error occurred during turn execution.',
      });
    }
  },

  startVoiceInput: () => {
    const { isListening } = get();
    if (isListening) return;

    voiceController.startListening(
      (text: string, isFinal: boolean) => {
        set({ transcriptInput: text });
        if (isFinal && text.trim()) {
          get().sendTurn(text);
          get().stopVoiceInput();
        }
      },
      (listening: boolean) => {
        set({ isListening: listening });
      },
      (err: string) => {
        set({ error: `Mic error: ${err}`, isListening: false });
      }
    );
  },

  stopVoiceInput: () => {
    voiceController.stopListening();
    set({ isListening: false });
  },

  updateSettings: (partial: Partial<GameSettings>) => {
    set((s) => ({
      settings: { ...s.settings, ...partial },
      state: {
        ...s.state,
        scareLevel: partial.scareLevel !== undefined ? partial.scareLevel : s.state.scareLevel,
      },
    }));
  },

  clearError: () => set({ error: null }),

  dismissScare: () => set({ activeScare: null }),

  triggerScare: (scare: ScareEvent) => {
    const { settings } = get();
    if (settings.scareLevel > 0) {
      set({ activeScare: scare });
    }
  },

  resetGame: () => {
    voiceController.stopSpeaking();
    voiceController.stopListening();
    set({
      state: INITIAL_GAME_STATE,
      history: [
        {
          role: 'nova',
          text: "NOVA online. Welcome, Commander. All ship systems nominal in Earth orbit. Choose our launch window to Mars whenever you're ready.",
          responseType: 'grant',
          timestamp: Date.now(),
        },
      ],
      loading: false,
      error: null,
      activeScare: null,
      isListening: false,
      isNovaSpeaking: false,
      transcriptInput: '',
      lastActions: [],
    });
  },
}));

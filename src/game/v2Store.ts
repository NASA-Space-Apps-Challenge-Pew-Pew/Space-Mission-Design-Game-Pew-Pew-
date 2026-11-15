import { create } from 'zustand';
import {
  ActId,
  GameEntity,
  EntityPreset,
  EntitySkin,
  EntityBehavior,
  EntityEffect,
  PlayerFlightState,
  V2Loadout,
  Waypoint,
  V2GameSnapshot,
  V2Ending,
  V2TurnResponse,
} from './v2Types';
import { NovaMood, NovaResponseType, ScareEvent, HistoryItem } from './types';
import { sendV2TurnApi } from './v2ApiClient';
import { voiceManagerV2 } from './voiceV2';
import { localVoiceManager, VoiceState, MicHardwareStatus } from './localVoiceManager';
import { stepFlightPhysics, FlightKinematics, FlightInputState } from './flightModel';
import { flightConfig } from './flightConfig';
import { flightAudioHaptics } from './flightAudioHaptics';

interface V2StoreState {
  // Game progression
  act: ActId;
  objective: string;
  tutorialStep: number; // 0..5
  tutorialComplete: boolean;
  isPaused: boolean;
  gameStatus: 'playing' | 'won' | 'lost';
  activeEnding: V2Ending | null;
  loadoutModalOpen: boolean;
  loadout: V2Loadout;

  // Real-time Flight State
  player: PlayerFlightState;
  entities: GameEntity[];
  summonCharges: number;
  maxSummonCharges: number;
  chargeRegenProgress: number; // 0..1

  // Waypoints
  waypoints: Waypoint[];
  activeWaypointIndex: number;

  // AI & Narrative
  trust: number;
  mood: NovaMood;
  history: HistoryItem[];
  isNovaThinking: boolean;
  isNovaSpeaking: boolean;
  lastNovaLine: string;
  lastResponseType: NovaResponseType;
  activeScare: ScareEvent | null;

  // Voice & Wake-Word
  voiceState: VoiceState;
  awakeCountdown: number; // 0..10.0s
  modelLoadingProgress: number | null;
  modelReady: boolean;
  alwaysListening: boolean;
  micStatus: MicHardwareStatus;
  isMissionStarted: boolean;
  isRecordingVoice: boolean;
  voiceTranscriptInput: string;
  friendlyError: { friendly: string; technical?: string } | null;

  // Checkpoints
  checkpointAct: ActId;

  // Actions
  startMission: () => Promise<void>;
  setAlwaysListening: (enabled: boolean) => void;
  triggerWake: () => void;
  startPushToTalk: () => Promise<void>;
  stopPushToTalk: () => Promise<void>;
  updatePhysics: (dt: number, inputs: FlightInputState) => void;
  sendVoiceCommand: (textOverride?: string, audioBase64?: string) => Promise<void>;
  startVoiceRecording: () => Promise<void>;
  stopVoiceRecording: () => Promise<void>;
  skipTutorial: () => void;
  advanceTutorialStep: () => void;
  setLoadout: (loadout: V2Loadout) => void;
  dismissScare: () => void;
  clearError: () => void;
  restoreCheckpoint: () => void;
  restartGame: () => void;
  spawnEntitySafe: (entity: Partial<GameEntity> & { skin: EntitySkin; behavior: EntityBehavior; label: string }) => void;
}

const DEFAULT_LOADOUT: V2Loadout = {
  fuelTank: 1,
  hullArmor: 1,
  sciencePayload: 1,
  summonCharges: 1,
};

const INITIAL_WAYPOINTS: Waypoint[] = [
  // Act 0 Tutorial rings - spaced gently so players can finish under 60 seconds
  { id: 'tut_1', position: [0, 0, -50], radius: 7, label: 'Guidance Ring Alpha', act: 0, reached: false },
  { id: 'tut_2', position: [4, 2, -130], radius: 7, label: 'Guidance Ring Beta', act: 0, reached: false },
  // Act 1 Debris Field Escape
  { id: 'deb_1', position: [-20, 2, -240], radius: 9, label: 'Debris Gate 1', act: 1, reached: false },
  { id: 'deb_2', position: [15, -4, -360], radius: 9, label: 'Debris Gate 2', act: 1, reached: false },
  { id: 'deb_3', position: [0, 0, -500], radius: 10, label: 'Escape Threshold', act: 1, reached: false },
  // Act 2 Transit Corridor
  { id: 'trans_1', position: [10, 8, -680], radius: 11, label: 'Hohmann Transit Arc 1', act: 2, reached: false },
  { id: 'trans_2', position: [-15, -6, -850], radius: 11, label: 'Hohmann Transit Arc 2', act: 2, reached: false },
  // Act 3 Mars Arrival
  { id: 'mars_1', position: [0, 10, -1020], radius: 13, label: 'Mars Orbit Entry', act: 3, reached: false },
  { id: 'mars_2', position: [0, -10, -1180], radius: 15, label: 'Atmospheric Descent Flare', act: 3, reached: false },
  // Act 4 Surface
  { id: 'mars_surface', position: [0, 0, -1320], radius: 20, label: 'Jezero Crater Landing Zone', act: 4, reached: false },
];

function computeMood(trust: number): NovaMood {
  if (trust >= 70) return 'playful';
  if (trust >= 40) return 'calm';
  if (trust >= 15) return 'annoyed';
  return 'cold';
}

export const useV2Store = create<V2StoreState>((set, get) => ({
  act: 0,
  objective: 'Rebooting systems: Fly through Guidance Ring Alpha',
  tutorialStep: 1,
  tutorialComplete: false,
  isPaused: false,
  gameStatus: 'playing',
  activeEnding: null,
  loadoutModalOpen: false,
  loadout: DEFAULT_LOADOUT,

  player: {
    position: [0, 0, 0],
    velocity: [0, 0, 0],
    rotation: [0, 0, 0],
    angularVelocity: [0, 0, 0],
    speed: 0,
    hullPct: 100,
    fuelPct: 100,
    shieldSeconds: 0,
    boostMultiplier: 1.0,
    isBoosting: false,
    isBraking: false,
    controlsRestricted: false,
  },

  entities: [],
  summonCharges: 3,
  maxSummonCharges: 5,
  chargeRegenProgress: 0,

  waypoints: INITIAL_WAYPOINTS,
  activeWaypointIndex: 0,

  trust: 60,
  mood: 'calm',
  history: [
    {
      role: 'nova',
      text: "Systems coming online, Commander. Odyssey-1 reboot sequence active. Move forward through Guidance Ring Alpha.",
      responseType: 'grant',
    },
  ],
  isNovaThinking: false,
  isNovaSpeaking: false,
  lastNovaLine: "Systems coming online, Commander. Odyssey-1 reboot sequence active. Move forward through Guidance Ring Alpha.",
  lastResponseType: 'grant',
  activeScare: null,

  voiceState: 'idle',
  awakeCountdown: 10,
  modelLoadingProgress: null,
  modelReady: false,
  alwaysListening: true,
  micStatus: 'uninitialized',
  isMissionStarted: false,
  isRecordingVoice: false,
  voiceTranscriptInput: '',
  friendlyError: null,
  checkpointAct: 0,

  startMission: async () => {
    set({ isMissionStarted: true });
    await localVoiceManager.initializeWithUserGesture();
  },

  setAlwaysListening: (enabled: boolean) => {
    localVoiceManager.setAlwaysListening(enabled);
    set({
      alwaysListening: enabled,
      micStatus: localVoiceManager.getMicStatus(),
    });
  },

  triggerWake: () => {
    localVoiceManager.triggerWake();
  },

  startPushToTalk: async () => {
    try {
      await localVoiceManager.startPushToTalk();
      set({ isRecordingVoice: true, friendlyError: null });
    } catch (err: any) {
      set({
        isRecordingVoice: false,
        friendlyError: {
          friendly: "Comms static. Try again, Commander.",
          technical: err.message || 'Push-to-talk error',
        },
      });
    }
  },

  stopPushToTalk: async () => {
    set({ isRecordingVoice: false });
    try {
      const result = await localVoiceManager.stopPushToTalk();
      if (result.text || result.audioWavBase64) {
        await get().sendVoiceCommand(result.text, result.audioWavBase64);
      }
    } catch (err: any) {
      set({
        friendlyError: {
          friendly: "Comms static. Try again, Commander.",
          technical: err.message || 'Audio processing failure',
        },
      });
    }
  },

  clearError: () => set({ friendlyError: null }),
  dismissScare: () => set({ activeScare: null }),

  skipTutorial: () => {
    set((state) => ({
      act: 1,
      tutorialStep: 5,
      tutorialComplete: true,
      objective: 'Escape the Debris Field: Fly through the navigational gates',
      loadoutModalOpen: true,
      checkpointAct: 1,
      player: {
        ...state.player,
        position: [0, 0, -180],
        velocity: [0, 0, -15],
      },
      activeWaypointIndex: 2,
    }));
  },

  advanceTutorialStep: () => {
    const { tutorialStep } = get();
    if (tutorialStep === 1) {
      set({
        tutorialStep: 2,
        objective: 'Hold BOOST (Shift on desktop, BOOST button on mobile) to reach Guidance Ring Beta',
      });
    } else if (tutorialStep === 2) {
      set({
        tutorialStep: 3,
        objective: 'Say: "NOVA, summon a supply crate" or use order chip',
      });
    } else if (tutorialStep === 3) {
      set({
        tutorialStep: 4,
        objective: 'Hull took damage in reboot. Ask NOVA: "Repair hull"',
      });
    } else if (tutorialStep === 4) {
      set({
        tutorialStep: 5,
        objective: 'Creative summon: Ask NOVA for anything (e.g., "summon a space whale")',
      });
    } else {
      set({
        act: 1,
        tutorialComplete: true,
        loadoutModalOpen: true,
        objective: 'Escape the Debris Field: Navigate through the gates',
        checkpointAct: 1,
      });
    }
  },

  setLoadout: (loadout: V2Loadout) => {
    set((state) => ({
      loadout,
      loadoutModalOpen: false,
      maxSummonCharges: 4 + loadout.summonCharges,
      player: {
        ...state.player,
        hullPct: Math.min(100, 90 + loadout.hullArmor * 10),
        fuelPct: Math.min(100, 90 + loadout.fuelTank * 10),
      },
    }));
  },

  spawnEntitySafe: (entityData) => {
    const { entities, player } = get();
    let currentEntities = [...entities];
    if (currentEntities.length >= 12) {
      const removeIndex = currentEntities.findIndex((e) => e.behavior !== 'hazard');
      if (removeIndex >= 0) {
        currentEntities.splice(removeIndex, 1);
      } else {
        currentEntities.shift();
      }
    }

    const id = `entity_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newEntity: GameEntity = {
      id,
      skin: entityData.skin,
      behavior: entityData.behavior,
      label: entityData.label,
      effect: entityData.effect || 'none',
      position: entityData.position || [
        player.position[0] + (Math.random() - 0.5) * 16,
        player.position[1] + (Math.random() - 0.5) * 8,
        player.position[2] - 22,
      ],
      velocity: entityData.velocity || [0, 0, 0],
      rotation: [0, 0, 0],
      radius: entityData.radius || 2.5,
      createdAt: Date.now(),
      lifetimeMs: entityData.lifetimeMs,
      hp: entityData.hp || 100,
    };

    set({ entities: [...currentEntities, newEntity] });
  },

  updatePhysics: (dt: number, inputs: FlightInputState) => {
    const {
      player,
      entities,
      waypoints,
      activeWaypointIndex,
      summonCharges,
      maxSummonCharges,
      chargeRegenProgress,
      act,
      tutorialStep,
      tutorialComplete,
      trust,
      gameStatus,
    } = get();

    if (gameStatus !== 'playing') return;

    // 1. Charge regeneration
    let nextCharges = summonCharges;
    let nextRegen = chargeRegenProgress + dt / 20;
    if (nextRegen >= 1.0) {
      if (nextCharges < maxSummonCharges) nextCharges += 1;
      nextRegen = 0;
    }

    // 2. Flight Dynamics via new Flight Model (Turn rates, angular velocity, drag, assist)
    const activeWaypoint = waypoints[activeWaypointIndex];
    const targetWpPos = activeWaypoint && !activeWaypoint.reached ? activeWaypoint.position : null;

    const currentKinematics: FlightKinematics = {
      position: player.position,
      velocity: player.velocity,
      rotation: player.rotation,
      angularVelocity: player.angularVelocity,
      speed: player.speed,
    };

    const newKinematics = stepFlightPhysics(
      currentKinematics,
      inputs,
      targetWpPos,
      dt,
      flightConfig
    );

    // Audio & Haptics tied to flight state
    flightAudioHaptics.updateEngineAudio(newKinematics.speed, flightConfig.maxSpeed, inputs.boost);
    if (inputs.boost && newKinematics.speed > 5) {
      flightAudioHaptics.triggerBoostHaptic();
    }

    // Fuel burn when boosting
    let nextFuel = player.fuelPct;
    if (inputs.boost && newKinematics.speed > 5) {
      nextFuel = Math.max(0, nextFuel - dt * 0.28);
    }

    let nextShield = Math.max(0, player.shieldSeconds - dt);
    let nextHull = player.hullPct;
    const updatedEntities: GameEntity[] = [];

    const [px, py, pz] = newKinematics.position;

    // 3. Entity behaviors & Collision
    for (const ent of entities) {
      let [ex, ey, ez] = ent.position;
      let [evx, evy, evz] = ent.velocity;

      if (ent.behavior === 'follow') {
        const dx = px - ex;
        const dy = py - ey;
        const dz = pz - 8 - ez;
        ex += dx * dt * 1.6;
        ey += dy * dt * 1.6;
        ez += dz * dt * 1.6;

        if (ent.effect === 'heal' && nextHull < 100) {
          nextHull = Math.min(100, nextHull + dt * 1.8);
        }
      } else if (ent.behavior === 'orbit') {
        const angle = (Date.now() / 1000) * 1.2;
        ex = px + Math.cos(angle) * 12;
        ez = pz + Math.sin(angle) * 12;
        ey = py + Math.sin(angle * 2) * 3;
      } else if (ent.behavior === 'hazard') {
        ex += evx * dt;
        ey += evy * dt;
        ez += evz * dt;
      }

      const dist = Math.sqrt((px - ex) ** 2 + (py - ey) ** 2 + (pz - ez) ** 2);

      if (dist < ent.radius + 2.0) {
        if (ent.behavior === 'collect') {
          if (ent.effect === 'fuel') {
            nextFuel = Math.min(100, nextFuel + 25);
          }
          flightAudioHaptics.triggerWaypointChime();
          continue; // Despawn collected
        }

        if (ent.behavior === 'hazard') {
          if (nextShield <= 0) {
            nextHull = Math.max(0, nextHull - 15);
            flightAudioHaptics.triggerCollisionHaptic();
            flightAudioHaptics.triggerCollisionAudio();
            flightAudioHaptics.triggerCameraShake(0.85, 5.0);
          }
          continue; // Despawn hit asteroid
        }
      }

      updatedEntities.push({
        ...ent,
        position: [ex, ey, ez],
        velocity: [evx, evy, evz],
      });
    }

    // 4. Waypoint detection
    let nextWpIdx = activeWaypointIndex;
    if (nextWpIdx < waypoints.length) {
      const targetWp = waypoints[nextWpIdx];
      const distToWp = Math.sqrt(
        (px - targetWp.position[0]) ** 2 +
          (py - targetWp.position[1]) ** 2 +
          (pz - targetWp.position[2]) ** 2
      );

      if (distToWp <= targetWp.radius + 3.0) {
        waypoints[nextWpIdx].reached = true;
        nextWpIdx = Math.min(waypoints.length - 1, nextWpIdx + 1);

        flightAudioHaptics.triggerWaypointHaptic();
        flightAudioHaptics.triggerWaypointChime();
        flightAudioHaptics.triggerCameraShake(0.25, 4.0);

        if (act === 0 && !tutorialComplete) {
          if (tutorialStep === 1) get().advanceTutorialStep();
          else if (tutorialStep === 2) get().advanceTutorialStep();
        }

        if (targetWp.id === 'deb_3' && act === 1) {
          set({
            act: 2,
            checkpointAct: 2,
            objective: 'Interplanetary Transit Corridor: Follow the Hohmann Transfer Arc',
          });
        } else if (targetWp.id === 'trans_2' && act === 2) {
          set({
            act: 3,
            checkpointAct: 3,
            objective: 'Mars Arrival: Execute atmospheric descent alignment',
          });
        } else if (targetWp.id === 'mars_surface') {
          let ending: V2Ending = 'professional';
          if (trust >= 70) ending = 'copilot';
          else if (trust >= 40) ending = 'professional';
          else ending = 'lockout';

          set({
            gameStatus: 'won',
            activeEnding: ending,
            objective: 'Touchdown confirmed at Jezero Crater! Telemetry received.',
          });
        }
      }
    }

    // Loss condition check
    if (nextHull <= 0 || (nextFuel <= 0 && nextCharges <= 0 && newKinematics.speed < 0.5)) {
      set({
        gameStatus: 'lost',
        activeEnding: 'lost_in_the_dark',
      });
    }

    set({
      player: {
        ...player,
        position: newKinematics.position,
        velocity: newKinematics.velocity,
        rotation: newKinematics.rotation,
        angularVelocity: newKinematics.angularVelocity,
        speed: newKinematics.speed,
        hullPct: nextHull,
        fuelPct: nextFuel,
        shieldSeconds: nextShield,
        isBoosting: inputs.boost,
        isBraking: inputs.brake,
      },
      entities: updatedEntities,
      summonCharges: nextCharges,
      chargeRegenProgress: nextRegen,
      activeWaypointIndex: nextWpIdx,
    });
  },

  startVoiceRecording: async () => {
    await get().startPushToTalk();
  },

  stopVoiceRecording: async () => {
    await get().stopPushToTalk();
  },

  sendVoiceCommand: async (textOverride?: string, audioBase64?: string) => {
    const {
      act,
      objective,
      player,
      summonCharges,
      maxSummonCharges,
      trust,
      mood,
      entities,
      history,
      tutorialStep,
      tutorialComplete,
    } = get();

    const text = (textOverride || '').trim();
    if (!text && !audioBase64) return;

    set({ isNovaThinking: true, friendlyError: null });

    const playerMsg: HistoryItem = { role: 'player', text: text || '[Voice Transmission Encoded]' };
    const updatedHistory = [...history, playerMsg];
    set({ history: updatedHistory });

    const liveEntitiesCount: Record<string, number> = {};
    for (const ent of entities) {
      liveEntitiesCount[ent.skin] = (liveEntitiesCount[ent.skin] || 0) + 1;
    }

    const snapshot: V2GameSnapshot = {
      act,
      objective,
      hullPct: Math.round(player.hullPct),
      fuelPct: Math.round(player.fuelPct),
      summonCharges,
      maxSummonCharges,
      trust,
      mood,
      liveEntities: liveEntitiesCount,
      nearestHazardMeters: 45,
      recentEvents: [],
    };

    try {
      const response = await sendV2TurnApi({
        playerText: text || undefined,
        audio: audioBase64 ? { mimeType: 'audio/wav', base64: audioBase64 } : undefined,
        snapshot,
        history: updatedHistory.slice(-8),
        settings: { scareLevel: 1 },
      });

      const newTrust = Math.max(0, Math.min(100, trust + (response.trustDelta || 0)));
      const newMood = computeMood(newTrust);

      if (response.actions) {
        for (const actCmd of response.actions) {
          if (actCmd.name === 'spawn_entity') {
            const { preset, custom } = actCmd.args;
            if (preset === 'repair_drone') {
              get().spawnEntitySafe({
                skin: 'ship',
                behavior: 'follow',
                label: 'Autonomous Repair Drone',
                effect: 'heal',
              });
            } else if (preset === 'supply_crate') {
              get().spawnEntitySafe({
                skin: 'crate',
                behavior: 'collect',
                label: 'Hypergolic Propellant Canister',
                effect: 'fuel',
              });
            } else if (preset === 'escort_fighter') {
              get().spawnEntitySafe({
                skin: 'ship',
                behavior: 'follow',
                label: 'Escort Wingman Drone',
                effect: 'shield',
              });
            } else if (custom) {
              get().spawnEntitySafe({
                skin: custom.skin,
                behavior: custom.behavior,
                label: custom.label || 'Summoned Entity',
                effect: custom.effect || 'none',
              });
            }
          } else if (actCmd.name === 'repair_ship') {
            const amount = Number(actCmd.args.amount) || 20;
            set((s) => ({
              player: { ...s.player, hullPct: Math.min(100, s.player.hullPct + amount) },
            }));
          } else if (actCmd.name === 'refuel') {
            const amount = Number(actCmd.args.amount) || 25;
            set((s) => ({
              player: { ...s.player, fuelPct: Math.min(100, s.player.fuelPct + amount) },
            }));
          } else if (actCmd.name === 'grant_shield') {
            const seconds = Number(actCmd.args.seconds) || 6;
            set((s) => ({
              player: { ...s.player, shieldSeconds: s.player.shieldSeconds + seconds },
            }));
          }
        }
      }

      if (act === 0 && !tutorialComplete) {
        if (tutorialStep === 3) get().advanceTutorialStep();
        else if (tutorialStep === 4) get().advanceTutorialStep();
        else if (tutorialStep === 5) get().advanceTutorialStep();
      }

      const novaMsg: HistoryItem = {
        role: 'nova',
        text: response.nova.line,
        responseType: response.nova.responseType,
      };

      set({
        history: [...updatedHistory, novaMsg],
        trust: newTrust,
        mood: newMood,
        lastNovaLine: response.nova.line,
        lastResponseType: response.nova.responseType,
        isNovaThinking: false,
        activeScare: response.scare || null,
      });

      localVoiceManager.speak(response.nova.line, {
        onStart: () => set({ isNovaSpeaking: true, voiceState: 'speaking' }),
        onEnd: () => set({ isNovaSpeaking: false, voiceState: 'idle' }),
      });
    } catch (err: any) {
      set({
        isNovaThinking: false,
        voiceState: 'idle',
        friendlyError: {
          friendly: "Comms static. Try again, Commander.",
          technical: err.message || 'API processing fault',
        },
      });
    }
  },

  restoreCheckpoint: () => {
    const { checkpointAct, loadout } = get();
    let resetPos: [number, number, number] = [0, 0, 0];
    let resetWpIdx = 0;

    if (checkpointAct === 1) {
      resetPos = [0, 0, -180];
      resetWpIdx = 2;
    } else if (checkpointAct === 2) {
      resetPos = [0, 0, -560];
      resetWpIdx = 5;
    } else if (checkpointAct === 3) {
      resetPos = [0, 0, -920];
      resetWpIdx = 7;
    }

    set((state) => ({
      gameStatus: 'playing',
      activeEnding: null,
      act: checkpointAct,
      activeWaypointIndex: resetWpIdx,
      player: {
        position: resetPos,
        velocity: [0, 0, -15],
        rotation: [0, 0, 0],
        angularVelocity: [0, 0, 0],
        speed: 15,
        hullPct: 80 + loadout.hullArmor * 10,
        fuelPct: 80 + loadout.fuelTank * 10,
        shieldSeconds: 0,
        boostMultiplier: 1.0,
        isBoosting: false,
        isBraking: false,
        controlsRestricted: false,
      },
      summonCharges: 3,
    }));
  },

  restartGame: () => {
    localVoiceManager.stopSpeaking();
    set({
      act: 0,
      objective: 'Rebooting systems: Fly through Guidance Ring Alpha',
      tutorialStep: 1,
      tutorialComplete: false,
      gameStatus: 'playing',
      activeEnding: null,
      loadoutModalOpen: false,
      activeWaypointIndex: 0,
      trust: 60,
      mood: 'calm',
      summonCharges: 3,
      voiceState: 'idle',
      awakeCountdown: 10,
      player: {
        position: [0, 0, 0],
        velocity: [0, 0, 0],
        rotation: [0, 0, 0],
        angularVelocity: [0, 0, 0],
        speed: 0,
        hullPct: 100,
        fuelPct: 100,
        shieldSeconds: 0,
        boostMultiplier: 1.0,
        isBoosting: false,
        isBraking: false,
        controlsRestricted: false,
      },
      entities: [],
      friendlyError: null,
    });
  },
}));

// Wire up localVoiceManager events directly into Zustand state
if (typeof window !== 'undefined') {
  localVoiceManager.subscribe({
    onStateChange: (state) => {
      useV2Store.setState({
        voiceState: state,
        isNovaThinking: state === 'thinking',
        isNovaSpeaking: state === 'speaking',
      });
    },
    onCountdownUpdate: (secondsRemaining) => {
      useV2Store.setState({ awakeCountdown: secondsRemaining });
    },
    onTranscriptUpdate: (text, isPartial) => {
      useV2Store.setState({ voiceTranscriptInput: text });
    },
    onCommandRecognized: (commandText) => {
      useV2Store.getState().sendVoiceCommand(commandText);
    },
    onModelProgress: (pct) => {
      useV2Store.setState({ modelLoadingProgress: pct });
    },
    onModelLoaded: () => {
      useV2Store.setState({ modelReady: true, modelLoadingProgress: null });
    },
    onMicStatusChange: (status) => {
      useV2Store.setState({ micStatus: status });
    },
    onError: (friendly, technical) => {
      useV2Store.setState({
        friendlyError: { friendly, technical },
      });
    },
  });
}


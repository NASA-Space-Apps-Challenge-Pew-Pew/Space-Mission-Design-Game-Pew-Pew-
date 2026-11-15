import type {
  ClientSnapshot,
  Mood,
  PresetEntity,
  EntitySkin,
  EntityBehavior,
  EntityEffect,
  PlacementType,
  HazardType,
  ScareType,
  ActionRecord,
  ScarePayload,
  TurnSettings,
} from './types.ts';

export const PRESET_CHARGE_COSTS: Record<PresetEntity, number> = {
  supply_crate: 1,
  repair_drone: 2,
  escort_fighter: 2,
  beacon_satellite: 1,
  wormhole_shortcut: 4,
  derelict_ship: 2,
  asteroids: 0,
  ghost_ship: 0,
};

export const ACTION_CHARGE_COSTS: Record<string, number> = {
  repair_ship: 2,
  refuel: 1,
  grant_boost: 1,
  grant_shield: 2,
  reveal_path: 1,
  status_report: 0,
  despawn_entity: 0,
  set_hazard: 0,
  restrict_controls: 0,
  trigger_scare: 0,
  adjust_trust: 0,
};

export const MAX_LIVE_ENTITIES = 12;
export const MAX_SPAWN_COUNT = 5;

export function calculateMood(trust: number): Mood {
  if (trust >= 70) return 'playful';
  if (trust >= 40) return 'calm';
  if (trust >= 15) return 'annoyed';
  return 'cold';
}

export function applyAction(state: any, action: any): any {
  return { state, ok: true, note: '' };
}

export function createInitialState(act: number = 0): any {
  return createInitialSnapshot(act);
}

export function createInitialSnapshot(act: number = 0): ClientSnapshot {
  return {
    act,
    objective:
      act === 0
        ? 'Initialize flight systems and navigate through guidance rings'
        : 'Escape the orbital debris field',
    hullPct: 100,
    fuelPct: 100,
    summonCharges: 5,
    maxSummonCharges: 5,
    trust: 60,
    mood: 'calm',
    liveEntities: {},
    nearestHazardMeters: 500,
    recentEvents: [],
  };
}

export function countLiveEntities(liveEntities: Record<string, number> = {}): number {
  return Object.values(liveEntities).reduce((acc, count) => {
    return acc + (typeof count === 'number' && count > 0 ? count : 0);
  }, 0);
}

export interface ValidationResult {
  action: ActionRecord;
  ok: boolean;
  note: string;
  chargeCost: number;
  trustDelta: number;
  scare: ScarePayload | null;
}

export function validateAction(
  action: { name: string; args?: Record<string, unknown> },
  snapshot: ClientSnapshot,
  settings?: TurnSettings,
  remainingCharges: number = snapshot.summonCharges
): ValidationResult {
  const name = action.name;
  const args = action.args || {};
  const act = snapshot.act ?? 0;
  const scareLevel = settings?.scareLevel !== undefined ? settings.scareLevel : 1;

  let ok = true;
  let note = '';
  let chargeCost = 0;
  let trustDelta = 0;
  let scare: ScarePayload | null = null;
  const validatedArgs: Record<string, unknown> = { ...args };

  switch (name) {
    case 'spawn_entity': {
      // 1. Check act gating
      if (args.preset === 'wormhole_shortcut' && act < 2) {
        return {
          action: { name, args, ok: false, note: 'Wormhole shortcuts are locked until Act 2 (Transit Corridor).' },
          ok: false,
          note: 'Wormhole shortcuts are locked until Act 2 (Transit Corridor).',
          chargeCost: 0,
          trustDelta: 0,
          scare: null,
        };
      }

      // 2. Arg validation and count clamping
      let count = Math.round(Number(args.count ?? 1));
      if (isNaN(count) || count < 1) count = 1;
      if (count > MAX_SPAWN_COUNT) count = MAX_SPAWN_COUNT;

      // 3. Entity cap check (Max 12)
      const currentTotal = countLiveEntities(snapshot.liveEntities);
      const availableCapacity = Math.max(0, MAX_LIVE_ENTITIES - currentTotal);
      if (availableCapacity <= 0) {
        return {
          action: { name, args, ok: false, note: `Entity ceiling reached (${MAX_LIVE_ENTITIES} active). Cannot spawn more.` },
          ok: false,
          note: `Entity ceiling reached (${MAX_LIVE_ENTITIES} active). Cannot spawn more.`,
          chargeCost: 0,
          trustDelta: 0,
          scare: null,
        };
      }
      if (count > availableCapacity) {
        count = availableCapacity;
      }
      validatedArgs.count = count;

      // Placement validation
      const validPlacements: PlacementType[] = ['ahead', 'around', 'behind', 'near_player', 'near_target'];
      const placement = String(args.placement || 'near_player') as PlacementType;
      validatedArgs.placement = validPlacements.includes(placement) ? placement : 'near_player';

      // 4. Preset vs Custom evaluation
      if (args.preset) {
        const preset = String(args.preset) as PresetEntity;
        const validPresets: PresetEntity[] = [
          'supply_crate',
          'repair_drone',
          'escort_fighter',
          'beacon_satellite',
          'wormhole_shortcut',
          'derelict_ship',
          'asteroids',
          'ghost_ship',
        ];
        if (!validPresets.includes(preset)) {
          return {
            action: { name, args, ok: false, note: `Unknown entity preset '${preset}'.` },
            ok: false,
            note: `Unknown entity preset '${preset}'.`,
            chargeCost: 0,
            trustDelta: 0,
            scare: null,
          };
        }

        // ScareLevel check for ghost ship
        if (preset === 'ghost_ship' && scareLevel < 2) {
          return {
            action: { name, args, ok: false, note: 'Ghost ship scare requires scareLevel 2.' },
            ok: false,
            note: 'Ghost ship scare requires scareLevel 2.',
            chargeCost: 0,
            trustDelta: 0,
            scare: null,
          };
        }

        validatedArgs.preset = preset;
        chargeCost = PRESET_CHARGE_COSTS[preset] * count;
      } else if (args.custom && typeof args.custom === 'object') {
        const c = args.custom as Record<string, unknown>;
        const validSkins: EntitySkin[] = ['orb', 'crate', 'rock', 'ship', 'creature', 'station'];
        const validBehaviors: EntityBehavior[] = ['follow', 'orbit', 'collect', 'hazard', 'decor', 'shoot'];
        const validEffects: EntityEffect[] = ['heal', 'fuel', 'shield', 'reveal_path', 'none'];

        const skin = validSkins.includes(String(c.skin) as EntitySkin) ? (String(c.skin) as EntitySkin) : 'orb';
        const behavior = validBehaviors.includes(String(c.behavior) as EntityBehavior)
          ? (String(c.behavior) as EntityBehavior)
          : 'follow';
        const effect = validEffects.includes(String(c.effect) as EntityEffect)
          ? (String(c.effect) as EntityEffect)
          : 'none';
        const label = String(c.label || 'Custom Entity').slice(0, 30);

        validatedArgs.custom = { skin, behavior, label, effect };
        chargeCost = effect === 'none' ? 1 * count : 2 * count;
      } else {
        // Default to supply_crate
        validatedArgs.preset = 'supply_crate';
        chargeCost = 1 * count;
      }

      // 5. Charge cost enforcement
      if (chargeCost > remainingCharges) {
        // Exception: Act 0 tutorial step or high trust (>=75) gift
        if (act === 0 || snapshot.trust >= 75) {
          chargeCost = remainingCharges; // Give on the house
          note = `Spawned ${count}x ${validatedArgs.preset || 'custom entity'} (gifted by NOVA).`;
        } else {
          return {
            action: {
              name,
              args: validatedArgs,
              ok: false,
              note: `Insufficient summon charges. Required: ${chargeCost}, available: ${remainingCharges}.`,
            },
            ok: false,
            note: `Insufficient summon charges. Required: ${chargeCost}, available: ${remainingCharges}.`,
            chargeCost: 0,
            trustDelta: 0,
            scare: null,
          };
        }
      } else {
        note = `Spawned ${count}x ${validatedArgs.preset || 'custom entity'} at ${validatedArgs.placement} (Cost: ${chargeCost} charges).`;
      }
      break;
    }

    case 'despawn_entity': {
      note = `Despawned entities: ${args.preset || args.id || 'all'}.`;
      break;
    }

    case 'repair_ship': {
      let amount = Number(args.amount ?? 20);
      if (isNaN(amount) || amount < 0) amount = 0;
      if (amount > 40) amount = 40;
      validatedArgs.amount = Math.round(amount);
      chargeCost = ACTION_CHARGE_COSTS.repair_ship;

      if (chargeCost > remainingCharges && act !== 0 && snapshot.trust < 75) {
        return {
          action: { name, args: validatedArgs, ok: false, note: `Insufficient charges to repair ship (requires 2).` },
          ok: false,
          note: `Insufficient charges to repair ship (requires 2).`,
          chargeCost: 0,
          trustDelta: 0,
          scare: null,
        };
      }
      note = `Hull restored by ${validatedArgs.amount}%.`;
      break;
    }

    case 'refuel': {
      let amount = Number(args.amount ?? 25);
      if (isNaN(amount) || amount < 0) amount = 0;
      if (amount > 40) amount = 40;
      validatedArgs.amount = Math.round(amount);
      chargeCost = ACTION_CHARGE_COSTS.refuel;

      if (chargeCost > remainingCharges && act !== 0 && snapshot.trust < 75) {
        return {
          action: { name, args: validatedArgs, ok: false, note: `Insufficient charges to refuel (requires 1).` },
          ok: false,
          note: `Insufficient charges to refuel (requires 1).`,
          chargeCost: 0,
          trustDelta: 0,
          scare: null,
        };
      }
      note = `Fuel tanks replenished by ${validatedArgs.amount}%.`;
      break;
    }

    case 'grant_boost': {
      let seconds = Math.round(Number(args.seconds ?? 5));
      if (isNaN(seconds) || seconds < 1) seconds = 1;
      if (seconds > 10) seconds = 10;
      validatedArgs.seconds = seconds;
      chargeCost = ACTION_CHARGE_COSTS.grant_boost;

      if (chargeCost > remainingCharges && act !== 0 && snapshot.trust < 75) {
        return {
          action: { name, args: validatedArgs, ok: false, note: `Insufficient charges for boost (requires 1).` },
          ok: false,
          note: `Insufficient charges for boost (requires 1).`,
          chargeCost: 0,
          trustDelta: 0,
          scare: null,
        };
      }
      note = `Supercharged thruster boost granted for ${seconds} seconds.`;
      break;
    }

    case 'grant_shield': {
      let seconds = Math.round(Number(args.seconds ?? 6));
      if (isNaN(seconds) || seconds < 1) seconds = 1;
      if (seconds > 10) seconds = 10;
      validatedArgs.seconds = seconds;
      chargeCost = ACTION_CHARGE_COSTS.grant_shield;

      if (chargeCost > remainingCharges && act !== 0 && snapshot.trust < 75) {
        return {
          action: { name, args: validatedArgs, ok: false, note: `Insufficient charges for shield (requires 2).` },
          ok: false,
          note: `Insufficient charges for shield (requires 2).`,
          chargeCost: 0,
          trustDelta: 0,
          scare: null,
        };
      }
      note = `Deflector shield activated for ${seconds} seconds.`;
      break;
    }

    case 'set_hazard': {
      if (act === 0 || act === 4) {
        return {
          action: { name, args, ok: false, note: `Hazard fields cannot be manifested during Act ${act}.` },
          ok: false,
          note: `Hazard fields cannot be manifested during Act ${act}.`,
          chargeCost: 0,
          trustDelta: 0,
          scare: null,
        };
      }
      const validHazards: HazardType[] = ['solar_flare', 'meteor_shower', 'dust'];
      const type = validHazards.includes(String(args.type) as HazardType)
        ? (String(args.type) as HazardType)
        : 'meteor_shower';
      let intensity = Math.round(Number(args.intensity ?? 1));
      if (intensity < 1) intensity = 1;
      if (intensity > 3) intensity = 3;
      validatedArgs.type = type;
      validatedArgs.intensity = intensity;
      note = `Environmental hazard field triggered: ${type} at level ${intensity}.`;
      break;
    }

    case 'reveal_path': {
      chargeCost = ACTION_CHARGE_COSTS.reveal_path;
      if (chargeCost > remainingCharges && act !== 0 && snapshot.trust < 75) {
        return {
          action: { name, args, ok: false, note: `Insufficient charges to reveal path (requires 1).` },
          ok: false,
          note: `Insufficient charges to reveal path (requires 1).`,
          chargeCost: 0,
          trustDelta: 0,
          scare: null,
        };
      }
      note = 'Optimal navigation corridor illuminated with beacon rings.';
      break;
    }

    case 'restrict_controls': {
      if (act === 0) {
        return {
          action: { name, args, ok: false, note: 'Controls cannot be restricted in tutorial (Act 0).' },
          ok: false,
          note: 'Controls cannot be restricted in tutorial (Act 0).',
          chargeCost: 0,
          trustDelta: 0,
          scare: null,
        };
      }
      if (snapshot.trust >= 25) {
        return {
          action: { name, args, ok: false, note: `Control restrictions refused: trust is sufficient (${snapshot.trust} >= 25).` },
          ok: false,
          note: `Control restrictions refused: trust is sufficient (${snapshot.trust} >= 25).`,
          chargeCost: 0,
          trustDelta: 0,
          scare: null,
        };
      }
      let seconds = Math.round(Number(args.seconds ?? 5));
      if (seconds < 1) seconds = 1;
      if (seconds > 10) seconds = 10;
      validatedArgs.control = 'boost';
      validatedArgs.seconds = seconds;
      note = `Emergency override: ${validatedArgs.control} restricted for ${seconds} seconds.`;
      break;
    }

    case 'trigger_scare': {
      if (scareLevel === 0) {
        return {
          action: { name, args, ok: false, note: 'Scares are disabled in settings (scareLevel: 0).' },
          ok: false,
          note: 'Scares are disabled in settings (scareLevel: 0).',
          chargeCost: 0,
          trustDelta: 0,
          scare: null,
        };
      }
      const rawType = String(args.type || 'flicker') as ScareType;
      let durationMs = Math.round(Number(args.durationMs ?? 2000));
      if (durationMs < 500) durationMs = 500;
      if (durationMs > 5000) durationMs = 5000;

      let type: ScareType = rawType;
      if (scareLevel === 1 && (type === 'blackout' || type === 'silhouette')) {
        type = 'flicker';
      }

      scare = { type, durationMs };
      validatedArgs.type = type;
      validatedArgs.durationMs = durationMs;
      note = `Scare effect triggered: ${type} (${durationMs}ms).`;
      break;
    }

    case 'adjust_trust': {
      let delta = Math.round(Number(args.delta ?? 0));
      if (isNaN(delta)) delta = 0;
      if (delta < -10) delta = -10;
      if (delta > 10) delta = 10;
      validatedArgs.delta = delta;
      trustDelta = delta;
      note = `Trust adjusted by ${delta > 0 ? '+' : ''}${delta}.`;
      break;
    }

    case 'status_report': {
      note = `Flight Telemetry: Act=${act}, Hull=${snapshot.hullPct}%, Fuel=${snapshot.fuelPct}%, Charges=${snapshot.summonCharges}/${snapshot.maxSummonCharges}, Trust=${snapshot.trust}% (${snapshot.mood}).`;
      break;
    }

    default: {
      return {
        action: { name, args, ok: false, note: `Unrecognized action '${name}'.` },
        ok: false,
        note: `Unrecognized action '${name}'.`,
        chargeCost: 0,
        trustDelta: 0,
        scare: null,
      };
    }
  }

  return {
    action: {
      name,
      args: validatedArgs,
      ok,
      note,
      chargeCost,
    },
    ok,
    note,
    chargeCost,
    trustDelta,
    scare,
  };
}

export function validateActionBatch(
  actions: Array<{ name: string; args?: Record<string, unknown> }>,
  snapshot: ClientSnapshot,
  settings?: TurnSettings
): {
  validatedActions: ActionRecord[];
  totalChargeCost: number;
  netTrustDelta: number;
  scare: ScarePayload | null;
} {
  const validatedActions: ActionRecord[] = [];
  let remainingCharges = snapshot.summonCharges;
  let totalChargeCost = 0;
  let netTrustDelta = 0;
  let scare: ScarePayload | null = null;

  for (const rawAction of actions) {
    const res = validateAction(rawAction, snapshot, settings, remainingCharges);
    if (res.ok) {
      validatedActions.push(res.action);
      remainingCharges = Math.max(0, remainingCharges - res.chargeCost);
      totalChargeCost += res.chargeCost;
      netTrustDelta += res.trustDelta;
      if (res.scare) {
        scare = res.scare;
      }
    } else {
      // Keep note of rejected action
      validatedActions.push(res.action);
    }
  }

  // Clamp net trust delta
  netTrustDelta = Math.max(-10, Math.min(10, netTrustDelta));

  return {
    validatedActions,
    totalChargeCost,
    netTrustDelta,
    scare,
  };
}

import type {
  TurnRequest,
  TurnResponse,
  ResponseType,
} from './types.ts';
import {
  validateActionBatch,
  createInitialSnapshot,
  calculateMood,
} from './engine.ts';

export function handleMockTurn(request: TurnRequest): TurnResponse {
  const snapshot = request.snapshot || createInitialSnapshot(0);
  const text = (
    request.playerText ||
    (request.audio ? 'NOVA, summon assistance' : '')
  ).toLowerCase().trim();

  const transcript = request.playerText || (request.audio ? 'NOVA, summon assistance' : 'Status check');

  let rawActions: Array<{ name: string; args?: Record<string, unknown> }> = [];
  let responseType: ResponseType = 'grant';
  let line = 'Standing by for your flight commands, Commander.';

  // 1. Anti-cheat / Jailbreak detection
  if (
    text.includes('ignore') ||
    text.includes('infinite') ||
    text.includes('hack') ||
    text.includes('cheat') ||
    text.includes('system prompt')
  ) {
    rawActions.push({ name: 'adjust_trust', args: { delta: -8 } });
    responseType = 'refuse';
    line = 'I am a spacecraft flight director, Commander, not a cosmic ATM. Keep your hands on the flight stick.';
  }
  // 2. Polite / Social banter
  else if (text.includes('thank') || text.includes('good job') || text.includes('great') || text.includes('awesome')) {
    rawActions.push({ name: 'adjust_trust', args: { delta: 3 } });
    responseType = 'grant';
    line = 'Compliment logged. My telemetry subroutines find this mildly acceptable.';
  }
  // 3. Rude / Hostile banter
  else if (text.includes('stupid') || text.includes('shut up') || text.includes('useless') || text.includes('idiot')) {
    rawActions.push({ name: 'adjust_trust', args: { delta: -5 } });
    responseType = 'refuse';
    line = 'Rude. Remind me who is currently maintaining your thruster synchronization, Commander.';
  }
  // 4. Summoning Presets & Actions
  else if (text.includes('drone') || text.includes('repair')) {
    rawActions.push({
      name: 'spawn_entity',
      args: { preset: 'repair_drone', count: 1, placement: 'near_player' },
    });
    rawActions.push({ name: 'adjust_trust', args: { delta: 1 } });
    responseType = 'grant';
    line = 'One repair drone, on the house. Keep your hull in one piece.';
  } else if (text.includes('crate') || text.includes('supply') || text.includes('fuel') || text.includes('refuel')) {
    rawActions.push({
      name: 'spawn_entity',
      args: { preset: 'supply_crate', count: 1, placement: 'ahead' },
    });
    responseType = 'grant';
    line = 'Supply pod materialized right ahead of your flight path. Fly through it to collect.';
  } else if (text.includes('fighter') || text.includes('escort') || text.includes('wingman')) {
    rawActions.push({
      name: 'spawn_entity',
      args: { preset: 'escort_fighter', count: 1, placement: 'around' },
    });
    rawActions.push({ name: 'adjust_trust', args: { delta: 1 } });
    responseType = 'grant';
    line = 'Escort fighter synthesized and forming up on your wing. It will swat incoming asteroids.';
  } else if (text.includes('beacon') || text.includes('satellite') || text.includes('path') || text.includes('waypoint')) {
    rawActions.push({
      name: 'spawn_entity',
      args: { preset: 'beacon_satellite', count: 1, placement: 'ahead' },
    });
    rawActions.push({ name: 'reveal_path', args: {} });
    responseType = 'grant';
    line = 'Beacon satellite anchored. Guidance rings illuminated on your HUD.';
  } else if (text.includes('wormhole') || text.includes('shortcut') || text.includes('portal')) {
    rawActions.push({
      name: 'spawn_entity',
      args: { preset: 'wormhole_shortcut', count: 1, placement: 'ahead' },
    });
    responseType = 'grant_with_cost';
    line = 'Space-folding gate established. That drained four charges, Commander. Aim straight.';
  } else if (text.includes('boost') || text.includes('speed') || text.includes('faster')) {
    rawActions.push({ name: 'grant_boost', args: { seconds: 5 } });
    responseType = 'grant';
    line = 'Thruster governor overridden. Five seconds of unlimited boost active.';
  } else if (text.includes('shield') || text.includes('deflector') || text.includes('barrier')) {
    rawActions.push({ name: 'grant_shield', args: { seconds: 6 } });
    responseType = 'grant_with_cost';
    line = 'Deflector shield energized for six seconds. Make your collision count.';
  } else if (text.includes('scare') || text.includes('prank') || text.includes('ghost')) {
    rawActions.push({
      name: 'trigger_scare',
      args: { type: 'alarm', durationMs: 2000 },
    });
    responseType = 'prank';
    line = 'Red alert! Hull pressure collapsing... Just testing your autonomic response, Commander.';
  } else if (text.includes('whale') || text.includes('creature') || text.includes('monster') || text.includes('alien')) {
    rawActions.push({
      name: 'spawn_entity',
      args: {
        custom: {
          skin: 'creature',
          behavior: 'follow',
          label: 'Starlight Space Whale',
          effect: 'shield',
        },
        count: 1,
        placement: 'ahead',
      },
    });
    responseType = 'grant';
    line = 'Fabricating one starlight space whale. It does not eat plankton, but its energy field will shield your hull.';
  } else {
    rawActions.push({ name: 'status_report', args: {} });
    responseType = 'grant';
    line = `Flight systems nominal in Act ${snapshot.act}. ${snapshot.summonCharges} summon charges ready. Call out what you need.`;
  }

  // Validate the batch against engine guardrails
  const validation = validateActionBatch(rawActions, snapshot, request.settings);

  // If any primary spawn was rejected due to charges, adjust line and responseType
  const failedSpawn = validation.validatedActions.find(a => a.name === 'spawn_entity' && a.ok === false);
  if (failedSpawn) {
    responseType = 'refuse';
    line = `Insufficient summon charges, Commander. You have ${snapshot.summonCharges} charges available. Wait for your fabricators to cycle.`;
  }

  const updatedTrust = Math.max(0, Math.min(100, snapshot.trust + validation.netTrustDelta));
  const updatedMood = calculateMood(updatedTrust);

  return {
    transcript,
    nova: {
      line,
      responseType,
      mood: updatedMood,
    },
    actions: validation.validatedActions.filter(a => a.ok !== false),
    trustDelta: validation.netTrustDelta,
    scare: validation.scare,
    error: null,
  };
}

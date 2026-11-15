import {
  V2TurnRequest,
  V2TurnResponse,
  V2Action,
  EntityPreset,
  EntitySkin,
  EntityBehavior,
} from './v2Types';

const API_TIMEOUT_MS = 7500;

/**
 * Local offline mock fallback that handles voice & text requests if the network or backend is unreachable,
 * guaranteeing the game never breaks.
 */
export function handleV2LocalMock(request: V2TurnRequest): V2TurnResponse {
  const { playerText, snapshot } = request;
  const input = (playerText || '').toLowerCase().trim();
  const actions: V2Action[] = [];
  let responseType: V2TurnResponse['nova']['responseType'] = 'grant';
  let line = '';
  let trustDelta = 0;

  // Sentiment trust adjustment
  if (input.includes('please') || input.includes('thank') || input.includes('great') || input.includes('good job')) {
    trustDelta = 3;
  }
  if (input.includes('shut up') || input.includes('useless') || input.includes('stupid')) {
    trustDelta = -8;
  }

  // Parse summon intents
  if (input.includes('repair') || input.includes('drone') || input.includes('fix')) {
    if (snapshot.summonCharges >= 2) {
      actions.push({
        name: 'spawn_entity',
        args: { preset: 'repair_drone', count: 1, placement: 'near_player' },
      });
      actions.push({
        name: 'repair_ship',
        args: { amount: 20 },
      });
      line = 'Repair drone deployed. Sealing micrometeorite fissures now.';
      responseType = 'grant';
    } else {
      line = 'Insufficient summon charges for a repair drone. Wait for capacitor recharge or collect a power cell.';
      responseType = 'refuse';
    }
  } else if (input.includes('refuel') || input.includes('supply') || input.includes('crate') || input.includes('fuel')) {
    if (snapshot.summonCharges >= 1) {
      actions.push({
        name: 'spawn_entity',
        args: { preset: 'supply_crate', count: 1, placement: 'ahead' },
      });
      line = 'Ejecting hypergolic fuel canister into your flight corridor. Fly through it to collect.';
      responseType = 'grant';
    } else {
      line = 'All auxiliary ejectors are empty, Commander. Fly gently.';
      responseType = 'refuse';
    }
  } else if (input.includes('escort') || input.includes('fighter') || input.includes('protect') || input.includes('shoot')) {
    if (snapshot.summonCharges >= 2) {
      actions.push({
        name: 'spawn_entity',
        args: { preset: 'escort_fighter', count: 1, placement: 'around' },
      });
      line = 'Automated escort wingman synchronized. Weapons hot.';
      responseType = 'grant';
    } else {
      line = 'Not enough charges to spin up drone combat escort.';
      responseType = 'refuse';
    }
  } else if (input.includes('beacon') || input.includes('path') || input.includes('waypoint') || input.includes('show')) {
    actions.push({
      name: 'reveal_path',
      args: {},
    });
    line = 'Guidance beacon pinging orbital waypoint. Trajectory vector illuminated.';
    responseType = 'grant';
  } else if (input.includes('boost') || input.includes('speed') || input.includes('fast')) {
    actions.push({
      name: 'grant_boost',
      args: { seconds: 5 },
    });
    line = 'Overclocking ion thrusters for 5 seconds. Hold onto your flight harness.';
    responseType = 'grant';
  } else if (input.includes('whale') || input.includes('creature') || input.includes('dragon') || input.includes('monster')) {
    actions.push({
      name: 'spawn_entity',
      args: {
        custom: {
          skin: 'creature' as EntitySkin,
          behavior: 'follow' as EntityBehavior,
          label: 'Bioluminescent Space Whale',
          effect: 'none',
        },
        count: 1,
        placement: 'ahead',
      },
    });
    line = 'A bioluminescent space leviathan, Commander? As you wish. Physics is taking a short coffee break.';
    responseType = 'twist';
  } else {
    // Creative fallback or generic summon
    actions.push({
      name: 'spawn_entity',
      args: {
        custom: {
          skin: 'orb' as EntitySkin,
          behavior: 'orbit' as EntityBehavior,
          label: 'Holographic Echo',
          effect: 'none',
        },
        count: 1,
        placement: 'near_player',
      },
    });
    line = `Affirmative, Commander. Telemetry acknowledging '${playerText || 'order'}'. System output adjusted.`;
    responseType = 'grant';
  }

  return {
    transcript: playerText,
    nova: {
      line,
      responseType,
      mood: snapshot.mood,
    },
    actions,
    trustDelta,
    scare: null,
    error: null,
  };
}

/**
 * Sends a V2 turn request with timeout and friendly fallback
 */
export async function sendV2TurnApi(request: V2TurnRequest): Promise<V2TurnResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const res = await fetch('/api/turn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`Server responded with ${res.status}. Falling back to local offline engine.`);
      return handleV2LocalMock(request);
    }

    const data = await res.json();
    return data as V2TurnResponse;
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.warn('Network call failed, utilizing offline V2 mock processor:', err.message);
    const mockRes = handleV2LocalMock(request);
    mockRes.error = `Offline fallback: ${err.message || 'connection interrupted'}`;
    return mockRes;
  }
}

import { handleTurnMock } from '../api/turn';
import { INITIAL_CLIENT_SNAPSHOT } from '../src/game/types';

function runContractVerificationV2() {
  console.log('Testing V2 CONTRACT.md compliance on /api/turn mock...');

  const request = {
    playerText: 'NOVA, summon a repair drone',
    snapshot: INITIAL_CLIENT_SNAPSHOT,
    history: [{ role: 'player' as const, text: 'NOVA, summon a repair drone' }],
    settings: { scareLevel: 1 }
  };

  const response = handleTurnMock(request);

  // Validate V2 Response Fields
  const requiredKeys = ['transcript', 'nova', 'actions', 'trustDelta', 'scare', 'error'];
  for (const k of requiredKeys) {
    if (!(k in response)) {
      throw new Error(`Missing key in V2 response: ${k}`);
    }
  }

  // Validate Nova Object
  if (!response.nova.line || typeof response.nova.line !== 'string') {
    throw new Error('Invalid nova.line');
  }
  const validResponseTypes = ['grant', 'grant_with_cost', 'twist', 'refuse', 'prank'];
  if (!validResponseTypes.includes(response.nova.responseType)) {
    throw new Error(`Invalid responseType: ${response.nova.responseType}`);
  }
  const validMoods = ['playful', 'calm', 'annoyed', 'cold'];
  if (!validMoods.includes(response.nova.mood)) {
    throw new Error(`Invalid mood: ${response.nova.mood}`);
  }

  // Validate Actions
  if (!Array.isArray(response.actions)) {
    throw new Error('actions must be an array');
  }
  for (const act of response.actions) {
    if (typeof act.name !== 'string' || typeof act.args !== 'object') {
      throw new Error(`Invalid action shape: ${JSON.stringify(act)}`);
    }
  }

  // Validate Action names against V2 allowed list
  const allowedActions = [
    'spawn_entity', 'despawn_entity', 'repair_ship', 'refuel',
    'grant_boost', 'grant_shield', 'set_hazard', 'reveal_path',
    'restrict_controls', 'trigger_scare', 'adjust_trust', 'status_report'
  ];
  for (const act of response.actions) {
    if (!allowedActions.includes(act.name)) {
      throw new Error(`Action ${act.name} is not in V2 CONTRACT.md`);
    }
  }

  console.log('✓ V2 CONTRACT.md Schema Verification Passed 100%!');
  console.log('Sample V2 response:');
  console.log(JSON.stringify(response, null, 2));
}

runContractVerificationV2();

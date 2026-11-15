/**
 * Automated Contract Checker for "Dear NOVA"
 * Validates POST /api/turn responses against CONTRACT.md
 *
 * Usage:
 *   node tests/contract_checker.js [endpoint_url]
 * Default endpoint: http://localhost:3000/api/turn
 */

const ENDPOINT = process.argv[2] || process.env.API_URL || 'http://localhost:3000/api/turn';

const VALID_STAGES = ['design', 'launch', 'transit', 'arrival', 'surface', 'ended'];
const VALID_STATUSES = ['playing', 'won', 'lost'];
const VALID_MOODS = ['playful', 'calm', 'annoyed', 'cold'];
const VALID_RESPONSE_TYPES = ['grant', 'grant_with_cost', 'twist', 'refuse', 'prank'];
const VALID_SYSTEMS = ['engines', 'life_support', 'comms', 'power', 'hull', 'navigation'];
const VALID_SCARE_TYPES = ['alarm', 'blackout', 'silhouette', 'flicker'];

const INITIAL_GAME_STATE = {
  version: 1,
  stage: 'design',
  day: 0,
  totalTripDays: 210,
  resources: {
    fuelKg: 1000,
    fuelMaxKg: 1000,
    oxygenPct: 100,
    powerPct: 100,
    hullPct: 100,
    budgetM: 500,
    supplyDays: 300
  },
  ship: {
    location: 'earth',
    progress: 0,
    payloadKg: 200,
    launchWindowId: null
  },
  nova: {
    trust: 60,
    mood: 'calm',
    lockedSystems: []
  },
  activeEvents: [],
  objective: { id: 'reach_mars', text: 'Choose a launch window', done: false },
  status: 'playing',
  lossReason: null,
  scareLevel: 1
};

function validateContract(data) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return ['Response body is not a JSON object'];
  }

  // 1. Root fields check
  const requiredRootKeys = ['state', 'nova', 'actions', 'scare', 'events', 'error'];
  for (const key of requiredRootKeys) {
    if (!(key in data)) {
      errors.push(`Missing root key: '${key}'`);
    }
  }

  // 2. Validate state
  const s = data.state;
  if (!s || typeof s !== 'object') {
    errors.push("'state' must be an object");
  } else {
    if (s.version !== 1) errors.push(`state.version must be 1, got: ${s.version}`);
    if (!VALID_STAGES.includes(s.stage)) errors.push(`state.stage invalid: '${s.stage}'`);
    if (!VALID_STATUSES.includes(s.status)) errors.push(`state.status invalid: '${s.status}'`);
    if (typeof s.day !== 'number' || s.day < 0) errors.push(`state.day invalid: ${s.day}`);
    if (typeof s.totalTripDays !== 'number' || s.totalTripDays <= 0) errors.push(`state.totalTripDays invalid: ${s.totalTripDays}`);

    // Resources
    const r = s.resources;
    if (!r || typeof r !== 'object') {
      errors.push("'state.resources' must be an object");
    } else {
      const numKeys = ['fuelKg', 'fuelMaxKg', 'oxygenPct', 'powerPct', 'hullPct', 'budgetM', 'supplyDays'];
      for (const k of numKeys) {
        if (typeof r[k] !== 'number' || isNaN(r[k])) errors.push(`resources.${k} must be a number`);
      }
      if (r.oxygenPct < 0 || r.oxygenPct > 100) errors.push(`oxygenPct out of range [0-100]: ${r.oxygenPct}`);
      if (r.powerPct < 0 || r.powerPct > 100) errors.push(`powerPct out of range [0-100]: ${r.powerPct}`);
      if (r.hullPct < 0 || r.hullPct > 100) errors.push(`hullPct out of range [0-100]: ${r.hullPct}`);
      if (r.fuelKg < 0) errors.push(`fuelKg cannot be negative: ${r.fuelKg}`);
      if (r.budgetM < 0) errors.push(`budgetM cannot be negative: ${r.budgetM}`);
    }

    // Ship
    const sh = s.ship;
    if (!sh || typeof sh !== 'object') {
      errors.push("'state.ship' must be an object");
    } else {
      if (typeof sh.location !== 'string') errors.push("ship.location must be a string");
      if (typeof sh.progress !== 'number' || sh.progress < 0 || sh.progress > 100) {
        errors.push(`ship.progress out of range [0-100]: ${sh.progress}`);
      }
      if (typeof sh.payloadKg !== 'number') errors.push("ship.payloadKg must be a number");
    }

    // NOVA state
    const nv = s.nova;
    if (!nv || typeof nv !== 'object') {
      errors.push("'state.nova' must be an object");
    } else {
      if (typeof nv.trust !== 'number' || nv.trust < 0 || nv.trust > 100) {
        errors.push(`nova.trust must be clamped [0-100], got: ${nv.trust}`);
      }
      if (!VALID_MOODS.includes(nv.mood)) {
        errors.push(`nova.mood invalid: '${nv.mood}' (expected ${VALID_MOODS.join('|')})`);
      }
      if (!Array.isArray(nv.lockedSystems)) {
        errors.push("nova.lockedSystems must be an array");
      } else {
        for (const sys of nv.lockedSystems) {
          if (!VALID_SYSTEMS.includes(sys)) errors.push(`Invalid locked system: '${sys}'`);
        }
      }
    }

    // Objective
    if (!s.objective || typeof s.objective.id !== 'string' || typeof s.objective.text !== 'string' || typeof s.objective.done !== 'boolean') {
      errors.push("state.objective must match { id: string, text: string, done: boolean }");
    }
  }

  // 3. Validate nova response object
  const novaRes = data.nova;
  if (!novaRes || typeof novaRes !== 'object') {
    errors.push("'nova' response must be an object");
  } else {
    if (typeof novaRes.line !== 'string' || novaRes.line.trim().length === 0) {
      errors.push("nova.line must be a non-empty string");
    }
    if (!VALID_RESPONSE_TYPES.includes(novaRes.responseType)) {
      errors.push(`nova.responseType invalid: '${novaRes.responseType}' (expected ${VALID_RESPONSE_TYPES.join('|')})`);
    }
    if (!VALID_MOODS.includes(novaRes.mood)) {
      errors.push(`nova.mood in turn response invalid: '${novaRes.mood}'`);
    }
  }

  // 4. Validate actions
  if (!Array.isArray(data.actions)) {
    errors.push("'actions' must be an array");
  } else {
    for (let i = 0; i < data.actions.length; i++) {
      const act = data.actions[i];
      if (!act || typeof act.name !== 'string' || typeof act.ok !== 'boolean') {
        errors.push(`actions[${i}] must have name (string) and ok (boolean)`);
      }
    }
  }

  // 5. Validate scare
  if (data.scare !== null) {
    if (typeof data.scare !== 'object') {
      errors.push("'scare' must be null or an object");
    } else {
      if (!VALID_SCARE_TYPES.includes(data.scare.type)) {
        errors.push(`scare.type invalid: '${data.scare.type}' (expected ${VALID_SCARE_TYPES.join('|')})`);
      }
      if (typeof data.scare.durationMs !== 'number' || data.scare.durationMs <= 0) {
        errors.push(`scare.durationMs must be a positive number, got: ${data.scare.durationMs}`);
      }
    }
  }

  // 6. Validate events
  if (!Array.isArray(data.events)) {
    errors.push("'events' must be an array of strings");
  }

  return errors;
}

async function runTests() {
  console.log(`=======================================================`);
  console.log(`[QA TESTER] Running Contract Validation against:`);
  console.log(`Endpoint: ${ENDPOINT}`);
  console.log(`=======================================================\n`);

  const payload = {
    playerText: "NOVA, plot the cheapest route to Mars",
    state: INITIAL_GAME_STATE,
    history: [{ role: "player", text: "Hello NOVA" }],
    settings: { scareLevel: 1 }
  };

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      console.error(`[FAIL] HTTP status ${res.status}: ${res.statusText}`);
      const text = await res.text();
      console.error(`Response text: ${text}`);
      process.exit(1);
    }

    const data = await res.json();
    console.log(`[HTTP 200] Response received successfully.`);
    console.log(`Payload sample:`, JSON.stringify(data, null, 2).slice(0, 300) + '...\n');

    const errors = validateContract(data);
    if (errors.length === 0) {
      console.log(`[SUCCESS] Contract Check PASSED: 100% compliant with CONTRACT.md`);
      process.exit(0);
    } else {
      console.error(`[CONTRACT VIOLATION] Found ${errors.length} mismatch(es):`);
      errors.forEach((err, idx) => console.error(`  ${idx + 1}. ${err}`));
      process.exit(1);
    }
  } catch (err) {
    console.error(`[CONNECTION ERROR] Could not reach endpoint ${ENDPOINT}: ${err.message}`);
    console.error(`Mock server may not be active yet.`);
    process.exit(2);
  }
}

runTests();

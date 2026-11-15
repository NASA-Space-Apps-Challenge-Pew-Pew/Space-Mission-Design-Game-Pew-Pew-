import test from 'node:test';
import assert from 'node:assert/strict';
import { processTurn, handleTurnMock } from '../api/turn.ts';
import { createInitialState } from '../api/_lib/engine.ts';
import type { TurnRequest } from '../api/_lib/types.ts';

test('processTurn defaults to mock mode when GEMINI_API_KEY is not set', async () => {
  delete process.env.GEMINI_API_KEY;
  const req: TurnRequest = {
    playerText: 'Status report',
    state: createInitialState(),
    history: [],
  };

  const response = await processTurn(req);
  assert.equal(response.error, null);
  assert.ok(response.nova.line);
  assert.equal(response.state.stage, 'design');
  assert.equal(Array.isArray(response.actions), true);
});

test('processTurn handles empty state and initializes properly', async () => {
  const req: any = {
    playerText: 'Hello NOVA',
  };

  const response = await processTurn(req);
  assert.ok(response.state);
  assert.equal(response.state.stage, 'design');
  assert.equal(response.state.version, 1);
});

test('processTurn returns fallback response on simulated model error instead of throwing', async () => {
  process.env.GEMINI_API_KEY = 'invalid-test-key-for-resilience';
  process.env.MOCK = '0';

  const req: TurnRequest = {
    playerText: 'Calculate optimal Hohmann transfer trajectory',
    state: createInitialState(),
    history: [],
  };

  const response = await processTurn(req);
  // Must return valid contract shape, unchanged state, and fallback line
  assert.ok(response.state);
  assert.equal(response.state.stage, 'design');
  assert.ok(response.nova.line.length > 0);
  assert.equal(response.nova.responseType, 'refuse');
  assert.ok(response.error);
  assert.match(response.nova.line, /neural bus/i);

  // Clean up env
  delete process.env.GEMINI_API_KEY;
  delete process.env.MOCK;
});

test('handleTurnMock returns valid contract response for each stage', () => {
  // Design
  const resDesign = handleTurnMock({
    playerText: 'Choose optimal launch window',
    state: createInitialState(),
  });
  assert.equal(resDesign.state.ship.launchWindowId, 'window_optimal_2026');

  // Launch
  const launchState = { ...resDesign.state, stage: 'launch' as const };
  const resLaunch = handleTurnMock({
    playerText: 'Burn 200 kg for Trans-Mars Injection',
    state: launchState,
  });
  assert.equal(resLaunch.state.stage, 'transit');

  // Transit
  const transitState = { ...resLaunch.state, stage: 'transit' as const };
  const resTransit = handleTurnMock({
    playerText: 'Skip 35 days',
    state: transitState,
  });
  assert.equal(resTransit.state.day, 35);

  // Arrival
  const arrivalState = { ...resTransit.state, stage: 'arrival' as const, resources: { ...resTransit.state.resources, fuelKg: 600 } };
  const resArrival = handleTurnMock({
    playerText: 'Begin orbit insertion',
    state: arrivalState,
  });
  assert.equal(resArrival.state.ship.location, 'low_mars_orbit');

  // Surface
  const surfaceState = { ...resArrival.state, stage: 'surface' as const };
  const resSurface = handleTurnMock({
    playerText: 'Transmit data to Earth',
    state: surfaceState,
  });
  assert.equal(resSurface.state.status, 'won');
});

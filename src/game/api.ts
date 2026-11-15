import { TurnRequest, TurnResponse } from './types';
import { handleMockTurn } from './mockEngine';

const API_TIMEOUT_MS = 8000;

/**
 * Creates an in-character fallback response when network/server fails,
 * ensuring the player is never stranded and state is preserved.
 */
function createFallbackResponse(request: TurnRequest, errorMessage: string): TurnResponse {
  return {
    state: request.state,
    nova: {
      line: "Static crackles over the comm link... 'Commander, my neural communications buffer encountered an anomaly, but our trajectory remains steady. Say again?'",
      responseType: 'refuse',
      mood: request.state.nova.mood,
    },
    actions: [],
    scare: null,
    events: request.state.activeEvents,
    error: errorMessage,
  };
}

/**
 * Single fetch attempt with timeout
 */
async function fetchTurnOnce(request: TurnRequest): Promise<TurnResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const res = await fetch('/api/turn', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      // If 404 (endpoint not mounted yet in a standalone preview), fallback to mock engine
      if (res.status === 404) {
        console.warn('API returned 404; falling back to client mock engine.');
        return handleMockTurn(request);
      }
      throw new Error(`Server returned status ${res.status}: ${res.statusText}`);
    }

    const data = (await res.json()) as TurnResponse;
    return data;
  } catch (err: any) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Sends a turn to /api/turn with timeout, 1 retry, and safe fallback.
 */
export async function sendTurnApi(request: TurnRequest): Promise<TurnResponse> {
  // First attempt
  try {
    return await fetchTurnOnce(request);
  } catch (firstErr: any) {
    console.warn('First attempt to /api/turn failed, retrying once...', firstErr);

    // Second attempt (retry once)
    try {
      return await fetchTurnOnce(request);
    } catch (secondErr: any) {
      console.error('Both attempts to /api/turn failed:', secondErr);

      // In development or if offline, simulate turn through mock engine so the game remains 100% playable
      try {
        const mockFallback = handleMockTurn(request);
        mockFallback.error = `Server unreachable (${secondErr.message || 'offline'}). Switched to offline mock mode.`;
        return mockFallback;
      } catch (mockErr) {
        return createFallbackResponse(request, secondErr.message || 'Network timeout');
      }
    }
  }
}

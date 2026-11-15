import { TurnRequest, TurnResponse } from './types';

const FALLBACK_RESPONSE = (state: TurnRequest['state'], errMessage: string): TurnResponse => ({
  state,
  nova: {
    line: "Static crackle... 'Command, audio packet lost in cosmic microwave background. Say again?'",
    responseType: "refuse",
    mood: state.nova.mood
  },
  actions: [],
  scare: null,
  events: [],
  error: errMessage
});

export async function sendTurn(request: TurnRequest, retries = 1, timeoutMs = 8000): Promise<TurnResponse> {
  const attempt = async (): Promise<TurnResponse> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch('/api/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal: controller.signal
      });

      clearTimeout(timer);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data: TurnResponse = await res.json();
      return data;
    } catch (err: any) {
      clearTimeout(timer);
      throw err;
    }
  };

  try {
    return await attempt();
  } catch (err: any) {
    if (retries > 0) {
      console.warn('Turn failed, retrying once...', err);
      try {
        return await attempt();
      } catch (retryErr: any) {
        console.error('Turn retry failed:', retryErr);
        return FALLBACK_RESPONSE(request.state, retryErr?.message || 'Network timeout');
      }
    }
    return FALLBACK_RESPONSE(request.state, err?.message || 'Request failed');
  }
}

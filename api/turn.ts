import type { TurnRequest, TurnResponse } from './_lib/types.ts';
import { createInitialSnapshot } from './_lib/engine.ts';
import { handleMockTurn } from './_lib/mock.ts';
import { executeGeminiTurn } from './_lib/gemini.ts';

// In-memory sliding window rate limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 60; // 60 requests per minute per IP
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }
  record.count += 1;
  return true;
}

function sendJson(res: any, status: number, data: any) {
  if (typeof res.status === 'function') {
    res.status(status);
    if (typeof res.json === 'function') {
      res.json(data);
      return;
    }
  } else {
    res.statusCode = status;
  }
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

export function handleTurnMock(body: TurnRequest): TurnResponse {
  return handleMockTurn(body);
}

export { handleMockTurn };

export async function processTurn(body: TurnRequest): Promise<TurnResponse> {
  // Validate or initialize snapshot
  if (!body.snapshot || typeof body.snapshot.act !== 'number') {
    body.snapshot = createInitialSnapshot(0);
  }

  // Check if mock mode is explicitly requested or if Gemini credentials are not provided
  const isMock =
    process.env.MOCK === '1' ||
    process.env.MOCK === 'true' ||
    !process.env.GEMINI_API_KEY ||
    Boolean(body.mock);

  if (isMock) {
    return handleMockTurn(body);
  }

  try {
    return await executeGeminiTurn(body);
  } catch (err: any) {
    // Graceful in-world fallback: NEVER return a 500 for a model failure
    const errorMsg = err?.message || 'Model service temporarily unavailable';
    const transcript = body.playerText || (body.audio ? '[voice clip received]' : 'Status check');

    return {
      transcript,
      nova: {
        line: 'Comms static on the sub-carrier, Commander. Say that again?',
        responseType: 'refuse',
        mood: body.snapshot?.mood || 'calm',
      },
      actions: [],
      trustDelta: 0,
      scare: null,
      error: errorMsg,
    };
  }
}

// Serverless Handler (Vercel / Node)
export default async function handler(req: any, res: any) {
  const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    if (typeof res.status === 'function') {
      res.status(204).end();
    } else {
      res.statusCode = 204;
      res.end();
    }
    return;
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method Not Allowed. Use POST.' });
    return;
  }

  // Rate limiting check
  const clientIp =
    req.headers?.['x-forwarded-for']?.toString().split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    '127.0.0.1';

  if (!checkRateLimit(clientIp)) {
    sendJson(res, 429, { error: 'Too Many Requests. Please slow down.' });
    return;
  }

  try {
    // Parse JSON body if needed
    let bodyData = req.body;
    if (typeof bodyData === 'string') {
      try {
        bodyData = JSON.parse(bodyData);
      } catch {
        bodyData = {};
      }
    } else if (!bodyData) {
      bodyData = await new Promise<any>((resolve) => {
        let raw = '';
        req.on('data', (chunk: any) => {
          raw += chunk;
        });
        req.on('end', () => {
          try {
            resolve(JSON.parse(raw || '{}'));
          } catch {
            resolve({});
          }
        });
      });
    }

    const response = await processTurn(bodyData);
    sendJson(res, 200, response);
  } catch (err: any) {
    // Top-level crash prevention - never return 500
    const snapshot = req.body?.snapshot || createInitialSnapshot(0);
    sendJson(res, 200, {
      transcript: req.body?.playerText || '[unintelligible comms]',
      nova: {
        line: 'Sub-space telemetry link dropped momentarily. Re-transmitting.',
        responseType: 'refuse',
        mood: snapshot.mood || 'calm',
      },
      actions: [],
      trustDelta: 0,
      scare: null,
      error: err?.message || 'Server error handled gracefully',
    });
  }
}

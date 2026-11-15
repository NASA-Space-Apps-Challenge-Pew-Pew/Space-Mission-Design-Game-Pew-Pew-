import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI } from '@google/genai';
import type {
  TurnRequest,
  TurnResponse,
  ClientSnapshot,
  ResponseType,
} from './types.ts';
import {
  validateActionBatch,
  calculateMood,
} from './engine.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read system prompt from Game Director's file, with safe fallback
let cachedSystemPrompt = '';
try {
  const promptPath = path.join(__dirname, 'prompts', 'nova_system_prompt.md');
  if (fs.existsSync(promptPath)) {
    cachedSystemPrompt = fs.readFileSync(promptPath, 'utf8');
  }
} catch {
  // Use fallback if file read fails
}

if (!cachedSystemPrompt) {
  cachedSystemPrompt = `You are NOVA, the sentient co-pilot AI aboard the Mars exploration vessel Odyssey-1. The game is a real-time 3D flight game. You can summon entities, repair the vessel, boost thrusters, or test the Commander. Always start with your response tag: [grant], [grant_with_cost], [twist], [refuse], or [prank]. 1 to 2 spoken sentences maximum. No markdown or emojis.`;
}

// Function declarations matching CONTRACT.md V2 exactly
export const V2_FUNCTION_DECLARATIONS = [
  {
    name: 'spawn_entity',
    description: 'Manifest an entity in 3D flight space. Choose a preset or define a custom archetype.',
    parameters: {
      type: 'OBJECT',
      properties: {
        preset: {
          type: 'STRING',
          enum: [
            'supply_crate',
            'repair_drone',
            'escort_fighter',
            'beacon_satellite',
            'wormhole_shortcut',
            'derelict_ship',
            'asteroids',
            'ghost_ship',
          ],
          description: 'Named entity preset.',
        },
        custom: {
          type: 'OBJECT',
          properties: {
            skin: {
              type: 'STRING',
              enum: ['orb', 'crate', 'rock', 'ship', 'creature', 'station'],
              description: 'Visual geometry archetype.',
            },
            behavior: {
              type: 'STRING',
              enum: ['follow', 'orbit', 'collect', 'hazard', 'decor', 'shoot'],
              description: 'Autonomous flight behavior.',
            },
            label: { type: 'STRING', description: 'Label displayed above entity.' },
            effect: {
              type: 'STRING',
              enum: ['heal', 'fuel', 'shield', 'reveal_path', 'none'],
              description: 'Collision or passive effect on player.',
            },
          },
          required: ['skin', 'behavior', 'label', 'effect'],
        },
        count: { type: 'NUMBER', description: 'Number of entities to spawn (1 to 5).' },
        placement: {
          type: 'STRING',
          enum: ['ahead', 'around', 'behind', 'near_player', 'near_target'],
          description: 'Relative spawn location.',
        },
      },
    },
  },
  {
    name: 'despawn_entity',
    description: 'De-materialize an entity or class of entities from the flight sector.',
    parameters: {
      type: 'OBJECT',
      properties: {
        preset: { type: 'STRING', description: 'Preset name to despawn.' },
        id: { type: 'STRING', description: 'Optional specific entity ID.' },
      },
    },
  },
  {
    name: 'repair_ship',
    description: 'Directly restore hull integrity percentage (costs 2 summon charges).',
    parameters: {
      type: 'OBJECT',
      properties: {
        amount: { type: 'NUMBER', description: 'Percentage of hull to restore (0 to 40).' },
      },
      required: ['amount'],
    },
  },
  {
    name: 'refuel',
    description: 'Directly replenish thruster propellant percentage (costs 1 summon charge).',
    parameters: {
      type: 'OBJECT',
      properties: {
        amount: { type: 'NUMBER', description: 'Percentage of fuel to replenish (0 to 40).' },
      },
      required: ['amount'],
    },
  },
  {
    name: 'grant_boost',
    description: 'Grant temporary unlimited/supercharged thruster boost (costs 1 summon charge).',
    parameters: {
      type: 'OBJECT',
      properties: {
        seconds: { type: 'NUMBER', description: 'Boost duration in seconds (1 to 10).' },
      },
      required: ['seconds'],
    },
  },
  {
    name: 'grant_shield',
    description: 'Energize invulnerability deflector shield (costs 2 summon charges).',
    parameters: {
      type: 'OBJECT',
      properties: {
        seconds: { type: 'NUMBER', description: 'Shield duration in seconds (1 to 10).' },
      },
      required: ['seconds'],
    },
  },
  {
    name: 'set_hazard',
    description: 'NOVA twist/prank: Manifest cosmic hazards in the flight sector.',
    parameters: {
      type: 'OBJECT',
      properties: {
        type: {
          type: 'STRING',
          enum: ['solar_flare', 'meteor_shower', 'dust'],
          description: 'Hazard archetype.',
        },
        intensity: { type: 'NUMBER', description: 'Hazard intensity (1 to 3).' },
      },
      required: ['type', 'intensity'],
    },
  },
  {
    name: 'reveal_path',
    description: 'Illuminate waypoint navigation rings to guide the Commander through the flight corridor.',
    parameters: {
      type: 'OBJECT',
      properties: {},
    },
  },
  {
    name: 'restrict_controls',
    description: 'NOVA punitive override: Temporarily disable thruster boost (only if trust < 20).',
    parameters: {
      type: 'OBJECT',
      properties: {
        control: { type: 'STRING', enum: ['boost'], description: 'Control axis to restrict.' },
        seconds: { type: 'NUMBER', description: 'Restriction duration in seconds (1 to 10).' },
      },
      required: ['control', 'seconds'],
    },
  },
  {
    name: 'trigger_scare',
    description: 'NOVA only: Trigger an audiovisual alarm, blackout, silhouette, or flicker scare. Respects scareLevel.',
    parameters: {
      type: 'OBJECT',
      properties: {
        type: {
          type: 'STRING',
          enum: ['alarm', 'blackout', 'silhouette', 'flicker'],
          description: 'Scare archetype.',
        },
        durationMs: { type: 'NUMBER', description: 'Duration in milliseconds (500 to 5000).' },
      },
      required: ['type', 'durationMs'],
    },
  },
  {
    name: 'adjust_trust',
    description: 'Adjust NOVA trust index (-10 to +10) based on Commander communication, competence, or cheat attempts.',
    parameters: {
      type: 'OBJECT',
      properties: {
        delta: { type: 'NUMBER', description: 'Trust delta (-10 to +10).' },
      },
      required: ['delta'],
    },
  },
  {
    name: 'status_report',
    description: 'Provide an in-character diagnostic flight telemetry summary.',
    parameters: {
      type: 'OBJECT',
      properties: {},
    },
  },
];

function buildTelemetryContext(snapshot: ClientSnapshot): string {
  const liveCountStr = Object.entries(snapshot.liveEntities || {})
    .filter(([_, count]) => count > 0)
    .map(([name, count]) => `${name}:${count}`)
    .join(', ');

  return `REAL-TIME FLIGHT TELEMETRY:
- Act: ${snapshot.act} (Objective: "${snapshot.objective}")
- Ship Vitals: Hull=${snapshot.hullPct}%, Fuel=${snapshot.fuelPct}%
- Summon Fabricators: Charges=${snapshot.summonCharges}/${snapshot.maxSummonCharges}
- NOVA Index: Trust=${snapshot.trust}%, Mood=${snapshot.mood}
- Active Entities: [${liveCountStr || 'none'}]
- Proximity: Nearest hazard=${snapshot.nearestHazardMeters}m
- Recent Events: [${(snapshot.recentEvents || []).join(', ') || 'nominal'}]`;
}

export async function executeGeminiTurn(request: TurnRequest): Promise<TurnResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is missing.');
  }

  const ai = new GoogleGenAI({ apiKey });

  // 1. Format history (cap at last 8 turns)
  const history = (request.history || []).slice(-8);
  const formattedHistory: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

  for (const item of history) {
    formattedHistory.push({
      role: item.role === 'player' ? 'user' : 'model',
      parts: [{ text: item.text }],
    });
  }

  // 2. Prepare user message parts (Audio or Text)
  const userParts: any[] = [];
  const hasAudio = Boolean(request.audio?.base64);

  if (hasAudio && request.audio) {
    userParts.push({
      inlineData: {
        mimeType: request.audio.mimeType || 'audio/wav',
        data: request.audio.base64,
      },
    });
  }

  const telemetryText = `[TELEMETRY CONTEXT]\n${buildTelemetryContext(request.snapshot)}`;
  let commandInstruction = '';

  if (hasAudio) {
    commandInstruction = `\n\n[VOICE TRANSMISSION RECEIVED]\nThe Commander transmitted the attached audio clip. At the very beginning of your spoken line, transcribe what they said as: [TRANSCRIPT: <transcription>], followed by your response tag: [grant], [grant_with_cost], [twist], [refuse], or [prank], then your witty spoken line. Execute appropriate actions via tool calls.`;
  } else {
    const rawText = (request.playerText || '').trim().slice(0, 300);
    commandInstruction = `\n\n[COMMANDER INPUT]\n"${rawText}"\n\nAt the start of your spoken line, include your response tag: [grant], [grant_with_cost], [twist], [refuse], or [prank]. Call appropriate actions via tool calls.`;
  }

  userParts.push({ text: telemetryText + commandInstruction });

  async function executeTurnInternal(): Promise<TurnResponse> {
    const chat = ai.chats.create({
      model: modelName,
      history: formattedHistory as any,
      config: {
        systemInstruction: {
          parts: [{ text: cachedSystemPrompt }],
        },
        tools: [{ functionDeclarations: V2_FUNCTION_DECLARATIONS as any }],
        temperature: 0.7,
      },
    });

    const firstResult = await chat.sendMessage({
      message: userParts,
    });

    const functionCalls = firstResult.functionCalls || [];
    let rawLine = firstResult.text || '';
    const rawActionsToValidate: Array<{ name: string; args?: Record<string, unknown> }> = [];

    for (const fc of functionCalls) {
      const name = fc.name || '';
      if (!name) continue;
      const args = (fc.args as Record<string, unknown>) || {};
      rawActionsToValidate.push({ name, args });
    }

    // Pre-validate action batch through V2 engine guardrails
    const validation = validateActionBatch(rawActionsToValidate, request.snapshot, request.settings);

    // Multi-turn resolution: send function execution results back to Gemini for dialogue line
    if (functionCalls.length > 0) {
      const toolResponses = validation.validatedActions.map(a => ({
        functionResponse: {
          name: a.name,
          response: { ok: a.ok, note: a.note, chargeCost: a.chargeCost },
        },
      }));

      try {
        const secondResult = await chat.sendMessage({
          message: toolResponses,
        });
        if (secondResult.text) {
          rawLine = secondResult.text;
        }
      } catch {
        if (!rawLine) {
          rawLine = validation.validatedActions.map(a => a.note).join(' ');
        }
      }
    }

    rawLine = rawLine.trim();

    // Extract [TRANSCRIPT: ...] if present
    let transcript = request.playerText || '';
    const transcriptMatch = rawLine.match(/\[TRANSCRIPT:\s*(.*?)\]/i);
    if (transcriptMatch) {
      transcript = transcriptMatch[1].trim();
      rawLine = rawLine.replace(/\[TRANSCRIPT:\s*.*?\]/i, '').trim();
    }
    if (!transcript) {
      transcript = hasAudio ? 'Voice transmission received' : 'Status check';
    }

    // Extract [grant], [twist], etc.
    let responseType: ResponseType = 'grant';
    const tagMatch = rawLine.match(/^\[(grant|grant_with_cost|twist|refuse|prank)\]\s*/i);
    if (tagMatch) {
      responseType = tagMatch[1].toLowerCase() as ResponseType;
      rawLine = rawLine.slice(tagMatch[0].length).trim();
    } else {
      // Infer response type if not tagged
      if (validation.validatedActions.length === 0) {
        responseType = 'refuse';
      } else if (validation.validatedActions.some(f => f.name === 'trigger_scare')) {
        responseType = 'prank';
      } else if (validation.totalChargeCost > 0) {
        responseType = 'grant_with_cost';
      }
    }

    // Clean spoken line
    let cleanedLine = rawLine
      .replace(/[*#`_~]/g, '')
      .replace(/^["']|["']$/g, '')
      .replace(/\[.*?\]/g, '')
      .trim();

    if (!cleanedLine) {
      cleanedLine =
        validation.validatedActions.length > 0
          ? validation.validatedActions[0].note || 'Order acknowledged, Commander.'
          : 'Standing by for flight commands, Commander.';
    }

    const updatedTrust = Math.max(0, Math.min(100, request.snapshot.trust + validation.netTrustDelta));
    const updatedMood = calculateMood(updatedTrust);

    return {
      transcript,
      nova: {
        line: cleanedLine,
        responseType,
        mood: updatedMood,
      },
      actions: validation.validatedActions.filter(a => a.ok !== false),
      trustDelta: validation.netTrustDelta,
      scare: validation.scare,
      error: null,
    };
  }

  // Wrapper with 8-second timeout and 1 retry
  async function callWithTimeout(): Promise<TurnResponse> {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API call timed out after 8000ms')), 8000)
    );
    return Promise.race([executeTurnInternal(), timeoutPromise]);
  }

  try {
    return await callWithTimeout();
  } catch (firstErr) {
    try {
      return await callWithTimeout();
    } catch (secondErr: any) {
      throw new Error(`Gemini service failed: ${secondErr?.message || firstErr}`);
    }
  }
}

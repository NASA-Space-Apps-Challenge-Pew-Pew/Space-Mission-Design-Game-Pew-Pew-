/**
 * Wake Word Fuzzy Matcher for NOVA
 *
 * Robust local fuzzy matching for the wake word "NOVA".
 * Speech recognizers commonly transcribe "nova" as variants such as:
 * "no va", "noah", "novo", "nover", "norva", "know the", "now that", "no one", "no vah".
 *
 * Also protects against false wake triggers (e.g. "no", "not now", "nobody", "never").
 */

export interface WakeWordMatchResult {
  matched: boolean;
  detectedVariant?: string;
  confidence: number;
  commandRemainder?: string;
}

// Known phonetically similar variants heard by STT engines
export const WAKE_WORD_VARIANTS: readonly string[] = [
  'nova',
  'no va',
  'noah',
  'novo',
  'nover',
  'norva',
  'no-va',
  'no vah',
  'noba',
  'know the',
  'now that',
  'no one',
  'know of',
  'know a',
];

// Words that should NOT trigger a false wake on their own
export const REJECT_WORDS: readonly string[] = [
  'no',
  'not',
  'now',
  'never',
  'know',
  'go',
  'nobody',
  'nothing',
  'notice',
  'none',
  'no way',
  'november',
];

/**
 * Standard Levenshtein distance calculation between two strings
 */
export function levenshteinDistance(a: string, b: string): number {
  const an = a.length;
  const bn = b.length;
  if (an === 0) return bn;
  if (bn === 0) return an;

  const matrix: number[][] = [];
  for (let i = 0; i <= an; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= bn; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= an; i++) {
    for (let j = 1; j <= bn; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[an][bn];
}

/**
 * Normalizes input text for speech comparison
 */
export function normalizeSpeech(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Evaluates whether an input phrase contains the wake word "NOVA"
 * and returns the match confidence and any trailing command.
 */
export function matchWakeWord(rawText: string): WakeWordMatchResult {
  const normalized = normalizeSpeech(rawText);
  if (!normalized) {
    return { matched: false, confidence: 0 };
  }

  // 1. Direct multi-word or exact variant check (e.g., "no va", "know the", "nova")
  for (const variant of WAKE_WORD_VARIANTS) {
    // Check if variant appears as standalone word or token phrase
    const regex = new RegExp(`(^|\\b)${variant.replace('-', '[- ]?')}(\\b|$)`, 'i');
    const match = normalized.match(regex);
    if (match && match.index !== undefined) {
      // Check false-positive guard for "no", "now", etc.
      if (REJECT_WORDS.includes(normalized)) {
        continue;
      }

      // Extract command remainder after wake word
      const prefixEnd = match.index + match[0].length;
      const remainder = normalized.slice(prefixEnd).trim();

      return {
        matched: true,
        detectedVariant: variant,
        confidence: variant === 'nova' ? 1.0 : 0.92,
        commandRemainder: remainder,
      };
    }
  }

  // 2. Token-level fuzzy check using Levenshtein distance
  const tokens = normalized.split(/\s+/);
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    // Reject standalone common negative words
    if (REJECT_WORDS.includes(token)) {
      continue;
    }

    // Only compare tokens of length 3-6
    if (token.length >= 3 && token.length <= 6) {
      const dist = levenshteinDistance(token, 'nova');
      if (dist <= 1) {
        // e.g. "novo" (dist 1), "nover" (dist 1), "noah" (dist 1)
        const remainder = tokens.slice(i + 1).join(' ').trim();
        return {
          matched: true,
          detectedVariant: token,
          confidence: Math.max(0.75, 1 - dist * 0.2),
          commandRemainder: remainder,
        };
      }
    }
  }

  return { matched: false, confidence: 0 };
}

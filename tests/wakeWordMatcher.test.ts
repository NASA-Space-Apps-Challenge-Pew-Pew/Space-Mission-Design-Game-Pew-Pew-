import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { matchWakeWord, WAKE_WORD_VARIANTS, REJECT_WORDS } from '../src/game/wakeWordMatcher.ts';

describe('Wake Word Fuzzy Matcher Suite', () => {
  it('detects exact canonical "nova"', () => {
    const res = matchWakeWord('nova');
    assert.equal(res.matched, true);
    assert.equal(res.confidence, 1.0);
    assert.equal(res.commandRemainder, '');
  });

  it('detects "nova" with prefix and trailing command', () => {
    const res = matchWakeWord('hey nova summon a repair drone');
    assert.equal(res.matched, true);
    assert.equal(res.commandRemainder, 'summon a repair drone');
  });

  it('detects common phonetically similar variants', () => {
    const variantsToTest = ['no va', 'noah', 'novo', 'nover', 'norva', 'now that', 'know the', 'no-va'];
    for (const v of variantsToTest) {
      const res = matchWakeWord(`${v} refuel ship`);
      assert.equal(res.matched, true, `Expected "${v}" to match wake word`);
      assert.equal(res.commandRemainder, 'refuel ship');
    }
  });

  it('detects single token typos via Levenshtein distance', () => {
    const res = matchWakeWord('noba boost engines');
    assert.equal(res.matched, true);
    assert.equal(res.commandRemainder, 'boost engines');
  });

  it('rejects false-wake words (0% false wake rate on common negatives)', () => {
    const falsePositives = [
      'no',
      'not',
      'now',
      'never',
      'know',
      'go',
      'nobody',
      'nothing',
      'turn left',
      'boost engines',
      'fire thrusters',
      'flight control online',
      'november delta four',
    ];

    let falseAlarmCount = 0;
    for (const phrase of falsePositives) {
      const res = matchWakeWord(phrase);
      if (res.matched) {
        falseAlarmCount++;
      }
    }

    assert.equal(falseAlarmCount, 0, `False wake alarms detected: ${falseAlarmCount}`);
  });

  it('handles empty or whitespace strings safely', () => {
    assert.equal(matchWakeWord('').matched, false);
    assert.equal(matchWakeWord('   ').matched, false);
    assert.equal(matchWakeWord('?!@#$%^').matched, false);
  });
});

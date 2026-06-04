import {
  decisionFromScore,
  decisionColor,
  DECISION_COLORS,
} from '../src/utils/decision';

describe('decision helpers', () => {
  test('score boundaries map to decisions', () => {
    expect(decisionFromScore(0)).toBe('ALLOW');
    expect(decisionFromScore(30)).toBe('ALLOW');
    expect(decisionFromScore(31)).toBe('REVIEW');
    expect(decisionFromScore(70)).toBe('REVIEW');
    expect(decisionFromScore(71)).toBe('DENY');
    expect(decisionFromScore(100)).toBe('DENY');
  });

  test('custom thresholds change mapping', () => {
    expect(decisionFromScore(20, { allowMax: 10, reviewMax: 50 })).toBe('REVIEW');
  });

  test('decision colors match the spec', () => {
    expect(decisionColor('ALLOW')).toBe('#22c55e');
    expect(decisionColor('REVIEW')).toBe('#f59e0b');
    expect(decisionColor('DENY')).toBe('#ef4444');
    expect(Object.keys(DECISION_COLORS)).toHaveLength(3);
  });
});

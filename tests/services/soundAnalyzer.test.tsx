import { describe, it, expect } from 'vitest';
import { calculateEqForNoise } from '../../services/soundAnalyzer';

describe('calculateEqForNoise', () => {
  it('returns flat EQ for quiet environments', () => {
    const eq = calculateEqForNoise(0.02);
    expect(eq).toEqual({ low: 0, mid: 0, high: 0 });
  });

  it('boosts highs when noise level is high', () => {
    const eq = calculateEqForNoise(0.1);
    expect(eq).toEqual({ low: -2, mid: 1, high: 2 });
  });
});

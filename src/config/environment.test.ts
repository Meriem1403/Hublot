import { describe, expect, it } from 'vitest';
import { getEnvironmentLabel } from './environment';

describe('environment', () => {
  it('expose un libellé lisible pour le jury', () => {
    expect(getEnvironmentLabel()).toBeTruthy();
    expect(typeof getEnvironmentLabel()).toBe('string');
  });
});

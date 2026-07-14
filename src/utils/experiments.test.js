import { describe, it, expect, beforeEach } from 'vitest';
import { getAnnualSignupArm, DEFAULT_TRAFFIC_PCT } from './experiments';

beforeEach(() => {
  localStorage.clear();
});

describe('getAnnualSignupArm', () => {
  it('does not decide or cache an arm while trafficPct is still unresolved (undefined)', () => {
    expect(getAnnualSignupArm(undefined)).toBe('control');
    expect(localStorage.getItem('fa_annual_signup_arm')).toBeNull();
  });

  it('decides and caches an arm once a real trafficPct is known, and later calls with a different value stay sticky', () => {
    // 100% traffic guarantees 'variant' for any anon id, regardless of the hash.
    const decided = getAnnualSignupArm(100);
    expect(decided).toBe('variant');
    expect(localStorage.getItem('fa_annual_signup_arm')).toBe('variant');

    // A later call — e.g. after LandingContext's fetch resolves to a different
    // percentage, or the fetch fails and falls back to DEFAULT_TRAFFIC_PCT —
    // must not flip the already-decided arm for this visitor.
    expect(getAnnualSignupArm(0)).toBe('variant');
    expect(getAnnualSignupArm(DEFAULT_TRAFFIC_PCT)).toBe('variant');
  });

  it('a visitor who signs up before the config ever resolves is reported as control, matching that they never saw the card', () => {
    // Mirrors PricingSection computing the same 'control' result (hiding the
    // card) for this same unresolved-trafficPct render.
    expect(getAnnualSignupArm(undefined)).toBe('control');
    // And nothing was cached, so once the real value does arrive the visitor
    // gets a real decision instead of being stuck on the placeholder.
    expect(getAnnualSignupArm(100)).toBe('variant');
  });
});

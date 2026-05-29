import { describe, it, expect } from 'vitest';
import { detectIntent } from './intent';

describe('detectIntent', () => {
  // wallet triggers
  it('detects "wallet"', () => expect(detectIntent('my wallet balance').kind).toBe('wallet'));
  it('detects "add credits"', () => expect(detectIntent('I want to add credits').kind).toBe('wallet'));
  it('detects "buy credits"', () => expect(detectIntent('how do I buy credits').kind).toBe('wallet'));
  it('detects "top up"', () => expect(detectIntent('top up my account').kind).toBe('wallet'));
  it('detects "top-up"', () => expect(detectIntent('top-up now').kind).toBe('wallet'));
  it('detects "topup"', () => expect(detectIntent('topup').kind).toBe('wallet'));
  it('detects "credit" (singular)', () => expect(detectIntent('I need a credit').kind).toBe('wallet'));

  // annual triggers
  it('detects "annual"', () => expect(detectIntent('do you offer annual pricing').kind).toBe('annual'));
  it('detects "yearly"', () => expect(detectIntent('can I pay yearly').kind).toBe('annual'));
  it('detects "pay yearly"', () => expect(detectIntent('pay yearly please').kind).toBe('annual'));
  it('detects "year contract"', () => expect(detectIntent('is a year contract available').kind).toBe('annual'));

  // no-op / regression cases
  it('returns null for normal message', () => expect(detectIntent('what ZIP codes do you cover')).toBeNull());
  it('returns null for empty string', () => expect(detectIntent('')).toBeNull());
  it('"locked myself out" → null (no lock trigger in v1)', () =>
    expect(detectIntent('I locked myself out')).toBeNull());
  it('"lock my zip" → null', () => expect(detectIntent('lock my zip')).toBeNull());
  it('"unlock leads" → null', () => expect(detectIntent('unlock leads for me')).toBeNull());
  it('"territory" → null', () => expect(detectIntent('what territories do you cover')).toBeNull());

  // matched field
  it('returns matched text', () => {
    const result = detectIntent('I want to top up');
    expect(result).toEqual({ kind: 'wallet', matched: 'top up' });
  });

  // case insensitivity
  it('case insensitive — WALLET', () => expect(detectIntent('WALLET').kind).toBe('wallet'));
  it('case insensitive — ANNUAL', () => expect(detectIntent('ANNUAL plan').kind).toBe('annual'));
});

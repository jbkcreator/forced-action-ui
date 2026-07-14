// Annual-at-signup A/B bucketing (fa-annual-at-signup).
//
// A brand-new landing-page visitor has no subscriber_id yet, so the backend's
// subscriber_id-keyed ab_engine.assign_rollout_arm can't decide up front
// whether they should see the annual pricing card. This module buckets the
// visitor client-side instead: a random anon id is generated once and
// persisted (mirrors the fa_attribution pattern in attribution.js), hashed
// against the test name, and compared to a fixed traffic split.
//
// The computed arm is cached alongside the anon id so a visitor's experience
// can't flip across page loads even if the hash logic changes later. When the
// visitor eventually signs up, the arm is reported to /api/free-signup and
// persisted server-side against the new subscriber (ab_engine.record_pregenerated_arm).

const ANON_ID_KEY = 'fa_anon_id';
const ARM_CACHE_KEY = 'fa_annual_signup_arm';

const ANNUAL_SIGNUP_TEST_NAME = 'annual_at_signup_v1';

// Fallback only — used by LandingContext if GET /api/experiments/annual-signup
// can't be reached, once it gives up waiting and treats the fetch as failed.
// The real, toggleable value lives in the backend's ANNUAL_SIGNUP_TEST_TRAFFIC_PCT
// env var (config/settings.py) and is fetched once per page load in
// LandingContext, then threaded down to getAnnualSignupArm(trafficPct). Must
// match the guardrail-capped default (config/cora_guardrails.py:
// ab_test_traffic_cap) so a failed fetch doesn't accidentally over-expose the offer.
export const DEFAULT_TRAFFIC_PCT = 10;

function getOrCreateAnonId() {
  try {
    const existing = localStorage.getItem(ANON_ID_KEY);
    if (existing) return existing;
    const generated = `anon_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(ANON_ID_KEY, generated);
    return generated;
  } catch {
    // localStorage unavailable (private mode / disabled) — fall back to a
    // per-call random id. The visitor just won't get a stable bucket across
    // page loads, which only affects display consistency, not correctness.
    return `anon_${Math.random().toString(36).slice(2, 10)}`;
  }
}

// Small non-cryptographic string hash (FNV-1a) — deterministic, fast, good
// enough distribution for traffic bucketing. crypto.subtle has no MD5, and
// this doesn't need cryptographic strength, just consistency.
function fnv1aHash(str) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i += 1) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * Returns 'variant' or 'control' for the annual-at-signup experiment.
 * Deterministic per anon id, cached so repeat visits are stable.
 *
 * @param {number} [trafficPct] - % of visitors that should land in 'variant'.
 *   Pass the value fetched from GET /api/experiments/annual-signup
 *   (LandingContext's `annualSignupTrafficPct`). Undefined means "not resolved
 *   yet" (the fetch is still in flight) — this deliberately does NOT fall back
 *   to DEFAULT_TRAFFIC_PCT here. PricingSection renders synchronously on first
 *   paint, before that async fetch can possibly resolve, so treating a missing
 *   value as "use the default" would decide + permanently cache every new
 *   visitor's arm off the hardcoded fallback instead of the real, toggleable
 *   backend value — defeating the whole point of fetching it fresh. Callers
 *   just get 'control' (no card) until a real value — fetched or, on failure,
 *   LandingContext's own explicit DEFAULT_TRAFFIC_PCT fallback — arrives.
 */
export function getAnnualSignupArm(trafficPct) {
  try {
    const cached = localStorage.getItem(ARM_CACHE_KEY);
    if (cached === 'variant' || cached === 'control') return cached;
  } catch {
    // fall through to compute-and-not-cache below
  }

  if (typeof trafficPct !== 'number') return 'control';

  const anonId = getOrCreateAnonId();
  const bucket = fnv1aHash(`${ANNUAL_SIGNUP_TEST_NAME}:${anonId}`) % 100;
  const arm = bucket < trafficPct ? 'variant' : 'control';

  try {
    localStorage.setItem(ARM_CACHE_KEY, arm);
  } catch {
    // best-effort cache only
  }

  return arm;
}

// Meta Ads attribution capture (S2 — closed-loop tracking).
//
// Reads ad-click attribution from the landing URL once on app load and persists
// it to localStorage so it survives navigation through the signup/checkout flow.
// The stored object is later attached to subscription + lead-pack purchase
// requests; the backend forwards it into Stripe metadata and fires the Meta
// Conversions API Purchase event server-side.
//
// This module NEVER calls Meta, never holds the access token, and never hashes
// PII — all of that is backend-only.

const STORAGE_KEY = 'fa_attribution';

const PARAM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'campaign_id',
  'attribution_token',
  'fbclid',
  'ref',
];

function hasAnyAttributionParam(params) {
  return PARAM_KEYS.some((key) => params.has(key));
}

/**
 * Capture attribution params from the current URL into localStorage.
 * Only overwrites an existing capture when the URL actually carries
 * attribution params, so later in-app navigations don't wipe the first touch.
 * Safe to call on every load. Returns the stored attribution object.
 */
export function captureAttribution() {
  try {
    const params = new URLSearchParams(window.location.search);
    if (!hasAnyAttributionParam(params)) {
      return getAttribution();
    }

    const captured = { landing_page: window.location.href, captured_at: new Date().toISOString() };
    PARAM_KEYS.forEach((key) => {
      const value = params.get(key);
      if (value) captured[key] = value;
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(captured));
    return captured;
  } catch {
    return {};
  }
}

/** Return the stored attribution object (or {} when none / unavailable). */
export function getAttribution() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

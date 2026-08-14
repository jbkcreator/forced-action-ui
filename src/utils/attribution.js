// Attribution capture — UTM params, landing context, and GA4 client ID.
//
// Reads ad-click attribution from the landing URL once on app load and persists
// it to localStorage so it survives navigation through the signup/checkout flow.
// The stored object is later attached to subscription + lead-pack purchase
// requests; the backend forwards it into Stripe metadata, GHL custom fields,
// and fires the Meta Conversions API Purchase event server-side.
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

// Read GA4 client_id from the _ga cookie (set by gtag.js).
// Cookie format: GA1.1.<client_id> — strip the prefix.
function readGaClientId() {
  try {
    const match = document.cookie.match(/(?:^|;\s*)_ga=([^;]+)/);
    if (!match) return null;
    const parts = match[1].split('.');
    // GA1.1.<random>.<timestamp> → join last two segments
    return parts.length >= 4 ? `${parts[2]}.${parts[3]}` : null;
  } catch {
    return null;
  }
}

/**
 * Capture attribution from the current URL into localStorage.
 *
 * First-touch-wins: if fa_attribution already exists in localStorage, return it
 * unchanged. Otherwise capture everything — UTM params, landing_path, referrer,
 * and GA4 client_id — even when no UTM params are present, so every signup
 * carries at minimum the entry page and referring domain.
 *
 * Safe to call on every load.
 */
export function captureAttribution() {
  try {
    // First-touch guard — never overwrite an existing capture.
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing) return JSON.parse(existing);

    const params = new URLSearchParams(window.location.search);
    const captured = {
      landing_page: window.location.href,
      landing_path: window.location.pathname,
      captured_at: new Date().toISOString(),
    };

    // UTM + other URL params
    PARAM_KEYS.forEach((key) => {
      const value = params.get(key);
      if (value) captured[key] = value;
    });

    // Referrer domain only (no path — avoids leaking query strings)
    if (document.referrer) {
      try {
        captured.referrer = new URL(document.referrer).hostname;
      } catch {
        captured.referrer = document.referrer.slice(0, 100);
      }
    }

    // GA4 client ID for Measurement Protocol stitching (Part 3)
    const gaClientId = readGaClientId();
    if (gaClientId) captured.ga_client_id = gaClientId;

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

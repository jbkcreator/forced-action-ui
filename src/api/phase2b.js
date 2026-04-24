/**
 * Phase 2B API client — wrappers for the post-signup revenue engine endpoints.
 *
 * Matches the FastAPI signatures in src/api/main.py (Phase 2B section).
 * See docs/PLATFORM-OPERATIONS-GUIDE.md for semantics.
 */
import { api } from './client';

// ─── Free Signup ────────────────────────────────────────────────────────────
// POST /api/free-signup — creates (or reuses) a free-tier subscriber by email.
// Returns { subscriber_id, feed_uuid, tier, status, email, vertical, county_id }
export function createFreeSignup({ email, vertical = 'roofing', countyId = 'hillsborough', name = null, referralCode = null }) {
  return api.post('/api/free-signup', {
    email,
    vertical,
    county_id: countyId,
    name,
    referral_code: referralCode,
  });
}

// ─── Proof Moment ───────────────────────────────────────────────────────────
// GET /api/proof-leads?vertical=roofing&county_id=hillsborough
export function fetchProofLeads({ vertical = 'roofing', countyId = 'hillsborough' } = {}) {
  return api.get('/api/proof-leads', { vertical, county_id: countyId });
}

// ─── Monetization Wall ──────────────────────────────────────────────────────
// POST /api/wall/session — create a 24-hour wall session for a subscriber
export function openWallSession({ subscriberId, sessionId, vertical = 'roofing', countyId = 'hillsborough' }) {
  return api.post('/api/wall/session', {
    subscriber_id: subscriberId,
    session_id: sessionId,
    vertical,
    county_id: countyId,
  });
}

// GET /api/wall/{session_id} — poll for countdown + converted flag
export function fetchWallSession(sessionId) {
  return api.get(`/api/wall/${encodeURIComponent(sessionId)}`);
}

// ─── Payment Sheet ──────────────────────────────────────────────────────────
// POST /api/payment-intent — returns { client_secret, payment_intent_id, ... }
// feed_uuid authenticates the call (no login needed).
export function createPaymentIntent({
  feedUuid,
  amountCents,
  description,
  saveCard = true,       // default-save for future off-session charges
  metadata = {},
}) {
  return api.post('/api/payment-intent', {
    feed_uuid: feedUuid,
    amount_cents: amountCents,
    description,
    save_card: saveCard,
    metadata,
  });
}

// ─── Live ZIP activity (FOMO indicator) ─────────────────────────────────────
// GET /api/zip-activity?zip_code=33647&vertical=roofing
export function fetchZipActivity(zipCode, vertical) {
  const params = { zip_code: zipCode };
  if (vertical) params.vertical = vertical;
  return api.get('/api/zip-activity', params);
}

// ─── Deal-Size Capture ──────────────────────────────────────────────────────
// POST /api/deal-capture — subscriber reports a closed deal.
// feed_uuid authenticates. bucket ∈ {'5_10k' | '10_25k' | '25k_plus' | 'skip'}
export function captureDeal({
  feedUuid,
  bucket,
  dealAmount = null,
  daysToClose = null,
  propertyId = null,
}) {
  return api.post('/api/deal-capture', {
    feed_uuid: feedUuid,
    deal_size_bucket: bucket,
    deal_amount: dealAmount,
    days_to_close: daysToClose,
    property_id: propertyId,
  });
}

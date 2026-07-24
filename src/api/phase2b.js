/**
 * Phase 2B API client — wrappers for the post-signup revenue engine endpoints.
 *
 * Matches the FastAPI signatures in src/api/main.py (Phase 2B section).
 * See docs/PLATFORM-OPERATIONS-GUIDE.md for semantics.
 */
import { api } from './client';
import { getAttribution } from '../utils/attribution';

// ─── Free Signup ────────────────────────────────────────────────────────────
// POST /api/free-signup — creates (or reuses) a free-tier subscriber by email.
// Returns { subscriber_id, feed_uuid, tier, status, email, vertical, county_id }
export function createFreeSignup({
  email,
  vertical = 'roofing',
  countyId = 'hillsborough',
  name = null,
  referralCode = null,
  phone = null,
  consentAcceptance = null,
  // fa017 signup-source attribution
  signupSource = null,
  utmSource = null,
  utmMedium = null,
  utmCampaign = null,
  campaignId = null,
  attributionToken = null,
  // fa081 — affiliate ?aff= token (distinct from referralCode/peer loop)
  affiliateRef = null,
  // Phase 2B: tells the backend the user is mid-purchase so the welcome
  // email is deferred. Accepted values: 'upgrade' (paid plan), 'unlock'
  // ($4 lead unlock), or null (true free signup → send welcome now).
  intent = null,
}) {
  return api.post('/api/free-signup', {
    email,
    vertical,
    county_id: countyId,
    name,
    referral_code: referralCode,
    phone,
    consent_acceptance: consentAcceptance,
    signup_source: signupSource,
    utm_source: utmSource,
    utm_medium: utmMedium,
    utm_campaign: utmCampaign,
    campaign_id: campaignId,
    attribution_token: attributionToken,
    affiliate_ref: affiliateRef,
    intent,
  });
}

// fa017 — fire-and-forget audit endpoint for frontend-only events
// (LANDING_PAGE_VIEWED, SIGNUP_STARTED, LEAD_UNLOCK_CLICKED, etc.).
// Backend returns 204 always; we swallow any error so this never blocks UX.
export function logBusinessEvent(eventType, { feedUuid = null, payload = null } = {}) {
  return api
    .post('/api/business-event', {
      event_type: eventType,
      feed_uuid: feedUuid,
      payload,
    })
    .catch(() => {});
}

// ─── Proof Moment ───────────────────────────────────────────────────────────
// GET /api/proof-leads?vertical=roofing&county_id=hillsborough[&feed_uuid=...]
//
// Pass feedUuid after the user has signed up + paid for an unlock so the
// backend can mark previously-blurred leads as unlocked=true with full
// contact data.
export function fetchProofLeads({ vertical = 'roofing', countyId = 'hillsborough', feedUuid } = {}) {
  const params = { vertical, county_id: countyId };
  if (feedUuid) params.feed_uuid = feedUuid;
  return api.get('/api/proof-leads', params);
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
    attribution: getAttribution(),
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
  bucket = null,
  outcomeState = null,
  deadReason = null,
  dealAmount = null,
  daysToClose = null,
  propertyId = null,
}) {
  const body = {
    feed_uuid: feedUuid,
    deal_amount: dealAmount,
    days_to_close: daysToClose,
    property_id: propertyId,
  };
  // T-B13-01 contract: prefer outcome_state (closed/dead/pending). dead
  // requires a reason. Falls back to the legacy deal_size_bucket path.
  if (outcomeState) {
    body.outcome_state = outcomeState;
    if (deadReason) body.dead_reason = deadReason;
  } else {
    body.deal_size_bucket = bucket;
  }
  return api.post('/api/deal-capture', body);
}

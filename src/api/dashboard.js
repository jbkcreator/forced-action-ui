import { api } from './client';
import { subHeaders, withSubRefresh } from './subscriber.js';
import { getAttribution } from '../utils/attribution';

// fa061 — feed endpoints require a subscriber session JWT.
// subHeaders() attaches Authorization: Bearer <token>.
// withSubRefresh() clears the token and redirects to the feed-specific
// login page on 401.

function _loginPath(feedUuid) {
  return `/dashboard/${feedUuid}/login`;
}

export function fetchFeed(feedUuid, { page = 1, pageSize = 25, sort, minScore, incidentType, search, signal } = {}) {
  const params = { page, page_size: pageSize };
  if (sort && sort !== 'score_desc') params.sort = sort;
  if (minScore) params.min_score = minScore;
  if (incidentType) params.incident_type = incidentType;
  if (search) params.search = search;
  return withSubRefresh(
    () => api.get(`/api/feed/${feedUuid}`, params, { signal, headers: subHeaders() }),
    { loginPath: _loginPath(feedUuid) },
  );
}

export function fetchFeedStats(feedUuid, { signal } = {}) {
  return withSubRefresh(
    () => api.get(`/api/feed/${feedUuid}/stats`, undefined, { signal, headers: subHeaders() }),
    { loginPath: _loginPath(feedUuid) },
  ).catch(() => null);
}

export function createPortalSession(feedUuid) {
  return api.post('/api/portal-session', { feed_uuid: feedUuid });
}

export function logEvent(event, feedUuid) {
  return api.post('/api/log-event', { event, feed_uuid: feedUuid }).catch(() => {});
}

export function createLeadPackCheckout({ feedUuid, zipCode, vertical, countyId }) {
  return api.post('/api/lead-pack/checkout', {
    feed_uuid: feedUuid,
    zip_code: zipCode,
    vertical,
    county_id: countyId,
    attribution: getAttribution(),
  });
}

export function fetchLeadPack(purchaseId) {
  return api.get(`/api/lead-pack/${purchaseId}`);
}

export function fetchLeadPackHistory(feedUuid) {
  return api.get(`/api/lead-pack-history/${feedUuid}`);
}

export function fetchSubscriptionUpsellOffer({ feedUuid }) {
  return api.get('/api/upsell/subscription-offer', { feed_uuid: feedUuid });
}

export function unlockHotLead(feedUuid, leadId) {
  return api.post('/api/hot-lead-unlock', {
    feed_uuid: feedUuid,
    lead_id: String(leadId),
  });
}

export function unlockLead({ feedUuid, propertyId, leadTier, zip }) {
  return api.post('/api/payment-intent', {
    feed_uuid: feedUuid,
    amount_cents: 400,
    description: `Unlock ${leadTier || 'Gold'} lead in ${zip || 'your area'}`,
    save_card: true,
    metadata: { product: 'lead_unlock', property_id: String(propertyId) },
    attribution: getAttribution(),
  });
}

export function acceptSaveOffer(feedUuid) {
  return api.post('/api/upgrade', { feed_uuid: feedUuid, tier: 'data_only' });
}

export function fetchReferralStatus(feedUuid, { signal } = {}) {
  return api.get(`/api/referral/status/${feedUuid}`, undefined, { signal });
}

// POST /api/referral/claim-bonus-zip/{feed_uuid}  body: { zip_code }
//   200 → { ok, zip_code, bonus_zip_slots_remaining }
//   409 → no bonus slots available · 400 → ZIP validation failed / already owned / out of county
// Matches the auth style of fetchReferralStatus above (UUID-gated, no subHeaders).
export function claimBonusZip(feedUuid, zipCode) {
  return api.post(`/api/referral/claim-bonus-zip/${feedUuid}`, { zip_code: zipCode });
}

// Auto Mode — Phase 2B v9 add-on
// Returns { url, session_id }. Frontend should redirect to `url` for hosted
// Stripe Checkout. Webhook activates auto_mode_enabled=True on success.
export function createAutoModeCheckout({ feedUuid }) {
  return api.post('/api/checkout/auto-mode', { feed_uuid: feedUuid });
}

// REST counterpart of SMS AUTO ON/OFF. Backend enforces tier gating —
// non-entitled Starter callers get a 402 response so the UI can route
// them to the checkout flow above instead.
export function setAutoMode({ feedUuid, enabled }) {
  return api.post('/api/auto-mode/toggle', { feed_uuid: feedUuid, enabled });
}

/**
 * Helper: extract bundle_leads from a feed response, optionally filtered by type.
 * Returns [] when the feed hasn't loaded yet or has no bundle leads.
 */
export function getBundleLeads(feedData, bundleType = null) {
  const all = feedData?.bundle_leads || [];
  if (!bundleType) return all;
  return all.filter((l) => l.bundle_type === bundleType);
}

/**
 * Helper: check if any storm leads are present in the feed response.
 */
export function hasActiveStormBundle(feedData) {
  return (feedData?.bundle_leads || []).some((l) => l.bundle_type === 'storm');
}

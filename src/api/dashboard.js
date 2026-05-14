import { api } from './client';

export function fetchFeed(feedUuid, { page = 1, pageSize = 25, sort, minScore, incidentType, search, signal } = {}) {
  const params = { page, page_size: pageSize };
  if (sort && sort !== 'score_desc') params.sort = sort;
  if (minScore) params.min_score = minScore;
  if (incidentType) params.incident_type = incidentType;
  if (search) params.search = search;
  return api.get(`/api/feed/${feedUuid}`, params, { signal });
}

export function fetchFeedStats(feedUuid, { signal } = {}) {
  return api.get(`/api/feed/${feedUuid}/stats`, undefined, { signal }).catch(() => null);
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
  });
}

export function fetchLeadPack(purchaseId) {
  return api.get(`/api/lead-pack/${purchaseId}`);
}

export function fetchLeadPackHistory(feedUuid) {
  return api.get(`/api/lead-pack-history/${feedUuid}`);
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
  });
}

export function acceptSaveOffer(feedUuid) {
  return api.post('/api/upgrade', { feed_uuid: feedUuid, tier: 'data_only' });
}

export function fetchReferralStatus(feedUuid, { signal } = {}) {
  return api.get(`/api/referral/status/${feedUuid}`, undefined, { signal });
}

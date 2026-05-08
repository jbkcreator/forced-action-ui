import { apiRequest } from './client';

export async function fetchPartnerEligibility(feedUuid) {
  return apiRequest(`/api/upgrade/partner/eligibility?feed_uuid=${encodeURIComponent(feedUuid)}`);
}

export async function submitPartnerCheckout({ feedUuid, zipCodes, vertical }) {
  return apiRequest('/api/upgrade/partner', {
    method: 'POST',
    body: JSON.stringify({ feed_uuid: feedUuid, zip_codes: zipCodes, vertical }),
  });
}

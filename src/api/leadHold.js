import { api } from './client';

export function fetchLeadHoldStatus(propertyId, feedUuid, options = {}) {
  const params = {};
  if (feedUuid) params.feed_uuid = feedUuid;
  return api.get(`/api/leads/${propertyId}/hold`, params, options);
}

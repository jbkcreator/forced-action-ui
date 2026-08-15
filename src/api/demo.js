/**
 * Live Demo Mode API (3g + 3h + 3i).
 *
 * Auth: subscriber JWT in Authorization header (same token as the regular feed).
 * feed_uuid is passed as a query param so the backend can verify the token
 * belongs to the owner of that feed.
 * withSubRefresh handles 401 → redirect to login.
 */

import { api } from './client.js';
import { withSubRefresh, subHeaders } from './subscriber.js';

const BASE = '/api/demo';

export function fetchZipReveal(feedUuid, { zipCode, countyId, days = 7 }) {
  return withSubRefresh(
    () => api.get(
      `${BASE}/zip-reveal`,
      { feed_uuid: feedUuid, zip_code: zipCode, county_id: countyId, days },
      { headers: subHeaders() },
    ),
    { loginPath: `/dashboard/${feedUuid}/login` },
  );
}

export function prepareCall(feedUuid, { zipCode, vertical, countyId }) {
  return withSubRefresh(
    () => api.post(
      `${BASE}/prepare-call?feed_uuid=${feedUuid}`,
      { zip_code: zipCode, vertical, county_id: countyId },
      { headers: subHeaders() },
    ),
    { loginPath: `/dashboard/${feedUuid}/login` },
  );
}

export function revealLead(feedUuid, prepId) {
  return withSubRefresh(
    () => api.post(
      `${BASE}/reveal-lead/${prepId}?feed_uuid=${feedUuid}`,
      {},
      { headers: subHeaders() },
    ),
    { loginPath: `/dashboard/${feedUuid}/login` },
  );
}

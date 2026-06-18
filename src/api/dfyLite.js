import { api } from './client';
import { subHeaders, withSubRefresh } from './subscriber.js';

function _loginPath(feedUuid) {
  return `/dashboard/${feedUuid}/login`;
}

export function getDfyLiteOptions(feedUuid) {
  return withSubRefresh(
    () => api.get(`/api/feed/${feedUuid}/dfy-lite/options`, undefined, { headers: subHeaders() }),
    { loginPath: _loginPath(feedUuid) },
  );
}

export function getGenerationCount(feedUuid, propertyId) {
  return withSubRefresh(
    () => api.get(`/api/feed/${feedUuid}/dfy-lite/history/${propertyId}`, undefined, { headers: subHeaders() }),
    { loginPath: _loginPath(feedUuid) },
  ).then((data) => ({
    count: data.count ?? 0,
    max: data.limit ?? 3,
    remaining: data.remaining ?? 3,
  }));
}

export function generatePitch(feedUuid, payload) {
  return withSubRefresh(
    () => api.post(`/api/feed/${feedUuid}/dfy-lite/generate`, payload, { headers: subHeaders() }),
    { loginPath: _loginPath(feedUuid) },
  );
}

export function getDfyLiteHistory(feedUuid, propertyId) {
  return withSubRefresh(
    () => api.get(`/api/feed/${feedUuid}/dfy-lite/history/${propertyId}`, undefined, { headers: subHeaders() }),
    { loginPath: _loginPath(feedUuid) },
  );
}

export function getDfyLiteOrder(feedUuid, orderId) {
  return withSubRefresh(
    () => api.get(`/api/feed/${feedUuid}/dfy-lite/order/${orderId}`, undefined, { headers: subHeaders() }),
    { loginPath: _loginPath(feedUuid) },
  );
}

export function updatePitchOutput(feedUuid, orderId, updates) {
  return withSubRefresh(
    () => api.patch(`/api/feed/${feedUuid}/dfy-lite/order/${orderId}`, updates, { headers: subHeaders() }),
    { loginPath: _loginPath(feedUuid) },
  );
}

export function markPitchReviewed(feedUuid, orderId) {
  return withSubRefresh(
    () => api.post(`/api/feed/${feedUuid}/dfy-lite/order/${orderId}/review`, {}, { headers: subHeaders() }),
    { loginPath: _loginPath(feedUuid) },
  );
}

export function markPitchDelivered(feedUuid, orderId) {
  return withSubRefresh(
    () => api.post(`/api/feed/${feedUuid}/dfy-lite/order/${orderId}/deliver`, {}, { headers: subHeaders() }),
    { loginPath: _loginPath(feedUuid) },
  );
}

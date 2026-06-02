/**
 * ICP Channel Admin API client (fa066).
 *
 * ICP = customer group (contractor, rei_investor, ...).
 * Vertical = product category (roofing, restoration, ...) — separate concept.
 *
 * All endpoints require admin JWT (Authorization: Bearer <token>).
 */

import { apiRequest } from './client.js';

const BASE = '/api/admin/icp-channels';

function adminHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

/** List all ICP channels with config, DB state, and gate snapshot. */
export function fetchIcpChannels(token) {
  return apiRequest(BASE, { headers: adminHeaders(token) });
}

/** Detail for one channel: config + DB + gate scores + audit trail. */
export function fetchIcpChannel(token, key) {
  return apiRequest(`${BASE}/${key}`, { headers: adminHeaders(token) });
}

/**
 * Activate a gated ICP channel.
 * If force=true, reason is required.
 */
export function activateIcpChannel(token, key, { force = false, reason = null } = {}) {
  const url = `${BASE}/${key}/activate${force ? '?force=true' : ''}`;
  return apiRequest(url, {
    method: 'POST',
    headers: { ...adminHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
}

/** Pause an active ICP channel. */
export function pauseIcpChannel(token, key, reason = null) {
  return apiRequest(`${BASE}/${key}/pause`, {
    method: 'POST',
    headers: { ...adminHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
}

/** Kill (retire) an ICP channel. Terminal. */
export function killIcpChannel(token, key, reason = null) {
  return apiRequest(`${BASE}/${key}/kill`, {
    method: 'POST',
    headers: { ...adminHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
}

/** Update editable config fields (persona, pricing, landing_slug, etc.). */
export function updateIcpChannel(token, key, patch) {
  return apiRequest(`${BASE}/${key}`, {
    method: 'PATCH',
    headers: { ...adminHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
}

/** 30-day (or configurable) raw count + rate trend. */
export function fetchIcpMetrics(token, key, days = 30) {
  return apiRequest(`${BASE}/${key}/metrics?days=${days}`, { headers: adminHeaders(token) });
}

/** Subscribers attributed to this ICP channel. */
export function fetchIcpSubscribers(token, key, { limit = 50, offset = 0 } = {}) {
  return apiRequest(`${BASE}/${key}/subscribers?limit=${limit}&offset=${offset}`, {
    headers: adminHeaders(token),
  });
}

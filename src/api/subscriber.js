/**
 * Subscriber feed authentication API (fa061 + magic-link).
 *
 * Token stored in localStorage under 'sub_access_token'.
 * Feed UUID kept in localStorage under 'sub_feed_uuid' after login so the
 * dashboard can reconstruct the correct route after a page reload.
 *
 * Magic-link (passwordless) endpoints:
 *   subscriberRequestMagicLink(email) — emails a one-time login link
 *   subscriberVerifyMagicLink(token)  — exchanges the token for a session
 */

import { apiRequest } from './client.js';

const BASE = '/api/subscriber';

// ---------------------------------------------------------------------------
// Token helpers
// ---------------------------------------------------------------------------

const TOKEN_KEY = 'sub_access_token';
const UUID_KEY  = 'sub_feed_uuid';

export function getSubToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getSubFeedUuid() {
  return localStorage.getItem(UUID_KEY);
}

export function subHeaders(extra = {}) {
  const token = getSubToken();
  return token ? { Authorization: `Bearer ${token}`, ...extra } : extra;
}

function _storeSession(data) {
  if (data.access_token)  localStorage.setItem(TOKEN_KEY, data.access_token);
  if (data.feed_uuid)     localStorage.setItem(UUID_KEY,  data.feed_uuid);
}

export function subscriberLogout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(UUID_KEY);
}

/**
 * Wraps a fetch call: on 401 clear the token and redirect to the feed-specific
 * login route so the subscriber can re-authenticate.
 */
export async function withSubRefresh(fn, { loginPath = '/login' } = {}) {
  try {
    return await fn();
  } catch (err) {
    if (err?.status === 401) {
      subscriberLogout();
      window.location.href = loginPath;
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Auth endpoints
// ---------------------------------------------------------------------------

/**
 * Dual-mode login.
 *   email+password mode  — pass { email, password }
 *   uuid+password mode   — pass { feedUuid, password }
 */
export async function subscriberLogin({ email, feedUuid, password }) {
  const body = feedUuid
    ? { feed_uuid: feedUuid, password }
    : { email, password };

  const data = await apiRequest(`${BASE}/login`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  _storeSession(data);
  return data;
}

export async function subscriberRequestMagicLink(email) {
  return apiRequest(`${BASE}/magic-link/request`, {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function subscriberVerifyMagicLink(token) {
  const data = await apiRequest(`${BASE}/magic-link/verify`, {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
  _storeSession(data);
  return data;
}

export async function subscriberForgotPassword(email) {
  return apiRequest(`${BASE}/forgot-password`, {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function subscriberResetPassword(token, newPassword) {
  return apiRequest(`${BASE}/reset-password`, {
    method: 'POST',
    body: JSON.stringify({ token, new_password: newPassword }),
  });
}

// ---------------------------------------------------------------------------
// Auth-state helper (client-side only — no network call)
// ---------------------------------------------------------------------------

export function decodeSubToken() {
  const token = getSubToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      subscriberLogout();
      return null;
    }
    return payload; // { sub, feed_uuid, type, exp }
  } catch {
    return null;
  }
}

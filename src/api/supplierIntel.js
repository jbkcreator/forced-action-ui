/**
 * Supplier Intelligence Foundation — API client (fa067).
 *
 * Admin calls use Bearer JWT (Authorization header).
 * Supplier calls use X-Access-Token header with their UUID access token.
 */

import { apiRequest } from './client.js';

const ADMIN_BASE = '/api/admin/supplier-intel';
const SUB_BASE   = '/api/supplier';

function adminHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

function supplierHeaders(accessToken) {
  return { 'X-Access-Token': accessToken };
}

// ── Admin: account management ─────────────────────────────────────────────────

export function fetchSupplierAccounts(token, { status, limit = 50, offset = 0 } = {}) {
  const qs = new URLSearchParams({ limit, offset });
  if (status) qs.set('status', status);
  return apiRequest(`${ADMIN_BASE}/accounts?${qs}`, { headers: adminHeaders(token) });
}

export function createSupplierAccount(token, body) {
  return apiRequest(`${ADMIN_BASE}/accounts`, {
    method: 'POST',
    headers: { ...adminHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function fetchSupplierAccount(token, id) {
  return apiRequest(`${ADMIN_BASE}/accounts/${id}`, { headers: adminHeaders(token) });
}

/** Create a Stripe checkout session for a supplier account.
 *  plan_tier is resolved to a price ID on the backend — never passed as a raw price ID. */
export function createSupplierCheckout(token, accountId, planTier, withTrial = true) {
  return apiRequest(`${ADMIN_BASE}/accounts/${accountId}/checkout`, {
    method: 'POST',
    headers: { ...adminHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan_tier: planTier, with_trial: withTrial }),
  });
}

export function updateSupplierAccount(token, id, patch) {
  return apiRequest(`${ADMIN_BASE}/accounts/${id}`, {
    method: 'PATCH',
    headers: { ...adminHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
}

// ── Admin: reports ─────────────────────────────────────────────────────────────

export function generateSupplierReport(token, accountId, { county_id, plan_tier } = {}) {
  return apiRequest(`${ADMIN_BASE}/accounts/${accountId}/reports/generate`, {
    method: 'POST',
    headers: { ...adminHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ county_id, plan_tier }),
  });
}

export function downloadSupplierReport(token, accountId, reportId, format = 'pdf') {
  return `${ADMIN_BASE}/accounts/${accountId}/reports/${reportId}/export?format=${format}`;
}

// ── Supplier-facing ────────────────────────────────────────────────────────────

export function fetchSupplierStatus(accessToken) {
  return apiRequest(`${SUB_BASE}/status`, { headers: supplierHeaders(accessToken) });
}

export function fetchSupplierLatestReport(accessToken) {
  return apiRequest(`${SUB_BASE}/reports/latest`, { headers: supplierHeaders(accessToken) });
}

export function fetchSupplierReports(accessToken) {
  return apiRequest(`${SUB_BASE}/reports`, { headers: supplierHeaders(accessToken) });
}

export function getSupplierExportUrl(accessToken, reportId, format = 'pdf') {
  // Embed token as query param so the browser can follow the link directly
  // without needing to set a custom header (browser <a href> can't set headers).
  return `${SUB_BASE}/reports/${reportId}/export?format=${format}&token=${encodeURIComponent(accessToken)}`;
}

/**
 * Lead Delivery (admin) API layer — B4.
 *
 *   GET /api/admin/deliveries?account_id=&grade=&status=&property_id=&from=&to=&limit=&offset=
 *     → { total, limit, offset, items: [ {delivery_id, property_id, account_id,
 *          company_name, grade, vertical, status, rejection_reason, rejected_at,
 *          billing_period_end, delivered_at, source}, ... ] }
 *
 * Admin-gated: pass the admin JWT; it is sent as a Bearer token.
 */

import { api } from './client';

const DELIVERIES_PATH = '/api/admin/deliveries';

function clean(params = {}) {
  const out = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === '' || v === null || v === undefined) continue;
    out[k] = v;
  }
  return out;
}

export function fetchDeliveries(token, params = {}, options = {}) {
  return api.get(DELIVERIES_PATH, clean(params), {
    headers: { Authorization: `Bearer ${token}` },
    ...options,
  });
}

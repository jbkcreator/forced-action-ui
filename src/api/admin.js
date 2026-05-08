/**
 * Admin API helpers.
 *
 * All endpoints require a Bearer JWT obtained from POST /api/admin/login.
 * The admin page persists the token in localStorage under TOKEN_KEY.
 */
const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

async function adminFetch(token, path, options = {}) {
  const { signal, ...rest } = options;
  const headers = { Authorization: `Bearer ${token}`, ...(rest.headers || {}) };
  if (rest.body !== undefined && !(rest.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    rest.body = typeof rest.body === 'string' ? rest.body : JSON.stringify(rest.body);
  }
  const res = await fetch(`${API_BASE}${path}`, { ...rest, headers, signal });
  const text = await res.text();
  const data = text ? safeJson(text) : null;
  if (!res.ok) {
    const detail = (data && (data.detail || data.message)) || `HTTP ${res.status}`;
    const err = new Error(detail);
    err.status = res.status;
    err.detail = detail;
    err.body = data;
    throw err;
  }
  return data;
}

function safeJson(text) {
  try { return JSON.parse(text); } catch { return text; }
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export async function adminLogin(username, password) {
  const res = await fetch(`${API_BASE}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw { status: res.status, detail: data.detail || 'Login failed' };
  return data.access_token;
}

// ─── Existing tabs (Upload, Synthflow, Refunds, Coverage) ───────────────────
export function fetchSynthflowConfig(token, options) {
  return adminFetch(token, '/api/admin/synthflow/config', options);
}

export function fetchUnlockRefunds(token, { limit = 50, offset = 0 } = {}, options = {}) {
  return adminFetch(token, `/api/admin/refunds/unlocks?limit=${limit}&offset=${offset}`, options);
}

export function issueRefund(token, sentLeadId, reason, options = {}) {
  return adminFetch(token, `/api/admin/refunds/unlock/${sentLeadId}`, {
    method: 'POST',
    body: { reason },
    ...options,
  });
}

export function fetchContactCoverage(token, countyId = 'hillsborough', options = {}) {
  return adminFetch(token, `/api/admin/stats/contact-coverage?county_id=${encodeURIComponent(countyId)}`, options);
}

export function uploadTaxDelinquency(token, file, countyId, taxYear) {
  const form = new FormData();
  form.append('file', file);
  form.append('county_id', countyId || 'hillsborough');
  if (taxYear) form.append('tax_year', taxYear);
  return adminFetch(token, '/api/admin/upload/tax-delinquency', { method: 'POST', body: form });
}

// ─── New tabs (DLQ, Sandbox) ────────────────────────────────────────────────
export function fetchDlq(token, { limit = 100, offset = 0, reason, q } = {}, options = {}) {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (reason) params.set('reason', reason);
  if (q) params.set('q', q);
  return adminFetch(token, `/admin/dlq?${params.toString()}`, options);
}

export function dispatchSandboxEvent(token, body, options = {}) {
  return adminFetch(token, '/api/admin/sandbox/dispatch-event', {
    method: 'POST',
    body,
    ...options,
  });
}

export function fetchSandboxOutbox(token, filters = {}, options = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
  });
  const qs = params.toString();
  return adminFetch(token, `/api/admin/sandbox/outbox${qs ? `?${qs}` : ''}`, options);
}

// Per-SKU margin / refund / dispute summary
export function fetchSkuMargin(token, options = {}) {
  return adminFetch(token, '/api/admin/stats/sku-margin', options);
}

// ─── Gate Monitoring ─────────────────────────────────────────────────────────
export function fetchGateMetrics(token, { days = 1, graph_name } = {}, options = {}) {
  const params = new URLSearchParams({ days: String(days) });
  if (graph_name) params.set('graph_name', graph_name);
  return adminFetch(token, `/api/admin/gate-metrics?${params.toString()}`, options);
}

export function fetchKillSwitchStatus(token, options = {}) {
  return adminFetch(token, '/api/admin/kill-switch-status', options);
}

export function fetchDecisionAudit(token, decisionId, options = {}) {
  return adminFetch(token, `/api/admin/decision-audit/${encodeURIComponent(decisionId)}`, options);
}

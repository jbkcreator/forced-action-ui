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

// ─── County Management ───────────────────────────────────────────────────────

export function fetchCounties(token, includeInactive = false, options = {}) {
  return adminFetch(token, `/api/admin/counties?include_inactive=${includeInactive}`, options);
}

export function createCounty(token, body, options = {}) {
  return adminFetch(token, '/api/admin/counties', { method: 'POST', body, ...options });
}

export function updateCounty(token, countyId, body, options = {}) {
  return adminFetch(token, `/api/admin/counties/${encodeURIComponent(countyId)}`, {
    method: 'PATCH', body, ...options,
  });
}

export function deactivateCounty(token, countyId, options = {}) {
  return adminFetch(token, `/api/admin/counties/${encodeURIComponent(countyId)}`, {
    method: 'DELETE', ...options,
  });
}

export function fetchSources(token, countyId, includeInactive = false, options = {}) {
  return adminFetch(
    token,
    `/api/admin/counties/${encodeURIComponent(countyId)}/sources?include_inactive=${includeInactive}`,
    options,
  );
}

export function addSource(token, countyId, body, options = {}) {
  return adminFetch(token, `/api/admin/counties/${encodeURIComponent(countyId)}/sources`, {
    method: 'POST', body, ...options,
  });
}

export function updateSource(token, countyId, sourceId, body, options = {}) {
  return adminFetch(
    token,
    `/api/admin/counties/${encodeURIComponent(countyId)}/sources/${sourceId}`,
    { method: 'PUT', body, ...options },
  );
}

export function deactivateSource(token, countyId, sourceId, options = {}) {
  return adminFetch(
    token,
    `/api/admin/counties/${encodeURIComponent(countyId)}/sources/${sourceId}`,
    { method: 'DELETE', ...options },
  );
}

// ─── Column Mapping Approvals ────────────────────────────────────────────────

export function fetchPendingMappings(token, options = {}) {
  return adminFetch(token, '/api/admin/mappings/pending', options);
}

export function fetchApprovedMappings(token, options = {}) {
  return adminFetch(token, '/api/admin/mappings/approved', options);
}

export function fetchRejectedMappings(token, options = {}) {
  return adminFetch(token, '/api/admin/mappings/rejected', options);
}

export function approveMapping(token, mappingId, mappingOverrides = null, options = {}) {
  return adminFetch(token, `/api/admin/mappings/${mappingId}/approve`, {
    method: 'POST',
    body: { mapping_overrides: mappingOverrides },
    ...options,
  });
}

export function rejectMapping(token, mappingId, feedback, options = {}) {
  return adminFetch(token, `/api/admin/mappings/${mappingId}/reject`, {
    method: 'POST',
    body: { feedback },
    ...options,
  });
}

export function updateMapping(token, mappingId, body, options = {}) {
  // body shape:
  //   {
  //     column_updates?: {sourceCol: canonicalCol, ...},
  //     post_processors?: [{op, from, sep, into}, ...],
  //     value_maps?: {col: {raw: canonical, ...}},
  //     row_routing?: {column, default, rules}
  //   }
  // Any omitted field leaves that side of the mapping untouched.
  // Back-compat: callers that still pass a plain dict are treated as column_updates.
  const payload = body && (
    body.column_updates !== undefined
    || body.post_processors !== undefined
    || body.value_maps !== undefined
    || body.row_routing !== undefined
  ) ? body : { column_updates: body };
  return adminFetch(token, `/api/admin/mappings/${mappingId}`, {
    method: 'PATCH',
    body: payload,
    ...options,
  });
}

// ─── Playwright code lifecycle ────────────────────────────────────────────────
// All endpoints scoped to /api/admin/counties/{countyId}/sources/{sourceId}.

export function generatePlaywrightCode(token, countyId, sourceId, options = {}) {
  return adminFetch(
    token,
    `/api/admin/counties/${encodeURIComponent(countyId)}/sources/${sourceId}/playwright-code/generate`,
    { method: 'POST', ...options },
  );
}

export function validatePlaywrightCode(token, countyId, sourceId, code, options = {}) {
  return adminFetch(
    token,
    `/api/admin/counties/${encodeURIComponent(countyId)}/sources/${sourceId}/playwright-code/validate`,
    { method: 'POST', body: { code }, ...options },
  );
}

export function savePlaywrightCode(token, countyId, sourceId, code, approved, options = {}) {
  return adminFetch(
    token,
    `/api/admin/counties/${encodeURIComponent(countyId)}/sources/${sourceId}/playwright-code`,
    { method: 'POST', body: { code, approved }, ...options },
  );
}

export function approvePlaywrightCode(token, countyId, sourceId, options = {}) {
  return adminFetch(
    token,
    `/api/admin/counties/${encodeURIComponent(countyId)}/sources/${sourceId}/playwright-code/approve`,
    { method: 'POST', ...options },
  );
}

export function clearPlaywrightCode(token, countyId, sourceId, options = {}) {
  return adminFetch(
    token,
    `/api/admin/counties/${encodeURIComponent(countyId)}/sources/${sourceId}/playwright-code`,
    { method: 'DELETE', ...options },
  );
}

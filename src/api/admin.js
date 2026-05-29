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

// ─── DLQ ─────────────────────────────────────────────────────────────────────
export function fetchDlq(token, { limit = 100, offset = 0, reason, q } = {}, options = {}) {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (reason) params.set('reason', reason);
  if (q) params.set('q', q);
  return adminFetch(token, `/admin/dlq?${params.toString()}`, options);
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

export function fetchAdminStormPacks(token, { limit = 50, offset = 0 } = {}, options = {}) {
  return adminFetch(token, `/api/admin/storm-packs?limit=${limit}&offset=${offset}`, options);
}

// ─── Cora Intelligence (fa036 + fa037) ───────────────────────────────────────

export function fetchRevenueSignal(token, subscriberId, historyLimit = 20, options = {}) {
  return adminFetch(token, `/api/admin/subscribers/${subscriberId}/revenue-signal?history_limit=${historyLimit}`, options);
}

export function fetchCoraAutonomy(token, weeks = 8, options = {}) {
  return adminFetch(token, `/api/admin/cora-autonomy?weeks=${weeks}`, options);
}

export function fetchCoraPlaybooks(token, status = 'recommended', options = {}) {
  return adminFetch(token, `/api/admin/cora-playbooks?status=${status}`, options);
}

export function adoptPlaybook(token, id, actor, options = {}) {
  return adminFetch(token, `/api/admin/cora-playbook/${id}/adopt`, { method: 'POST', body: { actor }, ...options });
}

export function rejectPlaybook(token, id, actor, reason = '', options = {}) {
  return adminFetch(token, `/api/admin/cora-playbook/${id}/reject`, { method: 'POST', body: { actor, reason }, ...options });
}

export function retirePlaybook(token, id, actor, options = {}) {
  return adminFetch(token, `/api/admin/cora-playbook/${id}/retire`, { method: 'POST', body: { actor }, ...options });
}

// ─── Attribution (Stage 8) ────────────────────────────────────────────────────

export function fetchAttributionStats(token, { groupBy = 'conversion_type', dateFrom, dateTo } = {}, options = {}) {
  const params = new URLSearchParams({ group_by: groupBy });
  if (dateFrom) params.set('date_from', dateFrom);
  if (dateTo) params.set('date_to', dateTo);
  return adminFetch(token, `/api/admin/attribution/stats?${params.toString()}`, options);
}

export function fetchAttributionConversions(token, filters = {}, options = {}) {
  const params = new URLSearchParams();
  const keys = [
    'page', 'per_page', 'conversion_type', 'zip_code', 'trade',
    'wallet_tier', 'lock_status', 'autopilot_tier', 'bundle_type',
    'deal_size_bucket', 'subscriber_id', 'date_from', 'date_to',
  ];
  keys.forEach(k => { if (filters[k] != null && filters[k] !== '') params.set(k, String(filters[k])); });
  return adminFetch(token, `/api/admin/attribution/conversions?${params.toString()}`, options);
}

export function fetchAttributionSubscriber(token, subscriberId, options = {}) {
  return adminFetch(token, `/api/admin/attribution/subscriber/${encodeURIComponent(subscriberId)}`, options);
}

export function fetchAttributionTrace(token, eventId, options = {}) {
  return adminFetch(token, `/api/admin/attribution/trace/${encodeURIComponent(eventId)}`, options);
}

// ─── Cora Incidents (fa034) ───────────────────────────────────────────────────

export function fetchCoraIncidents(token, filters = {}, options = {}) {
  const params = new URLSearchParams();
  const keys = ['severity', 'metric_name', 'feature_name', 'action_taken', 'date_from', 'date_to', 'limit', 'offset'];
  keys.forEach(k => { if (filters[k] != null && filters[k] !== '') params.set(k, String(filters[k])); });
  if (filters.open_only) params.set('open_only', 'true');
  return adminFetch(token, `/api/admin/cora-incidents?${params.toString()}`, options);
}

export function fetchCoraIncidentDetail(token, incidentId, options = {}) {
  return adminFetch(token, `/api/admin/cora-incidents/${incidentId}`, options);
}

export function acknowledgeCoraIncident(token, incidentId, body = {}, options = {}) {
  return adminFetch(token, `/api/admin/cora-incidents/${incidentId}/acknowledge`, {
    method: 'POST', body, ...options,
  });
}

export function resolveCoraIncident(token, incidentId, body = {}, options = {}) {
  return adminFetch(token, `/api/admin/cora-incidents/${incidentId}/resolve`, {
    method: 'POST', body, ...options,
  });
}

// fa045 — fetchCoraTimeline removed; use fetchSubscriberConversation below.

// GET /api/admin/cora/subscribers/{subscriberId}/timeline
// opts: { cursor, limit, graphName, status, since }
// Returns { subscriber_id, items, next_cursor }
export function fetchCoraTimeline(token, subscriberId, opts = {}, options = {}) {
  const params = new URLSearchParams();
  if (opts.cursor) params.set('cursor', opts.cursor);
  if (opts.limit) params.set('limit', String(opts.limit));
  if (opts.graphName) params.set('graph_name', opts.graphName);
  if (opts.status) params.set('status', opts.status);
  if (opts.since) params.set('since', opts.since);
  const qs = params.toString();
  return adminFetch(token, `/api/admin/cora/subscribers/${subscriberId}/timeline${qs ? '?' + qs : ''}`, options);
}

// ─── SMS Analytics (fa038) ───────────────────────────────────────────────────

export function fetchMessageOutcomes(token, filters = {}, options = {}) {
  const params = new URLSearchParams();
  const keys = [
    'trade_vertical', 'county_id', 'behavioral_segment', 'revenue_signal_score_band',
    'last_action_recency_band', 'prompt_version', 'conversion_type',
    'template_id', 'variant_id', 'channel', 'message_type',
    'subscriber_id', 'date_from', 'date_to', 'page', 'per_page',
  ];
  keys.forEach(k => { if (filters[k] != null && filters[k] !== '') params.set(k, String(filters[k])); });
  return adminFetch(token, `/api/admin/message-outcomes?${params.toString()}`, options);
}

export function fetchMessageOutcomeDetail(token, messageId, options = {}) {
  return adminFetch(token, `/api/admin/message-outcomes/${messageId}`, options);
}

export function fetchSmsVariantPerformance(token, { groupBy = 'prompt_version', dateFrom, dateTo } = {}, options = {}) {
  const params = new URLSearchParams({ group_by: groupBy });
  if (dateFrom) params.set('date_from', dateFrom);
  if (dateTo) params.set('date_to', dateTo);
  return adminFetch(token, `/api/admin/sms-variant-performance?${params.toString()}`, options);
}

// ─── Operator CRM (fa045) ───────────────────────────────────────────────────
export function fetchSubscribers(token, filters = {}, options = {}) {
  const p = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') p.set(k, String(v));
  });
  const qs = p.toString();
  return adminFetch(token, `/api/admin/subscribers${qs ? '?' + qs : ''}`, options);
}

export function fetchHotSubscribers(token, options = {}) {
  return adminFetch(token, '/api/admin/subscribers/hot', options);
}

export function fetchSubscriberDetail(token, id, options = {}) {
  return adminFetch(token, `/api/admin/subscribers/${id}`, options);
}

export function fetchSubscriberConversation(token, id, opts = {}, options = {}) {
  const p = new URLSearchParams();
  if (opts.limit) p.set('limit', String(opts.limit));
  if (opts.before) p.set('before', opts.before);
  const qs = p.toString();
  return adminFetch(token, `/api/admin/subscribers/${id}/conversation${qs ? '?' + qs : ''}`, options);
}

export function fetchSubscriberDeals(token, id, includeClosed = false, options = {}) {
  return adminFetch(token, `/api/admin/subscribers/${id}/deals?include_closed=${includeClosed}`, options);
}

export function updateDealStage(token, dealId, pipelineStage, note, options = {}) {
  return adminFetch(token, `/api/admin/deals/${dealId}`, {
    method: 'PATCH',
    body: { pipeline_stage: pipelineStage, note: note || null },
    ...options,
  });
}

export function fetchSubscriberNotes(token, id, options = {}) {
  return adminFetch(token, `/api/admin/subscribers/${id}/notes`, options);
}

export function createSubscriberNote(token, id, body, pinned = false, options = {}) {
  return adminFetch(token, `/api/admin/subscribers/${id}/notes`, {
    method: 'POST', body: { body, pinned }, ...options,
  });
}

export function updateSubscriberNote(token, noteId, patch, options = {}) {
  return adminFetch(token, `/api/admin/notes/${noteId}`, {
    method: 'PATCH', body: patch, ...options,
  });
}

export function deleteSubscriberNote(token, noteId, options = {}) {
  return adminFetch(token, `/api/admin/notes/${noteId}`, { method: 'DELETE', ...options });
}

export function fetchSubscriberTags(token, id, options = {}) {
  return adminFetch(token, `/api/admin/subscribers/${id}/tags`, options);
}

export function addSubscriberTag(token, id, tag, options = {}) {
  return adminFetch(token, `/api/admin/subscribers/${id}/tags`, {
    method: 'POST', body: { tag }, ...options,
  });
}

export function removeSubscriberTag(token, id, tag, options = {}) {
  return adminFetch(token, `/api/admin/subscribers/${id}/tags/${encodeURIComponent(tag)}`, {
    method: 'DELETE', ...options,
  });
}

export function fetchTagSuggestions(token, options = {}) {
  return adminFetch(token, '/api/admin/subscriber-tag-suggestions', options);
}

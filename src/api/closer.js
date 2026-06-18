/**
 * Closer Cockpit API layer — Sprint S1b-FE.
 *
 * Endpoints:
 *   GET  /api/admin/human-close?status=open          → escalation queue
 *   GET  /api/admin/subscribers/{id}/closer-calls    → per-subscriber call timeline
 *   POST /api/admin/closer-calls                     → dial-time correlation
 *   POST /api/admin/closer-calls/{id}/feedback       → one-tap feedback
 *   POST /api/admin/human-close/{id}/outcome         → close/remove from queue
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

// ─── Queue ────────────────────────────────────────────────────────────────────

export function fetchCloserQueue(token, opts = {}) {
  return adminFetch(token, '/api/admin/human-close?status=open', opts);
}

// ─── Prospect detail (tags, notes, open_deals_count) ─────────────────────────

export function fetchProspectDetail(token, subscriberId, opts = {}) {
  return adminFetch(token, `/api/admin/subscribers/${subscriberId}`, opts);
}

// ─── Per-subscriber call timeline ─────────────────────────────────────────────

export function fetchProspectCalls(token, subscriberId, opts = {}) {
  return adminFetch(token, `/api/admin/subscribers/${subscriberId}/closer-calls`, opts);
}

// ─── Call lifecycle ───────────────────────────────────────────────────────────

// Called immediately on outgoing_call SDK event.
// body: { aircall_call_id, subscriber_id, escalation_id?, dialed_e164? }
// Returns CorrelateResult: { id, aircall_call_id, subscriber_id, escalation_id, status, created_at }
export function createCloserCall(token, body) {
  return adminFetch(token, '/api/admin/closer-calls', { method: 'POST', body });
}

// body: { objection_type?, pitch_variant?, lead_quality_rating? }
export function saveCallFeedback(token, callDbId, body) {
  return adminFetch(token, `/api/admin/closer-calls/${callDbId}/feedback`, { method: 'POST', body });
}

// ─── Escalation outcome ───────────────────────────────────────────────────────

// outcome: 'won' | 'lost' | 'no_response' | 'rescheduled'
// API doc §4.6: outcome as query param
export function saveEscalationOutcome(token, escalationId, outcome, closerAssigned) {
  const params = new URLSearchParams({ outcome });
  if (closerAssigned) params.set('closer_assigned', closerAssigned);
  return adminFetch(token, `/api/admin/human-close/${escalationId}/outcome?${params.toString()}`, {
    method: 'POST',
  });
}

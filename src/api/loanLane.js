/**
 * Loan Lane + Broker management API — admin-facing endpoints.
 *
 * Admin endpoints:
 *   GET  /api/lanes                             all lanes (admin-scoped)
 *   GET  /api/lanes/{laneId}                    lane detail + transitions
 *   GET  /api/lanes/{laneId}/transitions
 *   POST /api/admin/lanes/{laneId}/assign-broker
 *   GET  /api/admin/brokers                     list brokers + lane counts
 *   GET  /api/admin/brokers/{brokerId}/lanes    by-broker lane lens
 *   POST /api/admin/brokers                     create/invite broker
 *   PATCH /api/admin/brokers/{brokerId}         activate/deactivate
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------
const USE_MOCK = false;

const MOCK_BROKERS = [
  { broker_id: 'b-001', name: 'Jane Broker',  email: 'jane@example.com',  is_active: true,  open_lanes: 2, assigned_lanes: 2 },
  { broker_id: 'b-002', name: 'Tom Closer',   email: 'tom@example.com',   is_active: true,  open_lanes: 1, assigned_lanes: 1 },
  { broker_id: 'b-003', name: 'Sara Pending', email: 'sara@example.com',  is_active: false, open_lanes: 0, assigned_lanes: 0 },
];

const MOCK_LENDERS = [
  { lender_id: 'l-001', name: 'Suncoast Funding Partners', is_cleared: true,  is_active: true  },
  { lender_id: 'l-002', name: 'Bay Area Bridge Capital',   is_cleared: true,  is_active: true  },
  { lender_id: 'l-003', name: 'Gulf Coast Lenders LLC',    is_cleared: false, is_active: true  },
];

const MOCK_ADMIN_LANES = [
  {
    lane_id: 'lane-001',
    lane_type: 'distressed-payoff',
    current_stage: 'entered',
    current_stage_display: 'Entered',
    current_work_state: 'working',
    outcome: 'open',
    assigned_broker_id: 'b-001',
    assigned_broker_name: 'Jane Broker',
    entered_at: '2025-06-01T10:00:00Z',
    fee_config_flag: false,
    is_stale: false, lender_id: 'l-001', lender_name: 'Suncoast Funding Partners',
    property: { address: '123 Main St', city: 'Tampa', state: 'FL', county: 'Hillsborough', owner_name: 'John Homeowner' },
  },
  {
    lane_id: 'lane-002',
    lane_type: 'distressed-payoff',
    current_stage: 'quoted',
    current_stage_display: 'Quoted',
    current_work_state: 'quoted',
    outcome: 'open',
    assigned_broker_id: 'b-001',
    assigned_broker_name: 'Jane Broker',
    // 35 days ago → stale (D14)
    entered_at: '2026-05-25T14:30:00Z',
    fee_config_flag: false,
    is_stale: true, lender_id: null, lender_name: null,
    property: { address: '456 Oak Ave', city: 'Tampa', state: 'FL', county: 'Hillsborough', owner_name: 'Mary Smith' },
  },
  {
    lane_id: 'lane-003',
    lane_type: 'distressed-payoff',
    current_stage: 'funded',
    current_stage_display: 'Funded',
    current_work_state: 'closed_won',
    outcome: 'funded',
    assigned_broker_id: 'b-001',
    assigned_broker_name: 'Jane Broker',
    entered_at: '2026-05-20T09:00:00Z',
    fee_config_flag: false,
    is_stale: false, lender_id: 'l-002', lender_name: 'Bay Area Bridge Capital',
    property: { address: '789 Pine Rd', city: 'Brandon', state: 'FL', county: 'Hillsborough', owner_name: 'Bob Johnson' },
  },
  {
    lane_id: 'lane-004',
    lane_type: 'distressed-payoff',
    current_stage: 'entered',
    current_stage_display: 'Entered',
    current_work_state: 'unassigned',
    outcome: 'open',
    assigned_broker_id: null,
    assigned_broker_name: null,
    entered_at: '2026-06-12T08:00:00Z',
    fee_config_flag: false,
    is_stale: false, lender_id: null, lender_name: null,
    property: { address: '22 River Ln', city: 'St. Petersburg', state: 'FL', county: 'Pinellas', owner_name: 'Carol White' },
  },
  {
    lane_id: 'lane-005',
    lane_type: 'distressed-payoff',
    current_stage: 'entered',
    current_stage_display: 'Entered',
    current_work_state: 'unassigned',
    outcome: 'open',
    assigned_broker_id: null,
    assigned_broker_name: null,
    entered_at: '2026-06-13T11:00:00Z',
    fee_config_flag: false,
    is_stale: false, lender_id: null, lender_name: null,
    property: { address: '99 Harbor Dr', city: 'Clearwater', state: 'FL', county: 'Pinellas', owner_name: 'David Lee' },
  },
];

const MOCK_TRANSITIONS = {
  'lane-001': [
    { transition_id: 't-001', from_state: null, to_state: 'unassigned', actor: 'system', reason_code: 'qualified', occurred_at: '2025-06-01T10:00:00Z' },
    { transition_id: 't-002', from_state: 'unassigned', to_state: 'assigned', actor: 'admin@example.com', reason_code: 'qualified', occurred_at: '2025-06-02T08:00:00Z' },
    { transition_id: 't-003', from_state: 'assigned', to_state: 'working', actor: 'jane@example.com', reason_code: 'no_contact', occurred_at: '2025-06-03T11:30:00Z' },
  ],
};

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function adminHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

async function adminFetch(token, path, options = {}) {
  const { signal, ...rest } = options;
  const headers = { ...adminHeaders(token), ...(rest.headers || {}) };
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

// ---------------------------------------------------------------------------
// Lane endpoints (admin)
// ---------------------------------------------------------------------------

export function fetchAllLanes(token, params = {}, opts = {}) {
  if (USE_MOCK) return Promise.resolve({ lanes: MOCK_ADMIN_LANES, total: MOCK_ADMIN_LANES.length, limit: 50, offset: 0 });
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== null && v !== undefined && v !== '') qs.set(k, v); });
  const query = qs.toString() ? `?${qs}` : '';
  return adminFetch(token, `/api/lanes${query}`, opts);
}

export function fetchAdminLane(token, laneId, opts = {}) {
  if (USE_MOCK) {
    const lane = MOCK_ADMIN_LANES.find(l => l.lane_id === laneId);
    if (!lane) return Promise.reject(Object.assign(new Error('Not found'), { status: 404 }));
    return Promise.resolve(lane);
  }
  return adminFetch(token, `/api/lanes/${laneId}`, opts);
}

export function fetchAdminLaneTransitions(token, laneId, opts = {}) {
  if (USE_MOCK) return Promise.resolve({ transitions: MOCK_TRANSITIONS[laneId] || [] });
  return adminFetch(token, `/api/lanes/${laneId}/transitions`, opts);
}

export function assignBroker(token, laneId, brokerId, opts = {}) {
  if (USE_MOCK) return Promise.resolve({ lane_id: laneId, assigned_broker_id: brokerId });
  return adminFetch(token, `/api/admin/lanes/${laneId}/assign-broker`, {
    method: 'POST',
    body: JSON.stringify({ broker_id: brokerId }),
    ...opts,
  });
}

// ---------------------------------------------------------------------------
// Broker management (admin)
// ---------------------------------------------------------------------------

export function listBrokers(token, opts = {}) {
  if (USE_MOCK) return Promise.resolve({ brokers: MOCK_BROKERS, total: MOCK_BROKERS.length });
  return adminFetch(token, '/api/admin/brokers', opts);
}

export function fetchLanesByBroker(token, brokerId, opts = {}) {
  if (USE_MOCK) {
    const lanes = MOCK_ADMIN_LANES.filter(l => l.assigned_broker_id === brokerId);
    return Promise.resolve({ lanes, total: lanes.length });
  }
  return adminFetch(token, `/api/admin/brokers/${brokerId}/lanes`, opts);
}

export function createBroker(token, body, opts = {}) {
  // body: { email, name }
  if (USE_MOCK) {
    return Promise.resolve({
      broker_id: `b-new-${Date.now()}`,
      ...body,
      is_active: true,
      reset_token: 'mock-reset-token',
    });
  }
  return adminFetch(token, '/api/admin/brokers', { method: 'POST', body: JSON.stringify(body), ...opts });
}

export function setBrokerActive(token, brokerId, isActive, opts = {}) {
  if (USE_MOCK) return Promise.resolve({ broker_id: brokerId, is_active: isActive });
  return adminFetch(token, `/api/admin/brokers/${brokerId}`, {
    method: 'PATCH',
    body: JSON.stringify({ is_active: isActive }),
    ...opts,
  });
}

export function reassignBroker(token, laneId, brokerId, opts = {}) {
  if (USE_MOCK) return Promise.resolve({ lane_id: laneId, assigned_broker_id: brokerId });
  return adminFetch(token, `/api/admin/lanes/${laneId}/reassign-broker`, {
    method: 'POST',
    body: JSON.stringify({ broker_id: brokerId }),
    ...opts,
  });
}

// ---------------------------------------------------------------------------
// Lender management (admin, D12)
// ---------------------------------------------------------------------------

export function listLenders(token, opts = {}) {
  if (USE_MOCK) return Promise.resolve({ lenders: MOCK_LENDERS, total: MOCK_LENDERS.length });
  return adminFetch(token, '/api/admin/lenders', opts);
}

export function createLender(token, body, opts = {}) {
  // body: { name }
  if (USE_MOCK) {
    return Promise.resolve({ lender_id: `l-new-${Date.now()}`, ...body, is_cleared: false, is_active: true });
  }
  return adminFetch(token, '/api/admin/lenders', { method: 'POST', body: JSON.stringify(body), ...opts });
}

export function setLenderStatus(token, lenderId, body, opts = {}) {
  // body: { is_cleared?, is_active? }
  if (USE_MOCK) return Promise.resolve({ lender_id: lenderId, ...body });
  return adminFetch(token, `/api/admin/lenders/${lenderId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
    ...opts,
  });
}

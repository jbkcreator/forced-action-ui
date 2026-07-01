/**
 * Broker authentication + broker-facing API.
 *
 * Auth endpoints:
 *   POST /api/broker/login
 *   POST /api/broker/forgot-password
 *   POST /api/broker/reset-password
 *   POST /api/broker/refresh
 *   GET  /api/broker/me
 *
 * Broker portal endpoints:
 *   GET  /api/lanes/pool                             (unclaimed pool — redacted, D15)
 *   POST /api/broker/lanes/{laneId}/claim            (self-claim, D3)
 *   GET  /api/broker/lanes
 *   GET  /api/lanes/{laneId}                         (broker-scoped)
 *   GET  /api/lanes/{laneId}/transitions             (audit log)
 *   POST /api/broker/lanes/{laneId}/transition
 *   POST /api/lanes/{laneId}/advance
 *   PATCH /api/lanes/{laneId}/lender                 (set funding lender, D12)
 *   GET  /api/broker/lenders                         (cleared lender list, D12)
 *   GET  /api/lane-stage-config?lane_type=           (stage config for advance control)
 *
 * Admin broker-management endpoints live in src/api/loanLane.js.
 */

import { apiRequest } from './client.js';

const BASE = '/api/broker';

// ---------------------------------------------------------------------------
// Mock data (remove / set USE_MOCK=false before live-API integration PR)
// ---------------------------------------------------------------------------
const USE_MOCK = false;

const MOCK_BROKER = { id: 'b-001', brokerId: 'b-001', name: 'Jane Broker', email: 'jane@example.com', role: 'broker' };

// Cleared lenders (D12) — only is_cleared+is_active shown to brokers
const MOCK_LENDERS = [
  { lender_id: 'l-001', name: 'Suncoast Funding Partners', is_cleared: true,  is_active: true  },
  { lender_id: 'l-002', name: 'Bay Area Bridge Capital',   is_cleared: true,  is_active: true  },
  { lender_id: 'l-003', name: 'Gulf Coast Lenders LLC',    is_cleared: false, is_active: true  },
];

// Unclaimed pool (D15) — contact fields intentionally redacted; backend enforces server-side
const MOCK_POOL_LANES = [
  {
    lane_id: 'pool-001',
    lane_type: 'distressed-payoff',
    current_stage: 'entered',
    current_stage_display: 'Entered',
    outcome: 'open',
    assigned_broker_id: null,
    entered_at: '2026-06-20T08:00:00Z',
    distress_score: 82,
    analysis_summary: 'High mortgage distress, 3 missed payments. Property in good condition — fast close likely.',
    property: { address: '811 Cypress Blvd', city: 'Tampa', state: 'FL', county: 'Hillsborough', owner_name: 'Owner (visible after claim)', phone: null, email: null },
  },
  {
    lane_id: 'pool-002',
    lane_type: 'distressed-payoff',
    current_stage: 'entered',
    current_stage_display: 'Entered',
    outcome: 'open',
    assigned_broker_id: null,
    entered_at: '2026-06-22T11:00:00Z',
    distress_score: 74,
    analysis_summary: 'Pre-foreclosure filing active. Owner responsive per prior outreach log. Strong payoff candidate.',
    property: { address: '342 Harbor View Dr', city: 'St. Petersburg', state: 'FL', county: 'Pinellas', owner_name: 'Owner (visible after claim)', phone: null, email: null },
  },
  {
    lane_id: 'pool-003',
    lane_type: 'distressed-payoff',
    current_stage: 'entered',
    current_stage_display: 'Entered',
    outcome: 'open',
    assigned_broker_id: null,
    entered_at: '2026-06-25T15:30:00Z',
    distress_score: 69,
    analysis_summary: 'Liens present, motivated seller signal detected. Recommend early contact.',
    property: { address: '57 Palms Court', city: 'Clearwater', state: 'FL', county: 'Pinellas', owner_name: 'Owner (visible after claim)', phone: null, email: null },
  },
];

const MOCK_STAGE_CONFIG = [
  { stage_key: 'entered',   display_name: 'Entered',   order_index: 0, allowed_next: ['quoted'],    sms_allowed: false },
  { stage_key: 'quoted',    display_name: 'Quoted',    order_index: 1, allowed_next: ['committed'], sms_allowed: true  },
  { stage_key: 'committed', display_name: 'Committed', order_index: 2, allowed_next: ['funded'],    sms_allowed: true  },
  { stage_key: 'funded',    display_name: 'Funded',    order_index: 3, allowed_next: [],             sms_allowed: false },
  { stage_key: 'dead',      display_name: 'Dead',      order_index: 4, allowed_next: [],             sms_allowed: false },
];

const MOCK_LANES = [
  {
    lane_id: 'lane-001',
    lane_type: 'distressed-payoff',
    current_stage: 'entered',
    current_stage_display: 'Entered',
    current_work_state: 'working',
    outcome: 'open',
    assigned_broker_id: 'b-001',
    entered_at: '2026-06-01T10:00:00Z',
    is_stale: false,
    lender_id: null,
    lender_name: null,
    fee_config_flag: false,
    property: {
      address: '123 Main St',
      city: 'Tampa',
      state: 'FL',
      county: 'Hillsborough',
      zip: '33601',
      owner_name: 'John Homeowner',
      phone: '(813) 555-0101',
      email: 'john@example.com',
    },
  },
  {
    lane_id: 'lane-002',
    lane_type: 'distressed-payoff',
    current_stage: 'quoted',
    current_stage_display: 'Quoted',
    current_work_state: 'quoted',
    outcome: 'open',
    assigned_broker_id: 'b-001',
    // entered_at 35 days ago → triggers stale flag (D14: >30 days idle)
    entered_at: '2026-05-25T14:30:00Z',
    is_stale: true,
    lender_id: null,
    lender_name: null,
    fee_config_flag: false,
    property: {
      address: '456 Oak Ave',
      city: 'Tampa',
      state: 'FL',
      county: 'Hillsborough',
      zip: '33602',
      owner_name: 'Mary Smith',
      phone: '(813) 555-0202',
      email: null,
    },
  },
  {
    lane_id: 'lane-003',
    lane_type: 'distressed-payoff',
    current_stage: 'funded',
    current_stage_display: 'Funded',
    current_work_state: 'closed_won',
    outcome: 'funded',
    assigned_broker_id: 'b-001',
    entered_at: '2026-05-20T09:00:00Z',
    is_stale: false,
    lender_id: 'l-001',
    lender_name: 'Suncoast Funding Partners',
    fee_config_flag: false,
    property: {
      address: '789 Pine Rd',
      city: 'Brandon',
      state: 'FL',
      county: 'Hillsborough',
      zip: '33511',
      owner_name: 'Bob Johnson',
      phone: '(813) 555-0303',
      email: 'bob@example.com',
    },
  },
];

const MOCK_TRANSITIONS = {
  'lane-001': [
    { transition_id: 't-001', from_state: null, to_state: 'unassigned', broker_id: null, actor: 'system', reason_code: 'qualified', occurred_at: '2025-06-01T10:00:00Z' },
    { transition_id: 't-002', from_state: 'unassigned', to_state: 'assigned',  broker_id: 'b-001', actor: 'admin@example.com', reason_code: 'qualified', occurred_at: '2025-06-02T08:00:00Z' },
    { transition_id: 't-003', from_state: 'assigned',   to_state: 'working',   broker_id: 'b-001', actor: 'jane@example.com',  reason_code: 'no_contact', occurred_at: '2025-06-03T11:30:00Z' },
  ],
  'lane-002': [
    { transition_id: 't-004', from_state: null, to_state: 'unassigned', broker_id: null, actor: 'system', reason_code: 'qualified', occurred_at: '2025-06-05T14:30:00Z' },
    { transition_id: 't-005', from_state: 'unassigned', to_state: 'assigned',  broker_id: 'b-001', actor: 'admin@example.com', reason_code: 'qualified',  occurred_at: '2025-06-06T09:00:00Z' },
    { transition_id: 't-006', from_state: 'assigned',   to_state: 'working',   broker_id: 'b-001', actor: 'jane@example.com',  reason_code: 'no_contact', occurred_at: '2025-06-07T10:00:00Z' },
    { transition_id: 't-007', from_state: 'working',    to_state: 'quoted',    broker_id: 'b-001', actor: 'jane@example.com',  reason_code: 'price',      occurred_at: '2025-06-08T14:00:00Z' },
  ],
  'lane-003': [
    { transition_id: 't-008', from_state: null, to_state: 'unassigned', broker_id: null, actor: 'system', reason_code: 'qualified', occurred_at: '2025-05-20T09:00:00Z' },
    { transition_id: 't-009', from_state: 'unassigned', to_state: 'assigned',  broker_id: 'b-001', actor: 'admin@example.com', reason_code: 'qualified',     occurred_at: '2025-05-21T08:00:00Z' },
    { transition_id: 't-010', from_state: 'assigned',   to_state: 'working',   broker_id: 'b-001', actor: 'jane@example.com',  reason_code: 'no_contact',    occurred_at: '2025-05-22T10:00:00Z' },
    { transition_id: 't-011', from_state: 'working',    to_state: 'quoted',    broker_id: 'b-001', actor: 'jane@example.com',  reason_code: 'price',         occurred_at: '2025-05-25T11:00:00Z' },
    { transition_id: 't-012', from_state: 'quoted',     to_state: 'committed', broker_id: 'b-001', actor: 'jane@example.com',  reason_code: 'docs_received', occurred_at: '2025-05-28T09:00:00Z' },
    { transition_id: 't-013', from_state: 'committed',  to_state: 'closed_won',broker_id: 'b-001', actor: 'jane@example.com',  reason_code: 'funded',        occurred_at: '2025-06-01T15:00:00Z' },
  ],
};

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

const TOKEN_KEY         = 'broker_access_token';
const REFRESH_TOKEN_KEY = 'broker_refresh_token';

export function getBrokerToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function brokerHeaders(extra = {}) {
  const token = getBrokerToken();
  return token ? { Authorization: `Bearer ${token}`, ...extra } : extra;
}

async function withBrokerRefresh(fn) {
  try {
    return await fn();
  } catch (err) {
    if (err?.status === 401) {
      const refreshed = await brokerRefreshToken();
      if (refreshed) return await fn();
      brokerLogout();
      window.location.href = '/broker/login';
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Auth endpoints (public)
// ---------------------------------------------------------------------------

export async function brokerLogin(email, password) {
  if (USE_MOCK) {
    const fake = { access_token: 'mock.broker.token', refresh_token: 'mock.broker.refresh', broker: MOCK_BROKER };
    localStorage.setItem(TOKEN_KEY, fake.access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, fake.refresh_token);
    return fake;
  }
  const data = await apiRequest(`${BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (data.access_token) {
    localStorage.setItem(TOKEN_KEY, data.access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
  }
  return data;
}

export async function brokerRefreshToken() {
  const refresh = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refresh) return null;
  if (USE_MOCK) return 'mock.broker.token';
  try {
    const data = await apiRequest(`${BASE}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refresh }),
    });
    if (data.access_token) {
      localStorage.setItem(TOKEN_KEY, data.access_token);
      return data.access_token;
    }
  } catch {
    brokerLogout();
  }
  return null;
}

export function brokerLogout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export async function brokerForgotPassword(email) {
  if (USE_MOCK) return { message: 'If registered, a reset link has been sent.' };
  return apiRequest(`${BASE}/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
}

export async function brokerResetPassword(token, newPassword) {
  if (USE_MOCK) return { message: 'Password updated.' };
  return apiRequest(`${BASE}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reset_token: token, new_password: newPassword }),
  });
}

// ---------------------------------------------------------------------------
// Broker "me"
// ---------------------------------------------------------------------------

export async function brokerGetMe(opts = {}) {
  if (USE_MOCK) return MOCK_BROKER;
  return withBrokerRefresh(() =>
    apiRequest(`${BASE}/me`, { headers: brokerHeaders(), signal: opts.signal })
  );
}

// ---------------------------------------------------------------------------
// Broker lane endpoints
// ---------------------------------------------------------------------------

export async function fetchBrokerLanes(params = {}, opts = {}) {
  if (USE_MOCK) return { lanes: MOCK_LANES, total: MOCK_LANES.length, limit: 50, offset: 0 };
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== null && v !== undefined && v !== '') qs.set(k, v); });
  const query = qs.toString() ? `?${qs}` : '';
  return withBrokerRefresh(() =>
    apiRequest(`${BASE}/lanes${query}`, { headers: brokerHeaders(), signal: opts.signal })
  );
}

export async function fetchLane(laneId, opts = {}) {
  if (USE_MOCK) {
    const lane = MOCK_LANES.find(l => l.lane_id === laneId);
    if (!lane) throw Object.assign(new Error('Lane not found'), { status: 404 });
    return lane;
  }
  return withBrokerRefresh(() =>
    apiRequest(`/api/lanes/${laneId}`, { headers: brokerHeaders(), signal: opts.signal })
  );
}

export async function fetchLaneTransitions(laneId, opts = {}) {
  if (USE_MOCK) return { transitions: MOCK_TRANSITIONS[laneId] || [] };
  return withBrokerRefresh(() =>
    apiRequest(`${BASE}/lanes/${laneId}/transitions`, { headers: brokerHeaders(), signal: opts.signal })
  );
}

export async function transitionLane(laneId, body, opts = {}) {
  // body: { to_state, reason_code, gross_amount_cents?, split_config_id? }
  if (USE_MOCK) {
    return { transition_id: `t-mock-${Date.now()}`, ...body };
  }
  return withBrokerRefresh(() =>
    apiRequest(`${BASE}/lanes/${laneId}/transition`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...brokerHeaders() },
      body: JSON.stringify(body),
      signal: opts.signal,
    })
  );
}

export async function advanceLaneStage(laneId, toStage, opts = {}) {
  if (USE_MOCK) return { lane_id: laneId, current_stage: toStage };
  return withBrokerRefresh(() =>
    apiRequest(`/api/lanes/${laneId}/advance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...brokerHeaders() },
      body: JSON.stringify({ to_stage: toStage }),
      signal: opts.signal,
    })
  );
}

export async function fetchLaneStageConfig(laneType = 'distressed-payoff', opts = {}) {
  if (USE_MOCK) return { stages: MOCK_STAGE_CONFIG };
  return withBrokerRefresh(() =>
    apiRequest(`/api/lane-stage-config?lane_type=${encodeURIComponent(laneType)}`, {
      headers: brokerHeaders(),
      signal: opts.signal,
    })
  );
}

export async function fetchCommissionSplits(opts = {}) {
  if (USE_MOCK) {
    return {
      splits: [
        { split_config_id: 'platform_50_broker_50', name: 'Platform 50 / Broker 50', parties: [{ party: 'platform', pct: 50 }, { party: 'broker', pct: 50 }] },
        { split_config_id: 'platform_30_broker_70', name: 'Platform 30 / Broker 70', parties: [{ party: 'platform', pct: 30 }, { party: 'broker', pct: 70 }] },
      ],
    };
  }
  return withBrokerRefresh(() =>
    apiRequest(`/api/commission-splits`, { headers: brokerHeaders(), signal: opts.signal })
  );
}

// ---------------------------------------------------------------------------
// Pool + claim (D3, D15)
// ---------------------------------------------------------------------------

export async function fetchPool(params = {}, opts = {}) {
  if (USE_MOCK) return { lanes: MOCK_POOL_LANES, total: MOCK_POOL_LANES.length, limit: 50, offset: 0 };
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== null && v !== undefined && v !== '') qs.set(k, v); });
  const query = qs.toString() ? `?${qs}` : '';
  return withBrokerRefresh(() =>
    apiRequest(`/api/lanes/pool${query}`, { headers: brokerHeaders(), signal: opts.signal })
  );
}

export async function claimLane(laneId, opts = {}) {
  if (USE_MOCK) {
    // Simulate 409 for pool-003 to demo "already claimed" flow
    if (laneId === 'pool-003') {
      const err = Object.assign(new Error('Lane already claimed by another broker.'), { status: 409, detail: 'Lane already claimed by another broker.' });
      return Promise.reject(err);
    }
    const poolLane = MOCK_POOL_LANES.find(l => l.lane_id === laneId);
    if (!poolLane) return Promise.reject(Object.assign(new Error('Not found'), { status: 404 }));
    // Return the full (unredacted) lane — contact revealed on claim
    return {
      lane_id: laneId,
      lane_type: poolLane.lane_type,
      current_stage: poolLane.current_stage,
      current_stage_display: poolLane.current_stage_display,
      current_work_state: 'assigned',
      outcome: 'open',
      assigned_broker_id: 'b-001',
      entered_at: poolLane.entered_at,
      is_stale: false,
      lender_id: null,
      lender_name: null,
      fee_config_flag: false,
      property: {
        ...poolLane.property,
        owner_name: 'Revealed Owner Name',
        phone: '(813) 555-9999',
        email: 'owner@example.com',
      },
    };
  }
  return withBrokerRefresh(() =>
    apiRequest(`${BASE}/lanes/${laneId}/claim`, {
      method: 'POST',
      headers: brokerHeaders(),
      signal: opts.signal,
    })
  );
}

// ---------------------------------------------------------------------------
// Lender picker (D12)
// ---------------------------------------------------------------------------

export async function fetchBrokerStates(opts = {}) {
  if (USE_MOCK) {
    return {
      allowed_transitions: {
        unassigned:      [],
        assigned:        ['working', 'closed_lost'],
        working:         ['quoted', 'closed_lost'],
        quoted:          ['committed', 'lender_rejected', 'closed_lost'],
        committed:       ['closed_won', 'closed_lost'],
        lender_rejected: ['quoted', 'closed_lost'],
        closed_won:      [],
        closed_lost:     [],
      },
      work_states: ['unassigned', 'assigned', 'working', 'quoted', 'committed', 'lender_rejected', 'closed_won', 'closed_lost'],
      reason_codes_by_state: {
        working:         ['no_contact', 'qualified'],
        quoted:          ['qualified', 'price'],
        committed:       ['docs_received', 'qualified'],
        lender_rejected: ['lender_declined'],
        closed_won:      ['funded'],
        closed_lost:     ['no_contact', 'not_interested', 'price', 'lender_declined', 'lost_other'],
      },
    };
  }
  return withBrokerRefresh(() =>
    apiRequest(`${BASE}/states`, { headers: brokerHeaders(), signal: opts.signal })
  );
}

export async function fetchClearedLenders(opts = {}) {
  if (USE_MOCK) {
    const cleared = MOCK_LENDERS.filter(l => l.is_cleared && l.is_active);
    return { lenders: cleared };
  }
  return withBrokerRefresh(() =>
    apiRequest(`${BASE}/lenders`, { headers: brokerHeaders(), signal: opts.signal })
  );
}

export async function setLaneLender(laneId, lenderId, opts = {}) {
  if (USE_MOCK) return { lane_id: laneId, lender_id: lenderId };
  return withBrokerRefresh(() =>
    apiRequest(`/api/lanes/${laneId}/lender`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...brokerHeaders() },
      body: JSON.stringify({ lender_id: lenderId }),
      signal: opts.signal,
    })
  );
}

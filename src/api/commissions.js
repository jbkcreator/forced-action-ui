/**
 * Commission ledger API — shared between broker portal (own commissions)
 * and admin Commission Ledger section (all commissions).
 *
 * Endpoints:
 *   GET  /api/commissions          broker: own only; admin: all (RBAC on backend)
 *   POST /api/commissions/{id}/dispute
 */

import { apiRequest } from './client.js';
import { brokerHeaders, getBrokerToken } from './broker.js';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------
const USE_MOCK = true;

const MOCK_COMMISSIONS = [
  {
    entry_id: 'ce-001',
    prospect_id: 'p-003',
    lane_id: 'lane-003',
    broker_id: 'b-001',
    broker_name: 'Jane Broker',
    prospect_address: '789 Pine Rd, Brandon FL',
    prospect_county: 'Hillsborough',
    trigger_transition_id: 't-013',
    gross_amount_cents: 500000,
    split_config_id: 'platform_50_broker_50',
    net_lines: [
      { party: 'platform', amount_cents: 250000 },
      { party: 'broker',   amount_cents: 250000 },
    ],
    status: 'posted',
    posted_at: '2025-06-01T15:05:00Z',
    fee_config_flag: false,
  },
  {
    entry_id: 'ce-002',
    prospect_id: 'p-004',
    lane_id: 'lane-004',
    broker_id: 'b-002',
    broker_name: 'Tom Closer',
    prospect_address: '321 Elm Dr, Clearwater FL',
    prospect_county: 'Pinellas',
    trigger_transition_id: 't-020',
    gross_amount_cents: 800000,
    split_config_id: 'platform_30_broker_70',
    net_lines: null, // fee_config_flag ON — gated
    status: 'posted',
    posted_at: '2025-06-10T10:00:00Z',
    fee_config_flag: true,
  },
  {
    entry_id: 'ce-003',
    prospect_id: 'p-005',
    lane_id: 'lane-005',
    broker_id: 'b-001',
    broker_name: 'Jane Broker',
    prospect_address: '555 Maple Blvd, Tampa FL',
    prospect_county: 'Hillsborough',
    trigger_transition_id: 't-030',
    gross_amount_cents: 350000,
    split_config_id: 'platform_50_broker_50',
    net_lines: [
      { party: 'platform', amount_cents: 175000 },
      { party: 'broker',   amount_cents: 175000 },
    ],
    status: 'disputed',
    posted_at: '2025-05-28T11:00:00Z',
    fee_config_flag: false,
  },
];

// ---------------------------------------------------------------------------
// Shared fetch helper (works for both broker and admin tokens)
// ---------------------------------------------------------------------------

async function authHeaders() {
  // Broker JWT takes precedence when in broker context
  const brokerToken = getBrokerToken();
  if (brokerToken) return brokerHeaders();
  // Admin context
  const adminToken = localStorage.getItem('admin_token');
  return adminToken ? { Authorization: `Bearer ${adminToken}` } : {};
}

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

export async function fetchCommissions(opts = {}) {
  if (USE_MOCK) {
    const brokerToken = getBrokerToken();
    // Broker-scoped: filter to broker's own entries
    const entries = brokerToken
      ? MOCK_COMMISSIONS.filter(e => e.broker_id === 'b-001')
      : MOCK_COMMISSIONS;
    return { commissions: entries, total: entries.length };
  }
  const headers = await authHeaders();
  return apiRequest('/api/commissions', { headers, signal: opts.signal });
}

export async function disputeCommission(entryId, opts = {}) {
  if (USE_MOCK) {
    return { entry_id: entryId, status: 'disputed' };
  }
  const headers = await authHeaders();
  return apiRequest(`/api/commissions/${entryId}/dispute`, {
    method: 'POST',
    headers,
    signal: opts.signal,
  });
}

/** Client-side CSV export from an array of commission rows. */
export function exportCommissionsCsv(commissions) {
  function escapeCsv(val) {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  const headers = [
    'Entry ID', 'Posted At', 'Prospect', 'Broker', 'Gross Amount ($)',
    'Split', 'Status', 'Net — Platform ($)', 'Net — Broker ($)',
  ];

  const rows = commissions.map(c => {
    const platform = c.net_lines?.find(l => l.party === 'platform');
    const broker   = c.net_lines?.find(l => l.party === 'broker');
    return [
      c.entry_id,
      c.posted_at ? new Date(c.posted_at).toLocaleDateString() : '',
      c.prospect_address || c.prospect_id,
      c.broker_name || c.broker_id,
      c.gross_amount_cents != null ? (c.gross_amount_cents / 100).toFixed(2) : '',
      c.split_config_id || '',
      c.status,
      platform ? (platform.amount_cents / 100).toFixed(2) : 'Gated',
      broker   ? (broker.amount_cents   / 100).toFixed(2) : 'Gated',
    ];
  });

  const csv = [headers, ...rows].map(row => row.map(escapeCsv).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `commissions-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

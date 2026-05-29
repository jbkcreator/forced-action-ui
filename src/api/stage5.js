/**
 * Stage 5 API client — Premium credits, AP Pro upgrade, Annual accept,
 * Proof Wall, Win Graphic, Team View, Leaderboard.
 *
 * Matches the FastAPI endpoints added in Stage 5 (src/api/main.py).
 */
import { api, apiRequest } from './client';

// ─── Premium Credits ────────────────────────────────────────────────────────
// POST /api/premium/purchase
//   body: { feed_uuid, sku, payment_mode, property_id?, target_address? }
//   sku ∈ {report, brief, transfer, byol}
//   payment_mode ∈ {credits, card}
//
// On credits path: returns { purchase_id, sku, paid_via:'credits',
//   credits_spent, status, output_ref }
// On 402 (insufficient): returns { error:'insufficient_credits', balance,
//   required, topup_url } — the API client throws so caller can read err.
//
// On card path: returns { client_secret, payment_intent_id, amount,
//   publishable_key, sku, paid_via:'card' }.
export function purchasePremium({ feedUuid, sku, paymentMode, propertyId = null, targetAddress = null }) {
  return api.post('/api/premium/purchase', {
    feed_uuid: feedUuid,
    sku,
    payment_mode: paymentMode,
    property_id: propertyId,
    target_address: targetAddress,
  });
}


// ─── AutoPilot Pro / tier upgrade ───────────────────────────────────────────
// POST /api/upgrade — switches the Stripe subscription with proration.
export function upgradeTier({ feedUuid, tier }) {
  return api.post('/api/upgrade', { feed_uuid: feedUuid, tier });
}


// ─── Annual lock acceptance ─────────────────────────────────────────────────
// POST /api/annual/accept
export function acceptAnnual({ feedUuid }) {
  return api.post('/api/annual/accept', { feed_uuid: feedUuid });
}


// ─── Social Proof Wall (public) ─────────────────────────────────────────────
// GET /api/proof-wall?limit=N
//   returns { items: [{ deal_outcome_id, deal_size_bucket, label,
//     vertical, county_id, days_ago, graphic_url }] }
export function fetchProofWall({ limit = 50, countyId } = {}) {
  const params = { limit };
  if (countyId) params.county_id = countyId;
  return api.get('/api/proof-wall', params);
}


// Win-graphic URL helper (image src for <img>).
export function winGraphicUrl(dealOutcomeId, base = '') {
  const root = base || import.meta.env.VITE_API_BASE_URL || '';
  return `${root}/api/win-graphic/${dealOutcomeId}`;
}


// ─── Referral Team View ─────────────────────────────────────────────────────
// GET /api/feed/{feedUuid}/team-view
//   returns {
//     unlocked,          // bool — true when an active team exists
//     status?,           // 'active' | 'broken' — present when a team record exists
//     broken_at?,        // ISO timestamp — when the team was broken
//     broken_reason?,    // 'dispute' | 'refund' | 'churn'
//     team_id?, county_id?, vertical?, shared_zips, density
//   }
export function fetchTeamView(feedUuid) {
  return api.get(`/api/feed/${encodeURIComponent(feedUuid)}/team-view`);
}


// ─── Weekly Leaderboard ─────────────────────────────────────────────────────
// GET /api/leaderboard?county_id=&vertical=
//   returns { as_of, leaderboards: [{ county_id, vertical, leaderboard:[
//     { rank, subscriber_id, handle, refs_this_week, refs_total, badge } ] }] }
export function fetchLeaderboard({ countyId, vertical } = {}) {
  const params = {};
  if (countyId) params.county_id = countyId;
  if (vertical) params.vertical = vertical;
  return api.get('/api/leaderboard', params);
}

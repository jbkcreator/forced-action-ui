/**
 * Stage 5 API client — Premium credits, AP Pro upgrade, Annual accept,
 * Proof Wall, Win Graphic, Team View, Leaderboard.
 *
 * Matches the FastAPI endpoints added in Stage 5 (src/api/main.py).
 */
import { api, apiRequest } from './client';
import { getAttribution } from '../utils/attribution';

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
    attribution: getAttribution(),
  });
}

// Returns the URL for downloading a delivered report/brief PDF.
// Open in a new tab — browser handles display/save.
export function premiumReportDownloadUrl(purchaseId, feedUuid) {
  return `/api/premium/${purchaseId}/download?feed_uuid=${feedUuid}`;
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


// ─── Founder prepay portal (B0-04) ──────────────────────────────────────────
// GET /api/founders/prepay-eligibility?feed_uuid=
//   returns { eligible, rate_locked_at, escalated_at, founding_price_id,
//     has_active_subscription }
// Prepaying itself reuses acceptAnnual() above — same /api/annual/accept call.
export function fetchFounderPrepayEligibility(feedUuid) {
  return api.get('/api/founders/prepay-eligibility', { feed_uuid: feedUuid });
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


// ─── Win-Story proof feed (S5, public) ──────────────────────────────────────
// GET /api/proof/win-stories?limit=N
//   returns [{ id, event_type, county_id, proof_text, created_at }] newest-first.
//   proof_text is display-ready; county_id is a slug. event_type is "lead_pack"
//   today; "loan_funded" rows appear automatically once S1 is live (no FE change).
//   Distinct from /api/proof-wall (fetchProofWall) which serves DealOutcome wins.
export function fetchWinStories({ limit = 20, countyId, signal } = {}) {
  const params = { limit };
  if (countyId) params.county_id = countyId;
  return api.get('/api/proof/win-stories', params, { signal });
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

/**
 * fa016 — Accelerated Wallet Push API client.
 *
 * Two endpoints:
 *   - POST /api/wallet/accept-accelerated-offer/{uuid}  → activate wallet via saved card
 *   - POST /api/wallet/decline-accelerated-offer/{uuid} → set wallet_opt_out
 *
 * Both endpoints are gated by ACCELERATED_WALLET_PUSH_ENABLED on the backend;
 * the UI gracefully falls back to a generic "wallet" CTA when 404 is returned.
 */
import { api } from './client';

export function acceptAcceleratedWalletOffer(feedUuid, offerId) {
  return api.post(`/api/wallet/accept-accelerated-offer/${feedUuid}`, {
    offer_id: offerId,
  });
}

export function declineAcceleratedWalletOffer(feedUuid, offerId) {
  return api.post(`/api/wallet/decline-accelerated-offer/${feedUuid}`, {
    offer_id: offerId,
  });
}

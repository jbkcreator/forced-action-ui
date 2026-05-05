/**
 * Account / billing API helpers.
 *
 * Thin wrappers around endpoints that already exist:
 *   POST /api/portal-session   → src/api/dashboard.js::createPortalSession
 *   POST /api/annual/accept    → src/api/stage5.js::acceptAnnual
 *   POST /api/upgrade          → src/api/stage5.js::upgradeTier
 *   POST /api/wallet/topup     → wallet top-up (creates Stripe PaymentIntent)
 *
 * Re-exported here so the Settings page (and any future account surface)
 * has one import path for "account-level actions".
 */
import { api } from './client';

export { createPortalSession as openBillingPortal } from './dashboard';
export { acceptAnnual, upgradeTier } from './stage5';

/**
 * Whitelisted wallet top-up packages — must match WALLET_TOPUP_PACKAGES on
 * the backend (src/api/main.py). Submitting any other amount returns 400.
 */
export const WALLET_TOPUP_PACKAGES = [
  { amountCents: 2500,  credits: 10, label: '$25',  bonusLabel: '' },
  { amountCents: 5000,  credits: 22, label: '$50',  bonusLabel: '+10% bonus' },
  { amountCents: 10000, credits: 48, label: '$100', bonusLabel: '+20% bonus' },
];

/**
 * Create a wallet top-up PaymentIntent. Caller mounts the returned
 * client_secret in a Stripe Payment Sheet; webhook credits the wallet on
 * payment_intent.succeeded.
 */
export function createWalletTopup({ feedUuid, amountCents }) {
  return api.post('/api/wallet/topup', { feed_uuid: feedUuid, amount_cents: amountCents });
}

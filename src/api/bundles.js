import { api } from './client';

/**
 * POST /api/bundle/checkout
 * Creates a Stripe PaymentIntent for a bundle purchase.
 * Returns { client_secret, publishable_key, amount, currency, bundle_type }
 */
export function bundleCheckout({ feedUuid, bundleType, zipCode, vertical, abVariant }) {
  return api.post('/api/bundle/checkout', {
    feed_uuid: feedUuid,
    bundle_type: bundleType,
    zip_code: zipCode || null,
    vertical: vertical || null,
    ab_variant: abVariant || null,
  });
}

/**
 * GET /api/bundle/{purchaseId}?feed_uuid=...
 * Returns the detail of a bundle purchase (subscriber-gated by feed_uuid).
 */
export function fetchBundlePurchase(purchaseId, feedUuid) {
  return api.get(`/api/bundle/${purchaseId}`, { feed_uuid: feedUuid });
}

/**
 * GET /api/admin/storm-packs
 * Admin: list NWS alerts and bundle purchases.
 */
export function fetchAdminStormPacks({ limit = 50, offset = 0 } = {}) {
  return api.get('/api/admin/storm-packs', { limit, offset });
}

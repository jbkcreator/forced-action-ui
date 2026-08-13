import { useState, useRef, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { createCheckout } from '../api/landing';
import { createFreeSignup } from '../api/phase2b';
import { getAttribution } from '../utils/attribution';
import { trackInitiateCheckout } from '../utils/metaPixel';

// Module-level variable — populated on first checkout open, not on module
// evaluation. This keeps Stripe (~100 KB) out of the initial bundle: the SDK
// is only fetched when the user actually clicks a buy button.
let _stripePromise = null;
function getStripePromise() {
  if (!_stripePromise) {
    _stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
  }
  return _stripePromise;
}

export default function useStripeCheckout() {
  const [isOpen, setIsOpen] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);
  const [loading, setLoading] = useState(false);
  const embeddedRef = useRef(null);
  const checkoutCtxRef = useRef(null);

  // fa017: Optionally accept `attribution` so the pre-checkout free-signup
  // call captures source attribution. The pricing flow now provisions a
  // free Subscriber via /api/free-signup FIRST (idempotent on email),
  // captures the returned feed_uuid, then passes it into both /api/checkout
  // metadata AND the success_url so /success?feed_uuid=... lets the user
  // bounce straight to their dashboard.
  const openCheckout = useCallback(async ({
    tier, vertical, countyId, zipCodes, email, interval = 'monthly', consent = null, attribution = null,
    // Dashboard-originated upgrades (subscriber already has a session): skip
    // the marketing /success page, tell the backend not to send a magic-link
    // welcome, and let the caller decide what "done" means (e.g. refetch the
    // dashboard in place) instead of the default redirect.
    alreadyHasDashboardAccess = false,
    successReturnPath = null,
    onComplete: onCompleteOverride = null,
    // 3m deal-room: opaque hold token — passed as metadata so the checkout
    // webhook can call refund_on_conversion for the reserved deal.
    holdToken = null,
  }) => {
    checkoutCtxRef.current = { tier, zipCodes, countyId };
    setIsOpen(true);
    setLoading(true);
    setCheckoutError(null);

    let feedUuid = null;
    try {
      const signup = await createFreeSignup({
        email,
        vertical,
        countyId,
        signupSource: attribution?.signupSource || null,
        utmSource: attribution?.utmSource || null,
        utmMedium: attribution?.utmMedium || null,
        utmCampaign: attribution?.utmCampaign || null,
        campaignId: attribution?.campaignId || null,
        referralCode: attribution?.referralCode || null,
        referralSource: attribution?.referralSource || null,
        attributionToken: attribution?.attributionToken || null,
        affiliateRef: attribution?.affiliateRef || null,
        // User is about to pay for a tier — defer welcome email until
        // checkout webhook fires. Avoids "Welcome!" landing in their inbox
        // before they've actually paid.
        intent: 'upgrade',
      });
      feedUuid = signup?.feed_uuid || null;
      checkoutCtxRef.current.feedUuid = feedUuid;
    } catch (_err) {
      // Free-signup is best-effort — if it fails (e.g. backend down),
      // we still let the user attempt checkout. The Stripe webhook will
      // create the Subscriber via _on_checkout_completed as before.
    }

    try {
      const { client_secret, session_id, amount_total_cents } = await createCheckout({
        tier, vertical, countyId, zipCodes, email, interval, consentAcceptance: consent,
        attribution: getAttribution(),
        alreadyHasDashboardAccess,
        successReturnPath,
        holdToken,
      });
      checkoutCtxRef.current.sessionId = session_id || null;
      checkoutCtxRef.current.amountTotalCents = amount_total_cents ?? null;
      trackInitiateCheckout({ content_name: tier });
      const stripe = await getStripePromise();

      embeddedRef.current = await stripe.initEmbeddedCheckout({
        clientSecret: client_secret,
        onComplete() {
          if (onCompleteOverride) {
            onCompleteOverride({ ...checkoutCtxRef.current });
            return;
          }
          const params = new URLSearchParams();
          if (checkoutCtxRef.current) {
            params.set('tier', checkoutCtxRef.current.tier);
            params.set('zips', checkoutCtxRef.current.zipCodes.join(','));
            if (checkoutCtxRef.current.feedUuid) {
              params.set('feed_uuid', checkoutCtxRef.current.feedUuid);
            }
            // Preserve county_id through Stripe redirect so /success knows
            // which county the subscriber signed up for.
            if (checkoutCtxRef.current.countyId) {
              params.set('county_id', checkoutCtxRef.current.countyId);
            }
            // Meta Pixel Purchase dedup — matches the server-side CAPI
            // event_id (sub_<session_id>) built in stripe_webhooks.py.
            if (checkoutCtxRef.current.sessionId) {
              params.set('session_id', checkoutCtxRef.current.sessionId);
            }
            // Real charged amount (from Stripe, not a guessed tier price) —
            // accounts for founding-member and any other discounted pricing.
            if (checkoutCtxRef.current.amountTotalCents != null) {
              params.set('amount_cents', String(checkoutCtxRef.current.amountTotalCents));
            }
          }
          window.location.href = `/success?${params.toString()}`;
        },
      });

      setLoading(false);
      return embeddedRef.current;
    } catch (err) {
      setCheckoutError(err.detail?.message || 'Checkout failed. Please try again.');
      setLoading(false);
      return null;
    }
  }, []);

  const closeCheckout = useCallback(() => {
    setIsOpen(false);
    setCheckoutError(null);
    if (embeddedRef.current) {
      embeddedRef.current.destroy();
      embeddedRef.current = null;
    }
  }, []);

  return { isOpen, loading, checkoutError, openCheckout, closeCheckout, embeddedRef };
}

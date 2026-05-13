import { useState, useRef, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { createCheckout } from '../api/landing';
import { createFreeSignup } from '../api/phase2b';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

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
    tier, vertical, countyId, zipCodes, email, attribution = null,
  }) => {
    checkoutCtxRef.current = { tier, zipCodes };
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
        attributionToken: attribution?.attributionToken || null,
      });
      feedUuid = signup?.feed_uuid || null;
      checkoutCtxRef.current.feedUuid = feedUuid;
    } catch (_err) {
      // Free-signup is best-effort — if it fails (e.g. backend down),
      // we still let the user attempt checkout. The Stripe webhook will
      // create the Subscriber via _on_checkout_completed as before.
    }

    try {
      const { client_secret } = await createCheckout({
        tier, vertical, countyId, zipCodes, email,
      });
      const stripe = await stripePromise;

      embeddedRef.current = await stripe.initEmbeddedCheckout({
        clientSecret: client_secret,
        onComplete() {
          const params = new URLSearchParams();
          if (checkoutCtxRef.current) {
            params.set('tier', checkoutCtxRef.current.tier);
            params.set('zips', checkoutCtxRef.current.zipCodes.join(','));
            if (checkoutCtxRef.current.feedUuid) {
              params.set('feed_uuid', checkoutCtxRef.current.feedUuid);
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

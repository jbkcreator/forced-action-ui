import { useState, useRef, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { createCheckout } from '../api/landing';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export default function useStripeCheckout() {
  const [isOpen, setIsOpen] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);
  const [loading, setLoading] = useState(false);
  const embeddedRef = useRef(null);
  const checkoutCtxRef = useRef(null);

  const openCheckout = useCallback(async ({ tier, vertical, countyId, zipCodes }) => {
    checkoutCtxRef.current = { tier, zipCodes };
    setIsOpen(true);
    setLoading(true);
    setCheckoutError(null);

    try {
      const { client_secret } = await createCheckout({ tier, vertical, countyId, zipCodes });
      const stripe = await stripePromise;

      embeddedRef.current = await stripe.initEmbeddedCheckout({
        clientSecret: client_secret,
        onComplete() {
          const params = new URLSearchParams();
          if (checkoutCtxRef.current) {
            params.set('tier', checkoutCtxRef.current.tier);
            params.set('zips', checkoutCtxRef.current.zipCodes.join(','));
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

import { useState, useRef, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';

export default function useStripePayment() {
  const [step, setStep] = useState('choose'); // choose | payment | success
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const stripeRef = useRef(null);
  const elementsRef = useRef(null);

  const initPayment = useCallback(async (clientSecret, publishableKey) => {
    const stripe = await loadStripe(publishableKey);
    stripeRef.current = stripe;

    const elements = stripe.elements({
      clientSecret,
      appearance: {
        theme: 'night',
        variables: {
          colorPrimary: '#fbbf24',
          colorBackground: '#1e293b',
          fontFamily: 'Inter, sans-serif',
        },
      },
    });
    elementsRef.current = elements;

    const paymentElement = elements.create('payment');
    setStep('payment');
    return paymentElement;
  }, []);

  const confirmPayment = useCallback(async () => {
    if (!stripeRef.current || !elementsRef.current) return;
    setProcessing(true);
    setError(null);

    const { error: stripeError } = await stripeRef.current.confirmPayment({
      elements: elementsRef.current,
      redirect: 'if_required',
    });

    if (stripeError) {
      setError(stripeError.message);
      setProcessing(false);
    } else {
      setStep('success');
      setProcessing(false);
    }
  }, []);

  const reset = useCallback(() => {
    setStep('choose');
    setError(null);
    setProcessing(false);
    stripeRef.current = null;
    elementsRef.current = null;
  }, []);

  return { step, error, processing, initPayment, confirmPayment, reset, setStep };
}

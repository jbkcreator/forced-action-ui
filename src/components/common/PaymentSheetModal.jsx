/**
 * PaymentSheetModal — inline one-tap Stripe Payment Sheet.
 *
 * Wraps Stripe Elements + PaymentElement for fast in-app pays (Apple Pay /
 * Google Pay / card without leaving the page). Used by the landing
 * FirstSessionWall unlock flow and the dashboard MonetizationWall.
 *
 * Backend flow this component expects:
 *   1. Caller has already POSTed /api/free-signup (landing) or has a live
 *      subscriber feed_uuid (dashboard).
 *   2. Caller has already POSTed /api/payment-intent with save_card=true
 *      and holds the { client_secret, publishable_key } response.
 *   3. This component is opened with those values. It mounts Stripe
 *      Elements, renders the card/Apple Pay/Google Pay picker, and on
 *      submit calls stripe.confirmPayment.
 *
 * Props:
 *   isOpen:          bool
 *   clientSecret:    string from /api/payment-intent response
 *   publishableKey:  string from /api/payment-intent response (test or live)
 *   amountLabel:     e.g. "$4.00" — shown in the header + button
 *   description:     e.g. "Unlock Gold lead at 1234 Oak St"
 *   saveCardDefault: defaults to true per v9
 *   onSuccess:       callback(result) on Stripe confirmPayment success
 *   onClose:         callback() on dismiss
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import Icon from '../ui/Icon';


export default function PaymentSheetModal({
	isOpen,
	clientSecret,
	publishableKey,
	amountLabel = '$4.00',
	description = 'Unlock this lead',
	saveCardDefault = true,
	onSuccess,
	onClose,
}) {
	const [step, setStep] = useState('mount');   // mount | confirming | success | error
	const [error, setError] = useState(null);
	const [saveCard, setSaveCard] = useState(saveCardDefault);
	const stripeRef = useRef(null);
	const elementsRef = useRef(null);
	const mountPointRef = useRef(null);

	// ── Mount Stripe Elements ────────────────────────────────────────────────
	useEffect(() => {
		if (!isOpen || !clientSecret || !publishableKey) return;
		let cancelled = false;

		(async () => {
			try {
				const stripe = await loadStripe(publishableKey);
				if (cancelled) return;
				stripeRef.current = stripe;

				const elements = stripe.elements({
					clientSecret,
					appearance: {
						theme: 'night',
						variables: {
							colorPrimary: '#fbbf24',
							colorBackground: '#1e293b',
							fontFamily: 'Inter, sans-serif',
							borderRadius: '8px',
						},
					},
				});
				elementsRef.current = elements;

				const paymentElement = elements.create('payment', {
					layout: 'tabs',
					defaultValues: {
						billingDetails: {},
					},
				});
				// Give React a moment to render the mount point before the element attaches.
				setTimeout(() => {
					if (cancelled) return;
					if (mountPointRef.current) {
						paymentElement.mount(mountPointRef.current);
					}
				}, 30);
			} catch (exc) {
				if (!cancelled) {
					setError(exc?.message || 'Could not initialise payment sheet');
					setStep('error');
				}
			}
		})();

		return () => {
			cancelled = true;
			stripeRef.current = null;
			elementsRef.current = null;
		};
	}, [isOpen, clientSecret, publishableKey]);

	// ── Reset on open ────────────────────────────────────────────────────────
	useEffect(() => {
		if (isOpen) {
			setStep('mount');
			setError(null);
			setSaveCard(saveCardDefault);
		}
	}, [isOpen, saveCardDefault]);

	const handleConfirm = useCallback(async () => {
		if (!stripeRef.current || !elementsRef.current) return;
		setStep('confirming');
		setError(null);

		const result = await stripeRef.current.confirmPayment({
			elements: elementsRef.current,
			redirect: 'if_required',
			confirmParams: {
				// Return URL used only for 3DS / redirect-based methods. Inline card
				// + wallet pays never hit this, but Stripe still requires it.
				return_url: window.location.href,
			},
		});

		if (result.error) {
			setError(result.error.message || 'Payment failed');
			setStep('error');
			return;
		}

		// result.paymentIntent present on success
		setStep('success');
		onSuccess?.(result.paymentIntent);
	}, [onSuccess]);

	if (!isOpen) return null;

	return (
		<div
			className="fixed inset-0 z-[60] overflow-y-auto flex items-start sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
			role="dialog"
			aria-modal="true"
			onClick={(e) => { if (e.target === e.currentTarget && step !== 'confirming') onClose?.(); }}
		>
			<div
				className="max-w-md w-full my-8 rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl max-h-[calc(100vh-4rem)] overflow-y-auto"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="flex items-start justify-between mb-4">
					<div>
						<h3 className="text-white font-semibold text-lg">Pay {amountLabel}</h3>
						<p className="text-slate-400 text-xs mt-1">{description}</p>
					</div>
					{step !== 'confirming' && (
						<button
							onClick={onClose}
							aria-label="Close"
							className="text-slate-400 hover:text-white"
							type="button"
						>
							<Icon name="x" size={16} />
						</button>
					)}
				</div>

				{step === 'success' ? (
					<div className="py-6 text-center">
						<Icon name="check-circle" size={40} className="mx-auto text-emerald-400" />
						<p className="text-white font-semibold mt-3">Paid.</p>
						<p className="text-slate-400 text-xs mt-1">Card saved. One-tap unlocks from here on.</p>
					</div>
				) : (
					<>
						<div ref={mountPointRef} className="min-h-[260px] my-2" />

						<label className="mt-3 flex items-start gap-2 text-xs text-slate-300 cursor-pointer select-none">
							<input
								type="checkbox"
								checked={saveCard}
								onChange={(e) => setSaveCard(e.target.checked)}
								className="mt-0.5"
								disabled={step === 'confirming'}
							/>
							<span>
								Save my card for future one-tap unlocks.
								<span className="text-emerald-400"> +2 bonus credits</span> if I save it within 10 minutes.
							</span>
						</label>

						{error && (
							<p className="mt-3 text-red-400 text-xs">{error}</p>
						)}

						<div className="mt-5 flex items-center justify-end gap-3">
							{step !== 'confirming' && (
								<button
									onClick={onClose}
									type="button"
									className="text-slate-400 hover:text-white text-sm px-3 py-2"
								>
									Cancel
								</button>
							)}
							<button
								onClick={handleConfirm}
								disabled={step === 'confirming'}
								type="button"
								className="cta-primary text-sm px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{step === 'confirming' ? 'Processing…' : `Pay ${amountLabel}`}
							</button>
						</div>
					</>
				)}
			</div>
		</div>
	);
}

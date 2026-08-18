/**
 * FirstSessionWall — v9 first-session monetization wall on the landing page.
 *
 * Shows:
 *   - 1 fully enriched lead + 2 blurred leads (real data from
 *     /api/proof-leads, scoped to the selected vertical + county)
 *   - A client-side 15-minute countdown that anchors urgency
 *   - A vertical-specific ROI frame rendered above the leads
 *   - Unlock CTAs on each blurred lead
 *
 * For anonymous landing-page visitors there is no feed_uuid yet, so the
 * Unlock CTAs cannot hit /api/payment-intent directly (that endpoint
 * requires a subscriber). Until a free-tier signup endpoint exists, the
 * CTAs route to the EmailGate modal via onRequestUnlock(lead) — the
 * existing signup funnel can capture the email + eventually create the
 * subscriber and re-open this wall on the dashboard.
 *
 * Props:
 *   onRequestUnlock(lead) — callback invoked when a user taps any Unlock CTA
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanding } from './LandingContext';
import TermsConsentGate from '../shared/TermsConsentGate';
import {
  fetchProofLeads,
  createFreeSignup,
  createPaymentIntent,
  logBusinessEvent,
} from '../../api/phase2b';
import { getAttribution } from '../../utils/attribution';
import { unlockHotLead } from '../../api/dashboard';
import PaymentSheetModal from '../common/PaymentSheetModal';
import LandingAttribution from './LandingAttribution';
import Icon from '../ui/Icon';
import { getVerticalRoi } from '../../config/verticals.js';

const COUNTDOWN_SECONDS = 15 * 60;          // 15 minutes
const LS_KEY = 'fa.landing.wall.expires';   // survive refresh within the window

// ROI frames are now driven by config/verticals.js.  getVerticalRoi(vertical)
// returns the frame for the active vertical and falls back to DEFAULT_ROI.
// The old inline ROI_FRAMES dict is replaced below.
const _LEGACY_ROI_FRAMES = {
	roofing: {
		avg_job_value: 8500,
		monthly_revenue: 102000,
		headline: 'Top roofers in {countyName} report closing 12+ storm/distress jobs/mo',
	},
	remediation: {
		avg_job_value: 6500,
		monthly_revenue: 52000,
		headline: 'Top remediation contractors report averaging 8 distress calls/mo at ~$6,500 each',
	},
	public_adjusters: {
		avg_job_value: 14000,
		monthly_revenue: 112000,
		headline: 'Top public adjusters report averaging 8 settled claims/mo',
	},
	investor: {
		avg_deal_value: 22000,
		monthly_revenue: 44000,
		headline: 'Top distressed-property investors report averaging 2 deals/mo at $22K profit each',
	},
	plumbing: {
		avg_job_value: 3200,
		monthly_revenue: 48000,
		headline: 'Top plumbers on distressed leads report averaging 15 emergency jobs/mo',
	},
	hvac: {
		avg_job_value: 4800,
		monthly_revenue: 48000,
		headline: 'Top HVAC contractors report finding 10+ urgent replacements/mo via distress leads',
	},
};
const DEFAULT_ROI = {
	avg_job_value: 5000,
	monthly_revenue: 50000,
	headline: 'Contractors using Forced Action data report closing 30–50% more distressed jobs',
};

const UNLOCK_PRICE_CENTS = 400;                 // $4.00 — mid-range of v9 $2.50–$7 band
const UNLOCK_PRICE = `$${(UNLOCK_PRICE_CENTS / 100).toFixed(2).replace(/\.00$/, '')}`;

// D4: retarget Gold+ leads to the hot-lead unlock. /api/proof-leads doesn't
// carry `is_hot` yet (Fix B only landed on the dashboard feed) — this
// tier-string check is the stopgap; swap to lead.is_hot once it's added here.
const HOT_LEAD_TIERS = new Set(['Gold', 'Platinum', 'Ultra Platinum']);
function isHotLead(lead) {
	return HOT_LEAD_TIERS.has(lead?.lead_tier);
}
// Anon side has no public flash-scarcity window field yet (Step 2 defer) —
// always the full $150 rate here, never the $99 reduced rate.
const HOT_LEAD_PRICE = '$150';

function fmt(ms) {
	if (ms <= 0) return '0:00';
	const total = Math.floor(ms / 1000);
	const m = Math.floor(total / 60);
	const s = total % 60;
	return `${m}:${s.toString().padStart(2, '0')}`;
}

function tierBadgeClass(t) {
	const k = (t || '').toLowerCase();
	if (k.includes('platinum') || k.includes('ultra')) return 'score-platinum';
	if (k.includes('gold')) return 'score-gold';
	return 'score-silver';
}

function tierCardClass(t) {
	const k = (t || '').toLowerCase();
	if (k.includes('platinum') || k.includes('ultra')) return 'sample-lead-platinum';
	if (k.includes('gold')) return 'sample-lead-gold';
	return 'sample-lead-silver';
}

function tierLabel(t) {
	if (!t) return 'Scored';
	return t.toString().replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function RevealedLead({ lead }) {
	const isPaidUnlock = lead.unlocked === true;
	const ownerName = lead.contact?.owner_name || lead.owner_name;
	// B1: the free preview (isPaidUnlock === false) is shown to anonymous
	// public visitors — never render a real person's full name/address/phone
	// there. Only a lead the visitor actually paid to unlock gets full detail.
	const ownerInitial = ownerName ? `${ownerName.trim().charAt(0).toUpperCase()}.` : null;
	// Only the house number is identifying enough to matter here — keep the
	// street name/suffix visible so the free preview still shows more than
	// the fully-locked cards below it (client asked for "partial address").
	const maskedAddress = lead.address
		? lead.address.replace(/^\d+/, '•••')
		: '••• St';
	return (
		<div className={`sample-lead-card ${tierCardClass(lead.lead_tier)}`}>
			<div className="flex items-start justify-between gap-4">
				<div className="flex-1 min-w-0">
					<p className="font-semibold text-white text-sm">{isPaidUnlock ? lead.address : maskedAddress}</p>
					<p className="text-slate-400 text-xs mt-0.5">
						{lead.city ? `${lead.city}, FL` : ''} {lead.zip}
					</p>
					{lead.distress_types?.length > 0 && (
						<p className="text-slate-500 text-xs mt-1">{lead.distress_types.join(' · ')}</p>
					)}
					{ownerName && (
						<p className="text-emerald-300 text-xs mt-1 flex items-center gap-1">
							<Icon name="user" size={12} /> Owner: <span className="text-white">{isPaidUnlock ? ownerName : ownerInitial}</span>
						</p>
					)}
					{isPaidUnlock && lead.contact?.mobile_phone && (
						<p className="text-emerald-300 text-xs mt-1 flex items-center gap-1">
							<Icon name="phone" size={12} /> <span className="font-mono text-white">{lead.contact.mobile_phone}</span>
						</p>
					)}
					{isPaidUnlock && lead.contact?.email && (
						<p className="text-emerald-300 text-xs mt-1 flex items-center gap-1">
							<Icon name="mail" size={12} /> <span className="font-mono text-white">{lead.contact.email}</span>
						</p>
					)}
					{!isPaidUnlock && (lead.contact?.mobile_phone || lead.phone) && (
						<p className="text-slate-500 text-xs mt-1 flex items-center gap-1">
							<Icon name="lock" size={12} /> Phone hidden until unlocked
						</p>
					)}
				</div>
				<div className="flex flex-col items-end gap-1 shrink-0">
					<span className={`score-badge ${tierBadgeClass(lead.lead_tier)}`}>{tierLabel(lead.lead_tier)}</span>
					{lead.score != null && (
						<span className="text-xs text-slate-400">
							Score: <span className="text-white font-medium">{Math.round(lead.score)}</span>
						</span>
					)}
					{isPaidUnlock ? (
						<span
							className="text-xs font-semibold mt-1 px-2 py-0.5 rounded-full"
							style={{ background: 'rgba(34,197,94,0.12)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.25)' }}
						>
							✓ Unlocked
						</span>
					) : (
						<span className="text-xs text-emerald-400 font-semibold mt-1">FREE preview</span>
					)}
				</div>
			</div>
		</div>
	);
}

function BlurredLead({ lead, onUnlock }) {
	const price = isHotLead(lead) ? HOT_LEAD_PRICE : UNLOCK_PRICE;
	const maskedAddress = lead.address
		? lead.address.replace(/^\d+\s+[A-Za-z]+/, '••• ••••••')
		: '••• •••••• St';
	return (
		<div className={`sample-lead-card ${tierCardClass(lead.lead_tier)}`}>
			<div className="flex items-start justify-between gap-4">
				<div className="flex-1 min-w-0">
					<p className="font-semibold text-white text-sm blur-[3px] select-none">{maskedAddress}</p>
					<p className="text-slate-500 text-xs mt-0.5">
						{lead.city ? `${lead.city}, FL` : ''} {lead.zip}
					</p>
					{lead.distress_types?.length > 0 && (
						<p className="text-slate-500 text-xs mt-1">{lead.distress_types.join(' · ')}</p>
					)}
					<p className="text-slate-500 text-xs mt-1 flex items-center gap-1">
						<Icon name="lock" size={12} /> Owner + phone hidden
					</p>
				</div>
				<div className="flex flex-col items-end gap-1 shrink-0">
					<span className={`score-badge ${tierBadgeClass(lead.lead_tier)}`}>{tierLabel(lead.lead_tier)}</span>
					{lead.score != null && (
						<span className="text-xs text-slate-400">
							Score: <span className="text-white font-medium">{Math.round(lead.score)}</span>
						</span>
					)}
				</div>
			</div>
			<div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
				<span className="text-xs text-slate-500">Unlock full address + owner + phone</span>
				<button
					onClick={() => onUnlock?.(lead)}
					className="cta-primary text-xs px-4 py-1.5"
					type="button"
				>
					Unlock {price}
				</button>
			</div>
		</div>
	);
}


export default function FirstSessionWall({ onRequestUnlock }) {
	const { selectedVertical, countyId, landingData, attribution } = useLanding();
	const countyName = landingData?.county_name || countyId;
	const navigate = useNavigate();

	const [payload, setPayload] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	// 15-min countdown — persists across refresh within the same session
	const [expiresMs, setExpiresMs] = useState(() => {
		const existing = Number(localStorage.getItem(LS_KEY));
		if (existing && existing > Date.now()) return existing;
		const fresh = Date.now() + COUNTDOWN_SECONDS * 1000;
		localStorage.setItem(LS_KEY, String(fresh));
		return fresh;
	});
	const [nowMs, setNowMs] = useState(Date.now());

	// Unlock-flow state machine:
	//   idle            — no unlock in progress
	//   email           — asking for email before creating a subscriber
	//   signing_up      — POST /api/free-signup in flight
	//   creating_intent — POST /api/payment-intent in flight
	//   payment         — PaymentSheetModal open
	//   done            — success; lead revealed inline
	// Note: feed_uuid is NOT cached across page loads. Every fresh Unlock
	// click re-prompts for email so QA + real users both see the whole flow.
	// Backend /api/free-signup is idempotent on email, so re-entering the
	// same email returns the same subscriber without creating duplicates.
	const [flow, setFlow] = useState({
		state: 'idle',
		lead: null,
		email: '',
		phone: '',
		consent: null,
		feedUuid: null,
		clientSecret: null,
		publishableKey: null,
		err: null,
	});
	const [revealedIds, setRevealedIds] = useState(() => new Set());

	useEffect(() => {
		const t = setInterval(() => setNowMs(Date.now()), 1000);
		return () => clearInterval(t);
	}, []);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		setError(null);
		fetchProofLeads({ vertical: selectedVertical, countyId, feedUuid: flow.feedUuid || undefined })
			.then(data => {
				if (cancelled) return;
				setPayload(data);
				logBusinessEvent('PROOF_MOMENT_VIEWED', {
					feedUuid: flow.feedUuid || null,
					payload: {
						vertical: selectedVertical,
						county_id: countyId,
						revealed_count: Array.isArray(data?.revealed) ? data.revealed.length : 0,
						blurred_count: Array.isArray(data?.blurred) ? data.blurred.length : 0,
					},
				});
			})
			.catch(err => { if (!cancelled) setError(err?.message || 'Could not load leads'); })
			.finally(() => { if (!cancelled) setLoading(false); });
		return () => { cancelled = true; };
	}, [selectedVertical, countyId, flow.feedUuid]);

	const countdownMs = Math.max(0, expiresMs - nowMs);
	const windowExpired = countdownMs === 0;

	// Clear the stored expiry once the window lapses so the next page-load
	// starts a fresh 15-minute window instead of landing straight on "expired".
	useEffect(() => {
		if (windowExpired) localStorage.removeItem(LS_KEY);
	}, [windowExpired]);

	const roi = useMemo(() => getVerticalRoi(selectedVertical), [selectedVertical]);
	const verticalLabel = (selectedVertical || '').charAt(0).toUpperCase() + (selectedVertical || '').slice(1);

	// Begin the unlock flow for a specific blurred lead.
	const handleUnlock = (lead) => {
		logBusinessEvent('LEAD_UNLOCK_CLICKED', {
			feedUuid: flow.feedUuid,
			payload: { property_id: lead?.property_id, lead_tier: lead?.lead_tier },
		});
		// If no feed_uuid yet → ask for email first.
		if (!flow.feedUuid) {
			setFlow(f => ({ ...f, state: 'email', lead, err: null }));
			return;
		}
		// Have feed_uuid already → jump straight to payment/checkout creation.
		runUnlockFlow(lead, flow.feedUuid);
	};

	// D4: Gold+ leads route to the hot-lead unlock (Stripe-hosted Checkout
	// Session); everything else keeps the existing $4 embedded PaymentSheet flow.
	const runUnlockFlow = (lead, feedUuid) =>
		isHotLead(lead) ? runHotLeadUnlockFlow(lead, feedUuid) : runPaymentIntentFlow(lead, feedUuid);

	const runHotLeadUnlockFlow = async (lead, feedUuid) => {
		setFlow(f => ({ ...f, state: 'creating_intent', lead, feedUuid, err: null }));
		logBusinessEvent('PAYMENT_STARTED', {
			feedUuid,
			payload: { product: 'hot_lead_unlock', property_id: lead?.property_id },
		});
		try {
			const result = await unlockHotLead(feedUuid, lead.property_id);
			window.location.href = result.checkout_url;
		} catch (e) {
			setFlow(f => ({ ...f, state: 'idle', err: e?.detail?.message || e?.message || 'Could not start payment' }));
			onRequestUnlock?.(lead);
		}
	};

	const runPaymentIntentFlow = async (lead, feedUuid) => {
		setFlow(f => ({ ...f, state: 'creating_intent', lead, feedUuid, err: null }));
		logBusinessEvent('PAYMENT_STARTED', {
			feedUuid,
			payload: { product: 'lead_unlock', property_id: lead?.property_id },
		});
		try {
			const result = await createPaymentIntent({
				feedUuid,
				amountCents: UNLOCK_PRICE_CENTS,
				description: `Unlock ${lead.lead_tier || 'Gold'} lead in ${lead.zip || 'your ZIP'}`,
				saveCard: true,
				metadata: {
					product: 'lead_unlock',                         // routed by stripe_webhooks
					property_id: String(lead.property_id || ''),
				},
			});
			setFlow(f => ({
				...f,
				state: 'payment',
				clientSecret: result.client_secret || result.clientSecret,
				publishableKey: result.publishable_key || result.publishableKey,
			}));
		} catch (e) {
			setFlow(f => ({ ...f, state: 'idle', err: e?.detail?.message || e?.message || 'Could not start payment' }));
			// Also surface via legacy callback so parent can react.
			onRequestUnlock?.(lead);
		}
	};

	const handleEmailSubmit = async (e) => {
		e?.preventDefault?.();
		const email = (flow.email || '').trim().toLowerCase();
		if (!email || !email.includes('@') || !email.includes('.')) {
			setFlow(f => ({ ...f, err: 'Enter a valid email' }));
			return;
		}
		const rawPhone = (flow.phone || '').trim();
		// Lightweight client-side validation: must contain 10–15 digits.
		const phoneDigits = rawPhone.replace(/\D/g, '');
		if (rawPhone && (phoneDigits.length < 10 || phoneDigits.length > 15)) {
			setFlow(f => ({ ...f, err: 'Enter a valid phone number (10 digits)' }));
			return;
		}
		setFlow(f => ({ ...f, state: 'signing_up', err: null }));
		logBusinessEvent('SIGNUP_STARTED', {
			payload: {
				channel: 'email',
				signup_source: attribution?.signupSource || null,
			},
		});
		try {
			const _attr = getAttribution();
			const result = await createFreeSignup({
				email,
				vertical: selectedVertical,
				countyId,
				phone: rawPhone || null,
				consentAcceptance: flow.consent || null,
				// fa017 — attribution captured at landing
				signupSource: attribution?.signupSource || null,
				utmSource: _attr.utm_source || null,
				utmMedium: _attr.utm_medium || null,
				utmCampaign: _attr.utm_campaign || null,
				utmContent: _attr.utm_content || null,
				utmTerm: _attr.utm_term || null,
				landingPath: _attr.landing_path || null,
				referrer: _attr.referrer || null,
				campaignId: attribution?.campaignId || null,
				referralCode: attribution?.referralCode || null,
				referralSource: attribution?.referralSource || null,
				attributionToken: attribution?.attributionToken || null,
				affiliateRef: attribution?.affiliateRef || null,
				// User is about to pay $4 to unlock — defer welcome email until
				// payment_intent.succeeded fires.
				intent: 'unlock',
			});
			const feedUuid = result.feed_uuid;
			await runUnlockFlow(flow.lead, feedUuid);
		} catch (e) {
			setFlow(f => ({ ...f, state: 'email', err: e?.detail?.message || e?.message || 'Signup failed' }));
		}
	};

	const handlePaymentSuccess = () => {
		if (flow.lead?.property_id != null) {
			setRevealedIds(prev => new Set(prev).add(flow.lead.property_id));
		}
		const feedUuid = flow.feedUuid;
		logBusinessEvent('PAYMENT_SUCCEEDED', {
			feedUuid,
			payload: {
				product: 'lead_unlock',
				property_id: flow.lead?.property_id,
				signup_source: attribution?.signupSource || null,
			},
		});
		// Brief inline reveal of the just-purchased lead so the user sees
		// the contact data appear on the landing page before we navigate.
		if (feedUuid) {
			setTimeout(() => {
				fetchProofLeads({ vertical: selectedVertical, countyId, feedUuid })
					.then(data => setPayload(data))
					.catch(() => {});
			}, 1200);
		}
		// fa017: after the inline reveal animation finishes, route them into
		// the authenticated dashboard so they discover credits / banners /
		// settings. Matches the pricing-checkout flow's success behaviour.
		setTimeout(() => {
			setFlow({
				state: 'idle', lead: null, email: flow.email,
				feedUuid, clientSecret: null, publishableKey: null, err: null,
			});
			if (feedUuid) {
				navigate(`/dashboard/${feedUuid}`);
			}
		}, 1800);
	};

	const handlePaymentClose = () => {
		setFlow(f => ({ ...f, state: 'idle', clientSecret: null, publishableKey: null }));
	};

	// Live qualified-lead count from the proof payload. Backend returns
	// revealed + blurred; total visible count is 1 + blurred.length but the
	// population size for the headline is the county/vertical qualified count.
	const visibleCount = (payload?.revealed ? 1 : 0) + (payload?.blurred?.length || 0);

	return (
		<section id="first-session-wall" className="max-w-3xl mx-auto px-6 py-12">
			{/* fa017: source-attribution badge (only renders for known channels) */}
			<div className="mb-3 flex justify-center md:justify-start">
				<LandingAttribution />
			</div>
			{/* ROI frame + countdown header */}
			<div className={`rounded-xl border p-5 mb-5 ${
				windowExpired
					? 'border-slate-600/40 bg-white/[0.03]'
					: 'border-yellow-400/30 bg-gradient-to-br from-yellow-400/10 to-amber-600/10'
			}`}>
				<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-2">
							<Icon name="bolt" size={16} className={windowExpired ? 'text-slate-500' : 'text-yellow-400'} />
							<h3 className="text-white font-semibold text-base">
								{windowExpired ? 'Unlock window closed — leads still available' : 'Your first unlock window'}
							</h3>
						</div>
						<p className={`text-sm mt-1 ${windowExpired ? 'text-slate-500' : 'text-slate-300'}`}>
							{windowExpired
								? 'Your 15-minute priority window has passed. You can still unlock any lead below — subscribe to get unlimited access.'
								: <>
										{roi.headline.replace('{countyName}', countyName)}.{' '}
										{roi.avg_job_value && (
											<>One closed job ≈ <span className="text-white font-semibold">${roi.avg_job_value.toLocaleString()}</span> (industry avg).</>
										)}
										{roi.avg_deal_value && (
											<>One closed deal ≈ <span className="text-white font-semibold">${roi.avg_deal_value.toLocaleString()}</span> profit (industry avg).</>
										)}
									</>
							}
						</p>
						{!windowExpired && roi.monthly_revenue != null && (
							<>
								<p className="text-slate-400 text-xs mt-1">
									Top-quartile performers report ≈ ${roi.monthly_revenue.toLocaleString()}/mo. Individual results vary significantly based on territory, vertical, and close rate.
								</p>
								<p className="text-slate-500 text-xs mt-0.5 italic">
									Earnings figures are illustrative estimates based on industry averages. They are not a guarantee or prediction of income.
								</p>
							</>
						)}
					</div>

					<div className="flex flex-col items-end gap-1 shrink-0">
						<div className="text-xs text-slate-400 uppercase tracking-wider">Window</div>
						{windowExpired
							? <div className="text-sm font-medium text-slate-500">Closed</div>
							: <div className="text-2xl font-mono font-bold text-yellow-400 tabular-nums">{fmt(countdownMs)}</div>
						}
					</div>
				</div>
			</div>

			{/* Headline + sub */}
			<div className="text-center mb-6">
				<h2 className="text-2xl font-bold text-white">Here's what Forced Action just scored for you</h2>
				<p className="text-slate-400 text-sm mt-1">
					3 real properties in {countyName}.{' '}
					<span className="text-emerald-400">1 free preview.</span>{' '}
					<span className="text-yellow-400">2 hidden — unlock one tap, card saved after.</span>
				</p>
			</div>

			{/* Leads */}
			{loading && <p className="text-slate-400 text-sm text-center">Pulling your first leads…</p>}
			{error && <p className="text-red-400 text-sm text-center">{error}</p>}
			{!loading && !error && visibleCount === 0 && (
				<p className="text-slate-400 text-sm text-center">
					No qualified {verticalLabel.toLowerCase() || ''} leads in this area yet — new data arrives nightly.
				</p>
			)}
			{!loading && !error && visibleCount > 0 && (
				<div className="space-y-3">
					{payload.revealed && <RevealedLead lead={payload.revealed} />}
					{(payload.blurred || []).map((lead, i) => {
						// Treat as unlocked if the backend says so (post-refetch with feed_uuid)
						// OR if we just paid in this session (set in handlePaymentSuccess).
						const isUnlocked = lead.unlocked === true || revealedIds.has(lead.property_id);
						if (isUnlocked) {
							return <RevealedLead key={lead.property_id || i} lead={lead} />;
						}
						return <BlurredLead key={lead.property_id || i} lead={lead} onUnlock={handleUnlock} />;
					})}
				</div>
			)}

			{/* Inline email prompt — shown only during the unlock flow */}
			{(flow.state === 'email' || flow.state === 'signing_up' || flow.state === 'creating_intent') && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
					role="dialog"
					aria-modal="true"
					onClick={(e) => { if (e.target === e.currentTarget && flow.state === 'email') handlePaymentClose(); }}
				>
					<form
						onSubmit={handleEmailSubmit}
						className="max-w-sm w-full rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl"
					>
						<h3 className="text-white font-semibold text-base">Enter your email to unlock</h3>
						<p className="text-slate-400 text-xs mt-1">
							We need an email to attach your card + track this unlock. Free tier — no
							subscription, no surprises.
						</p>
						<input
							type="email"
							autoFocus
							required
							placeholder="you@contracting.com"
							value={flow.email}
							onChange={e => setFlow(f => ({ ...f, email: e.target.value, err: null }))}
							disabled={flow.state !== 'email'}
							className="mt-4 w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 text-white placeholder:text-slate-500 focus:border-yellow-400/60 focus:outline-none"
						/>
						<input
							type="tel"
							inputMode="tel"
							autoComplete="tel"
							placeholder="Phone (optional, for lead alerts)"
							value={flow.phone}
							onChange={e => setFlow(f => ({ ...f, phone: e.target.value, err: null }))}
							disabled={flow.state !== 'email'}
							className="mt-3 w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 text-white placeholder:text-slate-500 focus:border-yellow-400/60 focus:outline-none"
						/>
						<div className="mt-3">
							<TermsConsentGate
								sourceFlow="free_signup"
								showTcpa={true}
								phoneProvided={flow.phone.replace(/\D/g, '').length >= 10}
								onAccept={(c) => setFlow(f => ({ ...f, consent: c }))}
							/>
						</div>
						{flow.err && <p className="mt-2 text-red-400 text-xs">{flow.err}</p>}
						<p className="mt-3 text-slate-500 text-[11px]">
							Card saved on unlock. <span className="text-emerald-400">+2 bonus credits</span> if saved within 10 min.
						</p>
						<div className="mt-5 flex items-center justify-end gap-3">
							<button
								type="button"
								onClick={handlePaymentClose}
								disabled={flow.state !== 'email'}
								className="text-slate-400 hover:text-white text-sm px-3 py-2"
							>
								Cancel
							</button>
							<button
								type="submit"
								disabled={flow.state !== 'email' || !flow.consent?.terms_accepted}
								className="cta-primary text-sm px-5 py-2 disabled:opacity-60"
							>
								{flow.state === 'signing_up' ? 'Creating account…'
									: flow.state === 'creating_intent' ? 'Preparing payment…'
									: `Continue to pay ${isHotLead(flow.lead) ? HOT_LEAD_PRICE : UNLOCK_PRICE}`}
							</button>
						</div>
					</form>
				</div>
			)}

			{/* Payment Sheet — Stripe Elements */}
			<PaymentSheetModal
				isOpen={flow.state === 'payment' && !!flow.clientSecret}
				clientSecret={flow.clientSecret}
				publishableKey={flow.publishableKey}
				amountLabel={UNLOCK_PRICE}
				description={flow.lead ? `Unlock ${flow.lead.lead_tier || 'Gold'} lead in ${flow.lead.zip || 'your area'}` : 'Unlock this lead'}
				saveCardDefault={true}
				onSuccess={handlePaymentSuccess}
				onClose={handlePaymentClose}
			/>

			<p className="text-slate-500 text-xs text-center mt-6">
				Card saved on unlock. <span className="text-emerald-400">+2 bonus credits</span> if you save the card within 10 minutes.
			</p>
		</section>
	);
}

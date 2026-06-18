import { useCallback, useEffect, useMemo, lazy, Suspense } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import useApi from '../hooks/useApi';
import useFeedFilters from '../hooks/useFeedFilters';
import useContacted from '../hooks/useContacted';
import useStripePayment from '../hooks/useStripePayment';
import useZipActivityMap from '../hooks/useZipActivityMap';
import { fetchFeed, createPortalSession, logEvent, unlockHotLead, unlockLead, createLeadPackCheckout } from '../api/dashboard';
import { logBusinessEvent } from '../api/phase2b';
import PaymentSheetModal from '../components/common/PaymentSheetModal';
import Navbar from '../components/layout/Navbar';
import StatsBar from '../components/dashboard/StatsBar';
import LeadCard from '../components/dashboard/LeadCard';
import ReactivateBanner from '../components/dashboard/ReactivateBanner';
import DisputeBanner from '../components/dashboard/DisputeBanner';
import CancelModal from '../components/dashboard/CancelModal';
import LeadPackSection from '../components/dashboard/LeadPackSection';
import LeadPackModal from '../components/dashboard/LeadPackModal';
import LeadPackHistory from '../components/dashboard/LeadPackHistory';
import BlurredStackSection from '../components/dashboard/BlurredStackSection';
import FreeTierUpgradeCard from '../components/dashboard/FreeTierUpgradeCard';
import DashboardHeroBanner from '../components/dashboard/DashboardHeroBanner';
import OnboardingChecklist from '../components/dashboard/OnboardingChecklist';
import MonetizationWall from '../components/dashboard/MonetizationWall';
import DealCapture from '../components/dashboard/DealCapture';
import PremiumCreditsModal from '../components/dashboard/PremiumCreditsModal';
import DfyLitePitchModal from '../components/dashboard/DfyLitePitchModal';
import WalletTopupModal from '../components/dashboard/WalletTopupModal';
import AnnualOfferBanner from '../components/dashboard/AnnualOfferBanner';
import DataOnlySaveOfferBanner from '../components/dashboard/DataOnlySaveOfferBanner';
import APProUpsellBanner from '../components/dashboard/APProUpsellBanner';
import ApLiteUpgradeBanner, { readApLiteDismissed, writeApLiteDismissed } from '../components/dashboard/ApLiteUpgradeBanner';
import ApLiteStatusBanner from '../components/dashboard/ApLiteStatusBanner';
import PaymentFailedBanner from '../components/dashboard/PaymentFailedBanner';
import WhatYouMissedBanner from '../components/dashboard/WhatYouMissedBanner';
import WalletToLockUpgradeBanner, { readW2LDismissed, writeW2LDismissed } from '../components/dashboard/WalletToLockUpgradeBanner';
import AcceleratedWalletOfferBanner, { readAwDismissed } from '../components/dashboard/AcceleratedWalletOfferBanner';
import AcceleratedWalletOfferModal from '../components/dashboard/AcceleratedWalletOfferModal';
import { declineAcceleratedWalletOffer } from '../api/wallet';
import FlashScarcityBanner from '../components/dashboard/FlashScarcityBanner';
import FOMOIndicators from '../components/dashboard/FOMOIndicators';
import PauseStatusBanner from '../components/dashboard/PauseStatusBanner';
import PauseModal from '../components/dashboard/PauseModal';
import BundleCTAs from '../components/dashboard/BundleCTAs';
import BundleOfferModal from '../components/dashboard/BundleOfferModal';
// Lazy: defers react-markdown + remark-gfm (~75 KB) out of the main chunk.
const ConciergeChat = lazy(() => import('../components/concierge/ConciergeChat'));
import StormPackBanner from '../components/dashboard/StormPackBanner';
import BundleLeadSection from '../components/dashboard/BundleLeadSection';
import TeamViewTile from '../components/dashboard/TeamViewTile';
import LeaderboardWidget from '../components/dashboard/LeaderboardWidget';
import SearchBar from '../components/dashboard/SearchBar';
import FilterBar from '../components/dashboard/FilterBar';
import SortDropdown from '../components/dashboard/SortDropdown';
import ExportButton from '../components/dashboard/ExportButton';
import UpgradeBanner from '../components/dashboard/UpgradeBanner';
import LeadCardSkeletonList from '../components/dashboard/LeadCardSkeleton';
import Pagination from '../components/ui/Pagination';
import ErrorState from '../components/ui/ErrorState';
import EmptyState from '../components/ui/EmptyState';
import PageLoader from '../components/ui/PageLoader';
import { useState, useRef } from 'react';
import useStormStatus from '../hooks/useStormStatus';
import { decodeSubToken } from '../api/subscriber.js';

function isWithinFirst48h(createdAtIso) {
  if (!createdAtIso) return false;
  const created = new Date(createdAtIso).getTime();
  if (Number.isNaN(created)) return false;
  return (Date.now() - created) < 48 * 3600 * 1000;
}

function daysSince(createdAtIso) {
  if (!createdAtIso) return 0;
  const created = new Date(createdAtIso).getTime();
  if (Number.isNaN(created)) return 0;
  return (Date.now() - created) / (24 * 3600 * 1000);
}

const ANNUAL_DISMISS_TTL_MS = 7 * 24 * 3600 * 1000;
function readAnnualDismissed(feedUuid) {
  try {
    const raw = localStorage.getItem(`fa.dashboard.annual_dismissed.${feedUuid}`);
    if (!raw) return false;
    const ts = Number(raw);
    if (Number.isNaN(ts)) return false;
    if (Date.now() - ts > ANNUAL_DISMISS_TTL_MS) {
      localStorage.removeItem(`fa.dashboard.annual_dismissed.${feedUuid}`);
      return false;
    }
    return true;
  } catch { return false; }
}
function writeAnnualDismissed(feedUuid) {
  try { localStorage.setItem(`fa.dashboard.annual_dismissed.${feedUuid}`, String(Date.now())); } catch { /* noop */ }
}

export default function DashboardPage() {
  const { feedUuid } = useParams();

  // Synchronous check — runs during render, before any effects fire.
  // Prevents one-frame flash of dashboard content when the token is missing/wrong.
  const isAuthReady = useMemo(() => {
    const payload = decodeSubToken();
    return !!(payload && payload.feed_uuid === feedUuid);
  }, [feedUuid]);

  const [searchParams, setSearchParams] = useSearchParams();
  const { filters, setFilter, setPage, searchInput, setSearchInput } = useFeedFilters();
  const { isContacted, toggleContacted } = useContacted();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [lpZip, setLpZip] = useState('');
  const [lpOpen, setLpOpen] = useState(false);
  const [dealCaptureOpen, setDealCaptureOpen] = useState(false);
  const [premiumLead, setPremiumLead] = useState(null);   // lead obj for premium modal
  const [pitchLead, setPitchLead] = useState(null);       // lead obj for DFY-Lite pitch modal
  const handleOpenPitch = useCallback((lead) => setPitchLead(lead), []);
  const [unlockState, setUnlockState] = useState({
    open: false,
    lead: null,
    clientSecret: null,
    publishableKey: null,
  });
  const [annualBannerDismissed, setAnnualBannerDismissed] = useState(false);
  const [apProDismissed, setApProDismissed] = useState(false);
  const [apLiteDismissed, setApLiteDismissed] = useState(() => feedUuid ? readApLiteDismissed(feedUuid) : false);
  const [w2lDismissed, setW2LDismissed] = useState(() => feedUuid ? readW2LDismissed(feedUuid) : false);
  const [awDismissed, setAwDismissed] = useState(() => feedUuid ? readAwDismissed(feedUuid) : false);
  const [awModalOpen, setAwModalOpen] = useState(false);
  const [bundleDismissed, setBundleDismissed] = useState(false);
  const [pauseModalOpen, setPauseModalOpen] = useState(false);
  const [saveOfferDismissed, setSaveOfferDismissed] = useState(false);
  // Chat-triggered bundle/lock offers

  // Stage 5 — URL-driven offer surfaces
  const urlAnnualOffer = searchParams.get('annual') === 'accept';
  const urlSaveOffer = searchParams.get('save_offer') === 'accept';

  const showApProOffer = useMemo(() =>
    !apProDismissed && searchParams.get('upgrade') === 'autopilot_pro',
  [apProDismissed, searchParams]);

  const dismissAnnual = useCallback(() => {
    setAnnualBannerDismissed(true);
    if (feedUuid) writeAnnualDismissed(feedUuid);
    const next = new URLSearchParams(searchParams);
    next.delete('annual');
    setSearchParams(next, { replace: true });
  }, [feedUuid, searchParams, setSearchParams]);

  const dismissSaveOffer = useCallback(() => {
    setSaveOfferDismissed(true);
    const next = new URLSearchParams(searchParams);
    next.delete('save_offer');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const dismissApPro = useCallback(() => {
    setApProDismissed(true);
    const next = new URLSearchParams(searchParams);
    next.delete('upgrade');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  // Stage 5+ — wallet topup deep link from 402 insufficient-credits responses
  const topupOpen = searchParams.get('wallet') === 'topup';
  const closeTopup = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete('wallet');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  // fa016 — accelerated wallet push deep link (?wallet_offer=accept). Auto-opens
  // the modal so SMS link landings go straight to one-tap activation.
  const urlWalletOffer = searchParams.get('wallet_offer') === 'accept';
  const closeWalletOffer = useCallback(() => {
    setAwModalOpen(false);
    const next = new URLSearchParams(searchParams);
    if (next.get('wallet_offer')) next.delete('wallet_offer');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  // Stage 5 — bundle deep link from SMS dispatcher
  const bundleParam = searchParams.get('bundle');
  const variantParam = searchParams.get('variant') || 'a';
  const showBundleOffer = !bundleDismissed && !!bundleParam;
  const dismissBundle = useCallback(() => {
    setBundleDismissed(true);
    const next = new URLSearchParams(searchParams);
    next.delete('bundle');
    next.delete('variant');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  // fa061 — mount guard: redirect to login if no valid token exists OR if the
  // stored token belongs to a different feed (stale session from another account).
  useEffect(() => {
    const payload = decodeSubToken();
    if (!payload || payload.feed_uuid !== feedUuid) {
      window.location.replace(`/dashboard/${feedUuid}/login`);
    }
  }, [feedUuid]);

  const { data, loading, error, refetch } = useApi(
    (signal) => fetchFeed(feedUuid, {
      page: filters.page,
      sort: filters.sort,
      minScore: filters.minScore,
      incidentType: filters.incidentType,
      search: filters.search,
      signal,
    }),
    [feedUuid, filters.page, filters.sort, filters.minScore, filters.incidentType, filters.search],
  );

  useEffect(() => {
    if (error?.status === 401 || error?.status === 403) {
      window.location.replace(`/dashboard/${feedUuid}/login`);
    }
  }, [error, feedUuid]);

  const handleTopupSuccess = useCallback(() => {
    closeTopup();
    setTimeout(refetch, 2000);
  }, [closeTopup, refetch]);

  const stripePayment = useStripePayment();

  const subscriber = data?.subscriber || {};
  const leads = data?.leads || [];
  const totalPages = data?.pages || 1;
  const isPaused = subscriber.status === 'paused';
  const lockedZips = subscriber.locked_zips || [];
  const deepLinkBundleZip = lockedZips.length === 1 ? lockedZips[0] : '';

  const bundleLeadSectionRef = useRef(null);
  const { hasStormLeads, stormLeads, hoursRemaining: stormHoursRemaining } = useStormStatus(data);

  // fa016 — auto-open the wallet-offer modal in two cases:
  //   (a) `?wallet_offer=accept` URL param (SMS deep-link) → force-open every visit
  //   (b) eligible & not seen this session → auto-open once per browser session
  // The session flag lets users dismiss the modal and only re-encounter it via
  // the banner (or a fresh tab), not on every navigation.
  const [awAutoOpened, setAwAutoOpened] = useState(false);
  useEffect(() => {
    if (
      !subscriber?.accelerated_wallet_offer_active
      || awModalOpen
      || awAutoOpened
    ) return;

    const offerId = subscriber.accelerated_wallet_offer_id;
    const seenKey = `fa.wallet_offer_seen.${subscriber.id}.${offerId || 'na'}`;
    let seenThisSession = false;
    try {
      seenThisSession = sessionStorage.getItem(seenKey) === '1';
    } catch (e) {
      // private mode / blocked storage — treat as not seen
    }

    if (urlWalletOffer || !seenThisSession) {
      setAwModalOpen(true);
      setAwAutoOpened(true);
      try { sessionStorage.setItem(seenKey, '1'); } catch (e) { /* ignore */ }
      logBusinessEvent('WALLET_OFFER_SHOWN_IN_APP', {
        feedUuid,
        payload: {
          trigger: urlWalletOffer ? 'url' : 'auto',
          offer_id: offerId || null,
        },
      });
    }
  }, [
    urlWalletOffer,
    subscriber?.id,
    subscriber?.accelerated_wallet_offer_active,
    subscriber?.accelerated_wallet_offer_id,
    awModalOpen,
    awAutoOpened,
    feedUuid,
  ]);

  const handleDeclineAwOffer = useCallback((offerId) => {
    setAwDismissed(true);
    if (!feedUuid || !offerId) return;
    logBusinessEvent('WALLET_DECLINED', {
      feedUuid,
      payload: { offer_id: offerId, source: 'dashboard' },
    });
    declineAcceleratedWalletOffer(feedUuid, offerId).catch(() => {});
  }, [feedUuid]);

  const handleAwSuccess = useCallback(() => {
    // Refetch feed in ~2s so credits_balance + offer state update post-webhook,
    // and again at ~5s to catch slower webhook delivery.
    setTimeout(refetch, 2000);
    setTimeout(refetch, 5000);
    // Lock the auto-opener so a stale ?wallet_offer=accept doesn't pop the
    // modal back open while we're waiting on the webhook.
    setAwAutoOpened(true);
  }, [refetch]);

  // Always-on Annual offer: monthly subscribers ≥ 14 days who haven't dismissed in the last 7 days.
  // URL deep-link continues to win over any local dismissal.
  const evergreenAnnualEligible = useMemo(() => {
    if (!subscriber?.id) return false;
    if (subscriber.tier === 'annual_lock') return false;
    if (annualBannerDismissed) return false;
    if (feedUuid && readAnnualDismissed(feedUuid)) return false;
    return daysSince(subscriber.created_at) >= 14;
  }, [subscriber?.id, subscriber?.tier, subscriber?.created_at, annualBannerDismissed, feedUuid]);

  const showAnnualOffer = urlAnnualOffer || evergreenAnnualEligible;

  const showSaveOffer = useMemo(() =>
    !saveOfferDismissed && (urlSaveOffer || !!subscriber?.save_offer_active),
    [saveOfferDismissed, urlSaveOffer, subscriber?.save_offer_active],
  );

  // Group urgency polling by unique ZIP — one poll per ZIP, not per LeadCard.
  const visibleZips = useMemo(
    () => leads.map((l) => l.zip).filter(Boolean),
    [leads],
  );
  const zipActivity = useZipActivityMap(visibleZips, subscriber.vertical);

  const handlePageChange = useCallback((page) => {
    setPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setPage]);

  const handleUnlockHotLead = useCallback(async (lead) => {
    if (!lead?.property_id) return;
    logBusinessEvent('LEAD_UNLOCK_CLICKED', {
      feedUuid,
      payload: { property_id: lead.property_id, source: 'dashboard' },
    });
    try {
      const resp = await unlockLead({
        feedUuid,
        propertyId: lead.property_id,
        leadTier: lead.lead_tier,
        zip: lead.zip,
      });
      logBusinessEvent('PAYMENT_STARTED', {
        feedUuid,
        payload: { product: 'lead_unlock', property_id: lead.property_id },
      });
      setUnlockState({
        open: true,
        lead,
        clientSecret: resp.client_secret,
        publishableKey: resp.publishable_key,
      });
    } catch (err) {
      const detail = err?.detail;
      if (detail?.error === 'lead_held_by_other') {
        alert('Another subscriber is currently purchasing this lead. Try again in a few minutes.');
      } else {
        alert(detail?.message || 'Unable to start unlock. Please try again.');
      }
    }
  }, [feedUuid]);

  const handleUnlockSuccess = useCallback(() => {
    logBusinessEvent('PAYMENT_SUCCEEDED', {
      feedUuid,
      payload: { product: 'lead_unlock', property_id: unlockState.lead?.property_id },
    });
    setUnlockState((s) => ({ ...s, open: false }));
    // Match FirstSessionWall timing: webhook needs ~1s to stamp SentLead.
    setTimeout(refetch, 1200);
    setTimeout(refetch, 4000);
  }, [feedUuid, unlockState.lead, refetch]);

  const handleUnlockClose = useCallback(() => {
    setUnlockState((s) => ({ ...s, open: false }));
  }, []);

  const handleCancelConfirm = useCallback(async () => {
    await logEvent('cancel_confirm', feedUuid);
    try {
      const { url } = await createPortalSession(feedUuid);
      window.location.href = url;
    } catch {
      alert('Unable to open the billing portal. Please email support@forcedaction.io');
    }
  }, [feedUuid]);

  const handleCancelAbort = useCallback(async () => {
    await logEvent('cancel_abort', feedUuid);
    setCancelOpen(false);
  }, [feedUuid]);

  const handleReactivate = useCallback(async () => {
    try {
      const { url } = await createPortalSession(feedUuid);
      window.location.href = url;
    } catch {
      alert('Unable to open the billing portal. Please email support@forcedaction.io');
    }
  }, [feedUuid]);

  const handleOpenLpModal = useCallback((zip) => {
    if (!zip || zip.length < 5) { alert('Enter a valid 5-digit ZIP code.'); return; }
    setLpZip(zip);
    setLpOpen(true);
    stripePayment.reset();
    logEvent('lead_pack_modal_open', feedUuid);
  }, [feedUuid, stripePayment]);

  const handleStartLeadPackPayment = useCallback(async () => {
    try {
      const { client_secret, publishable_key } = await createLeadPackCheckout({
        feedUuid,
        zipCode: lpZip,
        vertical: subscriber.vertical,
        countyId: subscriber.county_id || 'hillsborough',
      });
      const paymentElement = await stripePayment.initPayment(client_secret, publishable_key);
      setTimeout(() => {
        const el = document.getElementById('lp-payment-element');
        if (el) paymentElement.mount(el);
      }, 50);
    } catch (err) {
      const msg = err.detail?.message || 'Payment unavailable. Please try again.';
      alert(msg);
      if (err.detail?.error === 'zip_already_owned') { setLpOpen(false); }
    }
  }, [feedUuid, lpZip, subscriber, stripePayment]);

  const handleConfirmLeadPackPayment = useCallback(async () => {
    await stripePayment.confirmPayment();
    if (stripePayment.step === 'success') {
      logEvent('lead_pack_purchased', feedUuid);
      logBusinessEvent('LEAD_PACK_PURCHASED', {
        feedUuid,
        payload: { zip: lpZip, vertical: subscriber.vertical },
      });
      logBusinessEvent('PAYMENT_SUCCEEDED', {
        feedUuid,
        payload: { product: 'lead_pack', zip: lpZip },
      });
      // Webhook stamps SentLead rows ~1-2s after charge.succeeded; refetch twice.
      setTimeout(refetch, 1500);
      setTimeout(refetch, 4500);
    }
  }, [stripePayment, feedUuid, lpZip, subscriber.vertical, refetch]);

  const handleCloseLpModal = useCallback(() => {
    setLpOpen(false);
    stripePayment.reset();
  }, [stripePayment]);

  const handleUpgrade = useCallback(async () => {
    try {
      const { url } = await createPortalSession(feedUuid);
      window.location.href = url;
    } catch {
      alert('Unable to open the billing portal.');
    }
  }, [feedUuid]);

  const handleBundlePurchaseSuccess = useCallback(({ bundleType, zipCode }) => {
    logBusinessEvent('PAYMENT_SUCCEEDED', {
      feedUuid,
      payload: {
        product: 'bundle',
        bundle_type: bundleType,
        zip_code: zipCode || null,
      },
    });
    setTimeout(refetch, 1500);
    setTimeout(refetch, 4500);
    if (bundleType !== 'monthly_reload') {
      setTimeout(() => {
        bundleLeadSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 2800);
    }
  }, [feedUuid, refetch]);

  return (
    <div className="gradient-bg-dashboard min-h-screen text-white">
      <PageLoader visible={!isAuthReady || loading} />
      <div className="relative z-[1]">
        <Navbar variant="dashboard">
          {subscriber.founding_member && (
            <span className="text-xs font-semibold bg-yellow-400/10 border border-yellow-400/40 text-yellow-400 px-3.5 py-1.5 rounded-full founding-badge-glow">
              <span className="inline-block w-1.5 h-1.5 bg-yellow-400 rounded-full mr-1.5 align-middle founding-pulse" />
              Founding Member — Rate Locked Forever
            </span>
          )}
          <Link
            to={`/dashboard/${feedUuid}/settings`}
            className="text-sm text-slate-400 hover:text-white transition-colors duration-200 px-3 py-1.5 rounded-lg hover:bg-white/5"
          >
            Settings
          </Link>
          <button
            onClick={() => setCancelOpen(true)}
            className="text-sm text-slate-400 hover:text-white transition-colors duration-200 px-3 py-1.5 rounded-lg hover:bg-white/5"
          >
            Manage Subscription
          </button>
        </Navbar>

        <main id="main-content" className="max-w-6xl mx-auto px-6 py-8">
          {loading && <LeadCardSkeletonList count={5} />}
          {error && <ErrorState />}

          {!loading && !error && (
            <>
              {subscriber.status === 'disputed' && (
                <DisputeBanner disputedAt={subscriber.disputed_at} />
              )}

              {subscriber.status === 'grace' && (
                <ReactivateBanner onReactivate={handleReactivate} />
              )}

              {subscriber.status === 'paused' && (
                <PauseStatusBanner
                  resumeAt={subscriber.pause_resume_at}
                  feedUuid={feedUuid}
                  onResumed={refetch}
                />
              )}

              {/* Stripe failed-payment recovery — Day 1 (soft) / Day 3 (urgency).
                  Day 5 / downgrade-to-Data-Only is owned by DataOnlySaveOfferBanner
                  below, so suppress this when save_offer_active is true. */}
              {subscriber.payment_failed_at && !subscriber.save_offer_active && !isPaused && (
                <PaymentFailedBanner
                  feedUuid={feedUuid}
                  paymentFailedAt={subscriber.payment_failed_at}
                  recoveryDay3Sent={subscriber.recovery_day3_sent}
                  missedLeadCount={subscriber.missed_lead_count || 0}
                />
              )}

              {/* "What you missed" — only surfaces for recovery-targeted subscribers
                  (save_offer_active / payment_failed / grace), block emitted by feed. */}
              {subscriber.what_you_missed && !isPaused && (
                <WhatYouMissedBanner
                  whatYouMissed={subscriber.what_you_missed}
                  onView={() => window.scrollTo({ top: document.getElementById('lead-feed')?.offsetTop || 0, behavior: 'smooth' })}
                />
              )}

              {/* Data-Only save offer — surfaces from proactive-save email deep link or backend flag */}
              {showSaveOffer && !isPaused && (
                <DataOnlySaveOfferBanner
                  feedUuid={feedUuid}
                  onAccepted={dismissSaveOffer}
                  onDismiss={dismissSaveOffer}
                />
              )}

              {/* Stage 5: Annual offer banner — surfaces from email deep link or backend flag */}
              {showAnnualOffer && !isPaused && (
                <AnnualOfferBanner
                  feedUuid={feedUuid}
                  onAccepted={dismissAnnual}
                  onDismiss={dismissAnnual}
                />
              )}

              {/* Stage 5: AP Pro upgrade — surfaces from email deep link */}
              {showApProOffer && !isPaused && (
                <APProUpsellBanner
                  feedUuid={feedUuid}
                  onUpgraded={dismissApPro}
                  onDismiss={dismissApPro}
                />
              )}

              {/* Phase 2B: AP Lite upgrade — annual_lock subscribers who are eligible */}
              {subscriber.tier === 'annual_lock' &&
               subscriber.ap_lite_eligible === true &&
               !apLiteDismissed && !isPaused && (
                <ApLiteUpgradeBanner
                  feedUuid={feedUuid}
                  weeklyActions={subscriber.manual_actions_this_week}
                  onUpgraded={refetch}
                  onDismiss={() => {
                    setApLiteDismissed(true);
                    if (feedUuid) writeApLiteDismissed(feedUuid);
                  }}
                />
              )}

              {/* AP Lite post-upgrade status — informational surface for autopilot_lite subscribers */}
              {subscriber.tier === 'autopilot_lite' && !isPaused && (
                <ApLiteStatusBanner
                  autoModeEnabled={subscriber.auto_mode_enabled}
                  manualActionsThisWeek={subscriber.manual_actions_this_week}
                />
              )}

              {/* fa016: Accelerated Wallet Push — saved-card subscribers with first paid intent */}
              {subscriber.accelerated_wallet_offer_active && !awDismissed && !isPaused && (
                <AcceleratedWalletOfferBanner
                  feedUuid={feedUuid}
                  offerId={subscriber.accelerated_wallet_offer_id}
                  creditsOffered={subscriber.accelerated_wallet_offer_credits || 20}
                  priceCents={subscriber.accelerated_wallet_offer_price_cents || 4900}
                  missedLeads={subscriber.missed_lead_count || 0}
                  savedCardLast4={subscriber.saved_card_last4}
                  onActivate={() => setAwModalOpen(true)}
                  onDecline={handleDeclineAwOffer}
                />
              )}

              {/* Stage 6: Wallet-to-Lock upgrade — wallet subscribers who hit the spend threshold */}
              {subscriber.wallet_to_lock_eligible && !w2lDismissed && !isPaused && (
                <WalletToLockUpgradeBanner
                  zipCode={subscriber.lock_candidate_zip}
                  creditsSpent={subscriber.wallet_credits_30d}
                  ctaUrl={`/checkout?lock_zip=${subscriber.lock_candidate_zip}`}
                  onDismiss={() => {
                    setW2LDismissed(true);
                    if (feedUuid) writeW2LDismissed(feedUuid);
                  }}
                />
              )}

              {/* Stage 6: Flash scarcity banners — one per active ZIP window */}
              {!isPaused && (subscriber.flash_scarcity_windows || []).map((w) => (
                <FlashScarcityBanner
                  key={`${w.zip_code}:${w.vertical}`}
                  window={w}
                  onLockClick={(zip) => { window.location.href = `/checkout?lock_zip=${zip}`; }}
                />
              ))}

              {/* Stage 6: FOMO indicators — competitor-viewer pill per locked ZIP. Renders silently when activity is below threshold. */}
              {!isPaused && lockedZips.map((zip) => (
                <FOMOIndicators
                  key={`fomo:${zip}`}
                  zipCode={zip}
                  vertical={subscriber.vertical}
                  className="px-1"
                />
              ))}

              {/* Storm Pack banner — shown when subscriber has active storm bundle leads */}
              {hasStormLeads && !isPaused && (
                <StormPackBanner
                  stormLeadCount={stormLeads.length}
                  hoursRemaining={stormHoursRemaining}
                  onViewLeads={() => bundleLeadSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                />
              )}

              <StatsBar
                subscriber={subscriber}
                onTopup={() => {
                  const next = new URLSearchParams(searchParams);
                  next.set('wallet', 'topup');
                  setSearchParams(next);
                }}
              />

              {/* Phase 2B: Monetization Wall — first-48h countdown + ROI frame. */}
              {subscriber.id && isWithinFirst48h(subscriber.created_at) && !isPaused && (
                <MonetizationWall
                  subscriberId={subscriber.id}
                  vertical={subscriber.vertical}
                  countyId={subscriber.county_id || 'hillsborough'}
                  onUnlock={(zip) => handleOpenLpModal(zip)}
                />
              )}

              {/* Persistent free-tier upgrade card (replaces dead-end empty state after 48h) */}
              {subscriber.id && subscriber.tier === 'free' && !isPaused && (
                <FreeTierUpgradeCard
                  onScrollToLeads={() => {
                    const el = document.querySelector('main');
                    if (el) el.scrollBy({ top: 400, behavior: 'smooth' });
                  }}
                  onBuyLeadPack={() => {
                    const z = (subscriber.locked_zips && subscriber.locked_zips[0]) || '';
                    if (z) {
                      handleOpenLpModal(z);
                    } else {
                      const zip = window.prompt('Enter the 5-digit ZIP code you want leads from:');
                      if (zip) handleOpenLpModal(zip);
                    }
                  }}
                  onUpgrade={handleUpgrade}
                  walletEligible={!!subscriber.accelerated_wallet_offer_active}
                  onActivateWallet={() => setAwModalOpen(true)}
                />
              )}

              <OnboardingChecklist totalLeads={data?.total} />
              <DashboardHeroBanner
                total={data?.total}
                zips={subscriber.locked_zips}
                partnerEligible={isPaused ? false : subscriber.partner_eligible}
              />

              {/* Stage 5: Referral team Shared ZIP heat map (renders only when unlocked) */}
              <TeamViewTile feedUuid={feedUuid} />

              {/* Stage 5: Weekly leaderboard, scoped to subscriber's cohort */}
              <LeaderboardWidget
                countyId={subscriber.county_id}
                vertical={subscriber.vertical}
              />

              {/* Phase 2B: Deal-Size Capture trigger */}
              <div className="mb-4 flex items-center justify-end">
                <button
                  onClick={() => setDealCaptureOpen(true)}
                  type="button"
                  className="text-sm text-yellow-300 hover:text-yellow-200 underline underline-offset-2"
                >
                  I closed a deal &rarr;
                </button>
              </div>

              {/* Search, Filter, Sort, Export */}
              <div className="mb-6 space-y-3">
                <div className="flex gap-3 items-center flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <SearchBar value={searchInput} onChange={setSearchInput} />
                  </div>
                  <SortDropdown value={filters.sort} onChange={(v) => setFilter('sort', v)} />
                  <ExportButton leads={leads} page={filters.page} />
                </div>
                <FilterBar
                  minScore={filters.minScore}
                  incidentType={filters.incidentType}
                  onFilterChange={setFilter}
                />
              </div>

              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-extrabold tracking-tight">Your Lead Feed</h1>
                <span className="text-slate-400 text-sm font-medium">
                  {data.total} lead{data.total !== 1 ? 's' : ''} · Page {filters.page} of {totalPages}
                </span>
              </div>

              {leads.length > 0 && (
                <>
                  <div className="space-y-3">
                    {leads.map((lead, i) => (
                      <LeadCard
                        key={lead.property_id}
                        lead={lead}
                        index={i}
                        onUnlockHotLead={handleUnlockHotLead}
                        contacted={isContacted(lead.property_id)}
                        onToggleContacted={toggleContacted}
                        onOpenPremium={setPremiumLead}
                        onOpenPitch={handleOpenPitch}
                        urgencyViewers={zipActivity[lead.zip]?.active_viewers}
                        feedUuid={feedUuid}
                      />
                    ))}
                  </div>

                  {!isPaused && (
                    <UpgradeBanner
                      tier={subscriber.tier}
                      currentPage={filters.page}
                      onUpgrade={handleUpgrade}
                    />
                  )}

                  <Pagination
                    currentPage={filters.page}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </>
              )}

              {data?.blurred_stack?.length > 0 && (
                <BlurredStackSection
                  blurred={data.blurred_stack}
                  onUnlockBlurred={handleUnlockHotLead}
                />
              )}

              {leads.length === 0 && !data?.blurred_stack?.length && (
                <EmptyState />
              )}

              {/* Bundle leads — exclusively unlocked leads from active bundle purchases */}
              {(data?.bundle_leads?.length > 0) && (
                <BundleLeadSection
                  bundleLeads={data.bundle_leads}
                  sectionRef={bundleLeadSectionRef}
                  isContacted={isContacted}
                  onToggleContacted={toggleContacted}
                  feedUuid={feedUuid}
                />
              )}

              <LeadPackHistory feedUuid={feedUuid} />
              {!isPaused && (
                <BundleCTAs
                  feedUuid={feedUuid}
                  vertical={subscriber.vertical}
                  countyId={subscriber.county_id || 'hillsborough'}
                  lockedZips={lockedZips}
                  stormStatus={hasStormLeads ? 'active' : 'unknown'}
                  onPurchase={handleBundlePurchaseSuccess}
                />
              )}
              {!isPaused && <LeadPackSection onOpenModal={handleOpenLpModal} />}

              {/* Stage 6: Save / Pause CTA — dashboard entry into the 60-day pause flow.
                  Modal already mounted below; this is the missing trigger after the refactor. */}
              {!isPaused && (
                <section
                  data-testid="dashboard-pause-cta"
                  aria-label="Manage subscription"
                  className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div>
                    <h3 className="text-base font-semibold text-white">
                      Need a break? Pause for 60 days
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">
                      Billing stops immediately. Your ZIP territory stays reserved. Auto-resumes after 60 days.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPauseModalOpen(true)}
                    className="self-start sm:self-auto inline-flex items-center justify-center rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold px-5 py-2.5 transition-colors"
                  >
                    Pause subscription
                  </button>
                </section>
              )}
            </>
          )}
        </main>

        <CancelModal
          isOpen={cancelOpen}
          onClose={handleCancelAbort}
          onConfirm={handleCancelConfirm}
        />

        <PauseModal
          isOpen={pauseModalOpen}
          onClose={() => setPauseModalOpen(false)}
          feedUuid={feedUuid}
          onPaused={refetch}
        />

        <LeadPackModal
          isOpen={lpOpen}
          onClose={handleCloseLpModal}
          zip={lpZip}
          vertical={subscriber.vertical}
          step={stripePayment.step}
          error={stripePayment.error}
          processing={stripePayment.processing}
          onStartPayment={handleStartLeadPackPayment}
          onConfirmPayment={handleConfirmLeadPackPayment}
        />

        {/* Stage 5: Bundle offer modal — opens on ?bundle=<type>&variant=<a|b> deep link */}
        <BundleOfferModal
          isOpen={showBundleOffer}
          feedUuid={feedUuid}
          bundleType={bundleParam}
          variant={variantParam}
          zipCode={deepLinkBundleZip}
          lockedZips={lockedZips}
          vertical={subscriber?.vertical}
          countyId={subscriber?.county_id || 'hillsborough'}
          onClose={dismissBundle}
          onSuccess={(result) => {
            dismissBundle();
            handleBundlePurchaseSuccess(result);
          }}
        />

        {/* Stage 5+ — Wallet topup modal (opens via ?wallet=topup deep link) */}
        <WalletTopupModal
          isOpen={topupOpen}
          feedUuid={feedUuid}
          onClose={closeTopup}
          onSuccess={handleTopupSuccess}
        />

        {/* fa016 — Accelerated Wallet Push modal (opens via ?wallet_offer=accept
            deep link or the banner CTA). */}
        <AcceleratedWalletOfferModal
          isOpen={awModalOpen}
          feedUuid={feedUuid}
          offerId={subscriber.accelerated_wallet_offer_id}
          creditsOffered={subscriber.accelerated_wallet_offer_credits || 20}
          priceCents={subscriber.accelerated_wallet_offer_price_cents || 4900}
          savedCardLast4={subscriber.saved_card_last4}
          onClose={closeWalletOffer}
          onSuccess={handleAwSuccess}
        />

        {/* S3b: DFY-Lite pitch modal */}
        {pitchLead && (
          <DfyLitePitchModal
            lead={pitchLead}
            feedUuid={feedUuid}
            onClose={() => setPitchLead(null)}
          />
        )}

        {/* Stage 5: Premium credits modal */}
        <PremiumCreditsModal
          isOpen={!!premiumLead}
          feedUuid={feedUuid}
          propertyId={premiumLead?.property_id || null}
          propertyAddress={premiumLead?.address || null}
          walletBalance={subscriber.wallet_balance || 0}
          onClose={() => setPremiumLead(null)}
          onSuccess={() => setTimeout(() => setPremiumLead(null), 1500)}
        />

        {/* Phase 2B: $4 lead unlock payment sheet (dashboard) */}
        <PaymentSheetModal
          isOpen={unlockState.open}
          clientSecret={unlockState.clientSecret}
          publishableKey={unlockState.publishableKey}
          amountLabel="$4.00"
          description={unlockState.lead?.address
            ? `Unlock ${unlockState.lead.address}`
            : 'Unlock this lead'}
          saveCardDefault={true}
          onSuccess={handleUnlockSuccess}
          onClose={handleUnlockClose}
        />

        {/* Phase 2B: Deal-Size Capture modal */}
        {dealCaptureOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            onClick={(e) => { if (e.target === e.currentTarget) setDealCaptureOpen(false); }}
          >
            <div className="max-w-lg w-full">
              <DealCapture
                feedUuid={feedUuid}
                onCaptured={() => setTimeout(() => setDealCaptureOpen(false), 1500)}
                onDismiss={() => setDealCaptureOpen(false)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Concierge Chat — lazy: defers react-markdown out of initial bundle */}
      <Suspense fallback={null}>
        <ConciergeChat mode="post_signup" feedUuid={feedUuid} />
      </Suspense>
    </div>
  );
}

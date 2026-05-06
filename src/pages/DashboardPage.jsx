import { useCallback, useMemo } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import useApi from '../hooks/useApi';
import useFeedFilters from '../hooks/useFeedFilters';
import useContacted from '../hooks/useContacted';
import useStripePayment from '../hooks/useStripePayment';
import useZipActivityMap from '../hooks/useZipActivityMap';
import { fetchFeed, createPortalSession, logEvent, unlockHotLead, createLeadPackCheckout } from '../api/dashboard';
import Navbar from '../components/layout/Navbar';
import StatsBar from '../components/dashboard/StatsBar';
import LeadCard from '../components/dashboard/LeadCard';
import ReactivateBanner from '../components/dashboard/ReactivateBanner';
import CancelModal from '../components/dashboard/CancelModal';
import LeadPackSection from '../components/dashboard/LeadPackSection';
import LeadPackModal from '../components/dashboard/LeadPackModal';
import LeadPackHistory from '../components/dashboard/LeadPackHistory';
import DashboardHeroBanner from '../components/dashboard/DashboardHeroBanner';
import OnboardingChecklist from '../components/dashboard/OnboardingChecklist';
import MonetizationWall from '../components/dashboard/MonetizationWall';
import DealCapture from '../components/dashboard/DealCapture';
import PremiumCreditsModal from '../components/dashboard/PremiumCreditsModal';
import WalletTopupModal from '../components/dashboard/WalletTopupModal';
import AnnualOfferBanner from '../components/dashboard/AnnualOfferBanner';
import APProUpsellBanner from '../components/dashboard/APProUpsellBanner';
import ApLiteUpgradeBanner, { readApLiteDismissed, writeApLiteDismissed } from '../components/dashboard/ApLiteUpgradeBanner';
import PauseStatusBanner from '../components/dashboard/PauseStatusBanner';
import PauseModal from '../components/dashboard/PauseModal';
import BundleOfferModal from '../components/dashboard/BundleOfferModal';
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
import { useState } from 'react';

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
  const [searchParams, setSearchParams] = useSearchParams();
  const { filters, setFilter, setPage, searchInput, setSearchInput } = useFeedFilters();
  const { isContacted, toggleContacted } = useContacted();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [lpZip, setLpZip] = useState('');
  const [lpOpen, setLpOpen] = useState(false);
  const [dealCaptureOpen, setDealCaptureOpen] = useState(false);
  const [premiumLead, setPremiumLead] = useState(null);   // lead obj for premium modal
  const [annualBannerDismissed, setAnnualBannerDismissed] = useState(false);
  const [apProDismissed, setApProDismissed] = useState(false);
  const [apLiteDismissed, setApLiteDismissed] = useState(() => feedUuid ? readApLiteDismissed(feedUuid) : false);
  const [bundleDismissed, setBundleDismissed] = useState(false);
  const [pauseModalOpen, setPauseModalOpen] = useState(false);

  // Stage 5 — URL-driven offer surfaces
  const urlAnnualOffer = searchParams.get('annual') === 'accept';

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

  const handleTopupSuccess = useCallback(() => {
    closeTopup();
    setTimeout(refetch, 2000);
  }, [closeTopup, refetch]);

  const stripePayment = useStripePayment();

  const subscriber = data?.subscriber || {};
  const leads = data?.leads || [];
  const totalPages = data?.pages || 1;

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

  const handleUnlockHotLead = useCallback(async (propertyId) => {
    try {
      const { checkout_url } = await unlockHotLead(feedUuid, propertyId);
      window.open(checkout_url, '_blank');
    } catch (err) {
      alert(err.detail || 'Unable to create checkout. Please try again.');
    }
  }, [feedUuid]);

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
    }
  }, [stripePayment, feedUuid]);

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

  return (
    <div className="gradient-bg-dashboard min-h-screen text-white">
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

              {/* Stage 5: Annual offer banner — surfaces from email deep link or backend flag */}
              {showAnnualOffer && (
                <AnnualOfferBanner
                  feedUuid={feedUuid}
                  onAccepted={dismissAnnual}
                  onDismiss={dismissAnnual}
                />
              )}

              {/* Stage 5: AP Pro upgrade — surfaces from email deep link */}
              {showApProOffer && (
                <APProUpsellBanner
                  feedUuid={feedUuid}
                  onUpgraded={dismissApPro}
                  onDismiss={dismissApPro}
                />
              )}

              {/* Phase 2B: AP Lite upgrade — annual_lock subscribers who are eligible */}
              {subscriber.tier === 'annual_lock' &&
               subscriber.ap_lite_eligible === true &&
               !apLiteDismissed && (
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

              <StatsBar
                subscriber={subscriber}
                onTopup={() => {
                  const next = new URLSearchParams(searchParams);
                  next.set('wallet', 'topup');
                  setSearchParams(next);
                }}
              />

              {/* Phase 2B: Monetization Wall — first-48h countdown + ROI frame. */}
              {subscriber.id && isWithinFirst48h(subscriber.created_at) && (
                <MonetizationWall
                  subscriberId={subscriber.id}
                  vertical={subscriber.vertical}
                  countyId={subscriber.county_id || 'hillsborough'}
                  onUnlock={(zip) => handleOpenLpModal(zip)}
                />
              )}

              <OnboardingChecklist totalLeads={data?.total} />
              <DashboardHeroBanner
                total={data?.total}
                zips={subscriber.locked_zips}
                partnerEligible={subscriber.partner_eligible}
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

              {leads.length === 0 ? (
                <EmptyState />
              ) : (
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
                        urgencyViewers={zipActivity[lead.zip]?.active_viewers}
                      />
                    ))}
                  </div>

                  <UpgradeBanner
                    tier={subscriber.tier}
                    currentPage={filters.page}
                    onUpgrade={handleUpgrade}
                  />

                  <Pagination
                    currentPage={filters.page}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </>
              )}

              <LeadPackHistory feedUuid={feedUuid} />
              <LeadPackSection onOpenModal={handleOpenLpModal} />
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
          zipCode={subscriber?.locked_zips?.[0]}
          vertical={subscriber?.vertical}
          countyId={subscriber?.county_id || 'hillsborough'}
          onClose={dismissBundle}
          onSuccess={dismissBundle}
        />

        {/* Stage 5+ — Wallet topup modal (opens via ?wallet=topup deep link) */}
        <WalletTopupModal
          isOpen={topupOpen}
          feedUuid={feedUuid}
          onClose={closeTopup}
          onSuccess={handleTopupSuccess}
        />

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
    </div>
  );
}

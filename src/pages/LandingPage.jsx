import { useState, useCallback, useRef, useEffect, lazy, Suspense } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { LandingProvider, useLanding } from '../components/landing/LandingContext';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import HeroBanner from '../components/landing/HeroBanner';
import TrustBar from '../components/landing/TrustBar';
import VerticalSelector from '../components/landing/VerticalSelector';
import HowItWorks from '../components/landing/HowItWorks';
import FirstSessionWall from '../components/landing/FirstSessionWall';
import ZipChecker from '../components/landing/ZipChecker';
import PricingSection from '../components/landing/PricingSection';
import FeaturedTestimonial from '../components/landing/FeaturedTestimonial';
import ZipScarcityCounter from '../components/landing/ZipScarcityCounter';
import FAQ from '../components/landing/FAQ';
import SocialProofWall from '../components/landing/SocialProofWall';
import StickyHeaderCTA from '../components/landing/StickyHeaderCTA';
import EmailGateModal from '../components/landing/EmailGateModal';
import ZipCollectorModal from '../components/landing/ZipCollectorModal';
import StripeCheckoutModal from '../components/landing/StripeCheckoutModal';
import WaitlistForm from '../components/landing/WaitlistForm';
import DealOfTheDay from '../components/landing/DealOfTheDay';
import RoiCalculator from '../components/landing/RoiCalculator';
import useStripeCheckout from '../hooks/useStripeCheckout';
import { createFreeSignup, logBusinessEvent } from '../api/phase2b';
import { getAttribution } from '../utils/attribution';
import { trackEvent } from '../utils/ga4';

// Lazy-loaded: leaflet (~120 KB) and react-markdown (~75 KB) are excluded from
// the main chunk and only fetched when these components actually render.
const ZipTerritoryMap = lazy(() => import('../components/landing/ZipTerritoryMap'));
const ConciergeChat   = lazy(() => import('../components/concierge/ConciergeChat'));

function LandingContent() {
  const { selectedVertical, countyId, landingData, attribution } = useLanding();
  const ctaMode = landingData?.cta_mode ?? 'signup'; // default signup for backward compat
  // emailGate.flow: 'paid' (goes to ZIP collector → Stripe) or 'free' (goes to /api/free-signup → dashboard)
  const [emailGate, setEmailGate] = useState({ open: false, tier: null, flow: 'paid' });
  const [userEmail, setUserEmail] = useState('');
  const [userConsent, setUserConsent] = useState(null);
  const [zipCollector, setZipCollector] = useState({ open: false, tier: null });
  const [lastCheckedZip, setLastCheckedZip] = useState('');
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [freeSigningUp, setFreeSigningUp] = useState(false);
  const [freeSignupSuccessEmail, setFreeSignupSuccessEmail] = useState(null);
  const { isOpen, loading, checkoutError, openCheckout, closeCheckout, embeddedRef } = useStripeCheckout();
  const pricingRef = useRef(null);

  // Hash deep-link (e.g. /#pricing, used by the /pricing redirect): scroll to
  // the pricing section once it's mounted. Runs on hash change.
  const { hash } = useLocation();
  useEffect(() => {
    if (hash !== '#pricing') return;
    // rAF so the target exists after the first paint
    const id = requestAnimationFrame(() => {
      pricingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => cancelAnimationFrame(id);
  }, [hash]);

  // Deep-link entry point (?start_tier=starter[&interval=monthly]) — drops a
  // visitor straight into the email gate → ZIP collector flow for that tier,
  // skipping manual plan selection. Used for E2E test links / cold outreach.
  const [searchParams, setSearchParams] = useSearchParams();

  // Step 1: User clicks a paid plan → open email gate first
  const handleCheckout = useCallback((tier, interval = 'monthly') => {
    trackEvent('plan_selected', { tier, interval });
    trackEvent('signup_started', { tier });
    setEmailGate({ open: true, tier, interval, flow: 'paid' });
    setSearchParams(interval !== 'monthly' ? { start_tier: tier, interval } : { start_tier: tier });
  }, [setSearchParams]);
  const [autoStartHandled, setAutoStartHandled] = useState(false);
  useEffect(() => {
    if (autoStartHandled) return;
    const startTier = searchParams.get('start_tier');
    if (startTier && ['starter', 'pro', 'dominator', 'founder'].includes(startTier)) {
      setAutoStartHandled(true);
      handleCheckout(startTier, searchParams.get('interval') || 'monthly');
    }
  }, [autoStartHandled, searchParams, handleCheckout]);

  // Free-tier entry: Start Free button → open email gate in 'free' flow
  const handleStartFree = useCallback(() => {
    logBusinessEvent('SIGNUP_STARTED', { payload: { source: 'free_cta' } });
    trackEvent('signup_started', {});
    setEmailGate({ open: true, tier: null, flow: 'free' });
  }, []);

  // Step 2: Email + consent collected
  //   - paid flow → ZIP collector grid → Stripe
  //   - free flow → /api/free-signup (welcome + magic-link email fires) → "check your email"
  //     screen. The user isn't authenticated yet, so we must NOT navigate to the
  //     dashboard here — that page requires a session and would bounce them to a
  //     password login they were never given. The magic link is what signs them in.
  const handleEmailProceed = useCallback(async (email, consent, phone) => {
    setUserEmail(email);
    setUserConsent(consent);
    trackEvent('signup_submitted', { vertical: selectedVertical, tier: emailGate.tier });

    if (emailGate.flow === 'free') {
      setFreeSigningUp(true);
      try {
        const _attr = getAttribution();
        const resp = await createFreeSignup({
          email,
          vertical: selectedVertical,
          countyId,
          phone: phone || null,
          consentAcceptance: consent || null,
          signupSource: attribution?.signupSource || 'landing_page',
          utmSource: attribution?.utmSource || null,
          utmMedium: attribution?.utmMedium || null,
          utmCampaign: attribution?.utmCampaign || null,
          utmContent: _attr.utm_content || null,
          utmTerm: _attr.utm_term || null,
          landingPath: _attr.landing_path || null,
          referrer: _attr.referrer || null,
          campaignId: attribution?.campaignId || null,
          referralCode: attribution?.referralCode || null,
          referralSource: attribution?.referralSource || null,
          attributionToken: attribution?.attributionToken || null,
          affiliateRef: attribution?.affiliateRef || null,
        });
        setFreeSigningUp(false);
        if (resp?.feed_uuid) {
          setFreeSignupSuccessEmail(email);
        } else {
          alert('Signup succeeded but feed link missing. Check your email.');
          setEmailGate({ open: false, tier: null, flow: 'paid' });
        }
      } catch (err) {
        setFreeSigningUp(false);
        alert(err?.detail?.message || err?.message || 'Free signup failed. Try again.');
      }
      return;
    }

    setEmailGate({ open: false, tier: null, flow: 'paid' });
    setZipCollector({ open: true, tier: emailGate.tier, interval: emailGate.interval });
  }, [emailGate.flow, emailGate.tier, emailGate.interval, selectedVertical, countyId, attribution]);

  // Step 3: ZIPs collected → launch Stripe checkout. fa017: pass attribution
  // so the pre-checkout free-signup persists signup_source/utm_* on the row.
  const handleZipCollectorProceed = useCallback((zips) => {
    trackEvent('zips_selected', { tier: zipCollector.tier, zip_count: zips.length, zips: zips.join(',') });
    setZipCollector({ open: false, tier: null });
    openCheckout({
      tier: zipCollector.tier,
      vertical: selectedVertical,
      countyId,
      zipCodes: zips,
      email: userEmail,
      interval: zipCollector.interval || 'monthly',
      consent: userConsent,
      attribution,
    });
  }, [zipCollector.tier, zipCollector.interval, selectedVertical, countyId, openCheckout, userEmail, userConsent, attribution]);

  return (
    <div className="gradient-bg min-h-screen text-white" style={{ scrollBehavior: 'smooth' }}>
      <div className="relative z-[1]">
        <Navbar variant="landing" />
        <StickyHeaderCTA targetRef={pricingRef} />

        <div id="main-content">
          {/* ctaMode=null → unavailable county: show only coming-soon message */}
          {ctaMode === null && (
            <div className="max-w-2xl mx-auto px-6 pt-32 pb-16 text-center">
              <h2 className="text-3xl font-bold text-white mb-4">Coming Soon to Your Area</h2>
              <p className="text-slate-400 mb-8">
                We&apos;re not in {landingData?.county_name || 'this county'} yet.
                Join the waitlist and we&apos;ll notify you when we launch.
              </p>
              <button
                type="button"
                onClick={() => setWaitlistOpen(true)}
                className="bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-bold px-8 py-3 rounded-xl transition"
              >
                Join Waitlist
              </button>
            </div>
          )}

          {ctaMode !== null && (
            <>
              <HeroBanner onStartFree={ctaMode === 'signup' ? handleStartFree : null} />
              <div className="max-w-6xl mx-auto px-6 text-center">
                <TrustBar />
                <VerticalSelector />
              </div>
              <HowItWorks />

              {ctaMode === 'signup' && (
                <FirstSessionWall
                  onRequestUnlock={() => setEmailGate({ open: true, tier: 'starter' })}
                />
              )}

              <div id="zip-check">
                <ZipChecker onZipChecked={setLastCheckedZip} />
              </div>

              <div className="max-w-6xl mx-auto px-6">
                <ZipScarcityCounter territoryAvailability={landingData?.territory_availability} />
                <Suspense fallback={<div className="h-64 bg-fa-bg-card rounded-xl animate-pulse" />}>
                  <ZipTerritoryMap
                    highlightZip={lastCheckedZip}
                    onZipSelect={(zipObj) => {
                      setLastCheckedZip(zipObj.zip);
                      if (ctaMode === 'signup') setEmailGate({ open: true, tier: 'starter' });
                      else setWaitlistOpen(true);
                    }}
                  />
                </Suspense>
              </div>

              {/* Coming Soon / Waitlist button — show prominently for waitlist mode,
                  subtly as secondary option for signup mode */}
              {ctaMode === 'waitlist' ? (
                <div className="max-w-6xl mx-auto px-6 py-8 text-center">
                  <p className="text-slate-300 text-base mb-4">
                    {landingData?.county_name || 'This county'} is coming soon.
                    Join the waitlist to be first in the door.
                  </p>
                  <button
                    type="button"
                    onClick={() => setWaitlistOpen(true)}
                    className="bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-bold px-8 py-3 rounded-xl transition"
                  >
                    Join Waitlist
                  </button>
                </div>
              ) : (
                <div className="max-w-6xl mx-auto px-6 py-6 text-center">
                  <p className="text-slate-400 text-sm mb-3">Not in a live county yet?</p>
                  <button
                    type="button"
                    onClick={() => setWaitlistOpen(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-yellow-400/30 text-yellow-400 text-sm font-semibold hover:bg-yellow-400/10 transition-colors"
                  >
                    <span>🔔</span> Coming Soon — Join the Waitlist
                  </button>
                </div>
              )}

              {ctaMode === 'signup' && (
                <DealOfTheDay
                  onUnlock={() => setEmailGate({ open: true, tier: 'starter' })}
                />
              )}

              {ctaMode === 'signup' && (
                <div className="max-w-6xl mx-auto px-6 py-8">
                  <RoiCalculator vertical={selectedVertical} onStartFree={handleStartFree} />
                </div>
              )}

              {ctaMode === 'signup' && (
                <div id="pricing" ref={pricingRef}>
                  <PricingSection onCheckout={handleCheckout} onStartFree={handleStartFree} />
                  <FeaturedTestimonial testimonials={landingData?.featured_testimonials} />
                </div>
              )}
            </>
          )}

          {/* Stage 5: anonymized social proof wall — recent contractor wins */}
          <SocialProofWall />

          <FAQ />
        </div>

        <Footer />

        <EmailGateModal
          isOpen={emailGate.open}
          onClose={() => {
            setEmailGate({ open: false, tier: null, flow: 'paid' });
            setFreeSignupSuccessEmail(null);
            setSearchParams({});
          }}
          onProceed={handleEmailProceed}
          submitting={freeSigningUp && emailGate.flow === 'free'}
          submitLabel={emailGate.flow === 'free' ? 'Start Free' : 'Continue'}
          sourceFlow={emailGate.flow === 'free' ? 'free_signup' : 'checkout'}
          title={emailGate.flow === 'free' ? 'Get your free dashboard access' : 'Enter your email to continue'}
          description={emailGate.flow === 'free'
            ? "We'll set up your free dashboard with blurred leads in your county. Unlock the ones you want for $4 each."
            : "We'll use this to set up your account and send your lead feed access."}
          successEmail={freeSignupSuccessEmail}
        />

        <ZipCollectorModal
          isOpen={zipCollector.open}
          onClose={() => setZipCollector({ open: false, tier: null })}
          tier={zipCollector.tier || 'pro'}
          initialZip={lastCheckedZip}
          onProceed={handleZipCollectorProceed}
        />

        <StripeCheckoutModal
          isOpen={isOpen}
          onClose={closeCheckout}
          loading={loading}
          error={checkoutError}
          embeddedRef={embeddedRef}
        />

        {/* Waitlist modal */}
        {waitlistOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
            onClick={(e) => { if (e.target === e.currentTarget) setWaitlistOpen(false); }}
          >
            <div className="relative w-full max-w-xl">
              <button
                type="button"
                onClick={() => setWaitlistOpen(false)}
                className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-300 flex items-center justify-center text-sm transition-colors"
                aria-label="Close"
              >
                ✕
              </button>
              <WaitlistForm
                zip={lastCheckedZip || ''}
                countyId={countyId}
                waitlistType="coming_soon"
                vertical={selectedVertical}
                onSuccess={() => setWaitlistOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Concierge Chat — PDF/Markdown-grounded info widget (lazy: defers react-markdown) */}
        <Suspense fallback={null}>
          <ConciergeChat mode="pre_signup" />
        </Suspense>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <LandingProvider>
      <LandingContent />
    </LandingProvider>
  );
}

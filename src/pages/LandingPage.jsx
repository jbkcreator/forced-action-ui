import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
import FAQ from '../components/landing/FAQ';
import SocialProofWall from '../components/landing/SocialProofWall';
import StickyHeaderCTA from '../components/landing/StickyHeaderCTA';
import EmailGateModal from '../components/landing/EmailGateModal';
import ZipCollectorModal from '../components/landing/ZipCollectorModal';
import ZipTerritoryMap from '../components/landing/ZipTerritoryMap';
import StripeCheckoutModal from '../components/landing/StripeCheckoutModal';
import useStripeCheckout from '../hooks/useStripeCheckout';
import { createFreeSignup, logBusinessEvent } from '../api/phase2b';
import ConciergeChat from '../components/concierge/ConciergeChat';

function LandingContent() {
  const navigate = useNavigate();
  const { selectedVertical, countyId, attribution } = useLanding();
  // emailGate.flow: 'paid' (goes to ZIP collector → Stripe) or 'free' (goes to /api/free-signup → dashboard)
  const [emailGate, setEmailGate] = useState({ open: false, tier: null, flow: 'paid' });
  const [userEmail, setUserEmail] = useState('');
  const [zipCollector, setZipCollector] = useState({ open: false, tier: null });
  const [lastCheckedZip, setLastCheckedZip] = useState('');
  const [freeSigningUp, setFreeSigningUp] = useState(false);
  const { isOpen, loading, checkoutError, openCheckout, closeCheckout, embeddedRef } = useStripeCheckout();
  const pricingRef = useRef(null);

  // Step 1: User clicks a paid plan → open email gate first
  const handleCheckout = useCallback((tier) => {
    setEmailGate({ open: true, tier, flow: 'paid' });
  }, []);

  // Free-tier entry: Start Free button → open email gate in 'free' flow
  const handleStartFree = useCallback(() => {
    logBusinessEvent('SIGNUP_STARTED', { payload: { source: 'free_cta' } });
    setEmailGate({ open: true, tier: null, flow: 'free' });
  }, []);

  // Step 2: Email collected
  //   - paid flow → ZIP collector grid → Stripe
  //   - free flow → /api/free-signup (no intent, welcome email fires) → /dashboard/{uuid}
  const handleEmailProceed = useCallback(async (email) => {
    setUserEmail(email);

    if (emailGate.flow === 'free') {
      setFreeSigningUp(true);
      try {
        const resp = await createFreeSignup({
          email,
          vertical: selectedVertical,
          countyId,
          signupSource: attribution?.signupSource || 'landing_page',
          utmSource: attribution?.utmSource || null,
          utmMedium: attribution?.utmMedium || null,
          utmCampaign: attribution?.utmCampaign || null,
          campaignId: attribution?.campaignId || null,
          referralCode: attribution?.referralCode || null,
          attributionToken: attribution?.attributionToken || null,
          // intent omitted → welcome email fires from /api/free-signup
        });
        setEmailGate({ open: false, tier: null, flow: 'paid' });
        if (resp?.feed_uuid) {
          navigate(`/dashboard/${resp.feed_uuid}`);
        } else {
          alert('Signup succeeded but feed link missing. Check your email.');
        }
      } catch (err) {
        setFreeSigningUp(false);
        alert(err?.detail?.message || err?.message || 'Free signup failed. Try again.');
      }
      return;
    }

    setEmailGate({ open: false, tier: null, flow: 'paid' });
    setZipCollector({ open: true, tier: emailGate.tier });
  }, [emailGate.flow, emailGate.tier, selectedVertical, countyId, attribution, navigate]);

  // Step 3: ZIPs collected → launch Stripe checkout. fa017: pass attribution
  // so the pre-checkout free-signup persists signup_source/utm_* on the row.
  const handleZipCollectorProceed = useCallback((zips) => {
    setZipCollector({ open: false, tier: null });
    openCheckout({
      tier: zipCollector.tier,
      vertical: selectedVertical,
      countyId,
      zipCodes: zips,
      email: userEmail,
      attribution,
    });
  }, [zipCollector.tier, selectedVertical, countyId, openCheckout, userEmail, attribution]);

  return (
    <div className="gradient-bg min-h-screen text-white" style={{ scrollBehavior: 'smooth' }}>
      <div className="relative z-[1]">
        <Navbar variant="landing" />
        <StickyHeaderCTA targetRef={pricingRef} />

        <div id="main-content">
          <HeroBanner onStartFree={handleStartFree} />
          <div className="max-w-6xl mx-auto px-6 text-center">
            <TrustBar />
            <VerticalSelector />
          </div>
          <HowItWorks />

          {/* First-Session Monetization Wall (Phase 2B, §1):
              proof moment + countdown + ROI framing. Unlock CTAs route to
              EmailGate since there's no free-tier signup endpoint yet — the
              email gate funnels into the existing pricing/checkout flow. */}
          <FirstSessionWall
            onRequestUnlock={() => setEmailGate({ open: true, tier: 'starter' })}
          />

          <div id="zip-check">
            <ZipChecker onZipChecked={setLastCheckedZip} />
          </div>

          <div className="max-w-6xl mx-auto px-6">
            <ZipTerritoryMap
              highlightZip={lastCheckedZip}
              onZipSelect={(zipObj) => {
                setLastCheckedZip(zipObj.zip);
                setEmailGate({ open: true, tier: 'starter' });
              }}
            />
          </div>

          <div id="pricing" ref={pricingRef}>
            <PricingSection onCheckout={handleCheckout} onStartFree={handleStartFree} />
          </div>

          {/* Stage 5: anonymized social proof wall — recent contractor wins */}
          <SocialProofWall />

          <FAQ />
        </div>

        <Footer />

        <EmailGateModal
          isOpen={emailGate.open}
          onClose={() => setEmailGate({ open: false, tier: null, flow: 'paid' })}
          onProceed={handleEmailProceed}
          submitting={freeSigningUp && emailGate.flow === 'free'}
          submitLabel={emailGate.flow === 'free' ? 'Start Free' : 'Continue'}
          title={emailGate.flow === 'free' ? 'Get your free dashboard access' : 'Enter your email to continue'}
          description={emailGate.flow === 'free'
            ? "We'll set up your free dashboard with blurred leads in your county. Unlock the ones you want for $4 each."
            : "We'll use this to set up your account and send your lead feed access."}
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

        {/* Concierge Chat — PDF/Markdown-grounded info widget */}
        <ConciergeChat />
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

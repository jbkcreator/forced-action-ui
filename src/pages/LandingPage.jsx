import { useState, useCallback, useRef } from 'react';
import { LandingProvider, useLanding } from '../components/landing/LandingContext';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import HeroBanner from '../components/landing/HeroBanner';
import TrustBar from '../components/landing/TrustBar';
import VerticalSelector from '../components/landing/VerticalSelector';
import HowItWorks from '../components/landing/HowItWorks';
import ZipChecker from '../components/landing/ZipChecker';
import PricingSection from '../components/landing/PricingSection';
import FAQ from '../components/landing/FAQ';
import StickyHeaderCTA from '../components/landing/StickyHeaderCTA';
import EmailGateModal from '../components/landing/EmailGateModal';
import ZipCollectorModal from '../components/landing/ZipCollectorModal';
import StripeCheckoutModal from '../components/landing/StripeCheckoutModal';
import useStripeCheckout from '../hooks/useStripeCheckout';
import { TIER_ZIP_LIMITS } from '../config/pricing';

function LandingContent() {
  const { selectedVertical, countyId } = useLanding();
  const [emailGate, setEmailGate] = useState({ open: false, tier: null });
  const [userEmail, setUserEmail] = useState('');
  const [zipCollector, setZipCollector] = useState({ open: false, tier: null });
  const [lastCheckedZip, setLastCheckedZip] = useState('');
  const { isOpen, loading, checkoutError, openCheckout, closeCheckout, embeddedRef } = useStripeCheckout();
  const pricingRef = useRef(null);

  // Step 1: User clicks a plan → open email gate first
  const handleCheckout = useCallback((tier) => {
    setEmailGate({ open: true, tier });
  }, []);

  // Step 2: Email collected → always open ZIP collector grid (all tiers)
  const handleEmailProceed = useCallback((email) => {
    setUserEmail(email);
    setEmailGate({ open: false, tier: null });
    setZipCollector({ open: true, tier: emailGate.tier });
  }, [emailGate.tier]);

  // Step 3: ZIPs collected → launch Stripe checkout with email
  const handleZipCollectorProceed = useCallback((zips) => {
    setZipCollector({ open: false, tier: null });
    openCheckout({ tier: zipCollector.tier, vertical: selectedVertical, countyId, zipCodes: zips, email: userEmail });
  }, [zipCollector.tier, selectedVertical, countyId, openCheckout, userEmail]);

  return (
    <div className="gradient-bg min-h-screen text-white" style={{ scrollBehavior: 'smooth' }}>
      <div className="relative z-[1]">
        <Navbar variant="landing" />
        <StickyHeaderCTA targetRef={pricingRef} />

        <div id="main-content">
          <HeroBanner />
          <div className="max-w-6xl mx-auto px-6 text-center">
            <TrustBar />
            <VerticalSelector />
          </div>
          <HowItWorks />
          <div id="zip-check">
            <ZipChecker onZipChecked={setLastCheckedZip} />
          </div>
          <div id="pricing" ref={pricingRef}>
            <PricingSection onCheckout={handleCheckout} />
          </div>
          <FAQ />
        </div>

        <Footer />

        <EmailGateModal
          isOpen={emailGate.open}
          onClose={() => setEmailGate({ open: false, tier: null })}
          onProceed={handleEmailProceed}
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

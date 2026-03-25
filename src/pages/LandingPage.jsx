import { useState, useCallback, useRef } from 'react';
import { LandingProvider, useLanding } from '../components/landing/LandingContext';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import HeroBanner from '../components/landing/HeroBanner';
import TrustBar from '../components/landing/TrustBar';
import VerticalSelector from '../components/landing/VerticalSelector';
import FoundingCounter from '../components/landing/FoundingCounter';
import HowItWorks from '../components/landing/HowItWorks';
import ZipChecker from '../components/landing/ZipChecker';
import PricingSection from '../components/landing/PricingSection';
import FAQ from '../components/landing/FAQ';
import StickyHeaderCTA from '../components/landing/StickyHeaderCTA';
import ZipCollectorModal from '../components/landing/ZipCollectorModal';
import StripeCheckoutModal from '../components/landing/StripeCheckoutModal';
import useStripeCheckout from '../hooks/useStripeCheckout';
import { TIER_ZIP_LIMITS } from '../config/pricing';

function LandingContent() {
  const { selectedVertical, countyId } = useLanding();
  const [zipCollector, setZipCollector] = useState({ open: false, tier: null });
  const [lastCheckedZip, setLastCheckedZip] = useState('');
  const { isOpen, loading, checkoutError, openCheckout, closeCheckout, embeddedRef } = useStripeCheckout();
  const pricingRef = useRef(null);

  const handleCheckout = useCallback((tier) => {
    const limit = TIER_ZIP_LIMITS[tier];

    if (limit === 1) {
      if (!lastCheckedZip) {
        alert('Please check a ZIP code above before subscribing.');
        return;
      }
      openCheckout({ tier, vertical: selectedVertical, countyId, zipCodes: [lastCheckedZip] });
      return;
    }

    setZipCollector({ open: true, tier });
  }, [lastCheckedZip, selectedVertical, countyId, openCheckout]);

  const handleZipCollectorProceed = useCallback((zips) => {
    setZipCollector({ open: false, tier: null });
    openCheckout({ tier: zipCollector.tier, vertical: selectedVertical, countyId, zipCodes: zips });
  }, [zipCollector.tier, selectedVertical, countyId, openCheckout]);

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
            <FoundingCounter />
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

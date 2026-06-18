import { useState, useCallback } from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import SocialProofWall from '../components/landing/SocialProofWall';
import WinStoryTicker from '../components/landing/WinStoryTicker';
import { LandingProvider, useLanding } from '../components/landing/LandingContext';

const PAGE_SIZE = 60;
const MAX_LIMIT = 200;

// Inner component so useLanding() runs inside <LandingProvider>.
function ProofWallContent() {
  const { countyId } = useLanding();
  const [limit, setLimit] = useState(PAGE_SIZE);

  const loadMore = useCallback(() => {
    setLimit((prev) => Math.min(prev + PAGE_SIZE, MAX_LIMIT));
  }, []);

  const atMax = limit >= MAX_LIMIT;

  return (
    <div className="gradient-bg min-h-screen text-white">
      <div className="relative z-[1]">
        <Navbar variant="landing" />
        <main id="main-content">
          <header className="max-w-6xl mx-auto px-6 pt-16 pb-4 text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              Wins from the field
            </h1>
            <p className="text-slate-400 text-sm md:text-base mt-4 max-w-2xl mx-auto">
              Anonymized deal wins reported by contractors using Forced Action.
              Bucket size, trade, and county only — no names, no addresses.
            </p>
          </header>

          {/* S5: live lead-pack proof feed — county-filtered, distinct from the
              DealOutcome wall below. Renders null when empty. */}
          <WinStoryTicker countyId={countyId} />

          <SocialProofWall
            limit={limit}
            heading=""
            subheading=""
            hideWhenEmpty={false}
          />

          {!atMax && (
            <div className="text-center pb-16">
              <button
                type="button"
                onClick={loadMore}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold text-slate-900"
                style={{ background: 'linear-gradient(135deg, #facc15, #f59e0b)' }}
              >
                Load more wins
              </button>
            </div>
          )}
          {atMax && (
            <p className="text-center text-xs text-slate-600 pb-16">
              Showing the latest {MAX_LIMIT} wins.
            </p>
          )}
        </main>
        <Footer />
      </div>
    </div>
  );
}

// Navbar (variant="landing") and SocialProofWall both consume LandingContext
// via useLanding(); without this provider the page throws on render.
export default function ProofWallPage() {
  return (
    <LandingProvider>
      <ProofWallContent />
    </LandingProvider>
  );
}

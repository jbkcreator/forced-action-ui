import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import PartnerZipPicker from '../components/dashboard/PartnerZipPicker';
import PartnerSummaryCard from '../components/dashboard/PartnerSummaryCard';
import { fetchPartnerEligibility, submitPartnerCheckout } from '../api/partner';
import Navbar from '../components/layout/Navbar';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorState from '../components/ui/ErrorState';

const MAX_ZIPS = 5;

export default function PartnerUpgradePage() {
  const { feedUuid } = useParams();
  const [elig, setElig] = useState(null);
  const [selected, setSelected] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    fetchPartnerEligibility(feedUuid)
      .then(setElig)
      .catch((e) => setLoadError(e?.message || 'Failed to load eligibility.'));
  }, [feedUuid]);

  if (!elig && !loadError) {
    return (
      <div className="gradient-bg-dashboard min-h-screen text-white flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="gradient-bg-dashboard min-h-screen text-white">
        <ErrorState message={loadError} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  if (!elig.eligible) {
    return (
      <div className="gradient-bg-dashboard min-h-screen text-white">
        <Navbar variant="dashboard" />
        <main className="max-w-4xl mx-auto px-6 py-16 text-center">
          <p className="text-slate-400 text-lg">
            Not eligible for Partner tier. Current tier: <strong className="text-white">{elig.current_tier}</strong>.
          </p>
          {elig.reason && <p className="text-slate-500 text-sm mt-2">{elig.reason}</p>}
        </main>
      </div>
    );
  }

  const toggleZip = (zip) => {
    setSelected((prev) => {
      if (prev.includes(zip)) return prev.filter((z) => z !== zip);
      if (prev.length >= MAX_ZIPS) return prev;
      return [...prev, zip];
    });
  };

  const onCheckout = async () => {
    if (!selected.length) return;
    setSubmitting(true);
    setError(null);
    try {
      const { checkout_url } = await submitPartnerCheckout({
        feedUuid,
        zipCodes: selected,
        vertical: elig.vertical,
      });
      window.location.href = checkout_url;
    } catch (e) {
      const detail = e?.detail;
      if (detail?.error === 'zips_already_locked') {
        setError(`These ZIPs are no longer available: ${detail.zips?.join(', ') || ''}`);
      } else {
        setError(detail?.message || e?.message || 'Checkout failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="gradient-bg-dashboard min-h-screen text-white">
      <div className="relative z-[1]">
        <Navbar variant="dashboard" />
        <main id="main-content" className="max-w-5xl mx-auto px-4 md:px-6 py-10">
          <header className="mb-6">
            <h1 className="text-3xl font-bold text-white">Partner Tier</h1>
            <p className="text-slate-400 mt-1">$2,000/mo — own up to {MAX_ZIPS} ZIPs in your county</p>
          </header>

          <PartnerZipPicker
            countyId={elig.county_id}
            vertical={elig.vertical}
            selected={selected}
            onToggle={toggleZip}
            max={MAX_ZIPS}
          />

          <PartnerSummaryCard
            selected={selected}
            priceMonthly={2000}
            onCheckout={onCheckout}
            submitting={submitting}
          />

          {error && (
            <p className="text-red-400 text-sm mt-3" role="alert">{error}</p>
          )}
        </main>
      </div>
    </div>
  );
}

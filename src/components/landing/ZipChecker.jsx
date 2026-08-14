import { useState, useEffect } from 'react';
import { useLanding } from './LandingContext';
import { VERTICAL_LABELS } from '../../config/constants';
import { checkZip as apiCheckZip } from '../../api/landing';
import { trackEvent } from '../../utils/ga4';
import { fetchZipScarcity } from '../../api/scarcity';
import SampleLeads from './SampleLeads';
import WaitlistForm from './WaitlistForm';

const TIER_LABELS = { starter: 'Starter', pro: 'Pro', dominator: 'Dominator', annual_lock: 'Annual' };

function PricingStrip({ pricing }) {
  if (!pricing) return null;
  const entries = Object.entries(pricing).filter(([, p]) => p.founding_amount != null || p.regular_amount != null);
  if (!entries.length) return null;

  return (
    <p className="mt-2 text-xs text-slate-400">
      {entries.map(([tier, p], i) => {
        const amount = p.founding_amount ?? p.regular_amount;
        return (
          <span key={tier}>
            {i > 0 && ' · '}
            {TIER_LABELS[tier] || tier} ${amount != null ? amount.toLocaleString() : '—'}/mo
          </span>
        );
      })}
    </p>
  );
}

export default function ZipChecker({ onZipChecked, countyId: externalCountyId, onZipTaken }) {
  const { selectedVertical, countyId: contextCountyId, landingData } = useLanding();
  const countyId = externalCountyId || contextCountyId;
  const countyName = landingData?.county_name || 'our service area';
  const [zip, setZip] = useState('');
  const [result, setResult] = useState(null);
  const [checkedZip, setCheckedZip] = useState('');
  const [scarcityStatus, setScarcityStatus] = useState(null);

  // Live scarcity badge — fires whenever a ZIP check resolves successfully
  useEffect(() => {
    if (!checkedZip || !selectedVertical) { setScarcityStatus(null); return; }
    const controller = new AbortController();
    fetchZipScarcity(checkedZip, selectedVertical, { signal: controller.signal })
      .then((data) => { if (!controller.signal.aborted) setScarcityStatus(data.status); })
      .catch(() => {});
    return () => controller.abort();
  }, [checkedZip, selectedVertical]);

  async function handleCheck() {
    const trimmed = zip.trim();
    if (!/^\d{5}$/.test(trimmed)) {
      setResult({ status: 'invalid_input', message: 'Please enter a valid 5-digit ZIP code.' });
      return;
    }

    setResult({ status: 'loading', message: 'Checking...' });

    try {
      const data = await apiCheckZip(trimmed, selectedVertical, countyId);
      const label = VERTICAL_LABELS[selectedVertical];
      setCheckedZip(trimmed);
      if (onZipChecked) onZipChecked(trimmed);

      const inServiceArea = data.status !== 'invalid';
      trackEvent('zip_checked', { zip: trimmed, results_returned: inServiceArea });
      if (inServiceArea) {
        trackEvent('territory_checked', { zip: trimmed, available: data.status === 'available' });
      }

      if (data.status === 'invalid') {
        setResult({ status: 'invalid', message: `× ZIP ${trimmed} is not in our ${countyName} service area.` });
      } else if (data.status === 'available') {
        setResult({ status: 'available', message: `✓ ZIP ${trimmed} is available for ${label} — lock it in when you subscribe.`, pricing: data.pricing });
      } else if (data.status === 'grace') {
        setResult({ status: 'grace', message: `ZIP ${trimmed} is opening soon for ${label} — subscribe now to claim it.`, pricing: data.pricing });
      } else if (data.status === 'taken') {
        setResult({
          status: 'taken',
          message: `× ZIP ${trimmed} is taken for ${label} by another subscriber.`,
          zip: trimmed,
          adjacentZipSuggestion: data.adjacent_zip_suggestion || null,
        });
        if (onZipTaken) onZipTaken(trimmed);
      } else {
        setResult({ status: 'error', message: 'Unknown status' });
      }
    } catch {
      setResult({ status: 'error', message: 'Error checking ZIP. Please try again.' });
    }
  }

  const statusClass = result?.status === 'available' ? 'zip-available'
    : result?.status === 'grace' ? 'zip-grace'
      : result?.status === 'taken' ? 'zip-taken'
        : 'border-white/20 bg-white/5';

  return (
    <>
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-400/70 mb-3 block">Territory Check</span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">Check Your ZIP Territory</h2>
            <p className="text-slate-400 text-base">
              See if your target ZIP is still available for{' '}
              <span className="text-yellow-400 font-semibold">{VERTICAL_LABELS[selectedVertical]}</span>
            </p>
          </div>
          <div className="glass-card rounded-2xl p-2 max-w-xl mx-auto">
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={5}
                placeholder="Enter ZIP code..."
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
                className="flex-1 bg-transparent border-0 rounded-xl px-5 py-4 text-white text-lg placeholder-slate-600 focus:outline-none transition"
              />
              <button
                onClick={handleCheck}
                className="btn-primary bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-8 py-4 rounded-xl text-base"
              >
                Check Availability
              </button>
            </div>
          </div>
          {result && (
            <div className={`mt-5 rounded-xl border px-5 py-4 text-sm font-medium max-w-xl mx-auto ${statusClass}`}>
              <span className="flex items-center gap-2 flex-wrap">
                {result.message}
                {scarcityStatus && (
                  <span className={`text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${
                    scarcityStatus === 'available'
                      ? 'text-green-400 border-green-400/30 bg-green-400/10'
                      : 'text-red-400 border-red-400/30 bg-red-400/10'
                  }`}>
                    {scarcityStatus === 'available' ? 'Available' : 'Taken'}
                  </span>
                )}
              </span>
              {result.status === 'taken' && result.adjacentZipSuggestion && (
                <div className="mt-3 rounded-lg border border-yellow-400/20 bg-yellow-400/5 px-4 py-3 text-left text-slate-200">
                  <p className="text-sm font-semibold text-yellow-300">
                    Nearby option available now: ZIP {result.adjacentZipSuggestion.zip_code}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    About {result.adjacentZipSuggestion.distance_miles} miles away. You can still join the waitlist for {checkedZip}, or claim this nearby ZIP now.
                  </p>
                </div>
              )}
              <PricingStrip pricing={result.pricing} />
            </div>
          )}
        </div>
      </section>

      {(result?.status === 'available' || result?.status === 'grace') && (
        <SampleLeads zip={checkedZip} />
      )}

      {result?.status === 'taken' && (
        <>
          <div className="max-w-xl mx-auto px-6 -mt-2 mb-6 text-center">
            <button
              type="button"
              onClick={() => document.getElementById('first-session-wall')?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center gap-2 text-sm font-semibold text-yellow-400 hover:text-yellow-300 underline underline-offset-4"
            >
              Meanwhile - unlock a real lead near {checkedZip} now →
            </button>
          </div>
          <WaitlistForm zip={checkedZip} countyId={countyId} />
        </>
      )}
    </>
  );
}

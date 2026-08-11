/**
 * FounderPrepayPortalPage — B0-04
 *
 * Dedicated, emailed-link portal (distinct from public checkout and from the
 * generic AnnualOfferBanner) where a founding-tier subscriber can prepay
 * annually before their founding rate escalates. Reuses the existing
 * /api/annual/accept mutation — this page only adds founder-scoped
 * eligibility + framing on top of it.
 */
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchFounderPrepayEligibility, acceptAnnual } from '../api/stage5';
import { createPortalSession } from '../api/dashboard';
import Navbar from '../components/layout/Navbar';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Icon from '../components/ui/Icon';

export default function FounderPrepayPortalPage() {
  const { feedUuid } = useParams();
  const [elig, setElig] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [billingBlocked, setBillingBlocked] = useState(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetchFounderPrepayEligibility(feedUuid)
      .then(setElig)
      .catch((e) => setLoadError(e?.detail || e?.message || 'Failed to load this portal.'));
  }, [feedUuid]);

  const handleAccept = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    setBillingBlocked(null);
    try {
      await acceptAnnual({ feedUuid });
      setDone(true);
    } catch (err) {
      if (err?.status === 409 && err?.detail?.error === 'billing_status_blocked') {
        setBillingBlocked(err.detail);
      } else {
        const detail = err?.detail;
        const msg = (typeof detail === 'string' ? detail : detail?.message)
          || err?.message
          || 'Could not switch — try again or email support.';
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleFixBilling = async () => {
    try {
      const { url } = await createPortalSession(feedUuid);
      window.location.href = url;
    } catch {
      setError('Could not open the billing portal. Email info@forcedactionleads.com.');
    }
  };

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
        <Navbar variant="dashboard" />
        <main className="max-w-3xl mx-auto px-4 md:px-6 py-16 text-center">
          <p className="text-slate-300 text-lg">Couldn't load this prepay portal.</p>
          <p className="text-slate-500 text-sm mt-2">{loadError}</p>
          <button
            onClick={() => window.location.reload()}
            type="button"
            className="mt-6 px-5 py-2.5 border border-slate-600 hover:border-slate-400 text-slate-200 rounded-xl text-sm transition-colors"
          >
            Retry
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="gradient-bg-dashboard min-h-screen text-white">
      <div className="relative z-[1]">
        <Navbar variant="dashboard" />
        <main id="main-content" className="max-w-3xl mx-auto px-4 md:px-6 py-16">
          <header className="mb-6">
            <h1 className="text-3xl font-bold text-white">Founder Prepay</h1>
            <p className="text-slate-400 mt-1">Lock your founding rate in for a full year.</p>
          </header>

          {!elig.eligible && (
            <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-6">
              <p className="text-slate-300 text-sm">
                This account isn't eligible to prepay right now — either the founding rate has
                already been used or locked in another way.
              </p>
            </div>
          )}

          {elig.eligible && done && (
            <div className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 p-6 flex items-center gap-3">
              <Icon name="check-circle" size={24} className="text-emerald-400 shrink-0" />
              <div>
                <p className="text-white font-semibold">Annual lock confirmed.</p>
                <p className="text-slate-300 text-sm mt-1">Your founding rate is locked in for 12 months.</p>
              </div>
            </div>
          )}

          {elig.eligible && !done && (
            <div className="rounded-xl border border-yellow-400/40 bg-gradient-to-r from-yellow-400/10 to-amber-500/10 p-6">
              <p className="text-white font-bold text-lg">Prepay annually and lock your founding rate.</p>
              <p className="text-slate-300 text-sm mt-2">
                Switch to annual billing now to guarantee your founding price for the next 12
                months, before it escalates to the regular rate.
              </p>

              {error && <p className="text-red-300 text-sm mt-3" role="alert">{error}</p>}
              {billingBlocked && (
                <p className="text-amber-300 text-sm mt-3" role="alert">
                  Your account is in <strong>{billingBlocked.current_status}</strong> status — update your card first, then retry.
                </p>
              )}

              <div className="mt-4">
                {billingBlocked ? (
                  <button
                    onClick={handleFixBilling}
                    type="button"
                    className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-900 font-bold rounded-xl text-sm transition-all shadow-lg shadow-amber-400/20"
                  >
                    Fix billing →
                  </button>
                ) : (
                  <button
                    onClick={handleAccept}
                    disabled={submitting}
                    type="button"
                    className="px-5 py-2.5 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-900 font-bold rounded-xl text-sm transition-all shadow-lg shadow-yellow-400/20 disabled:opacity-50"
                  >
                    {submitting ? 'Locking in…' : 'Prepay & Lock In'}
                  </button>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

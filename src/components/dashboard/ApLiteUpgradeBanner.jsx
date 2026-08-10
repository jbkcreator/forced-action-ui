import { useState } from 'react';
import { upgradeTier } from '../../api/stage5';
import { createPortalSession } from '../../api/dashboard';
import Icon from '../ui/Icon';

const AP_LITE_DISMISS_TTL_MS = 7 * 24 * 3600 * 1000;

export function readApLiteDismissed(feedUuid) {
  try {
    const raw = localStorage.getItem(`fa.ap_lite_dismissed.${feedUuid}`);
    if (!raw) return false;
    const ts = Number(raw);
    if (Number.isNaN(ts)) return false;
    if (Date.now() - ts > AP_LITE_DISMISS_TTL_MS) {
      localStorage.removeItem(`fa.ap_lite_dismissed.${feedUuid}`);
      return false;
    }
    return true;
  } catch { return false; }
}

export function writeApLiteDismissed(feedUuid) {
  try { localStorage.setItem(`fa.ap_lite_dismissed.${feedUuid}`, String(Date.now())); } catch { /* noop */ }
}

export default function ApLiteUpgradeBanner({ feedUuid, weeklyActions, onUpgraded, onDismiss }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [billingBlocked, setBillingBlocked] = useState(null);
  const [done, setDone] = useState(false);

  const handleUpgrade = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    setBillingBlocked(null);
    try {
      const res = await upgradeTier({ feedUuid, tier: 'autopilot_lite' });
      setDone(true);
      onUpgraded?.(res);
    } catch (err) {
      if (err?.status === 409 && err?.detail?.error === 'billing_status_blocked') {
        setBillingBlocked(err.detail);
      } else {
        setError(err?.detail?.message || err?.message || 'Upgrade failed.');
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
      setError('Could not open billing portal. Email info@forcedactionleads.com.');
    }
  };

  if (done) {
    return (
      <div className="mb-4 rounded-xl border border-emerald-400/40 bg-emerald-400/10 p-4 flex items-center gap-3">
        <Icon name="check-circle" size={20} className="text-emerald-400 shrink-0" />
        <div>
          <p className="text-white font-semibold text-sm">AutoPilot Lite is live.</p>
          <p className="text-slate-300 text-xs mt-0.5">Auto skip, auto text, voicemail, and 3-touch sequences are now active.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4 rounded-xl border border-cyan-400/40 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 p-5 flex items-center justify-between gap-4 flex-wrap">
      <div className="min-w-0">
        <p className="text-white font-bold text-base">
          You're doing {weeklyActions ?? '10'}+ manual actions a week.
        </p>
        <p className="text-slate-300 text-xs mt-1 max-w-md">
          AutoPilot Lite handles auto skip on cold leads, auto text top scoring leads,
          voicemail drops, and 3-touch sequences — stop clicking, start closing.
        </p>
        {error && <p className="text-red-300 text-xs mt-2">{error}</p>}
        {billingBlocked && (
          <p className="text-amber-300 text-xs mt-2" role="alert">
            Account in <strong>{billingBlocked.current_status}</strong> — fix billing first.
          </p>
        )}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {onDismiss && (
          <button onClick={onDismiss} type="button" disabled={submitting} className="text-slate-400 hover:text-white text-sm">
            Not now
          </button>
        )}
        {billingBlocked ? (
          <button
            onClick={handleFixBilling}
            type="button"
            className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-900 font-bold rounded-xl text-sm transition-all"
          >
            Fix billing →
          </button>
        ) : (
          <button
            onClick={handleUpgrade}
            disabled={submitting}
            type="button"
            className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold rounded-xl text-sm shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all"
          >
            {submitting ? 'Upgrading…' : 'Upgrade to AutoPilot Lite — $299/mo'}
          </button>
        )}
      </div>
    </div>
  );
}

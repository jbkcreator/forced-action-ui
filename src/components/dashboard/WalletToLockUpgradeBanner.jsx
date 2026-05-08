import { useState } from 'react';

const W2L_DISMISS_TTL_MS = 7 * 24 * 3600 * 1000;

export function readW2LDismissed(feedUuid) {
  try {
    const raw = localStorage.getItem(`fa.w2l_dismissed.${feedUuid}`);
    if (!raw) return false;
    const ts = Number(raw);
    if (Number.isNaN(ts)) return false;
    if (Date.now() - ts > W2L_DISMISS_TTL_MS) {
      localStorage.removeItem(`fa.w2l_dismissed.${feedUuid}`);
      return false;
    }
    return true;
  } catch { return false; }
}

export function writeW2LDismissed(feedUuid) {
  try { localStorage.setItem(`fa.w2l_dismissed.${feedUuid}`, String(Date.now())); } catch { /* noop */ }
}

export default function WalletToLockUpgradeBanner({ zipCode, creditsSpent, ctaUrl, onDismiss }) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div className="mb-4 rounded-xl border border-amber-400/40 bg-gradient-to-r from-amber-500/10 to-orange-500/10 p-5 flex items-center justify-between gap-4 flex-wrap">
      <div className="min-w-0">
        <p className="text-white font-bold text-base">
          You spent {creditsSpent ?? '40'}+ credits in {zipCode} this month.
        </p>
        <p className="text-slate-300 text-xs mt-1 max-w-md">
          Lock {zipCode} as your exclusive territory — no per-credit cost, guaranteed leads, competitors locked out.
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {onDismiss && (
          <button onClick={handleDismiss} type="button" className="text-slate-400 hover:text-white text-sm">
            Not now
          </button>
        )}
        <a
          href={ctaUrl}
          className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-900 font-bold rounded-xl text-sm shadow-lg shadow-amber-500/20 transition-all"
        >
          Lock {zipCode} →
        </a>
      </div>
    </div>
  );
}

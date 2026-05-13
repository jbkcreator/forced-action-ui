/**
 * AcceleratedWalletOfferBanner — fa016 Accelerated Wallet Push.
 *
 * Surfaces the latest open wallet_push_offer to the subscriber. Two CTAs:
 *  - "Activate Wallet" → opens AcceleratedWalletOfferModal
 *  - "Not now"         → POSTs decline, persists `wallet_opt_out=true`
 *
 * The local dismiss key only hides the banner for 7 days; the backend
 * `wallet_opt_out` flag is what permanently suppresses the SMS push.
 */
import { useState } from 'react';

const AW_DISMISS_TTL_MS = 7 * 24 * 3600 * 1000;
const AW_DISMISS_KEY = (feedUuid) => `fa.dashboard.aw_push_dismissed.${feedUuid}`;

export function readAwDismissed(feedUuid) {
  try {
    const raw = localStorage.getItem(AW_DISMISS_KEY(feedUuid));
    if (!raw) return false;
    const ts = Number(raw);
    if (Number.isNaN(ts)) return false;
    if (Date.now() - ts > AW_DISMISS_TTL_MS) {
      localStorage.removeItem(AW_DISMISS_KEY(feedUuid));
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function writeAwDismissed(feedUuid) {
  try {
    localStorage.setItem(AW_DISMISS_KEY(feedUuid), String(Date.now()));
  } catch {
    /* noop */
  }
}

export default function AcceleratedWalletOfferBanner({
  feedUuid,
  offerId,
  creditsOffered = 20,
  priceCents = 4900,
  missedLeads = 0,
  savedCardLast4,
  onActivate,
  onDecline,
}) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const priceDollars = Math.round((priceCents || 4900) / 100);
  const framing =
    missedLeads > 0
      ? `${missedLeads} leads in your ZIP you couldn't unlock this week.`
      : `${creditsOffered} credits pre-loaded on the card you saved.`;

  const cardLabel = savedCardLast4
    ? `card ending ${savedCardLast4}`
    : 'your saved card';

  const handleDecline = () => {
    setDismissed(true);
    writeAwDismissed(feedUuid);
    onDecline?.(offerId);
  };

  return (
    <div
      data-testid="accelerated-wallet-offer-banner"
      className="mb-4 rounded-xl border border-emerald-400/40 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 p-5 flex items-center justify-between gap-4 flex-wrap"
    >
      <div className="min-w-0">
        <p className="text-white font-bold text-base">
          Wallet ready on {cardLabel}
        </p>
        <p className="text-slate-300 text-xs mt-1 max-w-md">
          {framing} Activate Starter Wallet — {creditsOffered} credits a month
          for ${priceDollars}. Auto-reload when balance is low.
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={handleDecline}
          type="button"
          className="text-slate-400 hover:text-white text-sm"
        >
          Not now
        </button>
        <button
          onClick={() => onActivate?.(offerId)}
          type="button"
          className="px-5 py-2.5 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-900 font-bold rounded-xl text-sm shadow-lg shadow-emerald-500/20 transition-all"
        >
          Activate Wallet →
        </button>
      </div>
    </div>
  );
}

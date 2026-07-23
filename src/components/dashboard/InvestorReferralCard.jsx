import { useCallback, useMemo, useState } from 'react';

// T-B12-06 — Tier-3-gated investor-to-investor referral ask.
//
// Renders ONLY for Tier-3 (Dominator) accounts. Reuses the existing referral
// link + reward ladder untouched; the only difference is an `rs` attribution
// marker appended to the link so the backend can tag these signups as
// investor_to_investor (see referral_engine.REFERRAL_SOURCE_INVESTOR).
const INVESTOR_SOURCE = 'investor_to_investor';

// Tier 3 = the top "Dominator" plan (founding or regular). Kept as a helper so
// the gate is expressed in one place.
export function isTier3(tier) {
  return typeof tier === 'string' && tier.toLowerCase().startsWith('dominator');
}

function buildInvestorLink(shareUrl) {
  if (!shareUrl) return null;
  const m = shareUrl.match(/[?&]ref=([^&#]+)/) || shareUrl.match(/\/share\/([^/?#]+)/);
  const code = m ? m[1] : null;
  if (!code) return null;
  return `${window.location.origin}/?ref=${code}&rs=${INVESTOR_SOURCE}`;
}

export default function InvestorReferralCard({ tier, referralData }) {
  const [copied, setCopied] = useState(false);

  const investorLink = useMemo(
    () => buildInvestorLink(referralData?.share_url),
    [referralData?.share_url],
  );

  const handleCopy = useCallback(async () => {
    if (!investorLink) return;
    try {
      await navigator.clipboard.writeText(investorLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // navigator.clipboard unavailable — fail silently
    }
  }, [investorLink]);

  if (!isTier3(tier) || !investorLink) return null;

  return (
    <div className="rounded-2xl glass border border-fa-primary/30 p-5">
      <div className="flex items-start gap-3">
        <span className="text-2xl" aria-hidden="true">🤝</span>
        <div className="min-w-0">
          <h3 className="text-base font-bold text-fa-text-primary">Invite a fellow investor</h3>
          <p className="text-sm text-fa-text-secondary mt-1">
            You're a Dominator — the operators who move fastest in this county.
            Invite another serious investor you trust. When they come on board,
            you both earn the same rewards as any referral: credits, then a free
            month, then a territory upgrade.
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-fa-bg-surface border border-fa-border-default p-3 flex items-center gap-3 flex-wrap">
        <code className="flex-1 min-w-0 text-xs sm:text-sm text-fa-primary break-all">{investorLink}</code>
        <button
          type="button"
          onClick={handleCopy}
          className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold text-fa-bg-base transition ${
            copied ? 'bg-fa-status-available' : 'bg-fa-primary hover:bg-fa-primary-hover'
          }`}
        >
          {copied ? 'Copied ✓' : 'Copy invite'}
        </button>
      </div>

      <p className="text-[11px] text-fa-text-muted mt-2">
        Investor invites are tracked separately so we can see how the community grows.
      </p>
    </div>
  );
}

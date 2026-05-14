import { memo } from 'react';

function FreeTierUpgradeCard({
  onScrollToLeads,
  onBuyLeadPack,
  onUpgrade,
  walletEligible,
  onActivateWallet,
}) {
  return (
    <div className="glass rounded-2xl p-5 my-4 border border-yellow-400/20">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-white">Ready to unlock real leads?</h3>
          <p className="text-sm text-slate-400 mt-1">
            Pick the path that fits your business — pay per lead, buy a pack, or lock a territory.
          </p>
        </div>
        {walletEligible && (
          <button
            type="button"
            onClick={onActivateWallet}
            className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/20 transition"
          >
            ⚡ Activate Wallet
          </button>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={onScrollToLeads}
          className="text-left rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 p-4 transition"
        >
          <p className="text-xs font-semibold text-amber-300 uppercase tracking-wider">Pay Per Lead</p>
          <p className="text-lg font-extrabold text-white mt-1">$4</p>
          <p className="text-xs text-slate-400 mt-1">Unlock the owner + contact on any blurred lead below.</p>
        </button>

        <button
          type="button"
          onClick={onBuyLeadPack}
          className="text-left rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 p-4 transition"
        >
          <p className="text-xs font-semibold text-amber-300 uppercase tracking-wider">Lead Pack</p>
          <p className="text-lg font-extrabold text-white mt-1">$99</p>
          <p className="text-xs text-slate-400 mt-1">5 exclusive leads in a ZIP you choose — 72-hour exclusivity.</p>
        </button>

        <button
          type="button"
          onClick={onUpgrade}
          className="text-left rounded-xl bg-yellow-400/10 hover:bg-yellow-400/20 border border-yellow-400/30 p-4 transition"
        >
          <p className="text-xs font-semibold text-yellow-300 uppercase tracking-wider">Lock Territory</p>
          <p className="text-lg font-extrabold text-white mt-1">Subscribe</p>
          <p className="text-xs text-slate-400 mt-1">Own a ZIP — get every qualified lead in it automatically.</p>
        </button>
      </div>
    </div>
  );
}

export default memo(FreeTierUpgradeCard);

export default function UpgradeBanner({ tier, currentPage, onUpgrade }) {
  if (tier !== 'starter' || currentPage < 2) return null;

  return (
    <div className="mt-6 mb-2 glass-card rounded-xl p-5 flex items-center justify-between gap-4 flex-wrap animate-in">
      <div>
        <p className="text-sm font-semibold text-white">Want more territory coverage?</p>
        <p className="text-xs text-slate-400 mt-0.5">Upgrade to Pro and lock 3 exclusive ZIP territories.</p>
      </div>
      <button
        onClick={onUpgrade}
        className="shrink-0 px-5 py-2.5 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-900 font-bold rounded-xl text-sm transition-all shadow-lg shadow-yellow-400/20"
      >
        Upgrade to Pro
      </button>
    </div>
  );
}

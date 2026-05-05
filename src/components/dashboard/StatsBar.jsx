function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ') : '';
}

export default function StatsBar({ subscriber, onTopup }) {
  if (!subscriber) return null;

  const zips = (subscriber.locked_zips || []).join(', ');
  const hasWallet = subscriber.wallet_balance != null;

  return (
    <div
      className={`mb-8 grid grid-cols-1 gap-3 animate-in ${hasWallet ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-3'}`}
      style={{ animationDelay: '0.1s' }}
    >
      <div className="stat-card glass rounded-xl px-5 py-4">
        <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-1">Plan</p>
        <p className="text-sm font-bold text-white">{capitalize(subscriber.tier)} Plan</p>
      </div>
      <div className="stat-card glass rounded-xl px-5 py-4">
        <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-1">Vertical</p>
        <p className="text-sm font-bold text-white">{capitalize(subscriber.vertical)}</p>
      </div>
      <div className="stat-card glass rounded-xl px-5 py-4">
        <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-1">Territories</p>
        <p className="text-sm font-bold text-white">{zips ? `ZIPs: ${zips}` : 'No locked ZIPs'}</p>
      </div>
      {hasWallet && (
        <div className="stat-card glass rounded-xl px-5 py-4 flex flex-col justify-between gap-2">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-1">Credits</p>
            <p className="text-sm font-bold text-emerald-300">{subscriber.wallet_balance}</p>
          </div>
          {onTopup && (
            <button
              type="button"
              onClick={onTopup}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors text-left"
            >
              Top up →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function PartnerSummaryCard({ selected, priceMonthly, onCheckout, submitting }) {
  return (
    <div className="glass-strong rounded-2xl p-6 mt-4">
      <h3 className="font-bold mb-2 text-white">Your selection</h3>
      {selected.length === 0 ? (
        <p className="text-slate-400 text-sm">Pick at least one ZIP from the map above.</p>
      ) : (
        <ul className="flex flex-wrap gap-2 mb-4" aria-label="Selected ZIPs">
          {selected.map((z) => (
            <li key={z} className="px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-mono border border-emerald-500/30">
              {z}
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center justify-between border-t border-white/10 pt-4">
        <div>
          <p className="text-2xl font-bold text-white">${priceMonthly}/mo</p>
          <p className="text-slate-500 text-xs">All selected ZIPs included</p>
        </div>
        <button
          onClick={onCheckout}
          disabled={!selected.length || submitting}
          type="button"
          className="px-6 py-3 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-900 font-bold rounded-xl text-sm transition-all disabled:opacity-50"
        >
          {submitting ? 'Loading…' : 'Continue to Stripe →'}
        </button>
      </div>
    </div>
  );
}

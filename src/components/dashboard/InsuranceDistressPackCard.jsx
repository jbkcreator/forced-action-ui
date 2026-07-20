import { formatCentsAsPrice } from '../../utils/format';

// ADR 0032 — segment=insurance_distress. `zips` is already gated server-side
// to ZIPs with >=5 qualifying leads (min-5, D8); this component never
// re-derives that threshold, it just renders what it's given.
export default function InsuranceDistressPackCard({ zips, amount, currency, onBuy }) {
  if (!zips?.length) return null;
  const price = formatCentsAsPrice(amount, currency);

  return (
    <div className="mt-6 border-t border-white/10 pt-6 animate-in">
      {zips.map(({ zip_code, count }) => (
        <div
          key={zip_code}
          className="insurance-distress-pack-card p-5 sm:p-6 flex items-center justify-between gap-4 flex-wrap rounded-2xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-400/20"
        >
          <div>
            <p className="text-sm font-semibold text-white">
              {count} storm-damaged flips in {zip_code}
            </p>
            <p className="text-xs text-slate-400">Fresh storm/flood damage + verified flip upside — 72h exclusivity</p>
          </div>
          <button
            onClick={() => onBuy(zip_code)}
            className="px-5 py-2.5 bg-gradient-to-r from-orange-400 to-red-500 hover:from-orange-300 hover:to-red-400 text-slate-900 font-bold rounded-xl text-sm transition-all shadow-lg shadow-orange-400/20 whitespace-nowrap"
          >
            {price ? `Buy Pack ${price}` : 'Buy Pack'}
          </button>
        </div>
      ))}
    </div>
  );
}

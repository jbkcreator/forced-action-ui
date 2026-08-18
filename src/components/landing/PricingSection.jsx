import PricingCard from './PricingCard';
import FounderPricingCard from './FounderPricingCard';

export default function PricingSection({ onCheckout, onStartFree }) {
  return (
    <section className="max-w-6xl mx-auto px-6 py-20">
      <div className="text-center mb-14">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-400/70 mb-3 block">Pricing</span>
        <h2 className="text-3xl sm:text-4xl font-bold mb-3">Choose Your Plan</h2>
        <p className="text-slate-400 text-base max-w-xl mx-auto">
          Founding members lock their rate forever — when spots fill or founding pricing ends, the price increases permanently. Cancel anytime.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:gap-8 md:grid-cols-2">
        <PricingCard tier="starter" onCheckout={onCheckout} />
        <PricingCard tier="pro" isPopular onCheckout={onCheckout} />
      </div>

      {/* Founder — premium tier, separate from the main grid (renders only when
          the backend surfaces pricing.founder). */}
      <FounderPricingCard onCheckout={onCheckout} />

      {/* Free signup option */}
      {onStartFree && (
        <div className="mt-10 max-w-2xl mx-auto">
          <div className="glass-card rounded-2xl p-6 text-center border border-yellow-400/20">
            <h3 className="text-base font-bold text-white mb-1">Not ready to commit?</h3>
            <p className="text-slate-400 text-sm mb-4">
              No card required. See blurred leads in your county, standard leads unlock for $4; hot leads (Gold &amp; above) are $150.
            </p>
            <button
              type="button"
              onClick={onStartFree}
              className="bg-white/[0.06] hover:bg-white/[0.12] text-yellow-300 font-semibold px-6 py-2.5 rounded-lg border border-yellow-400/40 transition"
            >
              Start Free →
            </button>
          </div>
        </div>
      )}

    </section>
  );
}

import PricingCard from './PricingCard';
import AnnualPricingCard from './AnnualPricingCard';
import Icon from '../ui/Icon';
import { useLanding } from './LandingContext';
import { getAnnualSignupArm } from '../../utils/experiments';

export default function PricingSection({ onCheckout, onStartFree }) {
  const { annualSignupTrafficPct } = useLanding();
  const showAnnualCard = getAnnualSignupArm(annualSignupTrafficPct) === 'variant';

  return (
    <section className="max-w-6xl mx-auto px-6 py-20">
      <div className="text-center mb-14">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-400/70 mb-3 block">Pricing</span>
        <h2 className="text-3xl sm:text-4xl font-bold mb-3">Choose Your Plan</h2>
        <p className="text-slate-400 text-base max-w-xl mx-auto">
          Founding members lock their rate forever — when spots fill or founding pricing ends, the price increases permanently. Cancel anytime.
        </p>
      </div>
      <div className={`grid grid-cols-1 gap-6 lg:gap-8 ${showAnnualCard ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
        <PricingCard tier="starter" onCheckout={onCheckout} />
        <PricingCard tier="pro" isPopular onCheckout={onCheckout} />
        <PricingCard tier="dominator" onCheckout={onCheckout} />
        {showAnnualCard && <AnnualPricingCard onCheckout={onCheckout} />}
      </div>

      {/* Free signup option */}
      {onStartFree && (
        <div className="mt-10 max-w-2xl mx-auto">
          <div className="glass-card rounded-2xl p-6 text-center border border-yellow-400/20">
            <h3 className="text-base font-bold text-white mb-1">Not ready to commit?</h3>
            <p className="text-slate-400 text-sm mb-4">
              Start free — see blurred leads in your county and unlock the ones you want for $4 each. No card needed.
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

      {/* 30-Day Guarantee */}
      <div className="mt-10 max-w-lg mx-auto">
        <div className="glass-card rounded-2xl p-6 sm:p-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Icon name="shield-check" size={32} className="text-yellow-400" />
            <h3 className="text-lg font-bold text-white">30-Day Money-Back Guarantee</h3>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed">
            First 30 days or your money back. If the leads aren't what you expected, we'll refund your subscription — no questions asked.
          </p>
        </div>
      </div>
    </section>
  );
}

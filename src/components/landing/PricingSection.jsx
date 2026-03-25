import PricingCard from './PricingCard';
import Icon from '../ui/Icon';

export default function PricingSection({ onCheckout }) {
  return (
    <section className="max-w-6xl mx-auto px-6 py-20">
      <div className="text-center mb-14">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-400/70 mb-3 block">Pricing</span>
        <h2 className="text-3xl sm:text-4xl font-bold mb-3">Choose Your Plan</h2>
        <p className="text-slate-400 text-base max-w-xl mx-auto">
          Founding members lock their rate forever — when spots fill, the price increases permanently. Cancel anytime.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        <PricingCard tier="starter" onCheckout={onCheckout} />
        <PricingCard tier="pro" isPopular onCheckout={onCheckout} />
        <PricingCard tier="dominator" onCheckout={onCheckout} />
      </div>

      {/* 30-Day Guarantee */}
      <div className="mt-14 max-w-lg mx-auto">
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

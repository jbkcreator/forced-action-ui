import { useLanding } from './LandingContext';
import HeroZipCheck from './HeroZipCheck';

export default function HeroBanner({ onStartFree }) {
  const { landingData } = useLanding();
  const countyName = landingData?.county_name || 'Your County';
  const heroHeadline = landingData?.hero?.headline || null;
  const heroSubtitle = landingData?.hero?.subtitle || null;

  return (
    <section className="max-w-6xl mx-auto px-6 pt-24 pb-8 text-center">
      <div className="animate-fade-in-up">
        <div className="inline-flex items-center gap-2.5 bg-yellow-400/[0.07] border border-yellow-400/20 rounded-full px-5 py-2 text-yellow-400 text-sm font-medium mb-8">
          <span className="w-2 h-2 bg-yellow-400 rounded-full founding-pulse" />
          Founding Member Pricing — Limited Spots
        </div>
      </div>

      <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1.05] mb-8 animate-fade-in-up delay-100 tracking-tight">
        {heroHeadline || (
          <>
            Real-Time Property Leads<br />
            <span className="gradient-text">Before Your Competition</span><br />
            <span className="gradient-text">Sees Them</span>
          </>
        )}
      </h1>

      <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-6 leading-relaxed animate-fade-in-up delay-200">
        {heroSubtitle || `Every storm, permit, eviction, and insurance claim in ${countyName} — scored, ranked, and delivered to your exclusive territory before anyone else gets them.`}
      </p>

      {onStartFree && (
        <div className="animate-fade-in-up delay-300 flex flex-col sm:flex-row items-center justify-center gap-3 mb-2">
          <button
            type="button"
            onClick={onStartFree}
            className="bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-bold px-7 py-3 rounded-xl transition shadow-lg shadow-yellow-400/20"
          >
            Start Free — Claim Lead Preview
          </button>
          <a
            href="#pricing"
            className="text-sm text-slate-400 hover:text-white transition underline-offset-4 hover:underline"
          >
            or browse plans →
          </a>
        </div>
      )}
      <p className="text-xs text-slate-500 mt-3">
        No card required. See blurred leads in your county, standard leads unlock for $4; hot leads (Gold &amp; above) are $150.
      </p>

      <HeroZipCheck onUnlock={onStartFree} />
    </section>
  );
}

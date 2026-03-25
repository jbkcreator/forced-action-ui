export default function HeroBanner() {
  return (
    <section className="max-w-6xl mx-auto px-6 pt-24 pb-8 text-center">
      <div className="animate-fade-in-up">
        <div className="inline-flex items-center gap-2.5 bg-yellow-400/[0.07] border border-yellow-400/20 rounded-full px-5 py-2 text-yellow-400 text-sm font-medium mb-8">
          <span className="w-2 h-2 bg-yellow-400 rounded-full founding-pulse" />
          Founding Member Pricing — Limited Spots
        </div>
      </div>

      <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1.05] mb-8 animate-fade-in-up delay-100 tracking-tight">
        Real-Time Property Leads<br />
        <span className="gradient-text">Before Your Competition</span><br />
        <span className="gradient-text">Sees Them</span>
      </h1>

      <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed animate-fade-in-up delay-200">
        Every storm, permit, eviction, and insurance claim in Hillsborough County — scored, ranked, and delivered to your exclusive territory before anyone else gets them.
      </p>
    </section>
  );
}

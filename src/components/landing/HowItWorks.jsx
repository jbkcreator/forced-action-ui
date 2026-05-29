import Icon from '../ui/Icon';
import { useLanding } from './LandingContext';

const STEPS = [
  {
    icon: 'document-text',
    title: 'Real-Time Intelligence',
    description: 'Storm events, permits, insurance claims, and flood declarations scraped daily and scored within hours.',
  },
  {
    icon: 'map-pin',
    title: 'Exclusive ZIP Territories',
    description: 'Lock your ZIP codes. No other contractor in your vertical and territory gets the same leads. First come, first served.',
  },
  {
    icon: 'chart-bar',
    title: 'CDS Scored & Ranked',
    description: 'Every property scored from 0-100 across 14 distress signals. Ultra Platinum leads delivered first, always.',
  },
];

export default function HowItWorks() {
  const { landingData } = useLanding();
  const countyName = landingData?.county_name || 'Your County';
  const sampleCity = {
    hillsborough: 'Tampa',
    pinellas: 'St. Petersburg',
  }[landingData?.county_id] || countyName.split(' ')[0];

  return (
    <section id="how-it-works" className="max-w-6xl mx-auto px-6 py-16">
      <div className="text-center mb-12">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-400/70 mb-3 block">How It Works</span>
        <h2 className="text-3xl sm:text-4xl font-bold">Intelligence, delivered</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {STEPS.map((step, i) => (
          <div key={i} className="glass-card rounded-2xl p-8 text-center group hover:bg-white/[0.06] transition-all duration-300">
            <div className="step-circle w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300">
              <Icon name={step.icon} size={28} className="text-yellow-400" />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 block">Step {i + 1}</span>
            <h3 className="font-bold text-lg mb-3">{step.title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{step.description}</p>
          </div>
        ))}
      </div>

      {/* Static preview lead card */}
      <div className="mt-12 max-w-md mx-auto">
        <p className="text-center text-xs text-slate-400 uppercase tracking-widest mb-4">Sample Scored Lead</p>
        <div className="sample-lead-card sample-lead-platinum">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white text-sm">4821 W Neptune St</p>
              <p className="text-slate-400 text-xs mt-0.5">{sampleCity}, FL · Built 1987 · 2,140 sqft</p>
              <p className="text-yellow-400 text-xs mt-1 flex items-center gap-1">
                <Icon name="bolt" size={12} className="text-yellow-400" /> Hurricane damage — 2026-03-12
              </p>
              <p className="text-slate-500 text-xs mt-1">storm_damage · open_permit · insurance_claim</p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="score-badge score-platinum">Ultra Platinum</span>
              <span className="text-xs text-slate-400">Score: <span className="text-white font-medium">94</span></span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Icon name="phone" size={12} className="text-slate-500" /> Phone: <span className="font-mono text-slate-400">***-***-7482</span>
            </span>
            <span className="text-xs text-yellow-400 font-medium">Unlock with subscription</span>
          </div>
        </div>
      </div>
    </section>
  );
}

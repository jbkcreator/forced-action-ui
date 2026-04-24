import { useSearchParams, Link } from 'react-router-dom';
import { theme } from '../theme/ThemeProvider';
import ProofMoment from '../components/landing/ProofMoment';

const CONFETTI_PIECES = [
  { left: '5%',  w: 8,  h: 8,  bg: 'rgba(250,204,21,0.25)', radius: '2px',  dur: '14s', delay: '0s',   rotate: '' },
  { left: '15%', w: 6,  h: 6,  bg: 'rgba(250,204,21,0.15)', radius: '50%',  dur: '18s', delay: '2s',   rotate: '' },
  { left: '25%', w: 10, h: 10, bg: 'rgba(168,85,247,0.15)', radius: '2px',  dur: '16s', delay: '4s',   rotate: 'rotate(45deg)' },
  { left: '35%', w: 5,  h: 5,  bg: 'rgba(250,204,21,0.2)',  radius: '50%',  dur: '20s', delay: '1s',   rotate: '' },
  { left: '45%', w: 7,  h: 7,  bg: 'rgba(251,146,60,0.15)', radius: '2px',  dur: '15s', delay: '3s',   rotate: '' },
  { left: '55%', w: 9,  h: 9,  bg: 'rgba(250,204,21,0.18)', radius: '50%',  dur: '17s', delay: '5s',   rotate: '' },
  { left: '65%', w: 6,  h: 6,  bg: 'rgba(168,85,247,0.12)', radius: '2px',  dur: '19s', delay: '0.5s', rotate: 'rotate(30deg)' },
  { left: '75%', w: 8,  h: 8,  bg: 'rgba(250,204,21,0.22)', radius: '50%',  dur: '13s', delay: '2.5s', rotate: '' },
  { left: '85%', w: 5,  h: 5,  bg: 'rgba(251,191,36,0.14)', radius: '2px',  dur: '21s', delay: '6s',   rotate: '' },
  { left: '92%', w: 7,  h: 7,  bg: 'rgba(250,204,21,0.16)', radius: '50%',  dur: '16s', delay: '1.5s', rotate: '' },
  { left: '10%', w: 4,  h: 12, bg: 'rgba(250,204,21,0.2)',  radius: '1px',  dur: '22s', delay: '7s',   rotate: 'rotate(20deg)' },
  { left: '50%', w: 12, h: 4,  bg: 'rgba(168,85,247,0.14)', radius: '1px',  dur: '15s', delay: '3.5s', rotate: 'rotate(-15deg)' },
];

const STEPS = [
  { title: 'Check your email', desc: "Your private Event Feed link will arrive within a few minutes. Keep it safe — it's your unique access link." },
  { title: 'First leads within 15 minutes', desc: 'Your feed will populate with scored, ranked leads from your locked ZIP territories almost immediately.' },
  { title: 'New leads every morning', desc: 'Fresh intelligence scraped nightly — permits, storm events, insurance claims — delivered to your feed by 7 AM daily.' },
];

const TIER_LABELS = { starter: 'Starter', pro: 'Pro', dominator: 'Dominator' };
const TIER_PRICES = { starter: '$499/mo', pro: '$899/mo', dominator: '$1,499/mo' };

export default function SuccessPage() {
  const [params] = useSearchParams();
  const feedUuid = params.get('feed_uuid');
  const tier = params.get('tier') || '';
  const zips = params.get('zips') || '';
  const vertical = params.get('vertical') || 'roofing';
  const countyId = params.get('county_id') || 'hillsborough';
  const tierLabel = TIER_LABELS[tier] || '';
  const tierPrice = TIER_PRICES[tier] || '';
  const zipList = zips ? zips.split(',').filter(Boolean) : [];

  return (
    <div className="min-h-screen text-white flex flex-col overflow-x-hidden" style={{
      background: 'linear-gradient(135deg, #0a0f1e 0%, #1a1040 25%, #0f172a 50%, #0d1a2d 75%, #0a0f1e 100%)',
      backgroundSize: '400% 400%',
      animation: 'gradientShift 12s ease infinite',
    }}>
      {/* Confetti */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {CONFETTI_PIECES.map((p, i) => (
          <div
            key={i}
            className="absolute opacity-0"
            style={{
              left: p.left,
              width: `${p.w}px`,
              height: `${p.h}px`,
              background: p.bg,
              borderRadius: p.radius,
              animation: `confettiFall ${p.dur} linear infinite`,
              animationDelay: p.delay,
              transform: p.rotate || undefined,
            }}
          />
        ))}
      </div>

      {/* Nav */}
      <nav className="px-6 py-4 sticky top-0 z-50" style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm text-slate-900" style={{ background: 'linear-gradient(135deg, #facc15, #f59e0b)' }}>FA</div>
            <span className="text-xl font-bold tracking-tight">{theme.brand.name.split(' ')[0]} <span className="text-yellow-400">{theme.brand.name.split(' ').slice(1).join(' ')}</span></span>
          </div>
          <span className="text-sm text-slate-400 hidden sm:inline">{theme.brand.location} &middot; {theme.brand.tagline}</span>
        </div>
      </nav>

      {/* Main */}
      <main id="main-content" className="flex-1 flex items-center justify-center px-6 py-8 sm:py-16 relative z-10">
        <div className="max-w-lg w-full text-center">
          {/* Check icon */}
          <div className="relative inline-flex items-center justify-center mb-10">
            <div className="absolute -inset-[30px] rounded-full animate-breathe-glow" style={{ background: 'radial-gradient(circle, rgba(250,204,21,0.2) 0%, transparent 70%)' }} />
            <div className="absolute -inset-3 rounded-full border-2 border-yellow-400/40 animate-ring-expand" />
            <div className="absolute -inset-3 rounded-full border-2 border-yellow-400/40 animate-ring-expand" style={{ animationDelay: '0.7s' }} />
            <div className="animate-pop inline-flex items-center justify-center w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-yellow-400/10 border-2 border-yellow-400/60 relative z-10">
              <svg className="w-14 h-14 sm:w-16 sm:h-16 text-yellow-400 drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-5xl sm:text-6xl font-black mb-3 gradient-text tracking-tight leading-tight animate-fade-in-up delay-100">
            You're In.
          </h1>

          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 animate-fade-in-up delay-200">
            <span className="inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 text-sm font-semibold px-6 py-2.5 rounded-full uppercase tracking-widest relative overflow-hidden founding-badge-glow">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.06l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
              Founding Member
            </span>
          </div>

          {/* Plan confirmation */}
          {(tierLabel || zipList.length > 0) && (
            <div className="mb-6 animate-fade-in-up delay-200">
              <div className="inline-flex flex-wrap items-center justify-center gap-2 text-sm text-slate-300">
                {zipList.length > 0 && (
                  <span className="bg-white/5 border border-white/10 rounded-full px-3 py-1">
                    ZIP {zipList.join(', ')}
                  </span>
                )}
                {tierLabel && (
                  <span className="bg-white/5 border border-white/10 rounded-full px-3 py-1">
                    {tierLabel} Plan
                  </span>
                )}
                {tierPrice && (
                  <span className="bg-yellow-400/10 border border-yellow-400/20 text-yellow-300 rounded-full px-3 py-1 font-semibold">
                    {tierPrice} — locked forever
                  </span>
                )}
              </div>
            </div>
          )}

          <p className="text-lg sm:text-xl text-slate-300 mb-10 leading-relaxed max-w-md mx-auto animate-fade-in-up delay-200">
            Your founding rate is locked and your territory is reserved.<br className="hidden sm:inline" />
            Your Event Feed is being set up now.
          </p>

          {/* What happens next */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 text-left mb-10 animate-fade-in-up delay-300" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)' }}>
            <h2 className="font-bold text-sm text-center mb-6 text-white/90 uppercase tracking-wider">What happens next</h2>
            <div className="space-y-6">
              {STEPS.map((step, i) => (
                <div key={i} className="flex gap-4 items-start relative">
                  <div className="relative shrink-0">
                    <span className="w-7 h-7 rounded-full text-xs flex items-center justify-center font-extrabold" style={{ background: 'linear-gradient(135deg, #facc15, #f59e0b)', color: '#0f172a' }}>
                      {i + 1}
                    </span>
                    {i < STEPS.length - 1 && (
                      <div className="absolute left-[13px] top-8 bottom-[-16px] w-0.5" style={{ background: 'linear-gradient(to bottom, rgba(250,204,21,0.3), rgba(250,204,21,0.05))' }} />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{step.title}</p>
                    <p className="text-slate-400 text-sm mt-0.5 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dashboard link */}
          {feedUuid && (
            <div className="mb-4 animate-fade-in-up delay-400">
              <div className="relative inline-block p-0.5 rounded-2xl" style={{
                background: 'linear-gradient(135deg, #facc15, #a855f7, #f59e0b, #a855f7, #facc15)',
                backgroundSize: '400% 400%',
                animation: 'borderGlow 2s ease infinite',
              }}>
                <Link
                  to={`/dashboard/${feedUuid}`}
                  className="block rounded-[14px] px-12 py-4 font-extrabold text-yellow-400 hover:text-yellow-300 transition-all text-lg"
                  style={{ background: '#0f172a' }}
                >
                  Access your lead feed &rarr;
                </Link>
              </div>
            </div>
          )}

          {/* Proof Moment — Phase 2B: show 1 revealed + 2 blurred teaser leads */}
          <div className="mt-10 animate-fade-in-up delay-500">
            <ProofMoment vertical={vertical} countyId={countyId} />
          </div>

          {/* Resend email */}
          <p className="text-slate-500 text-xs mb-8 animate-fade-in-up delay-400">
            Didn't get the email?{' '}
            <span className="text-slate-400">Check your spam folder</span>
            {' '}or{' '}
            <a href={`mailto:${theme.brand.supportEmail}?subject=Resend%20confirmation`} className="text-yellow-400/70 hover:text-yellow-400 transition-colors">
              contact support
            </a>
          </p>

          {/* Support glass card */}
          <div className="animate-fade-in-up delay-500 glass rounded-xl px-5 py-4 text-sm">
            <p className="text-slate-400 mb-1">Questions or need help getting set up?</p>
            <a
              href={`mailto:${theme.brand.supportEmail}`}
              className="text-yellow-300 font-semibold hover:text-yellow-200 transition-colors"
            >
              {theme.brand.supportEmail}
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}

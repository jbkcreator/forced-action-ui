import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { theme } from '../theme/ThemeProvider';
import { trackPurchase } from '../utils/metaPixel';

const TRIAL_DAYS = 14;
const PRICE_DISPLAY = '$297/mo';

const STEPS = [
  { title: 'Check your email', desc: 'A confirmation is on its way, along with your private status link for managing jurisdictions, chapters, and alert channels.' },
  { title: `${TRIAL_DAYS}-day free trial`, desc: `You won't be charged until your trial ends. Cancel anytime from your status link before then.` },
  { title: 'Daily filing alerts', desc: 'New bankruptcy filings matching your jurisdictions and chapters are delivered by email (and SMS, if enabled) as they post.' },
];

export default function BankruptcyAlertSuccessPage() {
  const [params] = useSearchParams();
  const sessionId = params.get('session_id');

  useEffect(() => {
    if (!sessionId) return;
    const guardKey = `fa_bk_purchase_fired:${sessionId}`;
    if (sessionStorage.getItem(guardKey)) return;
    sessionStorage.setItem(guardKey, '1');
    trackPurchase({
      value: 0,
      currency: 'usd',
      eventId: `bk_${sessionId}`,
    });
  }, [sessionId]);

  return (
    <div className="min-h-screen text-white flex flex-col overflow-x-hidden" style={{
      background: 'linear-gradient(135deg, #0a0f1e 0%, #1a1040 25%, #0f172a 50%, #0d1a2d 75%, #0a0f1e 100%)',
      backgroundSize: '400% 400%',
      animation: 'gradientShift 12s ease infinite',
    }}>
      {/* Nav */}
      <nav className="px-6 py-4 sticky top-0 z-50" style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm text-slate-900" style={{ background: 'linear-gradient(135deg, #facc15, #f59e0b)' }}>FA</div>
            <span className="text-xl font-bold tracking-tight">{theme.brand.name.split(' ')[0]} <span className="text-yellow-400">{theme.brand.name.split(' ').slice(1).join(' ')}</span></span>
          </div>
          <span className="text-sm text-slate-400 hidden sm:inline">Bankruptcy Filing Alerts</span>
        </div>
      </nav>

      {/* Main */}
      <main id="main-content" className="flex-1 flex items-center justify-center px-6 py-8 sm:py-16 relative z-10">
        <div className="max-w-lg w-full text-center">
          {/* Check icon */}
          <div className="relative inline-flex items-center justify-center mb-10">
            <div className="absolute -inset-[30px] rounded-full animate-breathe-glow" style={{ background: 'radial-gradient(circle, rgba(250,204,21,0.2) 0%, transparent 70%)' }} />
            <div className="absolute -inset-3 rounded-full border-2 border-yellow-400/40 animate-ring-expand" />
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
            <span className="inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 text-sm font-semibold px-6 py-2.5 rounded-full uppercase tracking-widest">
              Bankruptcy Filing Alerts
            </span>
          </div>

          {/* Plan confirmation */}
          <div className="mb-6 animate-fade-in-up delay-200">
            <div className="inline-flex flex-wrap items-center justify-center gap-2 text-sm text-slate-300">
              <span className="bg-white/5 border border-white/10 rounded-full px-3 py-1">
                {TRIAL_DAYS}-day free trial
              </span>
              <span className="bg-yellow-400/10 border border-yellow-400/20 text-yellow-300 rounded-full px-3 py-1 font-semibold">
                {PRICE_DISPLAY} after trial
              </span>
            </div>
          </div>

          <p className="text-lg sm:text-xl text-slate-300 mb-10 leading-relaxed max-w-md mx-auto animate-fade-in-up delay-200">
            Your subscription is confirmed.<br className="hidden sm:inline" />
            We're setting up your alert feed now.
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

          {/* Resend email */}
          <p className="text-slate-500 text-xs mb-8 animate-fade-in-up delay-400">
            Didn't get the email?{' '}
            <span className="text-slate-400">Check your spam folder</span>
            {' '}or{' '}
            <a href={`mailto:${theme.brand.supportEmail}?subject=Resend%20bankruptcy%20alert%20confirmation`} className="text-yellow-400/70 hover:text-yellow-400 transition-colors">
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

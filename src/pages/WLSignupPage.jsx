/**
 * 3-step white-label signup wizard:
 * Step 1 — Company info + password
 * Step 2 — Branding (logo upload, color pickers)
 * Step 3 — Plan selection + Stripe checkout redirect
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { wlSignup, wlCreateCheckout } from '../api/whiteLabelClient.js';

const STEPS = ['Company Info', 'Branding', 'Plan'];
const PLANS = [
  {
    tier: 'standard',
    name: 'Standard',
    price: '$2,500/mo',
    features: ['Full lead access', 'API keys', 'Team management', 'Branded reports', '14-day trial'],
  },
  {
    tier: 'premium',
    name: 'Premium',
    price: '$5,000/mo',
    features: ['Everything in Standard', 'Priority support', 'Dedicated onboarding', 'Custom county coverage'],
  },
];

export default function WLSignupPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Form state
  const [companyName, setCompanyName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#fbbf24');
  const [secondaryColor, setSecondaryColor] = useState('#a855f7');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [planTier, setPlanTier] = useState('standard');
  const [clientId, setClientId] = useState(null);

  function handleLogoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  async function handleStep1(e) {
    e.preventDefault();
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setError('');
    setStep(1);
  }

  async function handleStep2(e) {
    e.preventDefault();
    setError('');
    setStep(2);
  }

  async function handleSubmit() {
    setError('');
    setLoading(true);
    try {
      // 1. Create account (brand colors carry through; logo is set post-login in Settings)
      const res = await wlSignup(companyName, adminName, email, password, planTier, { primaryColor, secondaryColor });
      const newClientId = res.client_id;
      setClientId(newClientId);
      setSuccess(true);
    } catch (err) {
      setError(err?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-fa-bg-base flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="text-4xl mb-4">✉️</div>
          <h1 className="text-2xl font-bold text-fa-text-primary mb-3">Check your email</h1>
          <p className="text-fa-text-muted mb-6">
            We sent a verification link to <strong className="text-fa-text-primary">{email}</strong>.
            After verifying, your account will be reviewed by our team and activated within 1 business day.
          </p>
          <Link to="/wl/login" className="text-fa-primary hover:underline text-sm">Back to login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-fa-bg-base flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center mb-8 gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                ${i <= step ? 'bg-fa-primary text-fa-bg-base' : 'bg-fa-bg-card text-fa-text-muted border border-fa-border-default'}`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`text-sm ${i === step ? 'text-fa-text-primary font-medium' : 'text-fa-text-muted'}`}>{s}</span>
              {i < STEPS.length - 1 && <div className="flex-1 h-px bg-fa-border-default w-8" />}
            </div>
          ))}
        </div>

        {/* Step 1 — Company info */}
        {step === 0 && (
          <form onSubmit={handleStep1} className="space-y-4">
            <h2 className="text-xl font-bold text-fa-text-primary mb-1">Company information</h2>
            <p className="text-fa-text-muted text-sm mb-4">Set up your white-label account</p>
            <div>
              <label className="block text-sm font-medium text-fa-text-secondary mb-1">Company name</label>
              <input value={companyName} onChange={e => setCompanyName(e.target.value)} required
                className="w-full bg-fa-bg-card border border-fa-border-default rounded-lg px-3 py-2 text-fa-text-primary focus:outline-none focus:border-fa-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-fa-text-secondary mb-1">Your name</label>
              <input value={adminName} onChange={e => setAdminName(e.target.value)} required
                className="w-full bg-fa-bg-card border border-fa-border-default rounded-lg px-3 py-2 text-fa-text-primary focus:outline-none focus:border-fa-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-fa-text-secondary mb-1">Work email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full bg-fa-bg-card border border-fa-border-default rounded-lg px-3 py-2 text-fa-text-primary focus:outline-none focus:border-fa-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-fa-text-secondary mb-1">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                className="w-full bg-fa-bg-card border border-fa-border-default rounded-lg px-3 py-2 text-fa-text-primary focus:outline-none focus:border-fa-primary" />
              <p className="text-xs text-fa-text-muted mt-1">Minimum 8 characters</p>
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button type="submit" className="w-full bg-fa-primary text-fa-bg-base font-bold py-2.5 rounded-lg hover:opacity-90">
              Continue →
            </button>
            <p className="text-center text-sm text-fa-text-muted">
              Already have an account? <Link to="/wl/login" className="text-fa-primary hover:underline">Sign in</Link>
            </p>
          </form>
        )}

        {/* Step 2 — Branding */}
        {step === 1 && (
          <form onSubmit={handleStep2} className="space-y-4">
            <h2 className="text-xl font-bold text-fa-text-primary mb-1">Brand your dashboard</h2>
            <p className="text-fa-text-muted text-sm mb-4">Your logo and colors appear in all reports and the dashboard.</p>

            <div>
              <label className="block text-sm font-medium text-fa-text-secondary mb-2">Logo (optional)</label>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-fa-border-default rounded-lg p-6 cursor-pointer hover:border-fa-primary transition-colors">
                {logoPreview
                  ? <img src={logoPreview} alt="Logo preview" className="h-12 object-contain mb-2" />
                  : <span className="text-fa-text-muted text-sm">Click to upload (PNG/SVG, max 5 MB)</span>
                }
                <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-fa-text-secondary mb-1">Primary color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border-0 p-0 bg-transparent" />
                  <input value={primaryColor} onChange={e => setPrimaryColor(e.target.value)}
                    className="flex-1 bg-fa-bg-card border border-fa-border-default rounded px-2 py-1.5 text-fa-text-primary text-sm font-mono" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-fa-text-secondary mb-1">Accent color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border-0 p-0 bg-transparent" />
                  <input value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)}
                    className="flex-1 bg-fa-bg-card border border-fa-border-default rounded px-2 py-1.5 text-fa-text-primary text-sm font-mono" />
                </div>
              </div>
            </div>

            {/* Live preview */}
            <div className="rounded-lg p-4 border border-fa-border-default" style={{ borderColor: primaryColor }}>
              <p className="text-xs text-fa-text-muted mb-2">Preview</p>
              <div className="flex items-center gap-3">
                {logoPreview && <img src={logoPreview} alt="" className="h-7 object-contain" />}
                <span className="font-bold text-fa-text-primary">{companyName || 'Your Company'}</span>
                <span className="ml-auto px-2 py-0.5 rounded text-xs font-bold" style={{ background: primaryColor, color: '#0f172a' }}>
                  Gold+
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(0)} className="flex-1 border border-fa-border-default text-fa-text-secondary py-2.5 rounded-lg hover:bg-fa-bg-card">
                ← Back
              </button>
              <button type="submit" className="flex-1 bg-fa-primary text-fa-bg-base font-bold py-2.5 rounded-lg hover:opacity-90">
                Continue →
              </button>
            </div>
          </form>
        )}

        {/* Step 3 — Plan selection */}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold text-fa-text-primary mb-1">Choose your plan</h2>
            <p className="text-fa-text-muted text-sm mb-6">Both plans include a 14-day free trial.</p>

            <div className="space-y-3 mb-6">
              {PLANS.map(plan => (
                <div
                  key={plan.tier}
                  onClick={() => setPlanTier(plan.tier)}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    planTier === plan.tier
                      ? 'border-fa-primary bg-fa-bg-card'
                      : 'border-fa-border-default hover:border-fa-border-emphasis'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center
                        ${planTier === plan.tier ? 'border-fa-primary' : 'border-fa-border-default'}`}>
                        {planTier === plan.tier && <div className="w-2 h-2 rounded-full bg-fa-primary" />}
                      </div>
                      <span className="font-bold text-fa-text-primary">{plan.name}</span>
                    </div>
                    <span className="text-fa-primary font-bold">{plan.price}</span>
                  </div>
                  <ul className="space-y-1">
                    {plan.features.map(f => (
                      <li key={f} className="text-xs text-fa-text-muted flex items-center gap-1.5">
                        <span className="text-green-400">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 border border-fa-border-default text-fa-text-secondary py-2.5 rounded-lg hover:bg-fa-bg-card">
                ← Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 bg-fa-primary text-fa-bg-base font-bold py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                {loading ? 'Creating account…' : 'Create account →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

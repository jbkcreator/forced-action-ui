import { useState } from 'react';
import { VERTICAL_LABELS } from '../../config/constants';
import { submitWaitlist } from '../../api/landing';

const TRADE_OPTIONS = [
  { value: 'roofing', label: 'Roofing' },
  { value: 'restoration', label: 'Restoration' },
  { value: 'public_adjusters', label: 'Public Adjuster' },
  { value: 'wholesalers', label: 'Wholesaler' },
  { value: 'fix_flip', label: 'Fix & Flip' },
  { value: 'attorneys', label: 'Attorney' },
];

export default function ComingSoonVariant({ county_id, county_display_name, zip_count, vertical_waitlist_counts }) {
  const [selectedVertical, setSelectedVertical] = useState('roofing');
  const [name, setName] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [smsOptIn, setSmsOptIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg(null);

    try {
      await submitWaitlist({
        zipCode,
        vertical: selectedVertical,
        countyId: county_id,
        name: name.trim(),
        email,
        phone: smsOptIn ? phone : undefined,
        sms_opt_in: smsOptIn,
        waitlist_type: 'coming_soon',
      });
      setMsg({ type: 'success', text: `✓ You're on the waitlist for ${county_display_name}. We'll email you when it opens.` });
    } catch (err) {
      if (err?.status === 'already_registered') {
        setMsg({ type: 'success', text: `✓ You're already on the list for ${county_display_name}.` });
      } else {
        setMsg({ type: 'error', text: 'Could not join waitlist. Please try again.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="gradient-bg min-h-screen text-white">
      <div className="max-w-2xl mx-auto px-6 py-20">
        <div className="text-center mb-8">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-400/70 mb-3 block">Coming Soon</span>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">{county_display_name} is opening soon</h1>
          <p className="text-slate-400 text-lg">
            {zip_count} ZIPs will go live at launch — be first in line for {VERTICAL_LABELS[selectedVertical]} leads.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-8">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Trade</label>
              <select
                value={selectedVertical}
                onChange={(e) => setSelectedVertical(e.target.value)}
                className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-yellow-400/40"
              >
                {TRADE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-slate-900">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Name</label>
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400/40"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">ZIP Code</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={5}
                placeholder="Enter your ZIP"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value.replace(/\D/g, ''))}
                required
                className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400/40"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400/40"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Phone (optional)</label>
              <input
                type="tel"
                placeholder="+1 (___) ___-____"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400/40"
              />
            </div>

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="sms-opt-in"
                checked={smsOptIn}
                onChange={(e) => setSmsOptIn(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border border-white/[0.2] bg-white/[0.06] text-yellow-400 focus:ring-1 focus:ring-yellow-400/40"
              />
              <label htmlFor="sms-opt-in" className="text-sm text-slate-400">
                I agree to receive SMS notifications about my ZIP becoming available.
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-3.5 rounded-xl disabled:opacity-50"
            >
              {submitting ? 'Joining...' : 'Join Waitlist'}
            </button>
          </div>

          {msg && (
            <p className={`mt-4 text-sm text-center ${msg.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
              {msg.text}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
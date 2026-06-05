import { useState, useCallback } from 'react';
import { submitWaitlist } from '../../api/landing';
import TermsConsentGate from '../shared/TermsConsentGate';

const TRADE_OPTIONS = [
  { value: 'roofing',          label: 'Roofing' },
  { value: 'restoration',      label: 'Restoration' },
  { value: 'public_adjusters', label: 'Public Adjuster' },
  { value: 'wholesalers',      label: 'Wholesaler' },
  { value: 'fix_flip',         label: 'Fix & Flip' },
  { value: 'attorneys',        label: 'Attorney' },
];

const COUNTY_OPTIONS = [
  { value: 'pinellas',     label: 'Pinellas' },
];

const inputCls = 'w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400/40 text-sm';
const labelCls = 'block text-xs font-medium text-slate-400 mb-1.5';

export default function WaitlistForm({ zip, countyId, waitlistType = 'sold_out', vertical: initialVertical, onSuccess }) {
  const [selectedVertical, setSelectedVertical] = useState(initialVertical || 'roofing');
  const [selectedCounty, setSelectedCounty] = useState('pinellas');
  const [zipInput, setZipInput] = useState(zip || '');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState(null);

  // Consent state
  const [consentPayload, setConsentPayload] = useState(null);
  const termsAccepted = consentPayload?.terms_accepted === true;

  const handleConsentChange = useCallback((payload) => {
    setConsentPayload(payload);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!termsAccepted) {
      setMsg({ type: 'error', text: 'You must accept the Terms & Conditions and Privacy Policy to join the waitlist.' });
      return;
    }

    setSubmitting(true);
    setMsg(null);

    try {
      const hasPhone = phone.trim().length > 0;
      const res = await submitWaitlist({
        zipCode: zipInput.trim(),
        vertical: selectedVertical,
        countyId: selectedCounty,
        name: name.trim(),
        email,
        phone: hasPhone ? phone.trim() : undefined,
        sms_opt_in: consentPayload?.tcpa_accepted === true && hasPhone,
        waitlist_type: waitlistType,
        consent_acceptance: consentPayload,
      });

      if (res?.status === 'already_registered') {
        setMsg({ type: 'success', text: `✓ You're already on the list. We'll notify you when it opens.` });
      } else {
        setMsg({ type: 'success', text: `✓ You're on the waitlist for ZIP ${zipInput.trim()}. We'll email you when it opens.` });
      }

      setTimeout(() => { onSuccess?.(); }, 1800);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      if (detail?.error === 'terms_not_accepted') {
        setMsg({ type: 'error', text: detail.message || 'You must accept the Terms & Conditions.' });
      } else {
        setMsg({ type: 'error', text: 'Could not join waitlist. Please try again.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = termsAccepted && !submitting;

  return (
    <div className="glass-card rounded-2xl flex flex-col max-h-[85vh]">
      {/* Header — fixed */}
      <div className="px-6 pt-6 pb-4 border-b border-white/[0.06] shrink-0">
        <h3 className="text-base font-bold text-center">Get Notified When This ZIP Opens</h3>
        <p className="text-slate-400 text-xs text-center mt-1">
          Join the waitlist — we'll email you the moment this territory becomes available.
        </p>
      </div>

      {/* Scrollable body */}
      <div className="overflow-y-auto px-6 py-4 flex-1">
        <form id="waitlist-form" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">

            {/* Row 1: Name + Email */}
            <div>
              <label className={labelCls}>Name</label>
              <input type="text" placeholder="Your name" value={name}
                onChange={(e) => setName(e.target.value)} required className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input type="email" placeholder="your@email.com" value={email}
                onChange={(e) => setEmail(e.target.value)} required className={inputCls} />
            </div>

            {/* Row 2: ZIP + Trade */}
            <div>
              <label className={labelCls}>ZIP Code</label>
              <input type="text" placeholder="e.g. 33601" value={zipInput}
                onChange={(e) => setZipInput(e.target.value.replace(/\D/g, '').slice(0, 5))}
                required maxLength={5} pattern="\d{5}" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Trade</label>
              <select value={selectedVertical} onChange={(e) => setSelectedVertical(e.target.value)}
                className={inputCls}>
                {TRADE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value} className="bg-slate-900">{o.label}</option>
                ))}
              </select>
            </div>

            {/* Row 3: County + Phone */}
            <div>
              <label className={labelCls}>County</label>
              <select value={selectedCounty} onChange={(e) => setSelectedCounty(e.target.value)}
                className={inputCls}>
                {COUNTY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value} className="bg-slate-900">{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Phone <span className="text-slate-600">(optional)</span></label>
              <input type="tel" placeholder="+1 (___) ___-____" value={phone}
                onChange={(e) => setPhone(e.target.value)} className={inputCls} />
            </div>

            {/* Row 4: Consent Gate — full width */}
            <div className="col-span-2 pt-1 border-t border-white/[0.06]">
              <TermsConsentGate
                sourceFlow="waitlist"
                showTcpa={true}
                phoneProvided={phone.trim().length > 0}
                onAccept={handleConsentChange}
              />
            </div>
          </div>
        </form>
      </div>

      {/* Footer — fixed */}
      <div className="px-6 pb-6 pt-3 shrink-0">
        {msg && (
          <p className={`text-xs text-center mb-3 ${msg.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
            {msg.text}
          </p>
        )}
        <button type="submit" form="waitlist-form" disabled={!canSubmit}
          className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-3 rounded-xl disabled:opacity-50 text-sm transition-colors">
          {submitting ? 'Joining...' : 'Join Waitlist'}
        </button>
      </div>
    </div>
  );
}
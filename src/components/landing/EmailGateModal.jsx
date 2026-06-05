import { useState } from 'react';
import Modal, { ModalClose } from '../ui/Modal';
import TermsConsentGate from '../shared/TermsConsentGate';

export default function EmailGateModal({
  isOpen,
  onClose,
  onProceed,
  title = 'Enter your email to continue',
  description = "We'll use this to set up your account and send your lead feed access.",
  submitLabel = 'Continue',
  submitting = false,
  sourceFlow = 'free_signup',
}) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(null);
  const [error, setError] = useState('');

  const termsAccepted = consent?.terms_accepted === true;

  function validate(value) {
    const v = value.trim().toLowerCase();
    if (!v) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Enter a valid email address.';
    return '';
  }

  function handleSubmit() {
    if (submitting) return;
    const err = validate(email);
    if (err) { setError(err); return; }
    if (!termsAccepted) { setError('Please accept the Terms & Conditions to continue.'); return; }
    setError('');
    onProceed(email.trim().toLowerCase(), consent, phone.trim() || null);
  }

  function handleClose() {
    setError('');
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div
        className="relative"
        style={{
          background: 'rgba(15,23,42,0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '1.25rem',
          padding: '2rem',
          width: '100%',
          maxWidth: '420px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
        }}
      >
        <ModalClose onClick={handleClose} />

        <h2 className="text-xl font-bold mb-1">{title}</h2>
        <p className="text-slate-400 text-sm mb-6">
          {description}
        </p>

        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          autoFocus
          disabled={submitting}
          className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400/40 text-sm mb-2 disabled:opacity-60"
        />

        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="Phone (optional — for lead alerts &amp; call consent)"
          value={phone}
          onChange={(e) => { setPhone(e.target.value); setError(''); }}
          disabled={submitting}
          className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400/40 text-sm mb-4 disabled:opacity-60"
        />

        <TermsConsentGate
          sourceFlow={sourceFlow}
          showTcpa={true}
          phoneProvided={phone.replace(/\D/g, '').length >= 10}
          onAccept={setConsent}
        />

        {error && (
          <p className="text-red-400 text-xs mt-3">{error}</p>
        )}

        {!error && <div className="mt-3" />}

        <button
          onClick={handleSubmit}
          disabled={submitting || !termsAccepted}
          className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:bg-yellow-400/60 text-black font-bold py-3 rounded-xl transition mt-2"
        >
          {submitting ? 'Setting up your dashboard…' : submitLabel}
        </button>

        <p className="text-slate-500 text-xs text-center mt-4">
          Already subscribed?{' '}
          <a href="/dashboard" className="text-yellow-400/70 hover:text-yellow-400 underline transition">
            Go to your dashboard
          </a>
        </p>
      </div>
    </Modal>
  );
}

import { useState } from 'react';
import Modal, { ModalClose } from '../ui/Modal';

export default function EmailGateModal({ isOpen, onClose, onProceed }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  function validate(value) {
    const v = value.trim().toLowerCase();
    if (!v) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Enter a valid email address.';
    return '';
  }

  function handleSubmit() {
    const err = validate(email);
    if (err) { setError(err); return; }
    setError('');
    onProceed(email.trim().toLowerCase());
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

        <h2 className="text-xl font-bold mb-1">Enter your email to continue</h2>
        <p className="text-slate-400 text-sm mb-6">
          We'll use this to set up your account and send your lead feed access.
        </p>

        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          autoFocus
          className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400/40 text-sm mb-2"
        />

        {error && (
          <p className="text-red-400 text-xs mb-3">{error}</p>
        )}

        {!error && <div className="mb-3" />}

        <button
          onClick={handleSubmit}
          className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-3 rounded-xl transition"
        >
          Continue
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

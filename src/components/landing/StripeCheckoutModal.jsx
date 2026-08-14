import { useEffect, useRef, useState } from 'react';
import Modal, { ModalClose } from '../ui/Modal';
import { fetchZipScarcity } from '../../api/scarcity';
import { VOICE_CONSENT_TEXT, VOICE_CONSENT_VERSION } from '../shared/TermsConsentGate';

function CheckoutScarcityBadge({ zip, vertical }) {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (!zip || !vertical) return;
    const controller = new AbortController();
    fetchZipScarcity(zip, vertical, { signal: controller.signal })
      .then((data) => { if (!controller.signal.aborted) setStatus(data.status); })
      .catch(() => {});
    return () => controller.abort();
  }, [zip, vertical]);

  if (!status) return null;
  return (
    <div className={`mb-3 flex items-center justify-center gap-2 text-xs font-semibold rounded-lg px-3 py-2 border ${
      status === 'available'
        ? 'text-green-400 border-green-400/30 bg-green-400/10'
        : 'text-red-400 border-red-400/30 bg-red-400/10'
    }`}>
      <span>ZIP {zip} ×</span>
      <span className="capitalize">{vertical?.replace(/_/g, ' ')}</span>
      <span>—</span>
      <span>{status === 'available' ? 'Available' : 'Taken'}</span>
    </div>
  );
}

export default function StripeCheckoutModal({ isOpen, onClose, loading, error, embeddedRef, zip, vertical, phone, voiceConsented }) {
  const mountRef = useRef(null);

  useEffect(() => {
    if (isOpen && !loading && !error && embeddedRef.current && mountRef.current) {
      mountRef.current.innerHTML = '';
      embeddedRef.current.mount(mountRef.current);
    }
  }, [isOpen, loading, error, embeddedRef]);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="relative" style={{ background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1.25rem', padding: '2rem', width: '100%', maxWidth: '1040px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}>
        <ModalClose onClick={onClose} />
        {loading && (
          <p className="text-slate-400 text-sm text-center py-8">Loading checkout...</p>
        )}
        {error && (
          <p className="text-red-400 text-sm text-center py-8">{error}</p>
        )}
        {zip && vertical && <CheckoutScarcityBadge zip={zip} vertical={vertical} />}
        <p className="text-slate-400 text-xs text-center mb-3">Cancel anytime. No long-term contract. Billed monthly.</p>
        {phone && (
          <div className="flex items-start gap-2 mb-4 p-3 rounded-lg border border-white/10 bg-white/5">
            <input
              type="checkbox"
              id="checkout-voice-consent"
              checked={voiceConsented}
              readOnly
              className="mt-0.5 w-4 h-4 rounded border border-white/20 bg-white/10 text-yellow-400 shrink-0"
            />
            <label htmlFor="checkout-voice-consent" className="text-xs text-slate-400 leading-snug">
              {VOICE_CONSENT_TEXT}
              {voiceConsented && (
                <span className="ml-1 text-green-400 font-semibold">(v{VOICE_CONSENT_VERSION})</span>
              )}
            </label>
          </div>
        )}
        <div ref={mountRef} />
      </div>
    </Modal>
  );
}

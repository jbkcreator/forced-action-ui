import { useEffect, useRef } from 'react';
import Modal, { ModalClose } from '../ui/Modal';

export default function StripeCheckoutModal({ isOpen, onClose, loading, error, embeddedRef }) {
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
        <p className="text-slate-400 text-xs text-center mb-3">Cancel anytime. No long-term contract. Billed monthly.</p>
        <div ref={mountRef} />
      </div>
    </Modal>
  );
}

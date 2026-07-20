import Modal, { ModalClose } from '../ui/Modal';
import PricingCard from '../landing/PricingCard';

export default function TierSelectModal({ isOpen, onClose, vertical, countyId, pricing, loading, error, onSelectTier }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div
        className="relative"
        style={{
          background: 'rgba(15,23,42,0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '1.25rem',
          padding: '2rem',
          width: '100%',
          maxWidth: '980px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
        }}
      >
        <ModalClose onClick={onClose} />
        <h2 className="text-xl font-bold mb-1">Lock a territory</h2>
        <p className="text-slate-400 text-sm mb-6">
          Own a ZIP — every qualified lead in it delivered to you automatically. Pick a plan.
        </p>

        {loading && <p className="text-slate-400 text-sm text-center py-8">Loading plans...</p>}
        {error && <p className="text-red-400 text-sm text-center py-8">{error}</p>}

        {!loading && !error && pricing && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <PricingCard tier="starter" vertical={vertical} countyId={countyId} pricing={pricing} onCheckout={onSelectTier} />
            <PricingCard tier="pro" isPopular vertical={vertical} countyId={countyId} pricing={pricing} onCheckout={onSelectTier} />
            <PricingCard tier="dominator" vertical={vertical} countyId={countyId} pricing={pricing} onCheckout={onSelectTier} />
          </div>
        )}
      </div>
    </Modal>
  );
}

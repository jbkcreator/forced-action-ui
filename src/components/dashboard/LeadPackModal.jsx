import { useEffect, useRef } from 'react';
import Modal from '../ui/Modal';
import { formatCentsAsPrice } from '../../utils/format';

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

export default function LeadPackModal({ isOpen, onClose, zip, vertical, segment, amount, currency, step, error, processing, onStartPayment, onConfirmPayment }) {
  const mountRef = useRef(null);
  // ADR 0032 — segment packs are premium-priced in Stripe (Josh sets $), never
  // hardcoded here. Falls back to the standard $99 copy when no segment price is known.
  const price = segment ? formatCentsAsPrice(amount, currency) : null;
  const payLabel = price ? `Pay ${price} — Get My Leads` : 'Pay $99 — Get My Leads';
  const payButtonLabel = price ? `Pay ${price}` : 'Pay $99';

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="glass-strong rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl shadow-black/50">

        {/* Step: Choose */}
        {step === 'choose' && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400/20 to-purple-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold">Buy Lead Pack</h2>
            </div>
            <p className="text-slate-300 text-sm mb-5 font-medium">ZIP {zip} — {capitalize(vertical)}</p>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              You'll receive 5 exclusive distressed property leads for this ZIP, scored for your vertical.
              Exclusivity lasts <strong className="text-white">72 hours</strong> — no other subscriber sees them during that window.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={onStartPayment}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-900 font-bold transition-all duration-200 shadow-lg shadow-yellow-400/20"
              >
                {payLabel}
              </button>
              <button onClick={onClose} className="w-full py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 font-medium transition-all duration-200">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Step: Payment */}
        {step === 'payment' && (
          <div>
            <h2 className="text-xl font-bold mb-6">Complete Payment</h2>
            <div ref={mountRef} id="lp-payment-element" className="mb-6" />
            {error && (
              <div className="mb-4 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
                {error}
              </div>
            )}
            <div className="flex flex-col gap-3">
              <button
                onClick={onConfirmPayment}
                disabled={processing}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-900 font-bold transition-all duration-200 shadow-lg shadow-yellow-400/20 disabled:opacity-50"
              >
                {processing ? 'Processing...' : payButtonLabel}
              </button>
              <button onClick={onClose} className="w-full py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 font-medium transition-all duration-200">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Step: Success */}
        {step === 'success' && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-400/10 border-2 border-green-400 mb-6">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2">Leads on the way!</h2>
            <p className="text-slate-300 text-sm mb-6 leading-relaxed">
              Your 5 exclusive leads are being prepared and will arrive in your email within a minute.
            </p>
            <button onClick={onClose} className="w-full py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 font-medium transition-all duration-200">
              Close
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

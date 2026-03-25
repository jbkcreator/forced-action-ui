import Modal from '../ui/Modal';

export default function CancelModal({ isOpen, onClose, onConfirm }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="glass-strong rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl shadow-black/50">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold">Are you sure you want to cancel?</h2>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed mb-6">
          Cancelling forfeits your Founding Member rate lock permanently.
          If you resubscribe, you will pay the current regular price.
          There are no refunds for the current billing period.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold transition-all duration-200 shadow-lg shadow-red-500/20"
          >
            Yes, cancel my subscription
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 font-medium transition-all duration-200"
          >
            Keep my subscription
          </button>
        </div>
      </div>
    </Modal>
  );
}

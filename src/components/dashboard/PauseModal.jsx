import { useState } from 'react';
import Modal from '../ui/Modal';
import { pauseSubscription } from '../../api/pause';

export default function PauseModal({ isOpen, onClose, feedUuid, onPaused }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const resumeDate = new Date(Date.now() + 60 * 86400000);
  const formatted = resumeDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  const onConfirm = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await pauseSubscription(feedUuid, 60);
      onPaused?.(res);
      onClose();
    } catch (e) {
      setError(e?.detail?.message || e?.message || 'Pause failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="glass-strong rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <h2 className="text-xl font-bold mb-3 text-white">Pause for 60 days?</h2>
        <ul className="text-slate-300 text-sm space-y-2 mb-5 list-none">
          <li>• Billing pauses immediately. No charges until <strong>{formatted}</strong>.</li>
          <li>• Your ZIP territory stays reserved.</li>
          <li>• Cora messages and lead emails stop during pause.</li>
          <li>• Auto-resumes on {formatted}. Reminder sent 7 days before.</li>
        </ul>
        {error && <p className="text-red-400 text-sm mb-3" role="alert">{error}</p>}
        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            disabled={submitting}
            type="button"
            className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Pausing…' : 'Yes, pause 60 days'}
          </button>
          <button
            onClick={onClose}
            disabled={submitting}
            type="button"
            className="w-full py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 transition-colors"
          >
            Keep active
          </button>
        </div>
      </div>
    </Modal>
  );
}

import { useState } from 'react';
import { resumeSubscription } from '../../api/pause';

export default function PauseStatusBanner({ resumeAt, feedUuid, onResumed }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const resumeDate = resumeAt
    ? new Date(resumeAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  const handleResume = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await resumeSubscription(feedUuid);
      onResumed?.(res);
    } catch (e) {
      setError(e?.detail?.message || e?.message || 'Resume failed.');
      setSubmitting(false);
    }
  };

  return (
    <div
      className="mb-5 rounded-xl border border-amber-400/40 bg-amber-400/10 px-5 py-4 flex items-center justify-between gap-4 flex-wrap"
      role="status"
    >
      <div className="min-w-0">
        <p className="text-amber-300 font-semibold text-sm">
          Account paused{resumeDate ? ` — auto-resumes ${resumeDate}` : ''}.
        </p>
        <p className="text-slate-400 text-xs mt-0.5">Your ZIP territory is reserved. Lead feed paused.</p>
        {error && <p className="text-red-400 text-xs mt-1" role="alert">{error}</p>}
      </div>
      <button
        onClick={handleResume}
        disabled={submitting}
        type="button"
        className="shrink-0 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-sm disabled:opacity-50 transition-colors"
      >
        {submitting ? 'Resuming…' : 'Resume now'}
      </button>
    </div>
  );
}

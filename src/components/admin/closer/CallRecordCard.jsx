
const SENTIMENT_COLORS = {
  positive: { bg: 'rgba(74,222,128,0.12)',  text: '#4ade80', border: 'rgba(74,222,128,0.25)' },
  neutral:  { bg: 'rgba(148,163,184,0.12)', text: '#94a3b8', border: 'rgba(148,163,184,0.25)' },
  negative: { bg: 'rgba(248,113,113,0.12)', text: '#f87171', border: 'rgba(248,113,113,0.25)' },
  mixed:    { bg: 'rgba(251,191,36,0.12)',  text: '#fbbf24', border: 'rgba(251,191,36,0.25)' },
};

const OUTCOME_LABELS = {
  committed: 'Committed',
  callback_scheduled: 'Callback scheduled',
  undecided: 'Undecided',
  declined: 'Declined',
  no_meaningful_conversation: 'No meaningful conversation',
};

const OBJECTION_LABELS = {
  price_too_high: 'Price too high',
  lead_quality_doubt: 'Doubts quality',
  no_roi_yet: 'No ROI yet',
  already_has_leads: 'Has leads',
  capacity_too_busy: 'Too busy',
  timing_seasonal: 'Bad timing',
  needs_partner_approval: 'Needs approval',
  exclusivity_concern: 'Exclusivity',
  commitment_fear: 'Commitment fear',
  trust_skepticism: 'Skeptical',
  tech_friction: 'Tech friction',
  wants_to_think: 'Thinking',
  other: 'Other',
};

function fmtDuration(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
}

export default function CallRecordCard({ call }) {
  const sentiment = call.sentiment ? SENTIMENT_COLORS[call.sentiment] : null;
  const objections = call.objections || [];
  const followUps = call.follow_ups || [];

  async function handlePlayRecording() {
    if (recordingUrl) return;
    setLoadingRec(true);
    setRecError('');
    try {
      const data = await fetchCallRecording(token, call.id);
      setRecordingUrl(data.recording_url);
    } catch (e) {
      setRecError(e.detail || 'Failed to load recording');
    } finally {
      setLoadingRec(false);
    }
  }

  return (
    <div
      className="rounded-xl p-3 space-y-2"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-300 font-medium">{fmtDate(call.started_at)}</span>
          <span className="text-[10px] text-slate-500">{fmtDuration(call.duration_sec)}</span>
          {call.closer_name && (
            <span className="text-[10px] text-slate-600">· {call.closer_name}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {sentiment && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full font-medium capitalize"
              style={{ background: sentiment.bg, color: sentiment.text, border: `1px solid ${sentiment.border}` }}
            >
              {call.sentiment}
            </span>
          )}
          {!call.tagged_at && (
            <span className="text-[10px] text-slate-600 italic">tagging pending…</span>
          )}
        </div>
      </div>

      {/* Outcome */}
      {call.call_outcome && (
        <p className="text-[11px] text-slate-400">
          Outcome: <span className="text-slate-200">{OUTCOME_LABELS[call.call_outcome] || call.call_outcome}</span>
        </p>
      )}

      {/* Objections */}
      {objections.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {objections.map(o => (
            <span
              key={o}
              className="text-[9px] px-1.5 py-0.5 rounded-full"
              style={{ background: 'rgba(251,146,60,0.1)', color: '#fb923c', border: '1px solid rgba(251,146,60,0.2)' }}
            >
              {OBJECTION_LABELS[o] || o}
            </span>
          ))}
        </div>
      )}

      {/* Follow-ups */}
      {followUps.length > 0 && (
        <div className="space-y-0.5">
          {followUps.map((f, i) => (
            <p key={i} className="text-[10px] text-slate-400">
              → {f.commitment}{f.due_date ? ` (by ${f.due_date})` : ''}
            </p>
          ))}
        </div>
      )}

      {/* Transcript available indicator — processed by backend via Aircall webhook */}
      {call.transcript_available && (
        <p className="text-[10px] text-slate-600">Transcript processed</p>
      )}
    </div>
  );
}

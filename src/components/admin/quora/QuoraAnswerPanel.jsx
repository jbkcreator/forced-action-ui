import { useState } from 'react';
import { updateQuoraDraft, postQuoraAnswer } from '../../../api/quora';

function priorityColor(score) {
  if (score >= 80) return '#4ade80';
  if (score >= 60) return '#facc15';
  return '#f87171';
}

function riskColor(level) {
  if (level === 'low')    return { bg: 'rgba(74,222,128,0.12)', fg: '#4ade80' };
  if (level === 'medium') return { bg: 'rgba(250,204,21,0.12)', fg: '#facc15' };
  return { bg: 'rgba(248,113,113,0.12)', fg: '#f87171' };
}

function laneLabel(lane) {
  if (!lane) return 'General';
  return lane.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export default function QuoraAnswerPanel({ item, token, onPosted, onDraftSaved, showToast }) {
  const [editing, setEditing]     = useState(false);
  const [editText, setEditText]   = useState('');
  const [saving, setSaving]       = useState(false);
  const [posting, setPosting]     = useState(false);

  if (!item) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-500 text-sm">Select a question to review its answer draft</p>
      </div>
    );
  }

  const answerMarkdown = item.answer_draft?.answer_markdown || '';
  const { bg: riskBg, fg: riskFg } = riskColor(item.risk_level);

  function startEdit() {
    setEditText(answerMarkdown);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setEditText('');
  }

  async function saveDraft() {
    setSaving(true);
    try {
      await updateQuoraDraft(token, item.id, editText);
      onDraftSaved(item.id, editText);
      setEditing(false);
      setEditText('');
      showToast('Draft saved');
    } catch (err) {
      showToast(err.detail || err.message || 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handlePost() {
    setPosting(true);
    try {
      await postQuoraAnswer(token, item.id);
      onPosted(item.id);
      showToast('Answer posted to Quora');
    } catch (err) {
      showToast(err.detail || err.message || 'Post failed', 'error');
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="shrink-0 px-6 py-5 border-b border-white/10">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-base font-semibold text-white leading-snug flex-1">{item.title}</h2>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-slate-500 hover:text-slate-300 transition-colors mt-0.5"
            title="Open on Quora"
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>

        {/* Meta badges */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className="text-[11px] px-2 py-0.5 rounded-full font-medium"
            style={{ background: 'rgba(250,204,21,0.12)', color: '#facc15' }}>
            {laneLabel(item.intent_lane)}
          </span>
          <span className="text-[11px] font-bold tabular-nums"
            style={{ color: priorityColor(item.priority_score) }}>
            P{item.priority_score}
          </span>
          {item.risk_level && (
            <span className="text-[11px] px-2 py-0.5 rounded-full font-medium"
              style={{ background: riskBg, color: riskFg }}>
              {item.risk_level} risk
            </span>
          )}
          {item.post_attempts > 0 && (
            <span className="text-[11px] text-orange-400">
              {item.post_attempts} post attempt{item.post_attempts !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Answer draft */}
      <div className="flex-1 px-6 py-5 min-h-0">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Answer Draft</p>
          {!editing && (
            <button
              type="button"
              onClick={startEdit}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              Edit
            </button>
          )}
        </div>

        {editing ? (
          <div className="flex flex-col gap-3">
            <textarea
              value={editText}
              onChange={e => setEditText(e.target.value)}
              rows={18}
              className="w-full text-sm text-slate-200 bg-white/5 border border-white/10 rounded-lg
                         px-4 py-3 resize-y focus:outline-none focus:border-white/20 font-mono leading-relaxed"
              spellCheck={false}
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={cancelEdit}
                disabled={saving}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white transition-colors rounded-lg"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveDraft}
                disabled={saving}
                className="px-4 py-2 text-xs font-medium rounded-lg transition-colors"
                style={{
                  background: saving ? 'rgba(250,204,21,0.3)' : 'rgba(250,204,21,0.15)',
                  color: saving ? '#b45309' : '#facc15',
                }}
              >
                {saving ? 'Saving…' : 'Save Draft'}
              </button>
            </div>
          </div>
        ) : (
          <div
            className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap rounded-lg px-4 py-4"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {answerMarkdown || <span className="text-slate-600 italic">No answer draft available</span>}
          </div>
        )}

        {/* Error log */}
        {item.error_log && (
          <div className="mt-4 px-4 py-3 rounded-lg text-xs text-red-400 font-mono"
            style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)' }}>
            <p className="font-semibold text-red-300 mb-1">Last error</p>
            {item.error_log}
          </div>
        )}
      </div>

      {/* Post action */}
      {!editing && (
        <div className="shrink-0 px-6 py-5 border-t border-white/10">
          <button
            type="button"
            onClick={handlePost}
            disabled={posting || !answerMarkdown}
            className="w-full py-3 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: posting || !answerMarkdown
                ? 'rgba(250,204,21,0.1)'
                : 'rgba(250,204,21,0.18)',
              color: posting || !answerMarkdown ? '#78716c' : '#facc15',
              border: '1px solid rgba(250,204,21,0.2)',
              cursor: posting || !answerMarkdown ? 'not-allowed' : 'pointer',
            }}
          >
            {posting ? 'Posting…' : 'Post to Quora'}
          </button>
          {item.post_attempts >= 3 && (
            <p className="text-[11px] text-red-400 text-center mt-2">
              Max attempts reached — manual intervention required
            </p>
          )}
        </div>
      )}
    </div>
  );
}

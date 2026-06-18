import { useState, useEffect, useRef } from 'react';
import { dial } from '../../../lib/aircall';
import { createCloserCall, saveCallFeedback, saveEscalationOutcome } from '../../../api/closer';
import FeedbackForm from './FeedbackForm';
import OutcomeBar from './OutcomeBar';
import AircallWidget from './AircallWidget';

const card = { background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)' };

// Active call states
const CALL_STATE = {
  IDLE: 'idle',
  DIALING: 'dialing',
  ANSWERED: 'answered',
  ENDED: 'ended',
};

function ActiveCallBar({ state, name, duration }) {
  if (state === CALL_STATE.IDLE) return null;

  const color = state === CALL_STATE.ANSWERED ? '#4ade80'
    : state === CALL_STATE.ENDED ? '#94a3b8'
    : '#facc15';

  const label = state === CALL_STATE.DIALING ? `Calling ${name}…`
    : state === CALL_STATE.ANSWERED ? `Connected · ${name}`
    : `Call ended · ${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, '0')}`;

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium"
      style={{ background: `${color}12`, border: `1px solid ${color}30`, color }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{
          background: color,
          animation: state === CALL_STATE.ANSWERED ? 'pulse 1.5s infinite' : 'none',
        }}
      />
      {label}
    </div>
  );
}

export default function ContactPanel({ token, queueItem, onOutcomeSuccess, showToast }) {
  const [aircallLoggedIn, setAircallLoggedIn] = useState(false);
  const [widgetKey, setWidgetKey] = useState(0);
  const [callState, setCallState] = useState(CALL_STATE.IDLE);
  const [callDuration, setCallDuration] = useState(0);
  const [activeCallDbId, setActiveCallDbId] = useState(null);
  const [dialError, setDialError] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [outcomeSaving, setOutcomeSaving] = useState(false);
  const timerRef = useRef(null);

  // Reset call state when prospect changes
  useEffect(() => {
    setCallState(CALL_STATE.IDLE);
    setCallDuration(0);
    setActiveCallDbId(null);
    setDialError('');
    return () => clearInterval(timerRef.current);
  }, [queueItem?.id]);

  // ── Aircall event handlers ──────────────────────────────────────────────────

  function handleAircallLogin() { setAircallLoggedIn(true); }
  function handleAircallLogout() { setAircallLoggedIn(false); }

  async function handleOutgoingCall({ call_id, to }) {
    setCallState(CALL_STATE.DIALING);
    if (!queueItem) return;
    try {
      const row = await createCloserCall(token, {
        aircall_call_id: String(call_id),
        subscriber_id: queueItem.subscriber_id,
        escalation_id: queueItem.id,
        dialed_e164: to || queueItem.subscriber_phone,
      });
      setActiveCallDbId(row.id);
    } catch (e) {
      // Non-fatal — feedback will be unavailable; show error
      setDialError('Could not create call record: ' + (e.detail || e.message));
    }
  }

  function handleOutgoingAnswered() {
    setCallState(CALL_STATE.ANSWERED);
    setCallDuration(0);
    timerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
  }

  function handleCallEnded({ duration }) {
    clearInterval(timerRef.current);
    setCallState(CALL_STATE.ENDED);
    setCallDuration(duration || callDuration);
  }

  // ── Dial ───────────────────────────────────────────────────────────────────

  async function handleDial() {
    if (!queueItem) return;
    setDialError('');
    try {
      await dial(queueItem.subscriber_phone);
    } catch (e) {
      const msg = e.error === 'not_ready' || e.error === 'not_initialized'
        ? 'Log into Aircall in the widget below first.'
        : e.error === 'in_call'
        ? 'Already in a call.'
        : 'Dial failed: ' + (e.error || 'unknown');
      setDialError(msg);
    }
  }

  // ── Feedback ───────────────────────────────────────────────────────────────

  async function handleFeedbackSubmit(payload) {
    if (!activeCallDbId) {
      showToast('Call record not found — feedback cannot be saved. Check console for details.', 'error');
      return;
    }
    setFeedbackSubmitting(true);
    try {
      await saveCallFeedback(token, activeCallDbId, payload);
      showToast('Feedback saved.', 'success');
    } catch (e) {
      showToast('Failed to save feedback: ' + (e.detail || e.message), 'error');
    } finally {
      setFeedbackSubmitting(false);
    }
  }

  // ── Outcome ────────────────────────────────────────────────────────────────

  async function handleOutcome(outcome) {
    if (!queueItem) return;
    setOutcomeSaving(true);
    try {
      await saveEscalationOutcome(token, queueItem.id, outcome);
      showToast(`Marked as "${outcome}". Prospect removed from queue.`, 'success');
      onOutcomeSuccess(queueItem.id);
    } catch (e) {
      showToast('Failed to update outcome: ' + (e.detail || e.message), 'error');
    } finally {
      setOutcomeSaving(false);
    }
  }

  const feedbackDisabled = callState !== CALL_STATE.ENDED;
  const noProspect = !queueItem;

  return (
    <div className="overflow-y-auto h-full">
      <div className="p-4 space-y-4">
        {/* Call controls */}
        <div className="rounded-xl p-4 space-y-3" style={card}>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Call</p>

          <ActiveCallBar
            state={callState}
            name={queueItem?.subscriber_name || ''}
            duration={callDuration}
          />

          <button
            type="button"
            onClick={handleDial}
            disabled={noProspect || callState === CALL_STATE.DIALING || callState === CALL_STATE.ANSWERED}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-40"
            style={{ background: '#facc15', color: '#0f172a' }}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {noProspect ? 'Select a prospect' : `Call ${queueItem.subscriber_name.split(' ')[0]}`}
          </button>

          {dialError && (
            <p role="alert" className="text-[10px] text-red-400">{dialError}</p>
          )}

          {!aircallLoggedIn && !noProspect && (
            <p className="text-[10px] text-slate-500 text-center">
              Sign in via the Aircall widget below, then click <strong className="text-slate-400">Reload</strong>.
            </p>
          )}
        </div>

        {/* Feedback form */}
        <div className="rounded-xl p-4" style={card}>
          <FeedbackForm
            onSubmit={handleFeedbackSubmit}
            submitting={feedbackSubmitting}
            disabled={feedbackDisabled}
          />
        </div>

        {/* Outcome */}
        <div className="rounded-xl p-4" style={card}>
          <OutcomeBar
            onSave={handleOutcome}
            saving={outcomeSaving}
            disabled={noProspect}
          />
        </div>

        {/* Aircall widget — scrolls with panel, never unmounts */}
        <div
          className="rounded-xl overflow-hidden border-t border-white/10"
          style={{ background: 'rgba(8,13,26,0.8)' }}
        >
          <AircallWidget
            key={widgetKey}
            onLogin={handleAircallLogin}
            onLogout={handleAircallLogout}
            onOutgoingCall={handleOutgoingCall}
            onOutgoingAnswered={handleOutgoingAnswered}
            onCallEnded={handleCallEnded}
            onReload={() => setWidgetKey(k => k + 1)}
            onCallEndRingtone={({ answer_status }) => {
              if (answer_status === 'disconnected' || answer_status === 'refused') {
                clearInterval(timerRef.current);
                setCallState(CALL_STATE.ENDED);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}

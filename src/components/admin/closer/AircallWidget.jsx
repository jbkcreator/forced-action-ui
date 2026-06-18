import { useEffect, useRef, useState, useCallback } from 'react';
import { initAircall, destroyAircall, onCallEvent, offCallEvent, isLoggedIn } from '../../../lib/aircall';

const WIDGET_ID = 'aircall-workspace';

export default function AircallWidget({
  onLogin,
  onLogout,
  onOutgoingCall,
  onOutgoingAnswered,
  onCallEnded,
  onCallEndRingtone,
  onReload, // called when closer clicks Reload — parent increments key to remount
}) {
  const initializedRef = useRef(false);
  const [loggedIn, setLoggedIn] = useState(false);

  const checkLogin = useCallback(async () => {
    const result = await isLoggedIn();
    if (result && !loggedIn) {
      setLoggedIn(true);
      onLogin && onLogin({});
    } else if (!result && loggedIn) {
      setLoggedIn(false);
      onLogout && onLogout();
    }
  }, [loggedIn, onLogin, onLogout]);

  // Poll every 3s as fallback in case onLogin postMessage is missed
  useEffect(() => {
    const id = setInterval(checkLogin, 3000);
    return () => clearInterval(id);
  }, [checkLogin]);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    initAircall(`#${WIDGET_ID}`, {
      onLogin: (settings) => {
        setLoggedIn(true);
        onLogin && onLogin(settings);
      },
      onLogout: () => {
        setLoggedIn(false);
        onLogout && onLogout();
      },
    });

    if (onOutgoingCall)    onCallEvent('outgoing_call',     (d) => { console.log('[Aircall] outgoing_call', d);     onOutgoingCall(d); });
    if (onOutgoingAnswered) onCallEvent('outgoing_answered', (d) => { console.log('[Aircall] outgoing_answered', d); onOutgoingAnswered(d); });
    if (onCallEnded)       onCallEvent('call_ended',         (d) => { console.log('[Aircall] call_ended', d);       onCallEnded(d); });
    if (onCallEndRingtone) onCallEvent('call_end_ringtone',  (d) => { console.log('[Aircall] call_end_ringtone', d); onCallEndRingtone(d); });

    return () => {
      initializedRef.current = false;
      offCallEvent('outgoing_call');
      offCallEvent('outgoing_answered');
      offCallEvent('call_ended');
      offCallEvent('call_end_ringtone');
      destroyAircall();
      // Clear iframe so fresh remount injects a new one
      const el = document.querySelector(`#${WIDGET_ID}`);
      if (el) el.innerHTML = '';
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    // SDK default 'big' size = 376×666px. Container matches to avoid clipping.
    <div style={{ width: 376, height: 700 }}>
      {/* Header */}
      <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <svg className="text-slate-500" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[10px] text-slate-500 font-medium">Aircall workspace</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: loggedIn ? '#4ade80' : '#475569' }} />
          <span className="text-[10px]" style={{ color: loggedIn ? '#4ade80' : '#64748b' }}>
            {loggedIn ? 'Ready' : 'Not logged in'}
          </span>
          {!loggedIn && (
            <button
              type="button"
              onClick={onReload}
              title="After signing in via the new tab, click to reconnect"
              className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded text-slate-400 hover:text-yellow-300 transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M1 4v6h6M23 20v-6h-6" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Reload
            </button>
          )}
        </div>
      </div>

      {/* Iframe target — SDK injects 376×666px iframe here */}
      <div id={WIDGET_ID} style={{ width: 376, height: 666 }} />
    </div>
  );
}

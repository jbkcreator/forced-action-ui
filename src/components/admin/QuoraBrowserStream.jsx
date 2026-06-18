import { useCallback, useEffect, useRef, useState } from 'react';

const BROWSER_W = 1280;
const BROWSER_H = 800;

export default function QuoraBrowserStream({ token }) {
  const [status, setStatus]   = useState('idle');   // idle | connecting | streaming | done | error
  const [frame, setFrame]     = useState(null);
  const [currentUrl, setUrl]  = useState('');
  const [statusMsg, setMsg]   = useState('');
  const [result, setResult]   = useState(null);

  const wsRef        = useRef(null);
  const imgRef       = useRef(null);
  const containerRef = useRef(null);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  useEffect(() => () => disconnect(), [disconnect]);

  function connect() {
    if (wsRef.current) return;
    setStatus('connecting');
    setFrame(null);
    setResult(null);
    setMsg('Connecting…');

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(
      `${protocol}//${window.location.host}/api/admin/quora/auth/ws?token=${encodeURIComponent(token)}`
    );
    wsRef.current = ws;

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === 'frame') {
        setFrame(msg.data);
        setUrl(msg.url || '');
        if (status !== 'streaming') setStatus('streaming');
      } else if (msg.type === 'status') {
        setMsg(msg.msg);
      } else if (msg.type === 'done') {
        setResult(msg);
        setStatus('done');
        ws.close();
      } else if (msg.type === 'error') {
        setMsg(msg.msg);
        setStatus('error');
        ws.close();
      }
    };

    ws.onopen  = () => { setStatus('streaming'); setMsg('Browser opened'); };
    ws.onclose = () => { if (status !== 'done' && status !== 'error') setStatus('idle'); };
    ws.onerror = () => { setStatus('error'); setMsg('WebSocket error'); };
  }

  // ── Coordinate scaling ──────────────────────────────────────────────────────
  function toBrowserCoords(e) {
    const rect = imgRef.current.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width)  * BROWSER_W,
      y: ((e.clientY - rect.top)  / rect.height) * BROWSER_H,
    };
  }

  function send(msg) {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }

  // ── Event handlers ──────────────────────────────────────────────────────────
  function handleClick(e) {
    e.preventDefault();
    containerRef.current?.focus();
    const { x, y } = toBrowserCoords(e);
    send({ type: 'click', x, y });
  }

  function handleDblClick(e) {
    e.preventDefault();
    const { x, y } = toBrowserCoords(e);
    send({ type: 'dblclick', x, y });
  }

  function handleWheel(e) {
    e.preventDefault();
    send({ type: 'scroll', dy: e.deltaY });
  }

  const SPECIAL = new Set([
    'Enter','Tab','Backspace','Delete','Escape',
    'ArrowLeft','ArrowRight','ArrowUp','ArrowDown',
    'Home','End','PageUp','PageDown',
    'F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12',
  ]);

  function handleKeyDown(e) {
    if (status !== 'streaming') return;
    e.preventDefault();
    if (SPECIAL.has(e.key)) {
      send({ type: 'special_key', key: e.key });
    } else if (e.key.length === 1) {
      send({ type: 'key', text: e.key });
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-semibold text-sm">Quora Session Auth</h2>
          <p className="text-slate-400 text-xs mt-0.5">
            Log in inside the browser below — session is captured automatically on success.
          </p>
        </div>
        <div className="flex gap-2">
          {status === 'idle' || status === 'error' ? (
            <button
              onClick={connect}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-yellow-400 text-slate-900 hover:bg-yellow-300 transition-colors"
            >
              Start Session
            </button>
          ) : status === 'streaming' || status === 'connecting' ? (
            <button
              onClick={disconnect}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-600 text-slate-400 hover:text-slate-200 transition-colors"
            >
              Disconnect
            </button>
          ) : null}
        </div>
      </div>

      {/* Status bar */}
      {(statusMsg || currentUrl) && (
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/50 rounded-lg px-3 py-2">
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{
              background:
                status === 'streaming' ? '#22c55e'
                : status === 'done'    ? '#facc15'
                : status === 'error'   ? '#ef4444'
                : '#64748b',
            }}
          />
          <span className="truncate">{statusMsg || currentUrl}</span>
        </div>
      )}

      {/* Browser stream */}
      {(status === 'streaming' || status === 'connecting') && (
        <div
          ref={containerRef}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          className="outline-none rounded-xl overflow-hidden"
          style={{
            border: '1px solid rgba(255,255,255,0.08)',
            background: '#1e293b',
            cursor: 'default',
            aspectRatio: `${BROWSER_W} / ${BROWSER_H}`,
          }}
        >
          {frame ? (
            <img
              ref={imgRef}
              src={`data:image/jpeg;base64,${frame}`}
              alt="Browser stream"
              draggable={false}
              onClick={handleClick}
              onDoubleClick={handleDblClick}
              onWheel={handleWheel}
              style={{ width: '100%', height: '100%', display: 'block', userSelect: 'none' }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">
              Waiting for browser…
            </div>
          )}
        </div>
      )}

      {/* Interaction hint */}
      {status === 'streaming' && frame && (
        <p className="text-xs text-slate-500">
          Click inside the browser above to focus, then type normally.
          Tab, Enter, Backspace, arrow keys all work.
        </p>
      )}

      {/* Done state */}
      {status === 'done' && result && (
        <div className="rounded-xl p-4 space-y-2" style={{ background: 'rgba(250,204,21,0.06)', border: '1px solid rgba(250,204,21,0.15)' }}>
          <p className="text-yellow-400 font-medium text-sm">Session captured successfully</p>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="text-center">
              <p className="text-white font-semibold text-lg">{result.cookies}</p>
              <p className="text-slate-400">cookies saved</p>
            </div>
            <div className="text-center">
              <p className="text-white font-semibold text-lg">{result.formkey ? 'yes' : 'no'}</p>
              <p className="text-slate-400">formkey</p>
            </div>
            <div className="text-center">
              <p className="text-white font-semibold text-sm truncate">{result.gql_query || '—'}</p>
              <p className="text-slate-400">GQL query</p>
            </div>
          </div>
          <button
            onClick={() => { setStatus('idle'); setFrame(null); setResult(null); setMsg(''); }}
            className="text-xs text-slate-400 hover:text-slate-200 underline"
          >
            Start new session
          </button>
        </div>
      )}

      {/* Error state */}
      {status === 'error' && (
        <div className="rounded-xl p-4 text-sm text-red-400" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
          {statusMsg || 'Connection failed — check server logs.'}
        </div>
      )}
    </div>
  );
}

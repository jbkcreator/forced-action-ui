import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchAttributionTrace } from '../../api/admin';

const card = { background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)' };

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

function Field({ label, value, mono = false, highlight = false }) {
  return (
    <div>
      <div className="text-xs text-slate-500 mb-0.5">{label}</div>
      <div className={`text-sm ${mono ? 'font-mono' : ''} ${highlight ? 'text-yellow-400' : 'text-slate-200'} break-all`}>
        {value ?? <span className="text-slate-600">—</span>}
      </div>
    </div>
  );
}

function statusBadge(val) {
  if (val === 'complete')   return { cls: 'text-xs px-2 py-0.5 rounded-full bg-emerald-400/10 text-emerald-400' };
  if (val === 'partial')    return { cls: 'text-xs px-2 py-0.5 rounded-full bg-yellow-400/10 text-yellow-400' };
  return { cls: 'text-xs px-2 py-0.5 rounded-full bg-red-400/10 text-red-400' };
}

export default function AttributionTrace({ token, initialEventId = null }) {
  const [inputId, setInputId] = useState(initialEventId != null ? String(initialEventId) : '');
  const [loading, setLoading] = useState(false);
  const [data, setData]       = useState(null);
  const [status, setStatus]   = useState('idle');
  const [errMsg, setErrMsg]   = useState('');
  const abortRef = useRef(null);

  const lookup = useCallback((idOverride) => {
    const id = (idOverride != null ? String(idOverride) : inputId).trim();
    if (!id || !/^\d+$/.test(id)) return;
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setData(null);
    setErrMsg('');
    setStatus('idle');
    fetchAttributionTrace(token, id, { signal: ctrl.signal })
      .then(d => { setData(d); setStatus('loaded'); })
      .catch(e => {
        if (e.name === 'AbortError') return;
        if (e.status === 404) setStatus('not_found');
        else { setStatus('error'); setErrMsg(e.detail || e.message || 'Request failed'); }
      })
      .finally(() => setLoading(false));
  }, [token, inputId]);

  // Auto-load when initialEventId is injected via cross-tab navigation.
  useEffect(() => {
    if (initialEventId != null) {
      setInputId(String(initialEventId));
      lookup(initialEventId);
    }
  }, [initialEventId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleKey = (e) => { if (e.key === 'Enter') lookup(); };

  const ae = data?.attribution_event ?? null;
  const se = data?.score_event       ?? null;

  return (
    <div className="space-y-5">
      {/* Input */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={inputId}
          onChange={e => setInputId(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Attribution Event ID"
          className="w-48 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-yellow-400/40"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
        />
        <button type="button" onClick={() => lookup()} disabled={loading || !inputId.trim()}
          className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-900 disabled:opacity-40 transition-opacity"
          style={{ background: '#facc15' }}>
          {loading ? 'Loading…' : 'Trace'}
        </button>
      </div>

      {status === 'idle' && !loading && (
        <p className="text-slate-500 text-sm py-4">Enter an attribution event ID to trace it to its source.</p>
      )}
      {status === 'not_found' && (
        <div role="alert" className="text-sm text-red-400 bg-red-950/60 border border-red-800/60 rounded-lg px-4 py-3">
          Attribution event not found.
        </div>
      )}
      {status === 'error' && (
        <div role="alert" className="text-sm text-red-400 bg-red-950/60 border border-red-800/60 rounded-lg px-4 py-3">
          {errMsg}
        </div>
      )}

      {status === 'loaded' && ae && (
        <div className="space-y-4">
          {/* Attribution Event */}
          <div className="rounded-xl p-5 space-y-4" style={card}>
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Attribution Event #{ae.id}</p>
              <div className="flex items-center gap-2">
                <span className={statusBadge(ae.attribution_status).cls}>{ae.attribution_status}</span>
                <span className={statusBadge(ae.attribution_confidence).cls}>{ae.attribution_confidence}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              {/* Left column */}
              <div className="space-y-3">
                <Field label="Conversion Type" value={ae.conversion_type} highlight />
                <Field label="Source Table"    value={ae.source_table}    mono />
                <Field label="Source Event ID" value={ae.source_event_id} mono />
                <Field label="Subscriber ID"   value={ae.subscriber_id} />
                <Field label="Occurred At"     value={fmtDate(ae.occurred_at)} />
                <Field label="Created At"      value={fmtDate(ae.created_at)} />
              </div>
              {/* Right column */}
              <div className="space-y-3">
                <Field label="ZIP Code"       value={ae.zip_code}         mono />
                <Field label="Trade"          value={ae.trade} />
                <Field label="Wallet Tier"    value={ae.wallet_tier} />
                <Field label="Lock Status"    value={ae.lock_status} />
                <Field label="Lock ZIP"       value={ae.lock_zip}         mono />
                <Field label="AutoPilot Tier" value={ae.autopilot_tier} />
                <Field label="Bundle Type"    value={ae.bundle_type} />
                <Field label="Deal Size"      value={ae.deal_size_bucket} />
                {ae.revenue_amount != null && (
                  <Field label="Revenue" value={`$${Number(ae.revenue_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`} />
                )}
              </div>
            </div>

            {/* Metadata JSON */}
            {ae.attribution_metadata && Object.keys(ae.attribution_metadata).length > 0 && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Attribution Metadata</p>
                <pre className="rounded-lg p-3 text-xs text-slate-400 font-mono overflow-x-auto"
                  style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  {JSON.stringify(ae.attribution_metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Linked Score Event */}
          {se ? (
            <div className="rounded-xl p-5 space-y-4" style={card}>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">
                Linked Score Event #{se.id}
              </p>
              <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                <div className="space-y-3">
                  <Field label="Action Type" value={se.action_type} mono />
                  <div>
                    <div className="text-xs text-slate-500 mb-0.5">Score Change</div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-slate-400">{se.old_score ?? '—'}</span>
                      <span className="text-slate-600">→</span>
                      <span className="text-white font-medium">{se.new_score ?? '—'}</span>
                      <span className={`font-mono text-xs ${(se.delta ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {(se.delta ?? 0) >= 0 ? `+${se.delta}` : se.delta}
                      </span>
                    </div>
                  </div>
                  <Field label="Band"       value={se.band} />
                  <Field label="Created At" value={fmtDate(se.created_at)} />
                </div>
                <div className="space-y-3">
                  {se.metadata?.attribution_event_id != null && (
                    <div>
                      <div className="text-xs text-slate-500 mb-0.5">Attribution Event ID (linked)</div>
                      <div className="text-sm text-yellow-400 font-mono">{se.metadata.attribution_event_id}</div>
                    </div>
                  )}
                </div>
              </div>

              {se.breakdown && Object.keys(se.breakdown).length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Score Breakdown</p>
                  <pre className="rounded-lg p-3 text-xs text-slate-400 font-mono overflow-x-auto"
                    style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    {JSON.stringify(se.breakdown, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl p-4 text-sm text-slate-500 text-center" style={card}>
              No linked score event for this attribution event.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

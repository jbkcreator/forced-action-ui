import { useCallback, useEffect, useState } from 'react';
import {
  approveMapping,
  fetchApprovedMappings,
  fetchPendingMappings,
  fetchRejectedMappings,
  rejectMapping,
  updateMapping,
} from '../../api/admin';

const card = { background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)' };
const inputCls = 'rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-yellow-400/40';
const inputStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' };

const TABS = ['pending', 'approved', 'rejected'];

// ─── Shared helpers ───────────────────────────────────────────────────────────

function Badge({ children, color = 'slate' }) {
  const colors = {
    green:  { bg: 'rgba(16,185,129,0.12)',  color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.25)' },
    yellow: { bg: 'rgba(250,204,21,0.12)',  color: '#fde68a', border: '1px solid rgba(250,204,21,0.25)' },
    blue:   { bg: 'rgba(96,165,250,0.12)',  color: '#93c5fd', border: '1px solid rgba(96,165,250,0.25)' },
    red:    { bg: 'rgba(248,113,113,0.12)', color: '#fca5a5', border: '1px solid rgba(248,113,113,0.25)' },
    slate:  { bg: 'rgba(148,163,184,0.1)',  color: '#94a3b8', border: '1px solid rgba(148,163,184,0.2)' },
  };
  const s = colors[color] || colors.slate;
  return (
    <span className="inline-block text-xs px-2 py-0.5 rounded-full font-medium" style={s}>
      {children}
    </span>
  );
}

function Chevron({ open }) {
  return (
    <svg
      width="14" height="14" viewBox="0 0 14 14" fill="none"
      className="transition-transform duration-200 shrink-0"
      style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', color: '#64748b' }}
    >
      <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MappingTable({ sourceCols, mapping, overrides = {}, onOverride, editable = false }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <th className="text-left px-5 py-2.5 text-xs text-slate-500 font-medium w-5/12">Source Column</th>
            <th className="text-left px-5 py-2.5 text-xs text-slate-500 font-medium w-4/12">→ Canonical</th>
            {editable && (
              <th className="text-left px-5 py-2.5 text-xs text-slate-500 font-medium">Override</th>
            )}
          </tr>
        </thead>
        <tbody>
          {(sourceCols || []).map(col => {
            const current = overrides[col] !== undefined ? overrides[col] : (mapping[col] || '');
            const isEdited = overrides[col] !== undefined && overrides[col] !== mapping[col];
            return (
              <tr key={col} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <td className="px-5 py-2 font-mono text-xs text-slate-300 break-all">{col}</td>
                <td className="px-5 py-2">
                  {current ? (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      isEdited
                        ? 'text-yellow-300 bg-yellow-950/40'
                        : 'text-emerald-300 bg-emerald-950/30'
                    }`}>
                      {current}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-600 italic">unmapped</span>
                  )}
                </td>
                {editable && (
                  <td className="px-5 py-2">
                    <input
                      type="text"
                      className={inputCls + ' text-xs w-52'}
                      style={inputStyle}
                      placeholder={mapping[col] || 'pass-through'}
                      value={overrides[col] ?? ''}
                      onChange={e => onOverride(col, e.target.value)}
                    />
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Pending card ─────────────────────────────────────────────────────────────

function PendingCard({ item, token, onResolved }) {
  const { id, source_columns, mapping: proposed, source } = item;
  const [overrides, setOverrides] = useState({});
  const [rejecting, setRejecting] = useState(false);
  const [feedback, setFeedback]   = useState('');
  const [busy, setBusy]           = useState(false);

  const changedCount = Object.keys(overrides).filter(k => overrides[k] !== proposed[k]).length;

  async function handleApprove() {
    setBusy(true);
    try {
      await approveMapping(token, id, changedCount > 0 ? overrides : null);
      onResolved(id, 'approved');
    } catch (e) { alert(`Approve failed: ${e.detail || e.message}`); }
    finally { setBusy(false); }
  }

  async function handleReject() {
    if (!feedback.trim()) return;
    setBusy(true);
    try {
      await rejectMapping(token, id, feedback.trim());
      onResolved(id, 'rejected');
    } catch (e) { alert(`Reject failed: ${e.detail || e.message}`); }
    finally { setBusy(false); }
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={card}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 flex-wrap gap-2"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-sm font-semibold text-white">{source?.county_id}</span>
          <span className="text-slate-600">/</span>
          <Badge color="blue">{source?.signal_type}</Badge>
          {source?.source_name && <span className="text-xs text-slate-500">{source.source_name}</span>}
        </div>
        <span className="text-xs text-slate-600">{(source_columns || []).length} cols</span>
      </div>

      <MappingTable
        sourceCols={source_columns}
        mapping={proposed}
        overrides={overrides}
        onOverride={(col, val) => setOverrides(p => ({ ...p, [col]: val }))}
        editable
      />

      {/* Actions */}
      <div className="px-5 py-4 flex items-start justify-between gap-4 flex-wrap"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2.5">
          <button onClick={handleApprove} disabled={busy}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-900 disabled:opacity-40 transition-opacity"
            style={{ background: '#facc15' }}>
            {busy ? 'Saving…' : changedCount > 0
              ? `Approve with ${changedCount} override${changedCount !== 1 ? 's' : ''}`
              : 'Approve'}
          </button>
          <button onClick={() => setRejecting(v => !v)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 border border-red-800/40 hover:border-red-600/50 transition-colors">
            {rejecting ? 'Cancel' : 'Reject'}
          </button>
          {changedCount > 0 && !rejecting && (
            <button onClick={() => setOverrides({})} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
              Reset
            </button>
          )}
        </div>
        {rejecting && (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <input type="text" className={inputCls + ' flex-1'} style={inputStyle}
              placeholder="Feedback for LLM re-map (required)"
              value={feedback} onChange={e => setFeedback(e.target.value)} autoFocus />
            <button onClick={handleReject} disabled={busy || !feedback.trim()}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-400 border border-red-800/40 disabled:opacity-40 shrink-0">
              {busy ? 'Rejecting…' : 'Confirm Reject'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Approved: single source mapping card (collapsible) ───────────────────────

function ApprovedSourceCard({ item, token, onUpdated }) {
  const { id, source_columns, mapping, mapped_by, approved_by, approved_at, source } = item;
  const [open, setOpen]         = useState(false);
  const [editing, setEditing]   = useState(false);
  const [overrides, setOverrides] = useState({});
  const [busy, setBusy]         = useState(false);

  const changedCount = Object.keys(overrides).filter(k => overrides[k] !== mapping[k]).length;

  function cancel() { setOverrides({}); setEditing(false); }

  async function handleSave() {
    if (changedCount === 0) { setEditing(false); return; }
    setBusy(true);
    try {
      const updated = await updateMapping(token, id, overrides);
      onUpdated(updated);
      setOverrides({});
      setEditing(false);
    } catch (e) { alert(`Save failed: ${e.detail || e.message}`); }
    finally { setBusy(false); }
  }

  const approvedDate = approved_at
    ? new Date(approved_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      {/* Source row header */}
      <button
        type="button"
        onClick={() => { setOpen(v => !v); if (editing) cancel(); }}
        className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-white/[0.02] transition-colors"
      >
        <Chevron open={open} />
        <span className="text-sm text-white font-medium">{source?.signal_type}</span>
        {source?.source_name && <span className="text-xs text-slate-500">{source.source_name}</span>}
        <Badge color={mapped_by === 'human' ? 'green' : 'slate'}>
          {mapped_by === 'human' ? 'human' : 'llm'}
        </Badge>
        <span className="text-xs text-slate-600 ml-auto">
          {(source_columns || []).length} cols
          {approvedDate && ` · ${approvedDate}`}
          {approved_by && ` by ${approved_by}`}
        </span>
      </button>

      {/* Expanded mapping table + edit */}
      {open && (
        <div style={{ background: 'rgba(255,255,255,0.015)' }}>
          <MappingTable
            sourceCols={source_columns}
            mapping={mapping}
            overrides={editing ? overrides : {}}
            onOverride={(col, val) => setOverrides(p => ({ ...p, [col]: val }))}
            editable={editing}
          />
          <div className="px-5 py-3 flex items-center justify-end gap-2"
            style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            {editing ? (
              <>
                <button onClick={handleSave} disabled={busy}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-900 disabled:opacity-40"
                  style={{ background: '#facc15' }}>
                  {busy ? 'Saving…' : changedCount > 0 ? `Save ${changedCount} change${changedCount !== 1 ? 's' : ''}` : 'Done'}
                </button>
                <button onClick={cancel}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 border border-slate-700 hover:border-slate-500 transition-colors">
                  Cancel
                </button>
              </>
            ) : (
              <button onClick={() => setEditing(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 border border-slate-700 hover:border-slate-500 transition-colors">
                Edit columns
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Approved: county group (collapsible) ─────────────────────────────────────

function ApprovedCountyGroup({ countyId, items, token, onUpdated }) {
  const [open, setOpen] = useState(true);   // counties start expanded

  function handleItemUpdated(updatedItem) {
    onUpdated(updatedItem);
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={card}>
      {/* County header */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-white/[0.02] transition-colors"
        style={{ borderBottom: open ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
      >
        <Chevron open={open} />
        <span className="text-base font-semibold text-white capitalize">{countyId.replace(/_/g, ' ')}</span>
        <span className="text-xs text-slate-500 font-mono">{countyId}</span>
        <span className="ml-auto text-xs text-slate-600">
          {items.length} source{items.length !== 1 ? 's' : ''}
        </span>
      </button>

      {/* Sources list */}
      {open && (
        <div>
          {items.map(item => (
            <ApprovedSourceCard
              key={item.id}
              item={item}
              token={token}
              onUpdated={handleItemUpdated}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Rejected card ────────────────────────────────────────────────────────────

function RejectedCard({ item }) {
  const { source_columns, mapping, reject_feedback, source, created_at } = item;
  const [open, setOpen] = useState(false);
  const rejectedDate = created_at
    ? new Date(created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ ...card, opacity: 0.82 }}>
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-white/[0.02] transition-colors"
        style={{ borderBottom: open ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
      >
        <Chevron open={open} />
        <span className="text-sm font-semibold text-white">{source?.county_id}</span>
        <span className="text-slate-600">/</span>
        <Badge color="blue">{source?.signal_type}</Badge>
        <Badge color="red">rejected</Badge>
        <span className="ml-auto text-xs text-slate-600">
          {(source_columns || []).length} cols{rejectedDate && ` · ${rejectedDate}`}
        </span>
      </button>

      {open && (
        <div>
          <MappingTable sourceCols={source_columns} mapping={mapping} editable={false} />
          {reject_feedback && (
            <div className="px-5 py-3.5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(248,113,113,0.04)' }}>
              <p className="text-xs text-slate-500 mb-1">Admin feedback → LLM on re-map:</p>
              <p className="text-xs text-red-300 italic">{reject_feedback}</p>
            </div>
          )}
          <div className="px-5 py-3 text-xs text-slate-600"
            style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            Will be re-mapped by LLM on next scrape run
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────

function TabBar({ active, counts, onChange }) {
  const labels    = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected' };
  const dotColors = { pending: '#facc15', approved: '#6ee7b7', rejected: '#fca5a5' };
  return (
    <div className="flex items-center gap-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '1px' }}>
      {TABS.map(tab => {
        const isActive = tab === active;
        const count = counts[tab];
        return (
          <button key={tab} onClick={() => onChange(tab)}
            className="relative px-4 py-2.5 text-xs font-medium transition-colors"
            style={{ color: isActive ? '#fff' : '#64748b' }}>
            {labels[tab]}
            {count != null && (
              <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full"
                style={{
                  background: isActive ? `${dotColors[tab]}22` : 'rgba(148,163,184,0.08)',
                  color: isActive ? dotColors[tab] : '#475569',
                }}>
                {count}
              </span>
            )}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-px" style={{ background: dotColors[tab] }} />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ColumnMappingsDashboard({ token }) {
  const [activeTab, setActiveTab] = useState('pending');
  const [data, setData]           = useState({ pending: null, approved: null, rejected: null });
  const [error, setError]         = useState('');
  const [resolved, setResolved]   = useState({});

  const fetchers = {
    pending:  () => fetchPendingMappings(token),
    approved: () => fetchApprovedMappings(token),
    rejected: () => fetchRejectedMappings(token),
  };

  const loadTab = useCallback((tab) => {
    setError('');
    fetchers[tab]()
      .then(items => setData(prev => ({ ...prev, [tab]: items })))
      .catch(e => { if (e.name !== 'AbortError') setError(e.detail || e.message || 'Failed to load'); });
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (data[activeTab] === null) loadTab(activeTab);
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleResolved(id, outcome) {
    setResolved(prev => ({ ...prev, [id]: outcome }));
    setTimeout(() => loadTab(outcome === 'approved' ? 'approved' : 'rejected'), 400);
  }

  function handleUpdated(updatedItem) {
    setData(prev => ({
      ...prev,
      approved: (prev.approved || []).map(m => m.id === updatedItem.id ? { ...m, ...updatedItem } : m),
    }));
  }

  const pendingItems  = (data.pending  || []).filter(m => !resolved[m.id]);
  const approvedItems = data.approved  || [];
  const rejectedItems = data.rejected  || [];

  // Group approved items by county_id for hierarchical display
  const approvedByCounty = approvedItems.reduce((acc, item) => {
    const cid = item.source?.county_id || 'unknown';
    if (!acc[cid]) acc[cid] = [];
    acc[cid].push(item);
    return acc;
  }, {});

  const counts = {
    pending:  data.pending  === null ? null : pendingItems.length,
    approved: data.approved === null ? null : approvedItems.length,
    rejected: data.rejected === null ? null : rejectedItems.length,
  };

  const sessionApproved = Object.values(resolved).filter(v => v === 'approved').length;
  const sessionRejected = Object.values(resolved).filter(v => v === 'rejected').length;

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm text-slate-400">
            Column mapping approval workflow
            {sessionApproved > 0 && <span className="text-emerald-500 ml-2">✓ {sessionApproved} approved</span>}
            {sessionRejected > 0 && <span className="text-red-500 ml-2">✕ {sessionRejected} rejected</span>}
          </p>
          <p className="text-xs text-slate-600 mt-0.5">
            Counties whose columns already match the canonical format (e.g. Hillsborough) do not appear here — they pass through without remapping.
          </p>
        </div>
        <button onClick={() => loadTab(activeTab)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 border border-slate-700 hover:border-slate-500 transition-colors">
          Refresh
        </button>
      </div>

      {error && <p className="text-red-400 text-sm">Error: {error}</p>}

      <TabBar active={activeTab} counts={counts} onChange={tab => setActiveTab(tab)} />

      {/* ── Pending ── */}
      {activeTab === 'pending' && (
        <div className="space-y-4 pt-1">
          {data.pending === null && !error && (
            <p className="text-slate-500 text-sm animate-pulse py-4">Loading…</p>
          )}
          {data.pending !== null && pendingItems.length === 0 && (
            <div className="rounded-2xl p-10 text-center" style={card}>
              <p className="text-slate-400 text-sm font-medium">No pending mappings</p>
              <p className="text-slate-600 text-xs mt-1">New mappings appear here when a scraper encounters a new source or changed columns.</p>
            </div>
          )}
          {pendingItems.map(item => (
            <PendingCard key={item.id} item={item} token={token} onResolved={handleResolved} />
          ))}
        </div>
      )}

      {/* ── Approved ── */}
      {activeTab === 'approved' && (
        <div className="space-y-3 pt-1">
          {data.approved === null && !error && (
            <p className="text-slate-500 text-sm animate-pulse py-4">Loading…</p>
          )}
          {data.approved !== null && approvedItems.length === 0 && (
            <div className="rounded-2xl p-10 text-center" style={card}>
              <p className="text-slate-400 text-sm font-medium">No approved mappings yet</p>
              <p className="text-slate-600 text-xs mt-1">
                Approve pending proposals or create manual mappings. Counties with canonical column formats (Hillsborough) never appear here — they don't need remapping.
              </p>
            </div>
          )}
          {Object.entries(approvedByCounty).sort(([a], [b]) => a.localeCompare(b)).map(([countyId, items]) => (
            <ApprovedCountyGroup
              key={countyId}
              countyId={countyId}
              items={items}
              token={token}
              onUpdated={handleUpdated}
            />
          ))}
        </div>
      )}

      {/* ── Rejected ── */}
      {activeTab === 'rejected' && (
        <div className="space-y-3 pt-1">
          {data.rejected === null && !error && (
            <p className="text-slate-500 text-sm animate-pulse py-4">Loading…</p>
          )}
          {data.rejected !== null && rejectedItems.length === 0 && (
            <div className="rounded-2xl p-10 text-center" style={card}>
              <p className="text-slate-400 text-sm font-medium">No rejected mappings</p>
              <p className="text-slate-600 text-xs mt-1">Rejected mappings appear here. They will be re-mapped by the LLM on the next scrape run using your feedback.</p>
            </div>
          )}
          {rejectedItems.map(item => (
            <RejectedCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

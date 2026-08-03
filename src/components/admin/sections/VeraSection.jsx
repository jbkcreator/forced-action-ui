import { useCallback, useEffect, useState } from 'react';
import { useAdminContext } from '../adminContext';
import {
  createVeraPromise,
  deleteVeraPromise,
  fetchVeraPromises,
  updateVeraPromise,
} from '../../../api/admin';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function isOverdue(promise) {
  if (promise.status !== 'open' || !promise.due_at) return false;
  // Compare calendar dates only — a promise due "today" is not overdue until tomorrow.
  const today = new Date().toISOString().slice(0, 10);
  return promise.due_at.slice(0, 10) < today;
}

function mrrDisplay(cents) {
  if (!cents) return '—';
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0 })}`;
}

const STATUS_BADGE = {
  open:      { label: 'OPEN',      cls: 'text-yellow-400 bg-yellow-400/10 border border-yellow-400/20' },
  closed:    { label: 'FULFILLED', cls: 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/20' },
  cancelled: { label: 'CANCELLED', cls: 'text-slate-400 bg-slate-400/10 border border-slate-400/20' },
};

const FILTER_TABS = ['all', 'open', 'closed', 'cancelled'];

// ── Add Promise Form ──────────────────────────────────────────────────────────

const EMPTY_FORM = { description: '', owner: 'hari', due_at: '', mrr_at_risk_dollars: '', thread_id: '' };

function AddPromiseForm({ token, onSaved, onCancel }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function set(field, val) {
    setForm(f => ({ ...f, [field]: val }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.description.trim() || !form.owner.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const body = {
        description: form.description.trim(),
        owner: form.owner.trim(),
        due_at: form.due_at || null,
        mrr_at_risk_cents: form.mrr_at_risk_dollars ? Math.round(parseFloat(form.mrr_at_risk_dollars) * 100) : null,
        thread_id: form.thread_id.trim() || null,
      };
      const created = await createVeraPromise(token, body);
      onSaved(created);
      setForm(EMPTY_FORM);
    } catch (err) {
      setError(err.detail || 'Failed to create promise');
    } finally {
      setSaving(false);
    }
  }

  const inputCls = 'w-full rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 outline-none focus:ring-1 focus:ring-yellow-400/50';
  const inputStyle = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' };
  const labelCls = 'block text-xs font-medium text-slate-400 mb-1';

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl p-5 mt-4"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <p className="text-sm font-semibold text-white mb-4">Add Promise</p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelCls}>Description *</label>
          <textarea
            required
            rows={2}
            placeholder="What was committed?"
            className={inputCls}
            style={inputStyle}
            value={form.description}
            onChange={e => set('description', e.target.value)}
          />
        </div>

        <div>
          <label className={labelCls}>Owner *</label>
          <input
            required
            type="text"
            placeholder="e.g. hari"
            className={inputCls}
            style={inputStyle}
            value={form.owner}
            onChange={e => set('owner', e.target.value)}
          />
        </div>

        <div>
          <label className={labelCls}>Due date</label>
          <input
            type="date"
            className={inputCls}
            style={inputStyle}
            value={form.due_at}
            onChange={e => set('due_at', e.target.value)}
          />
        </div>

        <div>
          <label className={labelCls}>MRR at risk ($)</label>
          <input
            type="number"
            min="0"
            step="1"
            placeholder="0"
            className={inputCls}
            style={inputStyle}
            value={form.mrr_at_risk_dollars}
            onChange={e => set('mrr_at_risk_dollars', e.target.value)}
          />
        </div>

        <div>
          <label className={labelCls}>Thread ID (optional)</label>
          <input
            type="text"
            placeholder="Slack/PR reference"
            className={inputCls}
            style={inputStyle}
            value={form.thread_id}
            onChange={e => set('thread_id', e.target.value)}
          />
        </div>
      </div>

      {error && <p className="mt-3 text-xs text-red-400">{error}</p>}

      <div className="flex gap-2 mt-4 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
          style={{ border: '1px solid rgba(255,255,255,0.1)' }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-900 transition-opacity disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #facc15, #f59e0b)' }}
        >
          {saving ? 'Saving…' : 'Add promise'}
        </button>
      </div>
    </form>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function VeraSection() {
  const { token } = useAdminContext();
  const [promises, setPromises] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [actionError, setActionError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchVeraPromises(token, { status: filter });
      setPromises(res.promises);
      setTotal(res.total);
    } catch (err) {
      setError(err.detail || 'Failed to load promises');
    } finally {
      setLoading(false);
    }
  }, [token, filter]);

  useEffect(() => { load(); }, [load]);

  async function handleFulfil(id) {
    setActionError(null);
    try {
      await updateVeraPromise(token, id, { status: 'closed' });
      setPromises(ps => ps.map(p => p.id === id ? { ...p, status: 'closed' } : p));
    } catch (err) {
      setActionError(err.detail || 'Failed to update promise');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this promise permanently?')) return;
    setActionError(null);
    try {
      await deleteVeraPromise(token, id);
      setPromises(ps => ps.filter(p => p.id !== id));
      setTotal(t => t - 1);
    } catch (err) {
      setActionError(err.detail || 'Failed to delete promise');
    }
  }

  function handleSaved(created) {
    setShowAdd(false);
    setFilter('all');
    setPromises(ps => [created, ...ps]);
    setTotal(t => t + 1);
  }

  const overdue = promises.filter(isOverdue).length;

  return (
    <div className="max-w-5xl mx-auto py-6 px-1">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-lg font-bold text-white">Vera — Promise Tracker</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Open commitments tracked by Vera (constitution standing job #3).
            {overdue > 0 && (
              <span className="ml-2 text-amber-400 font-semibold">{overdue} overdue</span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(v => !v)}
          className="shrink-0 px-4 py-2 rounded-lg text-xs font-semibold text-slate-900 transition-opacity"
          style={{ background: 'linear-gradient(135deg, #facc15, #f59e0b)' }}
        >
          {showAdd ? '✕ Cancel' : '+ Add Promise'}
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <AddPromiseForm
          token={token}
          onSaved={handleSaved}
          onCancel={() => setShowAdd(false)}
        />
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit mt-4 mb-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        {FILTER_TABS.map(f => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
            style={
              filter === f
                ? { background: 'rgba(250,204,21,0.15)', color: '#facc15', boxShadow: 'inset 0 0 0 1px rgba(250,204,21,0.25)' }
                : { color: '#94a3b8' }
            }
          >
            {f}
          </button>
        ))}
      </div>

      {actionError && (
        <p className="mb-3 text-xs text-red-400">{actionError}</p>
      )}

      {/* Table */}
      {loading ? (
        <p className="text-sm text-slate-500 py-8 text-center">Loading…</p>
      ) : error ? (
        <p className="text-sm text-red-400 py-8 text-center">{error}</p>
      ) : promises.length === 0 ? (
        <p className="text-sm text-slate-500 py-8 text-center">No promises found.</p>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                {['Description', 'Owner', 'Due', 'MRR at risk', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {promises.map((p, i) => {
                const overduRow = isOverdue(p);
                const badge = STATUS_BADGE[p.status] || STATUS_BADGE.open;
                return (
                  <tr
                    key={p.id}
                    style={{
                      background: overduRow
                        ? 'rgba(251,191,36,0.05)'
                        : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <td className="px-4 py-3 text-slate-200 max-w-xs">
                      <span>{p.description}</span>
                      {overduRow && <span className="ml-2 text-amber-400 text-xs">⚠ overdue</span>}
                      {p.thread_id && (
                        <span className="ml-2 text-xs text-slate-500">[{p.thread_id}]</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{p.owner}</td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{formatDate(p.due_at)}</td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{mrrDisplay(p.mrr_at_risk_cents)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex gap-2">
                        {p.status === 'open' && (
                          <button
                            type="button"
                            onClick={() => handleFulfil(p.id)}
                            className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                          >
                            Fulfil
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(p.id)}
                          className="text-xs text-red-400 hover:text-red-300 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-4 py-2 text-xs text-slate-500" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            {total} promise{total !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  );
}

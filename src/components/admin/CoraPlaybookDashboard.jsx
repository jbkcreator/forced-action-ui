import { useCallback, useEffect, useRef, useState } from 'react';
import {
  adoptPlaybook, fetchCoraPlaybooks, rejectPlaybook, retirePlaybook,
} from '../../api/admin';

const STATUSES = ['recommended', 'adopted', 'rejected', 'retired'];

const STATUS_COLORS = {
  recommended: { bg: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: 'rgba(251,191,36,0.3)' },
  adopted:     { bg: 'rgba(16,185,129,0.12)', color: '#34d399', border: 'rgba(16,185,129,0.3)' },
  rejected:    { bg: 'rgba(239,68,68,0.12)',  color: '#f87171', border: 'rgba(239,68,68,0.3)' },
  retired:     { bg: 'rgba(148,163,184,0.1)', color: '#94a3b8', border: 'rgba(148,163,184,0.2)' },
};

const btnYellow = 'px-3 py-1 rounded-lg text-xs font-semibold text-slate-900 disabled:opacity-40 transition-opacity';
const btnGhost  = 'px-3 py-1 rounded-lg text-xs font-medium text-slate-300 border border-slate-700 hover:border-slate-500 transition-colors disabled:opacity-50';

function relativeDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString();
}

export default function CoraPlaybookDashboard({ token }) {
  const [statusFilter, setStatusFilter] = useState('recommended');
  const [playbooks, setPlaybooks] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [acting, setActing] = useState(null); // playbook id being actioned
  const successTimerRef = useRef(null);

  const load = useCallback((signal) => {
    setLoading(true);
    setError('');
    return fetchCoraPlaybooks(token, statusFilter, { signal })
      .then(d => setPlaybooks(d.playbooks || []))
      .catch(e => { if (e.name !== 'AbortError') setError(e.message || e.detail || 'Failed to load playbooks'); })
      .finally(() => setLoading(false));
  }, [token, statusFilter]);

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal);
    return () => ctrl.abort();
  }, [load]);

  function showSuccess(msg) {
    setSuccessMsg(msg);
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    successTimerRef.current = setTimeout(() => setSuccessMsg(''), 4000);
  }

  async function handleAdopt(pb) {
    setActing(pb.id);
    try {
      const res = await adoptPlaybook(token, pb.id, 'admin');
      showSuccess(res.note ? res.note : 'Playbook adopted.');
      load();
    } catch (e) {
      setError(e.message || e.detail || 'Adopt failed');
    } finally { setActing(null); }
  }

  async function handleReject(pb) {
    const reason = window.prompt('Rejection reason (optional):');
    if (reason === null) return; // user cancelled
    setActing(pb.id);
    try {
      const res = await rejectPlaybook(token, pb.id, 'admin', reason || '');
      showSuccess(res.note ? res.note : 'Playbook rejected.');
      load();
    } catch (e) {
      setError(e.message || e.detail || 'Reject failed');
    } finally { setActing(null); }
  }

  async function handleRetire(pb) {
    if (!confirm(`Retire playbook "${pb.name}"?`)) return;
    setActing(pb.id);
    try {
      const res = await retirePlaybook(token, pb.id, 'admin');
      showSuccess(res.note ? res.note : 'Playbook retired.');
      load();
    } catch (e) {
      setError(e.message || e.detail || 'Retire failed');
    } finally { setActing(null); }
  }

  return (
    <div className="space-y-4">
      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {STATUSES.map(s => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors capitalize ${
              statusFilter === s
                ? 'border-sky-400/50 text-sky-300 bg-sky-500/10'
                : 'border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            {s}
          </button>
        ))}
        <button
          type="button"
          onClick={() => load()}
          className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white transition-colors ml-auto"
        >
          ↺ Refresh
        </button>
      </div>

      {error && (
        <div role="alert" className="text-sm text-red-400 bg-red-950/60 border border-red-800/60 rounded-lg px-4 py-3">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 rounded-lg px-4 py-2">
          {successMsg}
        </div>
      )}

      {loading && !playbooks && (
        <p className="text-slate-500 text-sm animate-pulse py-6 text-center">Loading playbooks…</p>
      )}

      {!loading && playbooks && (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 text-xs uppercase tracking-wide">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Author</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {playbooks.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-slate-500 text-center">
                    No <span className="capitalize">{statusFilter}</span> playbooks.
                  </td>
                </tr>
              )}
              {playbooks.map(pb => {
                const sc = STATUS_COLORS[pb.status] || STATUS_COLORS.retired;
                const isActing = acting === pb.id;
                const desc = pb.description || '';
                return (
                  <tr key={pb.id} className="border-b border-white/5 hover:bg-white/2 text-slate-300">
                    <td className="px-4 py-3 text-xs text-slate-500">#{pb.id}</td>
                    <td className="px-4 py-3 font-medium text-white max-w-[160px]">
                      <span title={pb.name}>{pb.name}</span>
                    </td>
                    <td className="px-4 py-3 text-xs">{pb.source_type || '—'}</td>
                    <td className="px-4 py-3 text-xs">{pb.authored_by || '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-block text-xs px-2 py-0.5 rounded-full font-medium capitalize"
                        style={{ color: sc.color, background: sc.bg, border: `1px solid ${sc.border}` }}
                      >
                        {pb.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">{relativeDate(pb.created_at)}</td>
                    <td className="px-4 py-3 text-xs text-slate-400 max-w-[200px]">
                      <span title={desc}>{desc.length > 60 ? desc.slice(0, 60) + '…' : desc || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {pb.status === 'recommended' && (
                          <>
                            <button
                              type="button"
                              disabled={isActing}
                              onClick={() => handleAdopt(pb)}
                              className={btnYellow}
                              style={{ background: '#facc15' }}
                            >
                              Adopt
                            </button>
                            <button
                              type="button"
                              disabled={isActing}
                              onClick={() => handleReject(pb)}
                              className={btnGhost}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {pb.status === 'adopted' && (
                          <button
                            type="button"
                            disabled={isActing}
                            onClick={() => handleRetire(pb)}
                            className={btnGhost}
                          >
                            Retire
                          </button>
                        )}
                        {pb.status !== 'recommended' && pb.status !== 'adopted' && (
                          <span className="text-slate-600">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/**
 * StormPacksTable — admin view of NWS storm alerts and bundle purchases.
 * Requires an admin JWT token (passed as prop).
 */
import { useCallback, useEffect, useState } from 'react';
import { fetchAdminStormPacks } from '../../api/bundles';

function Badge({ active }) {
  return active
    ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-sky-500/20 text-sky-300 border border-sky-400/30">Triggered</span>
    : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-700 text-slate-400">No packs sent</span>;
}

function relativeTime(iso) {
  if (!iso) return '—';
  const delta = (Date.now() - new Date(iso).getTime()) / 1000;
  if (delta < 3600) return `${Math.round(delta / 60)}m ago`;
  if (delta < 86400) return `${Math.round(delta / 3600)}h ago`;
  return `${Math.round(delta / 86400)}d ago`;
}

export default function StormPacksTable({ token }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('alerts');

  const load = useCallback((signal) => {
    setLoading(true);
    setError('');
    return fetchAdminStormPacks({ limit: 50 })
      .then(setData)
      .catch((e) => {
        if (e.name !== 'AbortError') setError(e.message || e.detail || 'Failed to load storm packs');
      })
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal);
    return () => ctrl.abort();
  }, [load]);

  if (loading && !data) {
    return <div className="text-slate-400 py-8 text-center text-sm">Loading storm pack data…</div>;
  }

  if (error) {
    return <div className="text-red-400 py-4 text-sm">{error}</div>;
  }

  if (!data) return null;

  const alerts = data.alerts || [];
  const purchases = data.bundle_purchases || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-semibold text-lg">Storm Packs</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTab('alerts')}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              tab === 'alerts'
                ? 'border-sky-400/50 text-sky-300 bg-sky-500/10'
                : 'border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            NWS Alerts ({data.total_alerts})
          </button>
          <button
            type="button"
            onClick={() => setTab('purchases')}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              tab === 'purchases'
                ? 'border-sky-400/50 text-sky-300 bg-sky-500/10'
                : 'border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            Bundle Purchases ({purchases.length})
          </button>
          <button
            type="button"
            onClick={() => load()}
            className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white transition-colors"
          >
            ↺ Refresh
          </button>
        </div>
      </div>

      {tab === 'alerts' && (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 text-xs uppercase tracking-wide">
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">ZIPs</th>
                <th className="px-4 py-3">Subscribers</th>
                <th className="px-4 py-3">Storm Pack</th>
                <th className="px-4 py-3">Received</th>
                <th className="px-4 py-3">Expires</th>
              </tr>
            </thead>
            <tbody>
              {alerts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-slate-500 text-center">No alerts ingested yet.</td>
                </tr>
              )}
              {alerts.map((a) => (
                <tr key={a.id} className="border-b border-white/5 hover:bg-white/2 text-slate-300">
                  <td className="px-4 py-3 font-medium text-white">{a.event}</td>
                  <td className="px-4 py-3 text-xs">{a.severity || '—'}</td>
                  <td className="px-4 py-3">
                    <span title={(a.affected_zips || []).join(', ')} className="cursor-help">
                      {(a.affected_zips || []).length} zip{a.affected_zips?.length !== 1 ? 's' : ''}
                    </span>
                  </td>
                  <td className="px-4 py-3">{a.subscriber_count ?? '—'}</td>
                  <td className="px-4 py-3"><Badge active={a.storm_pack_triggered} /></td>
                  <td className="px-4 py-3 text-xs text-slate-400">{relativeTime(a.created_at)}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {a.expires ? new Date(a.expires).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'purchases' && (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 text-xs uppercase tracking-wide">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Subscriber</th>
                <th className="px-4 py-3">ZIP</th>
                <th className="px-4 py-3">Leads</th>
                <th className="px-4 py-3">Expires</th>
                <th className="px-4 py-3">Purchased</th>
              </tr>
            </thead>
            <tbody>
              {purchases.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-slate-500 text-center">No bundle purchases yet.</td>
                </tr>
              )}
              {purchases.map((bp) => (
                <tr key={bp.id} className="border-b border-white/5 hover:bg-white/2 text-slate-300">
                  <td className="px-4 py-3 text-xs text-slate-500">#{bp.id}</td>
                  <td className="px-4 py-3 font-medium text-white capitalize">{(bp.bundle_type || '').replace('_', ' ')}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${
                      bp.status === 'active'
                        ? 'border-emerald-400/40 text-emerald-300 bg-emerald-500/10'
                        : bp.status === 'expired'
                        ? 'border-slate-600 text-slate-500 bg-slate-800'
                        : 'border-yellow-400/40 text-yellow-300 bg-yellow-500/10'
                    }`}>
                      {bp.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">{bp.subscriber_id}</td>
                  <td className="px-4 py-3 text-xs">{bp.zip_code || '—'}</td>
                  <td className="px-4 py-3">{bp.lead_count}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {bp.expires_at ? new Date(bp.expires_at).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">{relativeTime(bp.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

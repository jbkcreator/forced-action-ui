import { useEffect, useState, useCallback } from 'react';
import { fetchDfyLiteOrders } from '../../../api/admin';
import { useAdminContext } from '../adminContext';

const STATUSES = [
  'Order_Received', 'Signal_Compiled', 'Needs_Review',
  'Delivered', 'Signal_Failed', 'Pitch_Failed', 'Cancelled',
];

const STATUS_STYLES = {
  Order_Received:  'bg-slate-500/10 text-slate-400 border-slate-500/20',
  Signal_Compiled: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  Needs_Review:    'bg-yellow-400/10 text-yellow-300 border-yellow-400/20',
  Delivered:       'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Signal_Failed:   'bg-red-500/10 text-red-400 border-red-500/20',
  Pitch_Failed:    'bg-red-500/10 text-red-400 border-red-500/20',
  Cancelled:       'bg-red-500/10 text-red-400 border-red-500/20',
};

function StatusBadge({ status }) {
  return (
    <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLES[status] ?? 'bg-white/5 text-slate-400 border-white/10'}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function DfyLiteSection() {
  const { token } = useAdminContext();

  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const PAGE_SIZE = 50;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDfyLiteOrders(token, {
        status: statusFilter || undefined,
        page,
        pageSize: PAGE_SIZE,
      });
      setOrders(data.orders ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      setError(err.detail || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter, page]);

  useEffect(() => { load(); }, [load]);

  function handleFilterChange(s) {
    setStatusFilter(s);
    setPage(1);
    setExpanded(null);
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="px-6 py-6">
    <div className="max-w-5xl mx-auto space-y-5">
      <div>
        <h2 className="text-base font-semibold text-white">DFY-Lite Orders</h2>
        <p className="text-xs text-slate-400 mt-0.5">{total.toLocaleString()} total orders</p>
      </div>

      {/* Status filter chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleFilterChange('')}
          className={`text-xs px-3 py-1.5 rounded-lg border transition font-medium ${
            statusFilter === ''
              ? 'bg-yellow-400/15 text-yellow-300 border-yellow-400/30'
              : 'bg-white/[0.05] text-slate-400 border-white/[0.08] hover:bg-white/[0.10]'
          }`}
        >
          All
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => handleFilterChange(s)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition font-medium ${
              statusFilter === s
                ? 'bg-yellow-400/15 text-yellow-300 border-yellow-400/30'
                : 'bg-white/[0.05] text-slate-400 border-white/[0.08] hover:bg-white/[0.10]'
            }`}
          >
            {s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl p-4 border border-red-500/20 bg-red-500/5 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-sm text-slate-500">Loading…</div>
      ) : orders.length === 0 ? (
        <div className="py-12 text-center text-sm text-slate-500">No orders found.</div>
      ) : (
        <div className="rounded-xl border border-white/[0.08] overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] bg-white/[0.03]">
                {['ID', 'Subscriber', 'Property', 'Pitch Type', 'Vertical', 'Status', 'Created'].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <>
                  <tr
                    key={o.id}
                    className="border-b border-white/[0.05] hover:bg-white/[0.03] cursor-pointer transition"
                    onClick={() => setExpanded(expanded === o.id ? null : o.id)}
                  >
                    <td className="px-3 py-2.5 font-mono text-slate-300">#{o.id}</td>
                    <td className="px-3 py-2.5 text-slate-300 max-w-[140px] truncate">{o.subscriber_email}</td>
                    <td className="px-3 py-2.5 text-slate-300 max-w-[160px] truncate">{o.property_address}</td>
                    <td className="px-3 py-2.5 text-slate-400">{o.pitch_type?.replace(/_/g, ' ')}</td>
                    <td className="px-3 py-2.5 text-slate-400">{o.target_vertical?.replace(/_/g, ' ')}</td>
                    <td className="px-3 py-2.5"><StatusBadge status={o.status} /></td>
                    <td className="px-3 py-2.5 text-slate-500">{fmtDate(o.created_at)}</td>
                  </tr>
                  {expanded === o.id && (
                    <tr key={`${o.id}-detail`} className="border-b border-white/[0.05] bg-white/[0.02]">
                      <td colSpan={7} className="px-4 py-3 space-y-1">
                        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-400">
                          <span><span className="text-slate-500">Subscriber ID:</span> {o.subscriber_id}</span>
                          <span><span className="text-slate-500">Property ID:</span> {o.property_id}</span>
                          <span><span className="text-slate-500">Generation:</span> #{o.pitch_generation_number}</span>
                          <span><span className="text-slate-500">Updated:</span> {fmtDate(o.updated_at)}</span>
                          {o.reviewed_at  && <span><span className="text-slate-500">Reviewed:</span> {fmtDate(o.reviewed_at)}</span>}
                          {o.delivered_at && <span><span className="text-slate-500">Delivered:</span> {fmtDate(o.delivered_at)}</span>}
                        </div>
                        {o.error_reason && (
                          <p className="text-xs text-red-400 mt-1">
                            <span className="text-slate-500">Error:</span> {o.error_reason}
                          </p>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.05] hover:bg-white/[0.10] disabled:opacity-40 transition"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.05] hover:bg-white/[0.10] disabled:opacity-40 transition"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}

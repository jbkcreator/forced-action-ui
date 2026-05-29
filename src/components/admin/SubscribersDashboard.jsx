import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchHotSubscribers, fetchSubscribers } from '../../api/admin';

const card = { background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)' };
const inputCls = 'rounded-lg px-2 py-1 text-xs bg-white/5 border border-white/10 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-yellow-400/40';

function scoreColor(score) {
  if (score >= 60) return '#34d399';
  if (score >= 30) return '#fbbf24';
  return '#f87171';
}

function bandLabel(b) { return (b || 'low').replace('_', ' '); }

function relativeDays(iso) {
  if (!iso) return '—';
  const d = (Date.now() - new Date(iso).getTime()) / 86400000;
  if (d < 1) return `${Math.round(d * 24)}h`;
  return `${Math.round(d)}d`;
}

function SubRow({ row, queueMode, onOpen }) {
  return (
    <tr
      className="border-b border-white/5 hover:bg-white/5 cursor-pointer text-slate-300"
      onClick={() => onOpen(row.id)}
    >
      <td className="px-4 py-3 text-xs font-mono text-slate-500">{row.id}</td>
      <td className="px-4 py-3">
        <div className="text-sm text-white">{row.name || '—'}</div>
        <div className="text-xs text-slate-500">{row.email || '—'}</div>
      </td>
      <td className="px-4 py-3 text-xs">{row.tier}</td>
      <td className="px-4 py-3 text-xs">{row.vertical}</td>
      <td className="px-4 py-3 text-xs">{row.county_id}</td>
      <td className="px-4 py-3">
        <span className="text-sm font-bold" style={{ color: scoreColor(row.revenue_signal_score) }}>
          {row.revenue_signal_score ?? 0}
        </span>
        <span className="text-xs text-slate-500 ml-1">/100</span>
      </td>
      <td className="px-4 py-3 text-xs text-slate-400">{bandLabel(row.revenue_signal_band)}</td>
      <td className="px-4 py-3 text-xs">
        {row.grace && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}>
            GRACE
          </span>
        )}
        {!row.grace && row.status !== 'active' && (
          <span className="text-slate-500">{row.status}</span>
        )}
      </td>
      {queueMode && (
        <td className="px-4 py-3 text-xs text-orange-400 font-mono">
          {row.days_since_action}d cool
        </td>
      )}
    </tr>
  );
}

function HotQueueTab({ token, onOpen }) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    setLoading(true);
    fetchHotSubscribers(token)
      .then(d => setItems(d.items || []))
      .catch(e => setErr(e.detail || e.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <p className="text-slate-500 text-sm">Loading…</p>;
  if (err) return <p className="text-red-400 text-sm">{err}</p>;
  if (items.length === 0) {
    return (
      <div className="rounded-xl p-8 text-center" style={card}>
        <p className="text-slate-400 text-sm">No at-risk subscribers right now.</p>
        <p className="text-slate-600 text-xs mt-1">
          Criteria: RSS ≥ 60 AND no significant action in 7+ days.
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-xl overflow-hidden" style={card}>
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="border-b border-white/10 text-slate-400 text-xs uppercase tracking-wide">
            <th className="px-4 py-3">ID</th>
            <th className="px-4 py-3">Subscriber</th>
            <th className="px-4 py-3">Tier</th>
            <th className="px-4 py-3">Vertical</th>
            <th className="px-4 py-3">County</th>
            <th className="px-4 py-3">RSS</th>
            <th className="px-4 py-3">Band</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Cool-down</th>
          </tr>
        </thead>
        <tbody>
          {items.map(r => <SubRow key={r.id} row={r} queueMode onOpen={onOpen} />)}
        </tbody>
      </table>
    </div>
  );
}

function AllSubscribersTab({ token, onOpen }) {
  const [filters, setFilters] = useState({ q: '', band: '', status: '', tier: '', vertical: '' });
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setErr('');
    fetchSubscribers(token, { ...filters, limit: 100, offset: 0 })
      .then(d => setData(d))
      .catch(e => setErr(e.detail || e.message))
      .finally(() => setLoading(false));
  }, [token, filters]);

  useEffect(() => { load(); }, [load]);

  const upd = (k, v) => setFilters(f => ({ ...f, [k]: v }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <input className={inputCls} placeholder="Search email/name"
          value={filters.q} onChange={e => upd('q', e.target.value)} />
        <select className={inputCls} value={filters.band} onChange={e => upd('band', e.target.value)}>
          <option value="">All bands</option>
          <option value="very_high">very_high</option>
          <option value="high">high</option>
          <option value="medium">medium</option>
          <option value="low">low</option>
        </select>
        <select className={inputCls} value={filters.status} onChange={e => upd('status', e.target.value)}>
          <option value="">All status</option>
          <option value="active">active</option>
          <option value="grace">grace</option>
          <option value="churned">churned</option>
          <option value="cancelled">cancelled</option>
        </select>
        <select className={inputCls} value={filters.tier} onChange={e => upd('tier', e.target.value)}>
          <option value="">All tiers</option>
          <option value="starter">starter</option>
          <option value="pro">pro</option>
          <option value="dominator">dominator</option>
        </select>
        <span className="text-xs text-slate-500 ml-auto">{data.total} total</span>
      </div>
      {err && <p className="text-red-400 text-sm">{err}</p>}
      <div className="rounded-xl overflow-hidden" style={card}>
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-white/10 text-slate-400 text-xs uppercase tracking-wide">
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Subscriber</th>
              <th className="px-4 py-3">Tier</th>
              <th className="px-4 py-3">Vertical</th>
              <th className="px-4 py-3">County</th>
              <th className="px-4 py-3">RSS</th>
              <th className="px-4 py-3">Band</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {(data.items || []).map(r => <SubRow key={r.id} row={r} onOpen={onOpen} />)}
            {!loading && (!data.items || data.items.length === 0) && (
              <tr><td colSpan={8} className="px-4 py-6 text-slate-500 text-center">No matches.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function SubscribersDashboard({ token }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState('queue');
  const onOpen = (id) => navigate(`/admin/subscribers/${id}`);

  return (
    <div className="space-y-4">
      <nav className="flex gap-1 p-1 rounded-xl w-fit"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        {[
          { id: 'queue', label: 'Hot Subscriber Queue' },
          { id: 'all',   label: 'All Subscribers' },
        ].map(t => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)}
            className="px-4 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: tab === t.id ? 'rgba(250,204,21,0.15)' : 'transparent',
              color: tab === t.id ? '#facc15' : '#94a3b8',
              boxShadow: tab === t.id ? 'inset 0 0 0 1px rgba(250,204,21,0.25)' : 'none',
            }}
          >
            {t.label}
          </button>
        ))}
      </nav>
      {tab === 'queue'
        ? <HotQueueTab token={token} onOpen={onOpen} />
        : <AllSubscribersTab token={token} onOpen={onOpen} />}
    </div>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchRevenueSignal, fetchSubscriberDetail } from '../api/admin';
import { useAdminContext } from '../components/admin/adminContext';
import ConversationHistory from '../components/admin/ConversationHistory';
import DealPipelineList from '../components/admin/DealPipelineList';
import NotesAndTagsPanel from '../components/admin/NotesAndTagsPanel';

const card = { background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)' };

function scoreColor(s) {
  if (s >= 60) return '#34d399';
  if (s >= 30) return '#fbbf24';
  return '#f87171';
}

function RssTab({ token, subscriberId }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    fetchRevenueSignal(token, subscriberId, 30)
      .then(setData).catch(e => setErr(e.detail || e.message));
  }, [token, subscriberId]);
  if (err) return <p className="text-red-400 text-sm">{err}</p>;
  if (!data) return <p className="text-slate-500 text-sm">Loading…</p>;
  const sc = scoreColor(data.score ?? 0);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl p-4 text-center" style={card}>
          <div className="text-2xl font-bold" style={{ color: sc }}>{data.score ?? 0}</div>
          <div className="text-xs text-slate-500">Score / 100</div>
        </div>
        <div className="rounded-xl p-4 text-center" style={card}>
          <div className="text-sm font-semibold text-slate-200">{(data.band || 'low').replace('_', ' ')}</div>
          <div className="text-xs text-slate-500">Band</div>
        </div>
        <div className="rounded-xl p-4 text-center" style={card}>
          <div className="text-xs text-slate-300">{data.last_action || '—'}</div>
          <div className="text-xs text-slate-500">Last Action</div>
        </div>
        <div className="rounded-xl p-4 text-center" style={card}>
          <div className="text-xs text-slate-300">
            {data.last_significant_action_at
              ? new Date(data.last_significant_action_at).toLocaleString()
              : '—'}
          </div>
          <div className="text-xs text-slate-500">Last Significant Action</div>
        </div>
      </div>
      {data.reasons && (
        <div className="rounded-xl p-4" style={card}>
          <p className="text-xs text-slate-400 font-semibold uppercase mb-2">Reasons</p>
          <ul className="text-xs text-slate-400 space-y-1">
            {data.reasons.map((r, i) => <li key={i}>· {r}</li>)}
          </ul>
        </div>
      )}
      <div className="rounded-xl overflow-hidden" style={card}>
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-white/10 text-slate-400 text-xs uppercase">
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Old</th>
              <th className="px-4 py-3">New</th>
              <th className="px-4 py-3">Δ</th>
              <th className="px-4 py-3">Band</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {(data.history || []).map((h, i) => {
              const delta = (h.new_score ?? 0) - (h.old_score ?? 0);
              return (
                <tr key={i} className="border-b border-white/5 text-slate-300">
                  <td className="px-4 py-3 text-xs font-mono">{h.action_type || '—'}</td>
                  <td className="px-4 py-3 text-xs">{h.old_score ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-white">{h.new_score ?? '—'}</td>
                  <td className={`px-4 py-3 text-xs ${delta > 0 ? 'text-emerald-400' : delta < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                    {delta > 0 ? `+${delta}` : delta}
                  </td>
                  <td className="px-4 py-3 text-xs">{h.band || '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {h.created_at ? new Date(h.created_at).toLocaleString() : '—'}
                  </td>
                </tr>
              );
            })}
            {(!data.history || data.history.length === 0) && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">No history.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const TABS = [
  { id: 'rss',          label: 'Revenue Signal' },
  { id: 'conversation', label: 'Conversation'   },
  { id: 'deals',        label: 'Deals'          },
  { id: 'notes',        label: 'Notes & Tags'   },
];

export default function SubscriberDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const subscriberId = Number(id);
  const { token } = useAdminContext();
  const [tab, setTab] = useState('rss');
  const [detail, setDetail] = useState(null);
  const [err, setErr] = useState('');

  const reload = useCallback(() => {
    if (!subscriberId || !token) return;
    fetchSubscriberDetail(token, subscriberId)
      .then(setDetail).catch(e => setErr(e.detail || e.message));
  }, [token, subscriberId]);

  useEffect(() => { reload(); }, [reload]);

  if (!token) return <p className="text-slate-400 p-6">Sign in to view subscriber detail.</p>;
  if (err) return <p className="text-red-400 p-6">{err}</p>;
  if (!detail) return <p className="text-slate-500 p-6">Loading…</p>;

  const s = detail.subscriber;
  const sc = scoreColor(s.revenue_signal_score ?? 0);

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 px-6 pt-6 pb-3 space-y-4">
        <button onClick={() => navigate('/admin/subscribers')}
          className="text-xs text-slate-400 hover:text-yellow-300">← All subscribers</button>
        <div className="rounded-xl p-4 flex flex-wrap items-center gap-4" style={card}>
          <div className="flex-1 min-w-[200px]">
            <div className="text-lg text-white font-semibold">{s.name || s.email || `Subscriber #${s.id}`}</div>
            <div className="text-xs text-slate-400">
              {s.email} · {s.phone || 'no phone'} · {s.tier} · {s.vertical} · {s.county_id}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: sc }}>{s.revenue_signal_score ?? 0}</div>
            <div className="text-[10px] text-slate-500 uppercase">{(s.revenue_signal_band || 'low').replace('_', ' ')}</div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {s.grace && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}>GRACE</span>
            )}
            {!s.grace && s.status !== 'active' && (
              <span className="text-xs text-slate-500">{s.status}</span>
            )}
            <span className="text-[10px] text-slate-500">{detail.open_deals_count} open deal(s)</span>
          </div>
        </div>
        <nav className="flex gap-1 p-1 rounded-xl w-fit"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {TABS.map(t => (
            <button key={t.id} type="button" onClick={() => setTab(t.id)}
              className="px-4 py-2 rounded-lg text-xs font-semibold"
              style={{
                background: tab === t.id ? 'rgba(250,204,21,0.15)' : 'transparent',
                color: tab === t.id ? '#facc15' : '#94a3b8',
                boxShadow: tab === t.id ? 'inset 0 0 0 1px rgba(250,204,21,0.25)' : 'none',
              }}>
              {t.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-5xl mx-auto">
          {tab === 'rss'          && <RssTab token={token} subscriberId={subscriberId} />}
          {tab === 'conversation' && <ConversationHistory token={token} subscriberId={subscriberId} />}
          {tab === 'deals'        && <DealPipelineList token={token} subscriberId={subscriberId} />}
          {tab === 'notes'        && <NotesAndTagsPanel token={token} subscriberId={subscriberId} />}
        </div>
      </div>
    </div>
  );
}

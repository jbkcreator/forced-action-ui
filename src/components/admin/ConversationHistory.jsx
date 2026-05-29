import { useEffect, useState } from 'react';
import { fetchSubscriberConversation } from '../../api/admin';

const card = { background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)' };

const CHANNEL_COLOR = {
  sms:  { color: '#a5b4fc', label: 'SMS' },
  chat: { color: '#34d399', label: 'CHAT' },
};

function fmt(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
}

function Bubble({ item }) {
  const outbound = item.direction === 'outbound';
  const ch = CHANNEL_COLOR[item.channel] || { color: '#94a3b8', label: item.channel };
  return (
    <div className={`flex ${outbound ? 'justify-end' : 'justify-start'}`}>
      <div
        className="max-w-[70%] rounded-xl px-4 py-2 space-y-1"
        style={{
          background: outbound ? 'rgba(250,204,21,0.08)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${outbound ? 'rgba(250,204,21,0.2)' : 'rgba(255,255,255,0.1)'}`,
        }}
      >
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wide">
          <span style={{ color: ch.color }}>{ch.label}</span>
          <span className="text-slate-500">{outbound ? '→ subscriber' : '← from subscriber'}</span>
          {item.status && <span className="text-slate-500">· {item.status}</span>}
        </div>
        <div className="text-sm text-slate-200 whitespace-pre-wrap break-words">{item.body || '(empty)'}</div>
        <div className="text-[10px] text-slate-500">{fmt(item.at)}</div>
      </div>
    </div>
  );
}

export default function ConversationHistory({ token, subscriberId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!subscriberId) return;
    setLoading(true);
    fetchSubscriberConversation(token, subscriberId, { limit: 200 })
      .then(d => setItems(d.items || []))
      .catch(e => setErr(e.detail || e.message))
      .finally(() => setLoading(false));
  }, [token, subscriberId]);

  if (loading) return <p className="text-slate-500 text-sm">Loading…</p>;
  if (err) return <p className="text-red-400 text-sm">{err}</p>;
  if (items.length === 0) {
    return <div className="rounded-xl p-8 text-center" style={card}>
      <p className="text-slate-400 text-sm">No conversation yet.</p>
    </div>;
  }
  const chronological = [...items].reverse();
  return (
    <div className="space-y-2">
      {chronological.map(it => <Bubble key={it.id} item={it} />)}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { fetchLeadPackHistory } from '../../api/dashboard';

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

function esc(s) {
  return String(s || '');
}

export default function LeadPackHistory({ feedUuid }) {
  const [purchases, setPurchases] = useState([]);

  useEffect(() => {
    fetchLeadPackHistory(feedUuid)
      .then(data => setPurchases(data.purchases || []))
      .catch(() => {});
  }, [feedUuid]);

  if (purchases.length === 0) return null;

  return (
    <div className="mt-12 border-t border-white/10 pt-10 animate-in">
      <h2 className="text-xl font-bold mb-5 flex items-center gap-2">
        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Lead Pack History
      </h2>
      <div className="space-y-3">
        {purchases.map((p, i) => {
          const date = p.purchased_at
            ? new Date(p.purchased_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : '—';
          const exclusiveUntil = p.exclusive_until
            ? new Date(p.exclusive_until).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            : '—';
          const statusColor = p.status === 'delivered' ? 'text-green-400' : 'text-slate-400';
          const statusBg = p.status === 'delivered' ? 'bg-green-400/10' : 'bg-slate-400/10';

          return (
            <div
              key={i}
              className="glass lead-card rounded-xl px-5 py-4 flex items-center justify-between gap-4 flex-wrap animate-in"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-yellow-400/15 to-purple-500/15 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">ZIP {esc(p.zip_code)} &middot; {capitalize(p.vertical)}</p>
                  <p className="text-slate-400 text-xs mt-0.5">Purchased {date} &middot; {p.lead_count} leads</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className={`${statusColor} ${statusBg} text-xs font-semibold capitalize px-2.5 py-1 rounded-full`}>{p.status}</span>
                {p.exclusive_active ? (
                  <p className="text-yellow-400 text-xs mt-1.5 font-medium">Exclusive until {exclusiveUntil}</p>
                ) : (
                  <p className="text-slate-500 text-xs mt-1.5">Exclusivity expired</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

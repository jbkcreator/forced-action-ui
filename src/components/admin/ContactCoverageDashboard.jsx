import { useCallback, useEffect, useState } from 'react';
import { fetchContactCoverage } from '../../api/admin';

export default function ContactCoverageDashboard({ token }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [county, setCounty] = useState('hillsborough');
  const [loading, setLoading] = useState(false);

  const load = useCallback((c, signal) => {
    setLoading(true);
    setError('');
    return fetchContactCoverage(token, c, { signal })
      .then(setData)
      .catch(e => { if (e.name !== 'AbortError') setError(e.message || e.detail || 'Failed'); })
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    const controller = new AbortController();
    load(county, controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const s = data?.summary;

  return (
    <div className="w-full max-w-4xl">
      <div className="flex items-center gap-3 mb-5">
        <input
          type="text"
          aria-label="County ID"
          value={county}
          onChange={e => setCounty(e.target.value)}
          onBlur={() => load(county)}
          className="rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-yellow-400/40 w-44"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          placeholder="county_id"
        />
        <button
          onClick={() => load(county)}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 border border-slate-700 hover:border-slate-500 transition-colors disabled:opacity-50"
        >
          {loading ? 'Loading…' : 'Refresh'}
        </button>
        <p className="text-xs text-slate-500">Gold / Platinum / Ultra Platinum only</p>
      </div>

      {error && <p className="text-red-400 text-sm mb-4">Error: {error}</p>}

      {s && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Gold+ Properties', value: s.total_gold_plus?.toLocaleString(), color: 'yellow' },
              { label: 'With Contact', value: s.with_contact?.toLocaleString(), color: 'emerald' },
              { label: 'No Contact', value: s.contactless?.toLocaleString(), color: 'red' },
              { label: 'Dark Pool %', value: `${s.contactless_pct}%`, color: s.contactless_pct > 30 ? 'red' : s.contactless_pct > 15 ? 'yellow' : 'emerald' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl p-4" style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className={`text-2xl font-bold text-${color}-300`}>{value ?? '—'}</div>
                <div className={`text-xs text-${color}-600 mt-0.5`}>{label}</div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="px-5 py-3 border-b border-white/5">
              <p className="text-sm font-semibold text-white">By ZIP — sorted by contactless count</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-500 border-b border-white/5">
                    <th className="text-left px-5 py-2.5">ZIP</th>
                    <th className="text-right px-4 py-2.5">Gold+</th>
                    <th className="text-right px-4 py-2.5">With Contact</th>
                    <th className="text-right px-4 py-2.5">No Contact</th>
                    <th className="text-right px-5 py-2.5">Dark Pool %</th>
                  </tr>
                </thead>
                <tbody>
                  {data.by_zip.map(r => (
                    <tr key={r.zip} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td className="px-5 py-2.5 text-white font-mono">{r.zip}</td>
                      <td className="px-4 py-2.5 text-right text-slate-300">{r.total.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-right text-emerald-400">{r.with_contact.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-right text-red-400">{r.contactless.toLocaleString()}</td>
                      <td className="px-5 py-2.5 text-right">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            r.contactless_pct > 30
                              ? 'text-red-300 bg-red-950/40'
                              : r.contactless_pct > 15
                              ? 'text-yellow-300 bg-yellow-950/40'
                              : 'text-emerald-300 bg-emerald-950/40'
                          }`}
                        >
                          {r.contactless_pct}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

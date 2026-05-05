import { useEffect, useState } from 'react';
import { fetchSynthflowConfig } from '../../api/admin';

const VERTICAL_LABEL = { roofing: 'Roofing', remediation: 'Remediation', investor: 'Investor' };
const VERTICAL_COLOR = { roofing: '#3b82f6', remediation: '#10b981', investor: '#f59e0b' };

export default function SynthflowDashboard({ token }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('campaigns');
  const [expandedPrompt, setExpandedPrompt] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchSynthflowConfig(token, { signal: controller.signal })
      .then(setData)
      .catch(e => { if (e.name !== 'AbortError') setError(e.message || e.detail || 'Failed'); });
    return () => controller.abort();
  }, [token]);

  if (error) return <p className="text-red-400 text-sm p-4">Failed to load config: {error}</p>;
  if (!data) return <p className="text-slate-500 text-sm p-4 animate-pulse">Loading Synthflow config…</p>;

  const tabs = [
    { id: 'campaigns', label: 'Campaigns' },
    { id: 'agents',    label: 'Agents' },
    { id: 'prompts',   label: 'Prompts' },
  ];

  return (
    <div className="w-full max-w-4xl">
      <div className="flex gap-1 mb-5 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              background: tab === t.id ? 'rgba(250,204,21,0.12)' : 'transparent',
              color: tab === t.id ? '#facc15' : '#94a3b8',
              border: tab === t.id ? '1px solid rgba(250,204,21,0.25)' : '1px solid transparent',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'campaigns' && (
        <div className="space-y-4">
          {data.campaigns.length === 0 && <p className="text-slate-500 text-sm">No campaigns found in config/</p>}
          {data.campaigns.map((c, i) => (
            <div key={i} className="rounded-2xl p-6" style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-white font-semibold text-base">{c.name}</h3>
                  <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${VERTICAL_COLOR[c.vertical]}22`, color: VERTICAL_COLOR[c.vertical] }}>
                    {VERTICAL_LABEL[c.vertical] || c.vertical}
                  </span>
                </div>
                <span className="text-xs text-emerald-400 bg-emerald-950/50 border border-emerald-800/40 px-2.5 py-1 rounded-full">Active</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {[
                  { label: 'Total Volume', value: c.total_volume?.toLocaleString() ?? '—' },
                  { label: 'Daily Cap', value: c.daily_cap ?? '—' },
                  { label: 'Launch Date', value: c.launch_date || '—' },
                  { label: 'Area Codes', value: c.area_codes?.join(', ') || '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="text-xs text-slate-500 mb-1">{label}</div>
                    <div className="text-sm text-white font-medium">{value}</div>
                  </div>
                ))}
              </div>
              {c.prospect_sources?.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-2">Prospect Sources</p>
                  <ul className="space-y-1">
                    {c.prospect_sources.map((s, j) => (
                      <li key={j} className="text-xs text-slate-400 flex items-start gap-2">
                        <span className="text-yellow-500 mt-0.5">•</span>{s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-xs text-slate-500 mb-1">Webhook</p>
                <code className="text-xs text-slate-300 break-all">{c.webhook_url || '—'}</code>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'agents' && (
        <div className="space-y-4">
          {data.agents.length === 0 && <p className="text-slate-500 text-sm">No agent configs found in config/</p>}
          {data.agents.map((a, i) => (
            <div key={i} className="rounded-2xl p-6" style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold" style={{ background: `${VERTICAL_COLOR[a.vertical]}22`, color: VERTICAL_COLOR[a.vertical] }}>
                    {(VERTICAL_LABEL[a.vertical] || a.vertical)[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-semibold">Forced Action — {VERTICAL_LABEL[a.vertical] || a.vertical} Outbound</p>
                    <p className="text-xs text-slate-500 mt-0.5">{a.agent_id}</p>
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${a.status === 'Published' ? 'text-emerald-400 bg-emerald-950/50 border-emerald-800/40' : 'text-yellow-400 bg-yellow-950/50 border-yellow-800/40'}`}>
                  {a.status}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                {[
                  { label: 'Voice',       value: a.voice_name || '—' },
                  { label: 'Provider',    value: a.voice_provider || '—' },
                  { label: 'LLM',         value: a.llm || '—' },
                  { label: 'Language',    value: a.language || '—' },
                  { label: 'Type',        value: a.agent_type || '—' },
                  { label: 'Max Duration',value: a.max_duration_seconds ? `${a.max_duration_seconds}s` : '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="text-xs text-slate-500 mb-1">{label}</div>
                    <div className="text-sm text-white font-medium">{value}</div>
                  </div>
                ))}
              </div>
              <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-xs text-slate-500 mb-2">Greeting Message</p>
                <p className="text-sm text-slate-300 leading-relaxed">{a.greeting || '—'}</p>
              </div>
              <div className="mt-3">
                <p className="text-xs text-slate-500 mb-1">Post-call Webhook</p>
                <code className="text-xs text-slate-300 break-all">{a.webhook_url || '—'}</code>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'prompts' && (
        <div className="space-y-4">
          {data.prompts.length === 0 && <p className="text-slate-500 text-sm">No prompt configs found in config/prompts/</p>}
          {data.prompts.map((p, i) => (
            <div key={i} className="rounded-2xl overflow-hidden" style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <button
                className="w-full flex items-center justify-between p-6 text-left"
                onClick={() => setExpandedPrompt(expandedPrompt === i ? null : i)}
              >
                <div className="flex items-center gap-3">
                  <span className="inline-block text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${VERTICAL_COLOR[p.vertical]}22`, color: VERTICAL_COLOR[p.vertical] }}>
                    {VERTICAL_LABEL[p.vertical] || p.vertical}
                  </span>
                  <span className="text-white font-semibold">{p.agent_name}</span>
                </div>
                <svg className={`w-4 h-4 text-slate-400 transition-transform ${expandedPrompt === i ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {expandedPrompt === i && (
                <div className="px-6 pb-6 space-y-4">
                  {p.first_message && (
                    <div>
                      <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide">First Message</p>
                      <div className="rounded-xl p-4 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        {p.first_message}
                      </div>
                    </div>
                  )}
                  {p.system_prompt && (
                    <div>
                      <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide">System Prompt</p>
                      <div className="rounded-xl p-4 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-mono text-xs" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', maxHeight: '400px', overflowY: 'auto' }}>
                        {p.system_prompt}
                      </div>
                    </div>
                  )}
                  {p.voicemail_script && (
                    <div>
                      <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide">Voicemail Script</p>
                      <div className="rounded-xl p-4 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        {p.voicemail_script}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

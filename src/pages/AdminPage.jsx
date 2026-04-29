import { useState, useEffect, useRef } from 'react';

const TOKEN_KEY = 'admin_token';
const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

// ── API helpers ───────────────────────────────────────────────────────────────

async function fetchSynthflowConfig(token) {
  const res = await fetch(`${API_BASE}/api/admin/synthflow/config`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function fetchUnlockRefunds(token, offset = 0) {
  const res = await fetch(`${API_BASE}/api/admin/refunds/unlocks?limit=50&offset=${offset}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function fetchContactCoverage(token, countyId = 'hillsborough') {
  const res = await fetch(`${API_BASE}/api/admin/stats/contact-coverage?county_id=${countyId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function issueRefund(token, sentLeadId, reason) {
  const res = await fetch(`${API_BASE}/api/admin/refunds/unlock/${sentLeadId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || `HTTP ${res.status}`);
  return data;
}

async function adminLogin(username, password) {
  const res = await fetch(`${API_BASE}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw { status: res.status, detail: data.detail || 'Login failed' };
  return data.access_token;
}

async function uploadTaxDelinquency(token, file, countyId, taxYear) {
  const form = new FormData();
  form.append('file', file);
  form.append('county_id', countyId || 'hillsborough');
  if (taxYear) form.append('tax_year', taxYear);

  const res = await fetch(`${API_BASE}/api/admin/upload/tax-delinquency`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw { status: res.status, detail: data.detail || 'Upload failed' };
  return data;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function LoginCard({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const token = await adminLogin(username, password);
      localStorage.setItem(TOKEN_KEY, token);
      onLogin(token);
    } catch (err) {
      setError(err.detail || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-8">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-sm text-slate-900"
          style={{ background: 'linear-gradient(135deg, #facc15, #f59e0b)' }}
        >
          FA
        </div>
        <div>
          <p className="font-bold text-white leading-none">Forced Action</p>
          <p className="text-xs text-slate-500 mt-0.5">Admin</p>
        </div>
      </div>

      <div
        className="rounded-2xl p-7"
        style={{
          background: 'rgba(15,23,42,0.8)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
        }}
      >
        <h1 className="text-lg font-semibold text-white mb-1">Sign in</h1>
        <p className="text-slate-400 text-sm mb-6">Admin access only</p>

        {error && (
          <div className="mb-4 text-sm text-red-400 bg-red-950/60 border border-red-800/60 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
              required
              className="w-full rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              placeholder="admin"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="w-full rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-slate-900 transition-opacity disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #facc15, #f59e0b)' }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}

function UploadCard({ token, onLogout, hideHeader = false }) {
  const [countyId, setCountyId] = useState('hillsborough');
  const [taxYear, setTaxYear] = useState('');
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const fileRef = useRef();

  function handleFile(f) {
    if (!f || !f.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a .csv file');
      return;
    }
    setFile(f);
    setError('');
    setResult(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!file) { setError('Please select a CSV file'); return; }

    setLoading(true);
    try {
      const data = await uploadTaxDelinquency(token, file, countyId, taxYear || null);
      setResult(data);
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      if (err.status === 401) { onLogout(); return; }
      setError(err.detail || 'Upload failed — check server logs');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-lg">
      {/* Header — hidden when rendered inside AuthenticatedShell */}
      {!hideHeader && (
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-sm text-slate-900" style={{ background: 'linear-gradient(135deg, #facc15, #f59e0b)' }}>FA</div>
            <div>
              <p className="font-bold text-white leading-none">Data Upload</p>
              <p className="text-xs text-slate-500 mt-0.5">Tax Delinquency</p>
            </div>
          </div>
          <button onClick={onLogout} className="text-xs text-slate-500 hover:text-slate-300 border border-slate-700 hover:border-slate-500 rounded-lg px-3 py-1.5 transition-colors">Sign out</button>
        </div>
      )}

      <div
        className="rounded-2xl p-7"
        style={{
          background: 'rgba(15,23,42,0.8)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
        }}
      >
        {error && (
          <div className="mb-5 text-sm text-red-400 bg-red-950/60 border border-red-800/60 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {result && (
          <div className="mb-5 rounded-xl p-4 bg-emerald-950/40 border border-emerald-800/40">
            <p className="text-sm font-semibold text-emerald-300 mb-3">
              Upload complete — {result.total_rows?.toLocaleString()} rows processed
            </p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Inserted', value: result.matched, color: 'emerald' },
                { label: 'Updated', value: result.updated, color: 'yellow' },
                { label: 'Unmatched', value: result.unmatched, color: 'red' },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  className={`rounded-lg p-3 text-center bg-${color}-900/30 border border-${color}-800/30`}
                >
                  <div className={`text-2xl font-bold text-${color}-300`}>{value?.toLocaleString()}</div>
                  <div className={`text-xs text-${color}-600 mt-0.5`}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">County ID</label>
              <input
                type="text"
                value={countyId}
                onChange={e => setCountyId(e.target.value)}
                className="w-full rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">
                Tax Year <span className="text-slate-600">(optional)</span>
              </label>
              <input
                type="number"
                value={taxYear}
                onChange={e => setTaxYear(e.target.value)}
                placeholder="2025"
                className="w-full rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>
          </div>

          {/* Drop zone */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">CSV File</label>
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
              className="cursor-pointer rounded-xl px-6 py-8 text-center transition-colors"
              style={{
                border: `2px dashed ${dragging ? 'rgba(250,204,21,0.5)' : 'rgba(255,255,255,0.12)'}`,
                background: dragging ? 'rgba(250,204,21,0.04)' : 'rgba(255,255,255,0.02)',
              }}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={e => handleFile(e.target.files[0])}
              />
              {file ? (
                <div>
                  <div className="inline-flex items-center gap-2 text-yellow-300 text-sm font-medium mb-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {file.name}
                  </div>
                  <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div>
                  <svg className="w-8 h-8 text-slate-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-sm text-slate-400">
                    <span className="text-yellow-400 font-medium">Choose file</span> or drag & drop
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    Requires <code className="text-slate-500">Account Number</code> ·
                    optional <code className="text-slate-500">Tax Yr</code>
                  </p>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !file}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-slate-900 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #facc15, #f59e0b)' }}
          >
            {loading ? 'Processing…' : 'Upload & Process'}
          </button>
        </form>

        <p className="mt-4 text-xs text-slate-600">
          Columns: <code className="text-slate-500">Account Number</code>, <code className="text-slate-500">Tax Yr</code>,{' '}
          <code className="text-slate-500">Owner Name</code> — optional:{' '}
          <code className="text-slate-500">years_delinquent_scraped</code>,{' '}
          <code className="text-slate-500">total_amount_due</code>,{' '}
          <code className="text-slate-500">Cert Status</code>, <code className="text-slate-500">Deed Status</code>
        </p>
      </div>
    </div>
  );
}

// ── Synthflow dashboard ───────────────────────────────────────────────────────

const VERTICAL_LABEL = { roofing: 'Roofing', remediation: 'Remediation', investor: 'Investor' };
const VERTICAL_COLOR = { roofing: '#3b82f6', remediation: '#10b981', investor: '#f59e0b' };

function SynthflowDashboard({ token }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('campaigns');
  const [expandedPrompt, setExpandedPrompt] = useState(null);

  useEffect(() => {
    fetchSynthflowConfig(token)
      .then(setData)
      .catch(e => setError(e.message));
  }, [token]);

  if (error) return (
    <p className="text-red-400 text-sm p-4">Failed to load config: {error}</p>
  );
  if (!data) return (
    <p className="text-slate-500 text-sm p-4 animate-pulse">Loading Synthflow config…</p>
  );

  const tabs = [
    { id: 'campaigns', label: 'Campaigns' },
    { id: 'agents',    label: 'Agents' },
    { id: 'prompts',   label: 'Prompts' },
  ];

  return (
    <div className="w-full max-w-4xl">
      {/* Tab bar */}
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

      {/* Campaigns */}
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

      {/* Agents */}
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

      {/* Prompts */}
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

// ── Contact coverage (dark pool) ─────────────────────────────────────────────

function ContactCoverageDashboard({ token }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [county, setCounty] = useState('hillsborough');
  const [loading, setLoading] = useState(false);

  function load(c) {
    setLoading(true);
    setError('');
    fetchContactCoverage(token, c)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(county); }, [token]);

  const s = data?.summary;

  return (
    <div className="w-full max-w-4xl">
      {/* County selector */}
      <div className="flex items-center gap-3 mb-5">
        <input
          type="text"
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
          {/* Summary cards */}
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

          {/* ZIP breakdown table */}
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
                  {data.by_zip.map((r, i) => (
                    <tr key={r.zip} className={i % 2 === 0 ? '' : ''} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
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

// ── Refunds dashboard ─────────────────────────────────────────────────────────

function RefundsDashboard({ token }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  const [refunding, setRefunding] = useState(null); // sentLeadId being refunded
  const [reasonMap, setReasonMap] = useState({});   // sentLeadId → reason string

  useEffect(() => {
    fetchUnlockRefunds(token)
      .then(setRows)
      .catch(e => setError(e.message));
  }, [token]);

  async function handleRefund(id) {
    const reason = (reasonMap[id] || '').trim();
    if (!reason) return;
    setRefunding(id);
    try {
      await issueRefund(token, id, reason);
      setRows(prev => prev.map(r => r.id === id
        ? { ...r, refunded_at: new Date().toISOString(), refund_reason: reason }
        : r
      ));
    } catch (e) {
      alert(`Refund failed: ${e.message}`);
    } finally {
      setRefunding(null);
    }
  }

  if (error) return <p className="text-red-400 text-sm p-4">Failed to load: {error}</p>;
  if (!rows) return <p className="text-slate-500 text-sm p-4 animate-pulse">Loading unlock purchases…</p>;

  return (
    <div className="w-full max-w-4xl">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-400">{rows.length} lead-unlock purchase{rows.length !== 1 ? 's' : ''}</p>
        <p className="text-xs text-slate-600">Refunds are full-amount. Log a reason before issuing.</p>
      </div>

      {rows.length === 0 && (
        <div className="rounded-2xl p-8 text-center" style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-slate-500 text-sm">No lead-unlock purchases yet.</p>
        </div>
      )}

      <div className="space-y-3">
        {rows.map(r => (
          <div
            key={r.id}
            className="rounded-2xl p-5"
            style={{
              background: 'rgba(15,23,42,0.8)',
              border: `1px solid ${r.refunded_at ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.08)'}`,
            }}
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate">{r.property_address || '—'}</p>
                <p className="text-slate-400 text-xs mt-0.5">{r.subscriber_email}</p>
                <p className="text-slate-600 text-xs mt-0.5">
                  {r.sent_at ? new Date(r.sent_at).toLocaleString() : '—'}
                  {r.stripe_payment_intent_id && (
                    <span className="ml-2 font-mono">{r.stripe_payment_intent_id}</span>
                  )}
                </p>
              </div>

              {r.refunded_at ? (
                <div className="text-right shrink-0">
                  <span className="inline-block text-xs text-red-400 bg-red-950/40 border border-red-800/30 px-2.5 py-1 rounded-full">
                    Refunded
                  </span>
                  <p className="text-xs text-slate-600 mt-1">{r.refund_reason}</p>
                </div>
              ) : (
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="text"
                    placeholder="Reason (required)"
                    value={reasonMap[r.id] || ''}
                    onChange={e => setReasonMap(prev => ({ ...prev, [r.id]: e.target.value }))}
                    className="rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-red-400/40 w-44"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                  <button
                    onClick={() => handleRefund(r.id)}
                    disabled={refunding === r.id || !(reasonMap[r.id] || '').trim() || !r.stripe_payment_intent_id}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity disabled:opacity-40"
                    style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}
                    title={!r.stripe_payment_intent_id ? 'No payment intent ID — refund manually in Stripe' : ''}
                  >
                    {refunding === r.id ? 'Refunding…' : 'Refund $4'}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Authenticated shell ───────────────────────────────────────────────────────

function AuthenticatedShell({ token, onLogout }) {
  const [activeSection, setActiveSection] = useState('upload');

  const nav = [
    { id: 'upload',    label: 'Data Upload' },
    { id: 'synthflow', label: 'Synthflow' },
    { id: 'refunds',   label: 'Refunds' },
    { id: 'coverage',  label: 'Contact Coverage' },
  ];

  return (
    <div className="w-full max-w-4xl">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-sm text-slate-900" style={{ background: 'linear-gradient(135deg, #facc15, #f59e0b)' }}>FA</div>
          <div>
            <p className="font-bold text-white leading-none">Forced Action</p>
            <p className="text-xs text-slate-500 mt-0.5">Admin</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {nav.map(n => (
              <button
                key={n.id}
                onClick={() => setActiveSection(n.id)}
                className="px-3 py-1.5 rounded text-xs font-medium transition-colors"
                style={{
                  background: activeSection === n.id ? 'rgba(250,204,21,0.12)' : 'transparent',
                  color: activeSection === n.id ? '#facc15' : '#94a3b8',
                }}
              >
                {n.label}
              </button>
            ))}
          </div>
          <button onClick={onLogout} className="text-xs text-slate-500 hover:text-slate-300 border border-slate-700 hover:border-slate-500 rounded-lg px-3 py-1.5 transition-colors">
            Sign out
          </button>
        </div>
      </div>

      {activeSection === 'upload' && <UploadCard token={token} onLogout={onLogout} hideHeader />}
      {activeSection === 'synthflow' && <SynthflowDashboard token={token} />}
      {activeSection === 'refunds' && <RefundsDashboard token={token} />}
      {activeSection === 'coverage' && <ContactCoverageDashboard token={token} />}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));

  // Validate stored token on mount — clears it if expired or invalid
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) return;
    fetch(`${API_BASE}/api/admin/synthflow/config`, {
      headers: { Authorization: `Bearer ${stored}` },
    }).then(res => {
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
      }
    }).catch(() => {
      // network error — keep token, server may be starting up
    });
  }, []);

  function handleLogin(t) { setToken(t); }
  function handleLogout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #0f172a 50%, #0a0f1e 100%)' }}
    >
      {token ? (
        <AuthenticatedShell token={token} onLogout={handleLogout} />
      ) : (
        <LoginCard onLogin={handleLogin} />
      )}
    </div>
  );
}

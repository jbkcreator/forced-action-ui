/**
 * Supplier Intelligence admin section (fa067).
 * Route: /admin/supplier-intel
 */

import { useState, useEffect, useCallback } from 'react';
import { useAdminContext } from '../adminContext.js';
import {
  fetchSupplierAccounts,
  createSupplierAccount,
  createSupplierCheckout,
  generateSupplierReport,
  downloadSupplierReport,
} from '../../../api/supplierIntel.js';

const PLAN_OPTIONS = [
  { key: 'foundation', label: 'Foundation — $497/mo' },
  { key: 'standard',   label: 'Standard — $997/mo' },
  { key: 'premium',    label: 'Premium — $1,497/mo' },
];

const STATUS_PILL = {
  active:    'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  suspended: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  canceled:  'bg-red-500/20 text-red-400 border border-red-500/30',
};

const SUB_STATUS_COLOR = {
  trialing: 'text-blue-400',
  active:   'text-emerald-400',
  past_due: 'text-yellow-400',
  canceled: 'text-red-400',
};

export default function SupplierIntelSection() {
  const { token } = useAdminContext();
  const [accounts, setAccounts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [generatingFor, setGeneratingFor] = useState(null);
  const [checkoutFor, setCheckoutFor] = useState(null);   // account id currently creating checkout
  const [checkoutLinks, setCheckoutLinks] = useState({}); // {accountId: {url, plan_tier}}

  const [form, setForm] = useState({
    company_name: '', contact_name: '', contact_email: '',
    counties: '', verticals: '', plan_tier: '',
  });

  // Per-account checkout plan selection state: {accountId: planTier}
  const [checkoutPlan, setCheckoutPlan] = useState({});

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const data = await fetchSupplierAccounts(token);
      setAccounts(data.accounts || []);
      setTotal(data.total || 0);
    } catch (e) {
      setError(e?.message || e?.detail || 'Failed to load accounts');
    } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const showSuccess = msg => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 6000); };

  const handleCreate = async e => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await createSupplierAccount(token, {
        company_name: form.company_name,
        contact_name: form.contact_name || undefined,
        contact_email: form.contact_email,
        counties:  form.counties  ? form.counties.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        verticals: form.verticals ? form.verticals.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        plan_tier: form.plan_tier || undefined,
      });
      showSuccess('Account created.');
      setShowCreate(false);
      setForm({ company_name: '', contact_name: '', contact_email: '', counties: '', verticals: '', plan_tier: '' });
      await load();
    } catch (e) {
      setError(e?.message || e?.detail || 'Create failed');
    } finally { setLoading(false); }
  };

  const handleCreateCheckout = async (acc) => {
    const plan = checkoutPlan[acc.id] || 'foundation';
    setCheckoutFor(acc.id);
    try {
      const res = await createSupplierCheckout(token, acc.id, plan, true);
      setCheckoutLinks(prev => ({ ...prev, [acc.id]: { url: res.checkout_url, plan_tier: res.plan_tier } }));
      showSuccess(`Checkout link created for ${acc.company_name} (${res.plan_tier}).`);
    } catch (e) {
      setError(e?.message || e?.detail?.message || e?.detail || 'Checkout creation failed');
    } finally { setCheckoutFor(null); }
  };

  const handleGenerateReport = async (accountId, county_id) => {
    if (!county_id) { setError('Enter a county_id to generate a report'); return; }
    try {
      const res = await generateSupplierReport(token, accountId, { county_id });
      showSuccess(`Report ${res.report_id} generated (${res.status}).`);
      await load();
    } catch (e) {
      setError(e?.message || e?.detail || 'Report generation failed');
    }
  };

  return (
    <div className="px-6 py-6">
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-fa-text-primary">Supplier Intelligence</h2>
          <p className="text-sm text-fa-text-muted mt-0.5">
            Foundation (Phase 1) — admin-provisioned accounts, Stripe subscriptions, report generation, PDF/CSV export.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={load} disabled={loading}
            className="px-3 py-1.5 text-sm border border-fa-border-default rounded-lg text-fa-text-secondary hover:text-fa-text-primary disabled:opacity-50">
            {loading ? 'Loading…' : '↻ Refresh'}
          </button>
          <button type="button" onClick={() => setShowCreate(true)}
            className="px-3 py-1.5 text-sm font-semibold bg-fa-primary text-fa-bg-base rounded-lg hover:opacity-90">
            + New Account
          </button>
        </div>
      </div>

      {error && <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded px-4 py-2">{error}</p>}
      {successMsg && <p className="text-emerald-400 text-sm bg-emerald-900/20 border border-emerald-800 rounded px-4 py-2">{successMsg}</p>}

      {/* ── Create form ───────────────────────────────────────────────────── */}
      {showCreate && (
        <form onSubmit={handleCreate} className="bg-fa-bg-card border border-fa-border-default rounded-xl p-5 space-y-3">
          <h3 className="font-semibold text-fa-text-primary">Create Supplier Account</h3>

          {[
            ['company_name', 'Company name *', 'text', true],
            ['contact_name', 'Contact name',   'text', false],
            ['contact_email','Contact email *','email', true],
            ['counties',     'Counties (comma-separated IDs)', 'text', false],
            ['verticals',    'Verticals (comma-separated)',    'text', false],
          ].map(([field, label, type, required]) => (
            <div key={field}>
              <label className="block text-xs font-medium text-fa-text-secondary mb-1">{label}</label>
              <input type={type} required={required} value={form[field]}
                onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                className="w-full bg-fa-bg-base border border-fa-border-default rounded-lg px-3 py-2 text-sm text-fa-text-primary focus:outline-none focus:border-fa-primary" />
            </div>
          ))}

          {/* Plan selection */}
          <div>
            <label className="block text-xs font-medium text-fa-text-secondary mb-1">
              Plan tier <span className="text-fa-text-muted">(optional — can be assigned later)</span>
            </label>
            <select
              value={form.plan_tier}
              onChange={e => setForm(f => ({ ...f, plan_tier: e.target.value }))}
              className="w-full bg-fa-bg-base border border-fa-border-default rounded-lg px-3 py-2 text-sm text-fa-text-primary focus:outline-none focus:border-fa-primary"
            >
              <option value="">— No plan yet —</option>
              {PLAN_OPTIONS.map(p => (
                <option key={p.key} value={p.key}>{p.label}</option>
              ))}
            </select>
            {form.plan_tier && (
              <p className="text-xs text-fa-text-muted mt-1">
                A Stripe checkout link can be generated after account creation.
              </p>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={loading}
              className="px-4 py-2 text-sm font-semibold bg-fa-primary text-fa-bg-base rounded-lg hover:opacity-90 disabled:opacity-50">
              Create
            </button>
            <button type="button" onClick={() => setShowCreate(false)}
              className="px-4 py-2 text-sm text-fa-text-muted hover:text-fa-text-primary">Cancel</button>
          </div>
        </form>
      )}

      {/* ── Account list ──────────────────────────────────────────────────── */}
      <p className="text-xs text-fa-text-muted">{total} account{total !== 1 ? 's' : ''}</p>
      <div className="space-y-4">
        {accounts.map(acc => (
          <div key={acc.id} className="bg-fa-bg-card border border-fa-border-default rounded-xl p-5 space-y-3">

            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-fa-text-primary">{acc.company_name}</h3>
                <p className="text-xs text-fa-text-muted">{acc.contact_email} · ID {acc.id}</p>
                <p className="text-xs mt-0.5">
                  {acc.plan_tier
                    ? <span>Tier: <span className="font-semibold text-fa-text-secondary capitalize">{acc.plan_tier}</span></span>
                    : <span className="text-fa-text-muted">No subscription</span>
                  }
                  {acc.sub_status && (
                    <span className={`ml-2 ${SUB_STATUS_COLOR[acc.sub_status] || 'text-fa-text-muted'}`}>
                      ({acc.sub_status})
                    </span>
                  )}
                </p>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_PILL[acc.status] || ''}`}>
                {acc.status}
              </span>
            </div>

            {/* Coverage */}
            {(acc.counties?.length || acc.verticals?.length) && (
              <div className="flex gap-4 text-xs text-fa-text-muted">
                {acc.counties?.length ? <span>Counties: {acc.counties.join(', ')}</span> : null}
                {acc.verticals?.length ? <span>Verticals: {acc.verticals.join(', ')}</span> : null}
              </div>
            )}

            {/* Access token */}
            <div className="text-xs">
              <span className="text-fa-text-muted">Access token: </span>
              <span className="font-mono text-fa-text-secondary">{acc.access_token}</span>
              <span className="mx-2 text-fa-text-muted">·</span>
              <a href={`/supplier/${acc.access_token}`} target="_blank" rel="noopener noreferrer"
                 className="text-fa-primary hover:underline">Open dashboard</a>
            </div>

            {/* ── Stripe checkout ──────────────────────────────────────── */}
            {!acc.sub_status || acc.sub_status === 'canceled' ? (
              <div className="border border-fa-border-default/50 rounded-lg p-3 space-y-2">
                <p className="text-xs font-medium text-fa-text-secondary">Create Stripe Subscription</p>
                <div className="flex gap-2 items-center flex-wrap">
                  <select
                    value={checkoutPlan[acc.id] || ''}
                    onChange={e => setCheckoutPlan(prev => ({ ...prev, [acc.id]: e.target.value }))}
                    className="bg-fa-bg-base border border-fa-border-default rounded px-2 py-1 text-xs text-fa-text-primary focus:outline-none focus:border-fa-primary"
                  >
                    <option value="">— Select plan —</option>
                    {PLAN_OPTIONS.map(p => (
                      <option key={p.key} value={p.key}>{p.label}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={!checkoutPlan[acc.id] || checkoutFor === acc.id}
                    onClick={() => handleCreateCheckout(acc)}
                    className="px-3 py-1 text-xs font-semibold bg-fa-primary/80 text-fa-bg-base rounded hover:bg-fa-primary disabled:opacity-40"
                  >
                    {checkoutFor === acc.id ? 'Creating…' : 'Create Checkout Link'}
                  </button>
                </div>
                {/* Display freshly created link */}
                {checkoutLinks[acc.id] && (
                  <div className="mt-1 p-2 bg-emerald-900/20 border border-emerald-800/50 rounded text-xs space-y-1">
                    <p className="text-emerald-400 font-medium">
                      Checkout link ready — {checkoutLinks[acc.id].plan_tier}
                    </p>
                    <a
                      href={checkoutLinks[acc.id].url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-fa-primary hover:underline break-all"
                    >
                      {checkoutLinks[acc.id].url}
                    </a>
                    <p className="text-fa-text-muted">Send this link to the supplier. Subscription status updates automatically after payment via Stripe webhook.</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-emerald-400">
                Active subscription ({acc.plan_tier} · {acc.sub_status})
              </p>
            )}

            {/* ── Generate report ──────────────────────────────────────── */}
            <div className="flex gap-2 items-center">
              <input type="text" placeholder="county_id (e.g. hillsborough)"
                id={`county-${acc.id}`}
                className="flex-1 max-w-xs bg-fa-bg-base border border-fa-border-default rounded px-2 py-1 text-xs text-fa-text-primary focus:outline-none focus:border-fa-primary" />
              <button type="button"
                onClick={() => handleGenerateReport(acc.id, document.getElementById(`county-${acc.id}`)?.value)}
                className="px-3 py-1 text-xs font-semibold bg-fa-primary/80 text-fa-bg-base rounded hover:bg-fa-primary">
                Generate report
              </button>
            </div>

            {/* ── Report history ───────────────────────────────────────── */}
            {acc.reports?.length > 0 && (
              <div className="text-xs">
                <p className="text-fa-text-muted font-medium mb-1">Recent reports</p>
                {acc.reports.map(r => (
                  <div key={r.id} className="flex items-center gap-3 py-1 border-b border-fa-border-default/20 last:border-0">
                    <span className="text-fa-text-secondary">{r.county_id}</span>
                    <span className={r.status === 'generated' || r.status === 'exported' ? 'text-emerald-400 font-semibold' : 'text-fa-text-muted'}>
                      {r.status}
                    </span>
                    <span className="text-fa-text-muted">{(r.generated_at || r.created_at)?.slice(0, 10)}</span>
                    {(r.status === 'generated' || r.status === 'exported') && (
                      <>
                        <a href={downloadSupplierReport('', acc.id, r.id, 'pdf')} className="text-fa-primary hover:underline">PDF</a>
                        <a href={downloadSupplierReport('', acc.id, r.id, 'csv')} className="text-fa-primary hover:underline">CSV</a>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {!loading && accounts.length === 0 && (
          <p className="text-fa-text-muted text-sm">No supplier accounts yet. Create one above.</p>
        )}
      </div>
    </div>
    </div>
  );
}

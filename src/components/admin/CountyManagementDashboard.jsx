import { useCallback, useEffect, useRef, useState } from 'react';
import {
  addSource,
  createCounty,
  deactivateCounty,
  deactivateSource,
  fetchCounties,
  fetchSources,
  updateCounty,
  updateSource,
} from '../../api/admin';

const SIGNAL_TYPES = [
  'foreclosures', 'liens', 'violations', 'permits',
  'court_records', 'tax_delinquency', 'master_data',
];
const OUTPUT_FORMATS = ['csv', 'table', 'excel'];
const FREQUENCIES = ['daily', 'weekly', 'monthly', 'manual'];
const PARCEL_FORMATS = ['folio', 'strap', 'other'];

// ─── Shared style tokens ──────────────────────────────────────────────────────
const card = { background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)' };
const inputCls = 'w-full rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-yellow-400/40';
const inputStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' };
const btnYellow = 'px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-900 disabled:opacity-40 transition-opacity';
const btnGhost = 'px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 border border-slate-700 hover:border-slate-500 transition-colors disabled:opacity-50';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Badge({ children, color = 'slate' }) {
  const colors = {
    green:  { bg: 'rgba(16,185,129,0.12)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.25)' },
    red:    { bg: 'rgba(239,68,68,0.12)',  color: '#fca5a5', border: '1px solid rgba(239,68,68,0.25)' },
    yellow: { bg: 'rgba(250,204,21,0.12)', color: '#fde68a', border: '1px solid rgba(250,204,21,0.25)' },
    slate:  { bg: 'rgba(148,163,184,0.1)', color: '#94a3b8', border: '1px solid rgba(148,163,184,0.2)' },
    blue:   { bg: 'rgba(96,165,250,0.12)', color: '#93c5fd', border: '1px solid rgba(96,165,250,0.25)' },
  };
  const s = colors[color] || colors.slate;
  return (
    <span className="inline-block text-xs px-2 py-0.5 rounded-full font-medium" style={s}>
      {children}
    </span>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-xs text-slate-500 mb-1">{label}</label>
      {hint && <p className="text-xs text-slate-600 mb-1 leading-snug">{hint}</p>}
      {children}
    </div>
  );
}

// ─── Add / Edit County Form ───────────────────────────────────────────────────
function CountyForm({ initial = {}, onSave, onCancel, saving }) {
  const [form, setForm] = useState({
    county_id: initial.county_id || '',
    display_name: initial.display_name || '',
    fips: initial.fips || '',
    nws_zone: initial.nws_zone || '',
    parcel_id_format: initial.parcel_id_format || 'folio',
    bankruptcy_division: initial.bankruptcy_division || '',
    city_filer_keywords: (initial.city_filer_keywords || []).join(', '),
    code_lien_type_map: JSON.stringify(initial.code_lien_type_map || {}, null, 2),
  });
  const isEdit = Boolean(initial.county_id);

  function set(k, v) { setForm(p => ({ ...p, [k]: v })); }

  function handleSubmit(e) {
    e.preventDefault();
    let code_lien_type_map = {};
    try { code_lien_type_map = JSON.parse(form.code_lien_type_map || '{}'); } catch {}
    onSave({
      county_id: form.county_id.trim().toLowerCase().replace(/\s+/g, '_'),
      display_name: form.display_name.trim(),
      fips: form.fips.trim() || null,
      nws_zone: form.nws_zone.trim() || null,
      parcel_id_format: form.parcel_id_format,
      bankruptcy_division: form.bankruptcy_division.trim() || null,
      city_filer_keywords: form.city_filer_keywords.split(',').map(s => s.trim()).filter(Boolean),
      code_lien_type_map,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl p-5 space-y-4" style={{ ...card, border: '1px solid rgba(250,204,21,0.2)' }}>
      <p className="text-sm font-semibold text-white">{isEdit ? 'Edit County' : 'Add New County'}</p>

      <div className="grid grid-cols-2 gap-3">
        <Field label="County ID (slug)">
          <input className={inputCls} style={inputStyle} value={form.county_id} onChange={e => set('county_id', e.target.value)}
            placeholder="e.g. pasco" required disabled={isEdit} />
        </Field>
        <Field label="Display Name">
          <input className={inputCls} style={inputStyle} value={form.display_name} onChange={e => set('display_name', e.target.value)}
            placeholder="e.g. Pasco County" required />
        </Field>
        <Field label="FIPS Code">
          <input className={inputCls} style={inputStyle} value={form.fips} onChange={e => set('fips', e.target.value)} placeholder="12101" />
        </Field>
        <Field label="NWS Zone">
          <input className={inputCls} style={inputStyle} value={form.nws_zone} onChange={e => set('nws_zone', e.target.value)} placeholder="FLZ050" />
        </Field>
        <Field label="Parcel ID Format">
          <select className={inputCls} style={inputStyle} value={form.parcel_id_format} onChange={e => set('parcel_id_format', e.target.value)}>
            {PARCEL_FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </Field>
        <Field label="Bankruptcy Division">
          <input className={inputCls} style={inputStyle} value={form.bankruptcy_division} onChange={e => set('bankruptcy_division', e.target.value)} placeholder="8" />
        </Field>
      </div>

      <Field label="City Filer Keywords (comma-separated)">
        <textarea
          className={inputCls + ' resize-y text-xs'}
          style={{ ...inputStyle, minHeight: '72px' }}
          value={form.city_filer_keywords}
          onChange={e => set('city_filer_keywords', e.target.value)}
          placeholder="CITY OF TAMPA, HILLSBOROUGH COUNTY, CITY OF BRANDON"
          rows={3}
        />
      </Field>

      <Field label="Code Lien Type Map (JSON)">
        <textarea
          className={inputCls + ' font-mono text-xs resize-y'}
          style={{ ...inputStyle, minHeight: '120px' }}
          value={form.code_lien_type_map}
          onChange={e => set('code_lien_type_map', e.target.value)}
          spellCheck={false}
          rows={6}
        />
      </Field>

      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving} className={btnYellow} style={{ background: '#facc15' }}>
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create County'}
        </button>
        <button type="button" onClick={onCancel} className={btnGhost}>Cancel</button>
      </div>
    </form>
  );
}

// ─── Add / Edit Source Form ───────────────────────────────────────────────────
function SourceForm({ initial = {}, onSave, onCancel, saving }) {
  const isEdit = Boolean(initial.id);
  const [form, setForm] = useState({
    signal_type: initial.signal_type || SIGNAL_TYPES[0],
    source_name: initial.source_name || '',
    url: initial.url || '',
    description: initial.description || '',
    navigation_hint: initial.navigation_hint || '',
    output_format: initial.output_format || 'csv',
    date_range_available: initial.date_range_available !== false,
    frequency: initial.frequency || 'daily',
    special_flags: JSON.stringify(initial.special_flags || {}, null, 2),
    ori_column_map: JSON.stringify(initial.ori_column_map || {}, null, 2),
    ori_book_page_col: initial.ori_book_page_col || '',
    ori_doc_type_map: JSON.stringify(initial.ori_doc_type_map || {}, null, 2),
  });
  function set(k, v) { setForm(p => ({ ...p, [k]: v })); }

  function handleSubmit(e) {
    e.preventDefault();
    let special_flags = {};
    try { special_flags = JSON.parse(form.special_flags || '{}'); } catch {}
    let ori_column_map = null;
    try { const v = JSON.parse(form.ori_column_map || '{}'); if (Object.keys(v).length) ori_column_map = v; } catch {}
    let ori_doc_type_map = null;
    try { const v = JSON.parse(form.ori_doc_type_map || '{}'); if (Object.keys(v).length) ori_doc_type_map = v; } catch {}
    onSave({
      signal_type: form.signal_type,
      source_name: form.source_name.trim() || null,
      url: form.url.trim(),
      description: form.description.trim() || null,
      navigation_hint: form.navigation_hint.trim() || null,
      output_format: form.output_format || null,
      date_range_available: form.date_range_available,
      frequency: form.frequency,
      special_flags,
      ori_column_map,
      ori_book_page_col: form.ori_book_page_col.trim() || null,
      ori_doc_type_map,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl p-4 mt-2 space-y-3"
      style={{ background: 'rgba(250,204,21,0.04)', border: '1px solid rgba(250,204,21,0.15)' }}>

      <p className="text-xs font-semibold text-yellow-300">{isEdit ? 'Edit Source' : 'Add Source'}</p>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Signal Type">
          <select className={inputCls} style={inputStyle} value={form.signal_type}
            onChange={e => set('signal_type', e.target.value)} disabled={isEdit}>
            {SIGNAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Source Name">
          <input className={inputCls} style={inputStyle} value={form.source_name}
            onChange={e => set('source_name', e.target.value)} placeholder="Hillsborough RealForeclose" />
        </Field>
      </div>

      <Field label="URL">
        <input className={inputCls} style={inputStyle} value={form.url}
          onChange={e => set('url', e.target.value)} placeholder="https://…" required />
      </Field>

      <Field label="Description (browser-use prompt context)">
        <textarea
          className={inputCls + ' resize-y text-xs'}
          style={{ ...inputStyle, minHeight: '96px' }}
          value={form.description}
          onChange={e => set('description', e.target.value)}
          placeholder="Plain English description of what this portal contains and what we extract. The browser-use agent uses this to understand the data source."
          rows={4}
        />
      </Field>

      <Field label="Navigation Hint (how to get the data)">
        <textarea
          className={inputCls + ' resize-y text-xs'}
          style={{ ...inputStyle, minHeight: '96px' }}
          value={form.navigation_hint}
          onChange={e => set('navigation_hint', e.target.value)}
          placeholder="Step-by-step instructions: Navigate to Building module → search by date range → select CSV export → click Download."
          rows={4}
        />
      </Field>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Output Format">
          <select className={inputCls} style={inputStyle} value={form.output_format}
            onChange={e => set('output_format', e.target.value)}>
            {OUTPUT_FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </Field>
        <Field label="Frequency">
          <select className={inputCls} style={inputStyle} value={form.frequency}
            onChange={e => set('frequency', e.target.value)}>
            {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </Field>
        <Field label="Date Range Available">
          <select className={inputCls} style={inputStyle}
            value={form.date_range_available ? 'yes' : 'no'}
            onChange={e => set('date_range_available', e.target.value === 'yes')}>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </Field>
      </div>

      <Field label="Special Flags (JSON)" hint="One-off flags only — e.g. prr_only, style_col. Use the fields below for ORI column/doc-type config.">
        <textarea
          className={inputCls + ' font-mono text-xs resize-y'}
          style={{ ...inputStyle, minHeight: '72px' }}
          value={form.special_flags}
          onChange={e => set('special_flags', e.target.value)}
          spellCheck={false}
          rows={3}
          placeholder={'{\n  "prr_only": true\n}'}
        />
      </Field>

      <div className="rounded-lg p-3 space-y-3" style={{ background: 'rgba(250,204,21,0.06)', border: '1px solid rgba(250,204,21,0.1)' }}>
        <p className="text-xs font-semibold text-yellow-400">ORI / CSV Structure (liens signal)</p>
        <p className="text-xs text-slate-400">Leave blank for counties whose CSV columns already match the canonical names (e.g. Hillsborough).</p>

        <Field label="Column Map (JSON)" hint='Rename raw CSV columns to canonical names. e.g. {"DirectName":"Grantor","IndirectName":"Grantee","InstrumentNumber":"Instrument","Comments":"Legal","DocTypeDescription":"DocType"}'>
          <textarea
            className={inputCls + ' font-mono text-xs resize-y'}
            style={{ ...inputStyle, minHeight: '80px' }}
            value={form.ori_column_map}
            onChange={e => set('ori_column_map', e.target.value)}
            spellCheck={false}
            rows={3}
            placeholder={'{\n  "DirectName": "Grantor",\n  "IndirectName": "Grantee"\n}'}
          />
        </Field>

        <Field label="Combined Book/Page Column" hint='Name of the column that holds Book and Page as one value (e.g. "23544/1338"). Leave blank if Book and Page are already separate columns.'>
          <input
            className={inputCls}
            style={inputStyle}
            value={form.ori_book_page_col}
            onChange={e => set('ori_book_page_col', e.target.value)}
            placeholder="BookPage"
          />
        </Field>

        <Field label="Doc Type Map (JSON)" hint='Map raw DocType values to canonical labels. Only list values that differ from the canonical. e.g. {"JUDGEMENT LIEN":"JUDGMENT","LIEN (IRS)":"TAX LIEN"}'>
          <textarea
            className={inputCls + ' font-mono text-xs resize-y'}
            style={{ ...inputStyle, minHeight: '80px' }}
            value={form.ori_doc_type_map}
            onChange={e => set('ori_doc_type_map', e.target.value)}
            spellCheck={false}
            rows={3}
            placeholder={'{\n  "JUDGEMENT LIEN": "JUDGMENT",\n  "LIEN (IRS)": "TAX LIEN"\n}'}
          />
        </Field>
      </div>

      <div className="flex gap-2">
        <button type="submit" disabled={saving} className={btnYellow} style={{ background: '#facc15' }}>
          {saving ? 'Saving…' : isEdit ? 'Save' : 'Add Source'}
        </button>
        <button type="button" onClick={onCancel} className={btnGhost}>Cancel</button>
      </div>
    </form>
  );
}

// ─── Source Row ───────────────────────────────────────────────────────────────
function SourceRow({ src, token, countyId, onUpdated }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave(body) {
    setSaving(true);
    try {
      const updated = await updateSource(token, countyId, src.id, body);
      onUpdated(updated);
      setEditing(false);
    } catch (e) {
      alert(`Failed: ${e.detail || e.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate() {
    if (!confirm(`Deactivate ${src.signal_type} source for ${countyId}?`)) return;
    setSaving(true);
    try {
      await deactivateSource(token, countyId, src.id);
      onUpdated({ ...src, is_active: false });
    } catch (e) {
      alert(`Failed: ${e.detail || e.message}`);
    } finally {
      setSaving(false);
    }
  }

  const freqColor = { daily: 'green', weekly: 'blue', monthly: 'slate', manual: 'yellow' }[src.frequency] || 'slate';
  const flags = Object.keys(src.special_flags || {}).filter(k => src.special_flags[k] && k !== 'bulk_tables');

  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div className="flex items-start justify-between gap-3 px-5 py-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-white font-medium">{src.signal_type}</span>
            {src.source_name && <span className="text-xs text-slate-500">{src.source_name}</span>}
            <Badge color={freqColor}>{src.frequency}</Badge>
            <Badge color={src.output_format === 'csv' ? 'green' : src.output_format === 'excel' ? 'blue' : 'slate'}>
              {src.output_format || 'unknown'}
            </Badge>
            {!src.date_range_available && <Badge color="yellow">no date range</Badge>}
            {flags.map(f => <Badge key={f} color="red">{f}</Badge>)}
          </div>
          <p className="text-xs text-slate-500 mt-1 truncate">{src.url}</p>
          {src.description && <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">{src.description}</p>}
        </div>
        <div className="flex gap-1.5 shrink-0">
          <button onClick={() => setEditing(v => !v)} className={btnGhost} style={{ padding: '4px 10px' }}>
            {editing ? 'Close' : 'Edit'}
          </button>
          <button onClick={handleDeactivate} disabled={saving || !src.is_active}
            className="px-2.5 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-30"
            style={{ color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)' }}>
            {src.is_active ? 'Disable' : 'Off'}
          </button>
        </div>
      </div>
      {editing && (
        <div className="px-5 pb-4">
          <SourceForm initial={src} onSave={handleSave} onCancel={() => setEditing(false)} saving={saving} />
        </div>
      )}
    </div>
  );
}

// ─── County Card ──────────────────────────────────────────────────────────────
function CountyCard({ county, token, onUpdated }) {
  const [expanded, setExpanded] = useState(false);
  const [sources, setSources] = useState(null);
  const [loadingSrc, setLoadingSrc] = useState(false);
  const [addingSource, setAddingSource] = useState(false);
  const [savingSource, setSavingSource] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!expanded) return;
    setLoadingSrc(true);
    const ctrl = new AbortController();
    fetchSources(token, county.county_id, true, { signal: ctrl.signal })
      .then(setSources)
      .catch(e => { if (e.name !== 'AbortError') console.error(e); })
      .finally(() => setLoadingSrc(false));
    return () => ctrl.abort();
  }, [expanded, token, county.county_id]);

  async function handleSaveCounty(body) {
    setSaving(true);
    try {
      const updated = await updateCounty(token, county.county_id, body);
      onUpdated(updated);
      setEditing(false);
    } catch (e) {
      alert(`Failed: ${e.detail || e.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate() {
    if (!confirm(`Deactivate ${county.display_name}? It will be hidden from all scrapers.`)) return;
    setSaving(true);
    try {
      await deactivateCounty(token, county.county_id);
      onUpdated({ ...county, is_active: false });
    } catch (e) {
      alert(`Failed: ${e.detail || e.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddSource(body) {
    setSavingSource(true);
    try {
      const newSrc = await addSource(token, county.county_id, body);
      setSources(prev => [...(prev || []), newSrc]);
      setAddingSource(false);
    } catch (e) {
      alert(`Failed: ${e.detail || e.message}`);
    } finally {
      setSavingSource(false);
    }
  }

  function handleSourceUpdated(updated) {
    setSources(prev => prev.map(s => s.id === updated.id ? updated : s));
  }

  const activeSources = (sources || []).filter(s => s.is_active);
  const inactiveSources = (sources || []).filter(s => !s.is_active);

  return (
    <div className="rounded-2xl overflow-hidden" style={card}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="flex items-center gap-3 text-left flex-1 min-w-0"
        >
          <span className="text-base font-semibold text-white">{county.display_name}</span>
          <span className="text-xs text-slate-500 font-mono">{county.county_id}</span>
          {county.fips && <span className="text-xs text-slate-600">FIPS {county.fips}</span>}
          <Badge color={county.is_active ? 'green' : 'red'}>{county.is_active ? 'active' : 'inactive'}</Badge>
          <Badge color="slate">{county.parcel_id_format || 'folio'}</Badge>
        </button>
        <div className="flex gap-1.5 shrink-0 ml-3">
          <button onClick={() => setEditing(v => !v)} className={btnGhost} style={{ padding: '4px 10px' }}>
            {editing ? 'Close' : 'Edit'}
          </button>
          <button
            onClick={handleDeactivate}
            disabled={saving || !county.is_active}
            className="px-2.5 py-1 rounded-lg text-xs font-medium disabled:opacity-30 transition-colors"
            style={{ color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)' }}
          >
            Disable
          </button>
          <button
            onClick={() => setExpanded(v => !v)}
            className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-400 border border-slate-700 hover:border-slate-500 transition-colors"
          >
            {expanded ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* Edit form */}
      {editing && (
        <div className="px-5 pb-4">
          <CountyForm initial={county} onSave={handleSaveCounty} onCancel={() => setEditing(false)} saving={saving} />
        </div>
      )}

      {/* Sources */}
      {expanded && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {loadingSrc ? (
            <p className="px-5 py-4 text-sm text-slate-500 animate-pulse">Loading sources…</p>
          ) : (
            <>
              {activeSources.length === 0 && !addingSource && (
                <p className="px-5 py-4 text-xs text-slate-600">No active sources — add one below.</p>
              )}
              {activeSources.map(src => (
                <SourceRow key={src.id} src={src} token={token} countyId={county.county_id} onUpdated={handleSourceUpdated} />
              ))}

              {inactiveSources.length > 0 && (
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <p className="px-5 py-2 text-xs text-slate-600">
                    {inactiveSources.length} inactive source{inactiveSources.length !== 1 ? 's' : ''} hidden
                  </p>
                </div>
              )}

              {/* Add source */}
              <div className="px-5 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                {addingSource ? (
                  <SourceForm
                    onSave={handleAddSource}
                    onCancel={() => setAddingSource(false)}
                    saving={savingSource}
                  />
                ) : (
                  <button
                    onClick={() => setAddingSource(true)}
                    className="text-xs font-medium text-yellow-400 hover:text-yellow-300 transition-colors"
                  >
                    + Add source
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CountyManagementDashboard({ token }) {
  const [counties, setCounties] = useState(null);
  const [error, setError] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [addingCounty, setAddingCounty] = useState(false);
  const [savingCounty, setSavingCounty] = useState(false);

  const load = useCallback((includeInactive, signal) => {
    setError('');
    return fetchCounties(token, includeInactive, { signal })
      .then(setCounties)
      .catch(e => { if (e.name !== 'AbortError') setError(e.detail || e.message || 'Failed to load'); });
  }, [token]);

  useEffect(() => {
    const ctrl = new AbortController();
    load(showInactive, ctrl.signal);
    return () => ctrl.abort();
  }, [token, showInactive, load]);

  async function handleCreateCounty(body) {
    setSavingCounty(true);
    try {
      const created = await createCounty(token, body);
      setCounties(prev => [...(prev || []), created]);
      setAddingCounty(false);
    } catch (e) {
      alert(`Failed: ${e.detail || e.message}`);
    } finally {
      setSavingCounty(false);
    }
  }

  function handleCountyUpdated(updated) {
    setCounties(prev => prev.map(c => c.county_id === updated.county_id ? updated : c));
  }

  const visible = counties || [];

  return (
    <div className="w-full max-w-4xl space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <p className="text-sm text-slate-400">
            {visible.length} count{visible.length !== 1 ? 'ies' : 'y'}
          </p>
          <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={e => setShowInactive(e.target.checked)}
              className="accent-yellow-400"
            />
            Show inactive
          </label>
        </div>
        <button
          onClick={() => setAddingCounty(v => !v)}
          className={btnYellow}
          style={{ background: addingCounty ? 'rgba(250,204,21,0.1)' : '#facc15' }}
        >
          {addingCounty ? 'Cancel' : '+ Add County'}
        </button>
      </div>

      {error && <p className="text-red-400 text-sm">Error: {error}</p>}

      {addingCounty && (
        <CountyForm
          onSave={handleCreateCounty}
          onCancel={() => setAddingCounty(false)}
          saving={savingCounty}
        />
      )}

      {!counties && !error && (
        <p className="text-slate-500 text-sm animate-pulse py-4">Loading counties…</p>
      )}

      {visible.map(county => (
        <CountyCard
          key={county.county_id}
          county={county}
          token={token}
          onUpdated={handleCountyUpdated}
        />
      ))}

      {counties && visible.length === 0 && !addingCounty && (
        <div className="rounded-2xl p-10 text-center" style={card}>
          <p className="text-slate-500 text-sm">No counties configured yet.</p>
          <p className="text-slate-600 text-xs mt-1">Click "+ Add County" to get started.</p>
        </div>
      )}
    </div>
  );
}

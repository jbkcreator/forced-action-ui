import { useCallback, useEffect, useRef, useState } from 'react';
import {
  addSource,
  approvePlaywrightCode,
  clearPlaywrightCode,
  createCounty,
  deactivateCounty,
  deactivateSource,
  fetchCounties,
  fetchSources,
  generatePlaywrightCode,
  savePlaywrightCode,
  updateCounty,
  updateSource,
  validatePlaywrightCode,
} from '../../api/admin';

const SIGNAL_TYPES = [
  'foreclosures', 'liens', 'violations', 'permits',
  'court_records', 'tax_delinquency', 'master_data',
];
const OUTPUT_FORMATS = ['csv', 'table', 'excel'];
const COURT_SCRAPE_MODES = ['csv-dir', 'browser-excel'];
const FREQUENCIES = ['daily', 'weekly', 'monthly', 'manual'];
const PARCEL_FORMATS = ['folio', 'strap', 'other'];
const SCRAPE_MODES = [
  { value: 'ai_only',            label: 'AI Agent only (browser-use)' },
  { value: 'playwright_only',    label: 'Playwright code only' },
  { value: 'playwright_then_ai', label: 'Playwright with AI fallback' },
  { value: 'static_download',    label: 'Static download (direct URL pattern)' },
  { value: 'api',                label: 'API (direct HTTP / public API)' },
];

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
export function CountyForm({ initial = {}, onSave, onCancel, saving }) {
  const [form, setForm] = useState({
    county_id: initial.county_id || '',
    display_name: initial.display_name || '',
    fips: initial.fips || '',
    nws_zone: initial.nws_zone || '',
    parcel_id_format: initial.parcel_id_format || 'folio',
    bankruptcy_division: initial.bankruptcy_division || '',
    city_filer_keywords: (initial.city_filer_keywords || []).join(', '),
    code_lien_type_map: JSON.stringify(initial.code_lien_type_map || {}, null, 2),
    founding_price_deadline_at: initial.founding_price_deadline_at
      ? initial.founding_price_deadline_at.slice(0, 16)
      : '',
  });
  const [testimonials, setTestimonials] = useState(
    (initial.landing_featured_testimonials?.length
      ? initial.landing_featured_testimonials
      : [{}]
    ).map(t => ({ quote: t.quote || '', name: t.name || '', company: t.company || '' }))
  );
  const isEdit = Boolean(initial.county_id);

  function set(k, v) { setForm(p => ({ ...p, [k]: v })); }
  function setTestimonial(i, k, v) {
    setTestimonials(rows => rows.map((row, idx) => (idx === i ? { ...row, [k]: v } : row)));
  }
  function addTestimonial() {
    setTestimonials(rows => [...rows, { quote: '', name: '', company: '' }]);
  }
  function removeTestimonial(i) {
    setTestimonials(rows => rows.filter((_, idx) => idx !== i));
  }

  function handleSubmit(e) {
    e.preventDefault();
    let code_lien_type_map = {};
    try { code_lien_type_map = JSON.parse(form.code_lien_type_map || '{}'); } catch {}
    const landing_featured_testimonials = testimonials
      .map(t => ({ quote: t.quote.trim(), name: t.name.trim() || undefined, company: t.company.trim() || undefined }))
      .filter(t => t.quote);
    onSave({
      county_id: form.county_id.trim().toLowerCase().replace(/\s+/g, '_'),
      display_name: form.display_name.trim(),
      fips: form.fips.trim() || null,
      nws_zone: form.nws_zone.trim() || null,
      parcel_id_format: form.parcel_id_format,
      bankruptcy_division: form.bankruptcy_division.trim() || null,
      city_filer_keywords: form.city_filer_keywords.split(',').map(s => s.trim()).filter(Boolean),
      code_lien_type_map,
      landing_featured_testimonials,
      founding_price_deadline_at: form.founding_price_deadline_at
        ? new Date(form.founding_price_deadline_at).toISOString()
        : null,
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

      <p className="text-xs font-semibold text-slate-400 pt-2">Landing Page (Task 8)</p>

      <div>
        <label className="block text-xs text-slate-500 mb-1">Featured Testimonials</label>
        <p className="text-xs text-slate-600 mb-2 leading-snug">
          Rendered as a carousel on the landing page. Rows with a blank quote are dropped on save.
        </p>
        <div className="space-y-3">
          {testimonials.map((t, i) => (
            <div key={i} className="rounded-lg p-3 space-y-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Testimonial {i + 1}</span>
                <button
                  type="button"
                  aria-label={`Remove testimonial ${i + 1}`}
                  onClick={() => removeTestimonial(i)}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Remove
                </button>
              </div>
              <textarea
                aria-label={`Testimonial ${i + 1} quote`}
                className={inputCls + ' resize-y text-xs'}
                style={{ ...inputStyle, minHeight: '50px' }}
                value={t.quote}
                onChange={e => setTestimonial(i, 'quote', e.target.value)}
                placeholder="We closed two jobs in the first week."
                rows={2}
              />
              <div className="grid grid-cols-2 gap-2">
                <input aria-label={`Testimonial ${i + 1} name`} className={inputCls} style={inputStyle}
                  value={t.name} onChange={e => setTestimonial(i, 'name', e.target.value)} placeholder="Sarah M." />
                <input aria-label={`Testimonial ${i + 1} company`} className={inputCls} style={inputStyle}
                  value={t.company} onChange={e => setTestimonial(i, 'company', e.target.value)} placeholder="Tampa Roofing Co." />
              </div>
            </div>
          ))}
        </div>
        <button type="button" onClick={addTestimonial} className={btnGhost + ' mt-2'}>
          + Add Testimonial
        </button>
      </div>

      <Field label="Founding Price Deadline" hint="After this time, new checkouts get regular pricing. Leave blank for spots-only gating.">
        <input
          id="founding_price_deadline_at"
          aria-label="Founding price deadline"
          type="datetime-local"
          className={inputCls}
          style={inputStyle}
          value={form.founding_price_deadline_at}
          onChange={e => set('founding_price_deadline_at', e.target.value)}
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
function SourceForm({ initial = {}, onSave, onCancel, saving, token, countyId }) {
  const isEdit = Boolean(initial.id);
  const _initFlags = initial.special_flags || {};
  const [form, setForm] = useState({
    signal_type: initial.signal_type || SIGNAL_TYPES[0],
    source_name: initial.source_name || '',
    url: initial.url || '',
    description: initial.description || '',
    navigation_hint: initial.navigation_hint || '',
    output_format: initial.output_format || 'csv',
    date_range_available: initial.date_range_available !== false,
    frequency: initial.frequency || 'daily',
    special_flags: JSON.stringify(_initFlags, null, 2),
    scrape_mode: initial.scrape_mode || 'ai_only',
    // court_records-specific (extracted from special_flags for convenience)
    court_style_col: _initFlags.style_col || '',
    court_scrape_mode: _initFlags.scrape_mode || 'csv-dir',
  });
  function set(k, v) { setForm(p => ({ ...p, [k]: v })); }

  function handleSubmit(e) {
    e.preventDefault();
    const isDownloadMode = form.scrape_mode === 'static_download';
    const isApiMode      = form.scrape_mode === 'api';
    const isSimpleMode   = isDownloadMode || isApiMode;
    let special_flags = {};
    if (!isSimpleMode) {
      try { special_flags = JSON.parse(form.special_flags || '{}'); } catch {}
      if (form.signal_type === 'court_records') {
        if (form.court_style_col.trim()) special_flags.style_col = form.court_style_col.trim();
        else delete special_flags.style_col;
        if (form.court_scrape_mode) special_flags.scrape_mode = form.court_scrape_mode;
        else delete special_flags.scrape_mode;
      }
    }
    onSave({
      signal_type: form.signal_type,
      source_name: form.source_name.trim() || null,
      url: form.url.trim() || null,
      description: isSimpleMode ? null : (form.description.trim() || null),
      navigation_hint: isSimpleMode ? null : (form.navigation_hint.trim() || null),
      output_format: isSimpleMode ? null : (form.output_format || null),
      date_range_available: isSimpleMode ? false : form.date_range_available,
      frequency: form.frequency,
      special_flags,
      scrape_mode: form.scrape_mode,
    });
  }

  const isDownload = form.scrape_mode === 'static_download';
  const isApi      = form.scrape_mode === 'api';
  const isSimple   = isDownload || isApi;

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

      <Field label="URL" hint={isDownload ? 'Must contain {date} placeholder — replaced with YYYYMMDD at runtime. E.g. https://example.com/files/Filing_{date}.csv' : isApi ? 'API base URL or endpoint (optional — leave blank if the engine uses a hardcoded public API).' : undefined}>
        <input className={inputCls} style={inputStyle} value={form.url}
          onChange={e => set('url', e.target.value)}
          placeholder={isDownload ? 'https://example.com/files/Filing_{date}.csv' : isApi ? 'https://api.example.gov/v1/... (optional)' : 'https://…'}
          required={!isApi} />
      </Field>

      {!isSimple && (
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
      )}

      {!isSimple && (
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
      )}

      <div className={`grid gap-3 ${isSimple ? 'grid-cols-1' : 'grid-cols-3'}`}>
        {!isSimple && (
          <Field label="Output Format">
            <select className={inputCls} style={inputStyle} value={form.output_format}
              onChange={e => set('output_format', e.target.value)}>
              {OUTPUT_FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </Field>
        )}
        <Field label="Frequency">
          <select className={inputCls} style={inputStyle} value={form.frequency}
            onChange={e => set('frequency', e.target.value)}>
            {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </Field>
        {!isSimple && (
          <Field label="Date Range Available">
            <select className={inputCls} style={inputStyle}
              value={form.date_range_available ? 'yes' : 'no'}
              onChange={e => set('date_range_available', e.target.value === 'yes')}>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </Field>
        )}
      </div>

      <Field label="Scrape Mode" hint={isDownload ? 'Direct HTTP download — only the URL above is used.' : 'ai_only: browser-use Agent drives the portal. playwright_only: execute saved Playwright code, no fallback. playwright_then_ai: try the code first, fall back to the AI agent on failure.'}>
        <select className={inputCls} style={inputStyle} value={form.scrape_mode}
          onChange={e => set('scrape_mode', e.target.value)}>
          {SCRAPE_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </Field>

      {!isSimple && (
        <Field label="Special Flags (JSON)" hint="Advanced. Vendor-specific flags only — e.g. prr_only, cf_bypass_required. Do NOT put scrape_mode or playwright_code here; they have first-class fields.">
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
      )}

      {!isSimple && form.signal_type === 'court_records' && (
        <div className="rounded-lg p-3 space-y-3" style={{ background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.18)' }}>
          <p className="text-xs font-semibold text-blue-400">Court Records / Eviction Config</p>
          <p className="text-xs text-slate-400">Controls how the evictions engine downloads and parses this county's court records.</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Scrape Mode" hint="csv-dir: read from local directory of CSVs (Hillsborough). browser-excel: browser-use downloads Excel from portal (Pinellas).">
              <select
                className={inputCls}
                style={inputStyle}
                value={form.court_scrape_mode}
                onChange={e => set('court_scrape_mode', e.target.value)}
              >
                {COURT_SCRAPE_MODES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </Field>
            <Field label="Style Column" hint='Name of the column containing plaintiff vs. defendant in one cell — e.g. "Style/Description" for Pinellas. Leave blank if case parties are separate columns.'>
              <input
                className={inputCls}
                style={inputStyle}
                value={form.court_style_col}
                onChange={e => set('court_style_col', e.target.value)}
                placeholder="Style/Description"
              />
            </Field>
          </div>
        </div>
      )}

      {/* Column renames, value maps, and bucket routing live in the dedicated
          Column Mappings dashboard now. Source admins land there from this link. */}
      <p className="text-xs text-slate-500">
        Column renames, transformations, and routing → configured in the
        <span className="text-yellow-400"> Column Mappings </span> tab.
      </p>

      {isEdit && !isSimple && form.scrape_mode !== 'ai_only' && token && countyId && (
        <PlaywrightCodeEditor
          token={token}
          countyId={countyId}
          sourceId={initial.id}
          initialCode={initial.playwright_code || ''}
          initialApproved={Boolean(initial.playwright_code_approved)}
          initialVersion={initial.playwright_code_version || ''}
        />
      )}
      {!isEdit && !isSimple && form.scrape_mode !== 'ai_only' && (
        <p className="text-xs text-slate-500">
          Save the source first, then re-open this row to generate or paste Playwright code.
        </p>
      )}

      <div className="flex gap-2">
        <button type="submit" disabled={saving} className={btnYellow} style={{ background: '#facc15' }}>
          {saving ? 'Saving…' : isEdit ? 'Save' : 'Add Source'}
        </button>
        <button type="button" onClick={onCancel} className={btnGhost}>Cancel</button>
      </div>
    </form>
  );
}

// ─── Playwright Code Editor ───────────────────────────────────────────────────
// Shown inside SourceForm when scrape_mode is playwright_only or playwright_then_ai.
// Provides Generate / Validate / Save / Approve / Clear actions that hit the
// admin /playwright-code/* endpoints. Server-side AST safety check runs on Save.
function PlaywrightCodeEditor({ token, countyId, sourceId, initialCode, initialApproved, initialVersion }) {
  const [code, setCode] = useState(initialCode);
  const [approved, setApproved] = useState(initialApproved);
  const [busy, setBusy] = useState(null);     // 'generate' | 'validate' | 'save' | 'approve' | 'clear' | null
  const [errors, setErrors] = useState([]);
  const [info, setInfo] = useState(null);

  function flashInfo(text) { setInfo(text); setTimeout(() => setInfo(null), 4000); }
  function clearErrors() { setErrors([]); }

  async function handleGenerate() {
    if (!confirm('Call the LLM to generate a Playwright function for this source? May take ~10-30s.')) return;
    setBusy('generate'); clearErrors();
    try {
      const r = await generatePlaywrightCode(token, countyId, sourceId);
      setCode(r.code || '');
      setApproved(false);
      flashInfo('Generated. Validate then save when ready.');
    } catch (e) {
      setErrors([e.detail || e.message]);
    } finally {
      setBusy(null);
    }
  }

  async function handleValidate() {
    setBusy('validate'); clearErrors();
    try {
      const r = await validatePlaywrightCode(token, countyId, sourceId, code);
      if (r.valid) flashInfo('AST check passed.');
      else setErrors(r.errors || ['Invalid code']);
    } catch (e) {
      setErrors([e.detail || e.message]);
    } finally {
      setBusy(null);
    }
  }

  async function handleSave(asApproved) {
    setBusy('save'); clearErrors();
    try {
      const r = await savePlaywrightCode(token, countyId, sourceId, code, asApproved);
      setApproved(Boolean(r.is_approved));
      flashInfo(asApproved ? 'Saved and marked approved.' : 'Saved (awaiting approval).');
    } catch (e) {
      setErrors([e.detail || e.message]);
    } finally {
      setBusy(null);
    }
  }

  async function handleApprove() {
    setBusy('approve'); clearErrors();
    try {
      await approvePlaywrightCode(token, countyId, sourceId);
      setApproved(true);
      flashInfo('Approved.');
    } catch (e) {
      setErrors([e.detail || e.message]);
    } finally {
      setBusy(null);
    }
  }

  async function handleClear() {
    if (!confirm('Clear cached Playwright code? Engine will regenerate on next run.')) return;
    setBusy('clear'); clearErrors();
    try {
      await clearPlaywrightCode(token, countyId, sourceId);
      setCode('');
      setApproved(false);
      flashInfo('Cleared.');
    } catch (e) {
      setErrors([e.detail || e.message]);
    } finally {
      setBusy(null);
    }
  }

  const statusPill = code
    ? (approved
        ? <span style={{ color: '#6ee7b7' }}>approved</span>
        : <span style={{ color: '#fde68a' }}>unapproved</span>)
    : <span style={{ color: '#94a3b8' }}>no code saved</span>;

  return (
    <div className="rounded-lg p-3 space-y-2" style={{ background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.18)' }}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-blue-300">Playwright Code (run_scrape)</p>
        <p className="text-xs">
          status: {statusPill}
          {initialVersion && <span className="text-slate-500"> · prompt {initialVersion}</span>}
        </p>
      </div>

      <p className="text-xs text-slate-400">
        Either generate via LLM or paste hand-written code. Saved code is AST-checked server-side
        (no imports, no exec/eval, no os/subprocess). The function signature must be:
        <br />
        <code className="text-xs">async def run_scrape(page, download_dir, start_date, end_date, url, county_id)</code>
      </p>

      <textarea
        className={inputCls + ' font-mono text-xs resize-y'}
        style={{ ...inputStyle, minHeight: '240px' }}
        value={code}
        onChange={e => setCode(e.target.value)}
        spellCheck={false}
        rows={14}
        placeholder={'async def run_scrape(page, download_dir, start_date, end_date, url, county_id):\n    ...\n    return pd.DataFrame()'}
      />

      {errors.length > 0 && (
        <div className="text-xs" style={{ color: '#fca5a5' }}>
          {errors.map((e, i) => <p key={i}>• {e}</p>)}
        </div>
      )}
      {info && <p className="text-xs" style={{ color: '#6ee7b7' }}>{info}</p>}

      <div className="flex gap-2 flex-wrap">
        <button type="button" onClick={handleGenerate} disabled={!!busy} className={btnGhost}>
          {busy === 'generate' ? 'Generating…' : 'Generate via LLM'}
        </button>
        <button type="button" onClick={handleValidate} disabled={!!busy || !code} className={btnGhost}>
          {busy === 'validate' ? 'Validating…' : 'Validate'}
        </button>
        <button type="button" onClick={() => handleSave(true)} disabled={!!busy || !code} className={btnYellow} style={{ background: '#facc15' }}>
          {busy === 'save' ? 'Saving…' : 'Save (approved)'}
        </button>
        <button type="button" onClick={() => handleSave(false)} disabled={!!busy || !code} className={btnGhost}>
          {busy === 'save' ? 'Saving…' : 'Save (unapproved)'}
        </button>
        <button type="button" onClick={handleApprove} disabled={!!busy || !code || approved} className={btnGhost}>
          {busy === 'approve' ? 'Approving…' : 'Approve'}
        </button>
        <button type="button" onClick={handleClear} disabled={!!busy} className={btnGhost} style={{ color: '#fca5a5', borderColor: 'rgba(239,68,68,0.3)' }}>
          {busy === 'clear' ? 'Clearing…' : 'Clear'}
        </button>
      </div>
    </div>
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
          <SourceForm
            initial={src}
            onSave={handleSave}
            onCancel={() => setEditing(false)}
            saving={saving}
            token={token}
            countyId={countyId}
          />
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
                    token={token}
                    countyId={county.county_id}
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

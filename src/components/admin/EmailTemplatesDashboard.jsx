import { useState, useEffect, useRef } from 'react';
import {
  fetchEmailTemplates,
  fetchTemplateVariables,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from '../../api/emailCampaigns';
import { INSTANTLY_VARIABLES } from '../../config/constants';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TH = { color: '#64748b', fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', textAlign: 'left' };
const TD = { padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '13px', color: '#e2e8f0' };
const INPUT = 'w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition';
const INPUT_STYLE = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' };

const VAR_RE = /\{\{(\w+)\}\}/g;

function findUnknownVars(body, knownNames) {
  return [...body.matchAll(VAR_RE)].map(m => m[1]).filter(v => !knownNames.includes(v));
}

// ─── Step editor ─────────────────────────────────────────────────────────────

function StepEditor({ step, index, onChange, onRemove, variables }) {
  const bodyRef      = useRef(null);
  const knownNames   = variables.map(v => v.name);
  const unknownVars  = findUnknownVars(step.body || '', knownNames);

  function insertVariable(varName) {
    const textarea = bodyRef.current;
    if (!textarea) return;
    const start    = textarea.selectionStart;
    const end      = textarea.selectionEnd;
    const inserted = `{{${varName}}}`;
    const newValue = textarea.value.slice(0, start) + inserted + textarea.value.slice(end);
    onChange('body', newValue);
    requestAnimationFrame(() => {
      textarea.selectionStart = start + inserted.length;
      textarea.selectionEnd   = start + inserted.length;
      textarea.focus();
    });
  }

  return (
    <div
      className="rounded-xl p-4 mb-3"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold" style={{ color: '#94a3b8' }}>Step {index + 1}</span>
        <button
          onClick={onRemove}
          className="text-xs px-2 py-1 rounded-lg"
          style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171' }}
        >
          Remove
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: '#64748b' }}>Delay (days)</label>
          <input
            type="number"
            min={0}
            value={step.delay ?? 0}
            onChange={e => onChange('delay', parseInt(e.target.value, 10) || 0)}
            className={INPUT}
            style={INPUT_STYLE}
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: '#64748b' }}>Subject</label>
          <input
            type="text"
            value={step.subject || ''}
            onChange={e => onChange('subject', e.target.value)}
            placeholder="Email subject line"
            className={INPUT}
            style={INPUT_STYLE}
          />
        </div>
      </div>

      <div className="mb-2">
        <label className="block text-xs font-medium mb-1.5" style={{ color: '#64748b' }}>Body</label>
        <textarea
          ref={bodyRef}
          rows={5}
          value={step.body || ''}
          onChange={e => onChange('body', e.target.value)}
          placeholder="Email body… use {{variable}} for personalisation"
          className={`${INPUT} resize-y`}
          style={INPUT_STYLE}
        />
        {unknownVars.length > 0 && (
          <p className="text-xs mt-1" style={{ color: '#fb923c' }}>
            Unknown variables: {unknownVars.map(v => `{{${v}}}`).join(', ')}
          </p>
        )}
      </div>

      {/* Variable picker — click to insert at cursor */}
      <div>
        <p className="text-xs mb-1.5" style={{ color: '#64748b' }}>Insert variable:</p>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {variables.map(v => (
            <button
              key={v.name}
              type="button"
              onClick={() => insertVariable(v.name)}
              className="text-xs px-2 py-0.5 rounded-md font-mono transition-opacity hover:opacity-80"
              style={{ background: 'rgba(250,204,21,0.1)', color: '#facc15', border: '1px solid rgba(250,204,21,0.2)' }}
            >
              {`{{${v.name}}}`}
            </button>
          ))}
        </div>

        {/* Variable reference */}
        <div
          className="rounded-lg p-3"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="text-xs font-semibold mb-2" style={{ color: '#64748b' }}>Variable reference</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1">
            {variables.map(v => (
              <div key={v.name} className="flex items-baseline gap-2">
                <span className="text-xs font-mono shrink-0" style={{ color: '#facc15' }}>{`{{${v.name}}}`}</span>
                <span className="text-xs truncate" style={{ color: '#64748b' }}>{v.description}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Template editor panel ────────────────────────────────────────────────────

function stepsFromApi(apiSteps) {
  if (!apiSteps?.length) return [{ delay: 0, subject: '', body: '' }];
  return apiSteps.map(s => ({ delay: s.delay_days ?? 0, subject: s.subject || '', body: s.body || '' }));
}

function stepsToApi(steps) {
  return steps.map((s, i) => ({
    step_number: i + 1,
    delay_days:  s.delay ?? 0,
    subject:     s.subject || '',
    body:        s.body    || '',
  }));
}

function TemplateEditor({ token, template, onSave, onCancel, variables }) {
  const [name, setName]   = useState(template?.name || '');
  const [steps, setSteps] = useState(() => stepsFromApi(template?.steps));
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState(null);

  function updateStep(index, field, value) {
    setSteps(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  }

  function addStep() {
    setSteps(prev => [...prev, { delay: 1, subject: '', body: '' }]);
  }

  function removeStep(index) {
    setSteps(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!name.trim()) { setError('Template name is required.'); return; }
    setSaving(true);
    setError(null);
    try {
      const payload = { name: name.trim(), steps: stepsToApi(steps) };
      if (template?.id) {
        await updateTemplate(token, template.id, payload);
      } else {
        await createTemplate(token, payload);
      }
      onSave();
    } catch (err) {
      setError(err.detail || 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="rounded-2xl p-5 mb-5"
      style={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)' }}
    >
      <h3 className="text-sm font-bold text-white mb-4">
        {template?.id ? 'Edit Template' : 'New Template'}
      </h3>

      <div className="mb-4">
        <label className="block text-xs font-medium mb-1.5" style={{ color: '#64748b' }}>Template Name</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Roofing Outreach Sequence"
          className={INPUT}
          style={INPUT_STYLE}
        />
      </div>

      <div className="mb-3">
        <p className="text-xs font-semibold mb-2" style={{ color: '#94a3b8' }}>Steps</p>
        {steps.map((step, i) => (
          <StepEditor
            key={i}
            step={step}
            index={i}
            variables={variables}
            onChange={(field, val) => updateStep(i, field, val)}
            onRemove={() => removeStep(i)}
          />
        ))}
        <button
          type="button"
          onClick={addStep}
          className="text-xs px-3 py-1.5 rounded-lg font-medium"
          style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          + Add Step
        </button>
      </div>

      {error && (
        <p className="text-xs mt-3 px-3 py-2 rounded-lg" style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}>
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2 mt-4">
        <button
          type="button"
          onClick={onCancel}
          className="text-xs px-4 py-2 rounded-xl font-medium"
          style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="text-xs px-5 py-2 rounded-xl font-semibold transition-opacity disabled:opacity-70"
          style={{ background: 'linear-gradient(135deg, #facc15, #f59e0b)', color: '#0a0f1e' }}
        >
          {saving ? 'Saving…' : 'Save Template'}
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function EmailTemplatesDashboard({ token }) {
  const [templates, setTemplates]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [editing, setEditing]           = useState(null); // null | 'new' | template object
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Variables loaded from API; INSTANTLY_VARIABLES is the fallback
  const [variables, setVariables] = useState(INSTANTLY_VARIABLES);

  useEffect(() => {
    fetchTemplateVariables(token)
      .then(data => {
        if (data?.variables?.length) setVariables(data.variables);
      })
      .catch(() => {}); // keep fallback on error
  }, [token]);

  function load() {
    setLoading(true);
    fetchEmailTemplates(token)
      .then(data => setTemplates(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [token]);

  async function handleDelete(template) {
    setDeleteLoading(true);
    try {
      await deleteTemplate(token, template.id);
      setTemplates(prev => prev.filter(t => t.id !== template.id));
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteLoading(false);
      setDeleteConfirm(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-bold text-white">Email Templates</h2>
        {editing === null && (
          <button
            onClick={() => setEditing('new')}
            className="text-xs px-3 py-1.5 rounded-lg font-semibold"
            style={{ background: 'linear-gradient(135deg, #facc15, #f59e0b)', color: '#0a0f1e' }}
          >
            + New Template
          </button>
        )}
      </div>

      {editing !== null && (
        <TemplateEditor
          token={token}
          template={editing === 'new' ? null : editing}
          variables={variables}
          onSave={() => { setEditing(null); load(); }}
          onCancel={() => setEditing(null)}
        />
      )}

      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
        <table className="w-full">
          <thead style={{ background: 'rgba(15,23,42,0.9)' }}>
            <tr>
              {['Name', 'Steps', 'Created', 'Actions'].map(h => (
                <th key={h} style={TH}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody style={{ background: 'rgba(10,15,30,0.7)' }}>
            {loading && [...Array(3)].map((_, i) => (
              <tr key={i}>
                {[...Array(4)].map((__, j) => (
                  <td key={j} style={TD}>
                    <div className="h-3.5 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.06)', width: j === 0 ? '60%' : '40%' }} />
                  </td>
                ))}
              </tr>
            ))}

            {!loading && templates.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-sm" style={{ color: '#64748b' }}>
                  No templates yet.{' '}
                  <button onClick={() => setEditing('new')} style={{ color: '#facc15' }}>Create one</button>
                </td>
              </tr>
            )}

            {!loading && templates.map(t => (
              <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                <td style={TD}><span className="font-medium text-white">{t.name}</span></td>
                <td style={{ ...TD, color: '#94a3b8' }}>{t.steps?.length ?? 0}</td>
                <td style={{ ...TD, color: '#64748b', fontSize: '12px' }}>
                  {t.created_at ? new Date(t.created_at).toLocaleDateString() : '—'}
                </td>
                <td style={TD}>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setEditing(t)}
                      className="text-xs px-2.5 py-1 rounded-md font-medium"
                      style={{ background: 'rgba(96,165,250,0.12)', color: '#60a5fa' }}
                    >
                      Edit
                    </button>
                    {deleteConfirm?.id === t.id ? (
                      <>
                        <button
                          onClick={() => handleDelete(t)}
                          disabled={deleteLoading}
                          className="text-xs px-2.5 py-1 rounded-md font-medium disabled:opacity-50"
                          style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171' }}
                        >
                          {deleteLoading ? '…' : 'Confirm'}
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="text-xs px-2.5 py-1 rounded-md font-medium"
                          style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(t)}
                        className="text-xs px-2.5 py-1 rounded-md font-medium"
                        style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171' }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

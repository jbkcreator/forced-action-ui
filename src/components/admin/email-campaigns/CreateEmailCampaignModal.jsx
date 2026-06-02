import { useState, useEffect } from 'react';
import Modal, { ModalClose } from '../../ui/Modal';
import { fetchEmailTemplates, fetchEligibleCount, createCampaign, fetchWarmupStatus } from '../../../api/emailCampaigns';
import { VERTICAL_LABELS } from '../../../config/constants';
import ScheduleEditor, { DEFAULT_SCHEDULE, buildSchedulePayload } from './ScheduleEditor';

const VERTICALS = Object.entries(VERTICAL_LABELS).map(([value, label]) => ({ value, label }));

const INPUT    = 'w-full rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition';
const IN_STYLE = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' };
const IN_FOCUS = { borderColor: 'rgba(250,204,21,0.4)' };
const SEL_STYLE = { ...IN_STYLE, colorScheme: 'dark', color: '#e2e8f0' };
const OPT = { background: '#0f172a', color: '#e2e8f0' };

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#94a3b8' }}>
        {label}
        {hint && <span className="ml-1 font-normal" style={{ color: '#64748b' }}>{hint}</span>}
      </label>
      {children}
    </div>
  );
}

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function CreateEmailCampaignModal({ token, onClose, onCreated }) {
  const [form, setForm] = useState({
    name: '', templateId: '', vertical: '', county_id: '',
    zips: '', maxContacts: '', startDate: '', endDate: '',
  });
  const [templates, setTemplates]         = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [inboxes, setInboxes]             = useState([]);
  const [selectedInboxes, setSelectedInboxes] = useState([]);
  const [loadingInboxes, setLoadingInboxes] = useState(true);
  const [eligibleCount, setEligibleCount] = useState(null);
  const [countLoading, setCountLoading]   = useState(false);
  const [submitting, setSubmitting]       = useState(false);
  const [error, setError]                 = useState(null);
  const [draftWarning, setDraftWarning]   = useState(false);

  // Send schedule (advanced section)
  const [showSchedule, setShowSchedule] = useState(false);
  const [schedule, setSchedule]         = useState(DEFAULT_SCHEDULE);

  useEffect(() => {
    fetchEmailTemplates(token)
      .then(data => setTemplates(Array.isArray(data) ? data : []))
      .catch(() => setTemplates([]))
      .finally(() => setLoadingTemplates(false));
  }, [token]);

  useEffect(() => {
    fetchWarmupStatus(token)
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setInboxes(list);
        // Auto-select all connected inboxes by default (most common case: send from all)
        setSelectedInboxes(list.map(i => i.email).filter(Boolean));
      })
      .catch(() => setInboxes([]))
      .finally(() => setLoadingInboxes(false));
  }, [token]);

  function toggleInbox(email) {
    setSelectedInboxes(prev =>
      prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
    );
  }

  const debouncedFilters = useDebounce(
    { county_id: form.county_id, zips: form.zips, vertical: form.vertical },
    300
  );

  useEffect(() => {
    if (!debouncedFilters.county_id && !debouncedFilters.vertical) {
      setEligibleCount(null);
      return;
    }
    const controller = new AbortController();
    setCountLoading(true);
    fetchEligibleCount(token, debouncedFilters, { signal: controller.signal })
      .then(data => setEligibleCount(data?.count ?? 0))
      .catch(err => { if (err.name !== 'AbortError') setEligibleCount(null); })
      .finally(() => setCountLoading(false));
    return () => controller.abort();
  }, [token, debouncedFilters]);

  function set(key, val) { setForm(prev => ({ ...prev, [key]: val })); }

  const inputProps = key => ({
    className: INPUT,
    style: IN_STYLE,
    onFocus: e => Object.assign(e.target.style, { ...IN_STYLE, ...IN_FOCUS }),
    onBlur:  e => Object.assign(e.target.style, IN_STYLE),
    value: form[key],
    onChange: e => set(key, e.target.value),
  });

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim())  { setError('Campaign name is required.'); return; }
    if (!form.templateId)   { setError('Please select an email template.'); return; }
    setSubmitting(true);
    setError(null);
    setDraftWarning(false);
    try {
      const zipsArray = form.zips
        ? form.zips.split(',').map(z => z.trim()).filter(Boolean)
        : [];

      const result = await createCampaign(token, {
        name:          form.name.trim(),
        template_id:   parseInt(form.templateId, 10),
        county_id:     form.county_id   || undefined,
        vertical:      form.vertical    || undefined,
        zips:          zipsArray.length ? zipsArray : undefined,
        max_contacts:  form.maxContacts ? parseInt(form.maxContacts, 10) : undefined,
        start_date:    form.startDate   || undefined,
        end_date:      form.endDate     || undefined,
        send_schedule: showSchedule ? buildSchedulePayload(schedule) : undefined,
        email_list:    selectedInboxes.length ? selectedInboxes : undefined,
      });

      if (result?.status === 'draft') {
        setDraftWarning(true);
        return;
      }
      onCreated();
    } catch (err) {
      setError(err.detail || 'Failed to create campaign.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal isOpen onClose={onClose} title="Create Email Campaign">
      <div
        className="relative w-full max-w-2xl rounded-2xl p-6"
        style={{ background: 'rgba(10,15,30,0.97)', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <ModalClose onClick={onClose} />
        <h2 className="text-base font-bold text-white mb-5">Create Email Campaign</h2>

        {draftWarning && (
          <div
            className="mb-4 px-4 py-3 rounded-xl text-sm"
            style={{ background: 'rgba(251,146,60,0.12)', border: '1px solid rgba(251,146,60,0.25)', color: '#fb923c' }}
          >
            Campaign saved but could not reach Instantly — created as <strong>draft</strong>.
            Resume it from the campaign list once Instantly is available.
            <button onClick={onCreated} className="ml-3 underline text-xs">Go to list</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="Campaign Name">
            <input type="text" placeholder="e.g. Hillsborough Roofing — June 2025" {...inputProps('name')} />
          </Field>

          <Field label="Email Template">
            <select {...inputProps('templateId')} style={SEL_STYLE} disabled={loadingTemplates}>
              <option value="" style={OPT}>— Select template —</option>
              {templates.map(t => <option key={t.id} value={t.id} style={OPT}>{t.name}</option>)}
            </select>
          </Field>

          <Field label="Sending Inboxes" hint="(campaign sends from these accounts)">
            {loadingInboxes ? (
              <p className="text-xs" style={{ color: '#64748b' }}>Loading connected inboxes…</p>
            ) : inboxes.length === 0 ? (
              <p className="text-xs rounded-lg px-3 py-2"
                 style={{ background: 'rgba(251,146,60,0.1)', color: '#fb923c', border: '1px solid rgba(251,146,60,0.2)' }}>
                No sending inboxes connected in Instantly. Connect one in the Instantly dashboard first — the campaign cannot send without it.
              </p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {inboxes.map(inbox => (
                  <label key={inbox.email} className="flex items-center gap-2 text-sm cursor-pointer"
                         style={{ color: '#e2e8f0' }}>
                    <input
                      type="checkbox"
                      checked={selectedInboxes.includes(inbox.email)}
                      onChange={() => toggleInbox(inbox.email)}
                    />
                    <span>{inbox.email}</span>
                    {inbox.health_warning && (
                      <span className="text-xs" style={{ color: '#fb923c' }}>
                        ⚠ low health ({inbox.health_score})
                      </span>
                    )}
                  </label>
                ))}
              </div>
            )}
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Vertical">
              <select {...inputProps('vertical')} style={SEL_STYLE}>
                <option value="" style={OPT}>— All verticals —</option>
                {VERTICALS.map(v => <option key={v.value} value={v.value} style={OPT}>{v.label}</option>)}
              </select>
            </Field>
            <Field label="County ID">
              <input type="text" placeholder="e.g. hillsborough" {...inputProps('county_id')} />
            </Field>
          </div>

          <Field label="ZIP Codes" hint="(comma-separated, optional)">
            <textarea
              rows={2}
              placeholder="33602, 33606, 33609"
              {...inputProps('zips')}
              className={`${INPUT} resize-none`}
            />
          </Field>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Max Contacts" hint="(optional)">
              <input type="number" min={1} placeholder="500" {...inputProps('maxContacts')} />
            </Field>
            <Field label="Start Date">
              <input type="date" {...inputProps('startDate')} style={{ ...IN_STYLE, colorScheme: 'dark' }} />
            </Field>
            <Field label="End Date">
              <input type="date" {...inputProps('endDate')} style={{ ...IN_STYLE, colorScheme: 'dark' }} />
            </Field>
          </div>

          {/* Eligible count */}
          <div
            className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {countLoading ? (
              <span style={{ color: '#94a3b8' }}>Calculating matches…</span>
            ) : eligibleCount !== null ? (
              <>
                <span className="font-bold text-white">{eligibleCount.toLocaleString()}</span>
                <span style={{ color: '#94a3b8' }}>contractors match your filters</span>
              </>
            ) : (
              <span style={{ color: '#64748b' }}>Select county or vertical to see eligible contractor count</span>
            )}
          </div>

          {/* Send schedule (advanced) */}
          <div>
            <button
              type="button"
              onClick={() => setShowSchedule(s => !s)}
              className="flex items-center gap-1.5 text-xs font-medium"
              style={{ color: showSchedule ? '#facc15' : '#64748b' }}
            >
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                style={{ transform: showSchedule ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              Advanced: Send Schedule
              {!showSchedule && <span style={{ color: '#475569' }}>(defaults to 09:00–17:00 Mon–Fri ET)</span>}
            </button>
            {showSchedule && (
              <div className="mt-2">
                <ScheduleEditor schedule={schedule} onChange={setSchedule} />
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm rounded-lg px-3 py-2" style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}>
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium"
              style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl text-sm font-semibold transition-opacity"
              style={{ background: 'linear-gradient(135deg, #facc15, #f59e0b)', color: '#0a0f1e', opacity: submitting ? 0.7 : 1 }}
            >
              {submitting ? 'Creating…' : 'Create & Activate'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

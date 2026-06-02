import { useState, useEffect } from 'react';
import Modal, { ModalClose } from '../../ui/Modal';
import { fetchCampaignDetail, fetchEligibleCount, updateCampaign } from '../../../api/emailCampaigns';
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

// Parse the CampaignDetailOut send_schedule structure into our flat schedule state
function parseSchedule(detail) {
  const sched = detail?.send_schedule?.schedules?.[0];
  if (!sched) return null;
  return {
    from:     sched.timing?.from     || DEFAULT_SCHEDULE.from,
    to:       sched.timing?.to       || DEFAULT_SCHEDULE.to,
    timezone: sched.timezone         || DEFAULT_SCHEDULE.timezone,
    days:     Object.keys(sched.days || {}).length
      ? sched.days
      : DEFAULT_SCHEDULE.days,
  };
}

export default function EditCampaignModal({ token, campaignId, onClose, onSaved }) {
  const [detailLoading, setDetailLoading] = useState(true);
  const [form, setForm] = useState({
    name: '', vertical: '', county_id: '',
    zips: '', maxContacts: '', startDate: '', endDate: '',
  });
  const [showSchedule, setShowSchedule] = useState(false);
  const [schedule, setSchedule]         = useState(DEFAULT_SCHEDULE);
  const [eligibleCount, setEligibleCount] = useState(null);
  const [countLoading, setCountLoading]   = useState(false);
  const [submitting, setSubmitting]       = useState(false);
  const [error, setError]                 = useState(null);

  // Fetch full detail on mount to pre-fill form
  useEffect(() => {
    fetchCampaignDetail(token, campaignId)
      .then(data => {
        setForm({
          name:        data.name        || '',
          vertical:    data.vertical    || '',
          county_id:   data.county_id   || '',
          zips:        (data.geo_filter?.zips || []).join(', '),
          maxContacts: data.max_contacts != null ? String(data.max_contacts) : '',
          startDate:   data.start_date  || '',
          endDate:     data.end_date    || '',
        });
        const parsed = parseSchedule(data);
        if (parsed) { setSchedule(parsed); setShowSchedule(true); }
      })
      .catch(err => setError(err.detail || 'Failed to load campaign.'))
      .finally(() => setDetailLoading(false));
  }, [token, campaignId]);

  const debouncedFilters = useDebounce(
    { county_id: form.county_id, zips: form.zips, vertical: form.vertical, campaign_id: campaignId },
    300
  );

  useEffect(() => {
    if (!debouncedFilters.county_id && !debouncedFilters.vertical) { setEligibleCount(null); return; }
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
    if (!form.name.trim()) { setError('Campaign name is required.'); return; }
    setSubmitting(true);
    setError(null);
    try {
      const zipsArray = form.zips
        ? form.zips.split(',').map(z => z.trim()).filter(Boolean)
        : [];
      await updateCampaign(token, campaignId, {
        name:          form.name.trim(),
        county_id:     form.county_id  || undefined,
        vertical:      form.vertical   || undefined,
        zips:          zipsArray.length ? zipsArray : undefined,
        max_contacts:  form.maxContacts ? parseInt(form.maxContacts, 10) : undefined,
        start_date:    form.startDate  || undefined,
        end_date:      form.endDate    || undefined,
        send_schedule: showSchedule ? buildSchedulePayload(schedule) : undefined,
      });
      onSaved();
    } catch (err) {
      setError(err.detail || 'Failed to update campaign.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal isOpen onClose={onClose} title="Edit Campaign">
      <div
        className="relative w-full max-w-2xl rounded-2xl p-6"
        style={{ background: 'rgba(10,15,30,0.97)', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <ModalClose onClick={onClose} />
        <h2 className="text-base font-bold text-white mb-1">Edit Campaign</h2>
        <p className="text-xs mb-5" style={{ color: '#64748b' }}>Template cannot be changed after creation.</p>

        {detailLoading ? (
          <div className="flex flex-col gap-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
            ))}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Field label="Campaign Name">
              <input type="text" placeholder="e.g. Hillsborough Roofing — June 2025" {...inputProps('name')} />
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

            {/* Eligible count (excludes existing members via campaign_id) */}
            <div
              className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              {countLoading ? (
                <span style={{ color: '#94a3b8' }}>Calculating new eligible contacts…</span>
              ) : eligibleCount !== null ? (
                <>
                  <span className="font-bold text-white">{eligibleCount.toLocaleString()}</span>
                  <span style={{ color: '#94a3b8' }}>new contractors eligible (existing members excluded)</span>
                </>
              ) : (
                <span style={{ color: '#64748b' }}>Select county or vertical to see eligible contractor count</span>
              )}
            </div>

            {/* Send schedule */}
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
                Send Schedule
                {!showSchedule && <span style={{ color: '#475569' }}>(click to edit)</span>}
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
                {submitting ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}

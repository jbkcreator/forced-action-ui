import { useState, useEffect, useCallback } from 'react';
import Modal from '../ui/Modal';
import LoadingSpinner from '../ui/LoadingSpinner';
import Button from '../ui/Button';
import DfyLitePitchResult from './DfyLitePitchResult';
import { getDfyLiteOptions, getDfyLiteHistory, generatePitch, updatePitchOutput } from '../../api/dfyLite';

// Maps each distress signal to the options it unlocks
const SIGNAL_OPTIONS = {
  code_violations: {
    verticals:  ['roofer', 'restoration_contractor', 'public_adjuster', 'fix_and_flip', 'wholesaler'],
    pitchTypes: ['contractor_repair_help', 'insurance_claim_help', 'cash_buyout'],
    angles:     ['avoid_code_or_tax_escalation', 'repair_property_damage', 'avoid_further_costs', 'sell_as_is_fast'],
  },
  tax_delinquency: {
    verticals:  ['hard_money_lender', 'wholesaler', 'fix_and_flip', 'attorney'],
    pitchTypes: ['loan_offer', 'tax_or_lien_resolution', 'cash_buyout'],
    angles:     ['avoid_code_or_tax_escalation', 'unlock_equity', 'avoid_further_costs', 'sell_as_is_fast', 'explore_private_lending'],
  },
  foreclosure: {
    verticals:  ['hard_money_lender', 'wholesaler', 'attorney', 'fix_and_flip'],
    pitchTypes: ['loan_offer', 'cash_buyout', 'legal_help'],
    angles:     ['unlock_equity', 'sell_as_is_fast', 'avoid_further_costs', 'explore_private_lending'],
  },
  legal_proceedings: {
    verticals:  ['attorney', 'wholesaler', 'hard_money_lender'],
    pitchTypes: ['legal_help', 'tax_or_lien_resolution', 'cash_buyout'],
    angles:     ['resolve_public_record_pressure', 'sell_as_is_fast', 'avoid_further_costs'],
  },
  building_permits: {
    verticals:  ['roofer', 'restoration_contractor', 'public_adjuster', 'fix_and_flip'],
    pitchTypes: ['contractor_repair_help', 'insurance_claim_help', 'cash_buyout'],
    angles:     ['repair_property_damage', 'avoid_code_or_tax_escalation', 'avoid_further_costs'],
  },
  insurance_claim: {
    verticals:  ['public_adjuster', 'restoration_contractor', 'roofer'],
    pitchTypes: ['insurance_claim_help', 'contractor_repair_help'],
    angles:     ['repair_property_damage', 'avoid_further_costs', 'resolve_public_record_pressure'],
  },
  storm_damage: {
    verticals:  ['roofer', 'restoration_contractor', 'public_adjuster', 'fix_and_flip'],
    pitchTypes: ['contractor_repair_help', 'insurance_claim_help', 'cash_buyout'],
    angles:     ['repair_property_damage', 'avoid_further_costs', 'sell_as_is_fast'],
  },
};

// Always shown regardless of signals
const BASELINE_OPTIONS = {
  verticals:  ['wholesaler', 'fix_and_flip', 'property_manager', 'other'],
  pitchTypes: ['cash_buyout', 'custom'],
  angles:     ['sell_as_is_fast', 'custom'],
};

function computeAllowed(signals = []) {
  const v = new Set(BASELINE_OPTIONS.verticals);
  const p = new Set(BASELINE_OPTIONS.pitchTypes);
  const a = new Set(BASELINE_OPTIONS.angles);
  for (const sig of signals) {
    const opts = SIGNAL_OPTIONS[sig];
    if (!opts) continue;
    opts.verticals.forEach((x) => v.add(x));
    opts.pitchTypes.forEach((x) => p.add(x));
    opts.angles.forEach((x) => a.add(x));
  }
  return { verticals: v, pitchTypes: p, angles: a };
}

const FALLBACK_VERTICALS = [
  'hard_money_lender', 'wholesaler', 'fix_and_flip', 'roofer',
  'restoration_contractor', 'public_adjuster', 'attorney', 'property_manager', 'other',
];
const FALLBACK_PITCH_TYPES = [
  'loan_offer', 'cash_buyout', 'contractor_repair_help',
  'insurance_claim_help', 'legal_help', 'tax_or_lien_resolution', 'custom',
];
const FALLBACK_OFFER_ANGLES = [
  'unlock_equity', 'sell_as_is_fast', 'avoid_further_costs',
  'repair_property_damage', 'resolve_public_record_pressure',
  'explore_private_lending', 'avoid_code_or_tax_escalation', 'custom',
];
const FALLBACK_FORMATS = ['email_subject', 'email_pitch', 'sms_pitch', 'call_script', 'linkedin_message', 'evidence_summary'];
const DEFAULT_FORMATS = ['email_subject', 'email_pitch', 'sms_pitch'];
const MAX_CUSTOM_LEN = 500;

function labelFor(key) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function relativeDate(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function StatusBadge({ status }) {
  const map = {
    Pitch_Generated: 'bg-green-500/10 text-green-400 border-green-500/20',
    Needs_Review:    'bg-yellow-400/10 text-yellow-300 border-yellow-400/20',
    Delivered:       'bg-blue-500/10 text-blue-400 border-blue-500/20',
    Pitch_Failed:    'bg-red-500/10 text-red-400 border-red-500/20',
    Signal_Failed:   'bg-red-500/10 text-red-400 border-red-500/20',
  };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${map[status] ?? 'bg-white/5 text-slate-400 border-white/10'}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

export default function DfyLitePitchModal({ lead, feedUuid, onClose }) {
  // 'form' | 'loading' | 'result' | 'error' | 'history' | 'edit'
  const [step, setStep] = useState('form');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [options, setOptions] = useState(null);
  const [history, setHistory] = useState([]);
  const [countData, setCountData] = useState(null);
  const [editOrder, setEditOrder] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(true);

  const [form, setForm] = useState({
    target_vertical: '',
    pitch_type: '',
    offer_angle: '',
    selected_output_formats: [...DEFAULT_FORMATS],
    custom_instructions: '',
  });
  const [validationError, setValidationError] = useState(null);

  useEffect(() => {
    Promise.all([
      getDfyLiteOptions(feedUuid).catch(() => null),
      getDfyLiteHistory(feedUuid, lead.property_id).catch(() => null),
    ]).then(([opts, hist]) => {
      if (opts) setOptions(opts);
      if (hist) {
        setCountData({ count: hist.count ?? 0, max: hist.limit ?? 3, remaining: hist.remaining ?? 3 });
        setHistory(hist.orders ?? []);
        if ((hist.count ?? 0) > 0) setStep('history');
      }
      setHistoryLoading(false);
    });
  }, [feedUuid, lead.property_id]);

  const allowed = computeAllowed(lead.distress_types ?? []);

  const verticals   = (options?.target_verticals ?? FALLBACK_VERTICALS).filter((v) => allowed.verticals.has(v));
  const pitchTypes  = (options?.pitch_types      ?? FALLBACK_PITCH_TYPES).filter((v) => allowed.pitchTypes.has(v));
  const offerAngles = (options?.offer_angles     ?? FALLBACK_OFFER_ANGLES).filter((v) => allowed.angles.has(v));
  const allFormats  = options?.output_formats    ?? FALLBACK_FORMATS;

  function handleFormatToggle(fmt) {
    setForm((prev) => ({
      ...prev,
      selected_output_formats: prev.selected_output_formats.includes(fmt)
        ? prev.selected_output_formats.filter((f) => f !== fmt)
        : [...prev.selected_output_formats, fmt],
    }));
  }

  const handleSubmit = useCallback(async () => {
    setValidationError(null);
    if (!form.target_vertical) return setValidationError('Select a target vertical.');
    if (!form.pitch_type)      return setValidationError('Select a pitch type.');
    if (!form.offer_angle)     return setValidationError('Select an offer angle.');
    if (!form.selected_output_formats.length) return setValidationError('Select at least one output format.');
    if (form.custom_instructions.length > MAX_CUSTOM_LEN)
      return setValidationError(`Custom instructions must be ≤ ${MAX_CUSTOM_LEN} characters.`);

    setStep('loading');
    setError(null);

    try {
      const order = await generatePitch(feedUuid, {
        property_id:             lead.property_id,
        target_vertical:         form.target_vertical,
        pitch_type:              form.pitch_type,
        offer_angle:             form.offer_angle || undefined,
        selected_output_formats: form.selected_output_formats,
        custom_instructions:     form.custom_instructions || undefined,
      });

      const outputs = order.generated_outputs ?? order.generated_outputs_json ?? {};
      setResult(outputs);

      // push to local history so History tab reflects it immediately
      setHistory((prev) => [{
        id:                     order.order_id,
        status:                 order.status,
        pitch_type:             form.pitch_type,
        target_vertical:        form.target_vertical,
        pitch_generation_number: order.pitch_generation_number,
        generated_outputs_json: outputs,
        created_at:             new Date().toISOString(),
      }, ...prev]);
      setCountData((prev) => prev
        ? { ...prev, count: prev.count + 1, remaining: Math.max(0, prev.remaining - 1) }
        : null,
      );

      setStep('result');
    } catch (err) {
      setError(
        err?.status === 422
          ? `You've reached the 3-pitch limit for this lead.`
          : 'Generation failed. Please try again.',
      );
      setStep('error');
    }
  }, [feedUuid, form, lead.property_id]);

  const handleSaveEdit = useCallback(async (updates) => {
    await updatePitchOutput(feedUuid, editOrder.id, updates);
    setHistory((prev) =>
      prev.map((o) => o.id === editOrder.id ? { ...o, generated_outputs_json: updates } : o),
    );
    setEditOrder((prev) => ({ ...prev, generated_outputs_json: updates }));
  }, [feedUuid, editOrder]);

  const remaining = countData?.remaining ?? null;
  const historyCount = history.filter((o) => o.generated_outputs_json).length;
  const activeTab = (step === 'history' || step === 'edit') ? 'history' : 'generate';
  const showTabs = step !== 'loading';

  return (
    <Modal isOpen onClose={onClose} title="Generate Pitch" className="w-full max-w-lg mx-4">
      <div className="bg-[#0f1117] rounded-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white transition text-lg leading-none"
          aria-label="Close"
        >
          &#x2715;
        </button>

        {/* Header */}
        <div className="mb-4">
          <p className="text-base font-semibold text-white">Generate Pitch</p>
          <p className="text-xs text-slate-400 mt-0.5 truncate">{lead.address}</p>
          {remaining !== null && (
            <span className="inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full bg-yellow-400/10 text-yellow-300 border border-yellow-400/20">
              {remaining} pitch{remaining !== 1 ? 'es' : ''} remaining
            </span>
          )}
        </div>

        {/* Tabs — visible on form and history steps */}
        {showTabs && (
          <div className="flex gap-1 mb-5 border-b border-white/[0.07] pb-0">
            {[
              { key: 'generate', label: 'Generate New' },
              { key: 'history',  label: `History${historyCount ? ` (${historyCount})` : ''}` },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => {
                  if (key === 'generate') { if (step !== 'form') setStep('form'); }
                  else { setStep('history'); setEditOrder(null); }
                }}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition -mb-px ${
                  activeTab === key
                    ? 'border-yellow-400 text-yellow-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* ── Generate form ── */}
        {step === 'form' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Target Vertical *</label>
                <select
                  className="w-full bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-yellow-400/50"
                  value={form.target_vertical}
                  onChange={(e) => setForm((p) => ({ ...p, target_vertical: e.target.value }))}
                >
                  <option value="">Select...</option>
                  {verticals.map((v) => <option key={v} value={v}>{labelFor(v)}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Pitch Type *</label>
                <select
                  className="w-full bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-yellow-400/50"
                  value={form.pitch_type}
                  onChange={(e) => setForm((p) => ({ ...p, pitch_type: e.target.value }))}
                >
                  <option value="">Select...</option>
                  {pitchTypes.map((v) => <option key={v} value={v}>{labelFor(v)}</option>)}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs text-slate-400 mb-1">Offer Angle *</label>
                <select
                  className="w-full bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-yellow-400/50"
                  value={form.offer_angle}
                  onChange={(e) => setForm((p) => ({ ...p, offer_angle: e.target.value }))}
                >
                  <option value="">Select...</option>
                  {offerAngles.map((v) => <option key={v} value={v}>{labelFor(v)}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-2">Output Formats</label>
              <div className="flex flex-wrap gap-2">
                {allFormats.map((fmt) => {
                  const active = form.selected_output_formats.includes(fmt);
                  return (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => handleFormatToggle(fmt)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition font-medium ${
                        active
                          ? 'bg-yellow-400/15 text-yellow-300 border-yellow-400/30'
                          : 'bg-white/[0.05] text-slate-400 border-white/[0.08] hover:bg-white/[0.10]'
                      }`}
                    >
                      {labelFor(fmt)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Custom Instructions
                <span className="ml-1 text-slate-500">({form.custom_instructions.length}/{MAX_CUSTOM_LEN})</span>
              </label>
              <textarea
                className="w-full bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-yellow-400/50 resize-none"
                rows={3}
                maxLength={MAX_CUSTOM_LEN}
                placeholder="Optional — additional context or tone guidance..."
                value={form.custom_instructions}
                onChange={(e) => setForm((p) => ({ ...p, custom_instructions: e.target.value }))}
              />
            </div>

            {validationError && <p className="text-xs text-red-400">{validationError}</p>}

            <div className="flex gap-2 pt-1">
              <Button variant="primary" className="flex-1 py-2.5 text-sm" onClick={handleSubmit}>
                Generate Pitch
              </Button>
              <Button variant="secondary" className="px-4 py-2.5 text-sm" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* ── Loading ── */}
        {step === 'loading' && (
          <div className="py-8">
            <LoadingSpinner text="Generating your pitch..." />
          </div>
        )}

        {/* ── New result ── */}
        {step === 'result' && result && (
          <DfyLitePitchResult
            output={result}
            onBack={() => setStep('form')}
            onClose={onClose}
          />
        )}

        {/* ── Error ── */}
        {step === 'error' && (
          <div className="space-y-4 py-4">
            <p className="text-sm text-red-400 text-center">{error}</p>
            <div className="flex gap-2 justify-center">
              {!error?.includes('limit') && (
                <Button variant="primary" className="text-sm px-5 py-2" onClick={() => setStep('form')}>
                  Try Again
                </Button>
              )}
              <Button variant="secondary" className="text-sm px-5 py-2" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        )}

        {/* ── History list ── */}
        {step === 'history' && (
          <div className="space-y-3 max-h-[52vh] overflow-y-auto pr-1">
            {historyLoading ? (
              <div className="py-10">
                <LoadingSpinner text="Loading pitches…" />
              </div>
            ) : historyCount === 0 ? (
              <p className="text-sm text-slate-400 text-center py-10">
                No pitches generated for this lead yet.
              </p>
            ) : (
              history
                .filter((o) => o.generated_outputs_json)
                .map((order) => (
                  <div
                    key={order.id}
                    className="rounded-xl p-4 border border-white/[0.08] bg-white/[0.03] space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-white">
                          Pitch #{order.pitch_generation_number}
                        </span>
                        <StatusBadge status={order.status} />
                      </div>
                      <span className="text-[11px] text-slate-500">{relativeDate(order.created_at)}</span>
                    </div>

                    {(order.pitch_type || order.target_vertical) && (
                      <p className="text-xs text-slate-400">
                        {[order.pitch_type, order.target_vertical]
                          .filter(Boolean)
                          .map(labelFor)
                          .join(' · ')}
                      </p>
                    )}

                    {order.generated_outputs_json?.email_subject && (
                      <p className="text-xs text-slate-300 italic truncate">
                        "{order.generated_outputs_json.email_subject}"
                      </p>
                    )}

                    <Button
                      variant="secondary"
                      className="text-xs px-3 py-1.5 mt-1"
                      onClick={() => { setEditOrder(order); setStep('edit'); }}
                    >
                      View / Edit
                    </Button>
                  </div>
                ))
            )}
          </div>
        )}

        {/* ── Edit ── */}
        {step === 'edit' && editOrder && (
          <DfyLitePitchResult
            output={editOrder.generated_outputs_json}
            editable
            onSave={handleSaveEdit}
            onBack={() => { setStep('history'); setEditOrder(null); }}
            onClose={onClose}
          />
        )}
      </div>
    </Modal>
  );
}

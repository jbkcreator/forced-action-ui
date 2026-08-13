import { useState } from 'react';
import { createDemoDealRoom } from '../../api/dealRoom';

const TIERS = ['Starter', 'Pro', 'Founder'];

// Must match backend VALID_VERTICALS. A hold is on one (zip, vertical, county).
const VERTICALS = [
  ['roofing', 'Roofing'],
  ['restoration', 'Restoration'],
  ['public_adjusters', 'Public Adjusters'],
  ['wholesalers', 'Wholesalers'],
  ['fix_flip', 'Fix & Flip'],
  ['attorneys', 'Attorneys'],
];

const COUNTIES = [
  ['hillsborough', 'Hillsborough'],
  ['pinellas', 'Pinellas'],
];

const INITIAL = {
  prospect_name: '',
  prospect_email: '',
  zip_code: '',
  vertical: 'roofing',
  county_id: 'hillsborough',
  tier: 'Starter',
  job_value: '',
  close_rate: '',
};

function CopyField({ label, sublabel, value }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="flex-1 rounded-xl p-4 bg-white/[0.04] border border-white/[0.08]">
      <p className="text-xs font-semibold text-slate-400 mb-0.5">{label}</p>
      <p className="text-[11px] text-slate-500 mb-3">{sublabel}</p>
      <p className="text-xs text-slate-300 break-all mb-3 rounded-lg px-3 py-2 bg-black/30 font-mono">
        {value}
      </p>
      <button
        onClick={handleCopy}
        className={[
          'w-full text-xs font-semibold py-2 rounded-lg transition-colors border',
          copied
            ? 'bg-green-500/15 text-green-300 border-green-500/30'
            : 'bg-yellow-400/10 text-yellow-400 border-yellow-400/25',
        ].join(' ')}
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
}

export default function DealRoomGenerator({ passcode, onUnauthorized }) {
  const [form, setForm] = useState(INITIAL);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [zipError, setZipError] = useState(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (name === 'zip_code') setZipError(null);
    setError(null);
    setResult(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setZipError(null);
    setResult(null);

    const body = {
      prospect_name: form.prospect_name.trim(),
      prospect_email: form.prospect_email.trim(),
      zip_code: form.zip_code.trim(),
      vertical: form.vertical,
      county_id: form.county_id,
      tier: form.tier.toLowerCase(),
      job_value: Number(form.job_value),
      close_rate: Number(form.close_rate) / 100,
    };

    setLoading(true);
    try {
      const data = await createDemoDealRoom(passcode, body);
      setResult(data);
    } catch (err) {
      if (err.status === 401) {
        onUnauthorized?.();
      } else if (err.status === 409) {
        setZipError('This ZIP is already held or locked.');
      } else {
        setError(err.detail || 'Something went wrong.');
      }
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'w-full text-sm text-slate-200 rounded-lg px-3 py-2.5 outline-none transition-colors bg-white/5 border border-white/10';
  const labelClass = 'block text-xs font-medium text-slate-400 mb-1.5';

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-white">Generate Deal Room</h2>
        <p className="text-sm text-slate-500 mt-1">
          Create a personalised deal-room link and prefilled checkout URL for a prospect.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Prospect name</label>
            <input
              name="prospect_name"
              value={form.prospect_name}
              onChange={handleChange}
              required
              placeholder="John Smith"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Prospect email</label>
            <input
              type="email"
              name="prospect_email"
              value={form.prospect_email}
              onChange={handleChange}
              required
              placeholder="john@example.com"
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Target ZIP (5-digit)</label>
            <input
              name="zip_code"
              value={form.zip_code}
              onChange={handleChange}
              required
              pattern="\d{5}"
              placeholder="33601"
              maxLength={5}
              className={[inputClass, zipError ? 'border-red-500/50' : ''].join(' ')}
            />
            {zipError && (
              <p className="mt-1.5 text-xs text-red-400">{zipError}</p>
            )}
          </div>
          <div>
            <label className={labelClass}>Tier</label>
            <select
              name="tier"
              value={form.tier}
              onChange={handleChange}
              required
              className={inputClass}
            >
              {TIERS.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Vertical</label>
            <select
              name="vertical"
              value={form.vertical}
              onChange={handleChange}
              required
              className={inputClass}
            >
              {VERTICALS.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>County</label>
            <select
              name="county_id"
              value={form.county_id}
              onChange={handleChange}
              required
              className={inputClass}
            >
              {COUNTIES.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Avg job value ($)</label>
            <input
              type="number"
              name="job_value"
              value={form.job_value}
              onChange={handleChange}
              required
              min={0}
              step={100}
              placeholder="5000"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Close rate (0–100%)</label>
            <input
              type="number"
              name="close_rate"
              value={form.close_rate}
              onChange={handleChange}
              required
              min={0}
              max={100}
              step={1}
              placeholder="20"
              className={inputClass}
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-400 rounded-lg px-3 py-2 bg-red-500/10 border border-red-500/20">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-xl text-sm font-bold bg-gradient-to-br from-yellow-400 to-amber-500 text-slate-900 transition-opacity disabled:opacity-60"
        >
          {loading ? 'Generating...' : 'Generate Deal Room'}
        </button>
      </form>

      {result && (
        <div className="mt-6">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Generated links
          </p>
          <div className="flex gap-3">
            <CopyField
              label="Deal-Room Link"
              sublabel="Send to prospect"
              value={result.deal_room_url}
            />
            <CopyField
              label="Ready-to-buy Link"
              sublabel="Direct checkout"
              value={result.prefilled_checkout_url}
            />
          </div>
        </div>
      )}
    </div>
  );
}

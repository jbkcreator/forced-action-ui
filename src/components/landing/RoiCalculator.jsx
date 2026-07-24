import { useMemo, useState } from 'react';
import {
  VERTICAL_OPTIONS,
  DEFAULT_VERTICAL,
  ROI_CALCULATOR_DISCLAIMER,
  ROI_DEFAULT_LEADS_PER_MONTH,
  getRoiCalculatorDefaults,
  computeRoi,
} from '../../config/verticals';

const USD = (n) =>
  Number(n || 0).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

/**
 * Tier2 personalized ROI calculator (T-B12-04).
 *
 * Visitor picks a vertical, then edits close rate + deal value (pre-filled with
 * conservative per-vertical defaults) to get a live, illustrative monthly /
 * annual estimate. Math is fully client-side (see computeRoi in verticals.js).
 *
 * VideoAsk seam: pass `vertical` to seed the selection. A future VideoAsk
 * branch (Block 2) feeds that same prop — no other change needed. When
 * omitted, falls back to DEFAULT_VERTICAL.
 *
 * Every figure is labeled an "illustrative estimate, not a guarantee". No
 * historical claims, no promises.
 */
export default function RoiCalculator({ vertical: seededVertical, onStartFree }) {
  const [vertical, setVertical] = useState(seededVertical || DEFAULT_VERTICAL);
  const defaults = getRoiCalculatorDefaults(vertical);

  // Inputs are strings (raw from <input>) so the fields can be cleared while typing.
  const [leadsPerMonth, setLeadsPerMonth] = useState(String(ROI_DEFAULT_LEADS_PER_MONTH));
  const [closeRatePct, setCloseRatePct] = useState(String(defaults.closeRatePct));
  const [dealValue, setDealValue] = useState(String(defaults.dealValue));

  // Re-seed the editable inputs when the vertical changes so each vertical
  // starts from its own conservative default (visitor can still override).
  function onVerticalChange(next) {
    setVertical(next);
    const d = getRoiCalculatorDefaults(next);
    setCloseRatePct(String(d.closeRatePct));
    setDealValue(String(d.dealValue));
  }

  const result = useMemo(
    () =>
      computeRoi({
        leadsPerMonth,
        closeRatePct,
        dealValue,
        feePct: defaults.feePct,
      }),
    [leadsPerMonth, closeRatePct, dealValue, defaults.feePct],
  );

  const inputClass =
    'w-full bg-fa-bg-surface border border-fa-border-default rounded-lg px-3 py-2 ' +
    'text-fa-text-primary text-sm focus:outline-none focus:border-fa-border-emphasis';
  const labelClass = 'block text-xs font-medium text-fa-text-secondary mb-1.5';

  return (
    <section
      className="max-w-2xl mx-auto rounded-2xl border border-fa-border-default bg-fa-bg-card p-6 sm:p-8"
      aria-labelledby="roi-calc-heading"
    >
      <h2
        id="roi-calc-heading"
        className="text-3xl sm:text-4xl font-bold text-fa-text-primary text-center mb-2"
      >
        Estimate Your Potential
      </h2>
      <p className="text-sm text-fa-text-secondary text-center mb-6">
        Pick your vertical and adjust the numbers to your business.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="roi-vertical">
            Your vertical
          </label>
          <select
            id="roi-vertical"
            className={inputClass}
            value={vertical}
            onChange={(e) => onVerticalChange(e.target.value)}
          >
            {VERTICAL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass} htmlFor="roi-leads">
            Leads worked / month
          </label>
          <input
            id="roi-leads"
            type="number"
            min="0"
            inputMode="numeric"
            className={inputClass}
            value={leadsPerMonth}
            onChange={(e) => setLeadsPerMonth(e.target.value)}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="roi-close">
            Your close rate (%)
          </label>
          <input
            id="roi-close"
            type="number"
            min="0"
            max="100"
            step="0.5"
            inputMode="decimal"
            className={inputClass}
            value={closeRatePct}
            onChange={(e) => setCloseRatePct(e.target.value)}
          />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="roi-value">
            {defaults.valueLabel}
            {defaults.feePct != null ? ' (your fee = ' + defaults.feePct + '%)' : ''}
          </label>
          <input
            id="roi-value"
            type="number"
            min="0"
            inputMode="numeric"
            className={inputClass}
            value={dealValue}
            onChange={(e) => setDealValue(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-xl border border-fa-border-default bg-fa-bg-surface p-5 text-center">
        <p className="text-xs uppercase tracking-wide text-fa-text-secondary mb-1">
          Estimated monthly potential
        </p>
        <p className="text-3xl font-bold text-fa-text-primary" data-testid="roi-monthly">
          {USD(result.monthlyEarnings)}
        </p>
        <p className="text-sm text-fa-text-secondary mt-1" data-testid="roi-annual">
          ~{USD(result.annualEarnings)} / year
        </p>
        <p className="text-xs text-fa-text-muted mt-2">
          {result.dealsPerMonth.toLocaleString('en-US', { maximumFractionDigits: 1 })} closed / mo
          {' × '}
          {USD(result.earningsPerDeal)} each
        </p>
      </div>

      {onStartFree && (
        <div className="text-center mt-5">
          <button
            type="button"
            onClick={onStartFree}
            className="bg-fa-primary hover:bg-fa-primary-hover text-fa-bg-base font-bold px-7 py-3 rounded-xl transition shadow-lg shadow-fa-primary/20"
          >
            Start Free — Claim Lead Preview
          </button>
        </div>
      )}

      <p className="text-xs text-fa-text-muted mt-4 text-center" data-testid="roi-disclaimer">
        {ROI_CALCULATOR_DISCLAIMER}
      </p>
    </section>
  );
}

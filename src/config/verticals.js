/**
 * Centralized vertical config — single source of truth for all frontend
 * vertical metadata. Import from here instead of defining inline dicts.
 *
 * Vertical = product category (roofing, restoration, ...).
 * ICP = customer group (contractor, rei_investor, ...) — separate concept.
 * See backend config/icp_channels.py for ICP definitions.
 *
 * To add a new vertical: add it here. All components that import
 * VERTICAL_LABELS or VERTICALS will pick it up automatically.
 */

export const VERTICALS = {
  roofing: {
    label: 'Roofing',
    icon: 'home',
    roi: {
      avg_job_value: 8500,
      headline: 'Roofers in {countyName} close 12+ storm/distress jobs/mo',
    },
  },
  restoration: {
    label: 'Restoration',
    icon: 'droplet',
    roi: {
      avg_job_value: 6500,
      monthly_revenue: 52000,
      headline: 'Remediation contractors average 8 distress calls/mo at ~$6,500 each',
    },
  },
  public_adjusters: {
    label: 'Public Adjusters',
    icon: 'clipboard',
    roi: {
      avg_job_value: 14000,
      monthly_revenue: 112000,
      headline: 'Public adjusters average 8 settled claims/mo',
    },
  },
  wholesalers: {
    label: 'Wholesalers',
    icon: 'building',
    roi: {
      avg_deal_value: 22000,
      monthly_revenue: 44000,
      headline: 'Distressed-property wholesalers average 2 deals/mo at $22K profit each',
    },
  },
  fix_flip: {
    label: 'Fix & Flip',
    icon: 'hammer',
    roi: {
      avg_deal_value: 18000,
      monthly_revenue: 36000,
      headline: 'Fix & flip investors close 2+ discounted properties/mo from distress signals',
    },
  },
  attorneys: {
    label: 'Attorneys',
    icon: 'scale',
    roi: {
      avg_job_value: 9000,
      monthly_revenue: 90000,
      headline: 'Real estate attorneys find 10+ distressed-estate cases/mo',
    },
  },
};

/** Default fallback vertical (matches backend DEFAULT_VERTICAL). */
export const DEFAULT_VERTICAL = 'roofing';

/** Default fallback ROI when vertical not found. */
export const DEFAULT_ROI = {
  avg_job_value: 5000,
  monthly_revenue: 50000,
  headline: 'Contractors using Forced Action data close 30–50% more distressed jobs',
};

/** Flat {key: label} dict — drop-in replacement for VERTICAL_LABELS inline dicts. */
export const VERTICAL_LABELS = Object.fromEntries(
  Object.entries(VERTICALS).map(([k, v]) => [k, v.label])
);

/** Flat {key: icon} dict. */
export const VERTICAL_ICONS = Object.fromEntries(
  Object.entries(VERTICALS).map(([k, v]) => [k, v.icon])
);

/** Sorted array of all vertical keys. */
export const VERTICAL_KEYS = Object.keys(VERTICALS).sort();

/** Array of {value, label} pairs for use in select/dropdown components. */
export const VERTICAL_OPTIONS = Object.entries(VERTICALS).map(([value, v]) => ({
  value,
  label: v.label,
}));

/** Get ROI frame for a vertical, falling back to DEFAULT_ROI. */
export function getVerticalRoi(vertical) {
  return VERTICALS[vertical]?.roi ?? DEFAULT_ROI;
}

/**
 * ─────────────────────────────────────────────────────────────────────────
 * Tier2 personalized ROI calculator (T-B12-04)
 * ─────────────────────────────────────────────────────────────────────────
 * Client-locked defaults. The visitor may override close rate and deal value;
 * these pre-fill the inputs per vertical. ALL outputs are an "illustrative
 * estimate, not a guarantee" — no historical claims, promise nothing.
 *
 * Locked math/copy:
 *   - 2% close rate everywhere
 *   - wholesale assignment $10K; roofing ticket $12K; restoration job $10K
 *   - public adjusters: fee = 10% of settlement (deal value input = settlement)
 *
 * `valueLabel`   — what the "deal value" input represents for the vertical.
 * `feePct`       — if set, earnings per closed deal = dealValue * feePct/100
 *                  (public adjusters). Otherwise earnings = dealValue.
 *
 * VideoAsk seam: the calculator takes a `vertical` input (dropdown for now).
 * A future VideoAsk branch (Block 2) can seed that same `vertical` value —
 * no math changes required.
 */
export const ROI_CALCULATOR_DISCLAIMER =
  'Illustrative estimate, not a guarantee.';

/** Conservative default number of opportunities worked per month (editable). */
export const ROI_DEFAULT_LEADS_PER_MONTH = 20;

export const ROI_CALCULATOR_DEFAULTS = {
  roofing: { closeRatePct: 2, dealValue: 12000, valueLabel: 'Average job ticket' },
  restoration: { closeRatePct: 2, dealValue: 10000, valueLabel: 'Average job value' },
  public_adjusters: {
    closeRatePct: 2,
    dealValue: 50000,
    valueLabel: 'Average claim settlement',
    feePct: 10,
  },
  wholesalers: { closeRatePct: 2, dealValue: 10000, valueLabel: 'Average assignment fee' },
  fix_flip: { closeRatePct: 2, dealValue: 15000, valueLabel: 'Average profit per flip' },
  attorneys: { closeRatePct: 2, dealValue: 5000, valueLabel: 'Average case fee' },
};

/** Conservative fallback when a vertical has no explicit calculator default. */
export const ROI_CALCULATOR_FALLBACK = {
  closeRatePct: 2,
  dealValue: 5000,
  valueLabel: 'Average deal value',
};

/** Get ROI-calculator defaults for a vertical, falling back conservatively. */
export function getRoiCalculatorDefaults(vertical) {
  return ROI_CALCULATOR_DEFAULTS[vertical] ?? ROI_CALCULATOR_FALLBACK;
}

/**
 * Pure ROI math (client-side). All inputs are numbers already parsed from UI.
 *   monthlyEarnings = leadsPerMonth * (closeRatePct/100) * earningsPerDeal
 *   earningsPerDeal = feePct ? dealValue * feePct/100 : dealValue
 * Returns zeros for invalid/negative inputs so the UI never shows NaN.
 */
export function computeRoi({ leadsPerMonth, closeRatePct, dealValue, feePct }) {
  const leads = Number(leadsPerMonth);
  const close = Number(closeRatePct);
  const value = Number(dealValue);
  const fee = feePct != null ? Number(feePct) : null;
  if (![leads, close, value].every((n) => Number.isFinite(n) && n >= 0)) {
    return { earningsPerDeal: 0, dealsPerMonth: 0, monthlyEarnings: 0, annualEarnings: 0 };
  }
  const earningsPerDeal = fee != null && Number.isFinite(fee) ? value * (fee / 100) : value;
  const dealsPerMonth = leads * (close / 100);
  const monthlyEarnings = dealsPerMonth * earningsPerDeal;
  return {
    earningsPerDeal,
    dealsPerMonth,
    monthlyEarnings,
    annualEarnings: monthlyEarnings * 12,
  };
}

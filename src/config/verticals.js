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
      monthly_revenue: 102000,
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

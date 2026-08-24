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
  roofing: { label: 'Roofing', icon: 'home' },
  restoration: { label: 'Restoration', icon: 'droplet' },
  public_adjusters: { label: 'Public Adjusters', icon: 'clipboard' },
  wholesalers: { label: 'Wholesalers', icon: 'building' },
  fix_flip: { label: 'Fix & Flip', icon: 'hammer' },
  attorneys: { label: 'Attorneys', icon: 'scale' },
};

/** Default fallback vertical (matches backend DEFAULT_VERTICAL). */
export const DEFAULT_VERTICAL = 'roofing';

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

// ROI framing, the personalized ROI calculator, and all job-value / monthly-
// revenue projections were removed from the site (earnings-claim / credibility
// risk). Vertical metadata (labels, icons, options) remains the source of truth.

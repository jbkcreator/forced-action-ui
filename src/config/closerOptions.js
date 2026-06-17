// Feedback enums for the Closer Cockpit one-tap feedback panel.
// Must stay in sync with config/closer.py on the backend.

export const OBJECTION_TYPES = [
  { value: 'price_too_high',          label: 'Price too high' },
  { value: 'lead_quality_doubt',      label: 'Doubts lead quality' },
  { value: 'no_roi_yet',              label: 'No ROI yet' },
  { value: 'already_has_leads',       label: 'Already has leads' },
  { value: 'capacity_too_busy',       label: 'Too busy / capacity full' },
  { value: 'timing_seasonal',         label: 'Bad timing / seasonal' },
  { value: 'needs_partner_approval',  label: 'Needs partner approval' },
  { value: 'exclusivity_concern',     label: 'Exclusivity concern' },
  { value: 'commitment_fear',         label: 'Afraid to commit' },
  { value: 'trust_skepticism',        label: 'Trust / skepticism' },
  { value: 'tech_friction',           label: 'Tech friction' },
  { value: 'wants_to_think',          label: 'Wants to think it over' },
  { value: 'other',                   label: 'Other' },
];

export const PITCH_VARIANTS = [
  { value: 'roi_first',      label: 'ROI-first' },
  { value: 'scarcity',       label: 'Scarcity' },
  { value: 'social_proof',   label: 'Social proof' },
  { value: 'discount_offer', label: 'Discount offer' },
];

// 1 = poor, 5 = excellent
export const RATING_SCALE = [1, 2, 3, 4, 5];
export const RATING_LABELS = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Great', 5: 'Excellent' };

export const OUTCOME_OPTIONS = [
  { value: 'won',           label: 'Won',           color: '#4ade80' },
  { value: 'lost',          label: 'Lost',          color: '#f87171' },
  { value: 'no_response',   label: 'No response',   color: '#94a3b8' },
  { value: 'rescheduled',   label: 'Rescheduled',   color: '#facc15' },
];

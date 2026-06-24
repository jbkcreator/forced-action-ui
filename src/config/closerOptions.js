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

// ── A6: Teaching Corrections (Closer-to-Cora) ────────────────────────────────
// Closer flags a mis-scored lead. Must stay in sync with config/closer.py
// (CORRECTION_REASONS, TEACHABLE_SIGNAL_TYPES) on the backend.

// wrong_distress is the only reason that requires (and accepts) a signal_type.
export const WRONG_DISTRESS_REASON = 'wrong_distress';

// Reasons that apply a score dampener (vs. label-only). Mirrors DAMPENING_REASONS_SET.
export const DAMPENING_REASONS = ['non_residential', 'owner_not_motivated', 'wrong_distress'];

export const CORRECTION_REASONS = [
  {
    value: 'non_residential',
    label: 'Not a residential property',
    hint: 'Commercial / vacant lot / non-home. Kills the lead for all verticals, permanently.',
  },
  {
    value: 'owner_not_motivated',
    label: 'Owner not motivated to sell',
    hint: 'Suppresses investment verticals (wholesale / fix-flip / attorney). Lifts on a newer distress signal.',
  },
  {
    value: WRONG_DISTRESS_REASON,
    label: 'A distress signal is wrong',
    hint: 'e.g. that foreclosure was dismissed. Drops just that one signal. Lifts on a newer same-signal.',
  },
  {
    value: 'bad_contact',
    label: 'Bad contact info',
    hint: 'Wrong phone / email. Routes to re-enrichment — does not change the score.',
  },
  {
    value: 'other',
    label: 'Other',
    hint: 'Saved as a training label only — no score change.',
  },
];

// Human labels for signal types (the wrong_distress picker). Keys mirror
// TEACHABLE_SIGNAL_TYPES on the backend.
export const SIGNAL_TYPE_LABELS = {
  code_violations:    'Code violation',
  judgment_liens:     'Judgment lien',
  code_lien:          'Code lien',
  hoa_liens:          'HOA lien',
  mechanics_liens:    'Mechanic’s lien',
  irs_tax_liens:      'IRS tax lien',
  deed_transfers:     'Deed transfer',
  probate:            'Probate',
  evictions:          'Eviction',
  bankruptcy:         'Bankruptcy',
  tax_delinquencies:  'Tax delinquency',
  foreclosures:       'Foreclosure',
  building_permits:   'Building permit',
  enforcement_permit: 'Enforcement permit',
};

export function signalLabel(type) {
  return SIGNAL_TYPE_LABELS[type] || type;
}

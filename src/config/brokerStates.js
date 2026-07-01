/**
 * Broker work-state display helpers — labels and colors only.
 * State machine logic (allowed transitions, reason codes per state) is fetched
 * from GET /api/broker/states and stored in BrokerContext as `brokerStates`.
 */

// Human labels for each work state.
export const WORK_STATE_LABELS = {
  unassigned:      'Unassigned',
  assigned:        'Assigned',
  working:         'Working',
  quoted:          'Quoted',
  committed:       'Committed',
  lender_rejected: 'Lender Rejected',
  closed_won:      'Closed — Won',
  closed_lost:     'Closed — Lost',
};

// Badge color classes per work state (Tailwind via --fa-* tokens where possible).
export const WORK_STATE_COLORS = {
  unassigned:      { bg: 'bg-slate-800',     text: 'text-slate-400'  },
  assigned:        { bg: 'bg-blue-900/40',   text: 'text-blue-300'   },
  working:         { bg: 'bg-yellow-900/40', text: 'text-yellow-300' },
  quoted:          { bg: 'bg-purple-900/40', text: 'text-purple-300' },
  committed:       { bg: 'bg-orange-900/40', text: 'text-orange-300' },
  lender_rejected: { bg: 'bg-red-900/40',    text: 'text-red-300'    },
  closed_won:      { bg: 'bg-emerald-900/40',text: 'text-emerald-300'},
  closed_lost:     { bg: 'bg-red-900/40',    text: 'text-red-400'    },
};

// Reason codes required on every transition.
// Must stay in sync with REASON_CODES in config/broker_states.py.
export const REASON_CODES = [
  { value: 'no_contact',      label: 'No contact' },
  { value: 'not_interested',  label: 'Not interested' },
  { value: 'price',           label: 'Price concern' },
  { value: 'qualified',       label: 'Qualified' },
  { value: 'docs_received',   label: 'Docs received' },
  { value: 'funded',          label: 'Funded' },
  { value: 'lender_declined', label: 'Lender declined' },
  { value: 'lost_other',      label: 'Lost — other' },
];

// Lane outcome display helpers.
export const LANE_OUTCOME_LABELS = {
  open:      'Open',
  funded:    'Funded',
  dead:      'Dead',
  recycled:  'Recycled',
};

export const LANE_OUTCOME_COLORS = {
  open:     { bg: 'bg-blue-900/40',   text: 'text-blue-300'  },
  funded:   { bg: 'bg-emerald-900/40',text: 'text-emerald-300'},
  dead:     { bg: 'bg-red-900/40',    text: 'text-red-400'   },
  recycled: { bg: 'bg-slate-800',     text: 'text-slate-400' },
};

/** Returns the label for a work state, falling back to the raw value. */
export function workStateLabel(state) {
  return WORK_STATE_LABELS[state] || state;
}

/** Returns badge Tailwind classes for a work state. */
export function workStateColors(state) {
  return WORK_STATE_COLORS[state] || { bg: 'bg-slate-800', text: 'text-slate-400' };
}


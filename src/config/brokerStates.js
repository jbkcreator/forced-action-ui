/**
 * Broker work-state graph and reason code enums.
 * MUST stay in sync with config/broker_states.py on the backend (Forced-action-).
 * Mirror of the closerOptions.js ↔ config/closer.py coupling pattern.
 *
 * NOTE: Lane *stage* keys/labels are NOT here — stages are dynamic backend config
 * fetched from the API (GET /api/lane-stage-config). Only the broker work-state
 * graph lives here.
 */

// Legal work-state transitions (enforced server-side; UI shows only legal next states).
// Maps current state → array of allowed next states.
export const ALLOWED_TRANSITIONS = {
  unassigned:  [],           // broker never manually assigns — done via Claim flow or admin
  assigned:    ['working', 'closed_lost'],
  working:     ['quoted', 'closed_lost'],
  quoted:      ['committed', 'closed_lost'],
  committed:   ['closed_won', 'closed_lost'],
  closed_won:  [],
  closed_lost: [],
};

// All 7 work states.
export const WORK_STATES = [
  'unassigned',
  'assigned',
  'working',
  'quoted',
  'committed',
  'closed_won',
  'closed_lost',
];

// Human labels for each work state.
export const WORK_STATE_LABELS = {
  unassigned:  'Unassigned',
  assigned:    'Assigned',
  working:     'Working',
  quoted:      'Quoted',
  committed:   'Committed',
  closed_won:  'Closed — Won',
  closed_lost: 'Closed — Lost',
};

// Badge color classes per work state (Tailwind via --fa-* tokens where possible).
export const WORK_STATE_COLORS = {
  unassigned:  { bg: 'bg-slate-800',    text: 'text-slate-400' },
  assigned:    { bg: 'bg-blue-900/40',  text: 'text-blue-300'  },
  working:     { bg: 'bg-yellow-900/40',text: 'text-yellow-300'},
  quoted:      { bg: 'bg-purple-900/40',text: 'text-purple-300'},
  committed:   { bg: 'bg-orange-900/40',text: 'text-orange-300'},
  closed_won:  { bg: 'bg-emerald-900/40',text:'text-emerald-300'},
  closed_lost: { bg: 'bg-red-900/40',   text: 'text-red-400'   },
};

// Reason codes required on every transition.
// Must stay in sync with REASON_CODES in config/broker_states.py.
export const REASON_CODES = [
  { value: 'no_contact',     label: 'No contact' },
  { value: 'not_interested', label: 'Not interested' },
  { value: 'price',          label: 'Price concern' },
  { value: 'qualified',      label: 'Qualified' },
  { value: 'docs_received',  label: 'Docs received' },
  { value: 'funded',         label: 'Funded' },
  { value: 'lost_other',     label: 'Lost — other' },
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

/** Returns legal next states for the current work state. */
export function allowedNextStates(currentState) {
  return ALLOWED_TRANSITIONS[currentState] || [];
}

/** Returns true if a transition from → to is legal. */
export function isLegalTransition(from, to) {
  return (ALLOWED_TRANSITIONS[from] || []).includes(to);
}

/** Returns true for a terminal state (no outgoing transitions). */
export function isTerminalState(state) {
  return (ALLOWED_TRANSITIONS[state] || []).length === 0;
}

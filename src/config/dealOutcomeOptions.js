// Outcome enums for the subscriber-facing one-tap Deal Capture card.
// Must stay in sync with src.services.outcome_reasons on the backend
// (Forced-action-/src/services/outcome_reasons.py) — T-B13-01.

export const OUTCOME_STATES = [
  { value: 'closed',  label: 'Closed',  detail: 'This lead turned into a deal' },
  { value: 'pending', label: 'Still working it', detail: 'Active, no outcome yet' },
  { value: 'dead',    label: "Didn't close", detail: 'This lead did not convert' },
];

export const REVENUE_BUCKETS = [
  { key: '5_10k',    label: '< $10K',    detail: 'Under $10,000' },
  { key: '10_25k',   label: '$10 – 25K', detail: '$10K to $25K' },
  { key: '25k_plus', label: '$25K+',     detail: 'Over $25,000' },
];

export const DEAD_REASONS = [
  {
    value: 'bad_contact_info',
    label: 'Bad contact info',
    hint: "Couldn't reach them — wrong or disconnected number.",
  },
  {
    value: 'already_sold_listed',
    label: 'Already sold or listed',
    hint: 'Property was already under contract or on the MLS.',
  },
  {
    value: 'owner_not_distressed',
    label: 'Not actually distressed',
    hint: "Owner wasn't in a distress situation after all.",
  },
  {
    value: 'wrong_owner',
    label: 'Wrong owner info',
    hint: "The contact wasn't the actual property owner.",
  },
  {
    value: 'no_conversation',
    label: 'Never got a conversation',
    hint: "Couldn't get them on the phone — no response.",
  },
  {
    value: 'declined',
    label: 'They declined',
    hint: 'Owner said no.',
  },
  {
    value: 'too_busy',
    label: "Didn't have bandwidth",
    hint: "Couldn't prioritize working this lead.",
  },
  {
    value: 'budget',
    label: 'Budget or financing fell through',
    hint: "Deal didn't pencil out financially.",
  },
];

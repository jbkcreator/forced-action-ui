import { useState } from 'react';

/**
 * Shared lane filter bar — used by both broker (my lanes / pool) and admin surfaces.
 *
 * Props:
 *   filters        — current filter object
 *   onChange(patch)— called with partial update when any filter changes
 *   mode           — 'broker' | 'admin'  (admin shows broker/assigned filter)
 *   countyOptions  — array of {value, label} for county dropdown
 *   lenderOptions  — array of {value, label} for lender dropdown
 *   brokerOptions  — array of {value, label} for broker dropdown (admin only)
 *   hiddenFilters  — array of filter keys to hide; 'date_range' shows a More toggle
 */

const INTENT_TIERS = [
  { value: '',           label: 'All tiers' },
  { value: 'high',       label: 'High' },
  { value: 'medium',     label: 'Medium' },
  { value: 'low',        label: 'Low' },
  { value: 'very_low',   label: 'Very low' },
];

const WORK_STATES = [
  { value: '',                label: 'All states' },
  { value: 'unassigned',      label: 'Unassigned' },
  { value: 'assigned',        label: 'Assigned' },
  { value: 'working',         label: 'Working' },
  { value: 'quoted',          label: 'Quoted' },
  { value: 'committed',       label: 'Committed' },
  { value: 'lender_rejected', label: 'Lender rejected' },
  { value: 'closed_won',      label: 'Closed won' },
  { value: 'closed_lost',     label: 'Closed lost' },
];

const STAGES = [
  { value: '',          label: 'All stages' },
  { value: 'entered',   label: 'Entered' },
  { value: 'quoted',    label: 'Quoted' },
  { value: 'committed', label: 'Committed' },
  { value: 'funded',    label: 'Funded' },
  { value: 'dead',      label: 'Dead' },
];

const SORT_OPTIONS = [
  { value: 'intent_score',  label: 'Intent score' },
  { value: 'entered_at',    label: 'Date entered' },
  { value: 'last_activity', label: 'Last activity' },
  { value: 'address',       label: 'Address' },
];

const ASSIGNED_OPTIONS = [
  { value: '',      label: 'All' },
  { value: 'true',  label: 'Assigned' },
  { value: 'false', label: 'Unassigned' },
];

const CONTACT_OPTIONS = [
  { value: '',           label: 'Any contact' },
  { value: 'has_phone',  label: 'Has phone' },
  { value: 'has_email',  label: 'Has email' },
  { value: 'has_both',   label: 'Has both' },
  { value: 'no_contact', label: 'No contact' },
];

const sel = 'text-xs bg-fa-bg-card border border-fa-border-default text-fa-text-primary rounded px-2 py-1.5 focus:outline-none focus:border-fa-primary';
const inp = 'text-xs bg-fa-bg-card border border-fa-border-default text-fa-text-primary rounded px-2 py-1.5 focus:outline-none focus:border-fa-primary w-32';

function Select({ value, onChange, options }) {
  return (
    <select className={sel} value={value} onChange={e => onChange(e.target.value)}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export default function LaneFilterBar({ filters = {}, onChange, mode = 'broker', countyOptions = [], lenderOptions = [], brokerOptions = [], hiddenFilters = [] }) {
  const set = (key, val) => onChange({ [key]: val });
  const hidden = new Set(hiddenFilters);
  const [showMore, setShowMore] = useState(false);
  const hasMore = hidden.has('date_range');

  // Inline (full-width bar): both inputs on one row
  const dateRangeInline = (
    <div className="flex items-center gap-1">
      <span className="text-xs text-fa-text-muted whitespace-nowrap">Entered</span>
      <input type="date" className={inp} value={filters.entered_from || ''} onChange={e => set('entered_from', e.target.value)} />
      <span className="text-xs text-fa-text-muted">–</span>
      <input type="date" className={inp} value={filters.entered_to || ''} onChange={e => set('entered_to', e.target.value)} />
    </div>
  );

  // Expanded (narrow sidebar): stacked From / To rows
  const dateRangeStacked = (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className="text-xs text-fa-text-muted w-6">From</span>
        <input type="date" className={inp} value={filters.entered_from || ''} onChange={e => set('entered_from', e.target.value)} />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-fa-text-muted w-6">To</span>
        <input type="date" className={inp} value={filters.entered_to || ''} onChange={e => set('entered_to', e.target.value)} />
      </div>
    </div>
  );

  return (
    <div className="border-b border-fa-border-default bg-fa-bg-base">
      {/* Primary filter row */}
      <div className="flex flex-wrap items-center gap-2 px-3 py-2">
        {/* Date range — inline when not hidden */}
        {!hasMore && dateRangeInline}

        {/* Intent tier */}
        <Select
          value={filters.intent_tier || ''}
          onChange={v => set('intent_tier', v)}
          options={INTENT_TIERS}
        />

        {/* Work state — hidden on pool and when explicitly excluded */}
        {mode !== 'pool' && !hidden.has('work_state') && (
          <Select
            value={filters.work_state || ''}
            onChange={v => set('work_state', v)}
            options={WORK_STATES}
          />
        )}

        {/* Stage — hidden on pool and when explicitly excluded */}
        {mode !== 'pool' && !hidden.has('stage') && (
          <Select
            value={filters.stage || ''}
            onChange={v => set('stage', v)}
            options={STAGES}
          />
        )}

        {/* County */}
        {countyOptions.length > 0 && (
          <Select
            value={filters.county || ''}
            onChange={v => set('county', v)}
            options={[{ value: '', label: 'All counties' }, ...countyOptions]}
          />
        )}

        {/* Lender */}
        {lenderOptions.length > 0 && (
          <Select
            value={filters.lender_id || ''}
            onChange={v => set('lender_id', v)}
            options={[{ value: '', label: 'All lenders' }, ...lenderOptions]}
          />
        )}

        {/* Broker (admin only, hideable) */}
        {mode === 'admin' && brokerOptions.length > 0 && !hidden.has('broker_id') && (
          <Select
            value={filters.broker_id || ''}
            onChange={v => set('broker_id', v)}
            options={[{ value: '', label: 'All brokers' }, ...brokerOptions]}
          />
        )}

        {/* Contact filter (admin only) */}
        {mode === 'admin' && (
          <Select
            value={filters.contact_filter || ''}
            onChange={v => set('contact_filter', v)}
            options={CONTACT_OPTIONS}
          />
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Sort */}
        <div className="flex items-center gap-1">
          <Select
            value={filters.sort_by || 'intent_score'}
            onChange={v => set('sort_by', v)}
            options={SORT_OPTIONS}
          />
          <button
            onClick={() => set('sort_dir', (filters.sort_dir || 'desc') === 'desc' ? 'asc' : 'desc')}
            className="text-xs px-2 py-1.5 rounded border border-fa-border-default bg-fa-bg-card text-fa-text-muted hover:text-fa-text-primary transition-colors"
            title="Toggle sort direction"
          >
            {(filters.sort_dir || 'desc') === 'desc' ? '↓' : '↑'}
          </button>
        </div>

        {/* More toggle — only when date_range is hidden */}
        {hasMore && (
          <button
            onClick={() => setShowMore(v => !v)}
            className="text-xs text-fa-text-muted hover:text-fa-text-primary transition-colors px-1 border border-fa-border-default rounded px-2 py-1.5"
          >
            {showMore ? '↑ Less' : '↓ More'}
          </button>
        )}

        {/* Clear */}
        <button
          onClick={() => { onChange({ intent_tier: '', work_state: '', stage: '', county: '', lender_id: '', broker_id: '', contact_filter: '', entered_from: '', entered_to: '', sort_by: 'intent_score', sort_dir: 'desc' }); setShowMore(false); }}
          className="text-xs text-fa-text-muted hover:text-fa-text-primary transition-colors px-1"
        >
          Clear
        </button>
      </div>

      {/* Expanded row — date range stacked for narrow containers */}
      {hasMore && showMore && (
        <div className="px-3 pb-2">
          {dateRangeStacked}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Compact pagination bar — designed for panel footers
// ---------------------------------------------------------------------------

export function LanePagination({ total, limit, offset, onPageChange }) {
  if (total <= limit) return null;
  const page = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="flex items-center justify-between px-3 py-2 border-t border-fa-border-default text-xs text-fa-text-muted">
      <span>{offset + 1}–{Math.min(offset + limit, total)} of {total}</span>
      <div className="flex gap-1">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange((page - 2) * limit)}
          className="px-2 py-1 rounded border border-fa-border-default disabled:opacity-40 hover:text-fa-text-primary transition-colors"
        >
          ‹
        </button>
        <span className="px-2 py-1">{page} / {totalPages}</span>
        <button
          disabled={page >= totalPages}
          onClick={() => onPageChange(page * limit)}
          className="px-2 py-1 rounded border border-fa-border-default disabled:opacity-40 hover:text-fa-text-primary transition-colors"
        >
          ›
        </button>
      </div>
    </div>
  );
}

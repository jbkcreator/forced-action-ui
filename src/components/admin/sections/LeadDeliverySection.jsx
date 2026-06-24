import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import useApi from '../../../hooks/useApi';
import { useAdminContext } from '../adminContext';
import { fetchDeliveries } from '../../../api/deliveries';

const LIMIT = 50;
const GRADES = ['Ultra', 'Platinum', 'Gold', 'Silver', 'Bronze'];

function fmtDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}

export default function LeadDeliverySection() {
  const { token } = useAdminContext() || {};
  const [searchParams, setSearchParams] = useSearchParams();

  const status = searchParams.get('status') || '';
  const grade = searchParams.get('grade') || '';
  const propertyId = searchParams.get('property_id') || '';
  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';
  const accountId = searchParams.get('account_id') || '';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const offset = (page - 1) * LIMIT;

  const { data, loading, error, refetch } = useApi(
    (signal) =>
      fetchDeliveries(
        token,
        { status, grade, property_id: propertyId, from, to, account_id: accountId, limit: LIMIT, offset },
        { signal },
      ),
    [token, status, grade, propertyId, from, to, accountId, page],
  );

  const setFilter = useCallback(
    (key, value) => {
      const next = new URLSearchParams(searchParams);
      if (value) next.set(key, value);
      else next.delete(key);
      if (key !== 'page') next.delete('page'); // any filter change resets to page 1
      setSearchParams(next);
    },
    [searchParams, setSearchParams],
  );

  const items = data?.items || [];
  const total = data?.total || 0;
  const rangeStart = total === 0 ? 0 : offset + 1;
  const rangeEnd = Math.min(offset + LIMIT, total);

  return (
    <div className="p-6 text-fa-text-primary">
      <h2 className="text-xl font-bold mb-4">Lead Delivery</h2>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 mb-4 items-end">
        <label className="flex flex-col text-sm">
          <span className="text-fa-text-secondary mb-1">Status</span>
          <select
            aria-label="Status"
            value={status}
            onChange={(e) => setFilter('status', e.target.value)}
            className="bg-fa-bg-surface border border-fa-border-default rounded px-2 py-1"
          >
            <option value="">All</option>
            <option value="delivered">Delivered</option>
            <option value="rejected">Rejected</option>
          </select>
        </label>

        <label className="flex flex-col text-sm">
          <span className="text-fa-text-secondary mb-1">Grade</span>
          <select
            aria-label="Grade"
            value={grade}
            onChange={(e) => setFilter('grade', e.target.value)}
            className="bg-fa-bg-surface border border-fa-border-default rounded px-2 py-1"
          >
            <option value="">All</option>
            {GRADES.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col text-sm">
          <span className="text-fa-text-secondary mb-1">From</span>
          <input
            aria-label="From"
            type="date"
            value={from}
            onChange={(e) => setFilter('from', e.target.value)}
            className="bg-fa-bg-surface border border-fa-border-default rounded px-2 py-1"
          />
        </label>

        <label className="flex flex-col text-sm">
          <span className="text-fa-text-secondary mb-1">To</span>
          <input
            aria-label="To"
            type="date"
            value={to}
            onChange={(e) => setFilter('to', e.target.value)}
            className="bg-fa-bg-surface border border-fa-border-default rounded px-2 py-1"
          />
        </label>

        <label className="flex flex-col text-sm">
          <span className="text-fa-text-secondary mb-1">Property ID</span>
          <input
            aria-label="Property ID"
            type="number"
            value={propertyId}
            onChange={(e) => setFilter('property_id', e.target.value)}
            className="bg-fa-bg-surface border border-fa-border-default rounded px-2 py-1 w-28"
          />
        </label>

        {accountId && (
          <button
            type="button"
            onClick={() => setFilter('account_id', '')}
            className="text-sm underline text-fa-text-secondary"
          >
            Clear contractor filter
          </button>
        )}

        <button
          type="button"
          onClick={refetch}
          className="ml-auto text-sm border border-fa-border-default rounded px-3 py-1"
        >
          Refresh
        </button>
      </div>

      {/* States */}
      {loading && !data && <p className="text-fa-text-secondary">Loading…</p>}

      {error && (
        <div className="border border-fa-border-default rounded p-4 mb-4">
          <p className="mb-2">
            {error.status === 401 || error.status === 403
              ? 'Your admin session expired — please sign in again.'
              : error.detail || error.message || 'Failed to load deliveries.'}
          </p>
          <button
            type="button"
            onClick={refetch}
            className="text-sm border border-fa-border-default rounded px-3 py-1"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <p className="text-fa-text-secondary">
          No leads match these filters.{' '}
          <button type="button" onClick={() => setSearchParams(new URLSearchParams())} className="underline">
            Clear filters
          </button>
        </p>
      )}

      {/* Table */}
      {!error && items.length > 0 && (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left border-b border-fa-border-default text-fa-text-secondary">
              <th className="py-2 pr-4">Contractor</th>
              <th className="py-2 pr-4">Grade</th>
              <th className="py-2 pr-4">Trade</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Delivered</th>
              <th className="py-2 pr-4">Property</th>
              <th className="py-2 pr-4">Reason</th>
            </tr>
          </thead>
          <tbody>
            {items.map((d) => (
              <tr key={d.delivery_id} className="border-b border-fa-border-default">
                <td className="py-2 pr-4">
                  <button
                    type="button"
                    onClick={() => setFilter('account_id', d.account_id)}
                    className="underline text-left"
                    title="Filter to this contractor"
                  >
                    {d.company_name || d.account_id}
                  </button>
                </td>
                <td className="py-2 pr-4">{d.grade}</td>
                <td className="py-2 pr-4">{d.vertical}</td>
                <td className="py-2 pr-4">
                  {d.status === 'rejected' ? 'Rejected' : 'Delivered'}
                </td>
                <td className="py-2 pr-4">{fmtDate(d.delivered_at)}</td>
                <td className="py-2 pr-4">{d.property_id}</td>
                <td className="py-2 pr-4 text-fa-text-secondary">{d.rejection_reason || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Pager */}
      {!error && total > 0 && (
        <div className="flex items-center gap-3 mt-4 text-sm">
          <span className="text-fa-text-secondary">
            {rangeStart}–{rangeEnd} of {total}
          </span>
          <button
            type="button"
            onClick={() => setFilter('page', String(page - 1))}
            disabled={page <= 1}
            className="border border-fa-border-default rounded px-3 py-1 disabled:opacity-40"
          >
            Prev
          </button>
          <button
            type="button"
            onClick={() => setFilter('page', String(page + 1))}
            disabled={rangeEnd >= total}
            className="border border-fa-border-default rounded px-3 py-1 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

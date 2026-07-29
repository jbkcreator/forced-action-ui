import { useEffect, useState } from 'react';
import { fetchThroughQueue } from '../../api/admin';

const STATUS_COLOR = {
  pending: '#fbbf24',
  approved: '#34d399',
  partial: '#fbbf24',
  rejected: '#f87171',
  expired: '#94a3b8',
};

function StatusBadge({ status }) {
  return (
    <span
      className="text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
      style={{ color: STATUS_COLOR[status] || '#94a3b8', background: 'rgba(255,255,255,0.05)' }}
    >
      {status}
    </span>
  );
}

function BatchRow({ batch }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-fa-border-default last:border-b-0">
      <div className="min-w-0">
        <div className="text-sm text-fa-text-primary truncate">
          Batch <code className="text-fa-text-muted">{batch.batch_id.slice(0, 8)}</code>
        </div>
        <div className="text-xs text-fa-text-muted">
          {batch.item_count} item{batch.item_count === 1 ? '' : 's'}
          {batch.rejected_count > 0 && ` · ${batch.rejected_count} exception-rejected`}
          {batch.decided_by && ` · decided by ${batch.decided_by}`}
        </div>
      </div>
      <div className="text-right shrink-0 ml-4">
        <StatusBadge status={batch.status} />
        <div className="text-xs text-fa-text-muted mt-1">
          {new Date(batch.decided_at || batch.created_at).toLocaleString()}
        </div>
      </div>
    </div>
  );
}

function StandingOrderRow({ order }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-fa-border-default last:border-b-0">
      <div className="min-w-0">
        <div className="text-sm text-fa-text-primary truncate">{order.rule_text}</div>
        <div className="text-xs text-fa-text-muted">
          Cell: {order.cell_id}
          {order.created_by && ` · ratified by ${order.created_by}`}
        </div>
      </div>
      <div className="text-right shrink-0 ml-4">
        <span
          className="text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
          style={{
            color: order.active ? '#34d399' : '#fbbf24',
            background: 'rgba(255,255,255,0.05)',
          }}
        >
          {order.active ? 'active' : 'awaiting decision'}
        </span>
        <div className="text-xs text-fa-text-muted mt-1">{new Date(order.created_at).toLocaleString()}</div>
      </div>
    </div>
  );
}

function Section({ title, note, children, isEmpty }) {
  return (
    <section className="mb-6">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-fa-text-muted px-4 py-2">{title}</h2>
      {isEmpty ? <div className="px-4 py-3 text-sm text-fa-text-muted">Nothing here</div> : children}
      {note && <p className="px-4 pt-2 text-xs text-fa-text-muted">{note}</p>}
    </section>
  );
}

export default function ThroughQueueDashboard({ token }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setError(null);
    const controller = new AbortController();
    fetchThroughQueue(token, { signal: controller.signal })
      .then(setData)
      .catch((e) => { if (e.name !== 'AbortError') setError(e.detail || e.message); });
    return () => controller.abort();
  }, [token]);

  if (error) return <div className="px-4 py-3 text-sm text-red-400">{error}</div>;
  if (!data) return <div className="px-4 py-6 text-sm text-fa-text-muted">Loading…</div>;

  return (
    <div>
      <p className="px-4 pb-4 text-xs text-fa-text-muted">
        Read-only — every approve, exception-reject, ratify, and decline decision happens in Slack.
        This page exists to see what's pending, not to act on it.
      </p>
      <Section title="Draft Batches" isEmpty={data.batches.length === 0}>
        {data.batches.map((b) => <BatchRow key={b.batch_id} batch={b} />)}
      </Section>
      <Section title="Standing Orders" isEmpty={data.standing_orders.length === 0}>
        {data.standing_orders.map((o) => <StandingOrderRow key={o.id} order={o} />)}
      </Section>
    </div>
  );
}

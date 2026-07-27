import { useEffect, useState } from 'react';
import { fetchActionQueue } from '../../api/admin';

// Severity colors mirror LifecycleIncidentsDashboard's SEV_COLORS (the repo's
// existing sanctioned severity palette — no semantic --fa-* token exists).
const SEVERITY_COLOR = {
  red: '#f87171',
  yellow: '#fbbf24',
  info: '#94a3b8',
};

function SeverityDot({ severity }) {
  if (!severity) return null;
  return (
    <span
      role="img"
      aria-label={`severity: ${severity}`}
      className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
      style={{ backgroundColor: SEVERITY_COLOR[severity] || SEVERITY_COLOR.info }}
    />
  );
}

function ActionRow({ row }) {
  const body = (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-fa-border-default">
      <SeverityDot severity={row.severity} />
      <div className="min-w-0">
        <div className="text-sm text-fa-text-primary truncate">{row.title}</div>
        {row.subtitle && <div className="text-xs text-fa-text-muted truncate">{row.subtitle}</div>}
      </div>
    </div>
  );
  return row.action_url
    ? <a href={row.action_url} className="block hover:bg-fa-bg-card-hover">{body}</a>
    : body;
}

function Lane({ title, rows }) {
  return (
    <section className="mb-6">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-fa-text-muted px-4 py-2">{title}</h2>
      {rows.length === 0
        ? <div className="px-4 py-3 text-sm text-fa-text-muted">✓ nothing pending</div>
        : rows.map((row) => <ActionRow key={`${row.source}-${row.id}`} row={row} />)}
    </section>
  );
}

export default function ActionQueueDashboard({ token, lane, category }) {
  const [queue, setQueue] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setError(null);
    fetchActionQueue(token).then(setQueue).catch((e) => setError(e.message));
  }, [token]);

  if (error) return <div className="px-4 py-3 text-sm text-red-400">{error}</div>;
  if (!queue) return null;

  const matchesCategory = (row) => !category || row.category === category;
  const approvals = queue.approvals.filter(matchesCategory);
  const failures = queue.failures.filter(matchesCategory);

  const showApprovals = !lane || lane === 'approvals';
  const showFailures = !lane || lane === 'failures';

  const isAllClear =
    (!showApprovals || approvals.length === 0) && (!showFailures || failures.length === 0);
  if (isAllClear) return <div className="px-4 py-6 text-sm text-fa-text-muted">✓ All clear</div>;

  return (
    <div>
      {showApprovals && <Lane title="Approvals" rows={approvals} />}
      {showFailures && <Lane title="Failures" rows={failures} />}
    </div>
  );
}

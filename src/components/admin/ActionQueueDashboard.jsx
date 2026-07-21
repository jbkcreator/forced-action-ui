import { useEffect, useState } from 'react';
import { fetchActionQueue } from '../../api/admin';

function ActionRow({ row }) {
  const content = (
    <>
      {row.severity && <span>{row.severity}</span>}
      <div>{row.title}</div>
      {row.subtitle && <div>{row.subtitle}</div>}
    </>
  );
  return row.action_url
    ? <a href={row.action_url}>{content}</a>
    : <div>{content}</div>;
}

export default function ActionQueueDashboard({ token }) {
  const [queue, setQueue] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setError(null);
    fetchActionQueue(token).then(setQueue).catch((e) => setError(e.message));
  }, [token]);

  if (error) return <div>{error}</div>;
  if (!queue) return null;

  const isAllClear = queue.approvals.length === 0 && queue.failures.length === 0;
  if (isAllClear) return <div>✓ All clear</div>;

  return (
    <div>
      <section>
        <h2>Approvals</h2>
        {queue.approvals.length === 0
          ? <div>✓ Nothing pending</div>
          : queue.approvals.map((row) => <ActionRow key={`${row.source}-${row.id}`} row={row} />)}
      </section>
      <section>
        <h2>Failures</h2>
        {queue.failures.length === 0
          ? <div>✓ Nothing pending</div>
          : queue.failures.map((row) => <ActionRow key={`${row.source}-${row.id}`} row={row} />)}
      </section>
    </div>
  );
}

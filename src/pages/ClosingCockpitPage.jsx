import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchClosingCockpit } from '../api/admin';
import { useAdminContext } from '../components/admin/adminContext';

function Card({ title, children }) {
  return (
    <section className="rounded-xl p-4 bg-fa-bg-card border border-fa-border-default">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-fa-text-muted mb-3">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <div className="text-xs text-fa-text-muted">{label}</div>
      <div className="text-sm text-fa-text-primary">{value ?? '—'}</div>
    </div>
  );
}

function CallRow({ label, outcome, when, extra }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 border-b border-fa-border-default last:border-b-0">
      <div>
        <div className="text-sm text-fa-text-primary">{label}</div>
        {extra && <div className="text-xs text-fa-text-muted">{extra}</div>}
      </div>
      <div className="text-right">
        <div className="text-xs text-fa-text-primary">{outcome ?? '—'}</div>
        <div className="text-xs text-fa-text-muted">{when ? new Date(when).toLocaleString() : '—'}</div>
      </div>
    </div>
  );
}

export default function ClosingCockpitPage() {
  const { threadId } = useParams();
  const { token } = useAdminContext() || {};
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setError(null);
    setData(null);
    if (!token || !threadId) return undefined;
    const controller = new AbortController();
    fetchClosingCockpit(token, threadId, { signal: controller.signal })
      .then(setData)
      .catch((e) => { if (e.name !== 'AbortError') setError(e.detail || e.message); });
    return () => controller.abort();
  }, [token, threadId]);

  if (error) return <div className="p-6 text-sm text-red-400">{error}</div>;
  if (!data) return <div className="p-6 text-sm text-fa-text-muted">Loading…</div>;

  const brief = data.pre_call_brief;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-4">
      <div>
        <h1 className="text-lg font-bold text-fa-text-primary">
          {data.buyer_entity?.canonical_name || 'Prospect'}
        </h1>
        <p className="text-xs text-fa-text-muted">{data.opportunity_thread_id}</p>
      </div>

      <Card title="Prospect">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Field label="Entity type" value={data.buyer_entity?.entity_type} />
          <Field label="Purchases" value={data.buyer_entity?.total_purchase_count} />
          <Field label="Total cash volume" value={data.buyer_entity?.total_cash_volume} />
          <Field label="Whale" value={data.buyer_entity?.is_whale ? 'Yes' : 'No'} />
          <Field label="Email" value={data.contact?.email} />
          <Field label="Phone" value={data.contact?.phone} />
        </div>
      </Card>

      {brief ? (
        <Card title="Pre-Call Brief">
          <div className="space-y-3">
            <Field label="Suggested opening" value={brief.suggested_opening} />
            <Field label="Call objective" value={brief.call_objective} />
            <Field label="Recommended offer" value={brief.recommended_offer} />
            <Field label="Current reply intent" value={brief.current_reply_intent} />
            {brief.likely_objections?.length > 0 && (
              <div>
                <div className="text-xs text-fa-text-muted mb-1">Likely objections</div>
                <ul className="text-sm text-fa-text-primary space-y-1">
                  {brief.likely_objections.map((o, i) => (
                    <li key={i}>· {o.objection}{o.response_strategy ? ` — ${o.response_strategy}` : ''}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex gap-4">
              {brief.relevant_links?.booking_link && (
                <a href={brief.relevant_links.booking_link} target="_blank" rel="noreferrer"
                   className="text-sm text-fa-text-primary underline">Booking link</a>
              )}
              {brief.relevant_links?.payment_link && (
                <a href={brief.relevant_links.payment_link} target="_blank" rel="noreferrer"
                   className="text-sm text-fa-text-primary underline">Payment link</a>
              )}
            </div>
          </div>
        </Card>
      ) : (
        <Card title="Pre-Call Brief">
          <p className="text-sm text-fa-text-muted">No pre-call brief on file for this thread yet.</p>
        </Card>
      )}

      <Card title="Call History">
        {data.call_history_match === 'none' ? (
          <p className="text-sm text-fa-text-muted">
            No call history match found — no phone number on file, or no calls recorded against it.
          </p>
        ) : (data.synthflow_calls?.length || 0) + (data.closer_calls?.length || 0) === 0 ? (
          <p className="text-sm text-fa-text-muted">Phone matched, but no prior calls found.</p>
        ) : (
          <div>
            {data.synthflow_calls?.map((c) => (
              <CallRow key={`sf-${c.id}`} label="Synthflow call" outcome={c.outcome} when={c.call_date}
                       extra={c.vertical} />
            ))}
            {data.closer_calls?.map((c) => (
              <CallRow key={`cc-${c.id}`} label={c.closer_name ? `Closer call — ${c.closer_name}` : 'Closer call'}
                       outcome={c.call_outcome} when={c.started_at} extra={c.sentiment} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

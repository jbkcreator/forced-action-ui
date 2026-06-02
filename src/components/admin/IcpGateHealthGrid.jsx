/**
 * IcpGateHealthGrid — displays the 4-week kill-switch gate scores for one ICP channel.
 *
 * Shows each gate metric as: name | value | threshold | 🟢🟡🔴 chip or N/A.
 * "unknown" color maps to "N/A / Insufficient data" — never shows an error.
 */

const COLOR_CHIP = {
  green:   'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  yellow:  'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  red:     'bg-red-500/20 text-red-400 border-red-500/30',
  unknown: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

const COLOR_DOT = {
  green:   '🟢',
  yellow:  '🟡',
  red:     '🔴',
  unknown: '⚪',
};

const METRIC_LABELS = {
  first_payment_rate:   'First-payment rate',
  saved_card_rate:      'Saved-card rate',
  payer_retention_30d:  '30-day retention',
  sms_reply_rate:       'SMS reply rate',
  contractor_mrr_usd:   'Contractor MRR ($)',
};

export default function IcpGateHealthGrid({ gates = {} }) {
  if (!gates || Object.keys(gates).length === 0) {
    return (
      <p className="text-sm text-fa-text-muted py-2">No gate data available.</p>
    );
  }

  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="text-left text-fa-text-muted text-xs border-b border-fa-border-default">
          <th className="pb-2 pr-4 font-medium">Metric</th>
          <th className="pb-2 pr-4 font-medium text-right">Value</th>
          <th className="pb-2 pr-4 font-medium text-right">Threshold</th>
          <th className="pb-2 font-medium text-right">Status</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(gates).map(([metric, info]) => {
          const color = info.color || 'unknown';
          const value = info.value;
          const threshold = info.threshold;
          const isMrr = metric === 'contractor_mrr_usd';

          return (
            <tr key={metric} className="border-b border-fa-border-default/30">
              <td className="py-2 pr-4 text-fa-text-secondary">
                {METRIC_LABELS[metric] || metric}
                {info.note && (
                  <span className="ml-2 text-xs text-fa-text-muted italic">
                    ({info.note})
                  </span>
                )}
              </td>
              <td className="py-2 pr-4 text-right font-mono text-fa-text-primary">
                {value != null
                  ? isMrr
                    ? `$${Number(value).toLocaleString()}`
                    : `${Number(value).toFixed(1)}%`
                  : <span className="text-fa-text-muted">N/A</span>
                }
              </td>
              <td className="py-2 pr-4 text-right text-fa-text-muted">
                {threshold != null
                  ? isMrr
                    ? `$${Number(threshold).toLocaleString()}`
                    : `${threshold}%`
                  : '—'}
              </td>
              <td className="py-2 text-right">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold ${COLOR_CHIP[color]}`}>
                  {COLOR_DOT[color]}
                  {color === 'unknown' ? 'N/A' : color.charAt(0).toUpperCase() + color.slice(1)}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

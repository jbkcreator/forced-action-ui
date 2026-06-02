/**
 * IcpChannelSection — admin tab for managing ICP channels (fa066).
 *
 * Shows: channel cards with gate health, actions, and 7-day metric trends.
 * Route: /admin/icp
 *
 * ICP vs vertical: ICP = customer group. Vertical = product category.
 * All scoping uses icp_channel_key, not verticals (they can overlap between ICPs).
 */

import { useState, useEffect, useCallback } from 'react';
import { useAdminContext } from '../adminContext.js';
import IcpChannelCard from '../IcpChannelCard.jsx';
import IcpGateHealthGrid from '../IcpGateHealthGrid.jsx';
import {
  fetchIcpChannels,
  activateIcpChannel,
  pauseIcpChannel,
  killIcpChannel,
  fetchIcpMetrics,
} from '../../../api/icpChannels.js';

export default function IcpChannelSection() {
  const { token } = useAdminContext();
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [selectedKey, setSelectedKey] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchIcpChannels(token);
      setChannels(data.channels || []);
    } catch (e) {
      setError(e?.message || e?.detail || 'Failed to load ICP channels');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const showSuccess = msg => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const handleActivate = async (key, opts) => {
    setLoading(true);
    try {
      const res = await activateIcpChannel(token, key, opts);
      showSuccess(`Channel '${key}' activated (${opts.force ? 'FORCE' : 'normal'}).`);
      await load();
    } catch (e) {
      setError(e?.message || e?.detail || 'Activation failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async key => {
    setLoading(true);
    try {
      await pauseIcpChannel(token, key);
      showSuccess(`Channel '${key}' paused.`);
      await load();
    } catch (e) {
      setError(e?.message || e?.detail || 'Pause failed');
    } finally {
      setLoading(false);
    }
  };

  const handleKill = async (key, reason) => {
    setLoading(true);
    try {
      await killIcpChannel(token, key, reason);
      showSuccess(`Channel '${key}' killed.`);
      await load();
    } catch (e) {
      setError(e?.message || e?.detail || 'Kill failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMetrics = async key => {
    if (selectedKey === key) { setSelectedKey(null); setMetrics(null); return; }
    setSelectedKey(key);
    setMetricsLoading(true);
    try {
      const data = await fetchIcpMetrics(token, key, 30);
      setMetrics(data);
    } catch (e) {
      setMetrics(null);
    } finally {
      setMetricsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-fa-text-primary">ICP Channel Management</h2>
          <p className="text-sm text-fa-text-muted mt-0.5">
            ICP = customer group. Vertical = product category. These are separate axes.
            All attribution and gating uses <code className="bg-fa-bg-card px-1 rounded text-xs">icp_channel_key</code>.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="px-3 py-1.5 text-sm font-medium text-fa-text-secondary hover:text-fa-text-primary border border-fa-border-default rounded-lg hover:bg-fa-bg-card transition-colors disabled:opacity-50"
        >
          {loading ? 'Loading…' : '↻ Refresh'}
        </button>
      </div>

      {error && (
        <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded px-4 py-2">{error}</p>
      )}
      {successMsg && (
        <p className="text-emerald-400 text-sm bg-emerald-900/20 border border-emerald-800 rounded px-4 py-2">{successMsg}</p>
      )}

      {/* Channel cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {channels.map(ch => (
          <div key={ch.key}>
            <IcpChannelCard
              channel={ch}
              onActivate={handleActivate}
              onPause={handlePause}
              onKill={handleKill}
              loading={loading}
            />
            {/* Metrics toggle */}
            <button
              type="button"
              onClick={() => handleSelectMetrics(ch.key)}
              className="mt-2 text-xs text-fa-primary hover:underline"
            >
              {selectedKey === ch.key ? 'Hide 30-day metrics' : 'View 30-day metrics'}
            </button>

            {selectedKey === ch.key && (
              <div className="mt-2 bg-fa-bg-card border border-fa-border-default rounded-xl p-4">
                {metricsLoading ? (
                  <p className="text-sm text-fa-text-muted">Loading metrics…</p>
                ) : metrics?.trend?.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="text-left text-fa-text-muted border-b border-fa-border-default">
                          <th className="pb-1 pr-3">Date</th>
                          <th className="pb-1 pr-3 text-right">Signups</th>
                          <th className="pb-1 pr-3 text-right">Payers</th>
                          <th className="pb-1 pr-3 text-right">Active</th>
                          <th className="pb-1 pr-3 text-right">MRR</th>
                          <th className="pb-1 pr-3 text-right">Pay%</th>
                          <th className="pb-1 text-right">Reply%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {metrics.trend.map(row => (
                          <tr key={row.date} className="border-b border-fa-border-default/20">
                            <td className="py-1 pr-3 text-fa-text-muted">{row.date}</td>
                            <td className="py-1 pr-3 text-right">{row.raw.signup_count}</td>
                            <td className="py-1 pr-3 text-right">{row.raw.payer_count}</td>
                            <td className="py-1 pr-3 text-right">{row.raw.active_subscriber_count}</td>
                            <td className="py-1 pr-3 text-right">${row.raw.mrr_usd?.toLocaleString() ?? 0}</td>
                            <td className="py-1 pr-3 text-right">
                              {row.rates.first_payment_rate != null ? `${row.rates.first_payment_rate}%` : <span className="text-fa-text-muted">N/A</span>}
                            </td>
                            <td className="py-1 text-right">
                              {row.rates.sms_reply_rate != null ? `${row.rates.sms_reply_rate}%` : <span className="text-fa-text-muted">N/A</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-fa-text-muted">No metric data yet — metrics ingested daily at 07:15 UTC.</p>
                )}
              </div>
            )}
          </div>
        ))}
        {!loading && channels.length === 0 && (
          <p className="text-fa-text-muted text-sm col-span-2">No ICP channels found.</p>
        )}
      </div>
    </div>
  );
}

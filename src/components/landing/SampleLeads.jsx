import { useEffect, useState } from 'react';
import { useLanding } from './LandingContext';
import { fetchSampleLeads } from '../../api/landing';
import { fetchZipActivity } from '../../api/phase2b';
import Icon from '../ui/Icon';

function tierClass(t) {
  return t === 'ultra_platinum' || t === 'platinum' ? 'score-platinum' : t === 'gold' ? 'score-gold' : 'score-silver';
}

function tierLabel(t) {
  return t ? t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Scored';
}

function tierCardClass(t) {
  return t === 'ultra_platinum' || t === 'platinum' ? 'sample-lead-platinum' : t === 'gold' ? 'sample-lead-gold' : 'sample-lead-silver';
}

export default function SampleLeads({ zip }) {
  const { selectedVertical, countyId } = useLanding();
  const [leads, setLeads] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeViewers, setActiveViewers] = useState(0);

  useEffect(() => {
    setLoading(true);
    fetchSampleLeads(zip, selectedVertical, countyId)
      .then(data => setLeads(data.leads || []))
      .catch(() => setLeads(null))
      .finally(() => setLoading(false));
  }, [zip, selectedVertical, countyId]);

  // ── FOMO: live viewer count for this ZIP ────────────────────────────────
  // Poll every 20 s while the component is mounted. Degrades silently if
  // the endpoint or Redis is unavailable (count stays at 0).
  useEffect(() => {
    let cancelled = false;
    const load = () => {
      fetchZipActivity(zip, selectedVertical)
        .then(data => { if (!cancelled) setActiveViewers(data?.active_viewers ?? 0); })
        .catch(() => {});
    };
    load();
    const iv = setInterval(load, 20_000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [zip, selectedVertical]);

  return (
    <section className="max-w-6xl mx-auto px-6 pb-6">
      <div className="max-w-xl mx-auto">
        <h3 className="text-lg font-bold mb-1 text-center">Sample Leads from ZIP {zip}</h3>
        <p className="text-slate-400 text-sm text-center mb-2">Real scored properties — phone numbers unlocked when you subscribe</p>

        {activeViewers > 0 && (
          <p className="text-yellow-400 text-xs text-center mb-4 flex items-center justify-center gap-1">
            <Icon name="bolt" size={12} className="text-yellow-400" />
            <span>
              {activeViewers} contractor{activeViewers === 1 ? '' : 's'} currently viewing ZIP {zip}
            </span>
          </p>
        )}

        {loading && <p className="text-slate-400 text-sm text-center">Loading sample leads...</p>}

        {!loading && (!leads || leads.length === 0) && (
          <p className="text-slate-400 text-sm text-center">No scored leads found for this ZIP yet — new data arrives nightly.</p>
        )}

        {!loading && leads && leads.length > 0 && (
          <div className="space-y-3">
            {leads.map((l, i) => (
              <div key={i} className={`sample-lead-card ${tierCardClass(l.lead_tier)}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm truncate">{l.address}</p>
                    <p className="text-slate-400 text-xs mt-0.5">
                      {l.city}, FL {l.zip}
                      {l.year_built ? ` · Built ${l.year_built}` : ''}
                      {l.sq_ft ? ` · ${l.sq_ft.toLocaleString()} sqft` : ''}
                    </p>
                    {l.latest_incident && (
                      <p className="text-yellow-400 text-xs mt-1 flex items-center gap-1">
                        <Icon name="bolt" size={12} className="text-yellow-400" /> {l.latest_incident.replace(/_/g, ' ')}
                        {l.latest_incident_date ? ` — ${l.latest_incident_date.slice(0, 10)}` : ''}
                      </p>
                    )}
                    {l.distress_types?.length > 0 && (
                      <p className="text-slate-500 text-xs mt-1">{l.distress_types.join(' · ')}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`score-badge ${tierClass(l.lead_tier)}`}>{tierLabel(l.lead_tier)}</span>
                    <span className="text-xs text-slate-400">
                      Score: <span className="text-white font-medium">
                        {l.vertical_score != null ? Math.round(l.vertical_score) : l.cds_score != null ? Math.round(l.cds_score) : '—'}
                      </span>
                    </span>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
                  <span className="text-xs text-slate-500 flex items-center gap-1"><Icon name="phone" size={12} className="text-slate-500" /> Phone: <span className="font-mono text-slate-400">{l.phone}</span></span>
                  <span className="text-xs text-yellow-400 font-medium">Unlock with subscription →</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

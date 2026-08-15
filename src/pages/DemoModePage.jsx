/**
 * Live Demo Mode (3g + 3h + 3i).
 *
 * Dedicated full-screen page for the sales closer's demo calls.
 * Route: /dashboard/:feedUuid/demo
 *
 * Flow:
 *   1. Closer picks county, types prospect's ZIP → fetchZipReveal + prepareCall fire in parallel
 *   2. Featured lead appears at top, address blurred
 *   3. Closer clicks "Reveal Address Live" → address un-blurs, revealed_at stored in DB
 *   4. PII toggle (default OFF = screen-share safe) shows/hides owner name/phone/email
 *
 * The prospect never touches this screen — they watch via screen share.
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { DISTRESS_TAG_COLORS } from '../config/constants.js';
import { fetchZipReveal, prepareCall, revealLead } from '../api/demo.js';

const COUNTIES = [
  { value: 'hillsborough', label: 'Hillsborough' },
  { value: 'pinellas',     label: 'Pinellas' },
];

function tierColor(tier) {
  if (tier === 'Ultra Platinum') return 'text-purple-400';
  if (tier === 'Platinum')       return 'text-yellow-400';
  if (tier === 'Gold')           return 'text-amber-400';
  return 'text-fa-text-muted';
}

function DistressTag({ type }) {
  const c = DISTRESS_TAG_COLORS[type] || { bg: 'rgba(255,255,255,0.06)', text: '#cbd5e1', border: 'rgba(255,255,255,0.12)' };
  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full border font-medium"
      style={{ background: c.bg, color: c.text, borderColor: c.border }}
    >
      {type.replace(/_/g, ' ')}
    </span>
  );
}

function daysAgo(isoDate) {
  if (!isoDate) return null;
  const diff = Math.floor((Date.now() - new Date(isoDate).getTime()) / 86400000);
  return diff === 0 ? 'today' : diff === 1 ? '1 day ago' : `${diff} days ago`;
}

export default function DemoModePage() {
  const { feedUuid } = useParams();

  const [zipInput,   setZipInput]   = useState('');
  const [countyId,   setCountyId]   = useState('hillsborough');
  const [vertical,   setVertical]   = useState('roofing');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');

  const [revealData,   setRevealData]   = useState(null);   // zip-reveal list
  const [prepData,     setPrepData]     = useState(null);   // featured lead (masked)
  const [revealedLead, setRevealedLead] = useState(null);   // featured lead (full)
  const [revealing,    setRevealing]    = useState(false);

  const [piiVisible,   setPiiVisible]   = useState(false);  // default OFF = safe for screen share

  // Auto-reveal if returning to an already-revealed session (same ZIP within 2h idempotency window)
  useEffect(() => {
    if (prepData?.revealed && !revealedLead && !revealing) {
      handleReveal();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prepData?.prep_id]);

  async function handleSearch(e) {
    e.preventDefault();
    if (!/^\d{5}$/.test(zipInput)) {
      setError('Enter a valid 5-digit ZIP code');
      return;
    }
    setError('');
    setLoading(true);
    setRevealData(null);
    setPrepData(null);
    setRevealedLead(null);

    try {
      const [zipResult, prepResult] = await Promise.all([
        fetchZipReveal(feedUuid, { zipCode: zipInput, countyId }),
        prepareCall(feedUuid, { zipCode: zipInput, vertical, countyId }),
      ]);
      setRevealData(zipResult);
      setPrepData(prepResult);
    } catch (err) {
      setError(err?.detail || 'Failed to load data. Check the ZIP and try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleReveal() {
    if (!prepData || revealing) return;
    setRevealing(true);
    try {
      const data = await revealLead(feedUuid, prepData.prep_id);
      setRevealedLead(data);
    } catch {
      setError('Failed to reveal lead. Please try again.');
    } finally {
      setRevealing(false);
    }
  }

  const featuredAddress = revealedLead ? revealedLead.address : prepData?.masked_address;
  const featuredTier    = revealedLead?.lead_tier || prepData?.lead_tier;
  const featuredTypes   = revealedLead?.distress_types || prepData?.distress_types || [];
  const isRevealed      = Boolean(revealedLead);

  return (
    <div className="min-h-screen bg-fa-bg-base text-fa-text-primary flex flex-col">

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="bg-fa-bg-card border-b border-fa-border-default px-6 py-3 flex flex-wrap items-center gap-4">

        {/* Brand — looks identical to the real platform */}
        <div className="flex items-center gap-2 mr-2">
          <div className="w-7 h-7 bg-fa-primary rounded-md flex items-center justify-center shrink-0">
            <span className="text-fa-bg-base font-extrabold text-xs leading-none">FA</span>
          </div>
          <span className="font-extrabold text-fa-text-primary">
            Forced <span className="text-fa-primary">Action</span>
          </span>
        </div>

        {/* County selector */}
        <select
          value={countyId}
          onChange={e => { setCountyId(e.target.value); setRevealData(null); setPrepData(null); setRevealedLead(null); }}
          className="bg-fa-bg-base border border-fa-border-default rounded-lg px-3 py-1.5 text-sm text-fa-text-primary focus:outline-none focus:border-fa-primary"
        >
          {COUNTIES.map(c => (
            <option key={c.value} value={c.value}>{c.label} County</option>
          ))}
        </select>

        {/* Vertical selector */}
        <select
          value={vertical}
          onChange={e => setVertical(e.target.value)}
          className="bg-fa-bg-base border border-fa-border-default rounded-lg px-3 py-1.5 text-sm text-fa-text-primary focus:outline-none focus:border-fa-primary"
        >
          {['roofing', 'fix_flip', 'wholesalers', 'public_adjusters', 'attorneys'].map(v => (
            <option key={v} value={v}>{v.replace(/_/g, ' ')}</option>
          ))}
        </select>

        {/* Owner details toggle — eye icon only, no text visible to prospect */}
        <button
          type="button"
          onClick={() => setPiiVisible(v => !v)}
          title={piiVisible ? 'Hide owner details' : 'Show owner details'}
          className={`ml-auto p-2 rounded-lg border transition-colors ${
            piiVisible
              ? 'border-fa-primary/50 text-fa-primary bg-fa-primary/10'
              : 'border-fa-border-default text-fa-text-muted bg-transparent hover:text-fa-text-primary'
          }`}
        >
          {piiVisible ? (
            /* eye-open */
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          ) : (
            /* eye-slash */
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
              <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
          )}
        </button>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-6 space-y-6">

        {/* ── ZIP Search ──────────────────────────────────────── */}
        <form onSubmit={handleSearch} className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-fa-text-muted mb-1.5">
              ZIP Code
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={5}
              placeholder="e.g. 33601"
              value={zipInput}
              onChange={e => setZipInput(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-fa-bg-card border border-fa-border-default rounded-lg px-4 py-2.5 text-fa-text-primary text-lg font-mono tracking-widest focus:outline-none focus:border-fa-primary"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-fa-primary text-fa-bg-base font-bold px-6 py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity whitespace-nowrap"
          >
            {loading ? 'Loading…' : 'Search ZIP'}
          </button>
        </form>

        {error && (
          <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded px-4 py-2">{error}</p>
        )}

        {/* ── Featured Lead Card ──────────────────────────────── */}
        {prepData && (
          <div className="bg-fa-bg-card border border-fa-primary/40 rounded-2xl p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-xs font-bold text-fa-primary uppercase tracking-wider mb-1">
                  ⚡ Featured Lead {isRevealed && '— Revealed'}
                  {prepData.county_fallback && !isRevealed && (
                    <span className="ml-2 text-amber-400 normal-case font-normal">
                      (county-wide — no Gold+ lead in {prepData.zip_code})
                    </span>
                  )}
                </p>
                {featuredTier && (
                  <span className={`text-sm font-semibold ${tierColor(featuredTier)}`}>{featuredTier}</span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {featuredTypes.map(t => <DistressTag key={t} type={t} />)}
              </div>
            </div>

            {/* Address — blurred until revealed */}
            <p
              className="text-2xl font-bold text-fa-text-primary mb-1 transition-all duration-300"
              style={isRevealed ? {} : { filter: 'blur(6px)', userSelect: 'none' }}
              aria-hidden={!isRevealed}
            >
              {featuredAddress || '—'}
            </p>
            <p className="text-fa-text-muted text-sm mb-4">
              {isRevealed
                ? `${revealedLead.city ? revealedLead.city + ', ' : ''}${revealedLead.state || 'FL'} ${revealedLead.zip || prepData?.zip_code}`
                : `FL ${prepData?.zip_code}`
              }
            </p>

            {/* PII — owner contact, only after reveal AND piiVisible */}
            {isRevealed && piiVisible && (revealedLead.owner_name || revealedLead.phone || revealedLead.email) && (
              <div className="bg-fa-bg-base rounded-xl px-4 py-3 mb-4 space-y-1 text-sm">
                {revealedLead.owner_name && (
                  <p><span className="text-fa-text-muted">Owner:</span> <span className="text-fa-text-primary font-medium">{revealedLead.owner_name}</span></p>
                )}
                {revealedLead.phone && (
                  <p><span className="text-fa-text-muted">Phone:</span> <span className="text-fa-text-primary font-medium">{revealedLead.phone}</span></p>
                )}
                {revealedLead.email && (
                  <p><span className="text-fa-text-muted">Email:</span> <span className="text-fa-text-primary font-medium">{revealedLead.email}</span></p>
                )}
              </div>
            )}

            {/* Reveal button */}
            {!isRevealed && (
              <button
                type="button"
                onClick={handleReveal}
                disabled={revealing}
                className="w-full bg-fa-primary text-fa-bg-base font-bold py-3 rounded-xl text-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {revealing ? 'Revealing…' : '🔴 Reveal Address Live'}
              </button>
            )}
          </div>
        )}

        {/* ── ZIP Reveal List ─────────────────────────────────── */}
        {revealData && (
          <div>
            <p className="text-sm text-fa-text-muted mb-3">
              {revealData.total} properties scored in {revealData.zip_code} in the past 7 days
            </p>

            {revealData.total === 0 ? (
              <div className="bg-fa-bg-card border border-fa-border-default rounded-2xl p-8 text-center text-fa-text-muted">
                No properties scored in {zipInput} in the past 7 days.
              </div>
            ) : (
              <div className="space-y-2">
                {revealData.leads.map((lead, i) => (
                  <div
                    key={lead.property_id}
                    className={`bg-fa-bg-card border rounded-xl px-4 py-3 flex items-center justify-between gap-4 ${
                      i === 0 ? 'border-fa-primary/30' : 'border-fa-border-default'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-fa-text-primary text-sm truncate">
                        {lead.address_masked}
                        <span className="text-fa-text-muted ml-2 font-sans text-xs">{lead.city}, {lead.state}</span>
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(lead.distress_types || []).map(t => <DistressTag key={t} type={t} />)}
                      </div>
                    </div>
                    <div className="text-right shrink-0 space-y-0.5">
                      {lead.lead_tier && (
                        <p className={`text-xs font-semibold ${tierColor(lead.lead_tier)}`}>{lead.lead_tier}</p>
                      )}
                      {lead.scored_at && (
                        <p className="text-xs text-fa-text-muted">{daysAgo(lead.scored_at)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

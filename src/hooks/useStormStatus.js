import { useMemo } from 'react';

/**
 * Derives storm pack state from the already-fetched feed data.
 *
 * Returns:
 *   hasStormLeads   — subscriber has an active storm bundle purchase with leads
 *   stormLeads      — array of those lead objects (from feed.bundle_leads)
 *   stormExpiresAt  — ISO string of the earliest storm bundle expiry (or null)
 *   hoursRemaining  — hours until the first storm bundle expires (or null)
 */
export default function useStormStatus(feedData) {
  return useMemo(() => {
    const bundleLeads = feedData?.bundle_leads || [];
    const stormLeads = bundleLeads.filter((l) => l.bundle_type === 'storm');

    if (stormLeads.length === 0) {
      return { hasStormLeads: false, stormLeads: [], stormExpiresAt: null, hoursRemaining: null };
    }

    // Pick the soonest expiry across all storm leads
    let soonestExpiry = null;
    let soonestHours = null;
    for (const l of stormLeads) {
      if (l.expires_at && (soonestExpiry === null || l.expires_at < soonestExpiry)) {
        soonestExpiry = l.expires_at;
        soonestHours = l.hours_remaining;
      }
    }

    return {
      hasStormLeads: true,
      stormLeads,
      stormExpiresAt: soonestExpiry,
      hoursRemaining: soonestHours,
    };
  }, [feedData?.bundle_leads]);
}

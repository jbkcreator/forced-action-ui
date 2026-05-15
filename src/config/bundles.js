const BUNDLE_META = {
  weekend: {
    key: 'weekend',
    label: 'Weekend Bundle',
    cardBlurb: '5 bonus leads, Friday-Sunday only',
    modalBlurb: '5 bonus leads in your chosen locked ZIP, available Friday through Sunday only.',
    priceCents: 1900,
    variantA: 1900,
    variantB: 2200,
    icon: 'bolt',
    leadIcon: '🌤️',
    accent: 'border-emerald-400/30 hover:border-emerald-400/60 hover:bg-emerald-400/5',
    leadAccent: 'border-emerald-400/40 bg-emerald-500/5',
    zipScoped: true,
    billing: 'one_time',
  },
  storm: {
    key: 'storm',
    label: 'Storm Bundle',
    cardBlurb: '10 storm-affected leads, 72h window',
    modalBlurb: '10 storm-affected property leads in your chosen locked ZIP, valid for 72 hours after alert activation.',
    priceCents: 3900,
    variantA: 3900,
    variantB: 4500,
    icon: 'droplet',
    leadIcon: '⛈️',
    accent: 'border-sky-400/30 hover:border-sky-400/60 hover:bg-sky-400/5',
    leadAccent: 'border-sky-400/40 bg-sky-500/5',
    zipScoped: true,
    billing: 'one_time',
  },
  zip_booster: {
    key: 'zip_booster',
    label: 'ZIP Booster',
    cardBlurb: '10 extra leads in your ZIP, 48h',
    modalBlurb: '10 extra leads in your chosen locked ZIP for the next 48 hours.',
    priceCents: 2900,
    variantA: 2900,
    variantB: 3400,
    icon: 'map-pin',
    leadIcon: '📍',
    accent: 'border-yellow-400/30 hover:border-yellow-400/60 hover:bg-yellow-400/5',
    leadAccent: 'border-yellow-400/40 bg-yellow-500/5',
    zipScoped: true,
    billing: 'one_time',
  },
  monthly_reload: {
    key: 'monthly_reload',
    label: 'Monthly Reload',
    cardBlurb: '30 credits, recurring monthly reload',
    modalBlurb: '30 credits every month - a recurring alternative to the wallet.',
    priceCents: 8900,
    variantA: 8900,
    variantB: 7900,
    icon: 'clock',
    leadIcon: '🔁',
    accent: 'border-purple-400/30 hover:border-purple-400/60 hover:bg-purple-400/5',
    leadAccent: 'border-purple-400/40 bg-purple-500/5',
    zipScoped: false,
    billing: 'recurring',
  },
};

export const BUNDLE_ORDER = ['weekend', 'storm', 'zip_booster', 'monthly_reload'];

export function getBundleMeta(bundleKey) {
  return BUNDLE_META[bundleKey] || null;
}

export function getBundlePriceCents(bundleKey, variant = 'a') {
  const meta = getBundleMeta(bundleKey);
  if (!meta) return null;
  return variant === 'b' ? meta.variantB : meta.variantA;
}

export function formatBundlePrice(bundleKey, variant = 'a') {
  const meta = getBundleMeta(bundleKey);
  const cents = getBundlePriceCents(bundleKey, variant);
  if (!meta || cents == null) return '';
  const base = `$${(cents / 100).toFixed(0)}`;
  return meta.billing === 'recurring' ? `${base}/mo` : base;
}

export function getBundleBillingCopy(bundleKey) {
  const meta = getBundleMeta(bundleKey);
  if (!meta) return '';
  return meta.billing === 'recurring'
    ? 'Recurring monthly billing, charged to your saved card.'
    : 'One-time purchase, charged to your saved card.';
}

export function getBundleActionLabel(bundleKey, variant = 'a') {
  const price = formatBundlePrice(bundleKey, variant);
  const meta = getBundleMeta(bundleKey);
  if (!meta) return '';
  return meta.billing === 'recurring' ? `Start for ${price}` : `Buy for ${price}`;
}

export function isWeekendBundleAvailable(now = new Date()) {
  const day = now.getUTCDay();
  return day === 5 || day === 6 || day === 0;
}

export function getBundleAvailability(bundleKey, { lockedZips = [], now = new Date(), stormStatus = 'unknown' } = {}) {
  const meta = getBundleMeta(bundleKey);
  if (!meta) return { disabled: true, reason: 'This bundle is not available right now.', hint: null };

  if (meta.zipScoped && lockedZips.length === 0) {
    return { disabled: true, reason: 'Requires a locked ZIP first.', hint: null };
  }

  if (bundleKey === 'weekend' && !isWeekendBundleAvailable(now)) {
    return { disabled: true, reason: 'Available Friday through Sunday.', hint: null };
  }

  if (bundleKey === 'storm' && stormStatus === 'inactive') {
    return { disabled: true, reason: 'Available when an NWS storm alert is active in your ZIP.', hint: null };
  }

  if (bundleKey === 'storm') {
    return {
      disabled: false,
      reason: null,
      hint: 'Checkout confirms whether an NWS storm alert is active in your selected ZIP.',
    };
  }

  return { disabled: false, reason: null, hint: null };
}

export function getBundleZipSummary(bundleKey, lockedZips = []) {
  const meta = getBundleMeta(bundleKey);
  if (!meta?.zipScoped) return 'No ZIP required';
  if (lockedZips.length === 0) return 'Requires a locked ZIP first';
  if (lockedZips.length === 1) return `Targets ZIP ${lockedZips[0]}`;
  return `Choose from ${lockedZips.length} locked ZIPs`;
}

export function getBundleCardMeta(bundleKeys = BUNDLE_ORDER) {
  return bundleKeys
    .map((bundleKey) => getBundleMeta(bundleKey))
    .filter(Boolean);
}

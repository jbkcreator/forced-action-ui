export const PRICES = {
  starter:   { founding: 600,  regular: 800,  future: 1100 },
  pro:       { founding: 1100, regular: 1500, future: 1900 },
  dominator: { founding: 2000, regular: 2800, future: 3500 },
};

export const TIER_ZIP_LIMITS = {
  starter: 1,
  pro: 3,
  dominator: 10,
};

export const TIER_FEATURES = {
  starter: [
    '1 ZIP territory',
    'Daily lead feed',
    'CDS scoring',
    'All event types',
    'Rate locked forever',
  ],
  pro: [
    '3 ZIP territories',
    'Priority lead delivery',
    'Skip-traced phone numbers',
    'All event types',
    'Rate locked forever',
  ],
  dominator: [
    'Unlimited ZIPs in county',
    'First-access lead delivery',
    'Skip-traced phone numbers',
    'Dedicated account manager',
    'Rate locked forever',
  ],
};

export const TIER_LABELS = {
  starter: 'Starter — 1 ZIP',
  pro: 'Pro — 3 ZIPs',
  dominator: 'Dominator — 10 ZIPs',
};

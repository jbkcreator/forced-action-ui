// Vertical config is now owned by verticals.js — edit there, not here.
export { VERTICAL_LABELS, VERTICAL_ICONS, VERTICAL_OPTIONS, DEFAULT_VERTICAL } from './verticals.js';
// Allowed personalisation variables — mirrors the backend whitelist exactly.
// Backend rejects any {{variable}} outside this list with 422.
// Loaded dynamically from /api/admin/email-templates/variables; this is the fallback.
export const INSTANTLY_VARIABLES = [
  { name: 'firstName',   description: 'First name' },
  { name: 'lastName',    description: 'Last name' },
  { name: 'company',     description: 'Company name / full name fallback' },
  { name: 'city',        description: 'City' },
  { name: 'licenseType', description: 'License type description' },
  { name: 'email',       description: 'Email / work email fallback' },
  { name: 'phone',       description: 'Phone number' },
  { name: 'website',     description: 'Website domain' },
  { name: 'location',    description: 'Location (city)' },
  { name: 'linkedIn',    description: 'LinkedIn profile URL' },
];

export const VERTICAL_LABELS = {
  roofing: 'Roofing',
  restoration: 'Restoration',
  public_adjusters: 'Public Adjusters',
  wholesalers: 'Wholesalers',
  fix_flip: 'Fix & Flip',
  attorneys: 'Attorneys',
};

export const VERTICAL_ICONS = {
  roofing: 'home',
  restoration: 'droplet',
  public_adjusters: 'clipboard',
  wholesalers: 'building',
  fix_flip: 'hammer',
  attorneys: 'scale',
};

export const DEFAULT_VERTICAL = 'roofing';
export const DEFAULT_COUNTY_ID = 'hillsborough';
export const PAGE_SIZE = 25;

export const DISTRESS_TAG_COLORS = {
  insurance_claim:   { bg: 'rgba(251,191,36,0.12)', text: '#fbbf24', border: 'rgba(251,191,36,0.25)' },
  storm_damage:      { bg: 'rgba(249,115,22,0.12)', text: '#fb923c', border: 'rgba(249,115,22,0.25)' },
  code_violations:   { bg: 'rgba(234,179,8,0.12)',  text: '#facc15', border: 'rgba(234,179,8,0.25)' },
  building_permits:  { bg: 'rgba(255,255,255,0.06)', text: '#cbd5e1', border: 'rgba(255,255,255,0.12)' },
  foreclosure:       { bg: 'rgba(239,68,68,0.12)',  text: '#f87171', border: 'rgba(239,68,68,0.25)' },
  tax_delinquency:   { bg: 'rgba(251,146,60,0.12)', text: '#fb923c', border: 'rgba(251,146,60,0.25)' },
  legal_proceedings: { bg: 'rgba(168,85,247,0.12)', text: '#c084fc', border: 'rgba(168,85,247,0.25)' },
};

export const TRUST_STATS = [
  { label: 'Monitoring', value: '522,000+', suffix: 'properties' },
  { label: '', value: '14', suffix: 'distress signals tracked' },
  { label: 'Updated', value: 'daily', suffix: '' },
  { label: '', value: '6', suffix: 'buyer verticals' },
];

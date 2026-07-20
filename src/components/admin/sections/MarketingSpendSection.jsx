import MarketingSpendForm from '../MarketingSpendForm';
import CacDashboard from '../CacDashboard';
import SectionLayout from './SectionLayout';

const TABS = [
  { id: 'add', label: 'Add Spend', Component: MarketingSpendForm },
  { id: 'cac', label: 'CAC / Payback', Component: CacDashboard },
];

export default function MarketingSpendSection() {
  return <SectionLayout tabs={TABS} />;
}

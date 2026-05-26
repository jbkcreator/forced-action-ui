import RefundsDashboard from '../RefundsDashboard';
import RevenueSignalPanel from '../RevenueSignalPanel';
import SkuMarginDashboard from '../SkuMarginDashboard';
import SectionLayout from './SectionLayout';

const TABS = [
  { id: 'refunds', label: 'Refunds',        Component: RefundsDashboard },
  { id: 'sku',     label: 'SKU Margin',     Component: SkuMarginDashboard },
  { id: 'signal',  label: 'Revenue Signal', Component: RevenueSignalPanel },
];

export default function RevenueSection() {
  return <SectionLayout tabs={TABS} />;
}

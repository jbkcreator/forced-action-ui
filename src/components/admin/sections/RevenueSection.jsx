import AttributionDashboard from '../AttributionDashboard';
import RefundsDashboard from '../RefundsDashboard';
import RevenueSignalPanel from '../RevenueSignalPanel';
import RevenueLeakPanel from '../RevenueLeakPanel';
import SkuMarginDashboard from '../SkuMarginDashboard';
import SectionLayout from './SectionLayout';

const TABS = [
  { id: 'refunds',      label: 'Refunds',        Component: RefundsDashboard },
  { id: 'sku',          label: 'SKU Margin',     Component: SkuMarginDashboard },
  { id: 'signal',       label: 'Revenue Signal', Component: RevenueSignalPanel },
  { id: 'leak',         label: 'Revenue Leak',   Component: RevenueLeakPanel },
  { id: 'attribution',  label: 'Attribution',    Component: AttributionDashboard },
];

export default function RevenueSection() {
  return <SectionLayout tabs={TABS} />;
}

import ContactCoverageDashboard from '../ContactCoverageDashboard';
import DlqDashboard from '../DlqDashboard';
import EnrichmentHealthDashboard from '../EnrichmentHealthDashboard';
import GateMetricsDashboard from '../GateMetricsDashboard';
import FunnelDashboard from '../FunnelDashboard';
import SectionLayout from './SectionLayout';

const TABS = [
  { id: 'coverage',   label: 'Contact Coverage', Component: ContactCoverageDashboard },
  { id: 'dlq',        label: 'DLQ',              Component: DlqDashboard },
  { id: 'gates',      label: 'Gate Monitoring',  Component: GateMetricsDashboard },
  { id: 'enrichment', label: 'Provider Health',  Component: EnrichmentHealthDashboard },
  { id: 'funnel',     label: 'Funnel',           Component: FunnelDashboard },
];

export default function OpsSection() {
  return <SectionLayout tabs={TABS} />;
}

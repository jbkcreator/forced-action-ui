import ContactCoverageDashboard from '../ContactCoverageDashboard';
import DlqDashboard from '../DlqDashboard';
import GateMetricsDashboard from '../GateMetricsDashboard';
import SectionLayout from './SectionLayout';

const TABS = [
  { id: 'coverage', label: 'Contact Coverage', Component: ContactCoverageDashboard },
  { id: 'dlq',      label: 'DLQ',              Component: DlqDashboard },
  { id: 'gates',    label: 'Gate Monitoring',  Component: GateMetricsDashboard },
];

export default function OpsSection() {
  return <SectionLayout tabs={TABS} />;
}

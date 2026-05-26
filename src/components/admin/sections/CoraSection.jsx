import CoraAutonomyDashboard from '../CoraAutonomyDashboard';
import CoraPlaybookDashboard from '../CoraPlaybookDashboard';
import SectionLayout from './SectionLayout';

const TABS = [
  { id: 'autonomy',  label: 'Autonomy Scorecard',      Component: CoraAutonomyDashboard },
  { id: 'playbooks', label: 'Playbook Recommendations', Component: CoraPlaybookDashboard },
];

export default function CoraSection() {
  return <SectionLayout tabs={TABS} />;
}

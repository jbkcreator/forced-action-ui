import LifecycleAutonomyDashboard from '../LifecycleAutonomyDashboard';
import LifecycleIncidentsDashboard from '../LifecycleIncidentsDashboard';
import LifecyclePendingMessagesDashboard from '../LifecyclePendingMessagesDashboard';
import LifecyclePlaybookDashboard from '../LifecyclePlaybookDashboard';
import LifecycleTimelineDashboard from '../LifecycleTimelineDashboard';
import SmsOutcomesDashboard from '../SmsOutcomesDashboard';
import SmsVariantPerformanceDashboard from '../SmsVariantPerformanceDashboard';
import SectionLayout from './SectionLayout';

// fa045 — Subscriber Timeline tab retired; per-subscriber conversation
// history now lives at /admin/subscribers/:id?tab=conversation.

const TABS = [
  { id: 'autonomy',         label: 'Autonomy Scorecard',      Component: LifecycleAutonomyDashboard },
  { id: 'playbooks',        label: 'Playbook Recommendations', Component: LifecyclePlaybookDashboard },
  { id: 'pending-messages', label: 'Pending Messages',         Component: LifecyclePendingMessagesDashboard },
  { id: 'incidents',        label: 'Incidents',                Component: LifecycleIncidentsDashboard },
  { id: 'sms-outcomes',     label: 'SMS Outcomes',             Component: SmsOutcomesDashboard },
  { id: 'sms-variants',     label: 'SMS Performance',          Component: SmsVariantPerformanceDashboard },
];

export default function LifecycleSection() {
  return <SectionLayout tabs={TABS} />;
}

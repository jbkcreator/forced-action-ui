import CoraAutonomyDashboard from '../CoraAutonomyDashboard';
import CoraIncidentsDashboard from '../CoraIncidentsDashboard';
import CoraPlaybookDashboard from '../CoraPlaybookDashboard';
import CoraTimelineDashboard from '../CoraTimelineDashboard';
import SmsOutcomesDashboard from '../SmsOutcomesDashboard';
import SmsVariantPerformanceDashboard from '../SmsVariantPerformanceDashboard';
import SectionLayout from './SectionLayout';

// fa045 — Subscriber Timeline tab retired; per-subscriber conversation
// history now lives at /admin/subscribers/:id?tab=conversation.

const TABS = [
  { id: 'autonomy',    label: 'Autonomy Scorecard',       Component: CoraAutonomyDashboard },
  { id: 'playbooks',  label: 'Playbook Recommendations',  Component: CoraPlaybookDashboard },
  { id: 'incidents',  label: 'Incidents',                 Component: CoraIncidentsDashboard },
  { id: 'timeline',   label: 'Subscriber Timeline',       Component: CoraTimelineDashboard },
  { id: 'sms-outcomes',    label: 'SMS Outcomes',         Component: SmsOutcomesDashboard },
  { id: 'sms-variants',    label: 'SMS Performance',      Component: SmsVariantPerformanceDashboard },
];

export default function CoraSection() {
  return <SectionLayout tabs={TABS} />;
}

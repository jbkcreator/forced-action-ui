import EmailCampaignsDashboard from '../EmailCampaignsDashboard';
import EmailTemplatesDashboard from '../EmailTemplatesDashboard';
import WarmupStatusDashboard from '../WarmupStatusDashboard';
import SectionLayout from './SectionLayout';

const TABS = [
  { id: 'campaigns', label: 'Campaigns',      Component: EmailCampaignsDashboard },
  { id: 'templates', label: 'Templates',       Component: EmailTemplatesDashboard },
  { id: 'warmup',    label: 'Inbox / Warmup',  Component: WarmupStatusDashboard },
];

export default function EmailCampaignsSection() {
  return <SectionLayout tabs={TABS} />;
}

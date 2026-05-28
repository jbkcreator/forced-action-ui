import SynthflowDashboard from '../SynthflowDashboard';
import StormPacksTable from '../StormPacksTable';
import SectionLayout from './SectionLayout';

const TABS = [
  { id: 'synthflow', label: 'Synthflow',   Component: SynthflowDashboard },
  { id: 'storm',     label: 'Storm Packs', Component: StormPacksTable },
];

export default function MessagingSection() {
  return <SectionLayout tabs={TABS} />;
}

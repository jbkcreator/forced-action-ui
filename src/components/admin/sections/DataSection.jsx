import CountyManagementDashboard from '../CountyManagementDashboard';
import ColumnMappingsDashboard from '../ColumnMappingsDashboard';
import UploadCard from '../UploadCard';
import VoterUploadCard from '../VoterUploadCard';
import SectionLayout from './SectionLayout';

const TABS = [
  { id: 'counties', label: 'Counties',     Component: CountyManagementDashboard },
  { id: 'mappings', label: 'Col Mappings', Component: ColumnMappingsDashboard },
  { id: 'upload',   label: 'Data Upload',  Component: UploadCard },
  { id: 'voters',   label: 'Voter Upload', Component: VoterUploadCard },
];

export default function DataSection() {
  return <SectionLayout tabs={TABS} />;
}

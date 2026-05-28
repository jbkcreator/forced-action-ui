import CountyManagementDashboard from '../CountyManagementDashboard';
import ColumnMappingsDashboard from '../ColumnMappingsDashboard';
import UploadCard from '../UploadCard';
import SectionLayout from './SectionLayout';

const TABS = [
  { id: 'counties', label: 'Counties',     Component: CountyManagementDashboard },
  { id: 'mappings', label: 'Col Mappings', Component: ColumnMappingsDashboard },
  { id: 'upload',   label: 'Data Upload',  Component: UploadCard },
];

export default function DataSection() {
  return <SectionLayout tabs={TABS} />;
}

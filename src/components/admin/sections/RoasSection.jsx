import { useAdminContext } from '../adminContext';
import RoasDashboard from '../RoasDashboard';

export default function RoasSection() {
  const { token } = useAdminContext();
  return (
    <div className="flex-1 overflow-y-auto px-6 py-6">
      <div className="max-w-5xl mx-auto">
        <RoasDashboard token={token} />
      </div>
    </div>
  );
}

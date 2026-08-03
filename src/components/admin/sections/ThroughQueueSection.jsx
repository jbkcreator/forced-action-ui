import { useAdminContext } from '../adminContext';
import ThroughQueueDashboard from '../ThroughQueueDashboard';

export default function ThroughQueueSection() {
  const { token } = useAdminContext();

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6">
      <div className="max-w-4xl mx-auto">
        <ThroughQueueDashboard token={token} />
      </div>
    </div>
  );
}

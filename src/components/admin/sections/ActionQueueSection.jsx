import { useAdminContext } from '../adminContext';
import ActionQueueDashboard from '../ActionQueueDashboard';

export default function ActionQueueSection() {
  const { token } = useAdminContext();
  return (
    <div className="flex-1 overflow-y-auto px-6 py-6">
      <div className="max-w-4xl mx-auto">
        <ActionQueueDashboard token={token} />
      </div>
    </div>
  );
}

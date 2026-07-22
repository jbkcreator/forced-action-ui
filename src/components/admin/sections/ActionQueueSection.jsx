import { useSearchParams } from 'react-router-dom';
import { useAdminContext } from '../adminContext';
import ActionQueueDashboard from '../ActionQueueDashboard';

export default function ActionQueueSection() {
  const { token } = useAdminContext();
  const [searchParams] = useSearchParams();
  const lane = searchParams.get('lane') || undefined;
  const category = searchParams.get('category') || undefined;

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6">
      <div className="max-w-4xl mx-auto">
        <ActionQueueDashboard token={token} lane={lane} category={category} />
      </div>
    </div>
  );
}

import SubscribersDashboard from '../SubscribersDashboard';
import { useAdminContext } from '../adminContext';

export default function SubscribersSection() {
  const { token } = useAdminContext();
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-6xl mx-auto">
          <SubscribersDashboard token={token} />
        </div>
      </div>
    </div>
  );
}

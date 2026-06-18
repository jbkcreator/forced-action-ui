import { useAdminContext } from '../adminContext';
import QuoraBrowserStream from '../QuoraBrowserStream';

export default function ScrapersSection() {
  const { token } = useAdminContext();
  return (
    <div className="flex-1 overflow-y-auto px-6 py-6">
      <div className="max-w-4xl mx-auto">
        <QuoraBrowserStream token={token} />
      </div>
    </div>
  );
}

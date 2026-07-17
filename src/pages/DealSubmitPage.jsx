/**
 * Investor deal-intake landing page (fa061 investor routing hook).
 * Route: /deals/submit?feed_uuid=...
 * Placeholder destination so investor magic-link signups land somewhere
 * real instead of 404ing — full intake form is a separate build.
 */

import { useSearchParams, Link } from 'react-router-dom';

export default function DealSubmitPage() {
  const [searchParams] = useSearchParams();
  const feedUuid = searchParams.get('feed_uuid');

  return (
    <div className="min-h-screen bg-fa-bg-base flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="text-4xl mb-4">🏗️</div>
        <h1 className="text-2xl font-bold text-fa-text-primary mb-2">You're in!</h1>
        <p className="text-fa-text-muted mb-6">
          Deal intake is being set up for your account. We'll email you as soon as
          it's ready.
        </p>
        {feedUuid && (
          <Link
            to={`/dashboard/${feedUuid}`}
            className="inline-block bg-fa-primary text-fa-bg-base font-bold px-6 py-2.5 rounded-lg hover:opacity-90"
          >
            Go to your feed
          </Link>
        )}
      </div>
    </div>
  );
}

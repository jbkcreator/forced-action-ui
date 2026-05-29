/**
 * County-specific landing page route (/landing/:countyId).
 *
 * Delegates entirely to LandingPage. LandingContext reads countyId from
 * useParams() so the full existing landing page renders with county-scoped
 * data, CTA mode, and copy driven by GET /api/landing-data?county_id=<id>.
 *
 * ComingSoonVariant / SoldOutVariant are no longer used from this route —
 * CTA behavior is controlled by landingData.cta_mode inside LandingPage.
 */
import LandingPage from './LandingPage';

export default function CountyLanding() {
  return <LandingPage />;
}

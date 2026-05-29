import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ComingSoonVariant from '../components/landing/ComingSoonVariant';
import SoldOutVariant from '../components/landing/SoldOutVariant';
import { LandingProvider } from '../components/landing/LandingContext';
import NotFoundPage from './NotFoundPage';
import { getCountyLanding } from '../api/landing';

export default function CountyLanding() {
  const { countyId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getCountyLanding(countyId)
      .then(setData)
      .catch((e) => setError(e))
      .finally(() => setLoading(false));
  }, [countyId]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (error?.status === 404 || !data) {
    return <NotFoundPage />;
  }

  let variant = null;
  if (data.waitlist_type === 'coming_soon') variant = <ComingSoonVariant {...data} />;
  else if (data.waitlist_type === 'sold_out') variant = <SoldOutVariant {...data} />;
  else return <NotFoundPage />;

  return <LandingProvider>{variant}</LandingProvider>;
}
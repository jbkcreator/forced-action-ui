export const INVESTOR_DEAL_SUBMIT_ROUTE = '/deals/submit';

export function getPostSignupRoute({ vertical, feedUuid }) {
  if (vertical === 'investor') {
    return `${INVESTOR_DEAL_SUBMIT_ROUTE}?feed_uuid=${encodeURIComponent(feedUuid)}`;
  }

  return `/dashboard/${feedUuid}`;
}
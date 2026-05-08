import { apiRequest } from './client';

export async function pauseSubscription(feedUuid, days = 60) {
  return apiRequest('/api/pause-subscription', {
    method: 'POST',
    body: JSON.stringify({ feed_uuid: feedUuid, days }),
  });
}

export async function resumeSubscription(feedUuid) {
  return apiRequest('/api/resume-subscription', {
    method: 'POST',
    body: JSON.stringify({ feed_uuid: feedUuid }),
  });
}

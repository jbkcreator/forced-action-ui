/**
 * Subscriber feed auth state hook (fa061).
 * Reads from localStorage — no network call on mount.
 * Mirror of useWhiteLabelAuth.js for the subscriber product.
 */

import { useState, useCallback } from 'react';
import {
  subscriberLogin as apiLogin,
  subscriberLogout as apiLogout,
  subscriberVerifyMagicLink as apiVerifyMagicLink,
  decodeSubToken,
} from '../api/subscriber.js';
import { logBusinessEvent } from '../api/phase2b';

export default function useSubscriberAuth() {
  const [session, setSession] = useState(() => decodeSubToken());

  const login = useCallback(async ({ email, feedUuid, password }) => {
    const data = await apiLogin({ email, feedUuid, password });
    setSession(decodeSubToken());
    // Task 6.3 — churn-defense engagement listener (fire-and-forget).
    logBusinessEvent('SUBSCRIBER_LOGIN', { feedUuid: data?.feed_uuid });
    return data;
  }, []);

  const verifyMagicLink = useCallback(async (token) => {
    const data = await apiVerifyMagicLink(token);
    setSession(decodeSubToken());
    logBusinessEvent('SUBSCRIBER_LOGIN_MAGIC_LINK', { feedUuid: data?.feed_uuid });
    return data;
  }, []);

  const logout = useCallback(() => {
    apiLogout();
    setSession(null);
  }, []);

  return {
    session,                          // null | { sub, feed_uuid, exp }
    isAuthenticated: !!session,
    login,
    verifyMagicLink,
    logout,
  };
}

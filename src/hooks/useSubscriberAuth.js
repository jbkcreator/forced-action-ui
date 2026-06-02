/**
 * Subscriber feed auth state hook (fa061).
 * Reads from localStorage — no network call on mount.
 * Mirror of useWhiteLabelAuth.js for the subscriber product.
 */

import { useState, useCallback } from 'react';
import {
  subscriberLogin as apiLogin,
  subscriberLogout as apiLogout,
  decodeSubToken,
} from '../api/subscriber.js';

export default function useSubscriberAuth() {
  const [session, setSession] = useState(() => decodeSubToken());

  const login = useCallback(async ({ email, feedUuid, password }) => {
    const data = await apiLogin({ email, feedUuid, password });
    setSession(decodeSubToken());
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
    logout,
  };
}

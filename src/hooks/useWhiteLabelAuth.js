/**
 * White-label auth state hook.
 * Reads localStorage tokens and provides login/logout helpers.
 * Components use this to check authentication state without calling the API.
 */

import { useState, useCallback } from 'react';
import { wlLogin as apiLogin, wlLogout as apiLogout } from '../api/whiteLabelClient.js';

export default function useWhiteLabelAuth() {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('wl_access_token');
    if (!token) return null;
    try {
      // Decode payload (middle part of JWT) without verifying — just for display
      const payload = JSON.parse(atob(token.split('.')[1]));
      // If token is expired, treat as unauthenticated
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        localStorage.removeItem('wl_access_token');
        return null;
      }
      return { userId: payload.sub, clientId: payload.cid };
    } catch {
      return null;
    }
  });

  const login = useCallback(async (email, password) => {
    const data = await apiLogin(email, password);
    setUser({ userId: data.user.id, clientId: data.client.id, ...data.user });
    return data;
  }, []);

  const logout = useCallback(() => {
    apiLogout();
    setUser(null);
  }, []);

  return {
    user,
    isAuthenticated: !!user,
    login,
    logout,
  };
}

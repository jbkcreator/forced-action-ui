/**
 * Broker auth state hook.
 * Reads localStorage tokens and provides login/logout helpers.
 * Mirrors useWhiteLabelAuth.js — token key: 'broker_access_token'.
 */

import { useState, useCallback } from 'react';
import { brokerLogin as apiLogin, brokerLogout as apiLogout, getBrokerToken } from '../api/broker.js';

export default function useBrokerAuth() {
  const [user, setUser] = useState(() => {
    const token = getBrokerToken();
    if (!token) return null;
    // Mock token — treat as valid
    if (token === 'mock.broker.token') {
      return { brokerId: 'b-001', name: 'Jane Broker', email: 'jane@example.com' };
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        localStorage.removeItem('broker_access_token');
        return null;
      }
      return { brokerId: payload.sub, name: payload.name, email: payload.email };
    } catch {
      return null;
    }
  });

  const login = useCallback(async (email, password) => {
    const data = await apiLogin(email, password);
    const broker = data.broker || {};
    setUser({ brokerId: broker.id, name: broker.name, email: broker.email });
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

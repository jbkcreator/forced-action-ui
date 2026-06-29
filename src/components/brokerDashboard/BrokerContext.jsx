/**
 * BrokerContext — provides broker account data to the broker dashboard.
 * Loads the broker's "me" endpoint on mount; redirects to /broker/login on 401.
 * Mirrors WLContext.jsx pattern.
 */

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { brokerGetMe, brokerLogout } from '../../api/broker.js';
import { getBrokerToken } from '../../api/broker.js';

// ---------------------------------------------------------------------------
// DEV BYPASS — set to false when wiring real auth
// ---------------------------------------------------------------------------
const DEV_BYPASS = true;
const DEV_BROKER = { id: 'b-001', brokerId: 'b-001', name: 'Jane Broker', email: 'jane@example.com' };
// ---------------------------------------------------------------------------

const BrokerContext = createContext(null);

export function BrokerProvider({ children }) {
  const [broker, setBroker] = useState(DEV_BYPASS ? DEV_BROKER : null);
  const [isLoading, setIsLoading] = useState(!DEV_BYPASS);
  const [error, setError] = useState(null);

  const loadBroker = useCallback(async () => {
    if (DEV_BYPASS) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await brokerGetMe();
      setBroker(data);
    } catch (err) {
      if (err?.status === 401) {
        brokerLogout();
        window.location.href = '/broker/login';
        return;
      }
      setError(err?.message || 'Failed to load account');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (DEV_BYPASS) return;
    // Redirect immediately if no token (avoid a round-trip)
    if (!getBrokerToken()) {
      window.location.href = '/broker/login';
      return;
    }
    loadBroker();
  }, [loadBroker]);

  const logout = useCallback(() => {
    brokerLogout();
    window.location.href = '/broker/login';
  }, []);

  return (
    <BrokerContext.Provider value={{ broker, isLoading, error, logout, refresh: loadBroker }}>
      {children}
    </BrokerContext.Provider>
  );
}

export function useBrokerContext() {
  const ctx = useContext(BrokerContext);
  if (!ctx) throw new Error('useBrokerContext must be used inside BrokerProvider');
  return ctx;
}

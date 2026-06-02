/**
 * WLContext — provides client branding + account data to the WL dashboard.
 * Injects client primary/secondary colors as CSS vars on mount so all
 * descendant components use the client's brand automatically.
 */

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { wlGetAccount, wlLogout } from '../../api/whiteLabelClient.js';

const WLContext = createContext(null);

export function WLProvider({ children }) {
  const [client, setClient] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAccount = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await wlGetAccount();
      setClient(data);
      // Decode user from token for display info
      const token = localStorage.getItem('wl_access_token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setUser({ id: payload.sub, clientId: payload.cid });
        } catch {/* ignore */}
      }
    } catch (err) {
      if (err?.status === 401) {
        wlLogout();
        window.location.href = '/wl/login';
        return;
      }
      setError(err?.message || 'Failed to load account');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccount();
  }, [loadAccount]);

  // Inject client branding as CSS vars
  useEffect(() => {
    if (!client) return;
    const root = document.documentElement;
    if (client.primary_color) {
      root.style.setProperty('--fa-color-primary', client.primary_color);
      root.style.setProperty('--wl-primary', client.primary_color);
    }
    if (client.secondary_color) {
      root.style.setProperty('--fa-color-accent', client.secondary_color);
      root.style.setProperty('--wl-accent', client.secondary_color);
    }
    // Restore FA defaults on unmount
    return () => {
      root.style.removeProperty('--fa-color-primary');
      root.style.removeProperty('--fa-color-accent');
    };
  }, [client]);

  const logout = useCallback(() => {
    wlLogout();
    window.location.href = '/wl/login';
  }, []);

  const branding = client
    ? {
        company_name: client.display_name || client.company_name,
        logo_url: client.logo_url,
        primary_color: client.primary_color || '#fbbf24',
        secondary_color: client.secondary_color || '#a855f7',
      }
    : null;

  return (
    <WLContext.Provider value={{ client, user, branding, isLoading, error, logout, refreshClient: loadAccount }}>
      {children}
    </WLContext.Provider>
  );
}

export function useWLContext() {
  const ctx = useContext(WLContext);
  if (!ctx) throw new Error('useWLContext must be used inside WLProvider');
  return ctx;
}

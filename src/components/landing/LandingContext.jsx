import { createContext, useContext, useState } from 'react';
import { DEFAULT_VERTICAL, DEFAULT_COUNTY_ID } from '../../config/constants';

const LandingContext = createContext();

export function LandingProvider({ children }) {
  const [selectedVertical, setSelectedVertical] = useState(DEFAULT_VERTICAL);
  const countyId = DEFAULT_COUNTY_ID;

  return (
    <LandingContext.Provider value={{ selectedVertical, setSelectedVertical, countyId }}>
      {children}
    </LandingContext.Provider>
  );
}

export function useLanding() {
  return useContext(LandingContext);
}

'use client';

import React, { createContext, useState, useContext, useCallback, ReactNode } from 'react';

interface TripContextType {
  refreshKey: number;
  triggerPinListRefresh: () => void;
}

// Create the context with a default value
const TripContext = createContext<TripContextType | undefined>(undefined);

// Create a provider component
export const TripContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [refreshKey, setRefreshKey] = useState(0);

  // Function to increment the key, triggering consumers
  const triggerPinListRefresh = useCallback(() => {
    console.log("[TripContext] Triggering pin list refresh..."); // Debug log
    setRefreshKey(prevKey => prevKey + 1);
  }, []);

  return (
    <TripContext.Provider value={{ refreshKey, triggerPinListRefresh }}>
      {children}
    </TripContext.Provider>
  );
};

// Create a custom hook for easy consumption
export const useTripContext = () => {
  const context = useContext(TripContext);
  if (context === undefined) {
    throw new Error('useTripContext must be used within a TripContextProvider');
  }
  return context;
}; 
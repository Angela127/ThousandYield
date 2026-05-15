import React, { createContext, useContext, useEffect } from 'react';
import { useElectricitySimulator } from '../hooks/useElectricitySimulator';
import { ref, set } from 'firebase/database';
import { rtdb } from '../firebase-config.js';
import { isPeak } from '../constants/electricityConfig';

const ElectricityContext = createContext(null);

export const ElectricityProvider = ({ children }) => {
  const electricityState = useElectricitySimulator();

  useEffect(() => {
    if (rtdb) {
       try {
         const electricityRef = ref(rtdb, 'electricity');
         set(electricityRef, {
           deviceRegistry: electricityState.deviceRegistry,
           budget_W: electricityState.budgetW,
           summary: electricityState.summary,
           optimisation: { suggestions: electricityState.suggestions }
         }).catch(err => console.error("Firebase write error:", err));
       } catch (err) {
         console.error("Firebase sync failed", err);
       }
    }
  }, [electricityState.deviceRegistry, electricityState.budgetW, electricityState.summary, electricityState.suggestions]);

  // Exported state includes all simulator state plus the specific cross-module exports
  const exportedState = {
    ...electricityState,
    total_W: electricityState.summary.total_W,
    budget_remaining_W: electricityState.budgetW - electricityState.summary.total_W,
    device_status: Object.keys(electricityState.deviceRegistry).reduce((acc, id) => {
      acc[id] = electricityState.deviceRegistry[id].status;
      return acc;
    }, {}),
    peak_hours_active: isPeak(new Date().getHours())
  };

  return (
    <ElectricityContext.Provider value={exportedState}>
      {children}
    </ElectricityContext.Provider>
  );
};

export const useElectricityContext = () => {
  const context = useContext(ElectricityContext);
  if (!context) {
    throw new Error('useElectricityContext must be used within an ElectricityProvider');
  }
  return context;
};

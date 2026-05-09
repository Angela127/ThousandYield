import React, { createContext, useContext } from 'react';
import { useIrrigationSimulator } from '../hooks/useIrrigationSimulator';

const IrrigationContext = createContext(null);

export const IrrigationProvider = ({ children }) => {
  const irrigationState = useIrrigationSimulator();

  return (
    <IrrigationContext.Provider value={irrigationState}>
      {children}
    </IrrigationContext.Provider>
  );
};

export const useIrrigationContext = () => {
  const context = useContext(IrrigationContext);
  if (!context) {
    throw new Error('useIrrigationContext must be used within an IrrigationProvider');
  }
  return context;
};

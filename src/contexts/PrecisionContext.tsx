/**
 * Context global pour la gestion de la précision (0.1mm, 0.5mm, 1mm)
 * Permet de changer la précision partout dans l'application automatiquement
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { PrecisionType } from '../services/core/PrecisionManager';

interface PrecisionContextType {
  precision: PrecisionType;
  setPrecision: (precision: PrecisionType) => void;
}

const PrecisionContext = createContext<PrecisionContextType | undefined>(undefined);

export const PrecisionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [precision, setPrecision] = useState<PrecisionType>('0.1mm');

  return (
    <PrecisionContext.Provider value={{ precision, setPrecision }}>
      {children}
    </PrecisionContext.Provider>
  );
};

export const usePrecision = () => {
  const context = useContext(PrecisionContext);
  if (!context) {
    throw new Error('usePrecision doit être utilisé dans PrecisionProvider');
  }
  return context;
};

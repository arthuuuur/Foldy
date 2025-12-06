/**
 * Context global pour la gestion des unités (cm/in)
 * Permet de changer l'unité partout dans l'application automatiquement
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Unit } from '../services/core/UnitConverter';

interface UnitPreferencesContextType {
  unit: Unit;
  setUnit: (unit: Unit) => void;
}

const UnitPreferencesContext = createContext<UnitPreferencesContextType | undefined>(undefined);

export const UnitPreferencesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [unit, setUnit] = useState<Unit>('cm');

  return (
    <UnitPreferencesContext.Provider value={{ unit, setUnit }}>
      {children}
    </UnitPreferencesContext.Provider>
  );
};

export const useUnitPreferences = () => {
  const context = useContext(UnitPreferencesContext);
  if (!context) {
    throw new Error('useUnitPreferences doit être utilisé dans UnitPreferencesProvider');
  }
  return context;
};

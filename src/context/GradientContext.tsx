// Global gradient state management for Barber Buddy
// Provides gradient state control across all app screens

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { GradientState } from '../theme/gradients';

interface GradientContextType {
  gradientState: GradientState;
  setGradientState: (state: GradientState) => void;
  cycleGradient: () => void;
}

const GradientContext = createContext<GradientContextType | undefined>(undefined);

interface GradientProviderProps {
  children: ReactNode;
}

export const GradientProvider: React.FC<GradientProviderProps> = ({ children }) => {
  const [gradientState, setGradientState] = useState<GradientState>('DIAGONAL_GRADIENT');

  // Cycle through gradient states (for demo/testing purposes)
  const cycleGradient = () => {
    setGradientState(current => {
      switch (current) {
        case 'PURPLE_SOLID':
          return 'PINK_SOLID';
        case 'PINK_SOLID':
          return 'DIAGONAL_GRADIENT';
        case 'DIAGONAL_GRADIENT':
          return 'PURPLE_SOLID';
        default:
          return 'PURPLE_SOLID';
      }
    });
  };

  const value: GradientContextType = {
    gradientState,
    setGradientState,
    cycleGradient,
  };

  return (
    <GradientContext.Provider value={value}>
      {children}
    </GradientContext.Provider>
  );
};

// Custom hook to use gradient context
export const useGradient = (): GradientContextType => {
  const context = useContext(GradientContext);
  if (context === undefined) {
    throw new Error('useGradient must be used within a GradientProvider');
  }
  return context;
};

export default GradientProvider;
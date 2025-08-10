// Gradient configurations for Barber Buddy background system
// Specifications from gradientBackgroundImplementation.md

import { COLORS } from './colors';

// Gradient state types
export type GradientState = 'PURPLE_SOLID' | 'PINK_SOLID' | 'DIAGONAL_GRADIENT';

// Gradient configurations
export const GRADIENTS = {
  // Solid backgrounds (for screens 1 & 3)
  solidPurple: [COLORS.purplePrimary, COLORS.purplePrimary],
  solidPink: [COLORS.pinkAccent, COLORS.pinkAccent],
  
  // Diagonal gradient (for screen 4) - 135-degree angle
  diagonalPinkPurple: [COLORS.pinkAccent, COLORS.purplePrimary],
  
  // Transition gradients (for smooth animations)
  purpleToPink: [COLORS.purplePrimary, COLORS.pinkAccent],
  pinkToPurple: [COLORS.pinkAccent, COLORS.purplePrimary],
} as const;

// Gradient states mapping
export const GRADIENT_STATES = {
  PURPLE_SOLID: 'purpleSolid',      // Image 1 & 3
  PINK_SOLID: 'pinkSolid',          // Image 2
  DIAGONAL_GRADIENT: 'diagonal',     // Image 4
} as const;

// Gradient direction specifications
export const GRADIENT_DIRECTIONS = {
  // 135-degree diagonal (top-left to bottom-right)
  diagonal: {
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
    angle: 135,
  },
  // No direction needed for solid colors
  solid: {
    start: { x: 0, y: 0 },
    end: { x: 0, y: 0 },
    angle: 0,
  },
} as const;

// Animation timing configuration
export const GRADIENT_ANIMATION = {
  duration: 800,                    // 800ms for smooth, premium feel
  easing: 'bezier(0.4, 0, 0.2, 1)', // Material Design standard
} as const;

// Helper function to get gradient configuration by state
export const getGradientConfig = (state: GradientState) => {
  switch (state) {
    case 'PURPLE_SOLID':
      return {
        colors: GRADIENTS.solidPurple,
        direction: GRADIENT_DIRECTIONS.solid,
      };
    case 'PINK_SOLID':
      return {
        colors: GRADIENTS.solidPink,
        direction: GRADIENT_DIRECTIONS.solid,
      };
    case 'DIAGONAL_GRADIENT':
      return {
        colors: GRADIENTS.diagonalPinkPurple,
        direction: GRADIENT_DIRECTIONS.diagonal,
      };
    default:
      return {
        colors: GRADIENTS.solidPurple,
        direction: GRADIENT_DIRECTIONS.solid,
      };
  }
};
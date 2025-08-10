// Gradient background color system for Barber Buddy
// Colors as specified in gradientBackgroundImplementation.md

export const COLORS = {
  // Primary gradient colors - EXACT values from gradientBackgroundImplementation.md
  purplePrimary: '#6B46C1',    // Deep violet-purple (exact spec)
  pinkAccent: '#FF69B4',       // Vibrant magenta-pink (exact spec)
  white: '#FFFFFF',            // Pure white for text
  
  // Light variants for smooth transitions
  purpleLight: '#8B5CF6',      // Light purple for transitions
  pinkLight: '#FF8FA3',        // Light pink for transitions
  
  // Additional colors for app elements
  text: {
    primary: '#FFFFFF',
    secondary: '#F8F9FA',
    dark: '#212529',
  },
  
  // Background variants
  background: {
    light: '#F8F9FA',
    white: '#FFFFFF',
    overlay: 'rgba(0, 0, 0, 0.3)',
  },
} as const;

// Type for color values
export type ColorKey = keyof typeof COLORS;
export type TextColorKey = keyof typeof COLORS.text;
export type BackgroundColorKey = keyof typeof COLORS.background;
// Animated gradient background component for Barber Buddy
// Implementation per gradientBackgroundImplementation.md specifications

import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
// Note: Removed Reanimated import for now - using standard LinearGradient
import {
  GradientState,
  getGradientConfig,
  GRADIENT_ANIMATION,
} from '../theme/gradients';

// Note: Using standard LinearGradient for now - animation will be handled through state changes

interface GradientBackgroundProps {
  state?: GradientState;
  children?: React.ReactNode;
}

export const GradientBackground: React.FC<GradientBackgroundProps> = ({
  state = 'PURPLE_SOLID',
  children,
}) => {
  // No longer needed - using StyleSheet.absoluteFillObject handles screen coverage

  // Memoized gradient configurations for performance
  const gradientConfig = useMemo(() => {
    return getGradientConfig(state);
  }, [state]);

  // No longer needed - using StyleSheet.absoluteFillObject directly

  // Debug: Log the gradient configuration
  console.log('Gradient Background Debug:', {
    state,
    colors: gradientConfig.colors,
    direction: gradientConfig.direction,
  });

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={[...gradientConfig.colors]}
        start={gradientConfig.direction.start}
        end={gradientConfig.direction.end}
        style={{ ...StyleSheet.absoluteFillObject, zIndex: 0 }}
      />
      <View style={{ flex: 1, zIndex: 1, backgroundColor: 'transparent' }}>
        {children}
      </View>
    </View>
  );
};

// Styles removed - using inline styles for better performance and clarity

// Performance optimized component with React.memo
export default React.memo(GradientBackground);
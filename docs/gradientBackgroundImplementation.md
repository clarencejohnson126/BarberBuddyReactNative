# React Native Mobile Gradient Background Implementation

## Gradient System Overview
Create a smooth, animated gradient background system for a React Native mobile app that transitions between solid purple, solid pink, and diagonal pink-to-purple gradients. The system must be optimized for mobile performance and provide seamless color transitions.

## Color Specifications

### Exact Color Values
```javascript
const COLORS = {
  purplePrimary: '#6B46C1',    // Deep violet-purple
  pinkAccent: '#FF69B4',       // Vibrant magenta-pink
  white: '#FFFFFF',            // Pure white for text
  purpleLight: '#8B5CF6',      // Light purple for transitions
  pinkLight: '#FF8FA3',        // Light pink for transitions
};
```

### Gradient Configurations
```javascript
const GRADIENTS = {
  // Solid backgrounds (for screens 1 & 3)
  solidPurple: [COLORS.purplePrimary, COLORS.purplePrimary],
  solidPink: [COLORS.pinkAccent, COLORS.pinkAccent],
  
  // Diagonal gradient (for screen 4)
  diagonalPinkPurple: [COLORS.pinkAccent, COLORS.purplePrimary],
  
  // Transition gradients (for smooth animations)
  purpleToPink: [COLORS.purplePrimary, COLORS.pinkAccent],
  pinkToPurple: [COLORS.pinkAccent, COLORS.purplePrimary],
};
```

## Implementation Requirements

### Library Dependencies
```bash
npm install react-native-linear-gradient
npm install react-native-reanimated
```

### Core Gradient Component Structure
```javascript
import LinearGradient from 'react-native-linear-gradient';
import Animated from 'react-native-reanimated';

// Animated LinearGradient for smooth transitions
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);
```

### Gradient Direction Specifications
- **Solid Colors**: No direction needed (same color repeated)
- **Diagonal Gradient**: 135-degree angle (top-left to bottom-right)
- **React Native Coordinates**: `start={{x: 0, y: 0}} end={{x: 1, y: 1}}`

### Animation Timing
- **Transition Duration**: 800ms for smooth, premium feel
- **Easing**: `Easing.bezier(0.4, 0, 0.2, 1)` (Material Design standard)
- **Interpolation**: Use shared values for color transitions

## Mobile Optimization Requirements

### Performance Considerations
1. **Hardware Acceleration**: Ensure gradients use native drivers
2. **Memory Management**: Avoid creating new gradient instances on re-renders
3. **Smooth 60fps**: All transitions must maintain 60fps on mid-range devices
4. **Battery Efficiency**: Minimize GPU usage during static states

### Screen Size Adaptations
```javascript
const screenDimensions = {
  width: Dimensions.get('window').width,
  height: Dimensions.get('window').height,
};

// Gradient must cover full screen including safe areas
const fullScreenStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: screenDimensions.width,
  height: screenDimensions.height,
};
```

## Gradient Transition Logic

### State Management
```javascript
// Three main gradient states matching the reference images
const GRADIENT_STATES = {
  PURPLE_SOLID: 'purpleSolid',      // Image 1 & 3
  PINK_SOLID: 'pinkSolid',          // Image 2
  DIAGONAL_GRADIENT: 'diagonal',     // Image 4
};
```

### Smooth Color Interpolation
- **Use Shared Values**: For each color component (R, G, B)
- **Interpolate Colors**: Smoothly blend between hex values
- **Timing Control**: Staggered animations for more organic feel

### Animation Sequence
1. **Static State**: Hold current gradient
2. **Transition Start**: Begin color interpolation
3. **Mid-transition**: Peak animation smoothness
4. **Settle**: Reach target gradient state
5. **Static State**: Hold new gradient

## Technical Implementation Details

### Gradient Props Structure
```javascript
const gradientProps = {
  colors: animatedColors,           // Animated color array
  start: { x: 0, y: 0 },           // Top-left
  end: { x: 1, y: 1 },             // Bottom-right (135° diagonal)
  style: StyleSheet.absoluteFillObject,
  useAngle: true,
  angle: 135,                      // For diagonal gradients
};
```

### Color Animation Logic
- **RGB Interpolation**: Break hex colors into RGB components
- **Smooth Transitions**: Use cubic-bezier easing for natural feel
- **Color Space**: Maintain consistent color space throughout transitions

### Memory Management
```javascript
// Memoize gradient configurations
const memoizedGradients = useMemo(() => ({
  solid: { colors: [COLORS.purplePrimary, COLORS.purplePrimary] },
  gradient: { colors: [COLORS.pinkAccent, COLORS.purplePrimary] },
}), []);
```

## Mobile-Specific Optimizations

### iOS Considerations
- **Metal Rendering**: Leverage iOS Metal framework for smooth gradients
- **Safe Area**: Account for notch and home indicator
- **Dynamic Island**: Ensure gradient works with iOS 16+ Dynamic Island

### Android Considerations
- **Vulkan API**: Use hardware acceleration where available
- **API Level Support**: Ensure compatibility with Android 7+ (API 24+)
- **Edge-to-Edge**: Handle gesture navigation and system bars

### Performance Monitoring
```javascript
// Track frame drops during gradient transitions
import { useFrameCallback } from 'react-native-reanimated';

useFrameCallback(() => {
  // Monitor frame rate during gradient animations
  // Log performance metrics for optimization
});
```

## Animation Triggers

### User Interaction Based
- **Screen Navigation**: Trigger gradient change on route change
- **Gesture Recognition**: Smooth transitions following swipe gestures
- **Button Presses**: Instant gradient state changes for immediate feedback

### Automatic Transitions
- **Timed Sequences**: Auto-transition for demo/onboarding flows
- **App State Changes**: Gradient responds to app foreground/background
- **User Journey**: Progressive gradient evolution through app flow

## Quality Assurance Requirements

### Visual Standards
- **No Banding**: Smooth gradient transitions without visible steps
- **Color Accuracy**: Exact match to reference design colors
- **Consistent Timing**: All transitions complete in specified duration

### Performance Standards
- **60fps Minimum**: During all gradient transitions
- **Low Battery Impact**: Efficient GPU usage
- **Memory Stable**: No memory leaks during repeated transitions
- **Cross-Platform**: Identical visual appearance on iOS and Android

### Testing Requirements
- **Device Coverage**: Test on iPhone SE to iPhone 14 Pro Max
- **Android Range**: Test from mid-range to flagship devices
- **Performance Profiling**: Use Flipper/Reactotron for optimization
- **Visual Regression**: Automated screenshot comparison testing

## Success Criteria
The gradient system should provide a premium, smooth visual experience that enhances the app's aesthetic while maintaining optimal mobile performance. Users should experience seamless color transitions that feel natural and respond instantly to interactions without any frame drops or visual artifacts.
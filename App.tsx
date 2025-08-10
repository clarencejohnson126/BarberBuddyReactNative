// Main App component for Barber Buddy with global gradient background
// Implements gradient system per gradientBackgroundImplementation.md

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';

// Initialize i18n before any components use it
import './src/i18n';

import { GradientProvider, useGradient } from './src/context/GradientContext';
import { AuthProvider } from './src/context/AuthContext';
import { ToastProvider } from './src/context/ToastContext';
import { GradientBackground } from './src/components/GradientBackground';
import { AppNavigator } from './src/navigation/AppNavigator';

// App content wrapper with gradient background
const AppContent: React.FC = () => {
  const { gradientState } = useGradient();

  return (
    <View style={styles.container}>
      {/* Global gradient background affecting all screens */}
      <GradientBackground state={gradientState}>
        <AppNavigator />
      </GradientBackground>
      
      {/* Status bar with light content for better visibility on gradient */}
      <StatusBar style="light" backgroundColor="transparent" translucent />
    </View>
  );
};

// Main App component with providers
export default function App() {

  return (
    <ToastProvider>
      <AuthProvider>
        <GradientProvider>
          <AppContent />
        </GradientProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // No background color needed - gradient handles it
  },
});
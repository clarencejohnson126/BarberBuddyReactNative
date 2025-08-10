// Main navigation setup for Barber Buddy with gradient integration

import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';

import { PhotoUploadScreen } from '../screens/PhotoUploadScreen';
import { HaircutSelectionScreen } from '../screens/HaircutSelectionScreen';
import { ImageGenerationScreen } from '../screens/ImageGenerationScreen';
import { ResultScreen } from '../screens/ResultScreen';
import { LibraryScreen } from '../screens/LibraryScreen';
import { SettingsSupportScreen } from '../screens/SettingsSupportScreen';
import { SubscriptionScreen } from '../screens/SubscriptionScreen';
import { LegalWebViewScreen } from '../screens/LegalWebViewScreen';
import { AuthScreen } from '../screens/AuthScreen';
import { useGradient } from '../context/GradientContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { createDeepLinkService } from '../services/deepLinkService';
import { COLORS } from '../theme/colors';

export type RootStackParamList = {
  PhotoUpload: undefined;
  HaircutSelection: { photoUri: string };
  ImageGeneration: { 
    photoUri: string; 
    selectedStyle: string;
    gender?: string;
    hairColor?: string;
    imageFormat?: string;
    isCustomPrompt?: boolean;
  };
  Result: { generatedImageUri: string; originalPhotoUri: string };
  Library: undefined;
  SettingsSupport: undefined;
  Subscription: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const { setGradientState } = useGradient();
  const { user, loading } = useAuth();
  const { showToast } = useToast();
  const deepLinkService = createDeepLinkService();
  
  // DEBUG: Log navigation decision
  console.log('🧭 AppNavigator decision:', {
    loading,
    hasUser: !!user,
    userEmail: user?.email,
    willShowAuthScreen: !loading && !user,
    willShowMainApp: !loading && !!user
  });

  // Handle initial URL when app is opened via deep link
  useEffect(() => {
    const handleInitialURL = async () => {
      try {
        const initialURL = await Linking.getInitialURL();
        if (initialURL) {
          const result = await deepLinkService.handleDeepLink(initialURL);
          if (!result.success && result.error) {
            showToast(result.error, 'error');
          } else if (result.success) {
            showToast('Email confirmed successfully!', 'success');
          }
        }
      } catch (error) {
        // Ignore errors during initial URL handling
      }
    };

    handleInitialURL();
  }, []);

  // Listen for incoming deep links when app is already open
  useEffect(() => {
    const subscription = deepLinkService.setupListener((result) => {
      if (!result.success && result.error) {
        showToast(result.error, 'error');
      } else if (result.success) {
        showToast('Email confirmed successfully!', 'success');
      }
    });

    return () => subscription?.remove();
  }, []);

  // Show loading while checking auth state
  if (loading) {
    return null;
  }

  // Show auth screen if not logged in
  if (!user) {
    console.log('🚪 No user found, showing AuthScreen');
    return (
      <SafeAreaProvider>
        <AuthScreen />
      </SafeAreaProvider>
    );
  }

  console.log('🎯 Navigating to main app for user:', user.email);

  // Deep linking configuration
  const linking = {
    prefixes: ['barberbuddy://'],
    config: {
      screens: {
        PhotoUpload: '',
        HaircutSelection: 'haircut-selection',
        ImageGeneration: 'image-generation', 
        Result: 'result',
        Library: 'library',
        SettingsSupport: 'settings',
        Subscription: 'subscribe',
      },
    },
  };

  return (
    <SafeAreaProvider>
      <NavigationContainer
        linking={linking}
        theme={{
          colors: {
            background: 'transparent',
            primary: COLORS.white,
            card: 'transparent',
            text: COLORS.white,
            border: 'transparent',
            notification: COLORS.white,
          },
          dark: true,
        }}
      >
        <Stack.Navigator
          id={undefined}
          initialRouteName="PhotoUpload"
          screenOptions={{
            headerShown: false, // Hide headers to show full screen content
            gestureEnabled: true,
            cardStyle: { backgroundColor: 'transparent' },
            cardStyleInterpolator: ({ current }) => ({
              cardStyle: {
                opacity: current.progress,
                backgroundColor: 'transparent',
              },
            }),
          }}
        >
          <Stack.Screen 
            name="PhotoUpload" 
            component={PhotoUploadScreen}
            listeners={{
              focus: () => {
                setGradientState('DIAGONAL_GRADIENT');
              },
            }}
          />
          <Stack.Screen 
            name="HaircutSelection" 
            component={HaircutSelectionScreen}
            listeners={{
              focus: () => {
                setGradientState('DIAGONAL_GRADIENT');
              },
            }}
          />
          <Stack.Screen 
            name="ImageGeneration" 
            component={ImageGenerationScreen}
            listeners={{
              focus: () => {
                setGradientState('DIAGONAL_GRADIENT');
              },
            }}
          />
          <Stack.Screen 
            name="Result" 
            component={ResultScreen}
            listeners={{
              focus: () => {
                setGradientState('DIAGONAL_GRADIENT');
              },
            }}
          />
          <Stack.Screen 
            name="Library" 
            component={LibraryScreen}
            listeners={{
              focus: () => {
                setGradientState('DIAGONAL_GRADIENT');
              },
            }}
          />
          <Stack.Screen 
            name="SettingsSupport" 
            component={SettingsSupportScreen}
            listeners={{
              focus: () => {
                setGradientState('DIAGONAL_GRADIENT');
              },
            }}
          />
          <Stack.Screen 
            name="LegalWebView" 
            component={LegalWebViewScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Subscription"
            component={SubscriptionScreen}
            listeners={{
              focus: () => setGradientState('DIAGONAL_GRADIENT'),
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};
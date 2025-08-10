import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGradient } from '../context/GradientContext';
import { COLORS } from '../theme/colors';
import { Header } from '../components/Header';

export const DesignStudioScreen: React.FC = () => {
  const { gradientState, cycleGradient } = useGradient();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.purplePrimary, COLORS.pinkAccent]}
        style={StyleSheet.absoluteFillObject}
      />
      
      <Header />
      
      {/* Center content for gradient demonstration */}
      <View style={styles.centerContent}>
        <Text style={styles.title}>BarberBuddy</Text>
        <Text style={styles.subtitle}>
          Professional Barber Business App
        </Text>
        
        {/* Gradient state indicator */}
        <View style={styles.gradientInfo}>
          <Text style={styles.gradientLabel}>Current Gradient:</Text>
          <Text style={styles.gradientState}>
            {gradientState.replace('_', ' ').toLowerCase()}
          </Text>
        </View>
        
        {/* Gradient demo button */}
        <TouchableOpacity 
          style={styles.cycleButton} 
          onPress={cycleGradient}
        >
          <Text style={styles.cycleButtonText}>
            Cycle Gradient Animation
          </Text>
        </TouchableOpacity>
        
        {/* Description */}
        <View style={styles.description}>
          <Text style={styles.descriptionText}>
            This demonstrates the animated gradient background system.
          </Text>
          <Text style={styles.descriptionText}>
            Tap the button to cycle through purple solid, pink solid, and diagonal gradient states.
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 100, // Account for header
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    opacity: 0.9,
  },
  gradientInfo: {
    alignItems: 'center',
    marginBottom: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 12,
    minWidth: 200,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  gradientLabel: {
    fontSize: 14,
    color: COLORS.white,
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: 1,
    opacity: 0.8,
  },
  gradientState: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
    textTransform: 'capitalize',
  },
  cycleButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  cycleButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  description: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 12,
    maxWidth: 300,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  descriptionText: {
    fontSize: 14,
    color: COLORS.white,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
    opacity: 0.9,
  },
});
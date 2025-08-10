// HeroIllustration component for the home screen hero section

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

interface PersonIllustrationProps {
  type: 'man' | 'woman';
  size?: number;
}

const PersonIllustration: React.FC<PersonIllustrationProps> = ({ 
  type, 
  size = 60 
}) => {
  const iconName = type === 'man' ? 'person-outline' : 'person-sharp';
  
  return (
    <View style={[
      styles.personContainer, 
      { 
        width: size, 
        height: size * 1.3,
        borderRadius: size / 2,
      }
    ]}>
      {/* Hair representation - different styles for man/woman */}
      <View style={[
        styles.hair,
        type === 'woman' ? styles.womanHair : styles.manHair,
        { 
          width: size * 0.8, 
          height: size * 0.4,
          borderRadius: size * 0.4,
        }
      ]} />
      
      {/* Face/person icon */}
      <Ionicons 
        name={iconName} 
        size={size * 0.6} 
        color={COLORS.white} 
        style={styles.personIcon}
      />
    </View>
  );
};

export const HeroIllustration: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.illustrationRow}>
        <PersonIllustration type="man" size={60} />
        <PersonIllustration type="woman" size={60} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationRow: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'flex-end',
  },
  personContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    paddingBottom: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  hair: {
    position: 'absolute',
    top: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  manHair: {
    // Shorter hair for man
    transform: [{ scaleY: 0.6 }],
  },
  womanHair: {
    // Longer hair for woman
    transform: [{ scaleY: 1.2 }],
  },
  personIcon: {
    opacity: 0.9,
  },
});

export default HeroIllustration;
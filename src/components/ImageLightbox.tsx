import React from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Text, AccessibilityInfo, Image } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/colors';

interface ImageLightboxProps {
  visible: boolean;
  uri: string | null;
  onClose: () => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({ visible, uri, onClose }) => {
  const { t } = useTranslation();
  return (
    <Modal visible={visible} transparent animationType="fade" onShow={() => AccessibilityInfo.announceForAccessibility?.(t('common.success'))}>
      <View style={styles.backdrop}>
        {!!uri && (
          <Image
            source={{ uri }}
            style={styles.image}
            resizeMode="contain"
            accessibilityLabel={t('result.afterDescription')}
            accessible
          />
        )}
        {/* Bottom gradient band + blur to hide lower area; matches app gradient */}
        <BlurView intensity={50} tint="light" style={styles.bottomBlur} pointerEvents="none" />
        <LinearGradient
          pointerEvents="none"
          colors={[
            'rgba(255,105,180,0.15)',
            'rgba(255,105,180,0.85)',
            'rgba(107,70,193,0.95)'
          ]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.bottomGradient}
        />
        {/* Additional soft veil to ensure full coverage and stronger blur effect */}
        <View pointerEvents="none" style={styles.bottomVeil} />
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          onPress={onClose}
          style={styles.close}
          activeOpacity={0.8}
        >
          <Text style={styles.closeText}>×</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '94%',
    height: '86%',
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '48%'
  },
  bottomBlur: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%'
  },
  bottomVeil: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '38%',
    backgroundColor: 'rgba(255,255,255,0.22)'
  },
  close: {
    position: 'absolute',
    top: 40,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)'
  },
  closeText: {
    color: COLORS.white,
    fontSize: 28,
    lineHeight: 30,
    marginTop: -2,
  },
});


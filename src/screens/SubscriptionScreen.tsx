import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Dimensions, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/colors';
import Header from '../components/Header';
import { useTranslation } from 'react-i18next';
import { getQuickDiagnostics } from '../services/stripeService';
import { debugEnvironmentVariables } from '../utils/debugEnv';

const { width } = Dimensions.get('window');

export const SubscriptionScreen: React.FC = () => {
  const { t } = useTranslation();

  const handlePurchase = async (priceId: string) => {
    try {
      // First, debug the environment to see what's available
      const envDebug = debugEnvironmentVariables();
      console.log('🔍 Environment debug:', envDebug);
      
      if (!envDebug.hasStripeSecretKey) {
        Alert.alert(
          t('subscription.error'),
          'Stripe configuration is missing. The app needs to be restarted to load new environment variables.\n\nPlease close and reopen the app, then try again.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      // Create checkout session using Stripe service
      console.log('Creating checkout session for price ID:', priceId);
      
      const { createCheckoutSession } = await import('../services/stripeService');
      
      const successUrl = 'barberbuddy://subscription/success';
      const cancelUrl = 'barberbuddy://subscription/cancel';
      
      const session = await createCheckoutSession(priceId, successUrl, cancelUrl);
      
      if (session?.url) {
        // Open Stripe Checkout in browser
        const supported = await Linking.canOpenURL(session.url);
        if (supported) {
          await Linking.openURL(session.url);
        } else {
          throw new Error('Cannot open checkout URL');
        }
      } else {
        throw new Error('No checkout URL returned');
      }
      
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert(
        t('subscription.error'),
        `Unable to process subscription: ${error instanceof Error ? error.message : 'Unknown error'}`,
        [{ text: 'OK' }]
      );
    }
  };

  const plans = [
    { key: 'free', title: t('plans.free'), price: '$0', features: [t('subscription.freeFeatures')], cta: null },
    { key: 'fly', title: t('plans.fly'), price: '$4.99', features: [t('subscription.plusFeatures')], priceId: 'price_1RuVJcBFsNKxX9bKi1ScM40h', recommended: true },
    { key: 'superfly', title: t('plans.superFly'), price: '$7.99', features: [t('subscription.proFeatures')], priceId: 'price_1RuVJcBFsNKxX9bK7t3i5GMh' },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient colors={[COLORS.purplePrimary, COLORS.pinkAccent]} style={StyleSheet.absoluteFillObject} />
      <Header title={t('upgrade.title')} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>{t('upgrade.description')}</Text>
        <View style={styles.cardsRow}>
          {plans.map((p) => (
            <View key={p.key} style={[styles.card, p.key !== 'free' && styles.cardEmphasis, p.recommended && styles.cardRecommended]}> 
              {p.recommended && (
                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedText}>{t('plans.recommended')}</Text>
                </View>
              )}
              <Text style={styles.planTitle}>{p.title}</Text>
              <Text style={styles.planPrice}>{p.price}</Text>
              {p.features.map((f, i) => (
                <Text key={i} style={styles.feature}>• {f}</Text>
              ))}
              {p.priceId && (
                <TouchableOpacity style={styles.cta} onPress={() => handlePurchase(p.priceId!)} activeOpacity={0.8}>
                  <Text style={styles.ctaText}>{t('subscription.selectPlan')}</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
        <Text style={styles.legalCopy}>{t('plans.legal')}</Text>
      </ScrollView>
    </View>
  );
};

const CARD_WIDTH = width * 0.8;

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { alignItems: 'center', paddingBottom: 40 },
  subtitle: {
    color: COLORS.white,
    opacity: 0.9,
    marginTop: 8,
    marginBottom: 24,
    textAlign: 'center',
  },
  cardsRow: { alignItems: 'center', gap: 16 },
  card: {
    width: CARD_WIDTH,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    padding: 20,
    position: 'relative',
  },
  cardEmphasis: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderColor: 'rgba(255,255,255,0.35)'
  },
  cardRecommended: {
    transform: [{ scale: 1.03 }],
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 6,
  },
  planTitle: { color: COLORS.white, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  planPrice: { color: COLORS.white, fontSize: 28, fontWeight: '800', textAlign: 'center', marginVertical: 8 },
  feature: { color: COLORS.white, opacity: 0.9, marginTop: 6, textAlign: 'center' },
  cta: { marginTop: 16, backgroundColor: '#ffffff', paddingVertical: 12, borderRadius: 14 },
  ctaText: { color: COLORS.purplePrimary, fontWeight: '800', textAlign: 'center' },
  recommendedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#fff',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  recommendedText: {
    color: COLORS.purplePrimary,
    fontWeight: '800',
    fontSize: 10,
  },
  legalCopy: {
    color: COLORS.white,
    opacity: 0.8,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 12,
  }
});

export default SubscriptionScreen;


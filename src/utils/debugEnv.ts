import Constants from 'expo-constants';

export function debugEnvironmentVariables() {
  console.log('🔍 DEBUG: Environment Variables');
  console.log('─'.repeat(50));
  console.log('Constants.expoConfig?.extra:', Constants.expoConfig?.extra);
  console.log('─'.repeat(50));
  
  // Check specific variables
  const stripeSecretKey = Constants.expoConfig?.extra?.STRIPE_SECRET_KEY;
  const stripeAccountId = Constants.expoConfig?.extra?.STRIPE_ACCOUNT_ID_EXPECTED;
  const stripePublicKey = Constants.expoConfig?.extra?.STRIPE_PUBLISHABLE_KEY;
  
  console.log('STRIPE_SECRET_KEY present:', !!stripeSecretKey);
  console.log('STRIPE_SECRET_KEY starts with:', stripeSecretKey?.substring(0, 15) || 'N/A');
  console.log('STRIPE_ACCOUNT_ID_EXPECTED:', stripeAccountId);
  console.log('STRIPE_PUBLISHABLE_KEY present:', !!stripePublicKey);
  console.log('─'.repeat(50));
  
  return {
    hasStripeSecretKey: !!stripeSecretKey,
    hasStripeAccountId: !!stripeAccountId,
    hasStripePublicKey: !!stripePublicKey,
    stripeSecretKeyPreview: stripeSecretKey?.substring(0, 15) || 'N/A'
  };
}
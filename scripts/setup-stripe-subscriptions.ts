import { createSubscriptionProduct, createSubscriptionPrice } from '../src/services/stripeService';

async function setupSubscriptions() {
  try {
    // Create Fly Plan
    console.log('Creating Fly Plan...');
    const flyProduct = await createSubscriptionProduct(
      'BarberBuddy Fly Subscription',
      'Monthly subscription with 50 generations per month'
    );
    const flyPrice = await createSubscriptionPrice(flyProduct.id, 499);
    console.log('Fly Plan created:', { product: flyProduct.id, price: flyPrice.id });

    // Create Super Fly Plan
    console.log('Creating Super Fly Plan...');
    const superFlyProduct = await createSubscriptionProduct(
      'BarberBuddy Super Fly Subscription',
      'Monthly subscription with unlimited generations'
    );
    const superFlyPrice = await createSubscriptionPrice(superFlyProduct.id, 799);
    console.log('Super Fly Plan created:', { product: superFlyProduct.id, price: superFlyPrice.id });

    console.log('All subscription products and prices created successfully!');
    return {
      fly: { product: flyProduct, price: flyPrice },
      superFly: { product: superFlyProduct, price: superFlyPrice },
    };
  } catch (error) {
    console.error('Failed to set up subscriptions:', error);
    throw error;
  }
}

setupSubscriptions().catch(console.error);
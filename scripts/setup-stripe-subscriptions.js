require('dotenv').config();
const fetch = require('node-fetch');

async function setupSubscriptions() {
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  const STRIPE_ACCOUNT_ID_EXPECTED = process.env.STRIPE_ACCOUNT_ID_EXPECTED;

  if (!STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }

  async function createProduct(name, description) {
    const response = await fetch('https://api.stripe.com/v1/products', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        name,
        description,
        type: 'service',
      }).toString(),
    });

    if (!response.ok) {
      throw new Error(`Failed to create product: ${response.status}`);
    }

    return response.json();
  }

  async function createPrice(productId, amount, currency = 'usd') {
    const response = await fetch('https://api.stripe.com/v1/prices', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'product': productId,
        'unit_amount': amount.toString(),
        'currency': currency,
        'recurring[interval]': 'month',
      }).toString(),
    });

    if (!response.ok) {
      throw new Error(`Failed to create price: ${response.status}`);
    }

    return response.json();
  }

  try {
    // Create Fly Plan
    console.log('Creating Fly Plan...');
    const flyProduct = await createProduct(
      'BarberBuddy Fly Subscription',
      'Monthly subscription with 50 generations per month'
    );
    const flyPrice = await createPrice(flyProduct.id, 499);
    console.log('Fly Plan created:', { product: flyProduct.id, price: flyPrice.id });

    // Create Super Fly Plan
    console.log('Creating Super Fly Plan...');
    const superFlyProduct = await createProduct(
      'BarberBuddy Super Fly Subscription',
      'Monthly subscription with unlimited generations'
    );
    const superFlyPrice = await createPrice(superFlyProduct.id, 799);
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
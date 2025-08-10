#!/usr/bin/env node

/**
 * Setup BarberBuddy products and prices in Stripe
 * Run this script to create the correct products with $4.99 and $7.99 pricing
 */

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'your_stripe_secret_key_here';
const STRIPE_ACCOUNT_ID_EXPECTED = process.env.STRIPE_ACCOUNT_ID_EXPECTED || 'your_stripe_account_id_here';

async function createProduct(name: string, description: string) {
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
    const error = await response.text();
    throw new Error(`Failed to create product ${name}: ${error}`);
  }

  return response.json();
}

async function createPrice(productId: string, amount: number, currency: string = 'usd') {
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
    const error = await response.text();
    throw new Error(`Failed to create price for product ${productId}: ${error}`);
  }

  return response.json();
}

async function verifyAccount() {
  const response = await fetch('https://api.stripe.com/v1/account', {
    headers: {
      'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
    }
  });

  if (!response.ok) {
    throw new Error(`Account verification failed: ${response.status}`);
  }

  const account = await response.json();
  
  if (account.id !== STRIPE_ACCOUNT_ID_EXPECTED) {
    throw new Error(`Wrong account! Expected ${STRIPE_ACCOUNT_ID_EXPECTED}, got ${account.id}`);
  }

  console.log('✅ Account verified:', account.business_profile?.name || account.settings?.dashboard?.display_name);
  return account;
}

async function main() {
  try {
    console.log('🔐 Verifying Stripe account...');
    await verifyAccount();

    console.log('📦 Creating BarberBuddy Fly product...');
    const flyProduct = await createProduct(
      'BarberBuddy Fly',
      'Premium AI haircut transformations with advanced styling options - $4.99/month'
    );

    console.log('💰 Creating $4.99 price for Fly...');
    const flyPrice = await createPrice(flyProduct.id, 499); // $4.99

    console.log('📦 Creating BarberBuddy SuperFly product...');
    const superflyProduct = await createProduct(
      'BarberBuddy SuperFly',
      'Professional AI haircut transformations with unlimited styling and premium features - $7.99/month'
    );

    console.log('💰 Creating $7.99 price for SuperFly...');
    const superflyPrice = await createPrice(superflyProduct.id, 799); // $7.99

    console.log('\n🎉 SUCCESS! Products and prices created:');
    console.log('─'.repeat(60));
    console.log(`✈️  Fly Plan ($4.99/month):`);
    console.log(`   Product ID: ${flyProduct.id}`);
    console.log(`   Price ID: ${flyPrice.id}`);
    console.log('');
    console.log(`🚀 SuperFly Plan ($7.99/month):`);
    console.log(`   Product ID: ${superflyProduct.id}`);
    console.log(`   Price ID: ${superflyPrice.id}`);
    console.log('─'.repeat(60));
    console.log('\n📝 Update your SubscriptionScreen.tsx with these price IDs:');
    console.log(`   Fly: '${flyPrice.id}'`);
    console.log(`   SuperFly: '${superflyPrice.id}'`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
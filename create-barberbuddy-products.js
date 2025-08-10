require('dotenv').config();

async function createBarberBuddyProducts() {
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  
  console.log('Creating BarberBuddy products directly via API...');
  
  try {
    // First verify we're connected to the right account
    const accountResponse = await fetch('https://api.stripe.com/v1/account', {
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
      }
    });

    if (!accountResponse.ok) {
      throw new Error(`Failed to fetch account: ${accountResponse.status}`);
    }

    const account = await accountResponse.json();
    console.log(`Connected to account: ${account.id} - ${account.settings?.dashboard?.display_name}`);
    
    if (account.settings?.dashboard?.display_name !== 'BarberBuddy') {
      throw new Error(`Wrong account! Connected to: ${account.settings?.dashboard?.display_name}`);
    }

    // Create Fly Plan
    console.log('Creating Fly Plan...');
    const flyProductResponse = await fetch('https://api.stripe.com/v1/products', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        name: 'BarberBuddy Fly Plan',
        description: 'Monthly subscription with 50 generations per month',
        type: 'service',
      }).toString(),
    });

    if (!flyProductResponse.ok) {
      throw new Error(`Failed to create Fly product: ${flyProductResponse.status}`);
    }

    const flyProduct = await flyProductResponse.json();
    console.log('Fly Product created:', flyProduct.id);

    // Create Fly Price
    const flyPriceResponse = await fetch('https://api.stripe.com/v1/prices', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'product': flyProduct.id,
        'unit_amount': '499',
        'currency': 'usd',
        'recurring[interval]': 'month',
      }).toString(),
    });

    if (!flyPriceResponse.ok) {
      throw new Error(`Failed to create Fly price: ${flyPriceResponse.status}`);
    }

    const flyPrice = await flyPriceResponse.json();
    console.log('Fly Price created:', flyPrice.id);

    // Create Super Fly Plan
    console.log('Creating Super Fly Plan...');
    const superFlyProductResponse = await fetch('https://api.stripe.com/v1/products', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        name: 'BarberBuddy Super Fly Plan',
        description: 'Monthly subscription with unlimited generations',
        type: 'service',
      }).toString(),
    });

    if (!superFlyProductResponse.ok) {
      throw new Error(`Failed to create Super Fly product: ${superFlyProductResponse.status}`);
    }

    const superFlyProduct = await superFlyProductResponse.json();
    console.log('Super Fly Product created:', superFlyProduct.id);

    // Create Super Fly Price
    const superFlyPriceResponse = await fetch('https://api.stripe.com/v1/prices', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'product': superFlyProduct.id,
        'unit_amount': '799',
        'currency': 'usd',
        'recurring[interval]': 'month',
      }).toString(),
    });

    if (!superFlyPriceResponse.ok) {
      throw new Error(`Failed to create Super Fly price: ${superFlyPriceResponse.status}`);
    }

    const superFlyPrice = await superFlyPriceResponse.json();
    console.log('Super Fly Price created:', superFlyPrice.id);

    // Create Payment Links
    console.log('Creating payment links...');
    
    const flyLinkResponse = await fetch('https://api.stripe.com/v1/payment_links', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'line_items[0][price]': flyPrice.id,
        'line_items[0][quantity]': '1',
      }).toString(),
    });

    if (!flyLinkResponse.ok) {
      throw new Error(`Failed to create Fly payment link: ${flyLinkResponse.status}`);
    }

    const flyLink = await flyLinkResponse.json();
    console.log('Fly Payment Link:', flyLink.url);

    const superFlyLinkResponse = await fetch('https://api.stripe.com/v1/payment_links', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'line_items[0][price]': superFlyPrice.id,
        'line_items[0][quantity]': '1',
      }).toString(),
    });

    if (!superFlyLinkResponse.ok) {
      throw new Error(`Failed to create Super Fly payment link: ${superFlyLinkResponse.status}`);
    }

    const superFlyLink = await superFlyLinkResponse.json();
    console.log('Super Fly Payment Link:', superFlyLink.url);

    console.log('\n=== SUCCESS ===');
    console.log('All products created in BarberBuddy account!');
    console.log('Fly Plan:', flyLink.url);
    console.log('Super Fly Plan:', superFlyLink.url);

    return {
      fly: { product: flyProduct, price: flyPrice, link: flyLink },
      superFly: { product: superFlyProduct, price: superFlyPrice, link: superFlyLink },
    };

  } catch (error) {
    console.error('Error creating products:', error);
    throw error;
  }
}

createBarberBuddyProducts().catch(console.error); 
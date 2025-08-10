/**
 * API endpoint to create Stripe checkout sessions using MCP tools
 * This runs on the backend where MCP tools are available
 */

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { priceId, successUrl, cancelUrl } = req.body;

  if (!priceId || !successUrl || !cancelUrl) {
    return res.status(400).json({ 
      error: 'Missing required fields: priceId, successUrl, cancelUrl' 
    });
  }

  try {
    // Import the Stripe service for checkout session creation
    const { createCheckoutSession } = await import('../../src/services/stripeService');
    
    // Verify the price ID is one of our valid BarberBuddy prices
    const validPriceIds = [
      'price_1RuVJcBFsNKxX9bKi1ScM40h', // Fly $4.99
      'price_1RuVJcBFsNKxX9bK7t3i5GMh'  // SuperFly $7.99
    ];

    if (!validPriceIds.includes(priceId)) {
      return res.status(400).json({ 
        error: 'Invalid price ID' 
      });
    }

    // Create real Stripe checkout session
    const session = await createCheckoutSession(priceId, successUrl, cancelUrl);

    res.status(200).json({
      success: true,
      session,
      message: 'Checkout session created successfully'
    });

  } catch (error) {
    console.error('Checkout session creation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create checkout session',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
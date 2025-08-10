require('dotenv').config();

async function testMCPAccount() {
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  
  console.log('=== MCP ACCOUNT TEST ===');
  console.log('Environment STRIPE_SECRET_KEY (first 20 chars):', STRIPE_SECRET_KEY.substring(0, 20) + '...');
  
  try {
    const response = await fetch('https://api.stripe.com/v1/account', {
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch account: ${response.status}`);
    }

    const account = await response.json();
    
    console.log('\n=== DIRECT API CALL RESULT ===');
    console.log(`Account ID: ${account.id}`);
    console.log(`Business Name: ${account.business_profile?.name}`);
    console.log(`Dashboard Name: ${account.settings?.dashboard?.display_name}`);
    console.log(`Country: ${account.country}`);
    console.log(`Currency: ${account.default_currency}`);
    console.log('=============================\n');
    
    return account;
  } catch (error) {
    console.error('Error testing account:', error);
    throw error;
  }
}

testMCPAccount().catch(console.error); 
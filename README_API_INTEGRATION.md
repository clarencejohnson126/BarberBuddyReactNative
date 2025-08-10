# BarberBuddy API Integration Guide

This document explains how to run API diagnostics and troubleshoot integration issues.

## Environment Setup

BarberBuddy uses **expo-constants** for environment variable access in React Native. Environment variables are stored in `app.json` under `expo.extra` and **NOT** in `process.env`.

### Required Configuration

All API keys must be configured in `app.json`:

```json
{
  "expo": {
    "extra": {
      "STRIPE_SECRET_KEY": "your_stripe_secret_key_here",
      "STRIPE_ACCOUNT_ID_EXPECTED": "acct_...",
      "STRIPE_ALLOW_CATALOG_MUTATIONS": "true",
      "SUPABASE_URL": "https://....supabase.co",
      "SUPABASE_ANON_KEY": "eyJ...",
      "OPENAI_API_KEY": "sk-proj-...",
      "REPLICATE_API_TOKEN": "your_replicate_api_token_here"
    }
  }
}
```

## Running Diagnostics

### Quick Command Line Test
```bash
npm run diag:apis
```

This runs a standalone diagnostic that tests all API credentials without React Native dependencies.

### Expected Output

When all APIs are healthy:
```
🔍 BarberBuddy Standalone API Diagnostics
==================================================
✅ Environment: OK - All environment variables configured
✅ Stripe: OK - Stripe API validated successfully
✅ Supabase: OK - Supabase API validated successfully  
✅ OpenAI: OK - OpenAI API validated successfully
✅ Replicate: OK - Replicate API validated successfully
==================================================
✨ Overall Status: 5/5 services healthy
🎉 All APIs are working correctly!
```

### In-App Diagnostics

The app includes boot-time API validation via `APIGuard.validateOnBootup()`. This prevents the app from proceeding with invalid credentials.

## API Services Status

### ✅ OpenAI
- **Status**: Fully validated
- **Models Available**: 88
- **Integration**: Working correctly

### ✅ Supabase  
- **Status**: Fully validated
- **Connection**: Successful to https://tjitowimrflxjnghkebt.supabase.co
- **Integration**: Working correctly

### ✅ Replicate
- **Status**: Fully validated  
- **Account**: Accessible
- **Integration**: Working correctly

### ⚠️ Stripe
- **Status**: MCP Integration works, Direct API calls fail
- **Issue**: The current secret key `your_stripe_secret_key_here` returns 401 errors
- **MCP Status**: ✅ Working (balance retrieval successful)
- **Direct API Status**: ❌ 401 Unauthorized
- **Action Required**: Key may need refresh from Stripe dashboard

## Security Features

### Account Validation
- Stripe connections are validated against `STRIPE_ACCOUNT_ID_EXPECTED`
- Business name must contain "BarberBuddy"
- Wrong account connections are blocked with security errors

### Error Handling
- All APIs use localized error messages (EN/DE/ES/TR)
- Structured error responses with retry capabilities
- No sensitive data logged in error messages

### Environment Protection
- Keys are never logged in full
- Diagnostic output shows only safe prefixes
- Boot-time validation prevents wrong account usage

## Troubleshooting

### 401 Unauthorized Errors

**Stripe**: Check if secret key needs to be refreshed in Stripe dashboard

**OpenAI**: Verify API key is active and has proper permissions

**Replicate**: Ensure token has not expired

### Environment Variable Issues

1. Check `app.json` has all required keys in `expo.extra`
2. Restart the Expo development server
3. Clear Metro cache: `npx expo start --clear`

### Network Issues

All API calls include:
- Timeout protection (10 seconds)
- Exponential backoff for retries  
- User-friendly error messages
- Automatic retry on transient failures

## Development Commands

```bash
# Run API diagnostics
npm run diag:apis

# Test APIs with detailed output
npm run test:apis

# Clear API validation cache (in-app)
APIGuard.clearCache()
```

## Integration Architecture

```
App Startup
├── APIGuard.validateOnBootup()
├── Environment variable validation
├── Individual service validation
├── Account identity verification
└── Cache results (5 minutes)

API Calls
├── Service-specific validation
├── Error handling with localization
├── Retry logic with exponential backoff
└── User-friendly error presentation
```

## Support

If diagnostics show persistent failures:

1. Run `npm run diag:apis` and include output
2. Check if keys have been rotated/revoked
3. Verify network connectivity
4. Try clearing application cache/data

All API integrations include comprehensive logging and error reporting for troubleshooting.
# Replicate API Integration for BarberBuddy

A comprehensive, production-ready integration of the Replicate FLUX Kontext haircut model with advanced security, cost control, and user experience features.

## 🔥 Features

### Core Functionality
- **FLUX Kontext Model Integration**: Professional haircut generation with 50+ styles and 30+ colors
- **Character Consistency**: Face and background preservation while transforming hair
- **Real-time Processing**: Live progress tracking and status updates
- **Image Validation**: Comprehensive format and size validation (JPEG/PNG, max 10MB)

### Security & Cost Control
- **Environment Variable Security**: All API keys stored securely, never exposed to frontend
- **Multi-tier Rate Limiting**: 1 free/month, 20 Plus/month, 50 Pro/month
- **Global Cost Protection**: App-wide 1,000 free generation limit with admin alerts at 500
- **Input Sanitization**: Complete validation of all API inputs and image data
- **Error Logging**: Comprehensive error tracking with Sentry-compatible reporting

### User Experience
- **Multilingual Support**: Full localization in English, German, Spanish, Turkish
- **Offline Capability**: Smart caching and offline error handling
- **Progress Animation**: Beautiful loading states with time estimates
- **Retry Logic**: Automatic retry with exponential backoff for recoverable errors
- **Result Sharing**: Easy sharing of generated images with native integration

## 📁 File Structure

```
src/
├── types/
│   └── replicate.ts           # Complete TypeScript definitions
├── services/
│   └── replicateService.ts    # Main API service with security features
├── hooks/
│   └── useReplicate.ts        # React hook for component integration
├── components/
│   └── HaircutGenerator.tsx   # Complete UI component
├── utils/
│   ├── errorHandler.ts        # Centralized error handling
│   ├── rateLimiter.ts         # Advanced rate limiting
│   └── testHelpers.ts         # Comprehensive testing utilities
└── README.md                  # This file
```

## 🚀 Quick Start

### 1. Environment Setup

Add to your `.env` file:

```bash
# CRITICAL: Keep these secure - never expose to frontend
REPLICATE_API_TOKEN=your_replicate_api_token_here

# Rate limiting configuration
GLOBAL_FREE_LIMIT=1000
ADMIN_ALERT_THRESHOLD=500

# Optional: Additional integrations
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
STRIPE_PUBLISHABLE_KEY=your_stripe_key_here
```

### 2. Install Dependencies

```bash
npm install @react-native-async-storage/async-storage
npm install expo-image-picker expo-sharing expo-file-system
npm install react-i18next i18next
```

### 3. Basic Usage

```tsx
import React from 'react';
import { View } from 'react-native';
import { HaircutGenerator } from '../components/HaircutGenerator';

export default function MyScreen() {
  return (
    <View style={{ flex: 1 }}>
      <HaircutGenerator
        userId="user_123"
        userTier="free"
        onUpgradePressed={() => {
          // Handle subscription upgrade
        }}
        onResultGenerated={(imageUrl) => {
          // Handle generated result
          console.log('Generated image:', imageUrl);
        }}
      />
    </View>
  );
}
```

### 4. Advanced Hook Usage

```tsx
import { useReplicate } from '../hooks/useReplicate';

function CustomHaircutComponent({ userId }: { userId: string }) {
  const {
    generateHaircut,
    isGenerating,
    progress,
    currentResult,
    error,
    userQuota,
    availableStyles,
    availableColors
  } = useReplicate(userId);

  const handleGenerate = async () => {
    const result = await generateHaircut(
      'data:image/jpeg;base64,...', // Base64 image
      {
        haircut: 'Bob',
        hair_color: 'Blonde',
        gender: 'female'
      }
    );
    
    if (result) {
      console.log('Success!', result.outputImageUrl);
    }
  };

  return (
    // Your custom UI
  );
}
```

## 🔒 Security Implementation

### API Key Protection
```typescript
// ✅ CORRECT: Server-side only
const apiToken = process.env.REPLICATE_API_TOKEN;

// ❌ WRONG: Never do this
const apiToken = 'your_replicate_api_token_here'; // Replace with actual token
const apiToken = process.env.EXPO_PUBLIC_REPLICATE_TOKEN; // Exposed to frontend
```

### Input Validation
```typescript
// All inputs are automatically validated:
// - Image format (JPEG/PNG/GIF/WebP only)
// - File size (max 10MB)
// - Base64 encoding validation
// - Parameter sanitization
```

### Rate Limit Enforcement
```typescript
// Automatic rate limiting prevents cost overruns:
// - User tier verification
// - Monthly quota tracking
// - Global daily limits for free users
// - Admin alerts at thresholds
```

## 📊 Rate Limiting Details

### User Tiers
| Tier | Monthly Limit | Cost | Features |
|------|---------------|------|----------|
| Free | 1 generation | $0 | Basic styles, watermarked |
| Plus | 20 generations | $9.99 | All styles, HD quality |
| Pro | 50 generations | $19.99 | Priority processing, commercial use |

### Global Limits
- **Free Daily Limit**: 1,000 generations across all free users
- **Admin Alert**: Triggered at 500 free generations
- **Cost Protection**: Automatic blocking when limits exceeded

### Implementation
```typescript
const rateLimitResult = await rateLimiter.checkRateLimit(userId);

if (!rateLimitResult.allowed) {
  if (rateLimitResult.costPrevention) {
    // Global limit reached - suggest upgrade
    showUpgradePrompt();
  } else {
    // User limit reached - show quota info
    showQuotaExceeded(rateLimitResult.resetTime);
  }
}
```

## 🌍 Internationalization

### Supported Languages
- 🇺🇸 English (en)
- 🇩🇪 German (de)
- 🇪🇸 Spanish (es)
- 🇹🇷 Turkish (tr)

### Error Messages
All error messages are automatically localized:

```typescript
// Error messages adapt to user's language
const error = new RateLimitError('Quota exceeded');
// English: "You have reached your monthly image limit..."
// German: "Sie haben Ihr monatliches Bildlimit erreicht..."
// Spanish: "Has alcanzado tu límite mensual de imágenes..."
// Turkish: "Aylık görüntü limitinize ulaştınız..."
```

## 🧪 Testing

### Run Comprehensive Tests
```typescript
import { testHelper } from '../utils/testHelpers';

// Run all test scenarios
const results = await testHelper.runAllTests();
console.log(`Passed: ${results.passed}, Failed: ${results.failed}`);

// Load test simulation
const loadResults = await testHelper.simulateLoadTest(50, 3);
console.log('Load test results:', loadResults);
```

### Test Scenarios Included
1. **Rate Limit Testing**: Quota enforcement, tier upgrades
2. **Image Validation**: Format checking, size limits
3. **API Error Handling**: Network failures, service errors
4. **Admin Alerts**: Threshold notifications, cost warnings
5. **Error Recovery**: Retry logic, exponential backoff
6. **Performance**: Load testing, response time measurement
7. **Multilingual**: Error message localization
8. **Security**: Input sanitization, API key protection

### Manual Testing Commands
```bash
# Test rate limiting
curl -X POST "your-api-endpoint/test-rate-limit" \
  -H "Content-Type: application/json" \
  -d '{"userId":"test_user","tier":"free"}'

# Test image validation
curl -X POST "your-api-endpoint/test-image" \
  -H "Content-Type: application/json" \
  -d '{"image":"data:image/jpeg;base64,invalid_data"}'
```

## 🔧 Configuration Options

### Service Configuration
```typescript
const replicateService = new ReplicateService({
  apiToken: process.env.REPLICATE_API_TOKEN,
  timeout: 300000,      // 5 minutes
  maxRetries: 3,        // Retry failed requests
  retryDelay: 2000      // 2 second initial delay
});
```

### Rate Limiter Configuration
```typescript
// Customize tier limits
const customLimits: TierLimits = {
  free: { monthly: 2, cost: 0 },
  plus: { monthly: 50, cost: 14.99 },
  pro: { monthly: 100, cost: 29.99 }
};
```

### Error Handler Configuration
```typescript
// Initialize with user context
errorHandler.initialize('user_123', 'plus', 'en');

// Add custom error tracking
errorHandler.addBreadcrumb('User uploaded image', 'ui_action');
```

## 📈 Monitoring & Analytics

### Admin Dashboard Data
```typescript
// Get usage statistics
const stats = await rateLimiter.getUsageStatistics(7); // Last 7 days
/*
{
  totalGenerations: 1250,
  freeGenerations: 800,
  paidGenerations: 450,
  usersByTier: { free: 1200, plus: 45, pro: 12 },
  dailyUsage: [...],
  alerts: [...]
}
*/
```

### Error Monitoring
```typescript
// Get error logs for debugging
const errorLogs = await errorHandler.getErrorLogs(50);
// Returns detailed error information with context
```

### Performance Metrics
```typescript
// Measure operation performance
const perf = await testHelper.measurePerformance(
  () => replicateService.generateHaircut(userId, imageData, params),
  10 // iterations
);
console.log(`Average time: ${perf.averageTime}ms`);
```

## 🚨 Admin Alerts

### Alert Types
1. **Quota Warning**: Approaching global free limit (500/1000)
2. **Quota Exceeded**: Global free limit reached
3. **Cost Limit**: Unusual spending patterns detected
4. **Suspicious Activity**: Multiple blocked users, API abuse

### Alert Destinations
Configure in production:
```typescript
// Email notifications
await sendEmail({
  to: 'admin@barberbuddy.com',
  subject: 'URGENT: Rate limit threshold exceeded',
  body: alertDetails
});

// Slack notifications
await postToSlack({
  channel: '#alerts',
  message: `🚨 Global usage: ${currentUsage}/${limit}`
});

// Push notifications to admin app
await sendPushNotification({
  users: ['admin1', 'admin2'],
  title: 'Rate Limit Alert',
  body: alertMessage
});
```

## 🔄 Error Recovery

### Automatic Retry Logic
```typescript
// Built-in exponential backoff
const retryDelays = [1000, 2000, 4000, 8000]; // milliseconds

// Network errors: 3 retries
// Server errors: 2 retries  
// Rate limits: No retry (user must wait)
// Invalid input: No retry (fix required)
```

### User-Friendly Error Messages
```typescript
// Technical error -> User-friendly message
"Request timeout" -> "Please check your internet connection"
"Invalid API key" -> "Service temporarily unavailable"
"Quota exceeded" -> "You've reached your monthly limit"
```

## 🎨 Available Styles & Colors

### Haircut Styles (50+)
```typescript
const styles = [
  'Bob', 'Pixie Cut', 'Buzz Cut', 'Undercut', 'Fade', 'Mohawk',
  'Afro', 'Dreadlocks', 'Man Bun', 'Ponytail', 'Braids', 'Shag',
  'Layered', 'Beach Waves', 'Curly', 'Straight', 'Wavy'
  // ... and many more
];
```

### Hair Colors (30+)
```typescript
const colors = [
  'Blonde', 'Brunette', 'Black', 'Red', 'Auburn', 'Platinum Blonde',
  'Pink', 'Purple', 'Blue', 'Green', 'Silver', 'Rose Gold',
  'Ombre Blonde', 'Balayage', 'Highlights'
  // ... and many more
];
```

## 🔗 Integration Examples

### With Supabase (User Management)
```typescript
// Store user quota in Supabase
const { data, error } = await supabase
  .from('user_quotas')
  .upsert({
    user_id: userId,
    tier: 'plus',
    monthly_used: 5,
    monthly_limit: 20
  });
```

### With Stripe (Subscription Management)
```typescript
// Handle subscription webhook
const handleSubscriptionUpdate = async (subscription) => {
  const tier = subscription.items.data[0].price.nickname.toLowerCase();
  await replicateService.updateUserTier(subscription.customer, tier);
};
```

### With Sentry (Error Reporting)
```typescript
import * as Sentry from '@sentry/react-native';

// Configure error reporting
Sentry.init({
  dsn: 'your-sentry-dsn'
});

// Errors are automatically sent to Sentry
```

## 🎯 Best Practices

### 1. Security
- Never expose API keys to frontend code
- Validate all inputs before processing
- Use environment variables for all secrets
- Implement proper authentication for admin functions

### 2. Performance
- Cache user quotas locally with expiration
- Use image compression before upload
- Implement progressive loading for results
- Prefetch commonly used styles/colors

### 3. User Experience
- Show clear progress indicators
- Provide helpful error messages
- Implement offline graceful degradation
- Allow easy sharing of results

### 4. Cost Control
- Monitor usage patterns regularly
- Set up automated alerts
- Implement progressive pricing tiers
- Block suspicious activity automatically

## 🐛 Troubleshooting

### Common Issues

**1. "API key invalid" error**
```bash
# Check environment variable
echo $REPLICATE_API_TOKEN

# Verify in code
console.log('API Token length:', process.env.REPLICATE_API_TOKEN?.length);
```

**2. Rate limit not working**
```typescript
// Clear test data
await AsyncStorage.clear();

// Verify quota calculation
const quota = await rateLimiter.getUserQuota(userId);
console.log('Current quota:', quota);
```

**3. Images not generating**
```typescript
// Check image format
const validation = replicateService.validateImage(imageData);
console.log('Image validation:', validation);

// Monitor request status
const status = await replicateService.checkGenerationStatus(requestId);
console.log('Generation status:', status);
```

**4. Localization not working**
```typescript
// Verify language setting
import { useTranslation } from 'react-i18next';
const { i18n } = useTranslation();
console.log('Current language:', i18n.language);

// Test error message
errorHandler.setLanguage('de');
const message = errorHandler.getLocalizedError('RATE_LIMIT_EXCEEDED');
```

## 📞 Support

For implementation support or questions:

1. **Check logs**: All errors are logged with context
2. **Run tests**: Use built-in test suite for debugging
3. **Review documentation**: This README covers most scenarios
4. **Monitor usage**: Check admin dashboard for patterns

## 🚀 Production Deployment

### Pre-deployment Checklist
- [ ] Environment variables configured
- [ ] API keys secured and tested
- [ ] Rate limits properly configured
- [ ] Admin alerts set up
- [ ] Error monitoring enabled
- [ ] Load testing completed
- [ ] Localization verified
- [ ] Security audit passed

### Monitoring Setup
```typescript
// Production monitoring
const productionConfig = {
  errorReporting: 'sentry',
  analytics: 'mixpanel',
  logging: 'datadog',
  alerts: 'pagerduty'
};
```

---

**Built with ❤️ for BarberBuddy - Secure, scalable, and user-friendly AI haircut generation.**
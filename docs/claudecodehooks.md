# Barber Buddy Claude Code Hooks

**Production-Grade Mobile AI Haircut Preview App - Development Automation**

This hooks configuration ensures Claude Code adheres to Barber Buddy's strict MVP boundaries, security requirements, and production standards during development.

## Hook Configuration Overview

These hooks enforce the core principles from the Barber Buddy specification:
- **MVP Feature Boundaries**: Block implementation of non-MVP features
- **Security & Privacy**: Enforce encryption and data protection standards
- **Mobile-First Development**: Ensure React Native/Expo compliance
- **Multi-language Support**: Validate i18n implementation
- **Production Quality**: Maintain App Store/Play Store readiness

## Security Considerations

⚠️ **CRITICAL**: These hooks run with your environment credentials. Review all commands before registration. All hooks store sensitive validation logic in encrypted user settings.

## Hook Implementations

### 1. MVP Feature Boundary Enforcement

**Event**: `PreToolUse`  
**Matcher**: `EditFile`  
**Purpose**: Block implementation of features outside MVP scope

```bash
#!/bin/bash
# Validate that file changes don't introduce non-MVP features
FILE_PATH=$(echo "$CLAUDE_TOOL_INPUT" | jq -r '.path // empty')

# Block any non-MVP feature keywords in code
BLOCKED_FEATURES="marketplace_booking|barber_search|face_analysis|personalization|education_content"

if grep -iE "$BLOCKED_FEATURES" "$FILE_PATH" 2>/dev/null; then
  echo "❌ BLOCKED: Non-MVP feature detected in $FILE_PATH"
  echo "MVP ONLY: photo upload, haircut selection, AI preview, basic subscription"
  echo "Advanced features must be implemented via paywall/upgrade screen only"
  exit 1
fi

# Validate marketplace is always grayed out
if [[ "$FILE_PATH" == *"Marketplace"* ]] && ! grep -q "Coming soon" "$FILE_PATH" 2>/dev/null; then
  echo "❌ BLOCKED: Marketplace must be grayed out with 'Coming soon' label"
  exit 1
fi

exit 0
```

### 2. React Native/Expo Compliance

**Event**: `PreToolUse`  
**Matcher**: `CreateFile`  
**Purpose**: Ensure all new files follow React Native/Expo patterns

```bash
#!/bin/bash
FILE_PATH=$(echo "$CLAUDE_TOOL_INPUT" | jq -r '.path // empty')

# Ensure React Native imports and mobile-first patterns
if [[ "$FILE_PATH" == *.tsx ]] || [[ "$FILE_PATH" == *.ts ]]; then
  CONTENT=$(echo "$CLAUDE_TOOL_INPUT" | jq -r '.content // empty')
  
  # Check for mobile-optimized imports
  if echo "$CONTENT" | grep -q "react-native" && ! echo "$CONTENT" | grep -q "import.*react-native"; then
    echo "❌ BLOCKED: Missing proper React Native imports in $FILE_PATH"
    echo "Required: import { ... } from 'react-native'"
    exit 1
  fi
  
  # Ensure TypeScript usage
  if [[ "$FILE_PATH" == *.js ]] || [[ "$FILE_PATH" == *.jsx ]]; then
    echo "❌ BLOCKED: Use TypeScript (.ts/.tsx) files only. Found: $FILE_PATH"
    exit 1
  fi
fi

exit 0
```

### 3. Security & Privacy Validation

**Event**: `PreToolUse`  
**Matcher**: `Bash`  
**Purpose**: Block commands that could compromise security

```bash
#!/bin/bash
COMMAND=$(echo "$CLAUDE_TOOL_INPUT" | jq -r '.command // empty')

# Block hardcoded secrets
if echo "$COMMAND" | grep -iE "(api_key|secret|password|token).*=" | grep -v "process.env"; then
  echo "❌ BLOCKED: Hardcoded secrets detected"
  echo "Required: Use environment variables only (.env file)"
  exit 1
fi

# Block insecure image handling
if echo "$COMMAND" | grep -q "upload" && ! echo "$COMMAND" | grep -qE "(encrypt|secure|privacy)"; then
  echo "❌ BLOCKED: Image uploads must use secure/encrypted methods"
  echo "Required: Implement with Supabase secure storage"
  exit 1
fi

exit 0
```

### 4. Multi-language (i18n) Validation

**Event**: `PostToolUse`  
**Matcher**: `EditFile`  
**Purpose**: Ensure proper internationalization implementation

```bash
#!/bin/bash
FILE_PATH=$(echo "$CLAUDE_TOOL_INPUT" | jq -r '.path // empty')

# Check if file contains user-facing text without i18n
if [[ "$FILE_PATH" == *.tsx ]] && grep -q "Text>" "$FILE_PATH"; then
  if ! grep -q "useTranslation\|t(" "$FILE_PATH"; then
    echo "⚠️  WARNING: User-facing text detected without i18n in $FILE_PATH"
    echo "Required languages: EN, DE, ES, TR"
    echo "Use: const { t } = useTranslation() and t('key')"
  fi
fi

# Validate translation key format
if [[ "$FILE_PATH" == *"locales"* ]] && [[ "$FILE_PATH" == *.json ]]; then
  if ! jq empty "$FILE_PATH" 2>/dev/null; then
    echo "❌ BLOCKED: Invalid JSON in translation file $FILE_PATH"
    exit 1
  fi
fi

exit 0
```

### 5. Subscription & Paywall Enforcement

**Event**: `PreToolUse`  
**Matcher**: `EditFile`  
**Purpose**: Ensure proper subscription boundaries

```bash
#!/bin/bash
FILE_PATH=$(echo "$CLAUDE_TOOL_INPUT" | jq -r '.path // empty')
CONTENT=$(echo "$CLAUDE_TOOL_INPUT" | jq -r '.content // empty')

# Validate subscription tiers
if echo "$CONTENT" | grep -q "subscription\|plan\|upgrade"; then
  if ! echo "$CONTENT" | grep -qE "4\.99|9\.99|Plus|Pro"; then
    echo "❌ BLOCKED: Invalid subscription pricing detected"
    echo "Required: Plus ($4.99/mo), Pro ($9.99/mo)"
    exit 1
  fi
fi

# Ensure free tier limitations
if echo "$CONTENT" | grep -q "free.*user" && ! echo "$CONTENT" | grep -q "1.*image"; then
  echo "❌ BLOCKED: Free tier must be limited to 1 image per user"
  exit 1
fi

exit 0
```

### 6. AI Model Integration Validation

**Event**: `PreToolUse`  
**Matcher**: `EditFile`  
**Purpose**: Ensure proper Replicate Flux Komplex integration

```bash
#!/bin/bash
FILE_PATH=$(echo "$CLAUDE_TOOL_INPUT" | jq -r '.path // empty')
CONTENT=$(echo "$CLAUDE_TOOL_INPUT" | jq -r '.content // empty')

# Validate AI model usage
if echo "$CONTENT" | grep -q "replicate\|flux.*komplex"; then
  # Ensure character consistency warning
  if ! echo "$CONTENT" | grep -q "character.*consistency"; then
    echo "⚠️  WARNING: Missing character consistency warning in AI integration"
    echo "Required: Warn users that custom prompts may affect character consistency"
  fi
  
  # Ensure only hair changes
  if ! echo "$CONTENT" | grep -qE "(hair.*only|face.*unchanged|background.*preserved)"; then
    echo "❌ BLOCKED: AI model must preserve face and background"
    echo "Required: Only hair modifications allowed"
    exit 1
  fi
fi

exit 0
```

### 7. Testing & Quality Assurance

**Event**: `PostToolUse`  
**Matcher**: `CreateFile`  
**Purpose**: Ensure test coverage for critical components

```bash
#!/bin/bash
FILE_PATH=$(echo "$CLAUDE_TOOL_INPUT" | jq -r '.path // empty')

# Generate test files for critical components
if [[ "$FILE_PATH" == *"components"* ]] && [[ "$FILE_PATH" == *.tsx ]]; then
  COMPONENT_NAME=$(basename "$FILE_PATH" .tsx)
  TEST_FILE="__tests__/${COMPONENT_NAME}.test.tsx"
  
  if [[ ! -f "$TEST_FILE" ]]; then
    echo "⚠️  SUGGESTION: Create test file for $COMPONENT_NAME"
    echo "Location: $TEST_FILE"
    echo "Required: Jest + React Native Testing Library"
  fi
fi

# Validate Playwright E2E tests exist for critical flows
if [[ "$FILE_PATH" == *"screens"* ]] && [[ "$FILE_PATH" == *.tsx ]]; then
  SCREEN_NAME=$(basename "$FILE_PATH" .tsx)
  E2E_TEST="e2e/${SCREEN_NAME,,}.spec.ts"
  
  if [[ ! -f "$E2E_TEST" ]]; then
    echo "⚠️  SUGGESTION: Create E2E test for $SCREEN_NAME screen"
    echo "Location: $E2E_TEST"
    echo "Required: Playwright with multi-language testing"
  fi
fi

exit 0
```

### 8. Code Quality & Standards

**Event**: `PostToolUse`  
**Matcher**: `EditFile`  
**Purpose**: Automatic code formatting and quality checks

```bash
#!/bin/bash
FILE_PATH=$(echo "$CLAUDE_TOOL_INPUT" | jq -r '.path // empty')

# Auto-format TypeScript/JavaScript files
if [[ "$FILE_PATH" == *.ts ]] || [[ "$FILE_PATH" == *.tsx ]]; then
  if command -v prettier &> /dev/null; then
    prettier --write "$FILE_PATH"
    echo "✅ Formatted: $FILE_PATH"
  fi
fi

# Run ESLint for React Native compliance
if [[ "$FILE_PATH" == *.tsx ]] && command -v eslint &> /dev/null; then
  if ! eslint "$FILE_PATH" --config .eslintrc.js; then
    echo "⚠️  WARNING: ESLint issues detected in $FILE_PATH"
  fi
fi

exit 0
```

### 9. Deployment Readiness Check

**Event**: `Stop`  
**Purpose**: Validate production readiness before deployment

```bash
#!/bin/bash

echo "🔍 Running Barber Buddy deployment readiness check..."

# Check environment variables
if [[ ! -f ".env" ]]; then
  echo "❌ MISSING: .env file required for production"
  exit 1
fi

# Validate required services configuration
REQUIRED_VARS="REPLICATE_API_TOKEN SUPABASE_URL SUPABASE_ANON_KEY STRIPE_PUBLISHABLE_KEY"
for var in $REQUIRED_VARS; do
  if ! grep -q "$var" .env; then
    echo "❌ MISSING: $var in .env file"
    exit 1
  fi
done

# Check translation completeness
LANGUAGES="en de es tr"
for lang in $LANGUAGES; do
  if [[ ! -f "locales/$lang/common.json" ]]; then
    echo "❌ MISSING: Translation file for $lang"
    exit 1
  fi
done

# Validate App Store/Play Store compliance
if [[ ! -f "app.json" ]] || ! grep -q "privacy" app.json; then
  echo "❌ MISSING: Privacy policy configuration in app.json"
  exit 1
fi

echo "✅ Deployment readiness check passed"
exit 0
```

### 10. Performance Monitoring

**Event**: `PostToolUse`  
**Matcher**: `Bash`  
**Purpose**: Log performance metrics for mobile optimization

```bash
#!/bin/bash
COMMAND=$(echo "$CLAUDE_TOOL_INPUT" | jq -r '.command // empty')

# Log bundle size for mobile optimization
if echo "$COMMAND" | grep -q "expo.*build\|react-native.*build"; then
  TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
  echo "[$TIMESTAMP] Build command executed: $COMMAND" >> ~/.claude/barber-buddy-performance.log
  
  # Check bundle size if build succeeds
  if [[ -f "dist/main.js" ]]; then
    SIZE=$(du -h dist/main.js | cut -f1)
    echo "[$TIMESTAMP] Bundle size: $SIZE" >> ~/.claude/barber-buddy-performance.log
    
    # Warn if bundle is too large for mobile
    if [[ $(du -k dist/main.js | cut -f1) -gt 5000 ]]; then
      echo "⚠️  WARNING: Bundle size ($SIZE) may impact mobile performance"
      echo "Consider code splitting or lazy loading for better UX"
    fi
  fi
fi

exit 0
```

## Installation Instructions

1. **Open Claude Code hooks configuration**:
   ```
   /hooks
   ```

2. **Add each hook systematically**:
   - Select appropriate event type (PreToolUse, PostToolUse, Stop)
   - Set matcher (EditFile, CreateFile, Bash, etc.)
   - Paste hook command
   - Choose "User settings" for project-wide application

3. **Verify configuration**:
   ```bash
   cat ~/.claude/settings.json
   ```

4. **Test hooks**:
   ```bash
   # Test file creation
   echo "Test file" > test.tsx
   
   # Test command execution  
   ls -la
   
   # Check logs
   tail -f ~/.claude/barber-buddy-performance.log
   ```

## Hook Event Reference

- **PreToolUse**: Validates and blocks actions before execution
- **PostToolUse**: Provides feedback and performs cleanup after execution  
- **Stop**: Runs final checks when Claude Code completes a response
- **Notification**: Customizes alerts and notifications
- **SubagentStop**: Handles subagent task completion

## Debugging Hooks

View hook execution logs:
```bash
# General Claude Code logs
tail -f ~/.claude/debug.log

# Barber Buddy specific logs  
tail -f ~/.claude/barber-buddy-*.log

# Hook configuration
jq '.hooks' ~/.claude/settings.json
```

## Security Best Practices

1. **Review all hook commands** before registration
2. **Use relative paths** to avoid system-wide changes
3. **Validate input** from CLAUDE_TOOL_INPUT environment variable
4. **Store sensitive logic** in user settings only
5. **Test hooks in development** before production use

## Maintenance

Update hooks when:
- MVP scope changes
- New security requirements emerge
- React Native/Expo versions update
- App Store guidelines change
- Performance benchmarks shift

These hooks ensure Barber Buddy maintains production quality, security compliance, and MVP focus throughout development while providing immediate feedback on violations
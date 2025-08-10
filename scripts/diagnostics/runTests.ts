#!/usr/bin/env tsx

/**
 * API Test Runner
 * 
 * This script runs comprehensive tests on all API integrations
 * and provides detailed feedback on their status and configuration.
 * 
 * Usage: npm run test:apis
 */

import { APIHealthChecker } from './apiHealth';

async function runTests() {
  console.log('🚀 BarberBuddy API Test Suite');
  console.log('='.repeat(50));
  console.log('Testing all external API integrations...\n');

  try {
    const results = await APIHealthChecker.runFullDiagnostics();
    
    // Calculate pass/fail
    const passed = results.filter(r => r.status === 'OK').length;
    const failed = results.filter(r => r.status === 'ERROR').length;
    const warnings = results.filter(r => r.status === 'WARNING').length;
    
    console.log(`\n📈 TEST RESULTS:`);
    console.log(`   ✅ Passed: ${passed}`);
    console.log(`   ⚠️  Warnings: ${warnings}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📊 Total: ${results.length}`);
    
    // Exit with appropriate code
    if (failed > 0) {
      console.log('\n❌ Some tests failed. Check the errors above.');
      process.exit(1);
    } else if (warnings > 0) {
      console.log('\n⚠️  All tests passed but there are warnings.');
      process.exit(0);
    } else {
      console.log('\n🎉 All tests passed!');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('\n💥 Test suite crashed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runTests();
}
import { APIHealthChecker } from '../scripts/diagnostics/apiHealth';

/**
 * API Diagnostics Endpoint
 * 
 * This endpoint provides comprehensive API health checking for all external services.
 * It verifies credentials, tests connectivity, and validates account identity.
 * 
 * Security Notes:
 * - Never returns actual API keys or tokens
 * - Only returns sanitized account information
 * - Includes environment validation to prevent wrong account usage
 */
export default async function handler(req: any, res: any) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only GET requests are supported'
    });
  }

  try {
    console.log('🔍 Starting API diagnostics...');
    
    // Run comprehensive health checks
    const results = await APIHealthChecker.runFullDiagnostics();
    
    // Get environment mapping (without sensitive values)
    const envMapping = APIHealthChecker.getEnvironmentMapping()
      .map(env => ({
        key: env.key,
        source: env.source,
        configured: !!env.value,
        format: env.secure && env.value ? 
          `${env.value.substring(0, 8)}...` : 
          env.value ? 'SET' : 'NOT_SET'
      }));

    // Calculate overall health
    const healthy = results.filter(r => r.status === 'OK').length;
    const total = results.length;
    const overallStatus = healthy === total ? 'HEALTHY' : 
                         healthy > 0 ? 'PARTIAL' : 'UNHEALTHY';

    // Prepare response
    const response = {
      timestamp: new Date().toISOString(),
      status: overallStatus,
      summary: {
        healthy,
        total,
        percentage: Math.round((healthy / total) * 100)
      },
      environment: {
        platform: 'react-native',
        variables: envMapping
      },
      services: results.map(result => ({
        service: result.service,
        status: result.status,
        configured: result.details.configured,
        accessible: result.details.accessible,
        verified: result.details.verified || false,
        account: result.details.accountInfo ? {
          // Only return safe, non-sensitive account info
          id: result.details.accountInfo.id || null,
          name: result.details.accountInfo.businessName || null,
          mode: result.details.accountInfo.mode || null,
          url: result.details.accountInfo.url || null
        } : null,
        error: result.details.error || null
      }))
    };

    // Set appropriate status code
    const statusCode = overallStatus === 'HEALTHY' ? 200 : 
                      overallStatus === 'PARTIAL' ? 206 : 500;

    res.status(statusCode).json(response);
    
  } catch (error) {
    console.error('❌ Diagnostics failed:', error);
    
    res.status(500).json({
      error: 'DIAGNOSTICS_FAILED',
      message: 'Unable to complete API health check',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
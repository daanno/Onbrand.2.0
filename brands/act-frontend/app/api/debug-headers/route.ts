import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * API route that returns all headers
 * Used for debugging middleware
 */
export async function GET(request: NextRequest) {
  try {
    // Get headers directly from the request instead of using headers()
    const brandSubdomain = request.headers.get('x-brand-subdomain');
    const hostname = request.headers.get('x-hostname');
    
    // Create a response with the extracted header info
    const response = NextResponse.json({
      message: 'Debug headers endpoint',
      timestamp: new Date().toISOString(),
      headers: {
        'x-brand-subdomain': brandSubdomain || 'Not set',
        'x-hostname': hostname || 'Not set'
      }
    });
    
    // Add custom debug headers
    response.headers.set('x-debug-middleware', 'true');
    
    return response;
  } catch (error) {
    console.error('Error processing headers:', error);
    return NextResponse.json({ error: 'Failed to process headers' }, { status: 500 });
  }
}

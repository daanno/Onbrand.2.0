// Simple test script for middleware.ts
import { NextResponse } from 'next/server';

// Mock the middleware function since we can't import it directly in a script
function mockMiddleware(hostname, path) {
  console.log(`\n--- Testing with hostname: ${hostname}, path: ${path} ---`);
  
  // Extract subdomain (similar to middleware.ts)
  const subdomain = hostname.split('.')[0];
  console.log(`Extracted subdomain: ${subdomain}`);
  
  // Check if this is a parent domain
  const isParentDomain = 
    hostname === 'onbrand.ai' || 
    hostname === 'www.onbrand.ai' ||
    hostname === 'onbrandai.app' ||
    hostname === 'www.onbrandai.app' ||
    hostname.startsWith('localhost');
  
  console.log(`Is parent domain: ${isParentDomain}`);
  
  // Check if root path redirect applies
  const shouldRedirect = isParentDomain && (path === '/' || path === '');
  console.log(`Should redirect to marketing: ${shouldRedirect}`);
  
  // Create mock headers
  console.log(`Setting headers:
  x-brand-subdomain: ${subdomain}
  x-hostname: ${hostname}`);
  
  return {
    type: shouldRedirect ? 'redirect' : 'next',
    target: shouldRedirect ? '/marketing' : null,
    headers: {
      'x-brand-subdomain': subdomain,
      'x-hostname': hostname
    }
  };
}

// Test scenarios
const scenarios = [
  { hostname: 'act.onbrand.ai', path: '/' },
  { hostname: 'acme.onbrand.ai', path: '/dashboard' },
  { hostname: 'onbrand.ai', path: '/' },
  { hostname: 'www.onbrand.ai', path: '/about' },
  { hostname: 'onbrandai.app', path: '/' },
  { hostname: 'localhost:3000', path: '/' },
];

// Run all tests
console.log('=== MIDDLEWARE FUNCTIONALITY TESTS ===');
scenarios.forEach(scenario => {
  const result = mockMiddleware(scenario.hostname, scenario.path);
  console.log(`Result: ${result.type}${result.target ? ' -> ' + result.target : ''}`);
  console.log('-----------------------------------');
});

// Test brand detection function (similar to lib/brand.ts)
function mockDetectBrandId(headers, hostname) {
  console.log(`\n--- Testing brand detection ---`);
  
  // Case 1: Server-side (with headers)
  if (headers) {
    const subdomain = headers['x-brand-subdomain'];
    console.log(`Server-side detection with header: ${subdomain}`);
    if (subdomain && subdomain !== 'localhost' && subdomain !== 'www') {
      return subdomain;
    }
  }
  
  // Case 2: Client-side (with hostname)
  if (hostname) {
    const subdomain = hostname.split('.')[0];
    console.log(`Client-side detection from hostname: ${subdomain}`);
    
    if (hostname.includes('localhost')) {
      console.log('Using default for localhost');
      return 'act';
    }
    
    if (subdomain === 'onbrand' || subdomain === 'www') {
      console.log('Using default for main domain');
      return 'act';
    }
    
    return subdomain;
  }
  
  // Fallback
  return 'act';
}

// Test brand detection scenarios
const brandScenarios = [
  { name: "Server headers with subdomain", headers: { 'x-brand-subdomain': 'acme' } },
  { name: "Server headers with localhost", headers: { 'x-brand-subdomain': 'localhost' } },
  { name: "Server headers with www", headers: { 'x-brand-subdomain': 'www' } },
  { name: "Client hostname with subdomain", hostname: 'nike.onbrand.ai' },
  { name: "Client hostname with localhost", hostname: 'localhost:3000' },
  { name: "Client hostname with www", hostname: 'www.onbrand.ai' },
];

console.log('\n=== BRAND DETECTION TESTS ===');
brandScenarios.forEach(scenario => {
  console.log(`\nScenario: ${scenario.name}`);
  const brandId = mockDetectBrandId(scenario.headers, scenario.hostname);
  console.log(`Detected brand ID: ${brandId}`);
  console.log('-----------------------------------');
});

console.log('\nAll tests completed.');

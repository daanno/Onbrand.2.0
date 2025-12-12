/**
 * Simple test script to validate middleware logic
 * (avoids Next.js dependencies)
 */

console.log('=== MIDDLEWARE FUNCTIONALITY TESTS ===\n');

// Test various hostnames and paths
const testCases = [
  { hostname: 'act.onbrand.ai', path: '/', expectedRedirect: false, expectedBrand: 'act' },
  { hostname: 'acme.onbrand.ai', path: '/', expectedRedirect: false, expectedBrand: 'acme' },
  { hostname: 'onbrand.ai', path: '/', expectedRedirect: true, expectedBrand: 'onbrand' },
  { hostname: 'www.onbrand.ai', path: '/', expectedRedirect: true, expectedBrand: 'www' },
  { hostname: 'onbrandai.app', path: '/', expectedRedirect: true, expectedBrand: 'onbrandai' },
  { hostname: 'www.onbrandai.app', path: '/', expectedRedirect: true, expectedBrand: 'www' },
  { hostname: 'localhost:3000', path: '/', expectedRedirect: true, expectedBrand: 'localhost' },
  { hostname: 'localhost:3000', path: '/dashboard', expectedRedirect: false, expectedBrand: 'localhost' },
  { hostname: 'onbrand.ai', path: '/about', expectedRedirect: false, expectedBrand: 'onbrand' },
];

testCases.forEach((testCase, index) => {
  console.log(`Test Case ${index + 1}: ${testCase.hostname}${testCase.path}`);
  
  // Extract subdomain like the middleware would
  const subdomain = testCase.hostname.split('.')[0];
  console.log(`  Extracted subdomain: ${subdomain}`);
  
  // Check parent domain logic
  const isParentDomain = 
    testCase.hostname === 'onbrand.ai' || 
    testCase.hostname === 'www.onbrand.ai' ||
    testCase.hostname === 'onbrandai.app' ||
    testCase.hostname === 'www.onbrandai.app' ||
    testCase.hostname.startsWith('localhost');
  
  console.log(`  Is parent domain: ${isParentDomain}`);
  
  // Check redirect logic
  const shouldRedirect = isParentDomain && (testCase.path === '/' || testCase.path === '');
  console.log(`  Should redirect to marketing: ${shouldRedirect}`);
  
  // Headers to be set
  console.log(`  Headers to be set:
    x-brand-subdomain: ${subdomain}
    x-hostname: ${testCase.hostname}`);
  
  // Validate expected results
  const redirectMatches = shouldRedirect === testCase.expectedRedirect;
  const brandMatches = subdomain === testCase.expectedBrand;
  
  console.log(`  Results: ${redirectMatches && brandMatches ? '✅ PASS' : '❌ FAIL'}`);
  if (!redirectMatches) {
    console.log(`    - Redirect behavior incorrect. Expected: ${testCase.expectedRedirect}, Got: ${shouldRedirect}`);
  }
  if (!brandMatches) {
    console.log(`    - Brand extraction incorrect. Expected: ${testCase.expectedBrand}, Got: ${subdomain}`);
  }
  
  console.log('');
});

// Test brand detection logic
console.log('\n=== BRAND DETECTION TESTS ===\n');

const brandTestCases = [
  { 
    name: 'Server-side with valid brand',
    serverSide: true, 
    headerSubdomain: 'acme',
    expectedBrand: 'acme'
  },
  { 
    name: 'Server-side with localhost',
    serverSide: true, 
    headerSubdomain: 'localhost',
    expectedBrand: 'act' // Default
  },
  { 
    name: 'Server-side with www',
    serverSide: true, 
    headerSubdomain: 'www',
    expectedBrand: 'act' // Default
  },
  { 
    name: 'Client-side with valid brand',
    serverSide: false, 
    hostname: 'acme.onbrand.ai',
    expectedBrand: 'acme'
  },
  { 
    name: 'Client-side with localhost',
    serverSide: false, 
    hostname: 'localhost:3000',
    expectedBrand: 'act' // Default
  },
  { 
    name: 'Client-side with onbrand domain',
    serverSide: false, 
    hostname: 'onbrand.ai',
    expectedBrand: 'act' // Default
  },
  { 
    name: 'Client-side with www domain',
    serverSide: false, 
    hostname: 'www.onbrand.ai',
    expectedBrand: 'act' // Default
  },
];

brandTestCases.forEach((testCase, index) => {
  console.log(`Brand Test Case ${index + 1}: ${testCase.name}`);
  
  let detectedBrand = 'act'; // Default
  
  if (testCase.serverSide) {
    // Simulate server-side detection
    const subdomain = testCase.headerSubdomain;
    console.log(`  Server header x-brand-subdomain: ${subdomain}`);
    
    if (subdomain && subdomain !== 'localhost' && subdomain !== 'www') {
      // Assuming the subdomain is in BRAND_CONFIGS
      detectedBrand = subdomain;
    }
  } else {
    // Simulate client-side detection
    const hostname = testCase.hostname;
    const subdomain = hostname.split('.')[0];
    console.log(`  Client hostname: ${hostname}, extracted subdomain: ${subdomain}`);
    
    if (hostname.includes('localhost')) {
      detectedBrand = 'act'; // Default
    } else if (subdomain === 'onbrand' || subdomain === 'www') {
      detectedBrand = 'act'; // Default
    } else {
      // Assuming the subdomain is in BRAND_CONFIGS
      detectedBrand = subdomain;
    }
  }
  
  // Validate results
  const brandMatches = detectedBrand === testCase.expectedBrand;
  console.log(`  Detected brand: ${detectedBrand}`);
  console.log(`  Result: ${brandMatches ? '✅ PASS' : '❌ FAIL'}`);
  
  if (!brandMatches) {
    console.log(`    - Brand detection incorrect. Expected: ${testCase.expectedBrand}, Got: ${detectedBrand}`);
  }
  
  console.log('');
});

console.log('All tests complete!');

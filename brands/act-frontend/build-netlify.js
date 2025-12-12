#!/usr/bin/env node

// Simple build script for Netlify
const { execSync } = require('child_process');

console.log('Running Netlify build script...');

// Set default environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
process.env.NEXT_PUBLIC_MAIN_DOMAIN = process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'onbrandai.app';
process.env.NEXT_PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://onbrandai.app';

try {
  console.log('Running next build...');
  
  execSync('cd ../../ && pnpm --filter=act-frontend exec next build', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      NEXT_TELEMETRY_DISABLED: '1',
      NODE_OPTIONS: '--no-warnings'
    }
  });
  
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build error:', error);
  process.exit(1);
}

#!/usr/bin/env node

// Simplified build script for Netlify
const { execSync } = require('child_process');

console.log('Running Netlify build for act-frontend...');

// Set fallback environment variables (should be overridden by Netlify env vars)
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pyvobennsmzyvtaceopn.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5dm9iZW5uc216eXZ0YWNlb3BuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NDEwNDksImV4cCI6MjA3OTIxNzA0OX0.-osk8vo0I8WI6i2UHl7TORcGAv-oZbSsxEVqxL79zVE';
process.env.NEXT_TELEMETRY_DISABLED = '1';

try {
  console.log('Building Next.js app...');
  execSync('pnpm exec next build', { 
    stdio: 'inherit',
    cwd: __dirname
  });
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}

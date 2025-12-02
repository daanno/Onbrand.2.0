/**
 * Brand Detection Utility
 * 
 * Detects which brand the user is accessing based on:
 * 1. Subdomain (e.g., act.yourdomain.com, acme.yourdomain.com)
 * 2. Environment variable override (for development)
 * 3. Defaults to 'act' for localhost and unknown domains
 */

export interface BrandConfig {
  id: string;
  name: string;
  displayName: string;
  domain: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  logo?: string;
  favicon?: string;
}

// Brand configuration registry
const BRAND_CONFIGS: Record<string, BrandConfig> = {
  act: {
    id: 'act',
    name: 'act',
    displayName: 'ACT 2.0',
    domain: 'act',
    colors: {
      primary: '#000000',
      secondary: '#FFFFFF',
      accent: '#FF6B35',
    },
  },
  acme: {
    id: 'acme',
    name: 'acme',
    displayName: 'Acme Corp',
    domain: 'acme',
    colors: {
      primary: '#1E40AF',
      secondary: '#FFFFFF',
      accent: '#F59E0B',
    },
  },
  // Add more brands here as needed
};

/**
 * Detects the current brand from hostname or environment
 * 
 * Detection logic:
 * 1. Check NEXT_PUBLIC_BRAND_ID env var (for development)
 * 2. Extract subdomain from hostname
 * 3. Default to 'act' if not found
 * 
 * Examples:
 * - act.yourdomain.com → 'act'
 * - acme.yourdomain.com → 'acme'
 * - localhost:3000 → 'act' (default)
 * - yourdomain.com → 'act' (default)
 */
export function detectBrandId(): string {
  // Check for environment override (useful for development)
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_BRAND_ID) {
    return process.env.NEXT_PUBLIC_BRAND_ID;
  }

  // Extract from hostname in browser
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;

    // localhost or IP address - use default
    if (hostname === 'localhost' || hostname === '127.0.0.1' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
      return process.env.NEXT_PUBLIC_BRAND_ID || 'act';
    }

    // Extract subdomain
    // Examples:
    // - act.yourdomain.com → ['act', 'yourdomain', 'com']
    // - acme.staging.yourdomain.com → ['acme', 'staging', 'yourdomain', 'com']
    const parts = hostname.split('.');

    // If we have a subdomain (more than 2 parts for .com, more than 3 for .co.uk)
    if (parts.length >= 2) {
      const subdomain = parts[0];
      
      // Check if subdomain matches a known brand
      if (BRAND_CONFIGS[subdomain]) {
        return subdomain;
      }
    }
  }

  // Default to 'act'
  return 'act';
}

/**
 * Gets the full brand configuration for the current brand
 */
export function getBrandConfig(): BrandConfig {
  const brandId = detectBrandId();
  return BRAND_CONFIGS[brandId] || BRAND_CONFIGS.act;
}

/**
 * Gets all available brand configurations
 */
export function getAllBrands(): BrandConfig[] {
  return Object.values(BRAND_CONFIGS);
}

/**
 * Checks if a brand ID is valid
 */
export function isValidBrand(brandId: string): boolean {
  return brandId in BRAND_CONFIGS;
}

/**
 * Gets brand-specific redirect URL for OAuth callbacks
 */
export function getBrandCallbackUrl(): string {
  if (typeof window === 'undefined') {
    return '/auth/callback';
  }
  return `${window.location.origin}/auth/callback`;
}

/**
 * Server-side brand detection from hostname
 * Use this in API routes or server components
 */
export function detectBrandIdFromHostname(hostname: string): string {
  // Check for localhost or IP
  if (hostname === 'localhost' || hostname === '127.0.0.1' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    return 'act';
  }

  const parts = hostname.split('.');
  if (parts.length >= 2) {
    const subdomain = parts[0];
    if (BRAND_CONFIGS[subdomain]) {
      return subdomain;
    }
  }

  return 'act';
}

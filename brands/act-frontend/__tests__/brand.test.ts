import { describe, it, expect, vi, beforeEach } from 'vitest';
import { detectBrandId, getBrandConfig } from '../lib/brand';

// Extend globalThis type
declare global {
  var mockHeaderSubdomain: string | null;
}

// Mock window and headers
vi.mock('next/headers', () => ({
  headers: vi.fn(() => ({
    get: vi.fn((key) => {
      if (key === 'x-brand-subdomain') {
        return globalThis.mockHeaderSubdomain;
      }
      return null;
    }),
  })),
}));

describe('Brand Detection', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Reset globals
    globalThis.mockHeaderSubdomain = null;
    
    // Reset window
    if (typeof window !== 'undefined') {
      Object.defineProperty(window, 'location', {
        value: {
          hostname: 'example.com',
        },
        writable: true,
      });
    }
    
    // Reset process env
    process.env.NEXT_PUBLIC_BRAND_ID = undefined;
    process.env.NEXT_PUBLIC_DEFAULT_BRAND = undefined;
  });

  describe('Server-side detection', () => {
    it('should detect brand from middleware header', () => {
      // Setup server environment
      vi.stubGlobal('window', undefined);
      globalThis.mockHeaderSubdomain = 'acme';
      
      const result = detectBrandId();
      expect(result).toBe('acme');
    });
    
    it('should use default brand when subdomain is localhost', () => {
      // Setup server environment
      vi.stubGlobal('window', undefined);
      globalThis.mockHeaderSubdomain = 'localhost';
      
      const result = detectBrandId();
      expect(result).toBe('act'); // Default brand
    });
    
    it('should use default brand when subdomain is www', () => {
      // Setup server environment
      vi.stubGlobal('window', undefined);
      globalThis.mockHeaderSubdomain = 'www';
      
      const result = detectBrandId();
      expect(result).toBe('act'); // Default brand
    });
    
    it('should use default brand when header is missing', () => {
      // Setup server environment
      vi.stubGlobal('window', undefined);
      globalThis.mockHeaderSubdomain = null;
      
      const result = detectBrandId();
      expect(result).toBe('act'); // Default brand
    });
  });
  
  describe('Client-side detection', () => {
    beforeEach(() => {
      // Setup browser environment
      vi.stubGlobal('window', {
        location: {
          hostname: 'example.com',
        },
      });
    });
    
    it('should use env override if available', () => {
      process.env.NEXT_PUBLIC_BRAND_ID = 'acme';
      
      const result = detectBrandId();
      expect(result).toBe('acme');
    });
    
    it('should detect brand from hostname', () => {
      window.location.hostname = 'acme.onbrand.ai';
      
      const result = detectBrandId();
      expect(result).toBe('acme');
    });
    
    it('should use default brand for localhost', () => {
      window.location.hostname = 'localhost:3000';
      process.env.NEXT_PUBLIC_DEFAULT_BRAND = 'acme';
      
      const result = detectBrandId();
      expect(result).toBe('acme');
    });
    
    it('should use default brand for onbrand domain', () => {
      window.location.hostname = 'onbrand.ai';
      process.env.NEXT_PUBLIC_DEFAULT_BRAND = 'acme';
      
      const result = detectBrandId();
      expect(result).toBe('acme');
    });
    
    it('should use default brand for www domain', () => {
      window.location.hostname = 'www.onbrand.ai';
      process.env.NEXT_PUBLIC_DEFAULT_BRAND = 'acme';
      
      const result = detectBrandId();
      expect(result).toBe('acme');
    });
    
    it('should use fallback when no detection methods succeed', () => {
      window.location.hostname = 'unknown.example.com';
      
      const result = detectBrandId();
      expect(result).toBe('act'); // Default fallback
    });
  });
  
  describe('Brand Configuration', () => {
    it('should return the correct brand config for a valid brand', () => {
      // Setup to return a specific brand
      vi.stubGlobal('window', undefined);
      globalThis.mockHeaderSubdomain = 'act';
      
      const config = getBrandConfig();
      expect(config.id).toBe('act');
      expect(config.displayName).toBe('ACT 2.0');
    });
    
    it('should return default brand config for an invalid brand', () => {
      // Setup to return an invalid brand
      vi.stubGlobal('window', undefined);
      globalThis.mockHeaderSubdomain = 'invalid';
      
      const config = getBrandConfig();
      expect(config.id).toBe('act'); // Default brand
    });
  });
});

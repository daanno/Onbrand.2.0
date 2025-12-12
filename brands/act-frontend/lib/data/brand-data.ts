import { getBrandConfig } from '../brand';

/**
 * Example brand-specific data fetching utilities
 * In a real app, this would connect to your database with tenant isolation
 */

// Example data store - in production this would be in a database with proper tenant isolation
const brandDataStore: Record<string, any> = {
  'act': {
    name: 'ACT 2.0',
    description: 'The official ACT brand experience',
    metrics: {
      contentCount: 42,
      contentViews: 3872,
      brandScore: '95%',
      activeUsers: 28
    },
    recentContent: [
      { id: '1', title: 'Brand Guidelines', date: '2025-09-15', status: 'Published' },
      { id: '2', title: 'Marketing Strategy', date: '2025-10-01', status: 'Published' },
      { id: '3', title: 'Q4 Campaign', date: '2025-10-10', status: 'Draft' },
      { id: '4', title: 'Social Media Calendar', date: '2025-10-12', status: 'Review' }
    ]
  },
  'acme': {
    name: 'Acme Corp',
    description: 'Enterprise solutions for innovative businesses',
    metrics: {
      contentCount: 24,
      contentViews: 1245,
      brandScore: '87%',
      activeUsers: 15
    },
    recentContent: [
      { id: '1', title: 'Product Launch', date: '2025-09-20', status: 'Published' },
      { id: '2', title: 'Customer Case Study', date: '2025-10-05', status: 'Review' },
      { id: '3', title: 'Email Newsletter', date: '2025-10-08', status: 'Draft' },
      { id: '4', title: 'Annual Report', date: '2025-10-15', status: 'Draft' }
    ]
  },
  'nike': {
    name: 'Nike Brand Portal',
    description: 'Brand management for Nike products and campaigns',
    metrics: {
      contentCount: 87,
      contentViews: 6543,
      brandScore: '92%',
      activeUsers: 32
    },
    recentContent: [
      { id: '1', title: 'Summer Campaign 2026', date: '2025-10-15', status: 'Draft' },
      { id: '2', title: 'Athlete Endorsements', date: '2025-10-10', status: 'Published' },
      { id: '3', title: 'Product Launch - Air Max 2026', date: '2025-10-05', status: 'Review' },
      { id: '4', title: 'Brand Guidelines Update', date: '2025-09-28', status: 'Published' },
      { id: '5', title: 'Social Media Assets', date: '2025-09-22', status: 'Published' }
    ]
  },
  'creativetechnologists': {
    name: 'Creative Technologists',
    description: 'Creative technology solutions and brand innovation',
    metrics: {
      contentCount: 52,
      contentViews: 3150,
      brandScore: '94%',
      activeUsers: 18
    },
    recentContent: [
      { id: '1', title: 'Innovation Workshop Results', date: '2025-10-18', status: 'Published' },
      { id: '2', title: 'Brand Identity Evolution', date: '2025-10-12', status: 'Review' },
      { id: '3', title: 'Tech Trends 2026', date: '2025-10-05', status: 'Draft' },
      { id: '4', title: 'Client Pitch Deck', date: '2025-09-30', status: 'Published' },
      { id: '5', title: 'Design System Update', date: '2025-09-25', status: 'Published' }
    ]
  }
};

/**
 * Get brand data for the current tenant or a specific brand
 * This demonstrates how to get tenant-specific data in a multi-tenant app
 * @param specificBrandId Optional brand ID to retrieve. If not provided, detects from context.
 */
export async function getBrandData(specificBrandId?: string) {
  // Get the brand ID - either specified or from the detection system
  const brandConfig = getBrandConfig(specificBrandId);
  const brandId = brandConfig.id;
  
  // Simulate fetching tenant-specific data from an API or database
  // In a real app, this would use headers from middleware or other tenant context
  const data = brandDataStore[brandId] || {
    name: brandConfig.displayName,
    description: `Brand portal for ${brandConfig.displayName}`,
    metrics: {
      contentCount: 0,
      contentViews: 0,
      brandScore: '0%',
      activeUsers: 0
    },
    recentContent: []
  };
  
  // Simulate a delay to show loading state
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return data;
}

/**
 * Get content for a specific brand
 */
export async function getBrandContent(brandId: string) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Return content for this brand or empty array
  return brandDataStore[brandId]?.recentContent || [];
}

/**
 * Create content for a specific brand
 */
export async function createBrandContent(brandId: string, content: any) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // In a real app, you would save to your database with tenant isolation
  if (!brandDataStore[brandId]) {
    brandDataStore[brandId] = {
      recentContent: []
    };
  }
  
  // Add content with a generated ID
  const newContent = {
    id: `${Date.now()}`,
    ...content,
    date: new Date().toISOString().split('T')[0]
  };
  
  brandDataStore[brandId].recentContent = [
    newContent,
    ...(brandDataStore[brandId].recentContent || [])
  ];
  
  return newContent;
}

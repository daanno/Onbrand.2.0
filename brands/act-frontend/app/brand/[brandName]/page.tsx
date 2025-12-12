"use client";

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

// Brand-specific page component
export default function BrandPage() {
  const params = useParams();
  const brandName = params.brandName as string;
  const [brandData, setBrandData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Here you would fetch brand-specific data based on the brandName
    const fetchBrandData = async () => {
      try {
        // Replace with your actual API call to get brand data
        // const response = await fetch(`/api/brands/${brandName}`);
        // const data = await response.json();
        
        // For now, just mock the data
        const mockData = {
          name: brandName,
          displayName: brandName.charAt(0).toUpperCase() + brandName.slice(1),
          theme: {
            primaryColor: '#4a90e2',
          }
        };
        
        setBrandData(mockData);
      } catch (error) {
        console.error('Error fetching brand data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBrandData();
  }, [brandName]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-xl">Loading {brandName} experience...</p>
      </div>
    );
  }

  if (!brandData) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-xl">Brand not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8 pb-4 border-b">
        <h1 className="text-3xl font-bold" style={{ color: brandData.theme.primaryColor }}>
          Welcome to {brandData.displayName} OnBrand Experience
        </h1>
      </header>
      
      <main>
        <p className="text-lg mb-4">
          This is a custom branded experience for {brandData.displayName}.
        </p>
        
        <div className="bg-gray-100 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Brand Information</h2>
          <p><strong>Brand ID:</strong> {brandName}</p>
          <p><strong>Display Name:</strong> {brandData.displayName}</p>
          <p><strong>Primary Color:</strong> {brandData.theme.primaryColor}</p>
        </div>
      </main>
    </div>
  );
}

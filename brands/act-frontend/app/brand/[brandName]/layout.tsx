"use client";

import { useParams } from 'next/navigation';
import { ReactNode } from 'react';

interface BrandLayoutProps {
  children: ReactNode;
}

export default function BrandLayout({ children }: BrandLayoutProps) {
  const params = useParams();
  const brandName = params.brandName as string;

  return (
    <div className="brand-layout min-h-screen">
      <div className="bg-gray-800 text-white p-4">
        <div className="container mx-auto">
          <p className="text-sm">
            You are viewing <strong>{brandName}</strong> branded experience
          </p>
        </div>
      </div>
      
      {children}
      
      <footer className="bg-gray-100 p-4 mt-8">
        <div className="container mx-auto">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} OnBrand.ai | {brandName} Experience
          </p>
        </div>
      </footer>
    </div>
  );
}

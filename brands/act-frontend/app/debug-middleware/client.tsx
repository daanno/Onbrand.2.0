'use client';

import { useState, useEffect } from 'react';
import { detectBrandId, getBrandConfig } from '../../lib/brand';

export function ClientInfo() {
  const [clientInfo, setClientInfo] = useState({
    hostname: '',
    subdomain: '',
    detectedBrandId: '',
    brandConfig: {} as any,
    apiHeaders: {} as Record<string, string>,
    headers: [] as Array<[string, string]>,
  });
  
  useEffect(() => {
    // Get client-side information
    const hostname = window.location.hostname;
    const subdomain = hostname.split('.')[0];
    
    // Get brand info using the brand detection logic
    const detectedBrandId = detectBrandId();
    const brandConfig = getBrandConfig();
    
    // Make a fetch request to get headers
    fetch('/api/debug-headers')
      .then(response => response.json())
      .then(data => {
        // Extract headers from response
        const apiHeaders = data.headers || {};
        
        // Also get response headers
        const responseHeaders: Array<[string, string]> = [];
        fetch('/api/debug-headers').then(response => {
          response.headers.forEach((value, key) => {
            responseHeaders.push([key, value]);
          });
          
          setClientInfo({
            hostname,
            subdomain,
            detectedBrandId,
            brandConfig,
            apiHeaders,
            headers: responseHeaders
          });
        });
      })
      .catch(error => {
        console.error('Error fetching headers:', error);
      });
  }, []);
  
  return (
    <>
      {/* Client Info */}
      <div className="p-4 bg-slate-50 rounded-md mb-8">
        <h2 className="text-lg font-semibold mb-4">Client-side Information</h2>
        <ul className="space-y-2">
          <li><strong>Hostname:</strong> {clientInfo.hostname}</li>
          <li><strong>Raw Subdomain:</strong> {clientInfo.subdomain}</li>
          <li><strong>Detected Brand ID:</strong> {clientInfo.detectedBrandId}</li>
          <li><strong>Brand Name:</strong> {clientInfo.brandConfig?.displayName || 'Not set'}</li>
        </ul>
      </div>
      
      {/* Middleware Headers */}
      <div className="p-4 bg-slate-50 rounded-md mb-8">
        <h2 className="text-lg font-semibold mb-4">Middleware Headers</h2>
        <ul className="space-y-2">
          <li><strong>x-brand-subdomain:</strong> {clientInfo.apiHeaders['x-brand-subdomain'] || 'Not set'}</li>
          <li><strong>x-hostname:</strong> {clientInfo.apiHeaders['x-hostname'] || 'Not set'}</li>
        </ul>
      </div>
      
      {/* Headers from API */}
      <div className="p-4 bg-slate-50 rounded-md">
        <h2 className="text-lg font-semibold mb-4">All Response Headers</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-300">
            <thead>
              <tr>
                <th className="py-2 px-4 text-left">Header</th>
                <th className="py-2 px-4 text-left">Value</th>
              </tr>
            </thead>
            <tbody>
              {clientInfo.headers.map(([key, value], index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-100'}>
                  <td className="py-2 px-4">{key}</td>
                  <td className="py-2 px-4">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

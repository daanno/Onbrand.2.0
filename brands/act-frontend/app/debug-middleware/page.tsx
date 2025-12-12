import { ClientInfo } from './client';

/**
 * Debug Page for Middleware
 * 
 * This page displays information about headers and the current hostname
 * to help debug the middleware implementation.
 */

export default function DebugMiddleware() {
  return (
    <div className="container mx-auto p-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">Middleware Debug Page</h1>
      
      <p className="mb-4">
        This page helps debug the middleware implementation for brand detection.
        Check the client-side information below to see the detected brand and headers.
      </p>
      
      {/* Client-side Component */}
      <ClientInfo />
    </div>
  );
}

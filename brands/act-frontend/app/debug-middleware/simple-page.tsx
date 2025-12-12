// Simple server component that doesn't rely on complex headers() usage
import { ClientInfo } from './client';

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

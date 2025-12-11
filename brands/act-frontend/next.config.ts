import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.leonardo.ai',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Disable TypeScript type checking during production build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Disable ESLint during production build
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Enable if needed for AI SDK
  },
};

export default nextConfig;

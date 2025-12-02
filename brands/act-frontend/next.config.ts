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
  experimental: {
    // Enable if needed for AI SDK
  },
};

export default nextConfig;

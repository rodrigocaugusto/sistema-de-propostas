import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '25mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'randhost.s3.us-east-1.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'randhost.s3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '*.backblazeb2.com',
      },
    ],
    // Also allow unoptimized images (for img tags)
    unoptimized: true,
  },
};

export default nextConfig;

// Trigger restart for Schema update

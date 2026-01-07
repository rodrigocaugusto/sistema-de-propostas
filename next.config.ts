import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '*.backblazeb2.com',
      },
      {
        protocol: 'https',
        hostname: 'sistema-proposal-dl.s3.us-west-004.backblazeb2.com',
      },
      {
        protocol: 'https',
        hostname: 'f004.backblazeb2.com',
      },
    ],
    // Also allow unoptimized images (for img tags)
    unoptimized: true,
  },
};

export default nextConfig;

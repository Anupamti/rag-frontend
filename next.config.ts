import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // experimental: {
  //   fetchCache: true, // Enables fetch caching
  // },
  async rewrites() {
    return [
      {
           source: '/api/openai/:path*',
        destination: 'https://api.openai.com/v1/:path*'
      },
    ];
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
async rewrites() {
    return [
      {
        source: '/api/:path*',          
        destination: 'http://43.205.138.222/:path*', 
      },
    ]
  },
};

export default nextConfig;

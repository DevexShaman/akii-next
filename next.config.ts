import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://65.0.76.194/:path*",
      },
    ];
  },
};

export default nextConfig;

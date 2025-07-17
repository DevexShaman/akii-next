import type { NextConfig } from "next";

const nextConfig: NextConfig = {
eslint :{
	 ignoreDuringBuilds: true,
},  
async rewrites(){
    return [
      {
        source: "/api/:path*",
        destination: "http://llm.edusmartai.com/:path*",
      },
    ];
  },
};

export default nextConfig;

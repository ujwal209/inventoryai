import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable TypeScript type checking during the Next.js build
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if 
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  

  
  /* other config options here */
};

export default nextConfig;
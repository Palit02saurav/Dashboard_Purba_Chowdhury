import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_API_URL: process.env.NEXT_API_URL,
  },
};

export default nextConfig;
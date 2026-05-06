import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/**": ["./app/generated/prisma/**/*.node"],
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["bullmq", "ioredis"],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;

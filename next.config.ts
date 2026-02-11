import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@spree/next", "@spree/sdk"],
  images: {
    qualities: [25, 50, 75, 100],
    dangerouslyAllowLocalIP: true, // Allow localhost images in development
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
      },
      {
        protocol: "https",
        hostname: "**.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "**.cloudfront.net",
      },
      {
        protocol: "https",
        hostname: "**.digitaloceanspaces.com",
      },
      {
        protocol: "https",
        hostname: "**.blob.core.windows.net",
      },
    ],
  },
};

export default nextConfig;

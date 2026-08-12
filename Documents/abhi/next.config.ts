import path from "node:path";
import type { NextConfig } from "next";

const API_URL = process.env.API_URL ?? "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  turbopack: {
    // There's a stray package-lock.json in the home directory, so Next was
    // inferring C:\Users\adity as the workspace root. Pin it to this app.
    root: path.resolve(__dirname),
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;

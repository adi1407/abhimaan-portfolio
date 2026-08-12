import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // There's a stray package-lock.json in the home directory, so Next was
    // inferring C:\Users\adity as the workspace root. Pin it to this app.
    root: path.resolve(__dirname),
  },
};

export default nextConfig;

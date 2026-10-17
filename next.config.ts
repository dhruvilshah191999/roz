import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every page depends on the session cookie, so render dynamically per request.
  cacheComponents: false,
  // Let phones on the same Wi-Fi load dev assets when opened via the laptop IP.
  allowedDevOrigins: ["192.168.0.9", "192.168.*.*", "10.*.*.*", "172.16.*.*"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

import type { NextConfig } from "next";
const config: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["playwright-core", "pg"],
  outputFileTracingExcludes: {
    "/*": [
      "./.data/**",
      "./tests/**",
      "./scripts/**",
      "./docs/**",
      "./.env*",
      "./.git/**",
    ],
  },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "same-origin" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
    ];
  },
};
export default config;

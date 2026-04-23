import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["http://localhost:3000", "127.0.0.1"],
  async rewrites() {
    return [
      // Proxy para o PostHog — evita bloqueio por ad-blockers
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/array/:path*",
        destination: "https://us-assets.i.posthog.com/array/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },
  // Necessário para o proxy funcionar corretamente
  skipTrailingSlashRedirect: true,
};

export default nextConfig;

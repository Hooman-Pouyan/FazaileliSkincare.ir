import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  // Deployed as a plain Node container to an Iranian PaaS (Liara / ParsPack).
  ...(process.env.VERCEL === "1" ? {} : { output: "standalone" }),
  images: {
    // Media lives in S3-compatible object storage behind an Iranian CDN.
    remotePatterns: [{ protocol: "https", hostname: "**.arvanstorage.ir" }],
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    // The root layout lives under a dynamic segment (app/[locale]/layout.tsx),
    // which is one of the two cases Next names for global-not-found: there is no
    // single non-localized layout a root not-found could compose from. This
    // bypasses rendering entirely and returns the page directly.
    globalNotFound: true,
  },
  // Cache Components + Instant Navigations are Phase 2 polish — see docs/01-adr-001-stack.md.
  // cacheComponents: true,
  // partialPrefetching: true,
};

export default createNextIntlPlugin("./src/i18n/request.ts")(nextConfig);

import type { NextConfig } from "next";

const IMMUTABLE_CACHE_CONTROL = "public, max-age=31536000, immutable";

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://images.unsplash.com",
      "font-src 'self' data:",
      "connect-src 'self' blob: https://vitals.vercel-insights.com https://va.vercel-scripts.com",
      "media-src 'self'",
      "worker-src blob:",
      "frame-src 'none'",
      "object-src 'none'",
    ].join("; "),
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
  },
  ...(process.env.NODE_ENV === "production"
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains; preload",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "prisma", "@neondatabase/serverless"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/photos/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: IMMUTABLE_CACHE_CONTROL,
          },
        ],
      },
      {
        source: "/env/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: IMMUTABLE_CACHE_CONTROL,
          },
        ],
      },
      {
        source: "/flintlock_pistol.glb",
        headers: [
          {
            key: "Cache-Control",
            value: IMMUTABLE_CACHE_CONTROL,
          },
        ],
      },
      {
        source: "/oneko-cat.png",
        headers: [
          {
            key: "Cache-Control",
            value: IMMUTABLE_CACHE_CONTROL,
          },
        ],
      },
      {
        source: "/oneko-cat-chat.png",
        headers: [
          {
            key: "Cache-Control",
            value: IMMUTABLE_CACHE_CONTROL,
          },
        ],
      },
    ];
  },
};

export default nextConfig;

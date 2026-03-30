import type { NextConfig } from "next";

const IMMUTABLE_CACHE_CONTROL = "public, max-age=31536000, immutable";

const securityHeaders = [
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
  serverExternalPackages: ["@prisma/client", "prisma"],
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

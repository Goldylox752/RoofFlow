const isProd = process.env.NODE_ENV === "production";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compress: true,

  /* ===============================
     SECURITY HEADERS (UPGRADED)
  =============================== */
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

          // basic CSP (safe default for SaaS)
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; img-src 'self' https: data:; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
          },
        ],
      },
    ];
  },

  /* ===============================
     IMAGE OPTIMIZATION (SAFER)
  =============================== */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", // safer wildcard format
      },
    ],
  },

  /* ===============================
     API REWRITE (SAFER HANDLING)
  =============================== */
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    return [
      {
        source: "/api/backend/:path*",
        destination: apiUrl
          ? `${apiUrl}/api/:path*`
          : isProd
          ? "/api/:path*" // fallback to same app in production
          : "http://localhost:3001/api/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
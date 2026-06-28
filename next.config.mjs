/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          // The poisoned-content iframe uses sandbox="" (no scripts allowed).
          // unsafe-inline required for Next.js inline scripts during SSG hydration.
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "frame-src 'self'",
              "connect-src 'self'",
              "img-src 'self' data:",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;

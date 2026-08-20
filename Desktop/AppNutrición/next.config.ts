import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Carpeta de salida del build. Configurable por env var para poder compilar en
  // .next-build durante el deploy (mientras PM2 sigue sirviendo .next intacto) y luego
  // hacer el swap, evitando que se vean estilos/textos rotos durante el build. Por
  // defecto ".next" (lo que usa `next start`). Ver scripts/deploy.sh.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  env: {
    NEXT_PUBLIC_BUILD_ID: Date.now().toString(),
  },
  serverExternalPackages: ["pg", "puppeteer-core"],
  // Fija la raíz del proyecto. Sin esto, si en la máquina de alguien hay otro
  // package-lock.json más arriba (típico: uno suelto en la carpeta del usuario),
  // Turbopack lo toma como raíz del workspace y avisa en cada arranque.
  turbopack: {
    root: import.meta.dirname,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
    optimizePackageImports: ["lucide-react", "recharts", "date-fns", "sonner"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.googletagmanager.com https://*.google-analytics.com",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob: https:",
            "font-src 'self' https://fonts.gstatic.com",
            "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.groq.com https://*.google-analytics.com https://*.googletagmanager.com https://analytics.google.com https://*.analytics.google.com",
            "frame-ancestors 'none'",
          ].join("; "),
        },
      ],
    },
    {
      source: "/(.*)",
      has: [{ type: "header", key: "x-forwarded-proto", value: "https" }],
      headers: [
        { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
      ],
    },
  ],
};

export default withNextIntl(nextConfig);

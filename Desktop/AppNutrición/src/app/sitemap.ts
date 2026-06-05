import type { MetadataRoute } from "next";

const BASE = "https://annonia.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${BASE}/landing`,
      lastModified: new Date("2026-04-27"),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE}/software-para-nutricionistas-gratis`,
      lastModified: new Date("2026-06-05"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE}/faq`,
      lastModified: new Date("2026-06-05"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/precios`,
      lastModified: new Date("2026-04-27"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE}/colaboradores`,
      lastModified: new Date("2026-06-05"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE}/registro`,
      lastModified: new Date("2026-04-27"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/login`,
      lastModified: new Date("2026-04-27"),
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${BASE}/legal/terminos`,
      lastModified: new Date("2026-04-24"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE}/legal/privacidad`,
      lastModified: new Date("2026-04-24"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE}/legal/cookies`,
      lastModified: new Date("2026-04-24"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}

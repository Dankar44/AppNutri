import type { MetadataRoute } from "next";
import { getUltimaFechaNovedad } from "@/content/novedades";

const BASE = "https://annonia.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const ultimaNovedad = getUltimaFechaNovedad();

  return [
    {
      url: `${BASE}/landing`,
      lastModified: new Date("2026-04-27"),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE}/software-para-nutricionistas-gratis`,
      lastModified: new Date("2026-06-10"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE}/faq`,
      lastModified: new Date("2026-06-10"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/alternativa-a-dietowin`,
      lastModified: new Date("2026-06-10"),
      changeFrequency: "monthly",
      priority: 0.85,
    },
    {
      url: `${BASE}/alternativa-a-nutrium`,
      lastModified: new Date("2026-06-10"),
      changeFrequency: "monthly",
      priority: 0.85,
    },
    {
      url: `${BASE}/precios`,
      lastModified: new Date("2026-04-27"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      // Se actualiza sola: la fecha sale de la última entrada de novedades.
      url: `${BASE}/novedades`,
      lastModified: ultimaNovedad ? new Date(ultimaNovedad) : new Date("2026-07-29"),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE}/colaboradores`,
      lastModified: new Date("2026-06-10"),
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

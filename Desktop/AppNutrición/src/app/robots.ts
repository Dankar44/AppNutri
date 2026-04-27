import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/landing", "/precios", "/login", "/registro", "/legal/"],
      disallow: [
        "/dashboard/",
        "/admin/",
        "/paciente/portal/",
        "/api/",
        "/admin-login",
        "/compartido/",
      ],
    },
    sitemap: "https://annonia.com/sitemap.xml",
    host: "https://annonia.com",
  };
}

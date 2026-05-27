import type { Metadata } from "next";
import Link from "next/link";
import { Leaf, Check, Star, Zap, Users, Brain, Share2, BarChart3, Shield } from "lucide-react";
import { JsonLd } from "@/components/json-ld";
import { getOrganizationJsonLd, getSoftwareApplicationJsonLd, getPreciosFaqJsonLd } from "@/lib/structured-data";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pricing");
  return {
    title: t("metadata.title"),
    description: t("metadata.description"),
    alternates: { canonical: "/precios" },
    openGraph: {
      title: t("metadata.ogTitle"),
      description: t("metadata.ogDescription"),
      url: "/precios",
    },
    twitter: {
      card: "summary_large_image",
      title: t("metadata.twitterTitle"),
    },
  };
}

const PLAN_ICONS: Record<string, React.ElementType> = {
  pacientesActivos: Users,
  pacientesIlimitados: Users,
  planesIlimitados: Zap,
  baseAlimentos: BarChart3,
  recetas: Star,
  portalPaciente: Share2,
  seguimientoMedidas: BarChart3,
  soporteEmail: Shield,
  dietasIA: Brain,
  informesPdf: BarChart3,
  plantillas: Star,
  soportePrioritario: Shield,
};

export default async function PreciosPage() {
  const t = await getTranslations("pricing");

  const PLANES = [
    {
      id: "basico",
      nombre: t("planes.basico.nombre"),
      descripcion: t("planes.basico.descripcion"),
      destacado: false,
      featureKeys: ["pacientesActivos", "planesIlimitados", "baseAlimentos", "recetas", "portalPaciente", "seguimientoMedidas", "soporteEmail"] as const,
    },
    {
      id: "profesional",
      nombre: t("planes.profesional.nombre"),
      descripcion: t("planes.profesional.descripcion"),
      destacado: true,
      featureKeys: ["pacientesIlimitados", "planesIlimitados", "baseAlimentos", "recetas", "portalPaciente", "seguimientoMedidas", "dietasIA", "informesPdf", "plantillas", "soportePrioritario"] as const,
    },
  ];

  const tSeo = await getTranslations("landing.structuredData");
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-green-50/30">
      <JsonLd data={getOrganizationJsonLd(tSeo)} />
      <JsonLd data={getSoftwareApplicationJsonLd(tSeo)} />
      <JsonLd data={getPreciosFaqJsonLd(tSeo)} />
      {/* Header */}
      <header className="border-b border-border/50 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/precios" className="flex items-center gap-2">
            <Leaf className="w-7 h-7 text-primary" />
            <span className="text-xl font-bold">Annonia</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("header.iniciarSesion")}
            </Link>
            <Link
              href="/registro"
              className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {t("header.empezarGratis")}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
          <Zap className="w-4 h-4" />
          {t("hero.badge")}
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
          {t("hero.titulo")}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {t("hero.descripcion")}
        </p>
      </section>

      {/* Planes */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {PLANES.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border-2 bg-card p-8 flex flex-col ${
                plan.destacado
                  ? "border-primary shadow-xl shadow-primary/10"
                  : "border-border"
              }`}
            >
              {plan.destacado && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wide">
                    <Star className="w-3 h-3" />
                    {t("planes.masPopular")}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h2 className="text-xl font-bold mb-1">{plan.nombre}</h2>
                <p className="text-sm text-muted-foreground">{plan.descripcion}</p>
              </div>

              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-5xl font-bold">{t("planes.gratisBeta")}</span>
                <span className="text-sm text-muted-foreground ml-1">{t("planes.gratisSubtexto")}</span>
              </div>

              <Link
                href="/registro"
                className={`w-full text-center py-3 rounded-xl font-semibold text-sm transition-colors mb-8 block ${
                  plan.destacado
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-muted text-foreground hover:bg-muted/80"
                }`}
              >
                {t("planes.empezarGratis")}
              </Link>

              <div className="space-y-3 flex-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  {t("planes.incluye")}
                </p>
                {plan.featureKeys.map((key) => (
                  <div key={key} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{t(`planes.${plan.id}.features.${key}` as never)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-2xl mx-auto text-center">
          <h3 className="text-xl font-bold mb-6">{t("faq.titulo")}</h3>
          <div className="space-y-4 text-left">
            {(["cambiarPlan", "despuesPrueba", "cancelar", "datosSeguridad"] as const).map((key) => (
              <details key={key} className="group bg-card rounded-xl border border-border p-4">
                <summary className="font-medium cursor-pointer list-none flex items-center justify-between">
                  {t(`faq.${key}.pregunta`)}
                  <span className="text-muted-foreground group-open:rotate-180 transition-transform">&#9662;</span>
                </summary>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t(`faq.${key}.respuesta`)}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Leaf className="w-4 h-4 text-primary" />
            <span>Annonia &copy; {new Date().getFullYear()}</span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/login" className="hover:text-foreground transition-colors">
              {t("footer.iniciarSesion")}
            </Link>
            <Link href="/paciente/login" className="hover:text-foreground transition-colors">
              {t("footer.portalPacientes")}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

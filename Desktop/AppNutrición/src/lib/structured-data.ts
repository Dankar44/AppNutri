type TFunc = (key: string) => string;

export function getOrganizationJsonLd(t?: TFunc) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Annonia Software S.L.",
    alternateName: "Annonia",
    description: t ? t("organization.description") : "Empresa española de software de nutrición para nutricionistas. Plataforma de gestión de consultas, dietas personalizadas e inteligencia artificial.",
    url: "https://annonia.com",
    logo: "https://annonia.com/icon.svg",
    contactPoint: [
      {
        "@type": "ContactPoint",
        email: "info@annonia.com",
        contactType: "customer service",
        availableLanguage: t ? t("organization.availableLanguage") : "Spanish",
      },
      {
        "@type": "ContactPoint",
        email: "legal@annonia.com",
        contactType: "legal",
      },
    ],
    address: {
      "@type": "PostalAddress",
      addressCountry: "ES",
    },
  };
}

export function getWebsiteJsonLd(t?: TFunc) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Annonia",
    alternateName: t ? t("website.alternateName") : "Annonia — Software para Nutricionistas",
    url: "https://annonia.com",
    inLanguage: t ? t("website.inLanguage") : "es",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://annonia.com/landing",
      },
      "query-input": "required",
    },
  };
}

export function getSoftwareApplicationJsonLd(t?: TFunc) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Annonia",
    description: t ? t("software.description") : "Software de nutrición para nutricionistas: crea dietas personalizadas, gestiona pacientes, agenda citas online y genera planes alimenticios con inteligencia artificial.",
    applicationCategory: "HealthApplication",
    applicationSubCategory: "Nutrition Software",
    operatingSystem: "Web",
    inLanguage: t ? t("website.inLanguage") : "es",
    availableOnDevice: "Desktop, Mobile, Tablet",
    offers: [
      {
        "@type": "Offer",
        name: t ? t("software.offerPrueba") : "Beta gratuita",
        price: "0",
        priceCurrency: "EUR",
        description: t ? t("software.offerPruebaDesc") : "Gratis durante la fase de lanzamiento en España con acceso completo",
        url: "https://annonia.com/precios",
      },
    ],
  };
}

export function getLandingFaqJsonLd(t?: TFunc) {
  const q = (key: string, aKey: string) => ({
    "@type": "Question",
    name: t ? t(`landingFaq.${key}`) : key,
    acceptedAnswer: {
      "@type": "Answer",
      text: t ? t(`landingFaq.${aKey}`) : aKey,
    },
  });

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: t
      ? [
          q("q1", "a1"),
          q("q2", "a2"),
          q("q3", "a3"),
          q("q4", "a4"),
          q("q5", "a5"),
        ]
      : [
          { "@type": "Question", name: "¿Puedo probar Annonia gratis?", acceptedAnswer: { "@type": "Answer", text: "Sí, Annonia es completamente gratis durante la fase de lanzamiento en España. Crea tu cuenta y empieza a usarlo con todas las funcionalidades." } },
          { "@type": "Question", name: "¿Mis datos y los de mis pacientes están seguros?", acceptedAnswer: { "@type": "Answer", text: "Absolutamente. Usamos encriptación, servidores en la UE y cumplimos con el RGPD. La seguridad de los datos clínicos es nuestra prioridad." } },
          { "@type": "Question", name: "¿Puedo cambiar de plan o cancelar?", acceptedAnswer: { "@type": "Answer", text: "Sí, sin compromisos. Cambia o cancela desde Ajustes. Mantienes acceso hasta el final del periodo pagado." } },
          { "@type": "Question", name: "¿Mis pacientes necesitan crear cuenta?", acceptedAnswer: { "@type": "Answer", text: "No. Tú les envías un acceso con email y PIN. Ellos acceden al portal sin registrarse." } },
          { "@type": "Question", name: "¿Funciona en el móvil?", acceptedAnswer: { "@type": "Answer", text: "Sí, todo está optimizado para móvil, tablet y escritorio. Es una web app progresiva que puedes instalar." } },
        ],
  };
}

export function getPreciosFaqJsonLd(t?: TFunc) {
  const q = (key: string, aKey: string) => ({
    "@type": "Question",
    name: t ? t(`preciosFaq.${key}`) : key,
    acceptedAnswer: {
      "@type": "Answer",
      text: t ? t(`preciosFaq.${aKey}`) : aKey,
    },
  });

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: t
      ? [
          q("q1", "a1"),
          q("q2", "a2"),
          q("q3", "a3"),
          q("q4", "a4"),
        ]
      : [
          { "@type": "Question", name: "¿Puedo cambiar de plan en cualquier momento?", acceptedAnswer: { "@type": "Answer", text: "Sí, puedes subir o bajar de plan cuando quieras. El cambio se aplica en el siguiente ciclo de facturación." } },
          { "@type": "Question", name: "¿Cuándo dejará de ser gratis?", acceptedAnswer: { "@type": "Answer", text: "Durante la fase de lanzamiento en España, todo es gratis. Cuando lancemos los planes de pago, te avisaremos con antelación." } },
          { "@type": "Question", name: "¿Puedo cancelar en cualquier momento?", acceptedAnswer: { "@type": "Answer", text: "No hay nada que cancelar durante la fase de lanzamiento en España. Tu cuenta es completamente gratuita." } },
          { "@type": "Question", name: "¿Mis datos están seguros?", acceptedAnswer: { "@type": "Answer", text: "Absolutamente. Usamos encriptación de extremo a extremo, servidores en la UE y cumplimos con el RGPD. Tus datos y los de tus pacientes están protegidos." } },
        ],
  };
}

/** @deprecated Use getOrganizationJsonLd(t) */
export const ORGANIZATION_JSONLD = getOrganizationJsonLd();
/** @deprecated Use getWebsiteJsonLd(t) */
export const WEBSITE_JSONLD = getWebsiteJsonLd();
/** @deprecated Use getSoftwareApplicationJsonLd(t) */
export const SOFTWARE_APPLICATION_JSONLD = getSoftwareApplicationJsonLd();
/** @deprecated Use getLandingFaqJsonLd(t) */
export const LANDING_FAQ_JSONLD = getLandingFaqJsonLd();
/** @deprecated Use getPreciosFaqJsonLd(t) */
export const PRECIOS_FAQ_JSONLD = getPreciosFaqJsonLd();

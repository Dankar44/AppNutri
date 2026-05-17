type TFunc = (key: string) => string;

export function getOrganizationJsonLd(t?: TFunc) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Annonia Software S.L.",
    alternateName: "Annonia",
    description: t ? t("organization.description") : "Empresa española de software de nutrición para dietistas-nutricionistas. Plataforma de gestión de consultas, dietas personalizadas e inteligencia artificial.",
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
    alternateName: t ? t("website.alternateName") : "Annonia — Software para Dietistas y Nutricionistas",
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
    description: t ? t("software.description") : "Software de nutrición para dietistas: crea dietas personalizadas, gestiona pacientes, agenda citas online y genera planes alimenticios con inteligencia artificial.",
    applicationCategory: "HealthApplication",
    applicationSubCategory: "Nutrition Software",
    operatingSystem: "Web",
    inLanguage: t ? t("website.inLanguage") : "es",
    availableOnDevice: "Desktop, Mobile, Tablet",
    offers: [
      {
        "@type": "Offer",
        name: t ? t("software.offerBasico") : "Básico",
        price: "9.99",
        priceCurrency: "EUR",
        url: "https://annonia.com/precios",
      },
      {
        "@type": "Offer",
        name: t ? t("software.offerProfesional") : "Profesional",
        price: "11.99",
        priceCurrency: "EUR",
        url: "https://annonia.com/precios",
      },
      {
        "@type": "Offer",
        name: t ? t("software.offerPrueba") : "Prueba gratuita",
        price: "0",
        priceCurrency: "EUR",
        description: t ? t("software.offerPruebaDesc") : "14 días de prueba gratuita con acceso completo",
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
          { "@type": "Question", name: "¿Puedo probar Annonia gratis?", acceptedAnswer: { "@type": "Answer", text: "Sí, tienes 14 días de prueba gratuita con acceso completo. No necesitas tarjeta de crédito." } },
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
          { "@type": "Question", name: "¿Qué pasa después de los 14 días de prueba?", acceptedAnswer: { "@type": "Answer", text: "Al finalizar la prueba, se activará tu plan seleccionado. Si no has añadido un método de pago, tu cuenta pasará a modo lectura." } },
          { "@type": "Question", name: "¿Puedo cancelar en cualquier momento?", acceptedAnswer: { "@type": "Answer", text: "Sí, sin preguntas. Puedes cancelar desde Ajustes y seguirás teniendo acceso hasta el final de tu periodo pagado." } },
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

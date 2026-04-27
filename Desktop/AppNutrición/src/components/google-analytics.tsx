"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { GA_MEASUREMENT_ID } from "@/lib/gtag";

export function GoogleAnalytics() {
  const pathname = usePathname();
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("annonia-cookie-consent");
    setHasConsent(consent === "accepted");

    const onStorage = (e: StorageEvent) => {
      if (e.key === "annonia-cookie-consent") {
        setHasConsent(e.newValue === "accepted");
      }
    };

    const onConsentChange = (e: Event) => {
      setHasConsent((e as CustomEvent).detail === "accepted");
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("cookie-consent-change", onConsentChange);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("cookie-consent-change", onConsentChange);
    };
  }, []);

  useEffect(() => {
    if (!hasConsent || !GA_MEASUREMENT_ID) return;
    if (document.querySelector(`script[src*="googletagmanager.com/gtag"]`)) {
      if (typeof window.gtag === "function") {
        window.gtag("config", GA_MEASUREMENT_ID, { page_path: pathname });
      }
      return;
    }

    const script = document.createElement("script");
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    script.async = true;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function (...args: unknown[]) {
      window.dataLayer.push(args);
    };
    window.gtag("js", new Date());
    window.gtag("config", GA_MEASUREMENT_ID, {
      page_path: pathname,
      anonymize_ip: true,
    });
  }, [hasConsent, pathname]);

  return null;
}

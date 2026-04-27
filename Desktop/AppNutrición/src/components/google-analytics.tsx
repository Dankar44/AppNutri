"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { pageview, GA_MEASUREMENT_ID } from "@/lib/gtag";

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
    if (hasConsent && pathname) pageview(pathname);
  }, [pathname, hasConsent]);

  if (!GA_MEASUREMENT_ID || !hasConsent) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_MEASUREMENT_ID}',{page_path:window.location.pathname,anonymize_ip:true});`}
      </Script>
    </>
  );
}

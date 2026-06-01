"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";
import { detectInAppBrowser, type InAppBrowserInfo } from "@/lib/in-app-browser";

// Hook: detecta el navegador in-app tras montar (navigator solo existe en cliente).
// Render inicial = false para que coincida con el SSR y no haya hydration mismatch.
export function useInAppBrowser(): InAppBrowserInfo {
  const [info, setInfo] = useState<InAppBrowserInfo>({ inApp: false, app: null });
  useEffect(() => {
    setInfo(detectInAppBrowser(navigator.userAgent));
  }, []);
  return info;
}

// Aviso que se muestra solo a quien abre la web dentro de una app (LinkedIn,
// Instagram, etc.), explicando que Google no deja iniciar sesión ahí y que
// abra en su navegador o use el email.
export function InAppBrowserNotice() {
  const t = useTranslations("auth");
  const { inApp, app } = useInAppBrowser();
  if (!inApp) return null;
  const appLabel = app ?? t("inAppBrowser.genericApp");
  return (
    <div
      role="alert"
      className="mb-5 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"
    >
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
        <div className="space-y-1">
          <p className="font-semibold">{t("inAppBrowser.title")}</p>
          <p className="text-amber-800">{t("inAppBrowser.body", { app: appLabel })}</p>
          <p className="font-medium">{t("inAppBrowser.orEmail")}</p>
        </div>
      </div>
    </div>
  );
}

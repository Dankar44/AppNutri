"use client";

import { useState, useEffect } from "react";
import { X, MessageSquare, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { betaDescartado, descartarBeta } from "@/lib/novedades-vistas";

export function BetaBanner() {
  const t = useTranslations("common");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!betaDescartado()) {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    descartarBeta();
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="mt-14 lg:mt-0 bg-amber-50 dark:bg-amber-500/10 border-b border-amber-200 dark:border-amber-500/20 px-4 py-3">
      <div className="flex items-start gap-3 max-w-screen-xl mx-auto">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-amber-900 dark:text-amber-200">
            <span className="font-semibold">{t("beta.message")}</span>{" "}
            {t("beta.feedback")}{" "}
            <Link
              href="/mensajes?c=soporte"
              className="font-semibold underline underline-offset-2 hover:text-amber-700 dark:hover:text-amber-100 inline-flex items-center gap-1"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              {t("beta.supportLink")}
            </Link>
            . {t("beta.encouragement")}
          </p>
        </div>
        <button
          onClick={dismiss}
          className="p-1 rounded-md hover:bg-amber-200/50 dark:hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0"
          aria-label={t("beta.closeAriaLabel")}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

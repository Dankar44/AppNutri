"use client";

import { useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { conectarGoogleNutri } from "@/app/actions/google-integracion";

type Props = {
  integracion: { email: string; sincronizar: boolean } | null;
};

export function GoogleCalendarSidebar({ integracion }: Props) {
  const t = useTranslations("agenda.googleCalendarSidebar");
  const [pending, startTransition] = useTransition();

  const handleConectar = () => {
    startTransition(async () => {
      await conectarGoogleNutri();
    });
  };

  if (integracion) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <GoogleCalendarIcon />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Google Calendar</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <p className="text-xs text-muted-foreground truncate">
                {integracion.email}
              </p>
            </div>
            {!integracion.sincronizar && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                {t("syncPaused")}
              </p>
            )}
          </div>
        </div>
        <Link
          href="/ajustes"
          className="inline-flex items-center gap-1 mt-3 text-xs font-medium text-primary hover:underline"
        >
          {t("manageInSettings")}
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex gap-4 items-start">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base text-foreground">
            Google Calendar
          </h3>
          <p className="text-sm text-muted-foreground mt-2 leading-snug">
            {t("syncDescription")}
          </p>
          <button
            onClick={handleConectar}
            disabled={pending}
            className="inline-flex items-center gap-2 mt-4 text-sm font-medium text-primary hover:underline disabled:opacity-50"
          >
            {pending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : null}
            {pending ? t("connecting") : t("connectButton")}
          </button>
        </div>
        <div className="shrink-0 rounded-lg bg-primary/10 p-3">
          <GoogleCalendarIcon />
        </div>
      </div>
    </div>
  );
}

function GoogleCalendarIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      <path fill="#fff" d="M37 9H11v30h26z" />
      <path fill="#1e88e5" d="M34 42H14l-5-5V11l5-5h20l5 5v26z" />
      <path
        fill="#1e88e5"
        d="M24 21.8l-1.5-.3c-.3.7-1 1.2-1.9 1.2-1.2 0-2-.8-2-2 0-1.1.8-2 1.9-2 .8 0 1.4.4 1.7 1.1l1.6-.6c-.5-1.3-1.8-2.2-3.3-2.2-2.1 0-3.7 1.6-3.7 3.7 0 2.1 1.6 3.7 3.7 3.7 1.9 0 3.3-1.2 3.5-3z"
      />
      <path
        fill="#1e88e5"
        d="M27.3 22.6c-1.1 0-1.9-.8-1.9-1.9 0-1.1.8-1.9 1.9-1.9.8 0 1.5.5 1.8 1.2l1.5-.5c-.5-1.2-1.7-2.1-3.3-2.1-2 0-3.6 1.5-3.6 3.5s1.6 3.5 3.6 3.5c1.4 0 2.6-.8 3.2-2l-1.5-.5c-.3.4-1 .7-1.7.7z"
      />
      <path
        fill="#fff"
        d="M22.7 32h2.9v-3.6l1.8 1.8 1.4-1.4-1.8-1.8h3.6v-2h-3.6l1.8-1.8-1.4-1.4-1.8 1.8V20h-2.9v3.6l-1.8-1.8-1.4 1.4 1.8 1.8h-3.6v2h3.6l-1.8 1.8 1.4 1.4 1.8-1.8z"
      />
    </svg>
  );
}

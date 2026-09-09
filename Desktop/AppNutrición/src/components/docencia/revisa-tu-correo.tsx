"use client";

import { useState, useTransition } from "react";
import { MailCheck, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { reenviarVerificacion } from "@/app/actions/registro";

/**
 * Lo que se ve después de crear la cuenta desde un enlace, sea de profesorado o de clase.
 *
 * La cuenta ya está hecha y la plaza cogida; lo único que falta es que abra el correo. Al pulsar el
 * botón del mensaje entra directo a su espacio, sin volver a escribir correo ni contraseña.
 */
export function RevisaTuCorreo({
  email,
  /** false si el envío falló: la cuenta está creada igual, así que se le ofrece reintentarlo. */
  correoEnviado = true,
  /** Solo en local: el enlace de verificación, porque aquí no hay servicio de correo montado. */
  enlaceDePrueba,
}: {
  email: string;
  correoEnviado?: boolean;
  enlaceDePrueba?: string;
}) {
  const t = useTranslations("docencia.verificacion");
  const [isPending, startTransition] = useTransition();
  const [reenviado, setReenviado] = useState(false);

  function reenviar() {
    startTransition(async () => {
      const r = await reenviarVerificacion(email);
      if (r.ok) {
        setReenviado(true);
        toast.success(t("reenviado"));
      } else {
        toast.error(r.error ?? "");
      }
    });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 text-center">
      <MailCheck className="w-9 h-9 text-primary mx-auto mb-3" />
      <p className="font-medium">{t("titulo")}</p>
      <p className="text-sm text-muted-foreground mt-2">
        {t.rich("mandadoA", {
          correo: () => <span className="font-medium text-foreground break-all">{email}</span>,
        })}
      </p>
      <p className="text-sm text-muted-foreground mt-3">{t("queHacer")}</p>

      {enlaceDePrueba && (
        <div className="mt-4 rounded-lg border border-dashed border-border p-3 text-left">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {t("soloEnLocal")}
          </p>
          <a href={enlaceDePrueba} className="text-xs text-primary hover:underline break-all">
            {t("verificarAqui")}
          </a>
        </div>
      )}

      {!correoEnviado && (
        <div className="flex gap-2 text-left text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 rounded-lg p-3 mt-4">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-px" />
          <span>{t("noSalio")}</span>
        </div>
      )}

      <div className="mt-5 text-xs text-muted-foreground">
        <p>{t("noLoVeo")}</p>
        <button
          type="button"
          onClick={reenviar}
          disabled={isPending || reenviado}
          className="inline-flex items-center gap-1.5 mt-2 font-medium text-primary hover:underline disabled:opacity-50 disabled:no-underline"
        >
          {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {reenviado ? t("yaReenviado") : t("reenviar")}
        </button>
      </div>
    </div>
  );
}

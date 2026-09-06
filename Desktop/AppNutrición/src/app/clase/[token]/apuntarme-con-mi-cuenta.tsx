"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { apuntarmeConMiCuenta } from "@/app/actions/clase-publica";
import { signOut } from "@/app/actions/auth";

/** «No soy yo»: cierra la sesión y deja el formulario de siempre. También lo usa el profesor. */
export function CerrarSesionParaOtraCuenta() {
  const t = useTranslations("docencia");
  const [saliendo, setSaliendo] = useState(false);
  return (
    <button
      type="button"
      disabled={saliendo}
      onClick={async () => { setSaliendo(true); await signOut(); }}
      className="w-full inline-flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
    >
      {saliendo ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
      {t("clasePublica.otraCuenta")}
    </button>
  );
}

/**
 * El enlace de la clase abierto con una sesión ya dentro: un botón y listo. Si no es su cuenta,
 * cierra la sesión y aparece el formulario de siempre (Guillermo, 4 sep 2026).
 */
export function ApuntarmeConMiCuenta({ token, correo }: { token: string; correo: string }) {
  const t = useTranslations("docencia");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saliendo, setSaliendo] = useState(false);

  function apuntarme() {
    startTransition(async () => {
      const result = await apuntarmeConMiCuenta(token);
      if (result.ok) {
        toast.success(t("clasePublica.apuntado"));
        router.push("/aula");
      } else {
        toast.error(result.error || t("invitacion.errorGenerico"));
      }
    });
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <p className="text-sm">{t("clasePublica.conSesion", { correo })}</p>
      <button
        type="button"
        onClick={apuntarme}
        disabled={isPending || saliendo}
        className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
        {t("clasePublica.apuntarmeConEstaCuenta")}
      </button>
      <button
        type="button"
        disabled={isPending || saliendo}
        onClick={async () => { setSaliendo(true); await signOut(); }}
        className="w-full inline-flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        {saliendo ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
        {t("clasePublica.otraCuenta")}
      </button>
    </div>
  );
}

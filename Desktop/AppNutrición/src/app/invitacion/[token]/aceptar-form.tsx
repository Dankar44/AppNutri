"use client";

import { useState, useTransition } from "react";
import { Eye, EyeOff, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { aceptarInvitacionDocente } from "@/app/actions/invitaciones-docentes";
import { signOut } from "@/app/actions/auth";
import { AlertTriangle } from "lucide-react";

export function AceptarInvitacionForm({
  token,
  email,
  rol,
  sesionAbierta,
}: {
  token: string;
  email: string;
  // Como string y no como componente: por el límite servidor→cliente no se pasan funciones.
  rol: "PROFESOR" | "ALUMNO";
  /** Correo de quien ya está dentro en este navegador, si hay alguien. */
  sesionAbierta: string | null;
}) {
  const t = useTranslations("docencia");
  const [isPending, startTransition] = useTransition();
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [password, setPassword] = useState("");
  const [verPassword, setVerPassword] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await aceptarInvitacionDocente({ token, nombre, apellidos, password });
      if (result.ok) {
        toast.success(t("invitacion.cuentaCreada"));
        // Si había otra sesión abierta (el profesor probando), se cierra: si no, al ir a /login
        // se le colaría dentro con SU cuenta y parecería que la del alumno no se ha creado.
        if (sesionAbierta) {
          await signOut();
          return;
        }
        // Recarga completa para que el servidor vea la sesión nueva al identificarse.
        window.location.href = "/login";
      } else {
        toast.error(result.error || t("invitacion.errorGenerico"));
      }
    });
  }

  const input =
    "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-5 space-y-4">
      <p className="text-sm text-muted-foreground">
        {t(rol === "ALUMNO" ? "invitacion.explicacionAlumno" : "invitacion.explicacion")}
      </p>

      {sesionAbierta && (
        <div className="flex gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 rounded-lg p-3">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-px" />
          <span>{t("invitacion.otraSesion", { correo: sesionAbierta })}</span>
        </div>
      )}

      <div>
        <label className="text-xs font-medium text-muted-foreground">{t("invitacion.correo")}</label>
        {/* El correo no se puede cambiar: es al que se envió la invitación. */}
        <input type="email" value={email} disabled className={`${input} opacity-70`} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground">{t("invitacion.nombre")}</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            maxLength={100}
            autoFocus
            className={input}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">{t("invitacion.apellidos")}</label>
          <input
            type="text"
            value={apellidos}
            onChange={(e) => setApellidos(e.target.value)}
            maxLength={100}
            className={input}
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground">{t("invitacion.contrasena")}</label>
        <div className="relative mt-1">
          <input
            type={verPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            type="button"
            onClick={() => setVerPassword(!verPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={verPassword ? t("invitacion.ocultar") : t("invitacion.mostrar")}
          >
            {verPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{t("invitacion.contrasenaAyuda")}</p>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
        {t("invitacion.crearCuenta")}
      </button>
    </form>
  );
}

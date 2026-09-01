"use client";

import { useState, useTransition } from "react";
import { Eye, EyeOff, Loader2, UserPlus, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { apuntarseAClase } from "@/app/actions/clase-publica";
import { emailDelDominio } from "@/lib/docencia";

export function ApuntarseForm({ token, dominios }: { token: string; dominios: string[] }) {
  const t = useTranslations("docencia");
  const [isPending, startTransition] = useTransition();
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verPassword, setVerPassword] = useState(false);

  // Solo un aviso: hay universidades donde profesores y alumnos tienen dominios distintos, y
  // alguno usa su correo personal. Nunca impide apuntarse.
  const avisoDominio =
    dominios.length > 0 && email.includes("@") && !emailDelDominio(email, dominios.join(","));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await apuntarseAClase({ token, nombre, apellidos, email, password });
      if (result.ok) {
        toast.success(result.yaTeniaCuenta ? t("clasePublica.yaTeniaCuenta") : t("invitacion.cuentaCreada"));
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
      <p className="text-sm text-muted-foreground">{t("clasePublica.explicacion")}</p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground">{t("invitacion.nombre")}</label>
          <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required maxLength={100} autoFocus className={input} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">{t("invitacion.apellidos")}</label>
          <input type="text" value={apellidos} onChange={(e) => setApellidos(e.target.value)} maxLength={100} className={input} />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground">{t("invitacion.correo")}</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={input} />
        {dominios.length > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            {t("clasePublica.dominioSugerido", { dominios: dominios.map((d) => `@${d}`).join(", ") })}
          </p>
        )}
      </div>

      {avisoDominio && (
        <div className="flex gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 rounded-lg p-3">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-px" />
          <span>{t("clasePublica.avisoDominio")}</span>
        </div>
      )}

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
        <p className="text-xs text-muted-foreground mt-1">{t("clasePublica.contrasenaAyuda")}</p>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
        {t("clasePublica.apuntarme")}
      </button>
    </form>
  );
}

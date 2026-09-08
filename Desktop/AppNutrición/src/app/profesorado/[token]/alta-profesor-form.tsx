"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { apuntarmeComoProfesor } from "@/app/actions/enlaces-profesores";

/** El alta del profesor que todavía no usa Annonia. */
export function AltaProfesorForm({ token }: { token: string }) {
  const t = useTranslations("docencia.enlaceProfesorado");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const r = await apuntarmeComoProfesor({ token, nombre, apellidos, email, password });
      if (r.ok) {
        // Entra a su espacio con la contraseña que acaba de elegir.
        router.push(`/login?next=${encodeURIComponent("/profesor")}`);
      } else {
        toast.error(r.error ?? "");
      }
    });
  }

  const input =
    "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <form onSubmit={enviar} className="rounded-xl border border-border bg-card p-6 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground">{t("nombre")}</label>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} required maxLength={100} className={input} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">{t("apellidos")}</label>
          <input value={apellidos} onChange={(e) => setApellidos(e.target.value)} maxLength={100} className={input} />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">{t("correo")}</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={200} className={input} />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">{t("contrasena")}</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className={input} />
      </div>
      <button
        type="submit"
        disabled={isPending || !nombre.trim() || !email.trim() || password.length < 8}
        className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
        {t("crearCuenta")}
      </button>
    </form>
  );
}

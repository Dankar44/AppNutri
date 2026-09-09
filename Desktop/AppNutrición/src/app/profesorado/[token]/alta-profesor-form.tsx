"use client";

import { useState, useTransition } from "react";
import { Loader2, Eye, EyeOff, UserPlus, LogIn } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { apuntarmeComoProfesor } from "@/app/actions/enlaces-profesores";
import { createClient } from "@/lib/supabase/client";
import { RevisaTuCorreo } from "@/components/docencia/revisa-tu-correo";
import { cn } from "@/lib/utils";

const MINIMO = 6;

/**
 * El alta del profesor desde el enlace, con los dos caminos separados en dos pestañas.
 *
 * Antes era un solo formulario que servía para las dos cosas, y quien ya tenía cuenta veía
 * «contraseña» y «repetir contraseña» como si estuviera creándose otra: parecía que iba a
 * duplicarse la cuenta (Guillermo, 9 sep 2026). Ahora, «ya uso Annonia» pide lo que pide un inicio
 * de sesión —correo y contraseña— y nada más.
 */
export function AltaProfesorForm({ token }: { token: string }) {
  const t = useTranslations("docencia.enlaceProfesorado");
  const [isPending, startTransition] = useTransition();
  const [modo, setModo] = useState<"crear" | "entrar">("crear");
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Repetirla, igual que en el registro de siempre: una errata al teclearla deja fuera de su propia
  // cuenta a alguien que ni se ha enterado. Solo al crear: para entrar no tiene sentido.
  const [password2, setPassword2] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  // Cuenta recién creada y a la espera de que abra el correo. Se queda en esta misma página en vez
  // de mandarle a otra: si se va, pierde de vista a qué correo se lo hemos mandado.
  const [porVerificar, setPorVerificar] = useState<{ email: string; enviado: boolean; enlace?: string } | null>(null);

  const creando = modo === "crear";
  const cortaDemasiado = creando && password.length > 0 && password.length < MINIMO;
  const noCoinciden = password2.length > 0 && password !== password2;

  function cambiarA(nuevo: "crear" | "entrar") {
    setModo(nuevo);
    // La contraseña no se arrastra entre pestañas: al cambiar, lo que se pide es otra cosa.
    setPassword("");
    setPassword2("");
  }

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    // Se avisa en vez de dejar el botón apagado sin explicación: pasaba justo eso y no había manera
    // de saber qué faltaba (Guillermo, 9 sep 2026).
    if (creando) {
      if (password.length < MINIMO) {
        toast.error(t("contrasenaCorta", { minimo: MINIMO }));
        return;
      }
      if (password !== password2) {
        toast.error(t("contrasenasNoCoinciden"));
        return;
      }
    } else if (!password) {
      toast.error(t("escribeTuContrasena"));
      return;
    }

    startTransition(async () => {
      const r = await apuntarmeComoProfesor({
        token, nombre, apellidos, email, password, modo,
      });
      if (!r.ok) {
        toast.error(r.error ?? "");
        return;
      }
      // Cuenta nueva: no entra hasta que abra el correo. Al pulsar el botón del mensaje aterriza
      // ya dentro de su espacio docente, sin repetir correo ni contraseña.
      if (r.verificaTuCorreo) {
        setPorVerificar({ email: email.trim(), enviado: r.correoEnviado !== false, enlace: r.enlaceDePrueba });
        return;
      }
      // Ya usaba Annonia: su correo está verificado desde hace tiempo, así que se le deja dentro
      // con lo que acaba de escribir, sin hacerle pasar otra vez por el inicio de sesión.
      const { error } = await createClient().auth.signInWithPassword({ email, password });
      window.location.href = error ? "/login" : "/entrar";
    });
  }

  if (porVerificar) {
    return (
      <RevisaTuCorreo
        email={porVerificar.email}
        correoEnviado={porVerificar.enviado}
        enlaceDePrueba={porVerificar.enlace}
      />
    );
  }

  const input =
    "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";
  const pestana = (activa: boolean) =>
    cn(
      "flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
      activa ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground",
    );

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
      {/* Las dos cosas que se pueden hacer aquí, a la vista: si no, quien ya tiene cuenta cree que
          el formulario le está creando otra. */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        <button type="button" onClick={() => cambiarA("crear")} className={pestana(creando)}>
          <UserPlus className="w-4 h-4" />
          {t("pestanaCrear")}
        </button>
        <button type="button" onClick={() => cambiarA("entrar")} className={pestana(!creando)}>
          <LogIn className="w-4 h-4" />
          {t("pestanaEntrar")}
        </button>
      </div>

      <p className="text-xs text-muted-foreground">
        {creando ? t("explicacionCrear") : t("explicacionEntrar")}
      </p>

      <form onSubmit={enviar} className="space-y-4">
        {creando && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">{t("nombre")}</label>
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={100} className={input} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">{t("apellidos")}</label>
              <input value={apellidos} onChange={(e) => setApellidos(e.target.value)} maxLength={100} className={input} />
            </div>
          </div>
        )}

        <div>
          <label className="text-xs font-medium text-muted-foreground">{t("correo")}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            maxLength={200}
            autoComplete={creando ? "email" : "username"}
            className={input}
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground">
            {creando ? t("contrasena") : t("tuContrasenaDeSiempre")}
          </label>
          <div className="relative">
            <input
              type={verPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={creando ? MINIMO : undefined}
              maxLength={128}
              autoComplete={creando ? "new-password" : "current-password"}
              className={`${input} pr-11`}
            />
            <button
              type="button"
              onClick={() => setVerPassword(!verPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5 text-muted-foreground hover:text-foreground"
              aria-label={t("verContrasena")}
            >
              {verPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {creando && (
            <p className={cn("text-xs mt-1", cortaDemasiado ? "text-red-500" : "text-muted-foreground")}>
              {t("contrasenaMinimo", { minimo: MINIMO })}
            </p>
          )}
        </div>

        {creando && (
          <div>
            <label className="text-xs font-medium text-muted-foreground">{t("repetirContrasena")}</label>
            <input
              type={verPassword ? "text" : "password"}
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              required
              minLength={MINIMO}
              maxLength={128}
              autoComplete="new-password"
              className={input}
            />
            {noCoinciden && <p className="text-xs text-red-500 mt-1">{t("contrasenasNoCoinciden")}</p>}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending || !email.trim() || !password || (creando && !password2)}
          className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {creando ? t("crearCuenta") : t("entrarYUnirme")}
        </button>
      </form>
    </div>
  );
}

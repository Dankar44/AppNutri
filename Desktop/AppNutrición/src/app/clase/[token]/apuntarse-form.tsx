"use client";

import { useState, useTransition } from "react";
import { Eye, EyeOff, Loader2, UserPlus, AlertTriangle, LogIn } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { apuntarseAClase } from "@/app/actions/clase-publica";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/app/actions/auth";
import { emailDelDominio } from "@/lib/docencia";
import { RevisaTuCorreo } from "@/components/docencia/revisa-tu-correo";
import { cn } from "@/lib/utils";

export function ApuntarseForm({
  token,
  dominios,
  sesionAbierta,
}: {
  token: string;
  dominios: string[];
  /** Correo de quien ya está dentro en este navegador, si hay alguien. */
  sesionAbierta: string | null;
}) {
  const t = useTranslations("docencia");
  const [isPending, startTransition] = useTransition();
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  // Repetirla, igual que en el registro de siempre: una errata al teclearla deja fuera de su propia
  // cuenta a alguien que ni se ha enterado (Guillermo, 9 sep 2026).
  const [password2, setPassword2] = useState("");
  // Cuenta recién creada y a la espera de que abra el correo. Se queda aquí mismo: si se le
  // mandara a otra página perdería de vista a qué correo se lo hemos enviado.
  const [porVerificar, setPorVerificar] = useState<{ email: string; enviado: boolean; enlace?: string } | null>(null);
  // Las dos cosas que se pueden hacer aquí, separadas: quien ya usa Annonia veía «contraseña» y
  // «repetir contraseña» y creía que se le estaba creando otra cuenta (Guillermo, 9 sep 2026).
  const [modo, setModo] = useState<"crear" | "entrar">("crear");

  // Solo un aviso: hay universidades donde profesores y alumnos tienen dominios distintos, y
  // alguno usa su correo personal. Nunca impide apuntarse.
  const avisoDominio =
    dominios.length > 0 && email.includes("@") && !emailDelDominio(email, dominios.join(","));

  const MINIMO = 6;
  const creando = modo === "crear";
  const cortaDemasiado = creando && password.length > 0 && password.length < MINIMO;
  const noCoinciden = password2.length > 0 && password !== password2;

  function cambiarA(nuevo: "crear" | "entrar") {
    setModo(nuevo);
    // La contraseña no se arrastra entre pestañas: al cambiar, lo que se pide es otra cosa.
    setPassword("");
    setPassword2("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (creando) {
      if (password.length < MINIMO) {
        toast.error(t("clasePublica.contrasenaCorta", { minimo: MINIMO }));
        return;
      }
      if (password !== password2) {
        toast.error(t("clasePublica.contrasenasNoCoinciden"));
        return;
      }
    } else if (!password) {
      toast.error(t("clasePublica.escribeTuContrasena"));
      return;
    }
    startTransition(async () => {
      const result = await apuntarseAClase({ token, nombre, apellidos, email, password, modo });
      if (result.ok) {
        toast.success(result.yaTeniaCuenta ? t("clasePublica.yaTeniaCuenta") : t("invitacion.cuentaCreada"));
        // Cuenta nueva: no entra hasta que abra el correo. Al pulsar el botón del mensaje aterriza
        // ya dentro de su aula, y de paso esa sesión pisa la de quien estuviera en este navegador
        // —el profesor probando el enlace—, así que aquí no hace falta cerrar nada.
        if (result.verificaTuCorreo) {
          setPorVerificar({ email: email.trim(), enviado: result.correoEnviado !== false, enlace: result.enlaceDePrueba });
          return;
        }
        // Si había otra sesión abierta (el profesor probando el enlace), se cierra: si no, al ir
        // a /login entraría con SU cuenta y parecería que la del alumno no se ha creado.
        if (sesionAbierta) {
          await signOut();
          return;
        }
        // Ya usaba Annonia: su correo está verificado, así que se le deja dentro con lo que acaba
        // de escribir (Guillermo, 9 sep 2026: no hacerle el trabajo dos veces).
        const { error } = await createClient().auth.signInWithPassword({ email, password });
        window.location.href = error ? "/login" : "/entrar";
      } else {
        toast.error(result.error || t("invitacion.errorGenerico"));
      }
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

  const pestana = (activa: boolean) =>
    cn(
      "flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
      activa ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground",
    );

  const input =
    "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        <button type="button" onClick={() => cambiarA("crear")} className={pestana(creando)}>
          <UserPlus className="w-4 h-4" />
          {t("clasePublica.pestanaCrear")}
        </button>
        <button type="button" onClick={() => cambiarA("entrar")} className={pestana(!creando)}>
          <LogIn className="w-4 h-4" />
          {t("clasePublica.pestanaEntrar")}
        </button>
      </div>

      <p className="text-sm text-muted-foreground">
        {creando ? t("clasePublica.explicacion") : t("clasePublica.explicacionEntrar")}
      </p>

      {sesionAbierta && (
        <div className="flex gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 rounded-lg p-3">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-px" />
          <span>{t("invitacion.otraSesion", { correo: sesionAbierta })}</span>
        </div>
      )}

      {creando && (
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
      )}

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
        <label className="text-xs font-medium text-muted-foreground">
          {creando ? t("invitacion.contrasena") : t("clasePublica.tuContrasenaDeSiempre")}
        </label>
        <div className="relative mt-1">
          <input
            type={verPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={creando ? MINIMO : undefined}
            maxLength={128}
            autoComplete={creando ? "new-password" : "current-password"}
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
        {creando && (
          <p className={cn("text-xs mt-1", cortaDemasiado ? "text-red-500" : "text-muted-foreground")}>
            {t("clasePublica.contrasenaAyuda")}
          </p>
        )}
      </div>

      {creando && (
        <div>
          <label className="text-xs font-medium text-muted-foreground">{t("clasePublica.repetirContrasena")}</label>
          <input
            type={verPassword ? "text" : "password"}
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            required
            minLength={MINIMO}
            maxLength={128}
            autoComplete="new-password"
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {noCoinciden && <p className="text-xs text-red-500 mt-1">{t("clasePublica.contrasenasNoCoinciden")}</p>}
        </div>
      )}

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

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, Mail, User, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { asignarProfesorLicencia, buscarDietistasParaDocencia } from "@/app/actions/admin-docencia";
import { invitarProfesor } from "@/app/actions/invitaciones-docentes";
import { emailDelDominio } from "@/lib/docencia";
import { cn } from "@/lib/utils";

interface DietistaOption {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  /** Ya tiene el rol de profesor pero no está en ninguna universidad: solo le falta la facultad. */
  yaEsDocente: boolean;
}

export function AsignarProfesorForm({
  licenciaId,
  sinCupo,
  dominios,
}: {
  licenciaId: string;
  sinCupo: boolean;
  dominios: string[];
}) {
  const t = useTranslations("admin.universidades");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [modo, setModo] = useState<"existente" | "invitar">("existente");
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<DietistaOption[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [seleccionado, setSeleccionado] = useState<DietistaOption | null>(null);

  const [email, setEmail] = useState("");

  // Solo un aviso: el dominio nunca impide dar de alta (hay profesores de universidad con Gmail).
  const correoElegido = modo === "invitar" ? email : (seleccionado?.email ?? "");
  const avisoDominio =
    dominios.length > 0 &&
    correoElegido.includes("@") &&
    !emailDelDominio(correoElegido, dominios.join(","));

  async function handleBuscar(query: string) {
    setBusqueda(query);
    if (query.trim().length < 2) {
      setResultados([]);
      return;
    }
    setBuscando(true);
    try {
      setResultados(await buscarDietistasParaDocencia(query));
    } catch {
      setResultados([]);
    } finally {
      setBuscando(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      if (modo === "invitar") {
        const result = await invitarProfesor({ licenciaId, email });
        if (result.ok) {
          // Si ese correo ya era usuario de Annonia no se le manda a registrarse: se le da el rol.
          toast.success(result.resultado === "asignada" ? t("toastYaTeniaCuenta") : t("toastInvitacionEnviada"));
          setEmail("");
          router.refresh();
        } else {
          toast.error(result.error || t("toastErrorInvitar"));
        }
        return;
      }

      const result = await asignarProfesorLicencia({
        licenciaId,
        modo: "existente",
        dietistaId: seleccionado?.id,
      });
      if (result.ok) {
        toast.success(t("toastProfesorAsignado"));
        setSeleccionado(null);
        setBusqueda("");
        router.refresh();
      } else {
        toast.error(result.error || t("toastErrorAsignar"));
      }
    });
  }

  if (sinCupo) {
    return (
      <p className="text-sm text-muted-foreground border border-dashed border-border rounded-xl p-4">
        {t("sinCupoProfesores")}
      </p>
    );
  }

  const input =
    "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30";

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-5 space-y-4">
      <h3 className="font-semibold">{t("anadirProfesor")}</h3>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setModo("existente")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            modo === "existente"
              ? "bg-indigo-100 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-400"
              : "bg-muted text-muted-foreground hover:text-foreground",
          )}
        >
          <User className="w-4 h-4" />
          {t("form.yaTieneCuenta")}
        </button>
        <button
          type="button"
          onClick={() => setModo("invitar")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            modo === "invitar"
              ? "bg-indigo-100 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-400"
              : "bg-muted text-muted-foreground hover:text-foreground",
          )}
        >
          <Mail className="w-4 h-4" />
          {t("form.invitarPorCorreo")}
        </button>
      </div>

      {modo === "existente" ? (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => handleBuscar(e.target.value)}
              placeholder={t("form.buscarNutricionista")}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
            {buscando && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {resultados.length > 0 && !seleccionado && (
            <div className="border border-border rounded-lg overflow-hidden divide-y divide-border max-h-48 overflow-y-auto">
              {resultados.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    setSeleccionado(d);
                    setBusqueda("");
                    setResultados([]);
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-muted transition-colors"
                >
                  <span className="text-sm font-medium">
                    {d.nombre} {d.apellidos}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">{d.email}</span>
                  {d.yaEsDocente && (
                    <span className="ml-2 text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      {t("yaEsDocente")}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {seleccionado && (
            <div className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg">
              <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {seleccionado.nombre} {seleccionado.apellidos}
                </p>
                <p className="text-xs text-muted-foreground">{seleccionado.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setSeleccionado(null)}
                className="text-xs text-indigo-600 hover:underline shrink-0"
              >
                {t("form.cambiar")}
              </button>
            </div>
          )}

          <p className="text-xs text-muted-foreground">{t("form.ayudaExistente")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">{t("form.email")}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder={t("form.emailPlaceholder")}
              className={input}
            />
          </div>
          <p className="text-xs text-muted-foreground">{t("form.ayudaInvitar")}</p>
        </div>
      )}

      {avisoDominio && (
        <div className="flex gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 rounded-lg p-3">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-px" />
          <span>{t("form.avisoDominio", { dominios: dominios.map((d) => `@${d}`).join(", ") })}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending || (modo === "existente" ? !seleccionado : !email)}
        className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : modo === "invitar" ? <Mail className="w-4 h-4" /> : <User className="w-4 h-4" />}
        {modo === "invitar" ? t("form.enviarInvitacion") : t("form.asignar")}
      </button>
    </form>
  );
}

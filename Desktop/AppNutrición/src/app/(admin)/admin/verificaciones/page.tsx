import { ShieldCheck, ShieldAlert } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getDietistasPendientes } from "@/app/actions/admin";
import { capitalizarNombre, formatDate } from "@/lib/utils";
import { VerificacionActions } from "./verificacion-actions";

export default async function VerificacionesPage() {
  const t = await getTranslations("admin.verificaciones");
  const pendientes = await getDietistasPendientes();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground mt-1">
          {t("subtitle", { count: pendientes.length, countPlural: pendientes.length !== 1 ? "es" : "" })}
        </p>
      </div>

      {pendientes.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <ShieldCheck className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="font-medium text-lg mb-1">{t("todoVerificado.title")}</h3>
          <p className="text-muted-foreground">{t("todoVerificado.description")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendientes.map((d) => (
            <div key={d.id} className="bg-card rounded-xl border border-amber-200 dark:border-amber-500/30 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold shrink-0">
                    {d.nombre[0]?.toUpperCase()}{d.apellidos[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold">
                      {capitalizarNombre(d.nombre)} {capitalizarNombre(d.apellidos)}
                    </h3>
                    <p className="text-sm text-muted-foreground">{d.email}</p>
                    <div className="flex flex-wrap gap-3 mt-2 text-sm">
                      {d.numColegiado && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-medium text-xs">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          N.º colegiado: {d.numColegiado}
                        </span>
                      )}
                      {d.especialidad && (
                        <span className="text-xs text-muted-foreground">
                          {d.especialidad}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        Registrado el {formatDate(d.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <VerificacionActions dietistaId={d.id} nombre={`${d.nombre} ${d.apellidos}`} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

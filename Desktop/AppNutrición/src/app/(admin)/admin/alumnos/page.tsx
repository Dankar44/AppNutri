import Link from "next/link";
import { redirect } from "next/navigation";
import { GraduationCap, Users, AlertTriangle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/admin";
import { getAlumnosAdmin, getConsumoDeLicencias } from "@/app/actions/admin-docencia";
import { formatDate } from "@/lib/utils";
import { getLocale } from "@/i18n/locale";
import { FiltroAlumnos } from "./filtro-alumnos";

/**
 * #39 — Los alumnos, vistos desde administración.
 *
 * Es la pantalla para responder al teléfono cuando llama una facultad: quién está dentro, de qué
 * clase, con qué profesor y desde cuándo. Y, sobre todo, cuántas plazas de las vendidas se están
 * usando de verdad, que es lo que se renueva en junio.
 */
export default async function AlumnosAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ licencia?: string; estado?: string; buscar?: string }>;
}) {
  const admin = await requireAdmin();
  if (!admin || admin.role !== "admin") redirect("/admin-login");

  const { licencia, estado, buscar } = await searchParams;
  const t = await getTranslations("admin.alumnos");
  const locale = await getLocale();

  const [alumnos, consumo] = await Promise.all([
    getAlumnosAdmin({ licenciaId: licencia, estado, buscar }),
    getConsumoDeLicencias(),
  ]);

  const distintos = new Set(alumnos.filter((a) => a.activo).map((a) => a.id)).size;
  const sinEstrenar = alumnos.filter((a) => a.activo && a.nuncaEntro).length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground mt-1">
          {t("subtitle", { matriculas: alumnos.length, alumnos: distintos })}
        </p>
      </div>

      {consumo.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          {consumo.map((c) => (
            <Link
              key={c.id}
              href={`/admin/alumnos?licencia=${c.id}`}
              className="block bg-card border border-border rounded-xl p-4 hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-sm leading-tight">{c.institucion}</p>
                {!c.activa && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">
                    {t("inactiva")}
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold tabular-nums mt-2">
                {c.ocupadas}
                <span className="text-base font-normal text-muted-foreground">/{c.maxAlumnos}</span>
              </p>
              <p className="text-xs text-muted-foreground">{t("plazasUsadas", { libres: c.libres })}</p>
            </Link>
          ))}
        </div>
      )}

      <FiltroAlumnos
        instituciones={consumo.map((c) => ({ id: c.id, nombre: c.institucion }))}
        licencia={licencia ?? ""}
        estado={estado ?? ""}
        buscar={buscar ?? ""}
      />

      {sinEstrenar > 0 && (
        <div className="flex gap-3 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-4 mb-4">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-900 dark:text-amber-200">
            {t("nuncaEntraron", { n: sinEstrenar })}
          </p>
        </div>
      )}

      {alumnos.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <Users className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <p className="text-muted-foreground">{t("vacio")}</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left font-medium px-4 py-3">{t("col.alumno")}</th>
                  <th className="text-left font-medium px-4 py-3">{t("col.institucion")}</th>
                  <th className="text-left font-medium px-4 py-3">{t("col.clase")}</th>
                  <th className="text-left font-medium px-4 py-3">{t("col.alta")}</th>
                  <th className="text-left font-medium px-4 py-3">{t("col.ultimoAcceso")}</th>
                  <th className="text-left font-medium px-4 py-3">{t("col.estado")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {alumnos.map((a) => (
                  <tr key={`${a.id}-${a.claseId}`} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Link href={`/admin/dietistas/${a.id}`} className="font-medium hover:underline">
                        {a.nombre} {a.apellidos}
                      </Link>
                      <p className="text-xs text-muted-foreground">{a.email}</p>
                      {!a.cuentaDeClase && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground mt-1">
                          {t("yaTeniaCuenta")}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {a.licenciaId ? (
                        <Link href={`/admin/universidades/${a.licenciaId}`} className="hover:underline">
                          {a.institucion}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {a.clase}
                      <p className="text-xs text-muted-foreground">{a.profesor}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums">
                      {a.altaAt ? formatDate(a.altaAt, locale) : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums">
                      {a.ultimoAcceso ? formatDate(a.ultimoAcceso, locale) : t("nunca")}
                    </td>
                    <td className="px-4 py-3">
                      {a.activo ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                          <GraduationCap className="w-3 h-3" />
                          {t("estado.activo")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {a.bajaAt ? t("estado.retiradoEl", { fecha: formatDate(a.bajaAt, locale) }) : t("estado.retirado")}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

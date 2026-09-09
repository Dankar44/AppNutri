import Link from "next/link";
import { redirect } from "next/navigation";
import { GraduationCap, AlertTriangle, Users } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { getProfesoresAdmin, getConsumoDeLicencias } from "@/app/actions/admin-docencia";
import { formatDate } from "@/lib/utils";
import { getLocale } from "@/i18n/locale";
import { FiltroProfesores } from "./filtro-profesores";

/**
 * #39 — Todos los profesores de todas las universidades, en una sola pantalla.
 *
 * El hermano de la de alumnos, que faltaba: se veían universidad por universidad y no había forma
 * de mirarlos juntos (Guillermo, 9 sep 2026). Lo que se responde aquí: quién está dentro, de qué
 * facultad, y —lo importante— si usa el módulo de verdad (clases y casos) o solo ocupa una plaza
 * pagada.
 */
export default async function ProfesoresAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ licencia?: string; estado?: string; buscar?: string }>;
}) {
  const admin = await requireAdmin();
  if (!admin || admin.role !== "admin") redirect("/admin-login");

  const { licencia, estado, buscar } = await searchParams;
  const locale = await getLocale();

  const [profesores, consumo] = await Promise.all([
    getProfesoresAdmin({ licenciaId: licencia, estado, buscar }),
    getConsumoDeLicencias(),
  ]);

  const sinEstrenar = profesores.filter((p) => p.nuncaEntro).length;
  const sinClases = profesores.filter((p) => !p.nuncaEntro && p.clases === 0 && p.casos === 0).length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Profesores</h1>
        <p className="text-muted-foreground mt-1">
          {profesores.length} en total, de todas las universidades.
        </p>
      </div>

      <FiltroProfesores
        instituciones={consumo.map((c) => ({ id: c.id, nombre: c.institucion }))}
        licencia={licencia ?? ""}
        estado={estado ?? ""}
        buscar={buscar ?? ""}
      />

      {(sinEstrenar > 0 || sinClases > 0) && (
        <div className="flex gap-3 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-4 mb-4">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-900 dark:text-amber-200">
            {sinEstrenar > 0 && <>{sinEstrenar} no han entrado nunca. </>}
            {sinClases > 0 && <>{sinClases} han entrado pero no tienen ninguna clase ni caso.</>}
          </p>
        </div>
      )}

      {profesores.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <Users className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <p className="text-muted-foreground">No hay ningún profesor con esos filtros.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Profesor</th>
                  <th className="text-left font-medium px-4 py-3">Universidad</th>
                  <th className="text-left font-medium px-4 py-3">Clases</th>
                  <th className="text-left font-medium px-4 py-3">Casos</th>
                  <th className="text-left font-medium px-4 py-3">Pacientes</th>
                  <th className="text-left font-medium px-4 py-3">Alta</th>
                  <th className="text-left font-medium px-4 py-3">Último acceso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {profesores.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Link href={`/admin/dietistas/${p.id}`} className="font-medium hover:underline">
                        {p.nombre} {p.apellidos}
                      </Link>
                      <p className="text-xs text-muted-foreground">{p.email}</p>
                      {p.sinVerificar && (
                        <span className="inline-block mt-1 rounded-full bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 px-2 py-0.5 text-[11px] font-medium">
                          sin verificar
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {p.institucion ? (
                        p.licenciaId ? (
                          <Link href={`/admin/universidades/${p.licenciaId}`} className="hover:underline">
                            {p.institucion}
                          </Link>
                        ) : (
                          p.institucion
                        )
                      ) : (
                        /* Se fue de su facultad: conserva el espacio hasta el 31 de agosto de su curso. */
                        <span className="text-muted-foreground">
                          Sin universidad
                          {p.docenciaHasta && (
                            <span className="block text-xs">hasta {formatDate(p.docenciaHasta, locale)}</span>
                          )}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">{p.clases || "—"}</td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">{p.casos || "—"}</td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">{p.pacientes || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums">{formatDate(p.altaAt, locale)}</td>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums">
                      {p.ultimoAcceso ? (
                        formatDate(p.ultimoAcceso, locale)
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400">
                          <GraduationCap className="w-3 h-3" />
                          nunca
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

import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { redirect } from "next/navigation";
import { GraduationCap, Plus, Users, UserCog } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/admin";
import { getLicenciasDocentes } from "@/app/actions/admin-docencia";

export default async function UniversidadesPage() {
  const admin = await requireAdmin();
  if (!admin || admin.role !== "admin") redirect("/admin-login");

  const t = await getTranslations("admin.universidades");
  const licencias = await getLicenciasDocentes();

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground mt-1">{t("subtitle", { count: licencias.length })}</p>
        </div>
        <Link
          href="/admin/universidades/crear"
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          {t("nueva")}
        </Link>
      </div>

      {licencias.length === 0 ? (
        <div className="text-center py-16">
          <GraduationCap className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">{t("vacio")}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {licencias.map((l) => (
            <Link
              key={l.id}
              href={`/admin/universidades/${l.id}`}
              className="block bg-card border border-border rounded-xl p-5 hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-semibold leading-tight">{l.institucion}</h2>
                {!l.activa && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">
                    {t("inactiva")}
                  </span>
                )}
              </div>
              {l.fechaFin && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("cursoEtiqueta", { inicio: formatDate(l.fechaInicio), fin: formatDate(l.fechaFin) })}
                </p>
              )}
              <div className="flex items-center gap-4 mt-4 text-sm">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <UserCog className="w-4 h-4" />
                  <span className="tabular-nums">{l.profesores}/{l.maxProfesores}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span className="tabular-nums">{l.alumnos}/{l.maxAlumnos}</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

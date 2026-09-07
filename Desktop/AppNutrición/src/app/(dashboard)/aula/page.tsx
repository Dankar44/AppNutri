import { redirect } from "next/navigation";
import Link from "next/link";
import { GraduationCap, CalendarRange, Users, Archive, ClipboardList } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { limpiarDocenciaSiToca } from "@/lib/limpieza-docente";
import type { Metadata } from "next";
import { getCurrentDietista } from "@/app/actions/auth";
import { getMisClasesComoAlumno, getMisCasosDelAula } from "@/app/actions/aula";
import { formatDate } from "@/lib/utils";
import { getLocale } from "@/i18n/locale";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("aula");
  return { title: t("titulo") };
}

/**
 * #39 — El aula del alumno: dónde está matriculado y con quién.
 *
 * De momento solo las clases; los casos que le asigna su profesor y sus entregas vienen después.
 * Su cuenta profesional sigue estando a un clic, en el menú.
 */
export default async function AulaPage() {
  // Una vez al día, sin esperar: el módulo se limpia solo (`limpieza-docente`).
  limpiarDocenciaSiToca(prisma);
  const dietista = await getCurrentDietista();
  if (!dietista) redirect("/login");

  const t = await getTranslations("aula");
  const locale = await getLocale();
  const [clases, casosCrudos] = await Promise.all([getMisClasesComoAlumno(), getMisCasosDelAula()]);
  const enMarcha = clases.filter((c) => c.activa);
  const pasadas = clases.filter((c) => !c.activa);

  // Las fechas se formatean aquí: el componente de cliente no sabe de idiomas.
  const casos = casosCrudos;

  return (
    <div className="space-y-6">
      <section>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <GraduationCap strokeWidth={1.75} className="w-6 h-6 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold leading-tight">{t("titulo")}</h1>
            <p className="text-sm text-muted-foreground">
              {enMarcha.length > 0 ? t("subtitulo", { n: enMarcha.length }) : t("subtituloSinClases")}
            </p>
          </div>
        </div>
      </section>

      {clases.length === 0 ? (
        <div className="text-center py-14">
          <GraduationCap strokeWidth={1.5} className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="font-medium">{t("vaciaTitulo")}</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">{t("vaciaTexto")}</p>
        </div>
      ) : (
        <div className="lg:grid lg:grid-cols-2 lg:gap-4 divide-y divide-border lg:divide-y-0">
          {enMarcha.map((c) => (
            <Link
              key={c.id}
              href={`/aula/${c.id}`}
              className="block py-4 lg:px-6 lg:py-6 lg:border lg:border-border lg:rounded-2xl lg:bg-card hover:border-primary/40 transition-colors group"
            >
              <h2 className="font-semibold leading-tight group-hover:text-primary transition-colors">{c.nombre}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {c.institucion}
              </p>
              <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                <p className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 shrink-0" />
                  {c.profesores.map((p) => p.nombre).join(", ")}
                </p>
                {c.fechaFinCurso && (
                  <p className="flex items-center gap-1.5">
                    <CalendarRange className="w-4 h-4 shrink-0" />
                    {c.fechaInicioCurso
                      ? t("delAl", { inicio: formatDate(c.fechaInicioCurso, locale), fin: formatDate(c.fechaFinCurso, locale) })
                      : t("hasta", { fecha: formatDate(c.fechaFinCurso, locale) })}
                  </p>
                )}
              </div>
              {/* Cuántos casos tiene dentro, cuántos le quedan por entregar y cuántos le han
                  corregido ya: sin lo último, entraba, leía «1 caso» y no se enteraba de que
                  tenía nota hasta abrir la clase (visto al recorrer el guion, 6 sep 2026). */}
              <p className="text-sm mt-3 inline-flex items-center gap-1.5 font-medium text-primary">
                <ClipboardList className="w-4 h-4" />
                {t("casos.enLaClase", {
                  n: casos.filter((k) => k.claseId === c.id).length,
                  pendientes: casos.filter((k) => k.claseId === c.id && (k.estado === "SIN_EMPEZAR" || k.estado === "EN_MARCHA")).length,
                  corregidos: casos.filter((k) => k.claseId === c.id && k.estado === "CORREGIDA" && k.nota !== null).length,
                })}
              </p>
            </Link>
          ))}
        </div>
      )}

      {pasadas.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-muted-foreground inline-flex items-center gap-1.5 mb-2">
            <Archive className="w-4 h-4" />
            {t("pasadasTitulo", { n: pasadas.length })}
          </h2>
          <div className="divide-y divide-border">
            {pasadas.map((c) => (
              <div key={c.id} className="py-2.5">
                <p className="text-sm text-muted-foreground">
                  {c.nombre}

                </p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">{t("pasadasTexto")}</p>
        </section>
      )}
    </div>
  );
}

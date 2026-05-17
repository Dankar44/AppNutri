import { redirect } from "next/navigation";
import { MessageSquareText, Droplets, Dumbbell, ShieldBan, Sparkles, Flame, Timer } from "lucide-react";
import { getCurrentPaciente } from "@/lib/patient-auth";
import { prisma } from "@/lib/prisma";
import { capitalizarNombre } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { getTranslations } from "next-intl/server";

interface EjercicioItem {
  nombre: string;
  met: number;
  duracion: number;
  frecuencia: number;
}

interface RecomendacionesData {
  agua: string;
  ejercicios: EjercicioItem[];
  alimentosEvitar: string[];
  otrasRecomendaciones: string;
}

function parseRecomendaciones(raw: string | null): RecomendacionesData | string | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && "agua" in parsed) {
      return {
        agua: parsed.agua || "",
        ejercicios: Array.isArray(parsed.ejercicios) ? parsed.ejercicios : [],
        alimentosEvitar: Array.isArray(parsed.alimentosEvitar) ? parsed.alimentosEvitar : [],
        otrasRecomendaciones: parsed.otrasRecomendaciones || "",
      };
    }
  } catch {
    // not JSON — treat as plain text
  }
  return raw;
}

// frecuenciaLabel is now inlined using t() in the component

export default async function RecomendacionesPage() {
  const session = await getCurrentPaciente();
  if (!session) redirect("/paciente/login");
  const t = await getTranslations("patient-portal");

  const rows = await prisma.$queryRawUnsafe<{
    recomendaciones: string | null;
    dietistaNombre: string;
    dietistaApellidos: string;
  }[]>(
    `SELECT p.recomendaciones, d.nombre as "dietistaNombre", d.apellidos as "dietistaApellidos"
     FROM pacientes p JOIN dietistas d ON p."dietistaId" = d.id
     WHERE p.id = $1`,
    session.pacienteId
  );

  const data = rows[0];
  const parsed = parseRecomendaciones(data?.recomendaciones || null);
  const dietistaNombre = data
    ? `${capitalizarNombre(data.dietistaNombre)} ${capitalizarNombre(data.dietistaApellidos)}`
    : t("recomendaciones.fallbackNutri");

  const isStructured = parsed !== null && typeof parsed === "object";
  const structured = isStructured ? (parsed as RecomendacionesData) : null;
  const hasContent = structured
    ? !!(structured.agua || structured.ejercicios.length || structured.alimentosEvitar.length || structured.otrasRecomendaciones)
    : typeof parsed === "string" && parsed.trim().length > 0;

  return (
    <div>
      <PageHeader
        icon={MessageSquareText}
        title={t("recomendaciones.title")}
        subtitle={t("recomendaciones.subtitle", { nombre: dietistaNombre })}
      />

      {!hasContent ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <MessageSquareText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-medium text-lg mb-1">{t("recomendaciones.empty.title")}</h3>
          <p className="text-muted-foreground">
            {t("recomendaciones.empty.description")}
          </p>
        </div>
      ) : structured ? (
        <div className="space-y-5">
          {structured.agua && (
            <section className="bg-card rounded-xl border border-border p-5">
              <h2 className="text-base font-semibold flex items-center gap-2 mb-3">
                <Droplets className="w-5 h-5 text-blue-500" />
                {t("recomendaciones.sections.ingestaAgua")}
              </h2>
              <p className="text-sm text-foreground">{structured.agua}</p>
            </section>
          )}

          {structured.ejercicios.length > 0 && (
            <section className="bg-card rounded-xl border border-border p-5">
              <h2 className="text-base font-semibold flex items-center gap-2 mb-4">
                <Dumbbell className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                {t("recomendaciones.sections.ejercicioFisico")}
              </h2>
              <div className="space-y-2">
                {structured.ejercicios.map((ej) => (
                  <div
                    key={ej.nombre}
                    className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{ej.nombre}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {ej.frecuencia >= 7
                          ? t("recomendaciones.frecuencia.todosDias")
                          : t("recomendaciones.frecuencia.vecesSemana", { count: ej.frecuencia })}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                      <span className="inline-flex items-center gap-1">
                        <Timer className="w-3.5 h-3.5 text-primary" />
                        {ej.duracion} min
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-orange-500" />
                        MET {ej.met}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {structured.alimentosEvitar.length > 0 && (
            <section className="bg-card rounded-xl border border-border p-5">
              <h2 className="text-base font-semibold flex items-center gap-2 mb-4">
                <ShieldBan className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                {t("recomendaciones.sections.alimentosEvitar")}
              </h2>
              <div className="flex flex-wrap gap-2">
                {structured.alimentosEvitar.map((item, idx) => (
                  <span
                    key={`${item}-${idx}`}
                    className="inline-flex items-center bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 rounded-full px-3 py-1 text-sm"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </section>
          )}

          {structured.otrasRecomendaciones && (
            <section className="bg-card rounded-xl border border-border p-5">
              <h2 className="text-base font-semibold flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-teal-500" />
                {t("recomendaciones.sections.otrasRecomendaciones")}
              </h2>
              <div className="prose prose-sm max-w-none whitespace-pre-line text-foreground text-sm leading-relaxed">
                {structured.otrasRecomendaciones}
              </div>
            </section>
          )}
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="prose prose-sm max-w-none whitespace-pre-line text-foreground">
            {parsed as string}
          </div>
        </div>
      )}
    </div>
  );
}

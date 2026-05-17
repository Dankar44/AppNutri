import Link from "next/link";
import { Plus, UtensilsCrossed, BookCopy } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getPlanes } from "@/app/actions/planes";
import { getPlantillas } from "@/app/actions/plantillas";
import { formatDate, capitalizarNombre } from "@/lib/utils";
import { AvatarPaciente } from "@/components/avatar-paciente";
import { DietasFilter } from "./dietas-filter";
import { PageHeader } from "@/components/page-header";

interface Props {
  searchParams: Promise<{ busqueda?: string }>;
}

export default async function DietasPage({ searchParams }: Props) {
  const t = await getTranslations("diets");
  const { busqueda } = await searchParams;
  const [planes, plantillas] = await Promise.all([
    getPlanes(busqueda),
    getPlantillas(),
  ]);

  // Agrupar planes por paciente
  const porPaciente = new Map<string, {
    pacienteId: string;
    paciente: { nombre: string; apellidos: string; fotoUrl: string | null };
    planes: typeof planes;
  }>();

  for (const plan of planes) {
    const key = `${plan.pacienteId}`;
    if (!porPaciente.has(key)) {
      porPaciente.set(key, {
        pacienteId: plan.pacienteId,
        paciente: plan.paciente,
        planes: [],
      });
    }
    porPaciente.get(key)!.planes.push(plan);
  }

  const grupos = Array.from(porPaciente.values());

  return (
    <div>
      <PageHeader
        icon={UtensilsCrossed}
        title={t("list.pageTitle")}
        subtitle={t("list.subtitle", { count: planes.length, groups: grupos.length })}
      />

      <div className="mb-6 flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <DietasFilter />
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {plantillas.length > 0 && (
            <Link
              href="/dietas/plantillas"
              className="inline-flex items-center justify-center gap-2 w-10 h-10 sm:w-auto sm:h-auto sm:px-4 sm:py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium"
              aria-label={t("list.templatesLink", { count: plantillas.length })}
            >
              <BookCopy className="w-4 h-4" />
              <span className="hidden sm:inline">{t("list.templatesLink", { count: plantillas.length })}</span>
            </Link>
          )}
          <Link
            href="/dietas/nuevo"
            data-tour="nuevo-plan-btn"
            className="inline-flex items-center justify-center gap-2 w-10 h-10 sm:w-auto sm:h-auto sm:px-4 sm:py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
            aria-label={t("list.newPlan")}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t("list.newPlan")}</span>
          </Link>
        </div>
      </div>

      {planes.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <UtensilsCrossed className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-medium text-lg mb-1">
            {busqueda ? t("list.noResultsTitle") : t("list.noPlansTitle")}
          </h3>
          <p className="text-muted-foreground mb-4">
            {busqueda
              ? t("list.noResultsMessage", { query: busqueda })
              : t("list.emptyMessage")}
          </p>
          {!busqueda && (
            <Link
              href="/dietas/nuevo"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              {t("list.createPlan")}
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {grupos.map((grupo) => (
            <section
              key={`${grupo.paciente.nombre}-${grupo.paciente.apellidos}`}
              className="bg-card rounded-xl border border-border overflow-hidden"
            >
              {/* Cabecera del paciente */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-muted/30">
                <AvatarPaciente
                  nombre={grupo.paciente.nombre}
                  apellidos={grupo.paciente.apellidos}
                  fotoUrl={grupo.paciente.fotoUrl}
                  size="md"
                />
                <div className="min-w-0">
                  <h2 className="font-semibold truncate">
                    {capitalizarNombre(grupo.paciente.nombre)} {capitalizarNombre(grupo.paciente.apellidos)}
                  </h2>
                  <div className="mt-0.5 flex items-center gap-2 text-xs">
                    <p className="text-muted-foreground">
                      {t("list.planCount", { count: grupo.planes.length })}
                    </p>
                    {grupo.planes.length > 1 && (
                      <Link
                        href={`/pacientes/${grupo.pacienteId}?pestana=plan-alimentacion`}
                        className="font-medium text-primary hover:underline"
                      >
                        {t("list.viewHistory")}
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {/* Mostrar solo la receta (plan) activa por paciente */}
              <div className="divide-y divide-border">
                {(() => {
                  const planActivo =
                    grupo.planes.find((plan) => plan.activo) ?? grupo.planes[0];

                  if (!planActivo) return null;

                  return (
                    <Link
                      href={`/dietas/${planActivo.id}`}
                      className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-muted/40 transition-colors group"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {t("list.activePlan")}
                        </p>
                        <h3 className="mt-1 font-medium truncate group-hover:text-primary transition-colors">
                          {planActivo.nombre}
                        </h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDate(planActivo.createdAt)}
                        </p>
                      </div>
                      <span className="text-muted-foreground group-hover:text-primary transition-colors text-sm">&rsaquo;</span>
                    </Link>
                  );
                })()}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

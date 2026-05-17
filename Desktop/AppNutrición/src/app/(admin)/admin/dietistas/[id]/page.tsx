import Link from "next/link";
import { ArrowLeft, Mail, Phone, Building2, Award, Users, UtensilsCrossed, Stethoscope, CookingPot, CalendarDays, CreditCard } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getDietistaDetalle } from "@/app/actions/admin";
import { capitalizarNombre, formatDate } from "@/lib/utils";
import { redirect } from "next/navigation";

const ESTADO_COLOR: Record<string, string> = { ACTIVA: "text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-500/10", PRUEBA: "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10", CANCELADA: "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-500/10", EXPIRADA: "text-muted-foreground bg-muted" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DietistaDetallePage({ params }: Props) {
  const { id } = await params;
  const [dietista, t] = await Promise.all([
    getDietistaDetalle(id),
    getTranslations("admin"),
  ]);
  if (!dietista) redirect("/admin/dietistas");

  const PLAN_LABEL: Record<string, string> = { BASICO: t("dietistaDetalle.suscripcion.planLabel.basico"), PROFESIONAL: t("dietistaDetalle.suscripcion.planLabel.profesional") };
  const ESTADO_LABEL: Record<string, string> = { ACTIVA: t("dietistaDetalle.suscripcion.estadoLabel.activa"), PRUEBA: t("dietistaDetalle.suscripcion.estadoLabel.prueba"), CANCELADA: t("dietistaDetalle.suscripcion.estadoLabel.cancelada"), EXPIRADA: t("dietistaDetalle.suscripcion.estadoLabel.expirada") };
  const OBJETIVO_LABEL: Record<string, string> = { PERDER_PESO: t("dietistas.objetivoLabel.perderPeso"), GANAR_MASA: t("dietistas.objetivoLabel.ganarMasa"), MANTENIMIENTO: t("dietistas.objetivoLabel.mantenimiento"), PATOLOGIA: t("dietistas.objetivoLabel.patologia"), DEPORTIVO: t("dietistas.objetivoLabel.deportivo"), OTRO: t("dietistas.objetivoLabel.otro") };

  const stats = [
    { label: t("dietistaDetalle.stats.pacientes"), value: dietista._count.pacientes, icon: Users, color: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10" },
    { label: t("dietistaDetalle.stats.planes"), value: dietista._count.planes, icon: UtensilsCrossed, color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10" },
    { label: t("dietistaDetalle.stats.consultas"), value: dietista._count.consultas, icon: Stethoscope, color: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10" },
    { label: t("dietistaDetalle.stats.recetas"), value: dietista._count.recetas, icon: CookingPot, color: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10" },
    { label: t("dietistaDetalle.stats.alimentos"), value: dietista._count.alimentos, icon: CalendarDays, color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10" },
    { label: t("dietistaDetalle.stats.citas"), value: dietista._count.citas, icon: CalendarDays, color: "text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-500/10" },
  ];

  return (
    <div>
      <Link href="/admin/dietistas" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" />
        {t("dietistaDetalle.volverDietistas")}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Perfil */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">
                {capitalizarNombre(dietista.nombre)} {capitalizarNombre(dietista.apellidos)}
              </h1>
              <p className="text-muted-foreground text-sm mt-1">{t("dietistaDetalle.registradoEl", { date: formatDate(dietista.createdAt) })}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="w-4 h-4" />
              {dietista.email}
            </div>
            {dietista.telefono && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="w-4 h-4" />
                {dietista.telefono}
              </div>
            )}
            {dietista.especialidad && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Award className="w-4 h-4" />
                {dietista.especialidad}
              </div>
            )}
            {dietista.clinica && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="w-4 h-4" />
                {dietista.clinica}
              </div>
            )}
            {dietista.numColegiado && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Award className="w-4 h-4" />
                {t("dietistaDetalle.numColegiado", { number: dietista.numColegiado })}
              </div>
            )}
          </div>
        </div>

        {/* Suscripción */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            {t("dietistaDetalle.suscripcion.title")}
          </h2>
          {dietista.suscripcion ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("dietistaDetalle.suscripcion.plan")}</span>
                <span className="font-medium">{PLAN_LABEL[dietista.suscripcion.plan] || dietista.suscripcion.plan}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("dietistaDetalle.suscripcion.estado")}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_COLOR[dietista.suscripcion.estado] || ""}`}>
                  {ESTADO_LABEL[dietista.suscripcion.estado] || dietista.suscripcion.estado}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("dietistaDetalle.suscripcion.inicio")}</span>
                <span className="text-sm">{formatDate(dietista.suscripcion.fechaInicio)}</span>
              </div>
              {dietista.suscripcion.fechaFin && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t("dietistaDetalle.suscripcion.fin")}</span>
                  <span className="text-sm">{formatDate(dietista.suscripcion.fechaFin)}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("dietistaDetalle.suscripcion.sinSuscripcion")}</p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-4 text-center">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2 ${s.color}`}>
              <s.icon className="w-4 h-4" />
            </div>
            <p className="text-xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Pacientes */}
      <div className="bg-card rounded-xl border border-border overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-semibold">{t("dietistaDetalle.pacientesSection.title", { count: dietista.pacientes.length })}</h2>
        </div>
        {dietista.pacientes.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">{t("dietistaDetalle.pacientesSection.empty")}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">{t("dietistaDetalle.pacientesSection.columns.paciente")}</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground hidden md:table-cell">{t("dietistaDetalle.pacientesSection.columns.email")}</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-muted-foreground hidden sm:table-cell">{t("dietistaDetalle.pacientesSection.columns.objetivo")}</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-muted-foreground">{t("dietistaDetalle.pacientesSection.columns.planes")}</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-muted-foreground hidden sm:table-cell">{t("dietistaDetalle.pacientesSection.columns.consultas")}</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-muted-foreground hidden lg:table-cell">{t("dietistaDetalle.pacientesSection.columns.estado")}</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground hidden lg:table-cell">{t("dietistaDetalle.pacientesSection.columns.fechaAlta")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {dietista.pacientes.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">
                      {capitalizarNombre(p.nombre)} {capitalizarNombre(p.apellidos)}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{p.email || "-"}</td>
                    <td className="px-4 py-3 text-center text-xs hidden sm:table-cell">
                      {OBJETIVO_LABEL[p.objetivo] || p.objetivo}
                    </td>
                    <td className="px-4 py-3 text-center text-sm">{p._count.planes}</td>
                    <td className="px-4 py-3 text-center text-sm hidden sm:table-cell">{p._count.consultas}</td>
                    <td className="px-4 py-3 text-center hidden lg:table-cell">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${p.activo ? "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400" : "bg-muted text-muted-foreground"}`}>
                        {p.activo ? t("dietistas.pacienteEstado.activo") : t("dietistas.pacienteEstado.inactivo")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell">{formatDate(p.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Últimas consultas */}
      {dietista.ultimasConsultas.length > 0 && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-semibold">{t("dietistaDetalle.ultimasConsultas")}</h2>
          </div>
          <div className="divide-y divide-border">
            {dietista.ultimasConsultas.map((c) => (
              <div key={c.id} className="px-6 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {capitalizarNombre(c.paciente.nombre)} {capitalizarNombre(c.paciente.apellidos)}
                  </p>
                  {c.motivo && <p className="text-xs text-muted-foreground">{c.motivo}</p>}
                </div>
                <span className="text-xs text-muted-foreground">{formatDate(c.fecha)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

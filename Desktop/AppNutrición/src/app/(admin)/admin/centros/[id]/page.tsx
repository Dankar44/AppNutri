import { requireAdmin } from "@/lib/admin";
import { redirect, notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCentroDetalle } from "@/app/actions/admin";
import { EditarCentroForm } from "./editar-centro-form";
import Link from "next/link";
import { ArrowLeft, Building2, Crown, Users, Mail, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function CentroDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireAdmin();
  if (!admin || admin.role !== "admin") redirect("/admin-login");

  const { id } = await params;
  const t = await getTranslations("admin.centros");
  const centro = await getCentroDetalle(id);

  if (!centro) notFound();

  const ratio = centro.miembros.length / centro.maxMiembros;
  const barColor = ratio >= 1 ? "bg-red-500" : ratio >= 0.8 ? "bg-amber-500" : "bg-emerald-500";
  const badgeColor =
    ratio >= 1
      ? "text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400"
      : ratio >= 0.8
        ? "text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400"
        : "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400";

  const solicitudesPendientes = centro.solicitudes.filter((s) => s.estado === "PENDIENTE");

  return (
    <div>
      <Link
        href="/admin/centros"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("volverCentros")}
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-2xl sm:text-3xl font-bold">{centro.nombre}</h1>
          </div>
          <p className="text-muted-foreground mt-1">/{centro.slug}</p>
          {centro.descripcion && (
            <p className="text-sm text-muted-foreground mt-2">{centro.descripcion}</p>
          )}
        </div>
        <span className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium shrink-0", badgeColor)}>
          <Users className="w-4 h-4" />
          {centro.miembros.length}/{centro.maxMiembros} {t("miembros")}
        </span>
      </div>

      <div className="mb-8">
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all", barColor)}
            style={{ width: `${Math.min(ratio * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Líder */}
      <section className="bg-card border border-border rounded-xl p-5 mb-6">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Crown className="w-5 h-5 text-amber-500" />
          {t("liderLabel")}
        </h2>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-500/15 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-semibold text-sm">
            {centro.lider.nombre[0]}
          </div>
          <div>
            <p className="font-medium">{centro.lider.nombre} {centro.lider.apellidos}</p>
            <p className="text-sm text-muted-foreground">{centro.lider.email}</p>
          </div>
        </div>
      </section>

      {/* Miembros */}
      <section className="bg-card border border-border rounded-xl p-5 mb-6">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          {t("miembrosTitle", { count: centro.miembros.length })}
        </h2>
        {centro.miembros.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("sinMiembros")}</p>
        ) : (
          <div className="divide-y divide-border">
            {centro.miembros.map((m) => (
              <div key={m.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-medium text-sm shrink-0">
                  {m.nombre[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {m.nombre} {m.apellidos}
                    {m.id === centro.lider.id && (
                      <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">{t("liderBadge")}</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                </div>
                <p className="text-xs text-muted-foreground shrink-0">
                  {new Date(m.createdAt).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Invitaciones pendientes */}
      {solicitudesPendientes.length > 0 && (
        <section className="bg-card border border-border rounded-xl p-5 mb-6">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Mail className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            {t("invitacionesPendientes", { count: solicitudesPendientes.length })}
          </h2>
          <div className="divide-y divide-border">
            {solicitudesPendientes.map((s) => (
              <div key={s.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {s.dietista ? `${s.dietista.nombre} ${s.dietista.apellidos}` : s.email}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {s.dietista?.email || s.email}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(s.createdAt).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Editar */}
      <section className="bg-card border border-border rounded-xl p-5">
        <h2 className="text-lg font-semibold mb-4">{t("editarCentro")}</h2>
        <EditarCentroForm centro={centro} />
      </section>
    </div>
  );
}

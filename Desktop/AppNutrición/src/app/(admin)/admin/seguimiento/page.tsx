import { prisma } from "@/lib/prisma";
import { Eye, Users, UserCheck, Clock, AlertCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getLocale } from "@/i18n/locale";
import { intlTag } from "@/i18n/config";
import { capitalizarNombre } from "@/lib/utils";

export default async function SeguimientoPage() {
  const t = await getTranslations("admin");
  const locale = await getLocale();
  const tag = intlTag(locale);

  function formatFecha(date: Date | null): string {
    if (!date) return "—";
    return date.toLocaleDateString(tag, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function timeAgo(date: Date | null): string {
    if (!date) return t("seguimiento.timeAgo.nunca");
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t("seguimiento.timeAgo.ahoraMismo");
    if (mins < 60) return t("seguimiento.timeAgo.minutos", { count: mins });
    const hours = Math.floor(mins / 60);
    if (hours < 24) return t("seguimiento.timeAgo.horas", { count: hours });
    const days = Math.floor(hours / 24);
    if (days < 7) return t("seguimiento.timeAgo.dias", { count: days });
    if (days < 30) return t("seguimiento.timeAgo.semanas", { count: Math.floor(days / 7) });
    const months = Math.floor(days / 30);
    return t("seguimiento.timeAgo.meses", { count: months, plural: months > 1 ? "es" : "" });
  }

  function statusBadge(date: Date | null) {
    if (!date) return { label: t("seguimiento.statusBadge.sinAcceso"), color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" };
    const days = (Date.now() - date.getTime()) / 86400000;
    if (days < 1) return { label: t("seguimiento.statusBadge.activoHoy"), color: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400" };
    if (days < 7) return { label: t("seguimiento.statusBadge.estaSemana"), color: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400" };
    if (days < 30) return { label: t("seguimiento.statusBadge.esteMes"), color: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400" };
    return { label: t("seguimiento.statusBadge.inactivo"), color: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400" };
  }

  const [dietistas, pacientes] = await Promise.all([
    prisma.dietista.findMany({
      where: { demoEliminado: false },
      select: {
        id: true,
        nombre: true,
        apellidos: true,
        email: true,
        lastAccessAt: true,
        createdAt: true,
        verificado: true,
        _count: { select: { pacientes: { where: { esDemo: false } } } },
      },
      orderBy: { lastAccessAt: "desc" },
    }),
    prisma.paciente.findMany({
      where: { activo: true, esDemo: false },
      select: {
        id: true,
        nombre: true,
        apellidos: true,
        email: true,
        lastAccessAt: true,
        createdAt: true,
        dietista: { select: { nombre: true, apellidos: true } },
      },
      orderBy: { lastAccessAt: "desc" },
    }),
  ]);

  const dietistasActivos = dietistas.filter(
    (d) => d.lastAccessAt && Date.now() - d.lastAccessAt.getTime() < 86400000
  ).length;
  const pacientesActivos = pacientes.filter(
    (p) => p.lastAccessAt && Date.now() - p.lastAccessAt.getTime() < 86400000
  ).length;
  const sinAccesoDietistas = dietistas.filter((d) => !d.lastAccessAt).length;
  const sinAccesoPacientes = pacientes.filter((p) => !p.lastAccessAt).length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">{t("seguimiento.title")}</h1>
        <p className="text-muted-foreground mt-1">
          {t("seguimiento.subtitle")}
        </p>
      </div>

      {/* Stats rápidos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: t("seguimiento.stats.dietistasActivosHoy"),
            value: dietistasActivos,
            total: dietistas.length,
            icon: Users,
            color: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10",
          },
          {
            label: t("seguimiento.stats.pacientesActivosHoy"),
            value: pacientesActivos,
            total: pacientes.length,
            icon: UserCheck,
            color: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10",
          },
          {
            label: t("seguimiento.stats.dietistasSinAcceso"),
            value: sinAccesoDietistas,
            total: dietistas.length,
            icon: AlertCircle,
            color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10",
          },
          {
            label: t("seguimiento.stats.pacientesSinAcceso"),
            value: sinAccesoPacientes,
            total: pacientes.length,
            icon: AlertCircle,
            color: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10",
          },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("seguimiento.stats.deTotales", { total: s.total })}</p>
          </div>
        ))}
      </div>

      {/* Tabla de dietistas */}
      <div className="bg-card rounded-xl border border-border overflow-hidden mb-8">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="font-semibold">{t("seguimiento.tablaDietistas.title", { count: dietistas.length })}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">{t("seguimiento.tablaDietistas.columns.dietista")}</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden sm:table-cell">{t("seguimiento.tablaDietistas.columns.email")}</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">{t("seguimiento.tablaDietistas.columns.pacientes")}</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">{t("seguimiento.tablaDietistas.columns.ultimoAcceso")}</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden lg:table-cell">{t("seguimiento.tablaDietistas.columns.fechaExacta")}</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">{t("seguimiento.tablaDietistas.columns.estado")}</th>
              </tr>
            </thead>
            <tbody>
              {dietistas.map((d) => {
                const badge = statusBadge(d.lastAccessAt);
                return (
                  <tr key={d.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3 font-medium">
                      {capitalizarNombre(`${d.nombre} ${d.apellidos}`)}
                      {!d.verificado && (
                        <span className="ml-2 text-xs bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 px-1.5 py-0.5 rounded">
                          {t("seguimiento.tablaDietistas.noVerificado")}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground hidden sm:table-cell">{d.email}</td>
                    <td className="px-5 py-3 hidden md:table-cell">{d._count.pacientes}</td>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        {timeAgo(d.lastAccessAt)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground text-xs hidden lg:table-cell">
                      {formatFecha(d.lastAccessAt)}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${badge.color}`}>
                        {badge.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tabla de pacientes */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
          <h2 className="font-semibold">{t("seguimiento.tablaPacientes.title", { count: pacientes.length })}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">{t("seguimiento.tablaPacientes.columns.paciente")}</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden sm:table-cell">{t("seguimiento.tablaPacientes.columns.email")}</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">{t("seguimiento.tablaPacientes.columns.dietista")}</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">{t("seguimiento.tablaPacientes.columns.ultimoAcceso")}</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden lg:table-cell">{t("seguimiento.tablaPacientes.columns.fechaExacta")}</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">{t("seguimiento.tablaPacientes.columns.estado")}</th>
              </tr>
            </thead>
            <tbody>
              {pacientes.map((p) => {
                const badge = statusBadge(p.lastAccessAt);
                return (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3 font-medium">
                      {capitalizarNombre(`${p.nombre} ${p.apellidos}`)}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground hidden sm:table-cell">{p.email || "—"}</td>
                    <td className="px-5 py-3 text-muted-foreground hidden md:table-cell">
                      {capitalizarNombre(`${p.dietista.nombre} ${p.dietista.apellidos}`)}
                    </td>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        {timeAgo(p.lastAccessAt)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground text-xs hidden lg:table-cell">
                      {formatFecha(p.lastAccessAt)}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${badge.color}`}>
                        {badge.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {pacientes.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">
                    {t("seguimiento.tablaPacientes.empty")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

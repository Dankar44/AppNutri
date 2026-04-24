import { prisma } from "@/lib/prisma";
import { Eye, Users, UserCheck, Clock, AlertCircle } from "lucide-react";
import { capitalizarNombre } from "@/lib/utils";

function timeAgo(date: Date | null): string {
  if (!date) return "Nunca";
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Ahora mismo";
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Hace ${days}d`;
  if (days < 30) return `Hace ${Math.floor(days / 7)} sem`;
  return `Hace ${Math.floor(days / 30)} mes${Math.floor(days / 30) > 1 ? "es" : ""}`;
}

function formatFecha(date: Date | null): string {
  if (!date) return "—";
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusBadge(date: Date | null) {
  if (!date) return { label: "Sin acceso", color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" };
  const days = (Date.now() - date.getTime()) / 86400000;
  if (days < 1) return { label: "Activo hoy", color: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400" };
  if (days < 7) return { label: "Esta semana", color: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400" };
  if (days < 30) return { label: "Este mes", color: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400" };
  return { label: "Inactivo", color: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400" };
}

export default async function SeguimientoPage() {
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
        _count: { select: { pacientes: true } },
      },
      orderBy: { lastAccessAt: "desc" },
    }),
    prisma.paciente.findMany({
      where: { activo: true },
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
        <h1 className="text-2xl sm:text-3xl font-bold">Seguimiento de accesos</h1>
        <p className="text-muted-foreground mt-1">
          Último acceso de dietistas y pacientes a la plataforma
        </p>
      </div>

      {/* Stats rápidos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Dietistas activos hoy",
            value: dietistasActivos,
            total: dietistas.length,
            icon: Users,
            color: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10",
          },
          {
            label: "Pacientes activos hoy",
            value: pacientesActivos,
            total: pacientes.length,
            icon: UserCheck,
            color: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10",
          },
          {
            label: "Dietistas sin acceso",
            value: sinAccesoDietistas,
            total: dietistas.length,
            icon: AlertCircle,
            color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10",
          },
          {
            label: "Pacientes sin acceso",
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
            <p className="text-xs text-muted-foreground mt-1">de {s.total} totales</p>
          </div>
        ))}
      </div>

      {/* Tabla de dietistas */}
      <div className="bg-card rounded-xl border border-border overflow-hidden mb-8">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="font-semibold">Dietistas ({dietistas.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Dietista</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden sm:table-cell">Email</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">Pacientes</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Último acceso</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden lg:table-cell">Fecha exacta</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Estado</th>
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
                          No verificado
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
          <h2 className="font-semibold">Pacientes ({pacientes.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Paciente</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden sm:table-cell">Email</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">Dietista</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Último acceso</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden lg:table-cell">Fecha exacta</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Estado</th>
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
                    No hay pacientes registrados
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

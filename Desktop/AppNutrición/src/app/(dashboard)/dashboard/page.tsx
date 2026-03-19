import { Users, UtensilsCrossed, UserCheck, TrendingUp } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentDietista } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  const dietista = await getCurrentDietista();
  if (!dietista) redirect("/login");

  const [totalPacientes, pacientesActivos, pacientesRecientes] =
    await Promise.all([
      prisma.paciente.count({ where: { dietistaId: dietista.id } }),
      prisma.paciente.count({
        where: { dietistaId: dietista.id, activo: true },
      }),
      prisma.paciente.findMany({
        where: { dietistaId: dietista.id },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

  const stats = [
    {
      label: "Total pacientes",
      value: totalPacientes,
      icon: Users,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Pacientes activos",
      value: pacientesActivos,
      icon: UserCheck,
      color: "text-green-600 bg-green-50",
    },
    {
      label: "Dietas creadas",
      value: 0,
      icon: UtensilsCrossed,
      color: "text-orange-600 bg-orange-50",
    },
    {
      label: "Este mes",
      value: pacientesActivos,
      icon: TrendingUp,
      color: "text-purple-600 bg-purple-50",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">
          ¡Hola, {dietista.nombre}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Aquí tienes un resumen de tu consulta
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-card rounded-xl border border-border p-5 flex items-start gap-4"
          >
            <div className={`p-3 rounded-lg ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent patients */}
      <div className="bg-card rounded-xl border border-border">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold">Últimos pacientes</h2>
          <Link
            href="/pacientes"
            className="text-sm text-primary hover:underline font-medium"
          >
            Ver todos
          </Link>
        </div>
        {pacientesRecientes.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium text-lg mb-1">
              No tienes pacientes aún
            </h3>
            <p className="text-muted-foreground mb-4">
              Empieza añadiendo tu primer paciente
            </p>
            <Link
              href="/pacientes/nuevo"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Añadir paciente
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {pacientesRecientes.map((paciente) => (
              <Link
                key={paciente.id}
                href={`/pacientes/${paciente.id}`}
                className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                  {paciente.nombre[0]}
                  {paciente.apellidos[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {paciente.nombre} {paciente.apellidos}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {paciente.email || "Sin email"}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      paciente.activo
                        ? "bg-green-50 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {paciente.activo ? "Activo" : "Inactivo"}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDate(paciente.createdAt)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

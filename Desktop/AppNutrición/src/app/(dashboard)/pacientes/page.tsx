import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { getPacientes, isDemoEliminado } from "@/app/actions/pacientes";
import { formatDate, OBJETIVO_LABELS, calcularIMC, capitalizarNombre } from "@/lib/utils";
import { AvatarPaciente } from "@/components/avatar-paciente";
import { PacientesFilter } from "./pacientes-filter";
import { PageHeader } from "@/components/page-header";
import { RestaurarDemoBanner } from "./restaurar-demo-banner";

interface Props {
  searchParams: Promise<{ busqueda?: string; activos?: string; vista?: string }>;
}

export default async function PacientesPage({ searchParams }: Props) {
  const params = await searchParams;
  const busqueda = params.busqueda || "";
  const soloActivos = params.activos === "true";
  const vista = params.vista || "tabla";
  const [pacientes, demoEliminado] = await Promise.all([
    getPacientes(busqueda, soloActivos),
    isDemoEliminado(),
  ]);

  return (
    <div>
      <PageHeader
        icon={Users}
        title="Pacientes"
        subtitle={`${pacientes.length} paciente${pacientes.length !== 1 ? "s" : ""}`}
        action={
          <Link
            href="/pacientes/nuevo"
            data-tour="new-patient-btn"
            className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors w-full sm:w-auto min-h-11"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo paciente</span>
          </Link>
        }
      />

      {demoEliminado && <RestaurarDemoBanner />}

      <div className="mb-6" data-tour="patient-search">
        <PacientesFilter busquedaInicial={busqueda} activosInicial={soloActivos} vista={vista} />
      </div>

      {pacientes.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-medium text-lg mb-1">
            {busqueda ? "No se encontraron pacientes" : "No tienes pacientes aún"}
          </h3>
          <p className="text-muted-foreground mb-4">
            {busqueda ? "Prueba con otra búsqueda" : "Empieza añadiendo tu primer paciente"}
          </p>
          {!busqueda && (
            <Link
              href="/pacientes/nuevo"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> Añadir paciente
            </Link>
          )}
        </div>
      ) : vista === "cards" ? (
        /* Vista de tarjetas con foto grande */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {pacientes.map((p) => (
            <Link
              key={p.id}
              href={`/pacientes/${p.id}`}
              className="bg-card rounded-xl border border-border p-5 hover:border-primary/30 hover:shadow-sm transition-all text-center"
            >
              <div className="flex justify-center mb-3">
                <AvatarPaciente nombre={p.nombre} apellidos={p.apellidos} fotoUrl={p.fotoUrl} size="xl" />
              </div>
              <h3 className="font-semibold">
                {capitalizarNombre(p.nombre)} {capitalizarNombre(p.apellidos)}
              </h3>
              {p.nombre === "Paciente" && p.apellidos === "Prueba" && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-medium border border-amber-200 mt-1">
                  Paciente de ejemplo
                </span>
              )}
              <p className="text-xs text-muted-foreground mt-0.5">
                {OBJETIVO_LABELS[p.objetivo] || p.objetivo}
              </p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                    p.activo ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {p.activo ? "Activo" : "Inactivo"}
                </span>
                {p.peso && p.altura && (
                  <span className="text-xs text-muted-foreground">
                    IMC: {calcularIMC(p.peso, p.altura)}
                  </span>
                )}
              </div>
              {p.email && (
                <p className="text-xs text-muted-foreground mt-2 truncate">{p.email}</p>
              )}
            </Link>
          ))}
        </div>
      ) : (
        /* Vista de tabla */
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Paciente</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground hidden md:table-cell">Contacto</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground hidden lg:table-cell">Objetivo</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground hidden lg:table-cell">IMC</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Estado</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground hidden sm:table-cell">Fecha alta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pacientes.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/pacientes/${p.id}`} className="flex items-center gap-3">
                        <AvatarPaciente nombre={p.nombre} apellidos={p.apellidos} fotoUrl={p.fotoUrl} size="md" />
                        <div className="min-w-0 flex items-center gap-2 flex-wrap">
                          <p className="font-medium truncate hover:text-primary transition-colors">
                            {capitalizarNombre(p.nombre)} {capitalizarNombre(p.apellidos)}
                          </p>
                          {p.nombre === "Paciente" && p.apellidos === "Prueba" && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-medium border border-amber-200 shrink-0">
                              Ejemplo
                            </span>
                          )}
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-sm text-muted-foreground truncate">{p.email || "-"}</p>
                      <p className="text-xs text-muted-foreground">{p.telefono || ""}</p>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-sm">{OBJETIVO_LABELS[p.objetivo] || p.objetivo}</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-sm">{p.peso && p.altura ? calcularIMC(p.peso, p.altura) : "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${p.activo ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                        {p.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">{formatDate(p.createdAt)}</td>
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

import Link from "next/link";
import { Plus, Users, Search } from "lucide-react";
import { getPacientes } from "@/app/actions/pacientes";
import { formatDate, OBJETIVO_LABELS, calcularIMC } from "@/lib/utils";
import { PacientesFilter } from "./pacientes-filter";

interface Props {
  searchParams: Promise<{ busqueda?: string; activos?: string }>;
}

export default async function PacientesPage({ searchParams }: Props) {
  const params = await searchParams;
  const busqueda = params.busqueda || "";
  const soloActivos = params.activos === "true";
  const pacientes = await getPacientes(busqueda, soloActivos);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Pacientes</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona la ficha de tus pacientes
          </p>
        </div>
        <Link
          href="/pacientes/nuevo"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo paciente
        </Link>
      </div>

      <PacientesFilter busquedaInicial={busqueda} activosInicial={soloActivos} />

      {pacientes.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-medium text-lg mb-1">
            {busqueda
              ? "No se encontraron pacientes"
              : "No tienes pacientes aún"}
          </h3>
          <p className="text-muted-foreground mb-4">
            {busqueda
              ? "Prueba con otra búsqueda"
              : "Empieza añadiendo tu primer paciente"}
          </p>
          {!busqueda && (
            <Link
              href="/pacientes/nuevo"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Añadir paciente
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                    Paciente
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground hidden md:table-cell">
                    Contacto
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground hidden lg:table-cell">
                    Objetivo
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground hidden lg:table-cell">
                    IMC
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                    Estado
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground hidden sm:table-cell">
                    Fecha alta
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pacientes.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/pacientes/${p.id}`}
                        className="flex items-center gap-3"
                      >
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs shrink-0">
                          {p.nombre[0]}
                          {p.apellidos[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate hover:text-primary transition-colors">
                            {p.nombre} {p.apellidos}
                          </p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-sm text-muted-foreground truncate">
                        {p.email || "-"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {p.telefono || ""}
                      </p>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm">
                        {OBJETIVO_LABELS[p.objetivo] || p.objetivo}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm">
                        {p.peso && p.altura
                          ? calcularIMC(p.peso, p.altura)
                          : "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          p.activo
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {p.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">
                      {formatDate(p.createdAt)}
                    </td>
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

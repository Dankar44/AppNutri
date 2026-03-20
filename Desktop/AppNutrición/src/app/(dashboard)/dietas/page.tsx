import Link from "next/link";
import { Plus, UtensilsCrossed } from "lucide-react";
import { getPlanes } from "@/app/actions/planes";
import { formatDate, capitalizarNombre } from "@/lib/utils";
import { AvatarPaciente } from "@/components/avatar-paciente";

export default async function DietasPage() {
  const planes = await getPlanes();

  // Agrupar planes por paciente
  const porPaciente = new Map<string, {
    paciente: { nombre: string; apellidos: string; fotoUrl: string | null };
    planes: typeof planes;
  }>();

  for (const plan of planes) {
    const key = `${plan.pacienteId}`;
    if (!porPaciente.has(key)) {
      porPaciente.set(key, { paciente: plan.paciente, planes: [] });
    }
    porPaciente.get(key)!.planes.push(plan);
  }

  const grupos = Array.from(porPaciente.values());

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Planes alimenticios</h1>
          <p className="text-muted-foreground mt-1">
            {planes.length} plan{planes.length !== 1 ? "es" : ""} · {grupos.length} paciente{grupos.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/dietas/nuevo"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Nuevo plan
        </Link>
      </div>

      {planes.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <UtensilsCrossed className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-medium text-lg mb-1">Sin planes</h3>
          <p className="text-muted-foreground mb-4">
            Crea un plan alimenticio semanal para tus pacientes
          </p>
          <Link
            href="/dietas/nuevo"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Crear plan
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {grupos.map((grupo) => (
            <div key={`${grupo.paciente.nombre}-${grupo.paciente.apellidos}`}>
              {/* Cabecera del paciente */}
              <div className="flex items-center gap-3 mb-3">
                <AvatarPaciente
                  nombre={grupo.paciente.nombre}
                  apellidos={grupo.paciente.apellidos}
                  fotoUrl={grupo.paciente.fotoUrl}
                  size="md"
                />
                <div>
                  <h2 className="font-semibold">
                    {capitalizarNombre(grupo.paciente.nombre)} {capitalizarNombre(grupo.paciente.apellidos)}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {grupo.planes.length} plan{grupo.planes.length !== 1 ? "es" : ""}
                  </p>
                </div>
              </div>

              {/* Planes del paciente */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {grupo.planes.map((plan) => (
                  <Link
                    key={plan.id}
                    href={`/dietas/${plan.id}`}
                    className="bg-card rounded-xl border border-border p-4 hover:border-primary/30 hover:shadow-sm transition-all"
                  >
                    <h3 className="font-medium truncate">{plan.nombre}</h3>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDate(plan.createdAt)}
                      </span>
                      {plan.caloriasObjetivo && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium">
                          {plan.caloriasObjetivo} kcal
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

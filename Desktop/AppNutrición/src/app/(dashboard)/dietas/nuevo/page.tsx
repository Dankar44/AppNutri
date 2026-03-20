"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { crearPlan, getPacientesParaPlan, type PlanFormData } from "@/app/actions/planes";
import { getPlantillas } from "@/app/actions/plantillas";
import { crearPlanDesdePlantilla } from "@/app/actions/plantillas";
import { PlantillaSelector } from "@/components/dieta/plantilla-selector";

export default function NuevoPlanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [pacientes, setPacientes] = useState<{ id: string; nombre: string; apellidos: string }[]>([]);
  const [plantillas, setPlantillas] = useState<{ id: string; nombre: string }[]>([]);
  const [plantillaId, setPlantillaId] = useState("");

  useEffect(() => {
    getPacientesParaPlan().then(setPacientes);
    getPlantillas().then(setPlantillas);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const pacienteId = form.get("pacienteId") as string;
    const nombre = form.get("nombre") as string;

    try {
      if (plantillaId) {
        const plan = await crearPlanDesdePlantilla(plantillaId, pacienteId, nombre);
        toast.success("Plan creado desde plantilla");
        router.push(`/dietas/${plan.id}`);
      } else {
        const data: PlanFormData = {
          nombre,
          pacienteId,
          caloriasObjetivo: parseFloat(form.get("caloriasObjetivo") as string) || undefined,
          proteinasObjetivo: parseFloat(form.get("proteinasObjetivo") as string) || undefined,
          carbohidratosObjetivo: parseFloat(form.get("carbohidratosObjetivo") as string) || undefined,
          grasasObjetivo: parseFloat(form.get("grasasObjetivo") as string) || undefined,
        };
        await crearPlan(data);
        toast.success("Plan creado");
      }
    } catch (error) {
      if (error && typeof error === "object" && "digest" in error) throw error;
      toast.error("Error al crear el plan");
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/dietas"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a planes
        </Link>
        <h1 className="text-2xl font-bold">Nuevo plan alimenticio</h1>
        <p className="text-muted-foreground mt-1">
          Crea un plan semanal para un paciente
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
        <section className="bg-card rounded-xl border border-border p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Paciente *</label>
            <select
              name="pacienteId"
              required
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
            >
              <option value="">Seleccionar paciente...</option>
              {pacientes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} {p.apellidos}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nombre del plan *</label>
            <input
              name="nombre"
              required
              placeholder="Ej: Plan semanal - Pérdida de peso"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
            />
          </div>

          <PlantillaSelector
            plantillas={plantillas}
            value={plantillaId}
            onChange={setPlantillaId}
          />
        </section>

        {!plantillaId && (
          <section className="bg-card rounded-xl border border-border p-6 space-y-4">
            <h2 className="text-lg font-semibold">Objetivos de macros (opcionales)</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Calorías (kcal)</label>
                <input
                  name="caloriasObjetivo"
                  type="number"
                  min="0"
                  placeholder="2000"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Proteínas (g)</label>
                <input
                  name="proteinasObjetivo"
                  type="number"
                  min="0"
                  placeholder="120"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Carbohidratos (g)</label>
                <input
                  name="carbohidratosObjetivo"
                  type="number"
                  min="0"
                  placeholder="250"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Grasas (g)</label>
                <input
                  name="grasasObjetivo"
                  type="number"
                  min="0"
                  placeholder="70"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                />
              </div>
            </div>
          </section>
        )}

        <div className="flex justify-end gap-3">
          <Link
            href="/dietas"
            className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {loading ? "Creando..." : "Crear plan"}
          </button>
        </div>
      </form>
    </div>
  );
}

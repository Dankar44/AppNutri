"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { crearCita, getPacientesParaCita } from "@/app/actions/citas";

export default function NuevaCitaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [pacientes, setPacientes] = useState<{ id: string; nombre: string; apellidos: string }[]>([]);

  useEffect(() => {
    getPacientesParaCita().then(setPacientes);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const fecha = form.get("fecha") as string;
    const hora = form.get("hora") as string;

    try {
      await crearCita({
        pacienteId: form.get("pacienteId") as string,
        fechaHora: `${fecha}T${hora}:00`,
        duracion: parseInt(form.get("duracion") as string) || 30,
        motivo: (form.get("motivo") as string) || undefined,
        notas: (form.get("notas") as string) || undefined,
      });
      toast.success("Cita creada");
      router.push("/agenda");
    } catch {
      toast.error("Error al crear la cita");
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/agenda"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a agenda
        </Link>
        <h1 className="text-2xl font-bold">Nueva cita</h1>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Fecha *</label>
              <input
                name="fecha"
                type="date"
                required
                defaultValue={new Date().toISOString().split("T")[0]}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Hora *</label>
              <input
                name="hora"
                type="time"
                required
                defaultValue="10:00"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Duración (minutos)</label>
            <select
              name="duracion"
              defaultValue="30"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
            >
              <option value="15">15 min</option>
              <option value="30">30 min</option>
              <option value="45">45 min</option>
              <option value="60">60 min</option>
              <option value="90">90 min</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Motivo</label>
            <input
              name="motivo"
              placeholder="Ej: Primera consulta, Revisión mensual..."
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notas</label>
            <textarea
              name="notas"
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm resize-y"
            />
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <Link
            href="/agenda"
            className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {loading ? "Creando..." : "Crear cita"}
          </button>
        </div>
      </form>
    </div>
  );
}

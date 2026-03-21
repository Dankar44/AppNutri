"use client";

import { useState } from "react";
import { toast } from "sonner";
import { crearMedida, type MedidaFormData } from "@/app/actions/medidas";

interface MedidasFormProps {
  pacienteId: string;
  defaultPeso?: number | null;
  defaultAltura?: number | null;
  onSuccess?: () => void;
}

export function MedidasForm({
  pacienteId,
  defaultPeso,
  defaultAltura,
  onSuccess,
}: MedidasFormProps) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const data: MedidaFormData = {
      pacienteId,
      fecha: (form.get("fecha") as string) || undefined,
      peso: parseFloat(form.get("peso") as string) || undefined,
      altura: parseFloat(form.get("altura") as string) || undefined,
      grasaCorporal: parseFloat(form.get("grasaCorporal") as string) || undefined,
      masaMuscular: parseFloat(form.get("masaMuscular") as string) || undefined,
      perimetroCintura: parseFloat(form.get("perimetroCintura") as string) || undefined,
      perimetroCadera: parseFloat(form.get("perimetroCadera") as string) || undefined,
      perimetroBrazo: parseFloat(form.get("perimetroBrazo") as string) || undefined,
      notas: (form.get("notas") as string) || undefined,
    };

    try {
      await crearMedida(data);
      toast.success("Medidas registradas");
      e.currentTarget.reset();
      onSuccess?.();
    } catch (error) { if (error && typeof error === "object" && "digest" in error) throw error;
      toast.error("Error al registrar medidas");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Fecha</label>
        <input
          name="fecha"
          type="date"
          defaultValue={new Date().toISOString().split("T")[0]}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Peso (kg)</label>
          <input
            name="peso"
            type="number"
            step="0.1"
            min={0.1}
            max={500}
            defaultValue={defaultPeso ?? ""}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Altura (cm)</label>
          <input
            name="altura"
            type="number"
            step="0.1"
            min={30}
            max={300}
            defaultValue={defaultAltura ?? ""}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">% Grasa</label>
          <input
            name="grasaCorporal"
            type="number"
            step="0.1"
            min="0"
            max="100"
            className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Masa muscular (kg)</label>
          <input
            name="masaMuscular"
            type="number"
            step="0.1"
            min={0}
            max={200}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">P. cintura (cm)</label>
          <input
            name="perimetroCintura"
            type="number"
            step="0.1"
            min={0}
            max={300}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">P. cadera (cm)</label>
          <input
            name="perimetroCadera"
            type="number"
            step="0.1"
            min={0}
            max={300}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Notas</label>
        <textarea
          name="notas"
          rows={2}
          maxLength={2000}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm resize-y"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50"
      >
        {loading ? "Guardando..." : "Registrar medidas"}
      </button>
    </form>
  );
}

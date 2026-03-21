"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { actualizarPerfil, type PerfilFormData } from "@/app/actions/perfil";

interface Props {
  defaultValues: PerfilFormData;
}

export function PerfilForm({ defaultValues }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const data: PerfilFormData = {
      nombre: form.get("nombre") as string,
      apellidos: form.get("apellidos") as string,
      telefono: (form.get("telefono") as string) || undefined,
      especialidad: (form.get("especialidad") as string) || undefined,
      numColegiado: (form.get("numColegiado") as string) || undefined,
      clinica: (form.get("clinica") as string) || undefined,
    };

    try {
      await actualizarPerfil(data);
      toast.success("Perfil actualizado");
      router.refresh();
    } catch (error) { if (error && typeof error === "object" && "digest" in error) throw error;
      toast.error("Error al actualizar el perfil");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nombre *</label>
          <input name="nombre" required maxLength={100} defaultValue={defaultValues.nombre}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Apellidos *</label>
          <input name="apellidos" required maxLength={100} defaultValue={defaultValues.apellidos}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Teléfono</label>
        <input name="telefono" maxLength={20} defaultValue={defaultValues.telefono || ""}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Especialidad</label>
        <input name="especialidad" maxLength={200} defaultValue={defaultValues.especialidad || ""}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nº Colegiado</label>
          <input name="numColegiado" maxLength={50} defaultValue={defaultValues.numColegiado || ""}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Clínica</label>
          <input name="clinica" maxLength={200} defaultValue={defaultValues.clinica || ""}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm" />
        </div>
      </div>
      <button type="submit" disabled={loading}
        className="px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50">
        {loading ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}

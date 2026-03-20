"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { generarPlanIA, aceptarPlanIA } from "@/app/actions/ai";
import { PlanPreview } from "@/components/ai/plan-preview";
import { toast } from "sonner";
import type { AIPlanGenerado, MacroObjetivos } from "@/lib/ai/types";

interface Props {
  pacienteId: string;
  pacienteNombre: string;
  defaultObjetivos: MacroObjetivos;
}

export function IAGenerationForm({ pacienteId, pacienteNombre, defaultObjetivos }: Props) {
  const [loading, setLoading] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [resultado, setResultado] = useState<{ generacionId: string; plan: AIPlanGenerado } | null>(null);

  async function handleGenerar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setResultado(null);

    const form = new FormData(e.currentTarget);
    const objetivos: MacroObjetivos = {
      calorias: parseFloat(form.get("calorias") as string) || 2000,
      proteinas: parseFloat(form.get("proteinas") as string) || 120,
      carbohidratos: parseFloat(form.get("carbohidratos") as string) || 250,
      grasas: parseFloat(form.get("grasas") as string) || 70,
    };
    const instrucciones = form.get("instrucciones") as string;

    try {
      const result = await generarPlanIA(pacienteId, objetivos, instrucciones);
      setResultado(result);
      toast.success("Plan generado por IA");
    } catch (err) {
      toast.error("Error al generar el plan con IA");
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept() {
    if (!resultado) return;
    setAccepting(true);
    try {
      await aceptarPlanIA(
        resultado.generacionId,
        pacienteId,
        resultado.plan.nombre || `Plan IA - ${pacienteNombre}`,
        defaultObjetivos
      );
      toast.success("Plan creado exitosamente");
    } catch {
      toast.error("Error al crear el plan");
      setAccepting(false);
    }
  }

  if (resultado) {
    return (
      <PlanPreview
        plan={resultado.plan}
        onAccept={handleAccept}
        onReject={() => setResultado(null)}
        loading={accepting}
      />
    );
  }

  return (
    <form onSubmit={handleGenerar} className="space-y-6 max-w-2xl">
      <section className="bg-card rounded-xl border border-border p-6 space-y-4">
        <h2 className="text-lg font-semibold">Objetivos nutricionales diarios</h2>
        <p className="text-sm text-muted-foreground">La IA generará un plan que cumpla estos objetivos por día</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Calorías (kcal) *</label>
            <input name="calorias" type="number" required min="800" max="6000" defaultValue={defaultObjetivos.calorias}
              className="w-full px-4 py-3 rounded-lg border border-border bg-background text-base font-medium focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Proteínas (g)</label>
            <input name="proteinas" type="number" min="0" defaultValue={defaultObjetivos.proteinas}
              className="w-full px-4 py-3 rounded-lg border border-border bg-background text-base font-medium focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Carbohidratos (g)</label>
            <input name="carbohidratos" type="number" min="0" defaultValue={defaultObjetivos.carbohidratos}
              className="w-full px-4 py-3 rounded-lg border border-border bg-background text-base font-medium focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Grasas (g)</label>
            <input name="grasas" type="number" min="0" defaultValue={defaultObjetivos.grasas}
              className="w-full px-4 py-3 rounded-lg border border-border bg-background text-base font-medium focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
        </div>
      </section>

      <section className="bg-card rounded-xl border border-border p-6 space-y-4">
        <h2 className="text-lg font-semibold">Instrucciones adicionales</h2>
        <p className="text-sm text-muted-foreground">
          Escribe instrucciones específicas que la IA debe seguir al generar el plan
        </p>
        <textarea
          name="instrucciones"
          rows={6}
          placeholder={"Ejemplos:\n- Incluir más pescado y legumbres\n- Evitar lácteos en la cena\n- Preferir alimentos de temporada\n- Que sea variado y fácil de preparar"}
          className="w-full px-4 py-3 rounded-lg border border-border bg-background text-base focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
        />
      </section>

      <button
        type="submit"
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Generando plan con IA... (10-20 seg)
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Generar plan con IA
          </>
        )}
      </button>
    </form>
  );
}

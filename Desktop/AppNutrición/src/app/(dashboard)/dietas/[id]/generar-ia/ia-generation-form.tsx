"use client";

import { useState } from "react";
import { Sparkles, Loader2, User, AlertTriangle } from "lucide-react";
import { generarPlanIA, aceptarPlanIA } from "@/app/actions/ai";
import { PlanPreview } from "@/components/ai/plan-preview";
import { toast } from "sonner";
import type { AIPlanGenerado, MacroObjetivos } from "@/lib/ai/types";

const OBJETIVO_LABEL: Record<string, string> = {
  PERDER_PESO: "Perder peso",
  GANAR_MASA: "Ganar masa",
  MANTENIMIENTO: "Mantenimiento",
  PATOLOGIA: "Patología",
  DEPORTIVO: "Deportivo",
  OTRO: "Otro",
};

// Presets de macros según la fase
const FASE_MACROS: Record<string, MacroObjetivos> = {
  deficit: { calorias: 1400, proteinas: 130, carbohidratos: 140, grasas: 45 },
  mantenimiento: { calorias: 2000, proteinas: 100, carbohidratos: 250, grasas: 70 },
  volumen: { calorias: 2800, proteinas: 160, carbohidratos: 350, grasas: 85 },
  definicion: { calorias: 1700, proteinas: 150, carbohidratos: 160, grasas: 50 },
  reverse: { calorias: 1800, proteinas: 120, carbohidratos: 210, grasas: 60 },
};

interface Props {
  planId: string;
  pacienteId: string;
  pacienteNombre: string;
  pacienteInfo: {
    peso: number | null;
    altura: number | null;
    objetivo: string;
    alergias: string[];
    intolerancias: string[];
    preferencias: string[];
  };
  defaultObjetivos: MacroObjetivos;
}

export function IAGenerationForm({ planId, pacienteId, pacienteNombre, pacienteInfo, defaultObjetivos }: Props) {
  const [loading, setLoading] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [resultado, setResultado] = useState<{ generacionId: string; plan: AIPlanGenerado } | null>(null);
  const [fase, setFase] = useState("");
  const [macros, setMacros] = useState<MacroObjetivos>(defaultObjetivos);

  function handleFaseChange(value: string) {
    setFase(value);
    if (value && FASE_MACROS[value]) {
      setMacros(FASE_MACROS[value]);
    }
  }

  async function handleGenerar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setResultado(null);

    const form = new FormData(e.currentTarget);

    // Construir instrucciones
    const parts: string[] = [];
    if (fase) {
      const faseLabels: Record<string, string> = {
        deficit: "Fase de déficit calórico para perder grasa",
        mantenimiento: "Fase de mantenimiento",
        volumen: "Fase de volumen para ganar masa muscular, comidas calóricamente densas",
        definicion: "Fase de definición: mantener músculo y perder grasa, alta proteína",
        reverse: "Reverse diet: subida calórica progresiva y controlada",
      };
      parts.push(faseLabels[fase] || fase);
    }
    const tipoDieta = form.get("tipoDieta") as string;
    if (tipoDieta) {
      const dietaLabels: Record<string, string> = {
        mediterranea: "Dieta mediterránea",
        baja_carbohidratos: "Dieta baja en carbohidratos",
        alta_proteina: "Dieta alta en proteínas",
        vegetariana: "Dieta vegetariana (sin carne ni pescado)",
        vegana: "Dieta vegana (sin productos animales)",
        cetogenica: "Dieta cetogénica (muy baja en carbohidratos, alta en grasas)",
        sin_gluten: "Dieta sin gluten",
        antiinflamatoria: "Dieta antiinflamatoria rica en omega-3 y antioxidantes",
      };
      parts.push(dietaLabels[tipoDieta] || tipoDieta);
    }
    const numComidas = form.get("numComidas") as string;
    if (numComidas && numComidas !== "6") {
      const comidasLabel: Record<string, string> = {
        "3": "Solo 3 comidas principales: desayuno, almuerzo y cena. Dejar vacías media mañana, merienda y recena",
        "4": "4 comidas: desayuno, almuerzo, merienda y cena. Dejar vacías media mañana y recena",
        "5": "5 comidas: desayuno, media mañana, almuerzo, merienda y cena. Dejar vacía recena",
      };
      parts.push(comidasLabel[numComidas] || "");
    }
    const prefLabels: Record<string, string> = {
      pref_facil: "Recetas fáciles y rápidas de preparar",
      pref_batch: "Apto para batch cooking (cocinar en lote)",
      pref_economico: "Ingredientes económicos y accesibles",
      pref_variado: "Mucha variedad, no repetir platos similares",
    };
    for (const [key, label] of Object.entries(prefLabels)) {
      if (form.get(key)) parts.push(label);
    }
    const textoLibre = (form.get("instrucciones") as string) || "";
    if (textoLibre.trim()) parts.push(textoLibre.trim());

    const instrucciones = parts.join(". ");

    try {
      const result = await generarPlanIA(pacienteId, macros, instrucciones);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        setResultado(result as { generacionId: string; plan: AIPlanGenerado });
        toast.success("Plan generado por IA");
      }
    } catch (err) {
      if (err && typeof err === "object" && "digest" in err) throw err;
      toast.error("Error al generar el plan con IA");
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept() {
    if (!resultado) return;
    setAccepting(true);
    try {
      await aceptarPlanIA(resultado.generacionId, planId, macros);
      toast.success("Plan actualizado con la dieta generada");
      window.location.href = `/dietas/${planId}`;
    } catch (error) { if (error && typeof error === "object" && "digest" in error) throw error;
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
    <form onSubmit={handleGenerar} className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* COLUMNA IZQUIERDA: Configuración */}
        <section className="bg-card rounded-xl border border-border p-6 space-y-5">
          <div>
            <h2 className="text-lg font-semibold">Configuración del plan</h2>
            <p className="text-sm text-muted-foreground mt-1">Define los parámetros para la generación</p>
          </div>

          {/* Fase */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Fase nutricional</label>
            <select
              name="fase"
              value={fase}
              onChange={(e) => handleFaseChange(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Personalizado</option>
              <option value="deficit">Déficit calórico (perder grasa)</option>
              <option value="mantenimiento">Mantenimiento</option>
              <option value="volumen">Volumen (ganar masa muscular)</option>
              <option value="definicion">Definición (mantener músculo, perder grasa)</option>
              <option value="reverse">Reverse diet (subida progresiva)</option>
            </select>
          </div>

          {/* Tipo de dieta */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Tipo de dieta</label>
            <select name="tipoDieta" defaultValue="" className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="">Mediterránea (por defecto)</option>
              <option value="baja_carbohidratos">Baja en carbohidratos</option>
              <option value="alta_proteina">Alta en proteínas</option>
              <option value="vegetariana">Vegetariana</option>
              <option value="vegana">Vegana</option>
              <option value="cetogenica">Cetogénica (keto)</option>
              <option value="sin_gluten">Sin gluten</option>
              <option value="antiinflamatoria">Antiinflamatoria</option>
            </select>
          </div>

          {/* Comidas al día */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Comidas al día</label>
            <select name="numComidas" defaultValue="6" className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="3">3 comidas</option>
              <option value="4">4 comidas</option>
              <option value="5">5 comidas</option>
              <option value="6">6 comidas</option>
            </select>
          </div>

          {/* Macros */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Macros diarios</label>
              {fase && (
                <span className="text-[11px] text-amber-600 font-medium">Ajustados a {fase}</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-xs text-muted-foreground">Calorías (kcal) *</span>
                <input type="number" required min={800} max={6000} value={macros.calorias}
                  onChange={(e) => setMacros({ ...macros, calorias: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 mt-1" />
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Proteínas (g)</span>
                <input type="number" min={0} max={2000} value={macros.proteinas}
                  onChange={(e) => setMacros({ ...macros, proteinas: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 mt-1" />
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Carbohidratos (g)</span>
                <input type="number" min={0} max={2000} value={macros.carbohidratos}
                  onChange={(e) => setMacros({ ...macros, carbohidratos: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 mt-1" />
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Grasas (g)</span>
                <input type="number" min={0} max={2000} value={macros.grasas}
                  onChange={(e) => setMacros({ ...macros, grasas: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 mt-1" />
              </div>
            </div>
          </div>

          {/* Preferencias */}
          <div>
            <label className="block text-sm font-medium mb-2">Preferencias</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { name: "pref_facil", label: "Fácil de preparar" },
                { name: "pref_batch", label: "Batch cooking" },
                { name: "pref_economico", label: "Económico" },
                { name: "pref_variado", label: "Muy variado" },
              ].map((pref) => (
                <label key={pref.name} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded-lg px-2 py-1.5 transition-colors">
                  <input type="checkbox" name={pref.name} className="w-4 h-4 rounded border-border text-primary focus:ring-primary/30 accent-primary" />
                  {pref.label}
                </label>
              ))}
            </div>
          </div>
        </section>

        {/* COLUMNA DERECHA: Info paciente + Instrucciones */}
        <div className="flex flex-col gap-6">
          {/* Datos del paciente */}
          <section className="bg-card rounded-xl border border-border p-5">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Datos del paciente
            </h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <span className="text-xs text-muted-foreground">Nombre</span>
                <p className="font-medium">{pacienteNombre}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Objetivo</span>
                <p className="font-medium">{OBJETIVO_LABEL[pacienteInfo.objetivo] || pacienteInfo.objetivo}</p>
              </div>
              {pacienteInfo.peso && (
                <div>
                  <span className="text-xs text-muted-foreground">Peso</span>
                  <p className="font-medium">{pacienteInfo.peso} kg</p>
                </div>
              )}
              {pacienteInfo.altura && (
                <div>
                  <span className="text-xs text-muted-foreground">Altura</span>
                  <p className="font-medium">{pacienteInfo.altura} cm</p>
                </div>
              )}
            </div>
            {(pacienteInfo.alergias.length > 0 || pacienteInfo.intolerancias.length > 0) && (
              <div className="mt-3 pt-3 border-t border-border">
                {pacienteInfo.alergias.length > 0 && (
                  <div className="flex items-start gap-1.5 mb-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
                    <p className="text-xs"><span className="font-medium text-red-600">Alergias:</span> {pacienteInfo.alergias.join(", ")}</p>
                  </div>
                )}
                {pacienteInfo.intolerancias.length > 0 && (
                  <div className="flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-xs"><span className="font-medium text-amber-600">Intolerancias:</span> {pacienteInfo.intolerancias.join(", ")}</p>
                  </div>
                )}
              </div>
            )}
            {pacienteInfo.preferencias.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {pacienteInfo.preferencias.map((p) => (
                  <span key={p} className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{p}</span>
                ))}
              </div>
            )}
          </section>

          {/* Instrucciones */}
          <section className="bg-card rounded-xl border border-border p-6 flex flex-col flex-1">
            <h2 className="text-lg font-semibold mb-2">Instrucciones adicionales</h2>
            <p className="text-sm text-muted-foreground mb-4">
              La IA seguirá estas instrucciones con prioridad máxima.
            </p>
            <textarea
              name="instrucciones"
              maxLength={2000}
              placeholder={"Escribe lo que quieras. Ejemplos:\n- Que sea rico en pescado\n- 3 alimentos por comida\n- Evitar lácteos en la cena\n- Desayuno siempre con avena\n- Que sea fácil de preparar"}
              className="w-full px-4 py-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y flex-1 min-h-[120px]"
            />
          </section>
        </div>
      </div>

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

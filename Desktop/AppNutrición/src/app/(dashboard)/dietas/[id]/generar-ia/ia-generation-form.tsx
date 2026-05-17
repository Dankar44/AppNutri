"use client";

import { useState } from "react";
import { Sparkles, Loader2, User, AlertTriangle } from "lucide-react";
import { generarPlanIA, aceptarPlanIA } from "@/app/actions/ai";
import { PlanPreview } from "@/components/ai/plan-preview";
import { toast } from "sonner";
import type { AIPlanGenerado, MacroObjetivos } from "@/lib/ai/types";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("diets.ia");
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
        deficit: t("aiPrompt.faseDeficit"),
        mantenimiento: t("aiPrompt.faseMantenimiento"),
        volumen: t("aiPrompt.faseVolumen"),
        definicion: t("aiPrompt.faseDefinicion"),
        reverse: t("aiPrompt.faseReverse"),
      };
      parts.push(faseLabels[fase] || fase);
    }
    const tipoDieta = form.get("tipoDieta") as string;
    if (tipoDieta) {
      const dietaLabels: Record<string, string> = {
        mediterranea: t("dietLabelMediterranean"),
        baja_carbohidratos: t("dietLabelLowCarb"),
        alta_proteina: t("dietLabelHighProtein"),
        vegetariana: t("dietLabelVegetarian"),
        vegana: t("dietLabelVegan"),
        cetogenica: t("dietLabelKeto"),
        sin_gluten: t("dietLabelGlutenFree"),
        antiinflamatoria: t("dietLabelAntiInflammatory"),
      };
      parts.push(dietaLabels[tipoDieta] || tipoDieta);
    }
    const numComidas = form.get("numComidas") as string;
    if (numComidas && numComidas !== "6") {
      const comidasLabel: Record<string, string> = {
        "3": t("aiPrompt.comidas3"),
        "4": t("aiPrompt.comidas4"),
        "5": t("aiPrompt.comidas5"),
      };
      parts.push(comidasLabel[numComidas] || "");
    }
    const prefLabels: Record<string, string> = {
      pref_facil: t("aiPrompt.prefFacil"),
      pref_batch: t("aiPrompt.prefBatch"),
      pref_economico: t("aiPrompt.prefEconomico"),
      pref_variado: t("aiPrompt.prefVariado"),
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
        toast.success(t("toastGenerated"));
      }
    } catch (err) {
      if (err && typeof err === "object" && "digest" in err) throw err;
      toast.error(t("toastGenerateErrorMsg"));
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept() {
    if (!resultado) return;
    setAccepting(true);
    try {
      await aceptarPlanIA(resultado.generacionId, planId, macros);
      toast.success(t("toastAccepted"));
      window.location.href = `/dietas/${planId}`;
    } catch (error) { if (error && typeof error === "object" && "digest" in error) throw error;
      toast.error(t("toastAcceptError"));
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
            <h2 className="text-lg font-semibold">{t("configTitle")}</h2>
            <p className="text-sm text-muted-foreground mt-1">{t("configSubtitle")}</p>
          </div>

          {/* Fase */}
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("phaseLabel")}</label>
            <select
              name="fase"
              value={fase}
              onChange={(e) => handleFaseChange(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">{t("phaseCustom")}</option>
              <option value="deficit">{t("phaseDeficitOption")}</option>
              <option value="mantenimiento">{t("phaseMaintenanceOption")}</option>
              <option value="volumen">{t("phaseBulkOption")}</option>
              <option value="definicion">{t("phaseDefinitionOption")}</option>
              <option value="reverse">{t("phaseReverseOption")}</option>
            </select>
          </div>

          {/* Tipo de dieta */}
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("dietTypeLabel")}</label>
            <select name="tipoDieta" defaultValue="" className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="">{t("dietDefaultOption")}</option>
              <option value="baja_carbohidratos">{t("dietLowCarb")}</option>
              <option value="alta_proteina">{t("dietHighProtein")}</option>
              <option value="vegetariana">{t("dietVegetarian")}</option>
              <option value="vegana">{t("dietVegan")}</option>
              <option value="cetogenica">{t("dietKeto")}</option>
              <option value="sin_gluten">{t("dietGlutenFree")}</option>
              <option value="antiinflamatoria">{t("dietAntiInflammatory")}</option>
            </select>
          </div>

          {/* Comidas al día */}
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("mealsPerDay")}</label>
            <select name="numComidas" defaultValue="6" className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="3">{t("meals3")}</option>
              <option value="4">{t("meals4")}</option>
              <option value="5">{t("meals5")}</option>
              <option value="6">{t("meals6")}</option>
            </select>
          </div>

          {/* Macros */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">{t("dailyMacros")}</label>
              {fase && (
                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">{t("macrosAdjusted", { phase: fase })}</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-xs text-muted-foreground">{t("caloriesRequired")}</span>
                <input type="number" required min={800} max={6000} value={macros.calorias}
                  onChange={(e) => setMacros({ ...macros, calorias: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 mt-1" />
              </div>
              <div>
                <span className="text-xs text-muted-foreground">{t("proteins")}</span>
                <input type="number" min={0} max={2000} value={macros.proteinas}
                  onChange={(e) => setMacros({ ...macros, proteinas: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 mt-1" />
              </div>
              <div>
                <span className="text-xs text-muted-foreground">{t("carbs")}</span>
                <input type="number" min={0} max={2000} value={macros.carbohidratos}
                  onChange={(e) => setMacros({ ...macros, carbohidratos: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 mt-1" />
              </div>
              <div>
                <span className="text-xs text-muted-foreground">{t("fats")}</span>
                <input type="number" min={0} max={2000} value={macros.grasas}
                  onChange={(e) => setMacros({ ...macros, grasas: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 mt-1" />
              </div>
            </div>
          </div>

          {/* Preferencias */}
          <div>
            <label className="block text-sm font-medium mb-2">{t("preferences")}</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { name: "pref_facil", label: t("prefEasyToMake") },
                { name: "pref_batch", label: t("prefBatchCooking2") },
                { name: "pref_economico", label: t("prefAffordable") },
                { name: "pref_variado", label: t("prefVaried") },
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
              {t("patientData")}
            </h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <span className="text-xs text-muted-foreground">{t("name")}</span>
                <p className="font-medium">{pacienteNombre}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">{t("goal")}</span>
                <p className="font-medium">{t.has(`objetivoLabels.${pacienteInfo.objetivo}`) ? t(`objetivoLabels.${pacienteInfo.objetivo}`) : pacienteInfo.objetivo}</p>
              </div>
              {pacienteInfo.peso && (
                <div>
                  <span className="text-xs text-muted-foreground">{t("weight")}</span>
                  <p className="font-medium">{pacienteInfo.peso} kg</p>
                </div>
              )}
              {pacienteInfo.altura && (
                <div>
                  <span className="text-xs text-muted-foreground">{t("height")}</span>
                  <p className="font-medium">{pacienteInfo.altura} cm</p>
                </div>
              )}
            </div>
            {(pacienteInfo.alergias.length > 0 || pacienteInfo.intolerancias.length > 0) && (
              <div className="mt-3 pt-3 border-t border-border">
                {pacienteInfo.alergias.length > 0 && (
                  <div className="flex items-start gap-1.5 mb-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
                    <p className="text-xs"><span className="font-medium text-red-600 dark:text-red-400">{t("allergies")}</span> {pacienteInfo.alergias.join(", ")}</p>
                  </div>
                )}
                {pacienteInfo.intolerancias.length > 0 && (
                  <div className="flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-xs"><span className="font-medium text-amber-600 dark:text-amber-400">{t("intolerances")}</span> {pacienteInfo.intolerancias.join(", ")}</p>
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
            <h2 className="text-lg font-semibold mb-2">{t("additionalInstructions")}</h2>
            <p className="text-sm text-muted-foreground mb-4">
              {t("additionalInstructionsHint")}
            </p>
            <textarea
              name="instrucciones"
              maxLength={2000}
              placeholder={t("instructionsPlaceholder")}
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
            {t("generating")}
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            {t("generateButton")}
          </>
        )}
      </button>
    </form>
  );
}

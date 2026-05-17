import { ArrowLeft, Sparkles, User, AlertTriangle } from "lucide-react";
import { getDemoPatient, getDemoPlans } from "@/lib/tour-demo-data";
import { getTranslations } from "next-intl/server";

export default async function TourDemoIAPage() {
  const t = await getTranslations("settings.tours");
  const tDemo = await getTranslations("settings.tours.demoData");
  const DEMO_PATIENT = getDemoPatient(tDemo);
  const plan = getDemoPlans(tDemo)[0];

  return (
    <div>
      <div className="mb-4">
        <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-3 py-1.5 rounded-lg inline-flex items-center gap-1 mb-3 font-medium">
          {t("iaDemoBanner")}
        </p>
        <span className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-3 cursor-default">
          <ArrowLeft className="w-4 h-4" /> {t("backToPlan")}
        </span>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-amber-500" /> {t("generateDietWithAI")}
        </h1>
        <p className="text-muted-foreground mt-1">{t("forPatient", { name: `${DEMO_PATIENT.nombre} ${DEMO_PATIENT.apellidos}` })}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* COLUMNA IZQUIERDA */}
        <section data-tour="ia-config" className="bg-card rounded-xl border border-border p-6 space-y-5">
          <div>
            <h2 className="text-lg font-semibold">{t("planConfiguration")}</h2>
            <p className="text-sm text-muted-foreground mt-1">{t("defineParamsForGeneration")}</p>
          </div>

          {/* Fase */}
          <div data-tour="ia-fase">
            <label className="block text-sm font-medium mb-1.5">{t("nutritionalPhase")}</label>
            <select defaultValue="deficit" className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm">
              <option value="">{t("customOption")}</option>
              <option value="deficit">{t("deficitOption")}</option>
              <option value="mantenimiento">{t("maintenanceOption")}</option>
              <option value="volumen">{t("bulkOption")}</option>
              <option value="definicion">{t("definitionOption")}</option>
              <option value="reverse">{t("reverseOption")}</option>
            </select>
          </div>

          {/* Tipo de dieta */}
          <div data-tour="ia-tipo-dieta">
            <label className="block text-sm font-medium mb-1.5">{t("dietType")}</label>
            <select defaultValue="" className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm">
              <option value="">{t("mediterraneanDefault")}</option>
              <option value="baja_carbohidratos">{t("lowCarbOption")}</option>
              <option value="alta_proteina">{t("highProteinOption")}</option>
              <option value="vegetariana">{t("vegetarianOption")}</option>
              <option value="vegana">{t("veganOption")}</option>
              <option value="cetogenica">{t("ketogenicOption")}</option>
              <option value="sin_gluten">{t("glutenFreeOption")}</option>
              <option value="antiinflamatoria">{t("antiInflammatoryOption")}</option>
            </select>
          </div>

          {/* Comidas */}
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("mealsPerDay")}</label>
            <select defaultValue="5" className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm">
              <option value="3">{t("mealsCount", { count: 3 })}</option>
              <option value="4">{t("mealsCount", { count: 4 })}</option>
              <option value="5">{t("mealsCount", { count: 5 })}</option>
              <option value="6">{t("mealsCount", { count: 6 })}</option>
            </select>
          </div>

          {/* Macros */}
          <div data-tour="ia-macros">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">{t("dailyMacros")}</label>
              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">{t("adjustedToDeficit")}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-xs text-muted-foreground">{t("caloriesLabel")}</span>
                <input type="number" defaultValue={plan.kcal} readOnly className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-medium mt-1" />
              </div>
              <div>
                <span className="text-xs text-muted-foreground">{t("proteinsLabel")}</span>
                <input type="number" defaultValue={plan.prot} readOnly className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-medium mt-1" />
              </div>
              <div>
                <span className="text-xs text-muted-foreground">{t("carbsLabel")}</span>
                <input type="number" defaultValue={plan.carb} readOnly className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-medium mt-1" />
              </div>
              <div>
                <span className="text-xs text-muted-foreground">{t("fatsLabel")}</span>
                <input type="number" defaultValue={plan.grasa} readOnly className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-medium mt-1" />
              </div>
            </div>
          </div>

          {/* Preferencias */}
          <div data-tour="ia-preferencias">
            <label className="block text-sm font-medium mb-2">{t("preferences")}</label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { key: "prefEasyToPrepare", defaultChecked: true },
                { key: "prefBatchCooking", defaultChecked: false },
                { key: "prefEconomical", defaultChecked: false },
                { key: "prefVaried", defaultChecked: false },
              ] as const).map((pref) => (
                <label key={pref.key} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded-lg px-2 py-1.5">
                  <input type="checkbox" defaultChecked={pref.defaultChecked} className="w-4 h-4 accent-primary" />
                  {t(pref.key)}
                </label>
              ))}
            </div>
          </div>
        </section>

        {/* COLUMNA DERECHA */}
        <div className="flex flex-col gap-6">
          {/* Datos del paciente */}
          <section data-tour="ia-paciente-info" className="bg-card rounded-xl border border-border p-5">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-primary" /> {t("patientData")}
            </h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div><span className="text-xs text-muted-foreground">{t("name")}</span><p className="font-medium">{DEMO_PATIENT.nombre} {DEMO_PATIENT.apellidos}</p></div>
              <div><span className="text-xs text-muted-foreground">{t("goal")}</span><p className="font-medium">{DEMO_PATIENT.objetivo}</p></div>
              <div><span className="text-xs text-muted-foreground">{t("weight")}</span><p className="font-medium">{DEMO_PATIENT.peso} kg</p></div>
              <div><span className="text-xs text-muted-foreground">{t("height")}</span><p className="font-medium">{DEMO_PATIENT.altura} cm</p></div>
            </div>
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex items-start gap-1.5 mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
                <p className="text-xs"><span className="font-medium text-red-600 dark:text-red-400">{t("allergies")}:</span> {DEMO_PATIENT.alergias.join(", ")}</p>
              </div>
              <div className="flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-xs"><span className="font-medium text-amber-600 dark:text-amber-400">{t("intolerances")}:</span> {DEMO_PATIENT.intolerancias.join(", ")}</p>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {DEMO_PATIENT.preferencias.map((pref) => (
                <span key={pref} className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{pref}</span>
              ))}
            </div>
          </section>

          {/* Instrucciones */}
          <section data-tour="ia-instrucciones" className="bg-card rounded-xl border border-border p-6 flex flex-col flex-1">
            <h2 className="text-lg font-semibold mb-2">{t("additionalInstructions")}</h2>
            <p className="text-sm text-muted-foreground mb-4">{t("aiInstructionsPriority")}</p>
            <textarea
              defaultValue={t("aiInstructionsExample")}
              readOnly
              className="w-full px-4 py-3 rounded-lg border border-border bg-background text-sm resize-y flex-1 min-h-[120px]"
            />
          </section>
        </div>
      </div>

      <div data-tour="ia-generar-btn" className="mt-4">
        <span className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium">
          <Sparkles className="w-5 h-5" /> {t("generatePlanWithAI")}
        </span>
      </div>
    </div>
  );
}

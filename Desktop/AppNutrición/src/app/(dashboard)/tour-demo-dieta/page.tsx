import { Sparkles, Share2, Pencil, FileDown, Trash2, ArrowLeft, ChevronDown } from "lucide-react";
import { DEMO_PATIENT, DEMO_PLANS, DEMO_DIETA_DIAS, AVATAR_DEMO } from "@/lib/tour-demo-data";

const MACRO_COLORS: Record<string, string> = {
  cal: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30",
  prot: "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30",
  carb: "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/30",
  grasa: "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/30",
};

export default function TourDemoDietaPage() {
  const plan = DEMO_PLANS[0];

  return (
    <div>
      <div className="mb-4">
        <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-3 py-1.5 rounded-lg inline-flex items-center gap-1 mb-3 font-medium">
          Plan de demostración — Solo para el tour guiado
        </p>

        <div className="space-y-3">
          <span className="inline-flex items-center gap-1 text-sm text-muted-foreground cursor-default">
            <ArrowLeft className="w-4 h-4" /> Volver a planes
          </span>

          <div className="flex items-center gap-3">
            <img src={AVATAR_DEMO} alt="" className="w-9 h-9 rounded-full" />
            <p className="text-sm font-medium">{DEMO_PATIENT.nombre} {DEMO_PATIENT.apellidos}</p>
          </div>

          <div data-tour="plan-actions" className="flex items-center gap-2 flex-wrap">
            <span data-tour="ia-btn" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 text-sm font-medium">
              <Sparkles className="w-3.5 h-3.5" /> IA
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm font-medium">Plantilla</span>
            <span data-tour="share-btn" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm font-medium">
              <Share2 className="w-3.5 h-3.5" /> Compartir
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm font-medium">
              <Pencil className="w-3.5 h-3.5" /> Editar
            </span>
            <span data-tour="pdf-btn" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm font-medium">
              <FileDown className="w-3.5 h-3.5" /> PDF
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-sm font-medium">
              <Trash2 className="w-3.5 h-3.5" /> Eliminar
            </span>
          </div>
        </div>
      </div>

      {/* Plan selector */}
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xl font-bold">{plan.nombre}</h2>
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-border text-xs text-muted-foreground cursor-default">
          {DEMO_PLANS.length} planes <ChevronDown className="w-3 h-3" />
        </span>
      </div>

      {/* Macros objetivo */}
      <div data-tour="plan-macros" className="flex items-center gap-4 mb-4 p-3 bg-muted/50 rounded-lg flex-wrap">
        <span className="text-xs text-muted-foreground">Objetivos diarios:</span>
        <span className={`text-xs px-2 py-0.5 rounded-full border ${MACRO_COLORS.cal}`}>{plan.kcal} kcal</span>
        <span className={`text-xs px-2 py-0.5 rounded-full border ${MACRO_COLORS.prot}`}>{plan.prot}g P</span>
        <span className={`text-xs px-2 py-0.5 rounded-full border ${MACRO_COLORS.carb}`}>{plan.carb}g C</span>
        <span className={`text-xs px-2 py-0.5 rounded-full border ${MACRO_COLORS.grasa}`}>{plan.grasa}g G</span>
      </div>

      {/* Grid de días */}
      <div data-tour="plan-editor" className="overflow-x-auto pb-4 scroll-smooth snap-x snap-mandatory">
        <div className="flex gap-3" style={{ width: `calc(((100% + 0.75rem) / 3) * 3 - 0.75rem)` }}>
          {DEMO_DIETA_DIAS.map((dia) => (
            <div key={dia.nombre} className="flex-1 min-w-0 snap-start">
              <div className="text-center font-semibold text-sm py-2 border-b border-border bg-muted/50 rounded-t-lg">
                {dia.nombre}
              </div>
              <div className="border-x border-border p-2 space-y-3">
                {dia.comidas.map((comida) => (
                  <div key={comida.tipo} className="space-y-1.5 p-1.5 rounded-lg min-h-[60px]">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{comida.tipo}</h4>
                    {comida.items.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground/50 italic">Sin alimentos</p>
                    ) : (
                      <div className="space-y-1">
                        {comida.items.map((item) => (
                          <div key={item.nombre} className="flex items-center justify-between p-1.5 rounded border border-border bg-card text-xs">
                            <span className="font-medium">{item.nombre}</span>
                            <span className="text-muted-foreground">{item.g}g</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="border border-border rounded-b-lg p-2 bg-muted/30 text-center">
                <span className="text-sm font-bold text-amber-600 dark:text-amber-400">~{plan.kcal}</span>
                <span className="text-[10px] text-muted-foreground ml-0.5">kcal</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { Plus, BookCopy, Search, Flame } from "lucide-react";
import { DEMO_PATIENT, DEMO_PLANS, AVATAR_DEMO } from "@/lib/tour-demo-data";

export default function TourDemoPlanesPage() {
  return (
    <div>
      <div className="mb-4">
        <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-3 py-1.5 rounded-lg inline-flex items-center gap-1 mb-3 font-medium">
          Planes de demostración — Solo para el tour guiado
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Planes alimenticios</h1>
          <p className="text-muted-foreground mt-1">{DEMO_PLANS.length} planes · 1 paciente</p>
        </div>
        <div className="flex gap-2">
          <span data-tour="plantillas-btn" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium">
            <BookCopy className="w-4 h-4" /> Plantillas (2)
          </span>
          <span data-tour="nuevo-plan-btn" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
            <Plus className="w-4 h-4" /> Nuevo plan
          </span>
        </div>
      </div>

      <div data-tour="planes-buscador" className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Buscar por nombre de dieta o paciente..." readOnly
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-background text-sm" />
        </div>
      </div>

      <div data-tour="planes-lista" className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-muted/30">
            <img src={AVATAR_DEMO} alt="" className="w-11 h-11 rounded-full" />
            <div>
              <h2 className="font-semibold">{DEMO_PATIENT.nombre} {DEMO_PATIENT.apellidos}</h2>
              <p className="text-xs text-muted-foreground">{DEMO_PLANS.length} planes</p>
            </div>
          </div>
          <div className="divide-y divide-border">
            {DEMO_PLANS.map((plan, i) => (
              <div
                key={plan.nombre}
                data-tour={i === 0 ? "plan-card" : undefined}
                className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-muted/40 transition-colors group cursor-pointer"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium group-hover:text-primary transition-colors">{plan.nombre}</h3>
                    {plan.activo && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 font-medium">Activo</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400"><Flame className="w-3 h-3" />{plan.kcal} kcal</span>
                    <span>{plan.prot}P · {plan.carb}C · {plan.grasa}G</span>
                  </div>
                </div>
                <span className="text-muted-foreground group-hover:text-primary transition-colors text-sm">&rsaquo;</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

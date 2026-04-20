import { Plus, BookCopy, Search, CalendarDays, Flame } from "lucide-react";

const PACIENTES = [
  {
    nombre: "Laura Martínez", iniciales: "LM",
    planes: [
      { nombre: "Plan Mantenimiento Marzo", fecha: "21/03/2026", kcal: 1800 },
      { nombre: "Plan Deportivo", fecha: "15/03/2026", kcal: 2100 },
    ],
  },
  {
    nombre: "Carlos García", iniciales: "CG",
    planes: [
      { nombre: "Déficit calórico", fecha: "18/03/2026", kcal: 1400 },
      { nombre: "Plan inicial", fecha: "10/03/2026", kcal: 2000 },
      { nombre: "Plan prueba", fecha: "05/03/2026", kcal: 1700 },
    ],
  },
  {
    nombre: "Ana López", iniciales: "AL",
    planes: [
      { nombre: "Volumen muscular", fecha: "20/03/2026", kcal: 2800 },
    ],
  },
];

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
          <p className="text-muted-foreground mt-1">6 planes · 3 pacientes</p>
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
        {PACIENTES.map((pac) => (
          <section key={pac.nombre} className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-muted/30">
              <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">{pac.iniciales}</div>
              <div>
                <h2 className="font-semibold">{pac.nombre}</h2>
                <p className="text-xs text-muted-foreground">{pac.planes.length} plan{pac.planes.length !== 1 ? "es" : ""}</p>
              </div>
            </div>
            <div data-tour="plan-card" className="divide-y divide-border">
              {pac.planes.map((plan) => (
                <div key={plan.nombre} className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-muted/40 transition-colors group cursor-pointer">
                  <div>
                    <h3 className="font-medium group-hover:text-primary transition-colors">{plan.nombre}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{plan.fecha}</span>
                      <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400"><Flame className="w-3 h-3" />{plan.kcal} kcal</span>
                    </div>
                  </div>
                  <span className="text-muted-foreground group-hover:text-primary transition-colors text-sm">&rsaquo;</span>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

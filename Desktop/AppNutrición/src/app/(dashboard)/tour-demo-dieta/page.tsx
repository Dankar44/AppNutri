import { Sparkles, Share2, Pencil, FileDown, Trash2 } from "lucide-react";

const DIAS = [
  {
    nombre: "Lunes",
    comidas: [
      { tipo: "DESAYUNO", hora: "08:00", desc: "Porridge de avena con plátano", items: [{ nombre: "Avena", g: 60 }, { nombre: "Plátano", g: 100 }, { nombre: "Leche", g: 200 }] },
      { tipo: "MEDIA MAÑANA", hora: "11:00", desc: "Yogur con frutas", items: [{ nombre: "Yogur natural", g: 150 }, { nombre: "Fresa", g: 80 }] },
      { tipo: "ALMUERZO", hora: "14:00", desc: "Pollo al horno con arroz y verduras", items: [{ nombre: "Pollo", g: 150 }, { nombre: "Arroz", g: 80 }, { nombre: "Brócoli", g: 100 }] },
      { tipo: "MERIENDA", hora: "17:30", desc: "Tostada con aguacate", items: [{ nombre: "Pan integral", g: 60 }, { nombre: "Aguacate", g: 50 }] },
      { tipo: "CENA", hora: "21:00", desc: "Merluza a la plancha con patatas", items: [{ nombre: "Merluza", g: 150 }, { nombre: "Patatas", g: 120 }, { nombre: "Aceite oliva", g: 10 }] },
      { tipo: "RECENA", hora: "23:00", desc: "Infusión con galletas", items: [{ nombre: "Infusión", g: 200 }] },
    ],
  },
  {
    nombre: "Martes",
    comidas: [
      { tipo: "DESAYUNO", hora: "08:00", desc: "Tostada con tomate y aceite", items: [{ nombre: "Pan integral", g: 80 }, { nombre: "Tomate", g: 60 }, { nombre: "Aceite oliva", g: 10 }] },
      { tipo: "MEDIA MAÑANA", hora: "11:00", desc: "Manzana con nueces", items: [{ nombre: "Manzana", g: 150 }, { nombre: "Nueces", g: 20 }] },
      { tipo: "ALMUERZO", hora: "14:00", desc: "Lentejas con verduras", items: [{ nombre: "Lentejas", g: 80 }, { nombre: "Zanahoria", g: 60 }, { nombre: "Espinacas", g: 50 }] },
      { tipo: "MERIENDA", hora: "17:30", desc: "Yogur con granola", items: [{ nombre: "Yogur", g: 150 }, { nombre: "Granola", g: 30 }] },
      { tipo: "CENA", hora: "21:00", desc: "Salmón con ensalada", items: [{ nombre: "Salmón", g: 120 }, { nombre: "Lechuga", g: 80 }, { nombre: "Tomate", g: 60 }] },
      { tipo: "RECENA", hora: "23:00", desc: "Plátano", items: [{ nombre: "Plátano", g: 100 }] },
    ],
  },
  {
    nombre: "Miércoles",
    comidas: [
      { tipo: "DESAYUNO", hora: "08:00", desc: "Huevos revueltos con pan", items: [{ nombre: "Huevos", g: 120 }, { nombre: "Pan integral", g: 60 }, { nombre: "Tomate", g: 40 }] },
      { tipo: "MEDIA MAÑANA", hora: "11:00", desc: "Fruta de temporada", items: [{ nombre: "Naranja", g: 180 }] },
      { tipo: "ALMUERZO", hora: "14:00", desc: "Pasta con atún y verduras", items: [{ nombre: "Pasta", g: 80 }, { nombre: "Atún", g: 100 }, { nombre: "Pimiento", g: 50 }] },
      { tipo: "MERIENDA", hora: "17:30", desc: "Batido de proteínas", items: [{ nombre: "Proteína whey", g: 30 }, { nombre: "Leche", g: 250 }] },
      { tipo: "CENA", hora: "21:00", desc: "Tortilla de espinacas", items: [{ nombre: "Huevos", g: 120 }, { nombre: "Espinacas", g: 80 }, { nombre: "Aceite oliva", g: 8 }] },
      { tipo: "RECENA", hora: "23:00", desc: "Infusión", items: [{ nombre: "Infusión", g: 200 }] },
    ],
  },
];

const MACRO_COLORS: Record<string, string> = {
  cal: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30",
  prot: "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30",
  carb: "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/30",
  grasa: "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/30",
};

export default function TourDemoDietaPage() {
  return (
    <div>
      <div className="mb-4">
        <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-3 py-1.5 rounded-lg inline-flex items-center gap-1 mb-3 font-medium">
          Plan de demostración — Solo para el tour guiado
        </p>

        <div className="space-y-3">
          <p className="text-sm font-medium">Paciente: Laura Martínez García</p>
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

      <h2 className="text-xl font-bold mb-4">Plan Mantenimiento Marzo</h2>

      {/* Macros objetivo */}
      <div data-tour="plan-macros" className="flex items-center gap-4 mb-4 p-3 bg-muted/50 rounded-lg">
        <span className="text-xs text-muted-foreground">Objetivos diarios:</span>
        <span className={`text-xs px-2 py-0.5 rounded-full border ${MACRO_COLORS.cal}`}>1800 kcal</span>
        <span className={`text-xs px-2 py-0.5 rounded-full border ${MACRO_COLORS.prot}`}>120g P</span>
        <span className={`text-xs px-2 py-0.5 rounded-full border ${MACRO_COLORS.carb}`}>200g C</span>
        <span className={`text-xs px-2 py-0.5 rounded-full border ${MACRO_COLORS.grasa}`}>65g G</span>
      </div>

      {/* Grid de días */}
      <div data-tour="plan-editor" className="overflow-x-auto pb-4 scroll-smooth snap-x snap-mandatory">
        <div className="flex gap-3" style={{ width: `calc(((100% + 0.75rem) / 3) * 3 - 0.75rem)` }}>
          {DIAS.map((dia) => (
            <div key={dia.nombre} className="flex-1 min-w-0 snap-start">
              <div className="text-center font-semibold text-sm py-2 border-b border-border bg-muted/50 rounded-t-lg">
                {dia.nombre}
              </div>
              <div className="border-x border-border p-2 space-y-3">
                {dia.comidas.map((comida) => (
                  <div key={comida.tipo} className="space-y-1.5 p-1.5 rounded-lg min-h-[60px]">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{comida.tipo}</h4>
                      <span className="text-[10px] text-muted-foreground">{comida.hora}</span>
                    </div>
                    <input
                      type="text"
                      defaultValue={comida.desc}
                      readOnly
                      className="w-full px-2 py-1 text-[11px] rounded border border-border bg-background text-muted-foreground italic"
                    />
                    <div className="space-y-1">
                      {comida.items.map((item) => (
                        <div key={item.nombre} className="flex items-center justify-between p-1.5 rounded border border-border bg-card text-xs">
                          <span className="font-medium">{item.nombre}</span>
                          <span className="text-muted-foreground">{item.g}g</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="border border-border rounded-b-lg p-2 bg-muted/30 text-center">
                <span className="text-sm font-bold text-amber-600 dark:text-amber-400">~1800</span>
                <span className="text-[10px] text-muted-foreground ml-0.5">kcal</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookCopy, CalendarDays, UtensilsCrossed, Trash2 } from "lucide-react";
import { getPlantillaDetalle } from "@/app/actions/plantillas";
import { formatQuantity } from "@/lib/units";
import { convertirAGramos, calcularMacrosPorcion } from "@/lib/macros";
import { formatDate } from "@/lib/utils";
import { EliminarPlantillaButton } from "./eliminar-button";

const DIA_LABELS: Record<string, string> = {
  LUNES: "Lunes", MARTES: "Martes", MIERCOLES: "Miércoles",
  JUEVES: "Jueves", VIERNES: "Viernes", SABADO: "Sábado", DOMINGO: "Domingo",
};
const DIAS_ORDEN = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO", "DOMINGO"];

const TIPO_LABELS: Record<string, string> = {
  DESAYUNO: "Desayuno", MEDIA_MANANA: "Media mañana", ALMUERZO: "Almuerzo",
  MERIENDA: "Merienda", CENA: "Cena", RECENA: "Recena",
};
const TIPOS_ORDEN = ["DESAYUNO", "MEDIA_MANANA", "ALMUERZO", "MERIENDA", "CENA", "RECENA"];

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PlantillaDetallePage({ params }: Props) {
  const { id } = await params;
  const plantilla = await getPlantillaDetalle(id);
  if (!plantilla) notFound();

  const { datos, alimentosMap, recetasMap } = plantilla;
  const sortedDias = DIAS_ORDEN
    .map((d) => datos.find((dia) => dia.dia === d))
    .filter(Boolean) as typeof datos;

  let totalAlimentos = 0;
  for (const dia of datos) {
    for (const comida of dia.comidas) {
      totalAlimentos += comida.alimentos.length;
    }
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/dietas/plantillas"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3 py-2 sm:py-0 -my-2 sm:my-0"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a plantillas
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BookCopy className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">{plantilla.nombre}</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Creada el {formatDate(plantilla.createdAt)} · {sortedDias.length} días · {totalAlimentos} alimentos
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/dietas/nuevo?plantilla=${plantilla.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              Usar plantilla
            </Link>
            <EliminarPlantillaButton id={plantilla.id} nombre={plantilla.nombre} />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {sortedDias.map((dia) => {
          const comidasConDatos = TIPOS_ORDEN.map((tipo) => {
            const comida = dia.comidas.find((c) => c.tipo === tipo);
            if (!comida || comida.alimentos.length === 0) return null;

            const items = comida.alimentos.map((a) => {
              let nombre = "Alimento eliminado";
              let cal = 0, prot = 0, carb = 0, gras = 0;

              if (a.recetaId && recetasMap[a.recetaId]) {
                const r = recetasMap[a.recetaId];
                nombre = r.nombre;
                cal = r.calorias * a.cantidad;
                prot = r.proteinas * a.cantidad;
                carb = r.carbohidratos * a.cantidad;
                gras = r.grasas * a.cantidad;
              } else if (a.alimentoId && alimentosMap[a.alimentoId]) {
                const al = alimentosMap[a.alimentoId];
                nombre = al.nombre;
                const gramos = convertirAGramos(a.cantidad, a.unidad, al.porcion);
                const macros = calcularMacrosPorcion({ ...al, fibra: 0 }, gramos);
                cal = macros.calorias;
                prot = macros.proteinas;
                carb = macros.carbohidratos;
                gras = macros.grasas;
              }

              return { nombre, cantidad: a.cantidad, unidad: a.unidad, cal, prot, carb, gras };
            });

            const comidaCal = items.reduce((s, i) => s + i.cal, 0);
            const comidaProt = items.reduce((s, i) => s + i.prot, 0);
            const comidaCarb = items.reduce((s, i) => s + i.carb, 0);
            const comidaGras = items.reduce((s, i) => s + i.gras, 0);

            return { tipo, items, comidaCal, comidaProt, comidaCarb, comidaGras };
          }).filter(Boolean) as { tipo: string; items: { nombre: string; cantidad: number; unidad: string; cal: number; prot: number; carb: number; gras: number }[]; comidaCal: number; comidaProt: number; comidaCarb: number; comidaGras: number }[];

          const diaCal = comidasConDatos.reduce((s, c) => s + c.comidaCal, 0);
          const diaProt = comidasConDatos.reduce((s, c) => s + c.comidaProt, 0);
          const diaCarb = comidasConDatos.reduce((s, c) => s + c.comidaCarb, 0);
          const diaGras = comidasConDatos.reduce((s, c) => s + c.comidaGras, 0);

          return (
            <div key={dia.dia} className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="px-5 py-3 bg-muted/30 border-b border-border">
                <h2 className="font-bold text-lg flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-primary" />
                  {DIA_LABELS[dia.dia] || dia.dia}
                </h2>
              </div>

              <div className="divide-y divide-border/50">
                {comidasConDatos.map((comida) => (
                  <div key={comida.tipo} className="px-5 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-semibold text-primary">
                        {TIPO_LABELS[comida.tipo] || comida.tipo}
                      </h3>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {Math.round(comida.comidaCal)} kcal · {Math.round(comida.comidaProt)}P · {Math.round(comida.comidaCarb)}C · {Math.round(comida.comidaGras)}G
                      </span>
                    </div>
                    {comida.items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between py-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm font-medium truncate">{item.nombre}</span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {formatQuantity(item.cantidad, item.unidad)}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums shrink-0 ml-3">
                          {Math.round(item.cal)} kcal
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <div className="px-5 py-3 bg-muted/20 border-t border-border flex items-center justify-between">
                <span className="text-sm font-semibold">Total del día</span>
                <span className="text-sm font-bold tabular-nums">
                  {Math.round(diaCal)} kcal · {Math.round(diaProt)}g P · {Math.round(diaCarb)}g C · {Math.round(diaGras)}g G
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

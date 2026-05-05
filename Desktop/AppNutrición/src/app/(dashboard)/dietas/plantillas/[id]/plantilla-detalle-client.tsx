"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookCopy, Pencil, Save } from "lucide-react";
import { toast } from "sonner";
import { PlanVisual, type PlanVisualDetalle } from "@/components/paciente/plan-visual";
import { actualizarDatosPlantilla } from "@/app/actions/plantillas";
import { EliminarPlantillaButton } from "./eliminar-button";
import { RenombrarPlantillaButton } from "./renombrar-button";
import { formatDate } from "@/lib/utils";

interface EditorAlimento {
  alimentoId: string | null;
  recetaId: string | null;
  cantidad: number;
  unidad: string;
  nombre: string;
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
  fibra: number;
  porcion: number;
}

interface EditorDia {
  dia: string;
  comidas: { tipo: string; alimentos: EditorAlimento[] }[];
}

interface Props {
  plantillaId: string;
  plantillaNombre: string;
  plantillaCreatedAt: string;
  diasCount: number;
  totalAlimentos: number;
  initialPlanData: PlanVisualDetalle;
  editorDias: EditorDia[];
}

const DIAS_ORDEN = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO", "DOMINGO"];

function diasToPlanData(dias: EditorDia[], id: string, nombre: string, createdAt: string): PlanVisualDetalle {
  return {
    id, nombre, caloriasObjetivo: null, activo: false,
    proteinasObjetivo: null, carbohidratosObjetivo: null, grasasObjetivo: null, createdAt,
    dias: DIAS_ORDEN
      .map((diaKey) => {
        const dia = dias.find((d) => d.dia === diaKey);
        if (!dia) return null;
        return {
          id: `pt-${diaKey}`,
          dia: diaKey,
          comidas: dia.comidas.map((comida) => ({
            id: `pt-${diaKey}-${comida.tipo}`,
            tipo: comida.tipo,
            descripcion: null,
            alimentos: comida.alimentos.map((a, ai) => ({
              id: `pt-${diaKey}-${comida.tipo}-${ai}`,
              cantidad: a.cantidad,
              unidad: a.unidad,
              alimento: a.recetaId ? null : {
                id: a.alimentoId || "",
                nombre: a.nombre,
                calorias: a.calorias,
                proteinas: a.proteinas,
                carbohidratos: a.carbohidratos,
                grasas: a.grasas,
                fibra: a.fibra,
                porcion: a.porcion,
              },
              receta: a.recetaId ? {
                id: a.recetaId,
                nombre: a.nombre,
                calorias: a.calorias,
                proteinas: a.proteinas,
                carbohidratos: a.carbohidratos,
                grasas: a.grasas,
                fibra: a.fibra,
                porciones: 1,
              } : null,
            })),
          })),
        };
      })
      .filter(Boolean) as PlanVisualDetalle["dias"],
  };
}

function parseComidaId(comidaId: string) {
  // pt-LUNES-DESAYUNO or pt-LUNES-MEDIA_MANANA
  const m = comidaId.match(/^pt-([A-Z]+)-(.+)$/);
  if (!m) return null;
  return { dia: m[1], tipo: m[2] };
}

function parseAlimentoId(alimentoId: string) {
  // pt-LUNES-DESAYUNO-3 or pt-LUNES-MEDIA_MANANA-0
  const m = alimentoId.match(/^pt-([A-Z]+)-(.+)-(\d+)$/);
  if (!m) return null;
  return { dia: m[1], tipo: m[2], index: parseInt(m[3], 10) };
}

export function PlantillaDetalleClient({
  plantillaId, plantillaNombre, plantillaCreatedAt,
  diasCount, totalAlimentos, initialPlanData, editorDias: initialEditorDias,
}: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dias, setDias] = useState<EditorDia[]>(initialEditorDias);
  const [hasChanges, setHasChanges] = useState(false);

  const planData = useMemo(() => {
    if (!editing) return initialPlanData;
    return diasToPlanData(dias, plantillaId, plantillaNombre, plantillaCreatedAt);
  }, [editing, dias, initialPlanData, plantillaId, plantillaNombre, plantillaCreatedAt]);

  const localCallbacks = useMemo(() => ({
    onAdd(comidaId: string, item: { alimentoId: string | null; recetaId: string | null; nombre: string; cantidad: number; unidad: string; calorias: number; proteinas: number; carbohidratos: number; grasas: number; fibra?: number; porcion?: number }) {
      const parsed = parseComidaId(comidaId);
      if (!parsed) return;
      setDias((prev) =>
        prev.map((d) => {
          if (d.dia !== parsed.dia) return d;
          return {
            ...d,
            comidas: d.comidas.map((c) => {
              if (c.tipo !== parsed.tipo) return c;
              return {
                ...c,
                alimentos: [...c.alimentos, {
                  alimentoId: item.alimentoId,
                  recetaId: item.recetaId,
                  cantidad: item.cantidad,
                  unidad: item.unidad,
                  nombre: item.nombre,
                  calorias: item.calorias,
                  proteinas: item.proteinas,
                  carbohidratos: item.carbohidratos,
                  grasas: item.grasas,
                  fibra: item.fibra ?? 0,
                  porcion: item.porcion ?? 100,
                }],
              };
            }),
          };
        })
      );
      setHasChanges(true);
    },
    onRemove(alimentoId: string) {
      const parsed = parseAlimentoId(alimentoId);
      if (!parsed) return;
      setDias((prev) =>
        prev.map((d) => {
          if (d.dia !== parsed.dia) return d;
          return {
            ...d,
            comidas: d.comidas.map((c) => {
              if (c.tipo !== parsed.tipo) return c;
              return { ...c, alimentos: c.alimentos.filter((_, i) => i !== parsed.index) };
            }),
          };
        })
      );
      setHasChanges(true);
    },
    onCantidadChange(alimentoId: string, cantidad: number) {
      const parsed = parseAlimentoId(alimentoId);
      if (!parsed) return;
      setDias((prev) =>
        prev.map((d) => {
          if (d.dia !== parsed.dia) return d;
          return {
            ...d,
            comidas: d.comidas.map((c) => {
              if (c.tipo !== parsed.tipo) return c;
              return {
                ...c,
                alimentos: c.alimentos.map((a, i) =>
                  i === parsed.index ? { ...a, cantidad } : a
                ),
              };
            }),
          };
        })
      );
      setHasChanges(true);
    },
    onMove(alimentoId: string, targetComidaId: string) {
      const src = parseAlimentoId(alimentoId);
      const dst = parseComidaId(targetComidaId);
      if (!src || !dst) return;
      setDias((prev) => {
        let movedItem: EditorAlimento | null = null;
        const after = prev.map((d) => ({
          ...d,
          comidas: d.comidas.map((c) => {
            if (d.dia === src.dia && c.tipo === src.tipo) {
              const item = c.alimentos[src.index];
              if (item) movedItem = item;
              return { ...c, alimentos: c.alimentos.filter((_, i) => i !== src.index) };
            }
            return c;
          }),
        }));
        if (!movedItem) return prev;
        return after.map((d) => ({
          ...d,
          comidas: d.comidas.map((c) => {
            if (d.dia === dst.dia && c.tipo === dst.tipo) {
              return { ...c, alimentos: [...c.alimentos, movedItem!] };
            }
            return c;
          }),
        }));
      });
      setHasChanges(true);
    },
  }), []);

  async function handleSave() {
    setSaving(true);
    const datosParaGuardar = dias.map((dia) => ({
      dia: dia.dia,
      comidas: dia.comidas
        .filter((c) => c.alimentos.length > 0)
        .map((c) => ({
          tipo: c.tipo,
          alimentos: c.alimentos.map((a) => ({
            alimentoId: a.alimentoId,
            recetaId: a.recetaId,
            cantidad: a.cantidad,
            unidad: a.unidad,
          })),
        })),
    }));

    const res = await actualizarDatosPlantilla(plantillaId, datosParaGuardar as any);
    setSaving(false);

    if (res.ok) {
      toast.success("Plantilla actualizada");
      setHasChanges(false);
      setEditing(false);
      router.refresh();
    } else {
      toast.error(res.error || "Error al guardar");
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

        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="p-2 rounded-lg bg-primary/10 shrink-0">
              <BookCopy className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-3xl font-bold leading-tight line-clamp-2 sm:truncate">
                {plantillaNombre}
              </h1>
              <p className="text-sm text-muted-foreground">
                Creada el {formatDate(plantillaCreatedAt)} · {diasCount} días · {totalAlimentos} alimentos
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-card p-1 flex-wrap w-full sm:w-auto sm:ml-auto">
            {editing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving || !hasChanges}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-xs sm:text-sm font-medium flex-1 sm:flex-none min-h-10 sm:min-h-0 disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? "Guardando..." : "Guardar"}
                </button>
                <button
                  onClick={() => { setDias(initialEditorDias); setEditing(false); setHasChanges(false); }}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg hover:bg-muted transition-colors text-xs sm:text-sm font-medium flex-1 sm:flex-none min-h-10 sm:min-h-0"
                >
                  Cancelar
                </button>
                {hasChanges && (
                  <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/15 px-2 py-1 rounded-full shrink-0">
                    Sin guardar
                  </span>
                )}
              </>
            ) : (
              <>
                <Link
                  href={`/dietas/nuevo?plantilla=${plantillaId}`}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-xs sm:text-sm font-medium flex-1 sm:flex-none min-h-10 sm:min-h-0"
                >
                  Usar plantilla
                </Link>
                <button
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg hover:bg-muted transition-colors text-xs sm:text-sm font-medium flex-1 sm:flex-none min-h-10 sm:min-h-0"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline sm:inline">Editar</span>
                </button>
                <RenombrarPlantillaButton id={plantillaId} nombreActual={plantillaNombre} />
                <EliminarPlantillaButton id={plantillaId} nombre={plantillaNombre} />
              </>
            )}
          </div>
        </div>
      </div>

      <PlanVisual
        key={editing ? "editing" : "viewing"}
        plan={planData}
        pacienteId=""
        pacienteNombre=""
        showPlanSelector={false}
        showPdfButton={false}
        showAsignarButton={false}
        showNuevaDietaButton={false}
        showAguaEjercicio={false}
        showFoodTable={false}
        readOnly={!editing}
        vistaInicial={editing ? "plan" : "resumen"}
        localCallbacks={editing ? localCallbacks : undefined}
      />
    </div>
  );
}

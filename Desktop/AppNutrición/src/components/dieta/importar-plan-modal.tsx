"use client";

import { useTranslations } from "next-intl";
import { useState, useEffect, useCallback } from "react";
import {
  X,
  ChevronLeft,
  Check,
  Search,
  CalendarDays,
  UtensilsCrossed,
  Loader2,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { cn, isNextNavigation } from "@/lib/utils";
import { SelectorDiasModo, type DiaOption } from "./copiar-comida-modal";
import {
  getPacientesParaPlan,
  getPlanesPaciente,
  getPlanParaImportar,
  copiarComidaADias,
  copiarDiaADias,
  type ModoCopia,
} from "@/app/actions/planes";

type PlanDetalle = NonNullable<Awaited<ReturnType<typeof getPlanParaImportar>>>;

interface PacienteItem {
  id: string;
  nombre: string;
  apellidos: string;
  fotoUrl: string | null;
}
interface PlanItem {
  id: string;
  nombre: string;
  activo: boolean;
  createdAt: string | Date;
}

export function ImportarPlanModal({
  open,
  onClose,
  pacienteActualId,
  pacienteActualNombre,
  planActualId,
  diasDelPlanActual,
  onImported,
}: {
  open: boolean;
  onClose: () => void;
  pacienteActualId: string;
  pacienteActualNombre: string;
  planActualId: string;
  diasDelPlanActual: DiaOption[];
  onImported: () => void;
}) {
  const t = useTranslations("diets");
  const [step, setStep] = useState(1);
  const [pacientes, setPacientes] = useState<PacienteItem[]>([]);
  const [busquedaPac, setBusquedaPac] = useState("");
  const [pacienteSel, setPacienteSel] = useState<string | null>(null);
  const [planes, setPlanes] = useState<PlanItem[]>([]);
  const [loadingPlanes, setLoadingPlanes] = useState(false);
  const [planSel, setPlanSel] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<PlanDetalle | null>(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [tipoImport, setTipoImport] = useState<"dia" | "comida">("dia");
  const [diaOrigenSel, setDiaOrigenSel] = useState<string | null>(null);
  const [comidaOrigenSel, setComidaOrigenSel] = useState<string | null>(null);
  const [seleccionDestino, setSeleccionDestino] = useState<string[]>([]);
  const [modo, setModo] = useState<ModoCopia>("reemplazar");
  const [importing, setImporting] = useState(false);

  const seleccionarPlan = useCallback((id: string) => {
    setPlanSel(id);
    setDetalle(null);
    setDiaOrigenSel(null);
    setComidaOrigenSel(null);
    setLoadingDetalle(true);
    getPlanParaImportar(id)
      .then((d) => setDetalle(d))
      .finally(() => setLoadingDetalle(false));
  }, []);

  const seleccionarPaciente = useCallback(
    (id: string) => {
      setPacienteSel(id);
      setPlanes([]);
      setPlanSel(null);
      setDetalle(null);
      setLoadingPlanes(true);
      getPlanesPaciente(id)
        .then((ps) => {
          // Excluir el plan que estamos editando (importar es "desde OTRO plan").
          setPlanes(
            ps
              .filter((p) => p.id !== planActualId)
              .map((p) => ({ id: p.id, nombre: p.nombre, activo: p.activo, createdAt: p.createdAt })),
          );
        })
        .finally(() => setLoadingPlanes(false));
    },
    [planActualId],
  );

  // Al abrir: reset + cargar pacientes + preseleccionar el paciente actual
  useEffect(() => {
    if (!open) return;
    setStep(1);
    setBusquedaPac("");
    setTipoImport("dia");
    setSeleccionDestino([]);
    setModo("reemplazar");
    getPacientesParaPlan().then((ps) => {
      let items = ps.map((p) => ({ id: p.id, nombre: p.nombre, apellidos: p.apellidos, fotoUrl: p.fotoUrl }));
      // El paciente actual siempre debe estar (aunque esté inactivo o sea de ejemplo),
      // para poder traer de OTRO plan del MISMO paciente. Y va el primero.
      if (!items.some((p) => p.id === pacienteActualId)) {
        items = [{ id: pacienteActualId, nombre: pacienteActualNombre, apellidos: "", fotoUrl: null }, ...items];
      } else {
        items = [...items].sort((a, b) =>
          a.id === pacienteActualId ? -1 : b.id === pacienteActualId ? 1 : 0,
        );
      }
      setPacientes(items);
    });
    seleccionarPaciente(pacienteActualId);
  }, [open, pacienteActualId, pacienteActualNombre, seleccionarPaciente]);

  // Escape para cerrar (salvaguarda contra overlays bloqueados)
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const diaLabel = (dia: string) =>
    (t(`editor.dayLabels.${dia}` as never) as string) || dia;
  const tipoLabel = (tipo: string) =>
    (t(`comidaSlot.tipoLabels.${tipo}` as never) as string) || tipo;

  const pacientesFiltrados = pacientes.filter((p) =>
    `${p.nombre} ${p.apellidos}`.toLowerCase().includes(busquedaPac.trim().toLowerCase()),
  );

  const puedeAvanzar3 =
    (tipoImport === "dia" && !!diaOrigenSel) || (tipoImport === "comida" && !!comidaOrigenSel);

  async function handleImportar() {
    if (importing || seleccionDestino.length === 0) return;
    setImporting(true);
    try {
      if (tipoImport === "dia" && diaOrigenSel) {
        await copiarDiaADias(diaOrigenSel, seleccionDestino, modo);
      } else if (tipoImport === "comida" && comidaOrigenSel) {
        await copiarComidaADias(comidaOrigenSel, seleccionDestino, modo);
      } else {
        setImporting(false);
        return;
      }
      onImported();
      onClose();
    } catch (e) {
      if (isNextNavigation(e)) throw e;
      toast.error(t("copiar.toastCopiarError"));
    } finally {
      setImporting(false);
    }
  }

  const tituloPaso =
    step === 1
      ? t("copiar.importPaso1")
      : step === 2
        ? t("copiar.importPaso2")
        : step === 3
          ? t("copiar.importPaso3")
          : t("copiar.importPaso4");

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4">
      <div className="bg-card rounded-t-xl sm:rounded-xl border border-border shadow-xl w-full sm:max-w-md max-h-[90dvh] sm:max-h-[85vh] flex flex-col pb-safe sm:pb-0">
        {/* Header */}
        <div className="flex items-center gap-2 p-4 border-b border-border">
          {step > 1 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              aria-label={t("copiar.atras")}
              className="p-1.5 hover:bg-muted rounded transition-colors shrink-0"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-muted-foreground">{t("copiar.importTitulo")}</p>
            <h3 className="font-semibold truncate text-sm">{tituloPaso}</h3>
          </div>
          <button
            onClick={onClose}
            aria-label={t("copiar.cancelar")}
            className="p-2 hover:bg-muted rounded transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* Paso 1 — paciente */}
          {step === 1 && (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={busquedaPac}
                  onChange={(e) => setBusquedaPac(e.target.value)}
                  placeholder={t("copiar.buscarPaciente")}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                />
              </div>
              {pacientesFiltrados.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    seleccionarPaciente(p.id);
                    setStep(2);
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm text-left transition-colors",
                    pacienteSel === p.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:bg-muted",
                  )}
                >
                  <span className="truncate font-medium">
                    {p.nombre} {p.apellidos}
                  </span>
                  {p.id === pacienteActualId && (
                    <span className="ml-auto text-[10px] text-muted-foreground italic shrink-0">
                      {t("copiar.pacienteActual")}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Paso 2 — plan */}
          {step === 2 && (
            <div className="space-y-2">
              {loadingPlanes ? (
                <p className="text-sm text-muted-foreground text-center py-6 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> {t("copiar.cargando")}
                </p>
              ) : planes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  {t("copiar.importSinPlanes")}
                </p>
              ) : (
                planes.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      seleccionarPlan(p.id);
                      setStep(3);
                    }}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm text-left transition-colors",
                      planSel === p.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:bg-muted",
                    )}
                  >
                    <span className="truncate font-medium">{p.nombre}</span>
                    {p.activo && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 shrink-0">
                        {t("copiar.planActivo")}
                      </span>
                    )}
                    <span className="ml-auto text-[10px] text-muted-foreground shrink-0 tabular-nums">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Paso 3 — qué traer */}
          {step === 3 && (
            <div className="space-y-3">
              {/* Toggle día / comida */}
              <div className="grid grid-cols-2 gap-1.5">
                {([
                  { id: "dia" as const, label: t("copiar.importDiaCompleto"), icon: CalendarDays },
                  { id: "comida" as const, label: t("copiar.importUnaComida"), icon: UtensilsCrossed },
                ]).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setTipoImport(opt.id);
                      setDiaOrigenSel(null);
                      setComidaOrigenSel(null);
                    }}
                    className={cn(
                      "flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors",
                      tipoImport === opt.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:bg-muted text-foreground",
                    )}
                  >
                    <opt.icon className="w-4 h-4" />
                    {opt.label}
                  </button>
                ))}
              </div>

              {loadingDetalle ? (
                <p className="text-sm text-muted-foreground text-center py-6 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> {t("copiar.cargando")}
                </p>
              ) : !detalle ? null : tipoImport === "dia" ? (
                <div className="space-y-1.5">
                  {detalle.dias.map((d) => {
                    const total = d.comidas.reduce((s, c) => s + c.numAlimentos, 0);
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setDiaOrigenSel(d.id)}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm text-left transition-colors",
                          diaOrigenSel === d.id
                            ? "border-primary bg-primary/10"
                            : "border-border hover:bg-muted",
                        )}
                      >
                        <span className="font-medium">{diaLabel(d.dia)}</span>
                        <span className="ml-auto text-[11px] text-muted-foreground shrink-0">
                          {total === 0
                            ? t("copiar.vacio")
                            : t("copiar.alimentosCount", { n: total })}
                        </span>
                        {diaOrigenSel === d.id && (
                          <Check className="w-4 h-4 text-primary shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-3">
                  {detalle.dias.map((d) => {
                    const comidasConContenido = d.comidas.filter((c) => c.numAlimentos > 0);
                    if (comidasConContenido.length === 0) return null;
                    return (
                      <div key={d.id}>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">
                          {diaLabel(d.dia)}
                        </p>
                        <div className="space-y-1.5">
                          {comidasConContenido.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => setComidaOrigenSel(c.id)}
                              className={cn(
                                "w-full px-3 py-2 rounded-lg border text-left transition-colors",
                                comidaOrigenSel === c.id
                                  ? "border-primary bg-primary/10"
                                  : "border-border hover:bg-muted",
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{tipoLabel(c.tipo)}</span>
                                <span className="ml-auto text-[11px] text-muted-foreground shrink-0">
                                  {t("copiar.alimentosCount", { n: c.numAlimentos })}
                                </span>
                                {comidaOrigenSel === c.id && (
                                  <Check className="w-4 h-4 text-primary shrink-0" />
                                )}
                              </div>
                              {c.muestra.length > 0 && (
                                <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                                  {c.muestra.join(", ")}
                                </p>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {detalle.dias.every((d) => d.comidas.every((c) => c.numAlimentos === 0)) && (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      {t("copiar.importNada")}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Paso 4 — destino en el plan actual */}
          {step === 4 && (
            <SelectorDiasModo
              dias={diasDelPlanActual}
              seleccion={seleccionDestino}
              onSeleccionChange={setSeleccionDestino}
              modo={modo}
              onModoChange={setModo}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
          >
            {t("copiar.cancelar")}
          </button>
          {step === 3 && (
            <button
              type="button"
              disabled={!puedeAvanzar3}
              onClick={() => setStep(4)}
              className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("copiar.siguiente")}
            </button>
          )}
          {step === 4 && (
            <button
              type="button"
              disabled={seleccionDestino.length === 0 || importing}
              onClick={handleImportar}
              className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              {importing ? t("copiar.importando") : t("copiar.importar")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

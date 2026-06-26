"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  Copy,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import type { HorarioEntry } from "@/app/actions/paciente-auth";
import {
  type Bloque,
  CATEGORIAS,
  DIAS_KEYS,
  DIAS_CORTOS_KEYS,
  END_HOUR,
  MOBILE_PX_PER_HOUR,
  PLANTILLAS,
  PX_PER_HOUR,
  START_HOUR,
  TOTAL_HOURS,
  bloqueLayout,
  bloquesToEntries,
  entriesToBloques,
  getCategoria,
  gridHeightPx,
  horasPorCategoria,
  rangoHoras,
} from "./horario-utils";

interface Props {
  initialEntries: HorarioEntry[];
  onSave: (entries: HorarioEntry[]) => Promise<void>;
}

interface DraftBloque {
  id?: string; // presente si es edición
  dia: string;
  horaInicio: string;
  horaFin: string;
  actividad: string;
  color: string;
  nota?: string;
  repetirEn: string[]; // adicionales
}

function bloqueId(b: Bloque) {
  return `${b.dia}-${b.horaInicio}-${b.horaFin}`;
}

function bloquesOverlap(a: Bloque, b: Bloque): boolean {
  if (a.dia !== b.dia) return false;
  return !(a.horaFin <= b.horaInicio || b.horaFin <= a.horaInicio);
}

export function HorarioPaciente({ initialEntries, onSave }: Props) {
  const t = useTranslations("patients.horario");
  const [bloques, setBloques] = useState<Bloque[]>(() => entriesToBloques(initialEntries));
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<DraftBloque | null>(null);
  const [showPlantillas, setShowPlantillas] = useState(false);
  const [mobileDia, setMobileDia] = useState(() => {
    const dayIdx = new Date().getDay();
    return DIAS_KEYS[dayIdx === 0 ? 6 : dayIdx - 1];
  });

  useEffect(() => {
    setBloques(entriesToBloques(initialEntries));
    setDirty(false);
  }, [initialEntries]);

  const entries = useMemo(() => bloquesToEntries(bloques), [bloques]);
  const horasCat = useMemo(() => horasPorCategoria(entries), [entries]);
  const totalHoras = Object.values(horasCat).reduce((a, b) => a + b, 0);

  const bloquesPorDia = useMemo(() => {
    const m = new Map<string, Bloque[]>();
    for (const dia of DIAS_KEYS) m.set(dia, []);
    for (const b of bloques) m.get(b.dia)?.push(b);
    return m;
  }, [bloques]);

  const onCellClick = useCallback((dia: string, hora: string) => {
    const horaInt = parseInt(hora.split(":")[0], 10);
    setDraft({
      dia,
      horaInicio: hora,
      horaFin: String(horaInt + 1).padStart(2, "0") + ":00",
      actividad: "",
      color: "trabajo",
      nota: "",
      repetirEn: [],
    });
  }, []);

  const onBloqueClick = useCallback((b: Bloque) => {
    setDraft({
      id: bloqueId(b),
      dia: b.dia,
      horaInicio: b.horaInicio,
      horaFin: b.horaFin,
      actividad: b.actividad,
      color: b.color,
      nota: b.nota ?? "",
      repetirEn: [],
    });
  }, []);

  function closeDraft() {
    setDraft(null);
  }

  function saveDraft() {
    if (!draft) return;
    const { dia, horaInicio, horaFin, actividad, color, nota, repetirEn, id } = draft;
    if (!actividad.trim()) {
      toast.error(t("anadirNombreActividad"));
      return;
    }
    if (horaFin <= horaInicio) {
      toast.error(t("horaFinPosterior"));
      return;
    }

    const nuevos: Bloque[] = [
      {
        dia,
        horaInicio,
        horaFin,
        actividad: actividad.trim(),
        color,
        nota: nota?.trim() || undefined,
      },
      ...repetirEn
        .filter((d) => d !== dia)
        .map((d) => ({
          dia: d,
          horaInicio,
          horaFin,
          actividad: actividad.trim(),
          color,
          nota: nota?.trim() || undefined,
        })),
    ];

    setBloques((prev) => {
      // Quitar el bloque que estamos editando
      let resto = id ? prev.filter((b) => bloqueId(b) !== id) : prev.slice();
      // Quitar los que solapan con los nuevos (reemplazo simple)
      for (const nuevo of nuevos) {
        resto = resto.filter((b) => !bloquesOverlap(b, nuevo));
      }
      return [...resto, ...nuevos];
    });
    setDirty(true);
    closeDraft();
  }

  function deleteDraft() {
    if (!draft?.id) {
      closeDraft();
      return;
    }
    setBloques((prev) => prev.filter((b) => bloqueId(b) !== draft.id));
    setDirty(true);
    closeDraft();
  }

  function duplicarDia(origen: string) {
    const src = bloquesPorDia.get(origen) ?? [];
    if (src.length === 0) {
      toast.error(t("noHayActividadesEnDia", { dia: t(`dias.${origen}`) }));
      return;
    }
    setBloques((prev) => {
      // Quitar todo lo demás (lo reemplazamos con la copia del día origen)
      const resto = prev.filter((b) => b.dia === origen);
      const otrosDias = DIAS_KEYS.filter((d) => d !== origen);
      const copias: Bloque[] = [];
      for (const d of otrosDias) {
        for (const b of src) copias.push({ ...b, dia: d });
      }
      return [...resto, ...copias];
    });
    setDirty(true);
    toast.success(t("copiadoASemana", { dia: t(`dias.${origen}`) }));
  }

  function aplicarPlantilla(id: string) {
    const p = PLANTILLAS.find((x) => x.id === id);
    if (!p) return;
    setBloques(entriesToBloques(p.apply(t)));
    setDirty(true);
    setShowPlantillas(false);
    toast.success(t("plantillaAplicada", { label: t(p.labelKey) }));
  }

  function limpiarSemana() {
    if (bloques.length === 0) return;
    if (!confirm(t("vaciarSemanaConfirm"))) return;
    setBloques([]);
    setDirty(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(entries);
      toast.success(t("horarioGuardado"));
      setDirty(false);
    } catch {
      toast.error(t("errorAlGuardar"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {/* KPIs */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-4">
        {CATEGORIAS.map((c) => {
          const h = horasCat[c.id] ?? 0;
          const pct = totalHoras > 0 ? Math.round((h / totalHoras) * 100) : 0;
          const Icon = c.Icon;
          return (
            <div
              key={c.id}
              className={`rounded-xl border p-2.5 sm:p-3 flex items-center gap-2 sm:gap-2.5 ${c.kpiBg}`}
            >
              <span className={`inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-card border border-border ${c.accent} shrink-0`}>
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <p className="text-[9px] sm:text-[10px] uppercase tracking-wide text-muted-foreground font-medium leading-none truncate">
                  {t(c.labelKey)}
                </p>
                <p className="text-base sm:text-lg font-bold tabular-nums leading-tight">
                  {h}h
                </p>
                <p className="text-[9px] sm:text-[10px] text-muted-foreground leading-none">
                  {pct}%
                </p>
              </div>
            </div>
          );
        })}
        <button
          type="button"
          onClick={() => setShowPlantillas(true)}
          className="lg:hidden rounded-xl border border-dashed border-border p-2.5 flex items-center gap-2 hover:bg-muted/50 transition-colors animate-soft-pulse"
        >
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-card border border-border text-muted-foreground shrink-0">
            <Sparkles className="w-3.5 h-3.5" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <p className="text-[9px] uppercase tracking-wide text-muted-foreground font-medium leading-none">{t("plantilla")}</p>
            <p className="text-base font-bold leading-tight">{t("aplicar")}</p>
          </div>
        </button>
      </div>

      {/* Barra de acciones */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPlantillas(true)}
            className="hidden lg:inline-flex items-center gap-1.5 rounded-lg border border-border bg-card hover:bg-muted/50 px-3 h-9 text-xs font-medium transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {t("aplicarPlantilla")}
          </button>
          {bloques.length > 0 && (
            <button
              type="button"
              onClick={limpiarSemana}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-950/20 dark:hover:text-red-400 dark:hover:border-red-500/40 px-3 h-9 text-xs font-medium transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {t("vaciarSemana")}
            </button>
          )}
        </div>

        {dirty && (
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 px-4 h-9 text-xs font-semibold transition-colors"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            {t("guardarCambios")}
          </button>
        )}
      </div>

      {/* Grid semanal — móvil: 1 día con tabs, desktop: tabla completa */}

      {/* Selector de día — solo móvil */}
      <div className="flex gap-1 mb-3 lg:hidden">
        {DIAS_KEYS.map((diaKey) => (
          <button
            key={diaKey}
            type="button"
            onClick={() => setMobileDia(diaKey)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
              mobileDia === diaKey
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {t(`diasCortos.${diaKey}`)}
          </button>
        ))}
      </div>

      {/* Vista móvil — 1 día */}
      <div className="lg:hidden rounded-xl border border-border overflow-hidden bg-card">
        <div className="flex items-center justify-between bg-muted/30 border-b border-border px-3 py-1.5">
          <div>
            <div className="text-sm font-semibold">{t(`dias.${mobileDia}`)}</div>
            <div className="text-[10px] text-muted-foreground">
              {(bloquesPorDia.get(mobileDia) ?? []).length === 0
                ? t("sinActividades")
                : `${(bloquesPorDia.get(mobileDia) ?? []).length} ${(bloquesPorDia.get(mobileDia) ?? []).length > 1 ? t("actividades") : t("actividad")}`}
            </div>
          </div>
          <button
            type="button"
            onClick={() => duplicarDia(mobileDia)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title={t("copiarDiaASemana", { dia: t(`dias.${mobileDia}`) })}
          >
            <Copy className="w-3 h-3" />
            {t("copiar")}
          </button>
        </div>
        <div className="max-h-[40vh] overflow-y-auto">
          <div
            className="relative grid"
            style={{
              gridTemplateColumns: "42px 1fr",
              height: `${gridHeightPx(MOBILE_PX_PER_HOUR)}px`,
            }}
          >
            <div className="border-r border-border bg-muted/20">
              {rangoHoras().map((hora) => (
                <div
                  key={hora}
                  className="text-[10px] text-muted-foreground font-mono text-center border-b border-border/60 last:border-b-0 flex items-start justify-center pt-0.5"
                  style={{ height: `${MOBILE_PX_PER_HOUR}px` }}
                >
                  {hora}
                </div>
              ))}
            </div>
            <DiaColumna
              dia={mobileDia}
              bloques={bloquesPorDia.get(mobileDia) ?? []}
              onCellClick={onCellClick}
              onBloqueClick={onBloqueClick}
              pxPerHour={MOBILE_PX_PER_HOUR}
              t={t}
            />
          </div>
        </div>
        {bloques.length === 0 && (
          <div className="px-5 py-2.5 text-center text-xs text-muted-foreground border-t border-border bg-muted/20">
            {t("tocaParaAnadir")}
          </div>
        )}
      </div>

      {/* Vista desktop — tabla 7 días */}
      <div className="hidden lg:block rounded-xl border border-border overflow-hidden bg-card">
        <div className="overflow-x-auto touch-scroll-x">
          <div className="min-w-[760px]">
            <div
              className="grid bg-muted/30 border-b border-border"
              style={{ gridTemplateColumns: "56px repeat(7, minmax(0, 1fr))" }}
            >
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium text-center py-2 border-r border-border">
                {t("hora")}
              </div>
              {DIAS_KEYS.map((diaKey) => (
                <div
                  key={diaKey}
                  className="relative py-2 text-center border-r border-border last:border-r-0 group/dia"
                >
                  <div className="text-xs font-semibold">{t(`dias.${diaKey}`)}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {t(`diasCortos.${diaKey}`)}
                  </div>
                  <button
                    type="button"
                    onClick={() => duplicarDia(diaKey)}
                    aria-label={t("copiarDiaASemana", { dia: t(`dias.${diaKey}`) })}
                    className="absolute top-1 right-1 p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground opacity-0 group-hover/dia:opacity-100 transition-opacity"
                    title={t("copiarDiaASemana", { dia: t(`dias.${diaKey}`) })}
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            <div
              className="relative grid"
              style={{
                gridTemplateColumns: "56px repeat(7, minmax(0, 1fr))",
                height: `${gridHeightPx()}px`,
              }}
            >
              <div className="border-r border-border bg-muted/20">
                {rangoHoras().map((hora) => (
                  <div
                    key={hora}
                    className="text-[11px] text-muted-foreground font-mono text-center border-b border-border/60 last:border-b-0 flex items-start justify-center pt-1"
                    style={{ height: `${PX_PER_HOUR}px` }}
                  >
                    {hora}
                  </div>
                ))}
              </div>

              {DIAS_KEYS.map((diaKey) => (
                <DiaColumna
                  key={diaKey}
                  dia={diaKey}
                  bloques={bloquesPorDia.get(diaKey) ?? []}
                  onCellClick={onCellClick}
                  onBloqueClick={onBloqueClick}
                  t={t}
                />
              ))}
            </div>
          </div>
        </div>
        {bloques.length === 0 && (
          <div className="px-5 py-3 text-center text-xs text-muted-foreground border-t border-border bg-muted/20">
            {t("clickParaAnadir")}
          </div>
        )}
      </div>

      {/* Modal plantillas */}
      {showPlantillas && (
        <PlantillasModal
          onClose={() => setShowPlantillas(false)}
          onApply={aplicarPlantilla}
          t={t}
        />
      )}

      {/* Modal edición */}
      {draft && (
        <EditorModal
          draft={draft}
          onChange={setDraft}
          onSave={saveDraft}
          onDelete={deleteDraft}
          onClose={closeDraft}
          t={t}
        />
      )}
    </div>
  );
}

// ─── Columna de un día ───
function DiaColumna({
  dia,
  bloques,
  onCellClick,
  onBloqueClick,
  pxPerHour = PX_PER_HOUR,
  t,
}: {
  dia: string;
  bloques: Bloque[];
  onCellClick: (dia: string, hora: string) => void;
  onBloqueClick: (b: Bloque) => void;
  pxPerHour?: number;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  return (
    <div className="relative border-r border-border last:border-r-0">
      {/* Líneas horarias clickables */}
      {rangoHoras().map((hora) => (
        <button
          key={hora}
          type="button"
          onClick={() => onCellClick(dia, hora)}
          className="absolute left-0 right-0 border-b border-border/40 hover:bg-muted/40 transition-colors group/cell"
          style={{
            top: `${(parseInt(hora.split(":")[0], 10) - START_HOUR) * pxPerHour}px`,
            height: `${pxPerHour}px`,
          }}
          aria-label={t("anadirActividadAria", { dia: t(`dias.${dia}`), hora })}
        >
          <Plus className="w-3.5 h-3.5 text-muted-foreground/40 opacity-0 group-hover/cell:opacity-100 transition-opacity mx-auto" />
        </button>
      ))}

      {/* Bloques */}
      {bloques.map((b) => {
        const cat = getCategoria(b.color);
        const { top, height } = bloqueLayout(b, pxPerHour);
        const Icon = cat.Icon;
        const horas = parseInt(b.horaFin.split(":")[0], 10) - parseInt(b.horaInicio.split(":")[0], 10);
        return (
          <button
            key={`${b.dia}-${b.horaInicio}`}
            type="button"
            onClick={() => onBloqueClick(b)}
            className={`absolute left-0.5 right-0.5 rounded-md border text-left transition-all overflow-hidden cursor-pointer ${cat.block}`}
            style={{ top: `${top + 2}px`, height: `${height - 4}px` }}
          >
            <div className="px-1.5 py-0.5 flex flex-col gap-0 h-full">
              <div className="flex items-center gap-1 min-w-0">
                <Icon className="w-3 h-3 shrink-0" strokeWidth={2} />
                <span className="text-[10px] font-semibold truncate leading-tight">
                  {b.actividad}
                </span>
              </div>
              {height > 40 && (
                <span className="text-[9px] opacity-70 font-mono">
                  {b.horaInicio}–{b.horaFin}
                </span>
              )}
              {b.nota && height > 60 && (
                <span className="text-[9px] opacity-60 line-clamp-2">{b.nota}</span>
              )}
              {horas >= 2 && height <= 60 && !b.nota && (
                <span className="text-[9px] opacity-70">
                  {horas}h
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─── Modal de edición ───
function EditorModal({
  draft,
  onChange,
  onSave,
  onDelete,
  onClose,
  t,
}: {
  draft: DraftBloque;
  onChange: (d: DraftBloque) => void;
  onSave: () => void;
  onDelete: () => void;
  onClose: () => void;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 40);
  }, []);

  const horas = rangoHoras();
  const horaFinOptions = [
    ...horas,
    String(END_HOUR).padStart(2, "0") + ":00",
  ].filter((h) => h > draft.horaInicio);

  function toggleRepetir(d: string) {
    const has = draft.repetirEn.includes(d);
    onChange({
      ...draft,
      repetirEn: has ? draft.repetirEn.filter((x) => x !== d) : [...draft.repetirEn, d],
    });
  }

  const isEditing = !!draft.id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150">
      <div className="bg-card rounded-2xl border border-border shadow-xl max-w-md w-full p-5 animate-in zoom-in-95 slide-in-from-bottom-4 duration-200">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold">
              {isEditing ? t("editarActividad") : t("nuevaActividad")}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t(`dias.${draft.dia}`)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-muted text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nombre */}
        <div className="mb-3">
          <label className="block text-[11px] font-medium text-muted-foreground mb-1">
            {t("nombre")}
          </label>
          <input
            ref={inputRef}
            type="text"
            value={draft.actividad}
            onChange={(e) => onChange({ ...draft, actividad: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter" && draft.actividad.trim()) onSave();
            }}
            placeholder={t("nombrePlaceholder")}
            maxLength={80}
            className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Categoría */}
        <div className="mb-3">
          <label className="block text-[11px] font-medium text-muted-foreground mb-1.5">
            {t("categoria")}
          </label>
          <div className="grid grid-cols-5 gap-1.5">
            {CATEGORIAS.map((c) => {
              const Icon = c.Icon;
              const selected = draft.color === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onChange({ ...draft, color: c.id })}
                  className={`rounded-lg border p-2 flex flex-col items-center gap-1 transition-all ${
                    selected
                      ? `${c.block} ring-2 ring-offset-1 ring-offset-card ring-primary/30 scale-[1.02]`
                      : "bg-card hover:bg-muted/50 border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" strokeWidth={1.75} />
                  <span className="text-[10px] font-medium leading-none">{t(c.labelKey)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Horas */}
        <div className="mb-3 grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-medium text-muted-foreground mb-1">
              {t("desde")}
            </label>
            <select
              value={draft.horaInicio}
              onChange={(e) => {
                const ini = e.target.value;
                const fin =
                  draft.horaFin <= ini
                    ? String(parseInt(ini.split(":")[0], 10) + 1).padStart(2, "0") + ":00"
                    : draft.horaFin;
                onChange({ ...draft, horaInicio: ini, horaFin: fin });
              }}
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 tabular-nums"
            >
              {horas.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-muted-foreground mb-1">
              {t("hasta")}
            </label>
            <select
              value={draft.horaFin}
              onChange={(e) => onChange({ ...draft, horaFin: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 tabular-nums"
            >
              {horaFinOptions.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Repetir en */}
        {!isEditing && (
          <div className="mb-3">
            <label className="block text-[11px] font-medium text-muted-foreground mb-1.5">
              {t("repetirTambienEn")}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {DIAS_KEYS.filter((d) => d !== draft.dia).map((d) => {
                const active = draft.repetirEn.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleRepetir(d)}
                    className={`px-2.5 h-8 rounded-md border text-xs font-medium transition-colors ${
                      active
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card hover:bg-muted/50 border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t(`dias.${d}`).slice(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Nota — en las comidas se convierte en "¿qué sueles comer?" (sigue siendo opcional, mismo campo). */}
        <div className="mb-4">
          <label className="block text-[11px] font-medium text-muted-foreground mb-1">
            {draft.color === "comida" ? t("queSuelesComer") : t("notaOpcional")}
          </label>
          <input
            type="text"
            value={draft.nota ?? ""}
            onChange={(e) => onChange({ ...draft, nota: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter" && draft.actividad.trim()) onSave();
            }}
            placeholder={draft.color === "comida" ? t("queSuelesComerPlaceholder") : t("notaPlaceholder")}
            maxLength={200}
            className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-between gap-2">
          {isEditing ? (
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-500/40 dark:text-red-400 dark:hover:bg-red-950/30 text-xs font-medium transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {t("eliminar")}
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 h-9 rounded-lg border border-border hover:bg-muted text-xs font-medium transition-colors"
            >
              {t("cancelar")}
            </button>
            <button
              type="button"
              onClick={onSave}
              className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              {isEditing ? t("guardar") : t("anadir")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Modal de plantillas ───
function PlantillasModal({
  onClose,
  onApply,
  t,
}: {
  onClose: () => void;
  onApply: (id: string) => void;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150">
      <div className="bg-card rounded-2xl border border-border shadow-xl max-w-md w-full p-5 animate-in zoom-in-95 slide-in-from-bottom-4 duration-200">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold">{t("aplicarPlantillaTitulo")}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("reemplazaHorario")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-muted text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          {PLANTILLAS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onApply(p.id)}
              className="w-full text-left rounded-xl border border-border hover:border-primary hover:bg-primary/5 px-4 py-3 transition-colors"
            >
              <p className="text-sm font-semibold">{t(p.labelKey)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t(p.descripcionKey)}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

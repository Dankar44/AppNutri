"use client";

import { Fragment, type ElementType, type ReactNode } from "react";
import { Calendar, User, Link2, UtensilsCrossed, ClipboardList, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { FichaAccordion } from "./ficha-accordion";
import { FichaLabel, FichaInput, FichaTextarea, FichaSelect } from "./ficha-form-fields";
import { TimePicker } from "@/components/time-picker";
import {
  getSelectSiNoOcasion,
  getSelectEstadoCivil,
  getSelectFuncionIntestinal,
  getSelectCalidadSueno,
  getSelectTiposDieta,
  getSelectIngestaAgua,
  getSelectObjetivosClinicos,
  OPCION_VACIA,
  type FichaInformacionData,
  type TipoCampoAnamnesis,
} from "@/lib/ficha-informacion-types";
import {
  getBuiltin,
  parseCheckboxValue,
  serializeCheckboxValue,
  condicionCumplida,
  ESCALA_MAX,
  type EstructuraPlantilla,
  type SelectId,
  type CondicionVisibilidad,
} from "@/lib/anamnesis-plantillas";

const HORA_INPUT_CLS =
  "w-full h-10 rounded-lg border border-input bg-background px-3 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2";

const ICONO_SECCION: Record<string, ElementType> = {
  consulta: Calendar,
  personalSocial: User,
  clinica: Link2,
  alimentaria: UtensilsCrossed,
};

type TFunc = (key: string, values?: Record<string, string>) => string;

function opcionesPara(selectId: SelectId, t: TFunc): { value: string; label: string }[] {
  switch (selectId) {
    case "siNoOcasion": return getSelectSiNoOcasion(t);
    case "estadoCivil": return getSelectEstadoCivil(t);
    case "funcionIntestinal": return getSelectFuncionIntestinal(t);
    case "calidadSueno": return getSelectCalidadSueno(t);
    case "tiposDieta": return getSelectTiposDieta(t);
    case "ingestaAgua": return getSelectIngestaAgua(t);
    case "objetivosClinicos": return getSelectObjetivosClinicos(t);
    case "raza":
      return [
        { value: OPCION_VACIA, label: t("informacion.seleccionaOpcion") },
        { value: "caucasica", label: t("informacion.razaCaucasica") },
        { value: "hispana", label: t("informacion.razaHispana") },
        { value: "afrodescendiente", label: t("informacion.razaAfrodescendiente") },
        { value: "asiatica", label: t("informacion.razaAsiatica") },
        { value: "arabe", label: t("informacion.razaArabe") },
        { value: "indigena", label: t("informacion.razaIndigena") },
        { value: "mestiza", label: t("informacion.razaMestiza") },
        { value: "otra", label: t("informacion.razaOtra") },
      ];
    case "siNo":
      return [
        { value: OPCION_VACIA, label: t("informacionExtra.ninguna") },
        { value: "si", label: t("informacionExtra.siDetallar") },
      ];
  }
}

function detalleVisible(valor: string, visibleSi: string[]): boolean {
  if (visibleSi.length === 0) return !!valor && valor !== OPCION_VACIA;
  return visibleSi.includes(valor);
}

/** Pregunta de varias casillas: el valor se guarda como JSON array de las opciones marcadas. */
function CheckboxGroup({
  opciones,
  value,
  onChange,
}: {
  opciones: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const sel = parseCheckboxValue(value);
  function toggle(op: string) {
    const next = sel.includes(op) ? sel.filter((x) => x !== op) : [...sel, op];
    onChange(serializeCheckboxValue(next));
  }
  return (
    <div className="flex flex-wrap gap-2">
      {opciones.map((op) => {
        const on = sel.includes(op);
        return (
          <button
            type="button"
            key={op}
            onClick={() => toggle(op)}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors",
              on ? "border-primary bg-primary/10 text-foreground" : "border-input bg-background text-muted-foreground hover:bg-muted",
            )}
          >
            <span
              className={cn(
                "flex h-4 w-4 items-center justify-center rounded border",
                on ? "border-primary bg-primary text-primary-foreground" : "border-input",
              )}
            >
              {on && <Check className="h-3 w-3" />}
            </span>
            {op}
          </button>
        );
      })}
    </div>
  );
}

/** Pregunta de escala 1..ESCALA_MAX. El valor se guarda como el número elegido (string). */
function EscalaSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: ESCALA_MAX }, (_, i) => String(i + 1)).map((n) => {
        const on = value === n;
        return (
          <button
            type="button"
            key={n}
            onClick={() => onChange(on ? "" : n)}
            className={cn(
              "h-10 w-10 rounded-lg border text-sm font-semibold transition-colors",
              on ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background text-muted-foreground hover:bg-muted",
            )}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}

/** Pinta una pregunta propia (o una pregunta hija condicional) según su tipo: texto, área, desplegable,
 * casillas o escala. El valor vive en data.camposPersonalizados[pregunta.id]. */
function CampoCustom({
  pregunta,
  val,
  onChange,
}: {
  pregunta: { id: string; label: string; tipo: TipoCampoAnamnesis; opciones?: string[] };
  val: string;
  onChange: (v: string) => void;
}) {
  const tieneOpciones = !!pregunta.opciones && pregunta.opciones.length > 0;
  return (
    <div>
      <FichaLabel>{pregunta.label}</FichaLabel>
      {pregunta.tipo === "textarea" ? (
        <FichaTextarea value={val} onChange={onChange} rows={2} />
      ) : pregunta.tipo === "selector" && tieneOpciones ? (
        <FichaSelect
          value={val || OPCION_VACIA}
          onChange={onChange}
          options={[{ value: OPCION_VACIA, label: "—" }, ...pregunta.opciones!.map((o) => ({ value: o, label: o }))]}
        />
      ) : pregunta.tipo === "checkbox" && tieneOpciones ? (
        <CheckboxGroup opciones={pregunta.opciones!} value={val} onChange={onChange} />
      ) : pregunta.tipo === "escala" ? (
        <EscalaSelector value={val} onChange={onChange} />
      ) : (
        <FichaInput value={val} onChange={onChange} />
      )}
    </div>
  );
}

/**
 * Pinta una EstructuraPlantilla (secciones + preguntas fijas/propias) con sus valores.
 * - Las preguntas FIJAS leen/escriben su valor en data[seccionOriginal][campo] (no se pierde dato al reordenar).
 * - Las preguntas PROPIAS leen/escriben en data.camposPersonalizados[id].
 * - Cada pregunta puede tener una pregunta HIJA condicional que aparece según su respuesta.
 */
export function AnamnesisRenderer({
  estructura,
  data,
  onBuiltin,
  onCustom,
  modoNutri = false,
}: {
  estructura: EstructuraPlantilla;
  data: FichaInformacionData;
  onBuiltin: (seccion: string, campo: string, value: string) => void;
  onCustom: (id: string, value: string) => void;
  /** Vista del nutricionista: muestra SIEMPRE las preguntas condicionales (marcadas), aunque no se cumpla
   * la condición. En la vista del paciente (false) se ocultan hasta cumplirse. */
  modoNutri?: boolean;
}) {
  const t = useTranslations("patients");
  const cp = data.camposPersonalizados ?? {};

  const valBuiltin = (seccion: string, campo: string): string => {
    const sec = (data as unknown as Record<string, Record<string, string> | undefined>)[seccion];
    return sec?.[campo] ?? "";
  };

  // Valor actual de una pregunta (propia o fija), para evaluar su condición.
  const valorDePregunta = (p: EstructuraPlantilla["secciones"][number]["preguntas"][number]): string => {
    if (p.kind === "custom") return cp[p.id] ?? "";
    const bb = getBuiltin(p.ref);
    return bb ? valBuiltin(bb.seccion, bb.id) : "";
  };

  // Texto (solo vista nutri) que explica cuándo verá el paciente una pregunta condicional.
  const infoCondTexto = (
    cond: CondicionVisibilidad,
    madre: EstructuraPlantilla["secciones"][number]["preguntas"][number],
  ): string => {
    if (cond.valores.length === 0) return t("informacion.condicionalSiResponde");
    let labels = cond.valores;
    if (madre.kind === "builtin") {
      const bb = getBuiltin(madre.ref);
      if (bb?.input === "selector" && bb.selectId) {
        const opts = opcionesPara(bb.selectId, t);
        labels = cond.valores.map((v) => opts.find((o) => o.value === v)?.label ?? v);
      }
    }
    return t("informacion.condicionalSiValores", { valores: labels.join(", ") });
  };

  return (
    <div className="space-y-1">
      {estructura.secciones.map((seccion) => {
        const titulo = seccion.titulo ? seccion.titulo : seccion.tituloKey ? t(seccion.tituloKey) : "";
        const Icono = ICONO_SECCION[seccion.id] ?? ClipboardList;
        if (seccion.preguntas.length === 0) return null;
        return (
          <FichaAccordion key={seccion.id} title={titulo} icon={Icono}>
            {seccion.preguntas.map((pregunta) => {
              // Pregunta hija condicional. El nutri la ve SIEMPRE (marcada); el paciente solo si se cumple.
              const cond = pregunta.condicion;
              let hija: ReactNode = null;
              if (cond && modoNutri) {
                hija = (
                  <div className="rounded-lg border-l-2 border-primary/40 bg-primary/[0.04] pl-3 pr-2 py-2 space-y-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-primary/80">
                      {t("informacion.condicionalBadge")}
                      <span className="ml-1 font-normal normal-case text-muted-foreground">· {infoCondTexto(cond, pregunta)}</span>
                    </p>
                    <CampoCustom
                      pregunta={cond.pregunta}
                      val={cp[cond.pregunta.id] ?? ""}
                      onChange={(v) => onCustom(cond.pregunta.id, v)}
                    />
                  </div>
                );
              } else if (cond && condicionCumplida(cond, valorDePregunta(pregunta))) {
                hija = (
                  <CampoCustom
                    pregunta={cond.pregunta}
                    val={cp[cond.pregunta.id] ?? ""}
                    onChange={(v) => onCustom(cond.pregunta.id, v)}
                  />
                );
              }

              // --- Pregunta propia (custom) ---
              if (pregunta.kind === "custom") {
                return (
                  <Fragment key={pregunta.id}>
                    <CampoCustom pregunta={pregunta} val={cp[pregunta.id] ?? ""} onChange={(v) => onCustom(pregunta.id, v)} />
                    {hija}
                  </Fragment>
                );
              }

              // --- Pregunta fija (builtin) ---
              const b = getBuiltin(pregunta.ref);
              if (!b) return null;
              const val = valBuiltin(b.seccion, b.id);
              const label = pregunta.labelOverride || t(b.labelKey);
              return (
                <Fragment key={`${seccion.id}:${b.id}`}>
                  <div>
                    <FichaLabel>{label}</FichaLabel>
                    {b.input === "textarea" ? (
                      <FichaTextarea value={val} onChange={(v) => onBuiltin(b.seccion, b.id, v)} rows={2} />
                    ) : b.input === "hora" ? (
                      <TimePicker value={val} onChange={(v) => onBuiltin(b.seccion, b.id, v)} inputClassName={HORA_INPUT_CLS} ariaLabel={label} />
                    ) : b.input === "selector" && b.selectId ? (
                      <>
                        <FichaSelect
                          value={val || OPCION_VACIA}
                          onChange={(v) => onBuiltin(b.seccion, b.id, v)}
                          options={opcionesPara(b.selectId, t)}
                        />
                        {b.detalle && detalleVisible(val, b.detalle.visibleSi) && (
                          <div className="mt-2">
                            <FichaTextarea
                              value={valBuiltin(b.seccion, b.detalle.campo)}
                              onChange={(v) => onBuiltin(b.seccion, b.detalle!.campo, v)}
                              rows={2}
                              placeholder={b.detalle.placeholderKey ? t(b.detalle.placeholderKey) : undefined}
                            />
                          </div>
                        )}
                      </>
                    ) : (
                      <FichaInput value={val} onChange={(v) => onBuiltin(b.seccion, b.id, v)} />
                    )}
                  </div>
                  {hija}
                </Fragment>
              );
            })}
          </FichaAccordion>
        );
      })}
    </div>
  );
}

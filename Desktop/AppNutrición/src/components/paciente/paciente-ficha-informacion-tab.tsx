"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Calendar,
  User,
  Link2,
  UtensilsCrossed,
  Save,
  Printer,
  ClipboardList,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import type { FichaInformacionData } from "@/lib/ficha-informacion-types";
import {
  SELECT_SI_NO_OCASION,
  SELECT_ESTADO_CIVIL,
  SELECT_FUNCION_INTESTINAL,
  SELECT_CALIDAD_SUENO,
  SELECT_TIPOS_DIETA,
  SELECT_INGESTA_AGUA,
  SELECT_OBJETIVOS_CLINICOS,
  OPCION_VACIA,
} from "@/lib/ficha-informacion-types";
import { guardarFichaInformacionPaciente } from "@/app/actions/pacientes";
import { enviarCuestionarioPaciente } from "@/app/actions/email";
import { FichaAccordion } from "./ficha-accordion";
import {
  FichaLabel,
  FichaTextarea,
  FichaInput,
  FichaSelect,
  FichaTwoCol,
} from "./ficha-form-fields";

type PacienteResumen = {
  patologias: string[];
  medicamentos: string[];
  alergias: string[];
  intolerancias: string[];
  objetivo: string | null;
  objetivoDetalle: string | null;
};

const OBJETIVO_MAP: Record<string, string> = {
  PERDER_PESO: "control_peso",
  PATOLOGIA: "patologia",
  DEPORTIVO: "deportivo",
  OTRO: "otro",
};

function emptyFicha(): FichaInformacionData {
  return {
    consulta: {},
    personalSocial: {},
    clinica: {},
    alimentaria: {},
  };
}

function mergeInitial(
  raw: FichaInformacionData | null | undefined,
  resumen: PacienteResumen
): FichaInformacionData {
  const e = emptyFicha();
  const merged = !raw || typeof raw !== "object"
    ? e
    : {
        consulta: { ...e.consulta, ...raw.consulta },
        personalSocial: { ...e.personalSocial, ...raw.personalSocial },
        clinica: { ...e.clinica, ...raw.clinica },
        alimentaria: { ...e.alimentaria, ...raw.alimentaria },
      };

  // Auto-rellenar campos vacíos con datos del paciente
  const c = merged.consulta!;
  if (!c.objetivosClinicos && resumen.objetivo) {
    c.objetivosClinicos = OBJETIVO_MAP[resumen.objetivo] || "";
  }
  if (!c.objetivosClinicosDetalle && resumen.objetivoDetalle) {
    c.objetivosClinicosDetalle = resumen.objetivoDetalle;
  }

  const cl = merged.clinica!;
  if (!cl.patologiasDetalle && resumen.patologias.length > 0) {
    cl.patologiasDetalle = resumen.patologias.join(", ");
  }
  if (!cl.medicacion && resumen.medicamentos.length > 0) {
    cl.medicacion = resumen.medicamentos.join(", ");
  }

  const al = merged.alimentaria!;
  if (!al.alergiasResumen && resumen.alergias.length > 0) {
    al.alergiasResumen = "si";
    if (!al.alergiasDetalle) al.alergiasDetalle = resumen.alergias.join(", ");
  }
  if (!al.intoleranciasResumen && resumen.intolerancias.length > 0) {
    al.intoleranciasResumen = "si";
    if (!al.intoleranciasDetalle) al.intoleranciasDetalle = resumen.intolerancias.join(", ");
  }

  return merged;
}

function patch<K extends keyof FichaInformacionData>(
  prev: FichaInformacionData,
  section: K,
  key: string,
  value: string
): FichaInformacionData {
  const sec = (prev[section] as Record<string, string>) || {};
  return {
    ...prev,
    [section]: { ...sec, [key]: value },
  };
}

type SaveStatus = "saved" | "unsaved" | "saving";

export function PacienteFichaInformacionTab({
  pacienteId,
  pacienteEmail,
  initialFicha,
  resumen,
}: {
  pacienteId: string;
  pacienteEmail: string | null;
  initialFicha: FichaInformacionData | null | undefined;
  resumen: PacienteResumen;
}) {
  const [data, setData] = useState(() => mergeInitial(initialFicha, resumen));
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [showEnviarModal, setShowEnviarModal] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const dataRef = useRef(data);
  dataRef.current = data;
  const savedRef = useRef(JSON.stringify(mergeInitial(initialFicha, resumen)));
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const savingRef = useRef(false);

  const doSave = useCallback(
    async (dataToSave: FichaInformacionData) => {
      if (savingRef.current) return;
      const json = JSON.stringify(dataToSave);
      if (json === savedRef.current) return;

      savingRef.current = true;
      setSaveStatus("saving");
      try {
        await guardarFichaInformacionPaciente(pacienteId, dataToSave);
        savedRef.current = json;
        if (JSON.stringify(dataRef.current) === json) {
          setSaveStatus("saved");
        } else {
          setSaveStatus("unsaved");
        }
      } catch {
        toast.error("No se pudo guardar");
        setSaveStatus("unsaved");
      } finally {
        savingRef.current = false;
      }
    },
    [pacienteId]
  );

  // Auto-save con debounce de 2 segundos
  useEffect(() => {
    const current = JSON.stringify(data);
    if (current === savedRef.current) {
      setSaveStatus("saved");
      return;
    }
    setSaveStatus("unsaved");

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      doSave(data);
    }, 2000);

    return () => clearTimeout(timerRef.current);
  }, [data, doSave]);

  // Guardar al desmontar (cambio de pestaña)
  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current);
      const current = JSON.stringify(dataRef.current);
      if (current !== savedRef.current) {
        guardarFichaInformacionPaciente(pacienteId, dataRef.current).catch(
          () => {}
        );
      }
    };
  }, [pacienteId]);

  // Advertir al cerrar pestaña del navegador
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (JSON.stringify(dataRef.current) !== savedRef.current) {
        e.preventDefault();
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  function setField<K extends keyof FichaInformacionData>(
    section: K,
    key: string,
    value: string
  ) {
    setData((d) => patch(d, section, key, value));
  }

  function guardarManual() {
    clearTimeout(timerRef.current);
    doSave(data);
  }

  async function handleEnviarCuestionario() {
    if (!pacienteEmail) {
      toast.error("El paciente no tiene email registrado");
      return;
    }
    // Guardar primero si hay cambios pendientes
    if (saveStatus === "unsaved") {
      await doSave(data);
    }
    setEnviando(true);
    try {
      const result = await enviarCuestionarioPaciente(pacienteId, data);
      if (result.ok) {
        toast.success("Cuestionario enviado", {
          description: `Se ha enviado a ${pacienteEmail}`,
        });
        setShowEnviarModal(false);
      } else {
        toast.error(result.error || "No se pudo enviar");
      }
    } catch {
      toast.error("Error al enviar el cuestionario");
    } finally {
      setEnviando(false);
    }
  }

  const c = data.consulta ?? {};
  const ps = data.personalSocial ?? {};
  const cl = data.clinica ?? {};
  const al = data.alimentaria ?? {};

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 mb-2 border-b border-border">
        <button
          type="button"
          onClick={() => {
            if (!pacienteEmail) {
              toast.error("Registra un email para este paciente antes de enviar");
              return;
            }
            setShowEnviarModal(true);
          }}
          className="inline-flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors w-fit"
        >
          <ClipboardList className="w-4 h-4" />
          Enviar cuestionario
        </button>
        <div className="flex items-center gap-3">
          <SaveStatusBadge status={saveStatus} />
          <button
            type="button"
            onClick={guardarManual}
            disabled={saveStatus === "saving"}
            className="p-2 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50"
            title="Guardar ahora"
          >
            <Save className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="p-2 rounded-lg border border-border hover:bg-muted transition-colors"
            title="Imprimir"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-1">
        {/* ── Informaciones de consulta ── */}
        <FichaAccordion title="Informaciones de consulta" icon={Calendar}>
          <div>
            <FichaLabel>Motivo de consulta</FichaLabel>
            <FichaTextarea
              value={c.motivo ?? ""}
              onChange={(v) => setField("consulta", "motivo", v)}
              rows={2}
            />
          </div>
          <div>
            <FichaLabel>Expectativas</FichaLabel>
            <FichaTextarea
              value={c.expectativas ?? ""}
              onChange={(v) => setField("consulta", "expectativas", v)}
              rows={2}
            />
          </div>
          <div>
            <FichaLabel>Objetivos clínicos</FichaLabel>
            <FichaSelect
              value={c.objetivosClinicos || OPCION_VACIA}
              onChange={(v) => setField("consulta", "objetivosClinicos", v)}
              options={SELECT_OBJETIVOS_CLINICOS}
            />
            {c.objetivosClinicos && c.objetivosClinicos !== OPCION_VACIA && (
              <div className="mt-2">
                <FichaTextarea
                  value={c.objetivosClinicosDetalle ?? ""}
                  onChange={(v) =>
                    setField("consulta", "objetivosClinicosDetalle", v)
                  }
                  rows={2}
                  placeholder="Detalla el objetivo..."
                />
              </div>
            )}
          </div>
          <div>
            <FichaLabel>Otras informaciones</FichaLabel>
            <FichaTextarea
              value={c.otras ?? ""}
              onChange={(v) => setField("consulta", "otras", v)}
              rows={2}
            />
          </div>
        </FichaAccordion>

        {/* ── Historia personal y social ── */}
        <FichaAccordion title="Historia personal y social" icon={User}>
          <div>
            <FichaLabel>Función intestinal</FichaLabel>
            <FichaSelect
              value={ps.funcionIntestinal || OPCION_VACIA}
              onChange={(v) => setField("personalSocial", "funcionIntestinal", v)}
              options={SELECT_FUNCION_INTESTINAL}
            />
            {ps.funcionIntestinal === "otro" && (
              <div className="mt-2">
                <FichaTextarea
                  value={ps.funcionIntestinalDetalle ?? ""}
                  onChange={(v) =>
                    setField("personalSocial", "funcionIntestinalDetalle", v)
                  }
                  rows={2}
                  placeholder="Especifica..."
                />
              </div>
            )}
          </div>
          <div>
            <FichaLabel>Calidad del sueño</FichaLabel>
            <FichaSelect
              value={ps.calidadSueno || OPCION_VACIA}
              onChange={(v) => setField("personalSocial", "calidadSueno", v)}
              options={SELECT_CALIDAD_SUENO}
            />
            {(ps.calidadSueno === "regular" || ps.calidadSueno === "mala") && (
              <div className="mt-2">
                <FichaTextarea
                  value={ps.calidadSuenoDetalle ?? ""}
                  onChange={(v) =>
                    setField("personalSocial", "calidadSuenoDetalle", v)
                  }
                  rows={2}
                  placeholder="Describe el problema de sueño..."
                />
              </div>
            )}
          </div>
          <div>
            <FichaLabel>Fumador</FichaLabel>
            <FichaSelect
              value={ps.fumador || OPCION_VACIA}
              onChange={(v) => setField("personalSocial", "fumador", v)}
              options={SELECT_SI_NO_OCASION}
            />
            {(ps.fumador === "si" || ps.fumador === "ocasional") && (
              <div className="mt-2">
                <FichaTextarea
                  value={ps.fumadorDetalle ?? ""}
                  onChange={(v) => setField("personalSocial", "fumadorDetalle", v)}
                  rows={2}
                  placeholder="Frecuencia, cantidad..."
                />
              </div>
            )}
          </div>
          <div>
            <FichaLabel>Bebe alcohol</FichaLabel>
            <FichaSelect
              value={ps.alcohol || OPCION_VACIA}
              onChange={(v) => setField("personalSocial", "alcohol", v)}
              options={SELECT_SI_NO_OCASION}
            />
            {(ps.alcohol === "si" || ps.alcohol === "ocasional") && (
              <div className="mt-2">
                <FichaTextarea
                  value={ps.alcoholDetalle ?? ""}
                  onChange={(v) => setField("personalSocial", "alcoholDetalle", v)}
                  rows={2}
                  placeholder="Frecuencia, tipo de bebida..."
                />
              </div>
            )}
          </div>
          <div>
            <FichaLabel>Estado civil</FichaLabel>
            <FichaSelect
              value={ps.estadoCivil || OPCION_VACIA}
              onChange={(v) => setField("personalSocial", "estadoCivil", v)}
              options={SELECT_ESTADO_CIVIL}
            />
            {ps.estadoCivil === "otro" && (
              <div className="mt-2">
                <FichaTextarea
                  value={ps.estadoCivilDetalle ?? ""}
                  onChange={(v) =>
                    setField("personalSocial", "estadoCivilDetalle", v)
                  }
                  rows={2}
                  placeholder="Especifica..."
                />
              </div>
            )}
          </div>
          <div>
            <FichaLabel>Actividad física</FichaLabel>
            <FichaTextarea
              value={ps.actividadFisica ?? ""}
              onChange={(v) => setField("personalSocial", "actividadFisica", v)}
              rows={2}
            />
          </div>
          <div>
            <FichaLabel>Raza / etnia</FichaLabel>
            <FichaSelect
              value={ps.raza || OPCION_VACIA}
              onChange={(v) => setField("personalSocial", "raza", v)}
              options={[
                { value: OPCION_VACIA, label: "Selecciona una opción" },
                { value: "caucasica", label: "Caucásica" },
                { value: "hispana", label: "Hispana / Latina" },
                { value: "afrodescendiente", label: "Afrodescendiente" },
                { value: "asiatica", label: "Asiática" },
                { value: "arabe", label: "Árabe / Norteafricana" },
                { value: "indigena", label: "Indígena" },
                { value: "mestiza", label: "Mestiza" },
                { value: "no_indica", label: "Prefiere no indicar" },
                { value: "otra", label: "Otra" },
              ]}
            />
            {ps.raza === "otra" && (
              <div className="mt-2">
                <FichaInput
                  value={ps.razaDetalle ?? ""}
                  onChange={(v) => setField("personalSocial", "razaDetalle", v)}
                  placeholder="Especifica..."
                />
              </div>
            )}
          </div>
          <div>
            <FichaLabel>Otras informaciones</FichaLabel>
            <FichaTextarea
              value={ps.otrasPersonal ?? ""}
              onChange={(v) => setField("personalSocial", "otrasPersonal", v)}
              rows={2}
            />
          </div>
        </FichaAccordion>

        {/* ── Historia clínica ── */}
        <FichaAccordion title="Historia clínica" icon={Link2}>
          <div className="rounded-lg bg-muted/40 border border-border/60 p-3 mb-3 text-sm">
            <p className="font-medium text-foreground mb-2">
              Registrado en la ficha del paciente
            </p>
            <TagLine label="Patologías" tags={resumen.patologias} />
            <TagLine label="Medicación" tags={resumen.medicamentos} />
            <p className="text-xs text-muted-foreground mt-2">
              Para editar listas completas usa{" "}
              <span className="font-medium text-foreground">Editar paciente</span>.
            </p>
          </div>
          <div>
            <FichaLabel>Detalle patologías / evolución</FichaLabel>
            <FichaTextarea
              value={cl.patologiasDetalle ?? ""}
              onChange={(v) => setField("clinica", "patologiasDetalle", v)}
              rows={3}
            />
          </div>
          <div>
            <FichaLabel>Medicación (texto libre)</FichaLabel>
            <FichaTextarea
              value={cl.medicacion ?? ""}
              onChange={(v) => setField("clinica", "medicacion", v)}
              rows={2}
              placeholder="Ninguna"
            />
          </div>
          <FichaTwoCol
            left={
              <div>
                <FichaLabel>Antecedentes personales</FichaLabel>
                <FichaInput
                  value={cl.antecedentesPersonales ?? ""}
                  onChange={(v) =>
                    setField("clinica", "antecedentesPersonales", v)
                  }
                  placeholder="Ninguno"
                />
              </div>
            }
            right={
              <div>
                <FichaLabel>Antecedentes familiares</FichaLabel>
                <FichaInput
                  value={cl.antecedentesFamiliares ?? ""}
                  onChange={(v) =>
                    setField("clinica", "antecedentesFamiliares", v)
                  }
                  placeholder="Ninguno"
                />
              </div>
            }
          />
          <div>
            <FichaLabel>Otras informaciones</FichaLabel>
            <FichaTextarea
              value={cl.otrasClinicas ?? ""}
              onChange={(v) => setField("clinica", "otrasClinicas", v)}
              rows={2}
            />
          </div>
        </FichaAccordion>

        {/* ── Historia alimentaria ── */}
        <FichaAccordion title="Historia alimentaria" icon={UtensilsCrossed}>
          <div className="rounded-lg bg-muted/40 border border-border/60 p-3 mb-3 text-sm">
            <TagLine label="Alergias" tags={resumen.alergias} />
            <TagLine label="Intolerancias" tags={resumen.intolerancias} />
          </div>
          <FichaTwoCol
            left={
              <div>
                <FichaLabel>Hora habitual para levantarse</FichaLabel>
                <FichaInput
                  value={al.horaLevantarse ?? ""}
                  onChange={(v) => setField("alimentaria", "horaLevantarse", v)}
                  placeholder="HH:MM"
                />
              </div>
            }
            right={
              <div>
                <FichaLabel>Hora habitual para acostarse</FichaLabel>
                <FichaInput
                  value={al.horaAcostarse ?? ""}
                  onChange={(v) => setField("alimentaria", "horaAcostarse", v)}
                  placeholder="HH:MM"
                />
              </div>
            }
          />
          <div>
            <FichaLabel>Tipos de dieta</FichaLabel>
            <FichaSelect
              value={al.tiposDieta || OPCION_VACIA}
              onChange={(v) => setField("alimentaria", "tiposDieta", v)}
              options={SELECT_TIPOS_DIETA}
            />
            {al.tiposDieta === "otra" && (
              <div className="mt-2">
                <FichaTextarea
                  value={al.tiposDietaDetalle ?? ""}
                  onChange={(v) => setField("alimentaria", "tiposDietaDetalle", v)}
                  rows={2}
                  placeholder="Describe el tipo de dieta..."
                />
              </div>
            )}
          </div>
          <div>
            <FichaLabel>Alimentos favoritos</FichaLabel>
            <FichaInput
              value={al.alimentosFavoritos ?? ""}
              onChange={(v) => setField("alimentaria", "alimentosFavoritos", v)}
              placeholder="Ninguno"
            />
          </div>
          <div>
            <FichaLabel>Alimentos rechazados</FichaLabel>
            <FichaInput
              value={al.alimentosRechazados ?? ""}
              onChange={(v) =>
                setField("alimentaria", "alimentosRechazados", v)
              }
              placeholder="Ninguno"
            />
          </div>
          <div>
            <FichaLabel>Alergias</FichaLabel>
            <FichaSelect
              value={al.alergiasResumen || OPCION_VACIA}
              onChange={(v) => setField("alimentaria", "alergiasResumen", v)}
              options={[
                { value: OPCION_VACIA, label: "Ninguna" },
                { value: "si", label: "Sí (detallar)" },
              ]}
            />
            {al.alergiasResumen === "si" && (
              <div className="mt-2">
                <FichaTextarea
                  value={al.alergiasDetalle ?? ""}
                  onChange={(v) => setField("alimentaria", "alergiasDetalle", v)}
                  rows={2}
                  placeholder="Detalla las alergias..."
                />
              </div>
            )}
          </div>
          <div>
            <FichaLabel>Intolerancias alimentarias</FichaLabel>
            <FichaSelect
              value={al.intoleranciasResumen || OPCION_VACIA}
              onChange={(v) => setField("alimentaria", "intoleranciasResumen", v)}
              options={[
                { value: OPCION_VACIA, label: "Ninguna" },
                { value: "si", label: "Sí (detallar)" },
              ]}
            />
            {al.intoleranciasResumen === "si" && (
              <div className="mt-2">
                <FichaTextarea
                  value={al.intoleranciasDetalle ?? ""}
                  onChange={(v) =>
                    setField("alimentaria", "intoleranciasDetalle", v)
                  }
                  rows={2}
                  placeholder="Detalla las intolerancias..."
                />
              </div>
            )}
          </div>
          <div>
            <FichaLabel>Deficiencias nutricionales</FichaLabel>
            <FichaSelect
              value={al.deficiencias || OPCION_VACIA}
              onChange={(v) => setField("alimentaria", "deficiencias", v)}
              options={[
                { value: OPCION_VACIA, label: "Ninguna" },
                { value: "si", label: "Sí (detallar)" },
              ]}
            />
            {al.deficiencias === "si" && (
              <div className="mt-2">
                <FichaTextarea
                  value={al.deficienciasDetalle ?? ""}
                  onChange={(v) =>
                    setField("alimentaria", "deficienciasDetalle", v)
                  }
                  rows={2}
                  placeholder="Detalla las deficiencias..."
                />
              </div>
            )}
          </div>
          <div>
            <FichaLabel>Ingesta de agua</FichaLabel>
            <FichaSelect
              value={al.ingestaAgua || OPCION_VACIA}
              onChange={(v) => setField("alimentaria", "ingestaAgua", v)}
              options={SELECT_INGESTA_AGUA}
            />
          </div>
          <div>
            <FichaLabel>Otras informaciones</FichaLabel>
            <FichaTextarea
              value={al.otrasAlimentaria ?? ""}
              onChange={(v) => setField("alimentaria", "otrasAlimentaria", v)}
              rows={2}
            />
          </div>
        </FichaAccordion>

      </div>


      {showEnviarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-xl border border-border shadow-lg max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-semibold">Enviar cuestionario</h3>
            <p className="text-sm text-muted-foreground">
              Se enviará un resumen del cuestionario al correo del paciente:
            </p>
            <p className="text-sm font-medium bg-muted rounded-lg px-3 py-2">
              {pacienteEmail}
            </p>
            <p className="text-xs text-muted-foreground">
              El paciente podrá revisar los datos y contactarte si necesita
              corregir algo.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowEnviarModal(false)}
                disabled={enviando}
                className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleEnviarCuestionario}
                disabled={enviando}
                className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
              >
                {enviando && <Loader2 className="w-4 h-4 animate-spin" />}
                {enviando ? "Enviando..." : "Enviar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TagLine({ label, tags }: { label: string; tags: string[] }) {
  if (!tags.length) {
    return (
      <p className="text-muted-foreground">
        <span className="font-medium text-foreground">{label}:</span> ninguna
      </p>
    );
  }
  return (
    <p className="text-muted-foreground mb-1">
      <span className="font-medium text-foreground">{label}:</span>{" "}
      {tags.join(", ")}
    </p>
  );
}

function SaveStatusBadge({ status }: { status: SaveStatus }) {
  if (status === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Guardando...
      </span>
    );
  }
  if (status === "unsaved") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
        <AlertCircle className="w-3.5 h-3.5" />
        Sin guardar
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
      <Check className="w-3.5 h-3.5" />
      Guardado
    </span>
  );
}


"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Calendar,
  ClipboardList,
  User,
  Link2,
  UtensilsCrossed,
  Save,
  Settings,
  Check,
  Loader2,
  AlertCircle,
  FileDown,
} from "lucide-react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import type { FichaInformacionData, CampoPersonalizadoDefinicion, SeccionAnamnesis } from "@/lib/ficha-informacion-types";
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
import { getBrandingDietista } from "@/app/actions/perfil";
import { generateAnamnesisPDF } from "@/lib/pdf/generate-anamnesis-pdf";
import { getTheme } from "@/lib/pdf/pdf-themes";
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
    camposPersonalizados: {},
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
        camposPersonalizados: { ...e.camposPersonalizados, ...raw.camposPersonalizados },
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
  pacienteNombre,
  pacienteEmail,
  initialFicha,
  camposAnamnesis = [],
  resumen,
}: {
  pacienteId: string;
  pacienteNombre: string;
  pacienteEmail: string | null;
  initialFicha: FichaInformacionData | null | undefined;
  camposAnamnesis?: CampoPersonalizadoDefinicion[];
  resumen: PacienteResumen;
}) {
  const t = useTranslations("patients.informacion");
  const tExtra = useTranslations("patients.informacionExtra");
  const tPdf = useTranslations();
  const locale = useLocale();
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
        toast.error(tExtra("noSePudoGuardar"));
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

  function setCustomField(id: string, value: string) {
    setData((d) => ({
      ...d,
      camposPersonalizados: { ...d.camposPersonalizados, [id]: value },
    }));
  }

  const camposPorSeccion = camposAnamnesis.reduce<
    Record<SeccionAnamnesis, CampoPersonalizadoDefinicion[]>
  >(
    (acc, c) => {
      acc[c.seccion].push(c);
      return acc;
    },
    { consulta: [], personalSocial: [], clinica: [], alimentaria: [], personalizado: [] }
  );

  const cp = data.camposPersonalizados ?? {};

  function guardarManual() {
    clearTimeout(timerRef.current);
    doSave(data);
  }

  async function handleEnviarCuestionario() {
    if (!pacienteEmail) {
      toast.error(t("sinEmailParaCuestionario"));
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
        toast.success(t("cuestionarioEnviado"), {
          description: t("cuestionarioEnviadoA", { email: pacienteEmail }),
        });
        setShowEnviarModal(false);
      } else {
        toast.error(result.error || tExtra("noSePudoEnviar"));
      }
    } catch {
      toast.error(t("errorEnviarCuestionario"));
    } finally {
      setEnviando(false);
    }
  }

  async function handleExportarPDF() {
    if (saveStatus === "unsaved") {
      await doSave(data);
    }
    const branding = await getBrandingDietista();
    if (!branding) {
      toast.error(tExtra("noSePudoObtenerBranding"));
      return;
    }
    const theme = getTheme(branding.temaPdf, branding.colorPrimarioPdf);
    const html = generateAnamnesisPDF({
      pacienteNombre,
      dietistaNombre: branding.nombre,
      clinica: branding.clinica,
      ficha: data,
      camposCustom: camposAnamnesis,
      patologias: resumen.patologias,
      medicamentos: resumen.medicamentos,
      alergias: resumen.alergias,
      intolerancias: resumen.intolerancias,
      theme,
      logoUrl: branding.pdfLogoUrl,
      brandName: branding.marcaPdf,
      locale,
    }, tPdf);
    const ventana = window.open("", "_blank");
    if (!ventana) {
      toast.error(tExtra("permiteVentanasEmergentes"));
      return;
    }
    ventana.document.write(html);
    ventana.document.close();
  }

  const c = data.consulta ?? {};
  const ps = data.personalSocial ?? {};
  const cl = data.clinica ?? {};
  const al = data.alimentaria ?? {};

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 mb-2 border-b border-border">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (!pacienteEmail) {
                toast.error(tExtra("registraEmailAntes"));
                return;
              }
              setShowEnviarModal(true);
            }}
            className="inline-flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors w-fit"
          >
            <ClipboardList className="w-4 h-4" />
            {t("enviarCuestionario")}
          </button>
          <button
            type="button"
            onClick={handleExportarPDF}
            className="inline-flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors w-fit"
          >
            <FileDown className="w-4 h-4" />
            {t("exportarPdf")}
          </button>
        </div>
        <div className="flex items-center gap-3">
          <SaveStatusBadge status={saveStatus} />
          <button
            type="button"
            onClick={guardarManual}
            disabled={saveStatus === "saving"}
            className="p-2 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50"
            title={t("guardarAhora")}
          >
            <Save className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-1">
        {/* ── Informaciones de consulta ── */}
        <FichaAccordion title={t("informacionesConsulta")} icon={Calendar}>
          <div>
            <FichaLabel>{t("motivoConsulta")}</FichaLabel>
            <FichaTextarea
              value={c.motivo ?? ""}
              onChange={(v) => setField("consulta", "motivo", v)}
              rows={2}
            />
          </div>
          <div>
            <FichaLabel>{t("expectativas")}</FichaLabel>
            <FichaTextarea
              value={c.expectativas ?? ""}
              onChange={(v) => setField("consulta", "expectativas", v)}
              rows={2}
            />
          </div>
          <div>
            <FichaLabel>{t("objetivosClinicos")}</FichaLabel>
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
                  placeholder={t("detallaObjetivo")}
                />
              </div>
            )}
          </div>
          <div>
            <FichaLabel>{t("otrasInformaciones")}</FichaLabel>
            <FichaTextarea
              value={c.otras ?? ""}
              onChange={(v) => setField("consulta", "otras", v)}
              rows={2}
            />
          </div>
          <CamposCustomRender campos={camposPorSeccion.consulta} valores={cp} onChange={setCustomField} />
        </FichaAccordion>

        {/* ── Historia personal y social ── */}
        <FichaAccordion title={t("historiaPersonalSocial")} icon={User}>
          <div>
            <FichaLabel>{t("funcionIntestinal")}</FichaLabel>
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
                  placeholder={t("especifica")}
                />
              </div>
            )}
          </div>
          <div>
            <FichaLabel>{t("calidadSueno")}</FichaLabel>
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
                  placeholder={t("describeProblemaSueno")}
                />
              </div>
            )}
          </div>
          <div>
            <FichaLabel>{t("fumador")}</FichaLabel>
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
                  placeholder={t("frecuenciaCantidad")}
                />
              </div>
            )}
          </div>
          <div>
            <FichaLabel>{t("bebeAlcohol")}</FichaLabel>
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
                  placeholder={tExtra("frecuenciaTipoBebida")}
                />
              </div>
            )}
          </div>
          <div>
            <FichaLabel>{t("estadoCivil")}</FichaLabel>
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
                  placeholder={t("especifica")}
                />
              </div>
            )}
          </div>
          <div>
            <FichaLabel>{t("actividadFisica")}</FichaLabel>
            <FichaTextarea
              value={ps.actividadFisica ?? ""}
              onChange={(v) => setField("personalSocial", "actividadFisica", v)}
              rows={2}
            />
          </div>
          <div>
            <FichaLabel>{t("razaEtnia")}</FichaLabel>
            <FichaSelect
              value={ps.raza || OPCION_VACIA}
              onChange={(v) => setField("personalSocial", "raza", v)}
              options={[
                { value: OPCION_VACIA, label: t("seleccionaOpcion") },
                { value: "caucasica", label: t("razaCaucasica") },
                { value: "hispana", label: t("razaHispana") },
                { value: "afrodescendiente", label: t("razaAfrodescendiente") },
                { value: "asiatica", label: t("razaAsiatica") },
                { value: "arabe", label: t("razaArabe") },
                { value: "indigena", label: t("razaIndigena") },
                { value: "mestiza", label: t("razaMestiza") },
                { value: "no_indica", label: t("razaOtra") },
                { value: "otra", label: t("razaOtra") },
              ]}
            />
            {ps.raza === "otra" && (
              <div className="mt-2">
                <FichaInput
                  value={ps.razaDetalle ?? ""}
                  onChange={(v) => setField("personalSocial", "razaDetalle", v)}
                  placeholder={t("especifica")}
                />
              </div>
            )}
          </div>
          <div>
            <FichaLabel>{t("otrasInformaciones")}</FichaLabel>
            <FichaTextarea
              value={ps.otrasPersonal ?? ""}
              onChange={(v) => setField("personalSocial", "otrasPersonal", v)}
              rows={2}
            />
          </div>
          <CamposCustomRender campos={camposPorSeccion.personalSocial} valores={cp} onChange={setCustomField} />
        </FichaAccordion>

        {/* ── Historia clínica ── */}
        <FichaAccordion title={tExtra("historiaClinica")} icon={Link2}>
          <div className="rounded-lg bg-muted/40 border border-border/60 p-3 mb-3 text-sm">
            <p className="font-medium text-foreground mb-2">
              {tExtra("registradoFicha")}
            </p>
            <TagLine label={tExtra("patologias")} tags={resumen.patologias} />
            <TagLine label={tExtra("medicacion")} tags={resumen.medicamentos} />
            <p className="text-xs text-muted-foreground mt-2">
              {tExtra("editarListasCompletas")}{" "}
              <span className="font-medium text-foreground">{tExtra("editarPaciente")}</span>.
            </p>
          </div>
          <div>
            <FichaLabel>{tExtra("detallePatologias")}</FichaLabel>
            <FichaTextarea
              value={cl.patologiasDetalle ?? ""}
              onChange={(v) => setField("clinica", "patologiasDetalle", v)}
              rows={3}
            />
          </div>
          <div>
            <FichaLabel>{tExtra("medicacionTextoLibre")}</FichaLabel>
            <FichaTextarea
              value={cl.medicacion ?? ""}
              onChange={(v) => setField("clinica", "medicacion", v)}
              rows={2}
              placeholder={tExtra("ninguna")}
            />
          </div>
          <FichaTwoCol
            left={
              <div>
                <FichaLabel>{tExtra("antecedentesPersonales")}</FichaLabel>
                <FichaInput
                  value={cl.antecedentesPersonales ?? ""}
                  onChange={(v) =>
                    setField("clinica", "antecedentesPersonales", v)
                  }
                  placeholder={tExtra("ninguno")}
                />
              </div>
            }
            right={
              <div>
                <FichaLabel>{tExtra("antecedentesFamiliares")}</FichaLabel>
                <FichaInput
                  value={cl.antecedentesFamiliares ?? ""}
                  onChange={(v) =>
                    setField("clinica", "antecedentesFamiliares", v)
                  }
                  placeholder={tExtra("ninguno")}
                />
              </div>
            }
          />
          <div>
            <FichaLabel>{t("otrasInformaciones")}</FichaLabel>
            <FichaTextarea
              value={cl.otrasClinicas ?? ""}
              onChange={(v) => setField("clinica", "otrasClinicas", v)}
              rows={2}
            />
          </div>
          <CamposCustomRender campos={camposPorSeccion.clinica} valores={cp} onChange={setCustomField} />
        </FichaAccordion>

        {/* ── Historia alimentaria ── */}
        <FichaAccordion title={tExtra("historiaAlimentaria")} icon={UtensilsCrossed}>
          <div className="rounded-lg bg-muted/40 border border-border/60 p-3 mb-3 text-sm">
            <TagLine label={tExtra("alergias")} tags={resumen.alergias} />
            <TagLine label={tExtra("intolerancias")} tags={resumen.intolerancias} />
          </div>
          <FichaTwoCol
            left={
              <div>
                <FichaLabel>{tExtra("horaLevantarse")}</FichaLabel>
                <FichaInput
                  value={al.horaLevantarse ?? ""}
                  onChange={(v) => setField("alimentaria", "horaLevantarse", v)}
                  placeholder="HH:MM"
                />
              </div>
            }
            right={
              <div>
                <FichaLabel>{tExtra("horaAcostarse")}</FichaLabel>
                <FichaInput
                  value={al.horaAcostarse ?? ""}
                  onChange={(v) => setField("alimentaria", "horaAcostarse", v)}
                  placeholder="HH:MM"
                />
              </div>
            }
          />
          <div>
            <FichaLabel>{tExtra("tiposDieta")}</FichaLabel>
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
                  placeholder={tExtra("describeTipoDieta")}
                />
              </div>
            )}
          </div>
          <div>
            <FichaLabel>{tExtra("alimentosFavoritos")}</FichaLabel>
            <FichaInput
              value={al.alimentosFavoritos ?? ""}
              onChange={(v) => setField("alimentaria", "alimentosFavoritos", v)}
              placeholder={tExtra("ninguno")}
            />
          </div>
          <div>
            <FichaLabel>{tExtra("alimentosRechazados")}</FichaLabel>
            <FichaInput
              value={al.alimentosRechazados ?? ""}
              onChange={(v) =>
                setField("alimentaria", "alimentosRechazados", v)
              }
              placeholder={tExtra("ninguno")}
            />
          </div>
          <div>
            <FichaLabel>{tExtra("alergias")}</FichaLabel>
            <FichaSelect
              value={al.alergiasResumen || OPCION_VACIA}
              onChange={(v) => setField("alimentaria", "alergiasResumen", v)}
              options={[
                { value: OPCION_VACIA, label: tExtra("ninguna") },
                { value: "si", label: tExtra("siDetallar") },
              ]}
            />
            {al.alergiasResumen === "si" && (
              <div className="mt-2">
                <FichaTextarea
                  value={al.alergiasDetalle ?? ""}
                  onChange={(v) => setField("alimentaria", "alergiasDetalle", v)}
                  rows={2}
                  placeholder={tExtra("detallaAlergias")}
                />
              </div>
            )}
          </div>
          <div>
            <FichaLabel>{tExtra("intoleranciasAlimentarias")}</FichaLabel>
            <FichaSelect
              value={al.intoleranciasResumen || OPCION_VACIA}
              onChange={(v) => setField("alimentaria", "intoleranciasResumen", v)}
              options={[
                { value: OPCION_VACIA, label: tExtra("ninguna") },
                { value: "si", label: tExtra("siDetallar") },
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
                  placeholder={tExtra("detallaIntolerancias")}
                />
              </div>
            )}
          </div>
          <div>
            <FichaLabel>{tExtra("deficienciasNutricionales")}</FichaLabel>
            <FichaSelect
              value={al.deficiencias || OPCION_VACIA}
              onChange={(v) => setField("alimentaria", "deficiencias", v)}
              options={[
                { value: OPCION_VACIA, label: tExtra("ninguna") },
                { value: "si", label: tExtra("siDetallar") },
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
                  placeholder={tExtra("detallaDeficiencias")}
                />
              </div>
            )}
          </div>
          <div>
            <FichaLabel>{tExtra("ingestaAgua")}</FichaLabel>
            <FichaSelect
              value={al.ingestaAgua || OPCION_VACIA}
              onChange={(v) => setField("alimentaria", "ingestaAgua", v)}
              options={SELECT_INGESTA_AGUA}
            />
          </div>
          <div>
            <FichaLabel>{t("otrasInformaciones")}</FichaLabel>
            <FichaTextarea
              value={al.otrasAlimentaria ?? ""}
              onChange={(v) => setField("alimentaria", "otrasAlimentaria", v)}
              rows={2}
            />
          </div>
          <CamposCustomRender campos={camposPorSeccion.alimentaria} valores={cp} onChange={setCustomField} />
        </FichaAccordion>

        {camposPorSeccion.personalizado.length > 0 && (
          <FichaAccordion title={tExtra("camposPersonalizados")} icon={ClipboardList}>
            <CamposCustomRender campos={camposPorSeccion.personalizado} valores={cp} onChange={setCustomField} />
          </FichaAccordion>
        )}

      </div>

      <Link
        href="/ajustes#anamnesis"
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-1 py-2"
      >
        <Settings className="w-4 h-4" />
        {tExtra("personalizarCamposAnamnesis")}
      </Link>


      {showEnviarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-xl border border-border shadow-lg max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-semibold">{tExtra("enviarCuestionarioTitulo")}</h3>
            <p className="text-sm text-muted-foreground">
              {tExtra("enviarResumenCuestionario")}
            </p>
            <p className="text-sm font-medium bg-muted rounded-lg px-3 py-2">
              {pacienteEmail}
            </p>
            <p className="text-xs text-muted-foreground">
              {tExtra("pacienteRevisarDatos")}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowEnviarModal(false)}
                disabled={enviando}
                className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"
              >
                {tExtra("cancelar")}
              </button>
              <button
                type="button"
                onClick={handleEnviarCuestionario}
                disabled={enviando}
                className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
              >
                {enviando && <Loader2 className="w-4 h-4 animate-spin" />}
                {enviando ? tExtra("enviando") : tExtra("enviar")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CamposCustomRender({
  campos,
  valores,
  onChange,
}: {
  campos: CampoPersonalizadoDefinicion[];
  valores: Record<string, string>;
  onChange: (id: string, value: string) => void;
}) {
  const tExtra = useTranslations("patients.informacionExtra");
  if (campos.length === 0) return null;
  return (
    <>
      {campos.map((campo) => (
        <div key={campo.id}>
          <FichaLabel>{campo.label}</FichaLabel>
          {campo.tipo === "textarea" ? (
            <FichaTextarea
              value={valores[campo.id] ?? ""}
              onChange={(v) => onChange(campo.id, v)}
              rows={2}
            />
          ) : campo.tipo === "selector" && campo.opciones ? (
            <FichaSelect
              value={valores[campo.id] || OPCION_VACIA}
              onChange={(v) => onChange(campo.id, v)}
              options={[
                { value: OPCION_VACIA, label: tExtra("seleccionaOpcion") },
                ...campo.opciones.map((o) => ({ value: o, label: o })),
              ]}
            />
          ) : (
            <FichaInput
              value={valores[campo.id] ?? ""}
              onChange={(v) => onChange(campo.id, v)}
            />
          )}
        </div>
      ))}
    </>
  );
}

function TagLine({ label, tags }: { label: string; tags: string[] }) {
  const tExtra = useTranslations("patients.informacionExtra");
  if (!tags.length) {
    return (
      <p className="text-muted-foreground">
        <span className="font-medium text-foreground">{label}:</span> {tExtra("ninguna").toLowerCase()}
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
  const tExtra = useTranslations("patients.informacionExtra");
  if (status === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        {tExtra("guardando")}
      </span>
    );
  }
  if (status === "unsaved") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
        <AlertCircle className="w-3.5 h-3.5" />
        {tExtra("sinGuardar")}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
      <Check className="w-3.5 h-3.5" />
      {tExtra("guardado")}
    </span>
  );
}


"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Check, Loader2, AlertCircle, FileDown, Pencil, X, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import type { FichaInformacionData, CampoPersonalizadoDefinicion } from "@/lib/ficha-informacion-types";
import { guardarFichaInformacionPaciente } from "@/app/actions/pacientes";
import { EnviarAnamnesisButton } from "./enviar-anamnesis-button";
import { SelectorPlantillaAnamnesis } from "./selector-plantilla-anamnesis";
import type { PlantillaResumen } from "@/app/actions/plantillas-anamnesis";
import { getBrandingDietista } from "@/app/actions/perfil";
import { generateAnamnesisPDF } from "@/lib/pdf/generate-anamnesis-pdf";
import { getTheme } from "@/lib/pdf/pdf-themes";
import { downloadPDF } from "@/lib/pdf/pdf-download";
import { AnamnesisRenderer } from "./anamnesis-renderer";
import { AnamnesisEditor } from "./anamnesis-editor";
import {
  guardarEstructuraPaciente,
  guardarComoTipoNuevoPaciente,
  actualizarTipoDePaciente,
  getPlantillaAnamnesis,
} from "@/app/actions/plantillas-anamnesis";
import { estructuraBase, type EstructuraPlantilla } from "@/lib/anamnesis-plantillas";

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
  preconsultaCompletadaAt,
  initialFicha,
  estructura,
  plantillas = [],
  plantillaActualId = null,
  camposAnamnesis = [],
  resumen,
}: {
  pacienteId: string;
  pacienteNombre: string;
  pacienteEmail: string | null;
  preconsultaCompletadaAt?: string | null;
  initialFicha: FichaInformacionData | null | undefined;
  estructura: EstructuraPlantilla;
  plantillas?: PlantillaResumen[];
  plantillaActualId?: string | null;
  camposAnamnesis?: CampoPersonalizadoDefinicion[];
  resumen: PacienteResumen;
}) {
  const t = useTranslations("patients.informacion");
  const tExtra = useTranslations("patients.informacionExtra");
  const tPre = useTranslations("patients.preconsulta");
  const tForm = useTranslations("patients.form");
  const tPdf = useTranslations();
  const locale = useLocale();

  const [data, setData] = useState(() => mergeInitial(initialFicha, resumen));
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");

  const router = useRouter();
  const [modoEdicion, setModoEdicion] = useState(false);
  const [estructuraEdit, setEstructuraEdit] = useState<EstructuraPlantilla>(estructura);
  const [guardando, setGuardando] = useState(false);
  const [pidiendoNombre, setPidiendoNombre] = useState(false);
  const [descargandoPdf, setDescargandoPdf] = useState(false);
  const [nombreNuevo, setNombreNuevo] = useState("");
  const [showSalirModal, setShowSalirModal] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(true);
  const [showCrearModal, setShowCrearModal] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [tipoOrigenId, setTipoOrigenId] = useState<string | null>(plantillaActualId);
  const nombreTipoOrigen = plantillas.find((p) => p.id === tipoOrigenId)?.nombre ?? "";

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

  // En modo edición con cambios sin guardar: avisar al cerrar/refrescar y al navegar (cambiar de pestaña, etc.)
  useEffect(() => {
    if (!modoEdicion) return;
    const hayCambios = () => JSON.stringify(estructuraEdit) !== JSON.stringify(estructura);

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hayCambios()) e.preventDefault();
    };
    const onClick = (e: MouseEvent) => {
      if (!hayCambios()) return;
      const link = (e.target as HTMLElement).closest("a[href]") as HTMLAnchorElement | null;
      if (!link) return;
      const href = link.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("javascript:") || link.target === "_blank") return;
      try {
        if (new URL(href, window.location.origin).origin !== window.location.origin) return;
      } catch {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      setPendingHref(href);
      setShowSalirModal(true);
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [modoEdicion, estructuraEdit, estructura]);

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

  function guardarManual() {
    clearTimeout(timerRef.current);
    doSave(data);
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
      estructura,
      patologias: resumen.patologias,
      medicamentos: resumen.medicamentos,
      alergias: resumen.alergias,
      intolerancias: resumen.intolerancias,
      theme,
      logoUrl: branding.pdfLogoUrl,
      brandName: branding.marcaPdf,
      locale,
    }, tPdf);
    setDescargandoPdf(true);
    try {
      const nombre = pacienteNombre.replace(/\s+/g, "-");
      await downloadPDF(html, `Anamnesis-${nombre}.pdf`);
    } catch {
      toast.error(tExtra("errorDescargarPdf"));
    } finally {
      setDescargandoPdf(false);
    }
  }

  function entrarEdicion() {
    setEstructuraEdit(estructura);
    setTipoOrigenId(plantillaActualId);
    setPidiendoNombre(false);
    setNombreNuevo("");
    setModoEdicion(true);
  }

  const hayCambiosEdicion = JSON.stringify(estructuraEdit) !== JSON.stringify(estructura);

  function pedirSalirEdicion() {
    setPendingHref(null);
    if (hayCambiosEdicion) setShowSalirModal(true);
    else setModoEdicion(false);
  }

  function confirmarSalir() {
    setShowSalirModal(false);
    setModoEdicion(false);
    if (pendingHref) {
      const h = pendingHref;
      setPendingHref(null);
      router.push(h);
    }
  }

  function cerrarSalirModal() {
    setShowSalirModal(false);
    setPendingHref(null);
  }

  function empezarDesde(est: EstructuraPlantilla, origenId: string | null = null) {
    setEstructuraEdit(est);
    setTipoOrigenId(origenId);
    setPidiendoNombre(false);
    setNombreNuevo("");
    setShowCrearModal(false);
    setModoEdicion(true);
  }

  async function desdeTipo(id: string) {
    const p = await getPlantillaAnamnesis(id);
    if (p) empezarDesde(p.estructura, id);
  }

  function finalizarGuardado(res: { ok: boolean; error?: string }) {
    setGuardando(false);
    if (res.ok) {
      toast.success(tPre("guardado"));
      setModoEdicion(false);
      setPidiendoNombre(false);
      router.refresh();
    } else {
      toast.error(res.error || tPre("guardado"));
    }
  }

  async function guardarSolo() {
    setGuardando(true);
    finalizarGuardado(await guardarEstructuraPaciente(pacienteId, estructuraEdit));
  }

  async function guardarComoNuevo() {
    if (!nombreNuevo.trim()) return;
    setGuardando(true);
    finalizarGuardado(await guardarComoTipoNuevoPaciente(pacienteId, nombreNuevo.trim(), estructuraEdit));
  }

  async function actualizarTipo() {
    if (!tipoOrigenId) return;
    setGuardando(true);
    finalizarGuardado(await actualizarTipoDePaciente(pacienteId, tipoOrigenId, estructuraEdit));
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {preconsultaCompletadaAt && !modoEdicion && bannerVisible && (
        <div className="flex items-center justify-between gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 px-3 py-2">
          <span className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300">
            <Check className="w-3.5 h-3.5 shrink-0" />
            {tPre("rellenadaPorPaciente", { fecha: new Date(preconsultaCompletadaAt).toLocaleDateString(locale) })}
          </span>
          <button
            type="button"
            onClick={() => setBannerVisible(false)}
            aria-label={tPre("cerrar")}
            className="shrink-0 text-emerald-700/70 dark:text-emerald-300/70 hover:text-emerald-900 dark:hover:text-emerald-100 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {modoEdicion ? (
        <>
          <div className="flex items-center justify-between gap-3 pb-4 mb-2 border-b border-border">
            <h2 className="text-base font-semibold">{tPre("editar")}</h2>
            <button
              type="button"
              onClick={pedirSalirEdicion}
              className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
              {tPre("cancelar")}
            </button>
          </div>

          <AnamnesisEditor estructura={estructuraEdit} onChange={setEstructuraEdit} />

          <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:flex-wrap sm:items-center">
            <button
              type="button"
              onClick={guardarSolo}
              disabled={guardando}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {guardando && <Loader2 className="w-4 h-4 animate-spin" />}
              {tPre("guardarSoloPaciente")}
            </button>
            <button
              type="button"
              onClick={() => { setNombreNuevo(""); setPidiendoNombre(true); }}
              disabled={guardando}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50"
            >
              {tPre("guardarComoTipo")}
            </button>
            {tipoOrigenId && (
              <button
                type="button"
                onClick={actualizarTipo}
                disabled={guardando}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50"
              >
                {tPre("actualizarTipo", { nombre: nombreTipoOrigen })}
              </button>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 mb-2 border-b border-border">
            <div className="flex flex-wrap items-center gap-2">
              <SelectorPlantillaAnamnesis
                pacienteId={pacienteId}
                plantillas={plantillas}
                valorActual={plantillaActualId}
                onCrearNueva={() => setShowCrearModal(true)}
              />
              <EnviarAnamnesisButton pacienteId={pacienteId} pacienteEmail={pacienteEmail} />
              <button
                type="button"
                onClick={handleExportarPDF}
                disabled={descargandoPdf}
                className="inline-flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors w-fit disabled:opacity-60"
              >
                {descargandoPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                {t("exportarPdf")}
              </button>
              <button
                type="button"
                onClick={entrarEdicion}
                className="inline-flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors w-fit"
              >
                <Pencil className="w-4 h-4" />
                {tPre("editar")}
              </button>
            </div>
            <SaveStatusBadge status={saveStatus} />
          </div>

          <AnamnesisRenderer
            estructura={estructura}
            data={data}
            onBuiltin={(seccion, campo, value) => setField(seccion as keyof FichaInformacionData, campo, value)}
            onCustom={setCustomField}
            modoNutri
          />
        </>
      )}

      {showSalirModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-0 sm:px-4"
          onClick={cerrarSalirModal}
        >
          <div
            className="bg-card rounded-t-2xl sm:rounded-2xl border border-border shadow-2xl w-full sm:max-w-md p-5 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold">{tForm("cambiosSinGuardar")}</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-5">{tForm("cambiosSinGuardarDescripcionLarga")}</p>
            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2">
              <button
                type="button"
                onClick={cerrarSalirModal}
                className="px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
              >
                {tForm("seguirEditando")}
              </button>
              <button
                type="button"
                onClick={confirmarSalir}
                className="px-4 py-2.5 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors"
              >
                {tForm("salirSinGuardar")}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCrearModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-0 sm:px-4"
          onClick={() => setShowCrearModal(false)}
        >
          <div
            className="bg-card rounded-t-2xl sm:rounded-2xl border border-border shadow-2xl w-full sm:max-w-md p-5 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base sm:text-lg font-semibold mb-1">{tPre("crearNuevaTitulo")}</h3>
            <p className="text-sm text-muted-foreground mb-4">{tPre("crearNuevaAyuda")}</p>
            <p className="text-xs font-medium text-muted-foreground mb-2">{tPre("empezarDesde")}</p>
            <div className="space-y-2 max-h-[40vh] overflow-y-auto">
              <button
                type="button"
                onClick={() => empezarDesde({ secciones: [] })}
                className="w-full text-left px-3 py-2.5 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 text-sm font-medium transition-colors"
              >
                {tPre("crearTipoEnBlanco")}
              </button>
              <button
                type="button"
                onClick={() => empezarDesde(estructuraBase())}
                className="w-full text-left px-3 py-2.5 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 text-sm font-medium transition-colors"
              >
                {tPre("desdeGenerica")}
              </button>
              {plantillas.length > 0 && (
                <>
                  <p className="text-xs text-muted-foreground pt-2">{tPre("desdeExistente")}</p>
                  {plantillas.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => desdeTipo(p.id)}
                      className="w-full text-left px-3 py-2 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 text-sm transition-colors"
                    >
                      {p.nombre}
                    </button>
                  ))}
                </>
              )}
            </div>
            <div className="flex justify-end mt-4">
              <button
                type="button"
                onClick={() => setShowCrearModal(false)}
                className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"
              >
                {tPre("cancelar")}
              </button>
            </div>
          </div>
        </div>
      )}

      {pidiendoNombre && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-0 sm:px-4"
          onClick={() => setPidiendoNombre(false)}
        >
          <div
            className="bg-card rounded-t-2xl sm:rounded-2xl border border-border shadow-2xl w-full sm:max-w-md p-5 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base sm:text-lg font-semibold mb-1">{tPre("guardarComoTipo")}</h3>
            <p className="text-sm text-muted-foreground mb-3">{tPre("nuevaPlantillaAyuda")}</p>
            <input
              value={nombreNuevo}
              onChange={(e) => setNombreNuevo(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && nombreNuevo.trim()) guardarComoNuevo();
              }}
              placeholder={tPre("nombreNuevoTipo")}
              autoFocus
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setPidiendoNombre(false)}
                className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"
              >
                {tPre("cancelar")}
              </button>
              <button
                type="button"
                onClick={guardarComoNuevo}
                disabled={guardando || !nombreNuevo.trim()}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {guardando && <Loader2 className="w-4 h-4 animate-spin" />}
                {tPre("crearPlantillaBoton")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
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
  return null;
}

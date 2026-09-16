"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Loader2,
  Mail,
  Palette,
  Sparkles,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { enviarRecetarioPorEmail } from "@/app/actions/email";
import {
  generateRecetarioPDF,
  type DistribucionRecetarioPDF,
  type OpcionesRecetarioPDF,
  type RecetarioPDFData,
} from "@/lib/pdf/generate-recetario-pdf";
import { downloadPDF } from "@/lib/pdf/pdf-download";

interface Props {
  data: RecetarioPDFData;
  tituloInicial: string;
  pacientes: Array<{
    id: string;
    nombre: string;
    apellidos: string;
    email: string | null;
  }>;
}

interface ConfiguracionEditor {
  titulo: string;
  indice: boolean;
  valoresNutricionales: boolean;
  distribucion: DistribucionRecetarioPDF;
}

function opcionesPdf(configuracion: ConfiguracionEditor): OpcionesRecetarioPDF {
  return {
    portada: true,
    indice: configuracion.indice,
    valoresNutricionales: configuracion.valoresNutricionales,
    distribucion: configuracion.distribucion,
  };
}

function nombreArchivo(titulo: string): string {
  const limpio = titulo
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
  return `${limpio || "Recetario"}.pdf`;
}

export function RecetarioEditor({ data, tituloInicial, pacientes }: Props) {
  const t = useTranslations("recipes.recetario");
  const tPdf = useTranslations("pdf");
  const inicial: ConfiguracionEditor = {
    titulo: tituloInicial,
    indice: data.recetas.length > 1,
    valoresNutricionales: true,
    distribucion: "automatica",
  };
  const [configuracion, setConfiguracion] = useState<ConfiguracionEditor>(inicial);
  const [aplicada, setAplicada] = useState<ConfiguracionEditor>(inicial);
  const [descargando, setDescargando] = useState(false);
  const [mostrarEnvio, setMostrarEnvio] = useState(false);
  const [pacienteId, setPacienteId] = useState("");
  const [enviandoEmail, iniciarEnvioEmail] = useTransition();
  const [paginaPrevia, setPaginaPrevia] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [escalaPrevia, setEscalaPrevia] = useState(1);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const contenedorPreviaRef = useRef<HTMLDivElement>(null);
  const pacientesConEmail = useMemo(() => pacientes.filter((paciente) => paciente.email), [pacientes]);

  const pdfHtml = useMemo(() => {
    const html = generateRecetarioPDF(
      {
        ...data,
        titulo: aplicada.titulo,
        opciones: opcionesPdf(aplicada),
      },
      tPdf,
    );
    return html.replace(/<script[\s\S]*?<\/script>/gi, "");
  }, [aplicada, data, tPdf]);

  useEffect(() => {
    const paginas = (pdfHtml.match(/class="page/g) || []).length;
    setTotalPaginas(Math.max(1, paginas));
    setPaginaPrevia(0);
  }, [pdfHtml]);

  useEffect(() => {
    const elemento = contenedorPreviaRef.current;
    if (!elemento) return;
    const actualizar = () => setEscalaPrevia(elemento.clientWidth / 794);
    actualizar();
    const observador = new ResizeObserver(actualizar);
    observador.observe(elemento);
    return () => observador.disconnect();
  }, [pdfHtml]);

  const hayCambios =
    configuracion.titulo !== aplicada.titulo ||
    configuracion.indice !== aplicada.indice ||
    configuracion.valoresNutricionales !== aplicada.valoresNutricionales ||
    configuracion.distribucion !== aplicada.distribucion;

  function aplicarVistaPrevia() {
    if (!configuracion.titulo.trim()) {
      toast.error(t("tituloObligatorio"));
      return;
    }
    setAplicada({ ...configuracion, titulo: configuracion.titulo.trim() });
  }

  async function descargar() {
    if (!configuracion.titulo.trim()) {
      toast.error(t("tituloObligatorio"));
      return;
    }
    setDescargando(true);
    try {
      const titulo = configuracion.titulo.trim();
      const html = generateRecetarioPDF(
        { ...data, titulo, opciones: opcionesPdf(configuracion) },
        tPdf,
      );
      await downloadPDF(html, nombreArchivo(titulo));
    } catch {
      toast.error(t("errorDescargar"));
    } finally {
      setDescargando(false);
    }
  }

  function enviarEmail() {
    if (!configuracion.titulo.trim()) {
      toast.error(t("tituloObligatorio"));
      return;
    }
    if (!pacienteId) {
      toast.error(t("selectorPacienteObligatorio"));
      return;
    }
    iniciarEnvioEmail(async () => {
      try {
        const resultado = await enviarRecetarioPorEmail(
          pacienteId,
          data.recetas.map((receta) => receta.id),
          {
            titulo: configuracion.titulo.trim(),
            indice: configuracion.indice,
            valoresNutricionales: configuracion.valoresNutricionales,
            distribucion: configuracion.distribucion,
          },
        );
        if (resultado.ok) {
          toast.success(t("emailEnviado"));
        } else {
          toast.error(resultado.error || t("errorEmail"));
        }
      } catch {
        toast.error(t("errorEmail"));
      }
    });
  }

  function prepararPaginasPrevia() {
    const iframe = iframeRef.current;
    if (!iframe) return;
    try {
      const documento = iframe.contentDocument;
      if (!documento) return;
      const styleId = "preview-page-delim";
      let style = documento.getElementById(styleId) as HTMLStyleElement | null;
      if (!style) {
        style = documento.createElement("style");
        style.id = styleId;
        documento.head.appendChild(style);
      }
      style.textContent = `
        html, body { margin: 0; padding: 0; background: white; overflow: hidden; }
        .page {
          margin: 0 !important;
          min-height: 0 !important;
          width: 794px !important;
          background: white;
          box-sizing: border-box;
          overflow: hidden;
        }
      `;

      const altoPagina = 1123;
      const paginas = Array.from(documento.querySelectorAll<HTMLElement>(".page"));
      let total = 0;
      for (const pagina of paginas) {
        pagina.style.height = "auto";
        const necesarias = Math.max(1, Math.ceil((pagina.scrollHeight - 4) / altoPagina));
        pagina.style.height = `${necesarias * altoPagina}px`;
        total += necesarias;
      }
      if (total > 0) {
        setTotalPaginas(total);
        setPaginaPrevia((actual) => Math.min(actual, total - 1));
      }
    } catch {
      // El iframe solo contiene HTML propio; se mantiene el recuento inicial si no puede leerse.
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
      <div className="rounded-xl border border-border bg-card p-5 lg:order-2">
        <div className="mb-5 border-b border-border pb-5">
          <label htmlFor="titulo-recetario" className="mb-2 block text-sm font-semibold text-foreground">
            {t("tituloLabel")}
          </label>
          <input
            id="titulo-recetario"
            type="text"
            value={configuracion.titulo}
            onChange={(evento) => setConfiguracion((previa) => ({ ...previa, titulo: evento.target.value }))}
            maxLength={120}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <p className="mt-1.5 text-xs text-muted-foreground">{t("tituloAyuda")}</p>
        </div>

        <h2 className="mb-4 text-sm font-semibold text-foreground">{t("contenidoPdf")}</h2>
        <div className="space-y-1">
          <label className="flex cursor-not-allowed items-start gap-3 rounded-lg px-3 py-2.5 opacity-60">
            <input
              type="checkbox"
              checked
              disabled
              readOnly
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-primary"
            />
            <span className="min-w-0">
              <span className="block text-sm font-medium text-foreground">{t("portada")}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{t("portadaDescripcion")}</span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50">
            <input
              type="checkbox"
              checked={configuracion.indice}
              onChange={(evento) => setConfiguracion((previa) => ({ ...previa, indice: evento.target.checked }))}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-primary focus:ring-primary/20"
            />
            <span className="min-w-0">
              <span className="block text-sm font-medium text-foreground">{t("indice")}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{t("indiceDescripcion")}</span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50">
            <input
              type="checkbox"
              checked={configuracion.valoresNutricionales}
              onChange={(evento) => setConfiguracion((previa) => ({ ...previa, valoresNutricionales: evento.target.checked }))}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-primary focus:ring-primary/20"
            />
            <span className="min-w-0">
              <span className="block text-sm font-medium text-foreground">{t("macros")}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{t("macrosDescripcion")}</span>
            </span>
          </label>
        </div>

        <fieldset className="mt-5 border-t border-border pt-4">
          <legend className="text-sm font-semibold text-foreground">{t("distribucionTitulo")}</legend>
          <p className="mt-1 text-xs text-muted-foreground">{t("distribucionAyuda")}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {(["automatica", "unaPorPagina"] as const).map((distribucion) => {
              const seleccionada = configuracion.distribucion === distribucion;
              return (
                <label
                  key={distribucion}
                  className={cn(
                    "flex min-h-11 cursor-pointer items-start gap-2.5 rounded-lg border p-3 transition-colors",
                    seleccionada
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50",
                  )}
                >
                  <input
                    type="radio"
                    name="distribucion-recetario"
                    value={distribucion}
                    checked={seleccionada}
                    onChange={() => setConfiguracion((previa) => ({ ...previa, distribucion }))}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-primary focus:ring-primary/20"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-foreground">
                      {t(distribucion === "automatica" ? "distribucionAutomatica" : "unaPorPagina")}
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                      {t(distribucion === "automatica" ? "distribucionAutomaticaDescripcion" : "unaPorPaginaDescripcion")}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="mt-5 space-y-3 border-t border-border pt-4">
          <button
            type="button"
            onClick={aplicarVistaPrevia}
            disabled={!hayCambios || !configuracion.titulo.trim()}
            className={cn(
              "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors",
              hayCambios && configuracion.titulo.trim()
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "cursor-not-allowed bg-muted text-muted-foreground",
            )}
          >
            <Sparkles className="h-4 w-4" />
            {hayCambios ? t("generarVistaPrevia") : t("vistaPreviaActualizada")}
          </button>

          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setMostrarEnvio((visible) => !visible)}
              disabled={!configuracion.titulo.trim()}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors",
                configuracion.titulo.trim()
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "cursor-not-allowed bg-muted text-muted-foreground",
              )}
            >
              <Mail className="h-4 w-4" />
              {t("enviarEmail")}
            </button>

            <button
              type="button"
              onClick={descargar}
              disabled={descargando || !configuracion.titulo.trim()}
              className={cn(
                "inline-flex min-h-11 items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors",
                !descargando && configuracion.titulo.trim()
                  ? "border-border hover:bg-muted"
                  : "cursor-not-allowed border-border/50 text-muted-foreground",
              )}
            >
              {descargando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {t("descargarPdf")}
            </button>
          </div>

          {mostrarEnvio && (
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              {pacientesConEmail.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("sinPacientesConEmail")}</p>
              ) : (
                <>
                  <label htmlFor="recetario-paciente" className="block text-sm font-medium text-foreground">
                    {t("selectorPaciente")}
                  </label>
                  <select
                    id="recetario-paciente"
                    value={pacienteId}
                    onChange={(evento) => setPacienteId(evento.target.value)}
                    className="mt-2 min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">{t("seleccionarPaciente")}</option>
                    {pacientesConEmail.map((paciente) => (
                      <option key={paciente.id} value={paciente.id}>
                        {paciente.nombre} {paciente.apellidos} · {paciente.email}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1.5 text-xs text-muted-foreground">{t("selectorPacienteAyuda")}</p>
                  <button
                    type="button"
                    onClick={enviarEmail}
                    disabled={enviandoEmail || !pacienteId}
                    className={cn(
                      "mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors",
                      !enviandoEmail && pacienteId
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "cursor-not-allowed bg-muted text-muted-foreground",
                    )}
                  >
                    {enviandoEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                    {enviandoEmail ? t("enviando") : t("enviar")}
                  </button>
                </>
              )}
            </div>
          )}

          <Link
            href="/ajustes#documentos"
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-border px-4 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
          >
            <Palette className="h-3.5 w-3.5" />
            {t("personalizarEntregables")}
          </Link>
        </div>
      </div>

      <div className="flex flex-col rounded-xl border border-border bg-card p-4 lg:order-1">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <Eye className="h-4 w-4 text-muted-foreground" />
            {t("vistaPrevia")}
          </h2>
        </div>

        <div className="flex flex-1 flex-col items-center">
          <div
            ref={contenedorPreviaRef}
            className="relative w-full overflow-hidden rounded-lg border-2 border-border bg-muted/30 shadow-xl"
            style={{
              aspectRatio: "794 / 1123",
              maxHeight: "calc(100vh - 200px)",
              maxWidth: "calc((100vh - 200px) * 794 / 1123)",
            }}
          >
            <div className="absolute inset-0 overflow-hidden">
              <div
                className="absolute left-0 top-0 bg-card"
                style={{
                  width: "794px",
                  height: "1123px",
                  transform: `scale(${escalaPrevia})`,
                  transformOrigin: "top left",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: "794px",
                    height: `${Math.max(totalPaginas, 1) * 1123}px`,
                    transform: `translateY(-${paginaPrevia * 1123}px)`,
                    transition: "transform 500ms cubic-bezier(0.22, 1, 0.36, 1)",
                  }}
                >
                  <iframe
                    ref={iframeRef}
                    srcDoc={pdfHtml}
                    title={t("vistaPreviaPdf")}
                    className="block border-0"
                    sandbox="allow-same-origin"
                    scrolling="no"
                    style={{
                      width: "794px",
                      height: `${Math.max(totalPaginas, 1) * 1123}px`,
                      pointerEvents: "none",
                    }}
                    onLoad={prepararPaginasPrevia}
                  />
                </div>
              </div>
            </div>
          </div>

          {totalPaginas > 1 && (
            <div className="mt-3 flex items-center justify-center gap-3 border-t border-border pt-2">
              <button
                type="button"
                onClick={() => setPaginaPrevia(Math.max(0, paginaPrevia - 1))}
                disabled={paginaPrevia === 0}
                aria-label={t("paginaAnterior")}
                className="flex h-11 w-11 items-center justify-center rounded-lg transition-colors hover:bg-muted disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs tabular-nums text-muted-foreground">
                {paginaPrevia + 1} / {totalPaginas}
              </span>
              <button
                type="button"
                onClick={() => setPaginaPrevia(Math.min(totalPaginas - 1, paginaPrevia + 1))}
                disabled={paginaPrevia >= totalPaginas - 1}
                aria-label={t("paginaSiguiente")}
                className="flex h-11 w-11 items-center justify-center rounded-lg transition-colors hover:bg-muted disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

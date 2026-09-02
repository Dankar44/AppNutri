import "server-only";
import { getTranslations } from "next-intl/server";
import { getPlanPDFData } from "@/app/actions/planes";
import { generatePlanPDF, type PDFSectionOptions, type DisplayOverrides } from "@/lib/pdf/generate-plan-pdf";
import { getBrowser, resetBrowser } from "@/lib/browser";

/**
 * El PDF del entregable de un plan, generado en el servidor: los mismos datos, plantilla y tema
 * que la pestaña Entregables (`getPlanPDFData` + `generatePlanPDF`), pasados por el navegador
 * compartido de `/api/pdf`. Lo usa la entrega de un caso (#40): el alumno entrega el PDF tal y
 * como se lo daría al paciente, con las secciones que haya elegido.
 *
 * Devuelve null si el plan no es de quien pregunta (getPlanPDFData ya lo comprueba).
 */
export async function generarPdfDelPlan(
  planId: string,
  sections?: PDFSectionOptions,
  displayOverrides?: DisplayOverrides,
): Promise<{ pdf: Buffer; nombre: string } | null> {
  const datos = await getPlanPDFData(planId);
  if (!datos) return null;
  if (sections) datos.sections = sections;
  if (displayOverrides) datos.displayOverrides = displayOverrides;

  const tPdf = await getTranslations("pdf");
  const html = generatePlanPDF(datos, tPdf);
  const nombre = `Plan-${datos.pacienteNombre.replace(/\s+/g, "-")}.pdf`;
  return { pdf: await renderizarPdf(html), nombre };
}

/** Igual que /api/pdf: dos intentos, relanzando el navegador si el compartido se cayó. */
async function renderizarPdf(html: string): Promise<Buffer> {
  let ultimoError: unknown;
  for (let intento = 0; intento < 2; intento++) {
    let page: Awaited<ReturnType<Awaited<ReturnType<typeof getBrowser>>["newPage"]>> | undefined;
    try {
      const browser = await getBrowser();
      page = await browser.newPage();
      await page.setContent(html, { waitUntil: "load" });
      const pdf = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "0", right: "0", bottom: "0", left: "0" },
      });
      return Buffer.from(pdf);
    } catch (err) {
      ultimoError = err;
      await resetBrowser();
    } finally {
      if (page) {
        try { await page.close(); } catch { /* el navegador pudo morir */ }
      }
    }
  }
  throw ultimoError instanceof Error ? ultimoError : new Error("No se ha podido generar el PDF");
}

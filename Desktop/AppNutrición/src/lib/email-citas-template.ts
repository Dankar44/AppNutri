// Plantilla pura del email de cita: sin acceso a BD, envío ni i18n runtime.
// Aislada de email-citas.ts para poder probar el render con datos de ejemplo.

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://annonia.com";

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type VarianteCita = "confirmada" | "propuesta" | "nuevaPropuesta" | "recordatorio";

/** Decide el tono del email según el estado actual de la cita. */
export function varianteDeCita(estado: string, propuestoPor: string): VarianteCita {
  if (estado === "CONFIRMADA") return "confirmada";
  if (estado === "PENDIENTE" && propuestoPor === "DIETISTA") return "propuesta";
  if (estado === "CONTRAPROPUESTA" && propuestoPor === "DIETISTA") return "nuevaPropuesta";
  return "recordatorio";
}

const SUBJECT_KEY: Record<VarianteCita, string> = {
  confirmada: "cita.subjectConfirmada",
  propuesta: "cita.subjectPropuesta",
  nuevaPropuesta: "cita.subjectNuevaPropuesta",
  recordatorio: "cita.subjectRecordatorio",
};

const INTRO_KEY: Record<VarianteCita, string> = {
  confirmada: "cita.introConfirmada",
  propuesta: "cita.introPropuesta",
  nuevaPropuesta: "cita.introNuevaPropuesta",
  recordatorio: "cita.introRecordatorio",
};

export type TFunc = (key: string, params?: Record<string, string | number>) => string;

export interface DatosEmailCita {
  estado: string;
  propuestoPor: string;
  duracion: number;
  motivo: string | null;
  isOnline: boolean;
  /** Enlace de videollamada ya resuelto (manual del nutri o, en su defecto, el de Google Meet). */
  videoLink: string | null;
  pacienteNombre: string;
  dietistaNombre: string;
}

/**
 * Construye el asunto y el HTML del email de cita (función pura, sin BD ni envío
 * ni I/O). `fecha` debe venir ya formateada y localizada.
 */
export function renderEmailCita(
  d: DatosEmailCita,
  fecha: string,
  te: TFunc,
): { subject: string; html: string } {
  const variante = varianteDeCita(d.estado, d.propuestoPor);
  const mostrarAviso = variante === "propuesta" || variante === "nuevaPropuesta";

  const subject = te(SUBJECT_KEY[variante], { dietistaNombre: d.dietistaNombre, fecha });
  const intro = te(INTRO_KEY[variante], { dietistaNombre: d.dietistaNombre });
  const portalUrl = `${APP_URL}/paciente/portal/citas`;
  const online = d.isOnline || !!d.videoLink;
  const meetLink = d.videoLink;
  const filaModalidad = online ? te("cita.modalidadOnline") : te("cita.modalidadPresencial");

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px">
    <div style="background:#fff;border-radius:12px;border:1px solid #e5e7eb;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,.06)">
      <div style="margin-bottom:24px">
        <div style="font-size:18px;font-weight:700;color:#16a34a;margin-bottom:16px">Annonia</div>
        <h1 style="margin:0 0 8px;font-size:20px;color:#111827">${escapeHtml(te("cita.titulo"))}</h1>
        <p style="margin:0;color:#6b7280;font-size:14px">${escapeHtml(te("cita.saludo", { pacienteNombre: d.pacienteNombre }))}</p>
        <p style="margin:8px 0 0;color:#374151;font-size:15px">${escapeHtml(intro)}</p>
      </div>

      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;margin-bottom:24px">
        <p style="margin:0 0 10px;font-size:15px;color:#166534">
          <strong>${escapeHtml(te("cita.fechaLabel"))}:</strong> <span style="text-transform:capitalize">${escapeHtml(fecha)}</span>
        </p>
        <p style="margin:0 0 10px;font-size:14px;color:#374151">
          <strong>${escapeHtml(te("cita.duracionLabel"))}:</strong> ${escapeHtml(te("cita.duracionValor", { min: d.duracion }))}
        </p>
        <p style="margin:0;font-size:14px;color:#374151">
          <strong>${escapeHtml(te("cita.modalidadLabel"))}:</strong> ${escapeHtml(filaModalidad)}
        </p>
        ${d.motivo ? `<p style="margin:10px 0 0;font-size:14px;color:#374151"><strong>${escapeHtml(te("cita.motivoLabel"))}:</strong> ${escapeHtml(d.motivo)}</p>` : ""}
        ${meetLink ? `<p style="margin:14px 0 0"><a href="${meetLink}" style="color:#2563eb;font-weight:600;font-size:14px;text-decoration:none">${escapeHtml(te("cita.enlaceVideollamada"))}</a></p>` : ""}
      </div>

      ${mostrarAviso ? `<p style="margin:0 0 20px;font-size:14px;color:#374151">${escapeHtml(te("cita.avisoPropuesta"))}</p>` : ""}

      <div style="text-align:center;margin-bottom:24px">
        <a href="${portalUrl}" style="display:inline-block;background:#16a34a;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
          ${escapeHtml(te("cita.boton"))}
        </a>
      </div>

      <div style="margin-top:24px;border-top:1px solid #f3f4f6;padding-top:16px;text-align:center;color:#9ca3af;font-size:12px">
        <p style="margin:0 0 4px">${escapeHtml(te("cita.footerResponder"))}</p>
        <p style="margin:0">${escapeHtml(te("cita.footer"))}</p>
      </div>
    </div>
  </div>
</body>
</html>`;

  return { subject, html };
}

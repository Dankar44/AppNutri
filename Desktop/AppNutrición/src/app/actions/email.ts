"use server";

import { sendEmail } from "@/lib/mailer";
import { prisma } from "@/lib/prisma";
import { hashPin, generarPin } from "@/lib/patient-auth";
import { getCurrentDietista } from "./auth";
import { getPaciente } from "./pacientes";
import { getPlan } from "./planes";
import { getTranslations } from "next-intl/server";
import { generatePlanPDF, type PlanPDFData } from "@/lib/pdf/generate-plan-pdf";
import { htmlToPdf } from "@/lib/html-to-pdf";
import { getRecomendaciones } from "./pacientes";
import type { FichaInformacionData, CampoPersonalizadoDefinicion } from "@/lib/ficha-informacion-types";
import {
  OPCION_VACIA,
  SELECT_FUNCION_INTESTINAL,
  SELECT_CALIDAD_SUENO,
  SELECT_SI_NO_OCASION,
  SELECT_ESTADO_CIVIL,
  SELECT_OBJETIVOS_CLINICOS,
  SELECT_TIPOS_DIETA,
  SELECT_INGESTA_AGUA,
} from "@/lib/ficha-informacion-types";

function labelFor(
  options: { value: string; label: string }[],
  value: string | undefined
): string | null {
  if (!value || value === OPCION_VACIA) return null;
  return options.find((o) => o.value === value)?.label ?? value;
}

function row(label: string, value: string | undefined | null): string {
  if (!value || value === OPCION_VACIA) return "";
  return `<tr><td style="padding:8px 12px;font-weight:600;vertical-align:top;white-space:nowrap;color:#374151">${escapeHtml(label)}</td><td style="padding:8px 12px;color:#4b5563">${escapeHtml(value)}</td></tr>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sectionHtml(title: string, rows: string): string {
  if (!rows.trim()) return "";
  return `
    <table width="100%" style="margin-bottom:24px;border-collapse:collapse">
      <tr>
        <td colspan="2" style="padding:12px;background:#f0f4ff;border-radius:8px;font-size:16px;font-weight:700;color:#1e40af">
          ${title}
        </td>
      </tr>
      ${rows}
    </table>`;
}

function buildCuestionarioHtml(
  ficha: FichaInformacionData,
  pacienteNombre: string,
  dietistaNombre: string,
  camposCustom: CampoPersonalizadoDefinicion[] = [],
  te: (key: string, values?: Record<string, string>) => string
): string {
  const c = ficha.consulta ?? {};
  const ps = ficha.personalSocial ?? {};
  const cl = ficha.clinica ?? {};
  const al = ficha.alimentaria ?? {};
  const l = (key: string) => te(`cuestionario.labels.${key}`);

  const secConsulta = sectionHtml(
    te("cuestionario.seccionConsulta"),
    [
      row(l("motivoConsulta"), c.motivo),
      row(l("expectativas"), c.expectativas),
      row(l("objetivosClinicos"), labelFor(SELECT_OBJETIVOS_CLINICOS, c.objetivosClinicos)),
      row(l("detalleObjetivos"), c.objetivosClinicosDetalle),
      row(l("otrasInformaciones"), c.otras),
    ].join("")
  );

  const secPersonal = sectionHtml(
    te("cuestionario.seccionPersonal"),
    [
      row(l("funcionIntestinal"), labelFor(SELECT_FUNCION_INTESTINAL, ps.funcionIntestinal)),
      row(l("detalle"), ps.funcionIntestinalDetalle),
      row(l("calidadSueno"), labelFor(SELECT_CALIDAD_SUENO, ps.calidadSueno)),
      row(l("detalle"), ps.calidadSuenoDetalle),
      row(l("fumador"), labelFor(SELECT_SI_NO_OCASION, ps.fumador)),
      row(l("detalle"), ps.fumadorDetalle),
      row(l("bebeAlcohol"), labelFor(SELECT_SI_NO_OCASION, ps.alcohol)),
      row(l("detalle"), ps.alcoholDetalle),
      row(l("estadoCivil"), labelFor(SELECT_ESTADO_CIVIL, ps.estadoCivil)),
      row(l("detalle"), ps.estadoCivilDetalle),
      row(l("actividadFisica"), ps.actividadFisica),
      row(l("razaEtnia"), ps.raza === "no_indica" ? l("prefiereNoIndicar") : ps.razaDetalle),
      row(l("otrasInformaciones"), ps.otrasPersonal),
    ].join("")
  );

  const secClinica = sectionHtml(
    te("cuestionario.seccionClinica"),
    [
      row(l("detallePatologias"), cl.patologiasDetalle),
      row(l("medicacion"), cl.medicacion),
      row(l("antecedentesPersonales"), cl.antecedentesPersonales),
      row(l("antecedentesFamiliares"), cl.antecedentesFamiliares),
      row(l("otrasInformaciones"), cl.otrasClinicas),
    ].join("")
  );

  const secAlimentaria = sectionHtml(
    te("cuestionario.seccionAlimentaria"),
    [
      row(l("horaLevantarse"), al.horaLevantarse),
      row(l("horaAcostarse"), al.horaAcostarse),
      row(l("tipoDieta"), labelFor(SELECT_TIPOS_DIETA, al.tiposDieta)),
      row(l("detalleDieta"), al.tiposDietaDetalle),
      row(l("alimentosFavoritos"), al.alimentosFavoritos),
      row(l("alimentosRechazados"), al.alimentosRechazados),
      row(l("alergiasDetalle"), al.alergiasDetalle),
      row(l("intoleranciasDetalle"), al.intoleranciasDetalle),
      row(l("deficienciasNutricionales"), al.deficienciasDetalle),
      row(l("ingestaAgua"), labelFor(SELECT_INGESTA_AGUA, al.ingestaAgua)),
      row(l("otrasInformaciones"), al.otrasAlimentaria),
    ].join("")
  );

  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px">
    <div style="background:#fff;border-radius:12px;border:1px solid #e5e7eb;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,.06)">
      <div style="text-align:center;margin-bottom:32px">
        <h1 style="margin:0 0 8px;font-size:22px;color:#111827">${escapeHtml(te("cuestionario.titulo"))}</h1>
        <p style="margin:0;color:#6b7280;font-size:14px">
          ${escapeHtml(te("cuestionario.saludo", { pacienteNombre, dietistaNombre }))}
        </p>
      </div>

      ${secConsulta}
      ${secPersonal}
      ${secClinica}
      ${secAlimentaria}
      ${(() => {
        const cp = ficha.camposPersonalizados ?? {};
        const rows = camposCustom
          .map((c) => row(c.label, cp[c.id]))
          .join("");
        return sectionHtml(te("cuestionario.seccionCamposPersonalizados"), rows);
      })()}

      <div style="margin-top:32px;padding:16px;background:#fef3c7;border-radius:8px;text-align:center">
        <p style="margin:0;font-size:14px;color:#92400e">
          ${escapeHtml(te("cuestionario.avisoIncorrecto"))}
        </p>
      </div>

      <div style="margin-top:24px;text-align:center;color:#9ca3af;font-size:12px">
        <p style="margin:0">${escapeHtml(te("cuestionario.footer"))}</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export async function enviarCuestionarioPaciente(
  pacienteId: string,
  ficha: FichaInformacionData
): Promise<{ ok: boolean; error?: string }> {
  const t = await getTranslations("validation");
  const te = await getTranslations("emails");
  const dietista = await getCurrentDietista();
  if (!dietista) return { ok: false, error: t("auth.noAutorizado") };
  if (dietista.isDemo) return { ok: true };

  const paciente = await getPaciente(pacienteId);
  if (!paciente) return { ok: false, error: t("paciente.pacienteNoEncontrado") };

  if (!paciente.email) {
    return { ok: false, error: t("paciente.sinEmailRegistrado") };
  }

  const pacienteNombre = `${paciente.nombre} ${paciente.apellidos}`.trim();
  const dietistaNombre = `${dietista.nombre} ${dietista.apellidos}`.trim();

  const { getCamposAnamnesis } = await import("./perfil");
  const camposCustom = await getCamposAnamnesis();

  const html = buildCuestionarioHtml(ficha, pacienteNombre, dietistaNombre, camposCustom, te);

  try {
    await sendEmail({
      to: paciente.email,
      subject: te("cuestionario.subject", { dietistaNombre }),
      html,
      replyTo: dietista.email,
    });
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : t("general.errorDesconocido");
    return { ok: false, error: msg };
  }
}

// ─── Enviar plan alimentario por email ───

export async function enviarPlanPorEmail(
  pacienteId: string,
  planId: string,
  sections?: import("@/lib/pdf/generate-plan-pdf").PDFSectionOptions,
  displayOverrides?: import("@/lib/pdf/generate-plan-pdf").DisplayOverrides,
): Promise<{ ok: boolean; error?: string }> {
  const t = await getTranslations("validation");
  const te = await getTranslations("emails");
  const dietista = await getCurrentDietista();
  if (!dietista) return { ok: false, error: t("auth.noAutorizado") };
  if (dietista.isDemo) return { ok: true };

  const paciente = await getPaciente(pacienteId);
  if (!paciente) return { ok: false, error: t("paciente.pacienteNoEncontrado") };
  if (!paciente.email) return { ok: false, error: t("paciente.sinEmailRegistrado") };

  const plan = await getPlan(planId);
  if (!plan) return { ok: false, error: t("plan.planNoEncontrado") };

  const pacienteNombre = `${paciente.nombre} ${paciente.apellidos}`.trim();
  const dietistaNombre = `${dietista.nombre} ${dietista.apellidos}`.trim();
  const recomendaciones = await getRecomendaciones(pacienteId);

  const pdfData: PlanPDFData = {
    planNombre: plan.nombre,
    pacienteNombre,
    dietistaNombre,
    dias: plan.dias.map((dia) => ({
      dia: dia.dia,
      comidas: dia.comidas.map((comida) => ({
        tipo: comida.tipo,
        descripcion: comida.descripcion,
        alimentos: comida.alimentos.map((a) => ({
          cantidad: a.cantidad,
          unidad: a.unidad,
          alimento: a.alimento
            ? {
                id: a.alimento.id,
                nombre: a.alimento.nombre,
                categoria: a.alimento.categoria ?? "OTROS",
                calorias: a.alimento.calorias ?? 0,
                proteinas: a.alimento.proteinas ?? 0,
                carbohidratos: a.alimento.carbohidratos ?? 0,
                grasas: a.alimento.grasas ?? 0,
                fibra: a.alimento.fibra ?? 0,
                porcion: a.alimento.porcion ?? 100,
              }
            : null,
          receta: a.receta
            ? {
                id: a.receta.id,
                nombre: a.receta.nombre,
                descripcion: a.receta.descripcion,
                instrucciones: a.receta.instrucciones,
                porciones: a.receta.porciones ?? 1,
                calorias: a.receta.calorias ?? 0,
                proteinas: a.receta.proteinas ?? 0,
                carbohidratos: a.receta.carbohidratos ?? 0,
                grasas: a.receta.grasas ?? 0,
                ingredientes: (a.receta.ingredientes ?? []).map((i) => ({
                  alimento: { nombre: i.alimento.nombre },
                  cantidad: i.cantidad,
                  unidad: i.unidad,
                })),
              }
            : null,
        })),
      })),
    })),
    recomendaciones,
    caloriasObjetivo: plan.caloriasObjetivo,
  };

  const { getTheme } = await import("@/lib/pdf/pdf-themes");
  pdfData.tema = getTheme(dietista.temaPdf, dietista.colorPrimarioPdf);
  pdfData.brandName = dietista.marcaPdf || undefined;
  pdfData.logoDataUrl = dietista.pdfLogoUrl || undefined;
  pdfData.clinica = dietista.clinica || undefined;
  if (sections) pdfData.sections = sections;
  if (displayOverrides) pdfData.displayOverrides = displayOverrides;

  const tPdf = await getTranslations("pdf");
  const fullHtml = generatePlanPDF(pdfData, tPdf);
  const pdfBuffer = await htmlToPdf(fullHtml);

  const brandName = escapeHtml(dietista.marcaPdf || "Annonia");
  const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://annonia.com"}/paciente/login`;
  const emailHtml = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px">
    <div style="background:#fff;border-radius:12px;border:1px solid #e5e7eb;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,.06)">
      <div style="text-align:center;margin-bottom:24px">
        <h1 style="margin:0 0 8px;font-size:22px;color:#111827">${escapeHtml(te("planAlimenticio.titulo"))}</h1>
        <p style="margin:0;color:#6b7280;font-size:14px">
          ${escapeHtml(te("planAlimenticio.saludo", { pacienteNombre, dietistaNombre }))}
        </p>
      </div>

      <div style="background:#f0fdf4;border-radius:8px;padding:20px;margin-bottom:24px;text-align:center">
        <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#166534">
          ${escapeHtml(plan.nombre)}
        </p>
        <p style="margin:0;font-size:13px;color:#4b5563">
          ${escapeHtml(te("planAlimenticio.adjunto"))}
        </p>
      </div>

      <div style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:16px;text-align:center">
        <p style="margin:0 0 12px;font-size:13px;color:#4b5563">
          ${escapeHtml(te("planAlimenticio.portal"))}
        </p>
        <a href="${portalUrl}" style="display:inline-block;background:#16a34a;color:white;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px">
          ${escapeHtml(te("planAlimenticio.botonPortal"))}
        </a>
      </div>

      <div style="margin-top:24px;text-align:center;color:#9ca3af;font-size:12px">
        <p style="margin:0">${brandName} &mdash; annonia.com</p>
      </div>
    </div>
  </div>
</body>
</html>`;

  const safeFileName = plan.nombre.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-_]/g, "").trim() || "plan-dietetico";

  try {
    await sendEmail({
      to: paciente.email,
      subject: te("planAlimenticio.subject", { planNombre: plan.nombre }),
      html: emailHtml,
      replyTo: dietista.email,
      attachments: [{
        filename: `${safeFileName}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      }],
    });
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : t("general.errorDesconocido");
    return { ok: false, error: msg };
  }
}

// ─── Enviar instrucciones de acceso al portal ───

export async function enviarAccesoPortal(
  pacienteId: string
): Promise<{ ok: boolean; error?: string }> {
  const t = await getTranslations("validation");
  const te = await getTranslations("emails");
  const dietista = await getCurrentDietista();
  if (!dietista) return { ok: false, error: t("auth.noAutorizado") };
  if (dietista.isDemo) return { ok: true };

  const paciente = await getPaciente(pacienteId);
  if (!paciente) return { ok: false, error: t("paciente.pacienteNoEncontrado") };
  if (!paciente.email) return { ok: false, error: t("paciente.sinEmailRegistrado") };

  const pacienteNombre = `${paciente.nombre} ${paciente.apellidos}`.trim();
  const dietistaNombre = `${dietista.nombre} ${dietista.apellidos}`.trim();

  // Generar un PIN nuevo y guardarlo hasheado. El PIN va en texto plano en este
  // correo (única forma: en BD solo se guarda el hash). Resetea el acceso del paciente.
  const pin = generarPin();
  const pinHashVal = await hashPin(pin);
  await prisma.accesoPaciente.upsert({
    where: { pacienteId },
    update: { email: paciente.email, pinHash: pinHashVal, activo: true, passwordHash: null, perfilCompleto: false },
    create: { pacienteId, email: paciente.email, pinHash: pinHashVal },
  });

  const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://annonia.com"}/paciente/login`;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px">
    <div style="background:#fff;border-radius:12px;border:1px solid #e5e7eb;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,.06)">
      <div style="text-align:center;margin-bottom:24px">
        <h1 style="margin:0 0 8px;font-size:22px;color:#111827">${escapeHtml(te("accesoPortal.titulo"))}</h1>
        <p style="margin:0;color:#6b7280;font-size:14px">
          ${escapeHtml(te("accesoPortal.saludo", { pacienteNombre, dietistaNombre }))}
        </p>
      </div>

      <div style="background:#f0fdf4;border-radius:8px;padding:20px;margin-bottom:24px;text-align:center">
        <p style="margin:0 0 12px;font-size:14px;color:#166534;font-weight:600">
          ${escapeHtml(te("accesoPortal.accedeTuPortal"))}
        </p>
        <a href="${portalUrl}" style="display:inline-block;background:#16a34a;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
          ${escapeHtml(te("accesoPortal.boton"))}
        </a>
      </div>

      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:20px;margin-bottom:24px;text-align:center">
        <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#1e40af">${escapeHtml(te("accesoPortal.datosAccesoLabel"))}</p>
        <p style="margin:0 0 6px;font-size:14px;color:#374151">${escapeHtml(te("accesoPortal.emailLabel"))}: <strong>${escapeHtml(paciente.email)}</strong></p>
        <p style="margin:0;font-size:14px;color:#374151">${escapeHtml(te("accesoPortal.pinLabel"))}: <strong style="font-size:22px;letter-spacing:4px;color:#111827">${pin}</strong></p>
        <p style="margin:12px 0 0;font-size:12px;color:#6b7280">${escapeHtml(te("accesoPortal.avisoPin"))}</p>
      </div>

      <div style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:16px">
        <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#374151">${escapeHtml(te("accesoPortal.instruccionesLabel"))}</p>
        <ol style="margin:0;padding:0 0 0 20px;color:#4b5563;font-size:13px;line-height:1.8">
          <li>${escapeHtml(te("accesoPortal.paso1"))}</li>
          <li>${escapeHtml(te("accesoPortal.paso2", { email: paciente.email }))}</li>
          <li>${escapeHtml(te("accesoPortal.paso3"))}</li>
          <li>${escapeHtml(te("accesoPortal.paso4"))}</li>
        </ol>
      </div>

      <div style="margin-top:24px;text-align:center;color:#9ca3af;font-size:12px">
        <p style="margin:0">${escapeHtml(te("accesoPortal.footer"))}</p>
      </div>
    </div>
  </div>
</body>
</html>`;

  try {
    await sendEmail({
      to: paciente.email,
      subject: te("accesoPortal.subject", { dietistaNombre }),
      html,
      replyTo: dietista.email,
    });
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : t("general.errorDesconocido");
    return { ok: false, error: msg };
  }
}

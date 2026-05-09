"use server";

import { sendEmail } from "@/lib/mailer";
import { getCurrentDietista } from "./auth";
import { getPaciente } from "./pacientes";
import { getPlan } from "./planes";
import { generatePlanPDF, type PlanPDFData } from "@/lib/pdf/generate-plan-pdf";
import { getRecomendaciones } from "./pacientes";
import type { FichaInformacionData } from "@/lib/ficha-informacion-types";
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
  return `<tr><td style="padding:8px 12px;font-weight:600;vertical-align:top;white-space:nowrap;color:#374151">${label}</td><td style="padding:8px 12px;color:#4b5563">${escapeHtml(value)}</td></tr>`;
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
  dietistaNombre: string
): string {
  const c = ficha.consulta ?? {};
  const ps = ficha.personalSocial ?? {};
  const cl = ficha.clinica ?? {};
  const al = ficha.alimentaria ?? {};

  const secConsulta = sectionHtml(
    "Informaciones de consulta",
    [
      row("Motivo de consulta", c.motivo),
      row("Expectativas", c.expectativas),
      row("Objetivos cl\u00ednicos", labelFor(SELECT_OBJETIVOS_CLINICOS, c.objetivosClinicos)),
      row("Detalle objetivos", c.objetivosClinicosDetalle),
      row("Otras informaciones", c.otras),
    ].join("")
  );

  const secPersonal = sectionHtml(
    "Historia personal y social",
    [
      row("Funci\u00f3n intestinal", labelFor(SELECT_FUNCION_INTESTINAL, ps.funcionIntestinal)),
      row("Detalle", ps.funcionIntestinalDetalle),
      row("Calidad del sue\u00f1o", labelFor(SELECT_CALIDAD_SUENO, ps.calidadSueno)),
      row("Detalle", ps.calidadSuenoDetalle),
      row("Fumador", labelFor(SELECT_SI_NO_OCASION, ps.fumador)),
      row("Detalle", ps.fumadorDetalle),
      row("Bebe alcohol", labelFor(SELECT_SI_NO_OCASION, ps.alcohol)),
      row("Detalle", ps.alcoholDetalle),
      row("Estado civil", labelFor(SELECT_ESTADO_CIVIL, ps.estadoCivil)),
      row("Detalle", ps.estadoCivilDetalle),
      row("Actividad f\u00edsica", ps.actividadFisica),
      row("Raza / etnia", ps.raza === "no_indica" ? "Prefiere no indicar" : ps.razaDetalle),
      row("Otras informaciones", ps.otrasPersonal),
    ].join("")
  );

  const secClinica = sectionHtml(
    "Historia cl\u00ednica",
    [
      row("Detalle patolog\u00edas / evoluci\u00f3n", cl.patologiasDetalle),
      row("Medicaci\u00f3n", cl.medicacion),
      row("Antecedentes personales", cl.antecedentesPersonales),
      row("Antecedentes familiares", cl.antecedentesFamiliares),
      row("Otras informaciones", cl.otrasClinicas),
    ].join("")
  );

  const secAlimentaria = sectionHtml(
    "Historia alimentaria",
    [
      row("Hora habitual para levantarse", al.horaLevantarse),
      row("Hora habitual para acostarse", al.horaAcostarse),
      row("Tipo de dieta", labelFor(SELECT_TIPOS_DIETA, al.tiposDieta)),
      row("Detalle dieta", al.tiposDietaDetalle),
      row("Alimentos favoritos", al.alimentosFavoritos),
      row("Alimentos rechazados", al.alimentosRechazados),
      row("Alergias (detalle)", al.alergiasDetalle),
      row("Intolerancias (detalle)", al.intoleranciasDetalle),
      row("Deficiencias nutricionales", al.deficienciasDetalle),
      row("Ingesta de agua", labelFor(SELECT_INGESTA_AGUA, al.ingestaAgua)),
      row("Otras informaciones", al.otrasAlimentaria),
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
        <h1 style="margin:0 0 8px;font-size:22px;color:#111827">Resumen de tu cuestionario</h1>
        <p style="margin:0;color:#6b7280;font-size:14px">
          Hola <strong>${escapeHtml(pacienteNombre)}</strong>, tu nutricionista
          <strong>${escapeHtml(dietistaNombre)}</strong> ha registrado la siguiente informaci\u00f3n
          de tu consulta.
        </p>
      </div>

      ${secConsulta}
      ${secPersonal}
      ${secClinica}
      ${secAlimentaria}

      <div style="margin-top:32px;padding:16px;background:#fef3c7;border-radius:8px;text-align:center">
        <p style="margin:0;font-size:14px;color:#92400e">
          Si alguno de estos datos no es correcto, por favor responde a este correo
          o contacta con tu nutricionista para actualizarlos.
        </p>
      </div>

      <div style="margin-top:24px;text-align:center;color:#9ca3af;font-size:12px">
        <p style="margin:0">Enviado desde Annonia</p>
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
  const dietista = await getCurrentDietista();
  if (!dietista) return { ok: false, error: "No autorizado" };

  const paciente = await getPaciente(pacienteId);
  if (!paciente) return { ok: false, error: "Paciente no encontrado" };

  if (!paciente.email) {
    return { ok: false, error: "El paciente no tiene email registrado" };
  }

  const pacienteNombre = `${paciente.nombre} ${paciente.apellidos}`.trim();
  const dietistaNombre = `${dietista.nombre} ${dietista.apellidos}`.trim();

  const html = buildCuestionarioHtml(ficha, pacienteNombre, dietistaNombre);

  try {
    await sendEmail({
      to: paciente.email,
      subject: `Tu cuestionario nutricional \u2014 ${dietistaNombre}`,
      html,
      replyTo: dietista.email,
    });
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return { ok: false, error: msg };
  }
}

// ─── Enviar plan alimentario por email ───

export async function enviarPlanPorEmail(
  pacienteId: string,
  planId: string
): Promise<{ ok: boolean; error?: string }> {
  const dietista = await getCurrentDietista();
  if (!dietista) return { ok: false, error: "No autorizado" };

  const paciente = await getPaciente(pacienteId);
  if (!paciente) return { ok: false, error: "Paciente no encontrado" };
  if (!paciente.email) return { ok: false, error: "El paciente no tiene email registrado" };

  const plan = await getPlan(planId);
  if (!plan) return { ok: false, error: "Plan no encontrado" };

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

  const htmlBody = generatePlanPDF(pdfData);
  try {
    await sendEmail({
      to: paciente.email,
      subject: `Tu plan de alimentación — ${plan.nombre}`,
      html: htmlBody,
      replyTo: dietista.email,
    });
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return { ok: false, error: msg };
  }
}

// ─── Enviar instrucciones de acceso al portal ───

export async function enviarAccesoPortal(
  pacienteId: string
): Promise<{ ok: boolean; error?: string }> {
  const dietista = await getCurrentDietista();
  if (!dietista) return { ok: false, error: "No autorizado" };

  const paciente = await getPaciente(pacienteId);
  if (!paciente) return { ok: false, error: "Paciente no encontrado" };
  if (!paciente.email) return { ok: false, error: "El paciente no tiene email registrado" };

  const pacienteNombre = `${paciente.nombre} ${paciente.apellidos}`.trim();
  const dietistaNombre = `${dietista.nombre} ${dietista.apellidos}`.trim();

  const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/paciente/login`;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px">
    <div style="background:#fff;border-radius:12px;border:1px solid #e5e7eb;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,.06)">
      <div style="text-align:center;margin-bottom:24px">
        <h1 style="margin:0 0 8px;font-size:22px;color:#111827">Acceso a tu portal de nutricion</h1>
        <p style="margin:0;color:#6b7280;font-size:14px">
          Hola <strong>${escapeHtml(pacienteNombre)}</strong>, tu nutricionista
          <strong>${escapeHtml(dietistaNombre)}</strong> te ha dado acceso a tu portal personal.
        </p>
      </div>

      <div style="background:#f0fdf4;border-radius:8px;padding:20px;margin-bottom:24px;text-align:center">
        <p style="margin:0 0 12px;font-size:14px;color:#166534;font-weight:600">
          Accede a tu portal aqui:
        </p>
        <a href="${portalUrl}" style="display:inline-block;background:#16a34a;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
          Ir a mi portal
        </a>
      </div>

      <div style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:16px">
        <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#374151">Instrucciones:</p>
        <ol style="margin:0;padding:0 0 0 20px;color:#4b5563;font-size:13px;line-height:1.8">
          <li>Accede al enlace de arriba</li>
          <li>Introduce tu email: <strong>${escapeHtml(paciente.email)}</strong></li>
          <li>Introduce el PIN que te ha proporcionado tu nutricionista</li>
          <li>Desde el portal podras consultar tu dieta, registrar tu peso y mas</li>
        </ol>
      </div>

      <div style="margin-top:24px;text-align:center;color:#9ca3af;font-size:12px">
        <p style="margin:0">Enviado desde Annonia</p>
      </div>
    </div>
  </div>
</body>
</html>`;

  try {
    await sendEmail({
      to: paciente.email,
      subject: `Acceso a tu portal de nutricion — ${dietistaNombre}`,
      html,
      replyTo: dietista.email,
    });
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return { ok: false, error: msg };
  }
}

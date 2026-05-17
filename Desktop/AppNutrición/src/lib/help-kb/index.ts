import type { HelpEntry, HelpEntrySkeleton } from "./types";
export type { HelpEntry, HelpEntrySkeleton } from "./types";

import { GENERAL_ENTRIES } from "./sections/general";
import { DASHBOARD_ENTRIES } from "./sections/dashboard";
import { PACIENTES_ENTRIES } from "./sections/pacientes";
import { PACIENTE_DETALLE_ENTRIES } from "./sections/paciente-detalle";
import { PACIENTE_INFORMACION_ENTRIES } from "./sections/paciente-informacion";
import { PACIENTE_MEDICIONES_ENTRIES } from "./sections/paciente-mediciones";
import { PACIENTE_CONSULTAS_ENTRIES } from "./sections/paciente-consultas";
import { PACIENTE_PLANIFICACION_ENTRIES } from "./sections/paciente-planificacion";
import { PACIENTE_PLAN_ALIMENTACION_ENTRIES } from "./sections/paciente-plan-alimentacion";
import { PACIENTE_SEGUIMIENTO_ENTRIES } from "./sections/paciente-seguimiento";
import { PACIENTE_RECOMENDACIONES_ENTRIES } from "./sections/paciente-recomendaciones";
import { PACIENTE_ENTREGABLES_ENTRIES } from "./sections/paciente-entregables";
import { PACIENTE_PORTAL_CONFIG_ENTRIES } from "./sections/paciente-portal-config";
import { DIETAS_ENTRIES } from "./sections/dietas";
import { DIETA_EDITOR_ENTRIES } from "./sections/dieta-editor";
import { DIETA_IA_ENTRIES } from "./sections/dieta-ia";
import { DIETA_COMPARTIR_ENTRIES } from "./sections/dieta-compartir";
import { DIETA_PLANTILLAS_ENTRIES } from "./sections/dieta-plantillas";
import { ALIMENTOS_ENTRIES } from "./sections/alimentos";
import { RECETAS_ENTRIES } from "./sections/recetas";
import { AGENDA_ENTRIES } from "./sections/agenda";
import { AGENDA_HORARIO_ENTRIES } from "./sections/agenda-horario";
import { AGENDA_CITAS_ENTRIES } from "./sections/agenda-citas";
import { AGENDA_GOOGLE_ENTRIES } from "./sections/agenda-google";
import { PAGOS_ENTRIES } from "./sections/pagos";
import { MENSAJES_ENTRIES } from "./sections/mensajes";
import { NOTIFICACIONES_ENTRIES } from "./sections/notificaciones";
import { AJUSTES_ENTRIES } from "./sections/ajustes";
import { AJUSTES_PERFIL_ENTRIES } from "./sections/ajustes-perfil";
import { AJUSTES_INTEGRACIONES_ENTRIES } from "./sections/ajustes-integraciones";
import { AJUSTES_SUSCRIPCION_ENTRIES } from "./sections/ajustes-suscripcion";
import { AJUSTES_COBROS_ENTRIES } from "./sections/ajustes-cobros";
import { AJUSTES_DEMO_ENTRIES } from "./sections/ajustes-demo";
import { AJUSTES_GUIAS_ENTRIES } from "./sections/ajustes-guias";
import { AJUSTES_PELIGROSO_ENTRIES } from "./sections/ajustes-peligroso";
import { REPORTES_ENTRIES } from "./sections/reportes";
import { PORTAL_GENERAL_ENTRIES } from "./sections/portal-general";
import { PORTAL_DASHBOARD_ENTRIES } from "./sections/portal-dashboard";
import { PORTAL_CITAS_ENTRIES } from "./sections/portal-citas";
import { PORTAL_HORARIO_ENTRIES } from "./sections/portal-horario";
import { PORTAL_SEGUIMIENTO_ENTRIES } from "./sections/portal-seguimiento";
import { PORTAL_PERFIL_ENTRIES } from "./sections/portal-perfil";
import { PORTAL_ENTREGABLES_ENTRIES } from "./sections/portal-entregables";

/** Todos los esqueletos (sin textos traducibles). */
const ALL_SKELETONS: HelpEntrySkeleton[] = [
  ...GENERAL_ENTRIES,
  ...DASHBOARD_ENTRIES,
  ...PACIENTES_ENTRIES,
  ...PACIENTE_DETALLE_ENTRIES,
  ...PACIENTE_INFORMACION_ENTRIES,
  ...PACIENTE_MEDICIONES_ENTRIES,
  ...PACIENTE_CONSULTAS_ENTRIES,
  ...PACIENTE_PLANIFICACION_ENTRIES,
  ...PACIENTE_PLAN_ALIMENTACION_ENTRIES,
  ...PACIENTE_SEGUIMIENTO_ENTRIES,
  ...PACIENTE_RECOMENDACIONES_ENTRIES,
  ...PACIENTE_ENTREGABLES_ENTRIES,
  ...PACIENTE_PORTAL_CONFIG_ENTRIES,
  ...DIETAS_ENTRIES,
  ...DIETA_EDITOR_ENTRIES,
  ...DIETA_IA_ENTRIES,
  ...DIETA_COMPARTIR_ENTRIES,
  ...DIETA_PLANTILLAS_ENTRIES,
  ...ALIMENTOS_ENTRIES,
  ...RECETAS_ENTRIES,
  ...AGENDA_ENTRIES,
  ...AGENDA_HORARIO_ENTRIES,
  ...AGENDA_CITAS_ENTRIES,
  ...AGENDA_GOOGLE_ENTRIES,
  ...PAGOS_ENTRIES,
  ...MENSAJES_ENTRIES,
  ...NOTIFICACIONES_ENTRIES,
  ...AJUSTES_ENTRIES,
  ...AJUSTES_PERFIL_ENTRIES,
  ...AJUSTES_INTEGRACIONES_ENTRIES,
  ...AJUSTES_SUSCRIPCION_ENTRIES,
  ...AJUSTES_COBROS_ENTRIES,
  ...AJUSTES_DEMO_ENTRIES,
  ...AJUSTES_GUIAS_ENTRIES,
  ...AJUSTES_PELIGROSO_ENTRIES,
  ...REPORTES_ENTRIES,
  ...PORTAL_GENERAL_ENTRIES,
  ...PORTAL_DASHBOARD_ENTRIES,
  ...PORTAL_CITAS_ENTRIES,
  ...PORTAL_HORARIO_ENTRIES,
  ...PORTAL_SEGUIMIENTO_ENTRIES,
  ...PORTAL_PERFIL_ENTRIES,
  ...PORTAL_ENTREGABLES_ENTRIES,
];

/**
 * Tipo del traductor que espera `buildHelpEntries`.
 * Compatible con `useTranslations("help")` de next-intl.
 */
export type HelpTranslator = (key: string) => string;

/**
 * Construye las entradas completas inyectando question, answer y keywords
 * desde las traducciones (namespace "help").
 *
 * Cada ID (p.ej. "gen-1") se busca en el JSON de traducción como:
 *   help["gen-1"].question / .answer / .keywords
 */
export function buildHelpEntries(t: HelpTranslator): HelpEntry[] {
  return ALL_SKELETONS.map((sk) => {
    const question = t(`${sk.id}.question`);
    const answer = t(`${sk.id}.answer`);
    const kw = t(`${sk.id}.keywords`);
    const keywords = kw ? kw.split(",").map((k) => k.trim()).filter(Boolean) : [];
    return {
      ...sk,
      question,
      answer,
      keywords,
    };
  });
}

/**
 * Devuelve la clave de seccion a partir de la URL actual.
 * Las rutas mas especificas deben estar ANTES que las mas generales.
 */
export function getSection(pathname: string): string {
  // --- Paciente portal ---
  if (pathname.startsWith("/paciente/portal/citas")) return "portal-citas";
  if (pathname.startsWith("/paciente/portal/seguimiento/horario")) return "portal-horario";
  if (pathname.startsWith("/paciente/portal/seguimiento")) return "portal-seguimiento";
  if (pathname.startsWith("/paciente/portal/perfil")) return "portal-perfil";
  if (pathname.startsWith("/paciente/portal/exportar-pdf")) return "portal-entregables";
  if (pathname === "/paciente/portal" || pathname === "/paciente/portal/") return "portal-dashboard";
  if (pathname.startsWith("/paciente/portal")) return "portal-general";

  // --- Nutricionista ---
  if (pathname === "/dashboard" || pathname === "/dashboard/") return "dashboard";

  if (pathname === "/pacientes" || pathname === "/pacientes/nuevo") return "pacientes";
  if (/^\/pacientes\/[^/]+\/consultas/.test(pathname)) return "paciente-consultas";
  if (/^\/pacientes\/[^/]+\/medidas/.test(pathname)) return "paciente-mediciones";
  if (/^\/pacientes\/[^/]+\/portal/.test(pathname)) return "paciente-portal-config";
  if (/^\/pacientes\/[^/]+\/seguimiento/.test(pathname)) return "paciente-seguimiento";
  if (/^\/pacientes\/[^/]+(\?|$)/.test(pathname)) {
    return "paciente-detalle";
  }
  if (/^\/pacientes\/[^/]+/.test(pathname)) return "paciente-detalle";

  if (pathname === "/dietas" || pathname === "/dietas/nuevo") return "dietas";
  if (pathname.startsWith("/dietas/plantillas")) return "dieta-plantillas";
  if (/\/generar-ia/.test(pathname)) return "dieta-ia";
  if (/\/compartir/.test(pathname)) return "dieta-compartir";
  if (/^\/dietas\/[^/]+\/editar/.test(pathname)) return "dieta-editor";
  if (/^\/dietas\/[^/]+/.test(pathname)) return "dieta-editor";

  if (pathname.startsWith("/alimentos")) return "alimentos";
  if (pathname.startsWith("/recetas")) return "recetas";

  if (pathname.startsWith("/agenda/horario")) return "agenda-horario";
  if (pathname.startsWith("/agenda/nueva")) return "agenda-citas";
  if (pathname.startsWith("/agenda")) return "agenda";

  if (pathname.startsWith("/pagos")) return "pagos";
  if (pathname.startsWith("/mensajes")) return "mensajes";

  if (pathname.startsWith("/notificaciones")) return "notificaciones";

  if (pathname.startsWith("/ajustes")) return "ajustes";

  if (pathname.startsWith("/reportes")) return "reportes";

  return "general";
}

export function getEntriesForSection(entries: HelpEntry[], section: string): HelpEntry[] {
  const sectionEntries = entries.filter((e) => e.section === section);
  const fallbackSection = section.startsWith("portal-") ? "portal-general" : "general";
  const fallbackEntries = entries.filter((e) => e.section === fallbackSection);
  const ids = new Set(sectionEntries.map((e) => e.id));
  return [...sectionEntries, ...fallbackEntries.filter((e) => !ids.has(e.id))];
}

export function getEntryById(entries: HelpEntry[], id: string): HelpEntry | undefined {
  return entries.find((e) => e.id === id);
}

export function getRelatedEntries(entries: HelpEntry[], entry: HelpEntry): HelpEntry[] {
  return entry.related
    .map((id) => entries.find((e) => e.id === id))
    .filter(Boolean) as HelpEntry[];
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function searchHelp(entries: HelpEntry[], query: string): HelpEntry[] {
  const q = normalize(query.trim());
  if (!q || q.length < 2) return [];

  const words = q.split(/\s+/);

  return entries.map((entry) => {
    const questionNorm = normalize(entry.question);
    const answerNorm = normalize(entry.answer);
    const keywordsNorm = entry.keywords.map(normalize);

    let score = 0;
    for (const word of words) {
      if (questionNorm.includes(word)) score += 10;
      if (keywordsNorm.some((k) => k.includes(word))) score += 5;
      if (answerNorm.includes(word)) score += 1;
    }

    return { entry, score };
  })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.entry);
}

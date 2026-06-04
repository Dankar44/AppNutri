/**
 * Test del render del email de cita (#74). No toca BD, ni envía, ni usa red:
 * prueba la función pura renderEmailCita con datos de ejemplo y un `te` mock
 * construido desde los JSON reales de traducción (es y pt), y comprueba que
 * todas las claves i18n usadas existen en ambos idiomas.
 *
 *   npx tsx scripts/test-email-cita.ts
 */
import fs from "fs";
import path from "path";
import {
  renderEmailCita,
  varianteDeCita,
  type DatosEmailCita,
  type TFunc,
} from "../src/lib/email-citas-template";

const ROOT = process.cwd();
const esEmails = JSON.parse(fs.readFileSync(path.join(ROOT, "src/messages/es/emails.json"), "utf8"));
const ptEmails = JSON.parse(fs.readFileSync(path.join(ROOT, "src/messages/pt/emails.json"), "utf8"));

let fallos = 0;
function check(cond: boolean, msg: string) {
  if (cond) {
    console.log(`  ✓ ${msg}`);
  } else {
    console.error(`  ✗ FALLO: ${msg}`);
    fallos++;
  }
}

// `te` mock: resuelve "cita.x" en el JSON e interpola {placeholders}.
function makeTe(emails: Record<string, unknown>, lanzarSiFalta: boolean): TFunc {
  return (key, params) => {
    const cur = key.split(".").reduce<unknown>((acc, p) => (acc as Record<string, unknown>)?.[p], emails);
    if (typeof cur !== "string") {
      if (lanzarSiFalta) throw new Error(`CLAVE i18n AUSENTE: emails.${key}`);
      return `__MISSING(${key})__`;
    }
    let out = cur;
    if (params) for (const [k, v] of Object.entries(params)) out = out.split(`{${k}}`).join(String(v));
    return out;
  };
}

// ── 1) Cobertura de claves: toda clave cita.* usada debe existir en es y pt ──
console.log("\n[1] Cobertura de claves i18n (es + pt)");
const codigo =
  fs.readFileSync(path.join(ROOT, "src/lib/email-citas-template.ts"), "utf8") +
  fs.readFileSync(path.join(ROOT, "src/lib/email-citas.ts"), "utf8");
const clavesUsadas = [...new Set([...codigo.matchAll(/"(cita\.[a-zA-Z]+)"/g)].map((m) => m[1]))].sort();
check(clavesUsadas.length >= 20, `se detectan ${clavesUsadas.length} claves cita.* en el código`);
for (const clave of clavesUsadas) {
  const enEs = clave.split(".").reduce<unknown>((a, p) => (a as Record<string, unknown>)?.[p], esEmails);
  const enPt = clave.split(".").reduce<unknown>((a, p) => (a as Record<string, unknown>)?.[p], ptEmails);
  check(typeof enEs === "string" && typeof enPt === "string", `${clave} existe en es y pt`);
}

// ── 2) Render de cada variante ──
const teEs = makeTe(esEmails, true);
const tePt = makeTe(ptEmails, true);

interface Caso {
  nombre: string;
  datos: DatosEmailCita;
  fecha: string;
  te: TFunc;
  varianteEsperada: string;
  esperaAviso: boolean;
  esperaMeet: boolean;
  esperaMotivo: boolean;
}

const casos: Caso[] = [
  {
    nombre: "Confirmada · online con Meet · con motivo (es)",
    datos: {
      estado: "CONFIRMADA", propuestoPor: "DIETISTA", duracion: 45,
      motivo: "Revisión mensual", isOnline: true,
      googleMeetLink: "https://meet.google.com/abc-defg-hij",
      pacienteNombre: "María", dietistaNombre: "Dra. Ana López",
    },
    fecha: "lunes, 9 de junio, 17:00", te: teEs,
    varianteEsperada: "confirmada", esperaAviso: false, esperaMeet: true, esperaMotivo: true,
  },
  {
    nombre: "Propuesta · presencial · motivo con HTML peligroso (es)",
    datos: {
      estado: "PENDIENTE", propuestoPor: "DIETISTA", duracion: 30,
      motivo: "Primera <b>consulta</b>", isOnline: false, googleMeetLink: null,
      pacienteNombre: "Juan", dietistaNombre: "Dra. Ana López",
    },
    fecha: "martes, 10 de junio, 10:30", te: teEs,
    varianteEsperada: "propuesta", esperaAviso: true, esperaMeet: false, esperaMotivo: true,
  },
  {
    nombre: "Nueva propuesta · online sin Meet (pt)",
    datos: {
      estado: "CONTRAPROPUESTA", propuestoPor: "DIETISTA", duracion: 60,
      motivo: null, isOnline: true, googleMeetLink: null,
      pacienteNombre: "Ana", dietistaNombre: "Dr. Carlos",
    },
    fecha: "quarta-feira, 11 de junho, 09:00", te: tePt,
    varianteEsperada: "nuevaPropuesta", esperaAviso: true, esperaMeet: false, esperaMotivo: false,
  },
  {
    nombre: "Recordatorio · paciente propuso (es)",
    datos: {
      estado: "PENDIENTE", propuestoPor: "PACIENTE", duracion: 30,
      motivo: null, isOnline: false, googleMeetLink: null,
      pacienteNombre: "Lucía", dietistaNombre: "Dra. Ana López",
    },
    fecha: "viernes, 13 de junio, 18:00", te: teEs,
    varianteEsperada: "recordatorio", esperaAviso: false, esperaMeet: false, esperaMotivo: false,
  },
];

for (const c of casos) {
  console.log(`\n[2] ${c.nombre}`);
  check(varianteDeCita(c.datos.estado, c.datos.propuestoPor) === c.varianteEsperada,
    `variante = ${c.varianteEsperada}`);
  const { subject, html } = renderEmailCita(c.datos, c.fecha, c.te);

  check(subject.length > 0 && !subject.includes("cita."), `asunto resuelto: "${subject}"`);
  check(!html.includes("cita.") && !html.includes("__MISSING("), "html sin claves i18n crudas");
  check(!html.includes("undefined") && !html.includes("[object Object]"), "html sin undefined/[object Object]");
  check(html.includes(c.fecha), "html incluye la fecha localizada");
  check(html.includes("/paciente/portal/citas"), "html incluye el enlace al portal");
  check(subject.includes(c.datos.dietistaNombre), "asunto incluye el nombre del nutricionista");
  check(html.includes(c.datos.pacienteNombre), "html incluye el nombre del paciente");
  check(html.includes(c.te("cita.boton")), "html incluye el botón de CTA");

  check(html.includes(c.te("cita.avisoPropuesta")) === c.esperaAviso,
    c.esperaAviso ? "muestra el aviso de propuesta" : "NO muestra el aviso de propuesta");
  if (c.esperaMeet) {
    check(html.includes(c.datos.googleMeetLink!), "html incluye el enlace de videollamada");
  } else {
    check(!html.includes("meet.google.com"), "html sin enlace de videollamada");
  }
  if (c.esperaMotivo && c.datos.motivo) {
    // El motivo del caso 2 lleva HTML; debe aparecer escapado, nunca crudo.
    if (c.datos.motivo.includes("<")) {
      check(html.includes("&lt;b&gt;consulta&lt;/b&gt;") && !html.includes("<b>consulta</b>"),
        "el motivo con HTML se escapa (anti-inyección)");
    } else {
      check(html.includes(c.datos.motivo), "html incluye el motivo");
    }
  }
}

console.log(`\n${fallos === 0 ? "✅ TODOS LOS CHECKS OK" : `❌ ${fallos} CHECK(S) FALLARON`}`);
process.exit(fallos === 0 ? 0 : 1);

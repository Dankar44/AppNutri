/**
 * #39 — ¿Qué migraciones del módulo docente están puestas en esta base de datos?
 *
 * Solo LEE (mira el catálogo de columnas), así que se puede pasar por producción sin miedo:
 *
 *   DB=dev  npx tsx scripts/comprobar-migraciones-docentes.ts
 *   DB=prod npx tsx scripts/comprobar-migraciones-docentes.ts
 */
import "./_guard";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

/** Una columna representativa por migración: si está, esa migración se ejecutó. */
const MIGRACIONES: { script: string; comprueba: [string, string][] }[] = [
  { script: "add-modulo-docente", comprueba: [["licencias_docentes", "institucion"], ["dietistas", "rolDocente"], ["dietistas", "licenciaDocenteId"]] },
  { script: "add-licencia-persona-contacto", comprueba: [["licencias_docentes", "personaContacto"]] },
  { script: "add-invitaciones-docentes", comprueba: [["invitaciones_docentes", "token"]] },
  { script: "add-invitacion-reenvios", comprueba: [["invitaciones_docentes", "ultimoEnvioAt"], ["invitaciones_docentes", "envios"]] },
  { script: "add-clases-docentes", comprueba: [["clases", "tokenInvitacion"], ["alumnos_clase", "activa"], ["dietistas", "cuentaDeClase"]] },
  { script: "add-recetas-compartido", comprueba: [["recetas", "compartido"]] },
  { script: "add-exalumno", comprueba: [["dietistas", "exAlumnoDesde"], ["dietistas", "avisoFinCursoVisto"]] },
  { script: "add-profesores-clase", comprueba: [["profesores_clase", "profesorId"]] },
  { script: "add-casos-clinicos", comprueba: [["casos_clinicos", "consigna"], ["asignaciones_caso", "fechaLimite"], ["entregas_caso", "nota"], ["pacientes", "esDeClase"]] },
  { script: "add-notificaciones-docentes", comprueba: [] },
  { script: "add-casos-como-pacientes", comprueba: [["casos_clinicos", "pacienteId"], ["pacientes", "esCasoDocente"], ["entregas_caso", "notaAlumno"]] },
  { script: "add-caso-compartir-planes", comprueba: [["casos_clinicos", "compartirPlanes"]] },
  { script: "add-entrega-congelada", comprueba: [["entregas_caso", "entregaSnapshot"], ["entregas_caso", "entregablePdf"], ["entregas_caso", "entregableBytes"]] },
  { script: "add-caso-aviso-copia", comprueba: [] },
  { script: "add-origen-copia", comprueba: [["medidas_antropometricas", "origenId"], ["consultas", "origenId"]] },
  { script: "add-origen-planes", comprueba: [["planes_alimenticios", "origenId"], ["planes_alimenticios", "origenHuella"], ["planificaciones", "origenId"], ["planificaciones", "origenHuella"]] },
  { script: "add-sincronizacion-copia", comprueba: [["pacientes", "origenHuella"]] },
];

const TABLAS_CON_RLS = ["licencias_docentes", "invitaciones_docentes", "clases", "alumnos_clase", "profesores_clase", "casos_clinicos", "asignaciones_caso", "entregas_caso"];

async function main() {
  const client = await pool.connect();
  try {
    let faltan = 0;
    for (const { script, comprueba } of MIGRACIONES) {
      const presentes: boolean[] = [];
      if (comprueba.length === 0) {
        // Migraciones que solo añaden valores a un enum: se miran en el catálogo del tipo.
        const { rows } = await client.query(
          `SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
            WHERE t.typname = 'TipoNotificacion' AND e.enumlabel = 'CASO_ASIGNADO'`);
        presentes.push(rows.length > 0);
      }
      for (const [tabla, columna] of comprueba) {
        const { rows } = await client.query(
          `SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2`,
          [tabla, columna],
        );
        presentes.push(rows.length > 0);
      }
      const todas = presentes.every(Boolean);
      const algunas = presentes.some(Boolean);
      if (!todas) faltan++;
      console.log(
        `  ${todas ? "✓" : algunas ? "!" : "·"} ${script.padEnd(32)} ` +
        `${todas ? "puesta" : algunas ? "A MEDIAS" : "sin aplicar"}`,
      );
    }

    // Una tabla del módulo sin RLS es la brecha del 26 ago 2026 otra vez.
    const { rows: rls } = await client.query(
      `SELECT relname, relrowsecurity FROM pg_class WHERE relname = ANY($1::text[])`, [TABLAS_CON_RLS]);
    if (rls.length > 0) {
      const sinRls = rls.filter((r) => !r.relrowsecurity).map((r) => r.relname);
      console.log(sinRls.length === 0
        ? `\n  ✓ las ${rls.length} tablas del módulo tienen RLS`
        : `\n  ✗ SIN RLS: ${sinRls.join(", ")}`);
      if (sinRls.length > 0) faltan++;
    }

    console.log(faltan === 0
      ? "\n✓ Todas las migraciones del módulo docente están puestas"
      : `\n· Faltan ${faltan} por aplicar en esta base de datos`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });

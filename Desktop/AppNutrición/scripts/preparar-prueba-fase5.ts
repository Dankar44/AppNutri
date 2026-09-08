/**
 * Deja el entorno montado para mirar a mano lo de la fase 5: descargar notas, la comparativa, los
 * avisos y la separación de espacios.
 *
 * Monta la clase con `preparar-prueba-docente` y, encima, hace de alumna: empieza el caso, le pone
 * comida al plan y entrega de verdad por la interfaz —para que la foto de la entrega la genere la
 * aplicación, no un INSERT—. Luego deja una nota puesta sin publicar y el plazo vencido, que es lo
 * que dispara el aviso al profesor.
 *
 *   1. npm run dev:desarrollo        (puerto 3001)
 *   2. DB=dev npx tsx scripts/preparar-prueba-fase5.ts
 */
import "./_guard-solo-dev";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";
import puppeteer, { type Page } from "puppeteer-core";
import { createClient } from "@supabase/supabase-js";
import { execFileSync } from "node:child_process";

const BASE = "http://localhost:3001";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PROFE = { email: "profesor.prueba@annonia.dev", pass: "ProfesorPrueba2026" };
const ALUMNA = { email: "alumna.prueba@annonia.dev", pass: "AlumnaPrueba2026" };
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: false } });

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));
/** Pulsa por texto, sea botón o enlace: en el aula las clases son enlaces y los casos, botones. */
const pulsar = (page: Page, txt: string) => page.evaluate((t) => {
  const todos = Array.from(document.querySelectorAll("button, a"));
  const encontrados = todos.filter((x) => x.textContent?.trim().includes(t));
  (encontrados[encontrados.length - 1] as HTMLElement | undefined)?.click();
}, txt);

async function main() {
  console.log("\n  Montando la clase de cero…");
  execFileSync("npx", ["tsx", "scripts/preparar-prueba-docente.ts"], {
    stdio: "ignore", env: { ...process.env, DB: "dev" },
  });

  const client = await pool.connect();
  const navegador = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] });
  try {
    const { rows: ids } = await client.query(
      `SELECT (SELECT id FROM dietistas WHERE email = $1) AS alumna,
              (SELECT id FROM dietistas WHERE email = $2) AS profe,
              (SELECT a.id FROM asignaciones_caso a JOIN clases c ON c.id = a."claseId"
                 JOIN dietistas d ON d.id = c."profesorId" WHERE d.email = $2 LIMIT 1) AS asignacion`,
      [ALUMNA.email, PROFE.email]);
    const { alumna: alumnaId, asignacion: asignacionId } = ids[0];

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const sb = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
    const { data, error } = await sb.auth.signInWithPassword({ email: ALUMNA.email, password: ALUMNA.pass });
    if (error) throw new Error(`login de la alumna: ${error.message}`);
    const page = await (await navegador.createBrowserContext()).newPage();
    await page.setViewport({ width: 1440, height: 950 });
    await page.evaluateOnNewDocument(() => { try { localStorage.setItem("annonia-welcome-dietista", "1"); } catch { /* ignore */ } });
    await page.setCookie({
      name: `sb-${url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1]}-auth-token`,
      value: "base64-" + Buffer.from(JSON.stringify(data.session)).toString("base64"),
      domain: "localhost", path: "/",
    });

    console.log("  La alumna empieza el caso…");
    await page.goto(`${BASE}/aula`, { waitUntil: "networkidle0" });
    await esperar(1500);
    await pulsar(page, "Dietoterapia 3º A");
    await esperar(2000);
    await pulsar(page, "Empezar el caso");
    await esperar(4500);
    if (page.url().includes("/aula")) {
      // Si la clase no se abrió con un clic, se entra por la dirección directa.
      const clase = await page.evaluate(() =>
        (document.querySelector('a[href*="/aula/"]') as HTMLAnchorElement | null)?.getAttribute("href") ?? "");
      if (clase) {
        await page.goto(`${BASE}${clase}`, { waitUntil: "networkidle0" });
        await esperar(2000);
        await pulsar(page, "Empezar el caso");
        await esperar(4500);
      }
    }

    const { rows: copia } = await client.query(
      `SELECT id FROM pacientes WHERE "dietistaId" = $1 AND "esDeClase" = true LIMIT 1`, [alumnaId]);
    if (!copia.length) throw new Error("la alumna no llegó a empezar el caso");
    const copiaId = copia[0].id as string;

    console.log("  Le pone un plan con comida de verdad…");
    const { rows: plani } = await client.query(
      `INSERT INTO planificaciones (id, "pacienteId", "dietistaId", nombre, datos, "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, 'Mi planificación', '{"kcalObjetivo":1900}', NOW(), NOW())
       RETURNING id`, [copiaId, alumnaId]);
    const { rows: plan } = await client.query(
      `INSERT INTO planes_alimenticios (id, "pacienteId", "dietistaId", nombre, "planificacionIds",
              activo, "caloriasObjetivo", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, 'Plan de la alumna', ARRAY[$3]::text[], true, 1900, NOW(), NOW())
       RETURNING id`, [copiaId, alumnaId, plani[0].id]);
    for (const dia of ["LUNES", "MARTES", "MIERCOLES"]) {
      const { rows: d } = await client.query(
        `INSERT INTO dias_del_plan (id, "planId", dia) VALUES (gen_random_uuid()::text, $1, $2::"DiaSemana") RETURNING id`,
        [plan[0].id, dia]);
      for (const comida of ["DESAYUNO", "ALMUERZO", "CENA"]) {
        const { rows: c } = await client.query(
          `INSERT INTO comidas_del_dia (id, "diaId", tipo, orden) VALUES (gen_random_uuid()::text, $1, $2::"TipoComida", 0) RETURNING id`,
          [d[0].id, comida]);
        await client.query(
          `INSERT INTO alimentos_en_comida (id, "comidaId", "alimentoId", cantidad, unidad, orden)
           SELECT gen_random_uuid()::text, $1, a.id, 120, 'GRAMOS', row_number() OVER ()
             FROM (SELECT id FROM alimentos WHERE calorias > 80 ORDER BY random() LIMIT 3) a`,
          [c[0].id]);
      }
    }

    console.log("  Y entrega el caso por la interfaz…");
    await page.goto(`${BASE}/pacientes/${copiaId}`, { waitUntil: "networkidle0" });
    await esperar(3000);
    await pulsar(page, "Entregar");
    await esperar(1500);
    await pulsar(page, "Entregar");
    await esperar(1200);
    await pulsar(page, "Entregar");
    await esperar(7000);

    const { rows: entrega } = await client.query(
      `SELECT id, "entregaSnapshot" IS NOT NULL AS foto FROM entregas_caso WHERE "asignacionId" = $1`, [asignacionId]);
    if (!entrega.length || !entrega[0].foto) throw new Error("la entrega no llegó a hacerse");

    // Una nota puesta pero SIN publicar: así se ve el botón de publicar y el acta ya tiene datos.
    await client.query(
      `UPDATE entregas_caso SET estado = 'CORREGIDA', nota = 7.5,
              comentario = 'Bien planteado; ajusta el hierro en la cena.', "visibleParaAlumno" = false
        WHERE id = $1`, [entrega[0].id]);
    // Y el plazo vencido, que es lo que dispara el aviso al profesor cuando entre.
    await client.query(
      `UPDATE asignaciones_caso SET "fechaLimite" = CURRENT_DATE - 1, "avisoPlazoAt" = NULL WHERE id = $1`,
      [asignacionId]);
    await client.query(`DELETE FROM notificaciones WHERE "dietistaId" = $1`, [ids[0].profe]);
    // Un aviso de la consulta, para poder ver que NO se mezcla con los de docencia.
    await client.query(
      `INSERT INTO notificaciones (id, "dietistaId", tipo, titulo, mensaje, leida, "createdAt")
       VALUES (gen_random_uuid()::text, $1, 'PACIENTE_SIN_CONSULTA', 'Paciente sin consulta',
               'Hace 30 días que no ves a este paciente', false, NOW())`, [ids[0].profe]);

    console.log(`
  Listo. Entra en ${BASE}/login

    PROFESOR   ${PROFE.email}   /  ${PROFE.pass}
    ALUMNA     ${ALUMNA.email}  /  ${ALUMNA.pass}

  La alumna ya ha entregado el caso, tiene un 7,5 sin publicar, el plazo venció ayer y el profesor
  tiene un aviso de su consulta esperando (para ver que no se mezcla con los de docencia).
`);
  } finally {
    client.release();
    await navegador.close();
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });

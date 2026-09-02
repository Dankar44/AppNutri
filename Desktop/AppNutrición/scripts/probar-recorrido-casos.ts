/**
 * #40 — El recorrido entero de un caso, como lo haría un profesor y su alumna: con clics, no con
 * direcciones a mano. Deja una captura de cada pantalla en /tmp/annonia-recorrido para mirarlas.
 * Necesita el estado de `preparar-prueba-docente.ts` (lo deja hecho, sin empezar el caso).
 */
import "./_guard-solo-dev";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";
import { mkdirSync } from "node:fs";
import puppeteer, { type Page } from "puppeteer-core";
import { createClient } from "@supabase/supabase-js";

const BASE = "http://localhost:3001";
const DIR = "/tmp/annonia-recorrido";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: false } });
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));
let ok = 0, mal = 0;
const comprobar = (t: string, c: boolean, d = "") => { console.log(`  ${c ? "✓" : "✗"} ${t}${d ? ` — ${d}` : ""}`); c ? ok++ : mal++; };
const texto = (p: Page) => p.evaluate(() => document.body.innerText);
const menu = (p: Page) => p.evaluate(() => (document.querySelector("aside") as HTMLElement | null)?.innerText ?? "");
async function pulsar(p: Page, tx: string, dentroDe?: string) {
  const hecho = await p.evaluate((t, ambito) => {
    const raiz = ambito ? document.querySelector(ambito) : document;
    if (!raiz) return false;
    const n = Array.from(raiz.querySelectorAll("button, a, summary")).find((x) => x.textContent?.trim().startsWith(t));
    if (!n) return false;
    (n as HTMLElement).click();
    return true;
  }, tx, dentroDe);
  if (!hecho) console.log(`  (no encontré «${tx}»)`);
  return hecho;
}
async function escribir(p: Page, selector: string, valor: string) {
  await p.evaluate((sel, v) => {
    const c = document.querySelector(sel) as HTMLInputElement | HTMLTextAreaElement | null;
    if (!c) return;
    const proto = c.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value")!.set!.call(c, v);
    c.dispatchEvent(new Event("input", { bubbles: true }));
    c.dispatchEvent(new Event("change", { bubbles: true }));
  }, selector, valor);
}

async function main() {
  mkdirSync(DIR, { recursive: true });
  const client = await pool.connect();
  const navegador = await puppeteer.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true, args: ["--no-sandbox"],
  });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const sb = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
  const abrir = async (email: string, pass: string, ancho = 1440) => {
    const { data, error } = await sb.auth.signInWithPassword({ email, password: pass });
    if (error) throw new Error(`${email}: ${error.message}`);
    const p = await (await navegador.createBrowserContext()).newPage();
    await p.setViewport({ width: ancho, height: ancho < 500 ? 800 : 950 });
    await p.evaluateOnNewDocument(() => {
      try { localStorage.setItem("annonia-welcome-dietista", "1"); localStorage.setItem("annonia-cookie-consent", "rejected"); } catch {}
    });
    await p.setCookie({
      name: `sb-${url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1]}-auth-token`,
      value: "base64-" + Buffer.from(JSON.stringify(data.session)).toString("base64"),
      domain: "localhost", path: "/",
    });
    return p;
  };
  let n = 0;
  const foto = async (p: Page, nombre: string) => {
    await esperar(1200);
    n++;
    const f = `${String(n).padStart(2, "0")}-${nombre}.png`;
    await p.screenshot({ path: `${DIR}/${f}` as `${string}.png`, fullPage: true });
    console.log(`  📷 ${f}`);
  };

  try {
    const { rows: prof } = await client.query(`SELECT id FROM dietistas WHERE email = 'profesor.prueba@annonia.dev'`);
    const { rows: alu } = await client.query(`SELECT id FROM dietistas WHERE email = 'alumna.prueba@annonia.dev'`);
    const { rows: caso } = await client.query(
      `SELECT id, "pacienteId", "licenciaDocenteId" FROM casos_clinicos WHERE "profesorId" = $1 ORDER BY "createdAt" DESC LIMIT 1`, [prof[0].id]);
    const { rows: cl } = await client.query(`SELECT id FROM clases WHERE "profesorId" = $1 AND nombre = 'Dietoterapia 3º A' LIMIT 1`, [prof[0].id]);
    const casoId = caso[0].id, plantillaId = caso[0].pacienteId, claseId = cl[0].id;
    await client.query(`DELETE FROM clases WHERE "profesorId" = $1 AND nombre = 'Nutrición Clínica 2º B'`, [prof[0].id]);

    console.log("\n── PROFESOR: la ficha del caso ──");
    const profe = await abrir("profesor.prueba@annonia.dev", "ProfesorPrueba2026");
    await profe.goto(`${BASE}/profesor/casos`, { waitUntil: "networkidle0" });
    await foto(profe, "profesor-casos");
    await pulsar(profe, "Caso 3");
    await esperar(2500);
    comprobar("entra en el caso", profe.url().includes(`/profesor/casos/${casoId}`), profe.url());
    let v = await texto(profe);
    comprobar("ve la consigna", v.includes("Qué les pides") && v.includes("hierro"));
    comprobar("la clase está dentro del caso, con la alumna", v.includes("Asignado a 1 clase") && v.includes("Dietoterapia 3º A") && v.includes("Alumna de prueba"));
    comprobar("y su plazo junto a la clase", /Fecha límite: \d\d\/\d\d\/\d{4}/.test(v));
    comprobar("no existe ya la pantalla aparte de entregas", !v.includes("Cambiar la fecha límite"));
    await foto(profe, "profesor-caso");

    console.log("\n── Cambia el plazo ahí mismo ──");
    await pulsar(profe, "Fecha límite:");
    await esperar(600);
    await escribir(profe, "input[placeholder='dd/mm/aaaa']", "20/09/2026");
    await pulsar(profe, "Guardar", "form");
    await esperar(3500);
    v = await texto(profe);
    comprobar("el plazo cambia", v.includes("Fecha límite: 20/09/2026") && v.includes("Hasta el 20/09/2026"),
      v.split("\n").filter((l) => /09\/2026/.test(l)).join(" | "));
    await foto(profe, "profesor-plazo-cambiado");

    console.log("\n── Abre la ficha del paciente del caso ──");
    await pulsar(profe, "Abrir la ficha de Marta Vegana");
    await esperar(3500);
    comprobar("aterriza en la ficha del paciente", profe.url().includes(`/pacientes/${plantillaId}`), profe.url());
    v = await texto(profe);
    comprobar("con el aviso nuevo", v.includes("lo verán tus alumnos tal cual al empezar el caso"));
    comprobar("y el interruptor del plan, apagado", v.includes("Darles hecha la planificación") && v.includes("Apagado:"));
    comprobar("sin la frase de «el plan lo hacen ellos»", !v.includes("lo hacen ellos"));
    comprobar("dice a qué clase está asignado y hasta cuándo", v.includes("Asignado a 1 clase") && v.includes("Hasta el 20/09/2026"));
    comprobar("con Planificación y Plan de alimentación", v.includes("Planificación") && v.includes("Plan de alimentación"));
    comprobar("sin Portal del paciente", !v.includes("Portal del paciente"));
    comprobar("sin Desactivar ni Nueva cita", !v.includes("Desactivar") && !v.includes("Nueva cita"));
    comprobar("el menú marca Casos", await profe.evaluate(() =>
      Array.from(document.querySelectorAll("aside a")).some((a) => a.textContent?.trim() === "Casos" && a.className.includes("bg-sidebar-accent"))));
    await foto(profe, "profesor-ficha-plantilla");

    console.log("\n── Planificación y plan, para dárselos hechos ──");
    await pulsar(profe, "Planificación");
    await esperar(3500);
    comprobar("la pestaña Planificación abre", profe.url().includes("pestana=planificacion"), profe.url());
    comprobar("y sigue en el espacio docente", (await menu(profe)).includes("Clases"));
    await foto(profe, "profesor-planificacion");
    await profe.goto(`${BASE}/pacientes/${plantillaId}?pestana=plan-alimentacion&espacio=docente`, { waitUntil: "networkidle0" });
    await esperar(1500);
    await foto(profe, "profesor-plan-vacio");
    await pulsar(profe, "Crear primera dieta");
    await esperar(3500);
    comprobar("va a crear la dieta", profe.url().includes("/dietas/nuevo"), profe.url());
    comprobar("sin perder el menú docente", (await menu(profe)).includes("Clases"), (await menu(profe)).split("\n").slice(0, 8).join("/"));
    v = await texto(profe);
    comprobar("con Marta ya elegida", v.includes("Marta Vegana"));
    await escribir(profe, "input[name=nombre]", "Plan base del caso");
    await esperar(400);
    await foto(profe, "profesor-nueva-dieta");
    await pulsar(profe, "Crear plan");
    await esperar(6000);
    const { rows: planProfe } = await client.query(`SELECT id, nombre FROM planes_alimenticios WHERE "pacienteId" = $1`, [plantillaId]);
    comprobar("el plan se crea en la plantilla", planProfe.length === 1, `${planProfe.length} planes · ${profe.url()}`);
    comprobar("y al volver sigue en el espacio docente", (await menu(profe)).includes("Clases"), profe.url());
    await foto(profe, "profesor-tras-crear-plan");
    // Un día con una comida y un alimento, como lo dejaría a medias
    if (planProfe[0]) {
      const { rows: ali } = await client.query(`SELECT id FROM alimentos WHERE "dietistaId" IS NULL AND nombre ILIKE 'lentejas%' LIMIT 1`);
      // crearPlan ya deja los siete días creados: se usa el lunes que hay.
      const { rows: dia } = await client.query(
        `SELECT id FROM dias_del_plan WHERE "planId" = $1 AND dia = 'LUNES'`, [planProfe[0].id]);
      await client.query(`INSERT INTO comidas_del_dia (id, "diaId", tipo, orden) VALUES ('recorrido-comida', $1, 'ALMUERZO', 0)
                          ON CONFLICT (id) DO NOTHING`, [dia[0].id]);
      await client.query(`INSERT INTO alimentos_en_comida (id, "comidaId", "alimentoId", cantidad, unidad, orden)
                          VALUES ('recorrido-ali', 'recorrido-comida', $1, 150, 'GRAMOS', 0) ON CONFLICT (id) DO NOTHING`, [ali[0]?.id]);
    }

    console.log("\n── Asigna a otra clase desde la ficha ──");
    await client.query(
      `INSERT INTO clases (id, "profesorId", "licenciaDocenteId", nombre, curso, "fechaFinCurso", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, 'Nutrición Clínica 2º B', '2026/27', '2027-06-30', NOW(), NOW())`,
      [prof[0].id, caso[0].licenciaDocenteId]);
    await client.query(
      `INSERT INTO profesores_clase (id, "claseId", "profesorId", "createdAt", "updatedAt")
       SELECT gen_random_uuid()::text, id, $1, NOW(), NOW() FROM clases WHERE nombre = 'Nutrición Clínica 2º B' AND "profesorId" = $1`, [prof[0].id]);
    await profe.goto(`${BASE}/pacientes/${plantillaId}?espacio=docente`, { waitUntil: "networkidle0" });
    await esperar(1500);
    comprobar("ahora sí hay botón de asignar en la ficha", (await texto(profe)).includes("Asignar a una clase"));
    await pulsar(profe, "Asignar a una clase");
    await esperar(700);
    await foto(profe, "profesor-asignar-desde-ficha");
    await profe.evaluate(() => {
      const s = document.querySelector("select") as HTMLSelectElement | null;
      if (s && s.options.length > 1) {
        Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")!.set!.call(s, s.options[1].value);
        s.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
    await escribir(profe, "input[placeholder='dd/mm/aaaa']", "15/10/2026");
    await pulsar(profe, "Asignar", "form");
    await esperar(4000);
    v = await texto(profe);
    comprobar("queda en las dos clases", v.includes("Asignado a 2 clases") && v.includes("Nutrición Clínica 2º B") && v.includes("Hasta el 15/10/2026"),
      v.split("\n").find((l) => l.includes("Asignado a")) ?? "");
    await foto(profe, "profesor-asignado-a-dos");

    console.log("\n── Desde la clase, el caso abre el paciente y se vuelve ──");
    await profe.goto(`${BASE}/profesor/clases/${claseId}`, { waitUntil: "networkidle0" });
    await esperar(1500);
    v = await texto(profe);
    comprobar("la clase lista el caso con su paciente y su progreso", v.includes("Caso 3") && v.includes("Marta Vegana") && v.includes("0 de 1 han entregado"));
    await foto(profe, "profesor-clase");
    await pulsar(profe, "Caso 3");
    await esperar(3500);
    comprobar("el caso abre la ficha del paciente", profe.url().includes(`/pacientes/${plantillaId}`), profe.url());
    comprobar("con «Volver a la clase»", (await texto(profe)).includes("Volver a la clase"));
    await pulsar(profe, "Volver a la clase");
    await esperar(2500);
    comprobar("y vuelve a la clase", profe.url().includes(`/profesor/clases/${claseId}`), profe.url());
    await pulsar(profe, "Ver entregas");
    await esperar(2500);
    comprobar("«Ver entregas» lleva al caso con esa clase abierta", profe.url().includes(`/profesor/casos/${casoId}?clase=`), profe.url());
    await foto(profe, "profesor-caso-dos-clases");

    console.log("\n── ALUMNA: empieza el caso ──");
    const alumna = await abrir("alumna.prueba@annonia.dev", "AlumnaPrueba2026");
    await alumna.goto(`${BASE}/aula`, { waitUntil: "networkidle0" });
    await foto(alumna, "alumna-aula");
    await pulsar(alumna, "Dietoterapia 3º A");
    await esperar(2500);
    v = await texto(alumna);
    comprobar("dentro de la clase ve el caso y el plazo nuevo", v.includes("Caso 3") && v.includes("Entrega antes del 20/09/2026"));
    await foto(alumna, "alumna-clase");
    await pulsar(alumna, "Empezar el caso");
    await esperar(7000);
    const { rows: suPac } = await client.query(`SELECT id FROM pacientes WHERE "dietistaId" = $1 AND "esDeClase" = true`, [alu[0].id]);
    comprobar("se le crea su paciente y aterriza en él", suPac.length === 1 && alumna.url().includes(`/pacientes/${suPac[0]?.id}`), alumna.url());
    v = await texto(alumna);
    comprobar("con la consigna y el botón de entregar arriba", v.includes("hierro") && v.includes("Entregar"));
    comprobar("NO ve el plan del profesor: es su solución y no se comparte por defecto", !v.includes("Plan base del caso"));
    comprobar("y tiene todo lo demás (anamnesis, mediciones, portal…)", v.includes("Anamnesis") && v.includes("Mediciones") && v.includes("Portal del paciente"));
    await foto(alumna, "alumna-ficha");
    await alumna.goto(`${BASE}/pacientes/${suPac[0].id}?pestana=plan-alimentacion&espacio=aula`, { waitUntil: "networkidle0" });
    await esperar(2500);
    v = await texto(alumna);
    comprobar("su Plan de alimentación está vacío, para que lo haga ella", !v.includes("Plan base del caso"));
    const { rows: copia } = await client.query(
      `SELECT (SELECT COUNT(*)::int FROM planes_alimenticios WHERE "pacienteId" = $1) AS planes,
              (SELECT COUNT(*)::int FROM planificaciones WHERE "pacienteId" = $1) AS planis`, [suPac[0].id]);
    comprobar("ni planes ni planificación copiados", copia[0]?.planes === 0 && copia[0]?.planis === 0, JSON.stringify(copia[0]));
    const { rows: delProfe } = await client.query(`SELECT COUNT(*)::int n FROM planes_alimenticios WHERE "pacienteId" = $1`, [plantillaId]);
    comprobar("y el plan del profesor sigue siendo suyo", delProfe[0].n === 1);
    comprobar("y el menú sigue siendo el del aula", (await menu(alumna)).includes("Mis clases"));
    await foto(alumna, "alumna-plan-copiado");

    console.log("\n── Entrega con nota ──");
    await alumna.goto(`${BASE}/aula/${claseId}`, { waitUntil: "networkidle0" });
    await esperar(1500);
    await pulsar(alumna, "Entregar");
    await esperar(700);
    await escribir(alumna, "textarea", "He cubierto el hierro con lentejas y he añadido vitamina C.");
    comprobar("sin plan, el cuadro avisa de que irá sin PDF", (await texto(alumna)).includes("la entrega irá sin PDF"));
    await pulsar(alumna, "Entregar", "form");
    await esperar(6000);
    v = await texto(alumna);
    comprobar("queda entregada, con la hora, y puede deshacer o volver a entregar",
      v.includes("Entregada") && /\d\d\/\d\d\/\d{4}, \d\d:\d\d/.test(v) && v.includes("Deshacer la entrega") && v.includes("Volver a entregar"),
      v.split("\n").filter((l) => /Entregada|\d\d:\d\d|entregar/.test(l)).join(" | "));
    await foto(alumna, "alumna-entregado");

    console.log("\n── PROFESOR: corrige ──");
    await profe.goto(`${BASE}/profesor/casos/${casoId}?clase=${(await client.query(`SELECT id FROM asignaciones_caso WHERE "casoId"=$1 AND "claseId"=$2`, [casoId, claseId])).rows[0].id}`, { waitUntil: "networkidle0" });
    await esperar(1500);
    v = await texto(profe);
    comprobar("ve a la alumna como entregada, sin plan todavía", v.includes("Entregada") && v.includes("sin plan todavía"), v.split("\n").filter((l) => l.includes("Entregada")).join(" | "));
    await foto(profe, "profesor-entregada");
    await pulsar(profe, "Alumna de prueba");
    await esperar(3500);
    v = await texto(profe);
    comprobar("abre su trabajo: nota y paciente (sin plan, que no hizo ninguno)", v.includes("lentejas") && v.includes("Marta Vegana") && v.includes("Todavía no ha hecho ningún plan"));
    comprobar("se le dice que entregó sin PDF", v.includes("Entregó sin PDF"));
    comprobar("y ve la sección de planificación", v.includes("Planificación"));
    await foto(profe, "profesor-trabajo-alumna");
    await escribir(profe, "input[type=number], input[inputmode=decimal]", "9");
    await escribir(profe, "textarea", "Muy bien el hierro; revisa la B12.");
    await profe.evaluate(() => { const c = document.querySelector("input[type=checkbox]") as HTMLInputElement | null; if (c && !c.checked) c.click(); });
    await pulsar(profe, "Guardar la corrección");
    await esperar(4000);
    const { rows: corr } = await client.query(`SELECT estado, nota, "visibleParaAlumno" FROM entregas_caso WHERE "alumnoId" = $1`, [alu[0].id]);
    comprobar("queda corregida con un 9, visible", corr[0]?.estado === "CORREGIDA" && Number(corr[0]?.nota) === 9 && corr[0]?.visibleParaAlumno === true, JSON.stringify(corr[0]));
    await foto(profe, "profesor-corregido");

    console.log("\n── ALUMNA: ve la nota ──");
    await alumna.goto(`${BASE}/aula/${claseId}`, { waitUntil: "networkidle0" });
    await esperar(1500);
    v = await texto(alumna);
    comprobar("ve la nota y el comentario", /\b9\b/.test(v) && v.includes("B12"), v.split("\n").filter((l) => /B12|Corregida/.test(l)).join(" | "));
    await foto(alumna, "alumna-nota");

    console.log("\n── Móvil ──");
    const movil = await abrir("profesor.prueba@annonia.dev", "ProfesorPrueba2026", 390);
    await movil.goto(`${BASE}/profesor/casos/${casoId}`, { waitUntil: "networkidle0" });
    await foto(movil, "movil-caso");
    await movil.goto(`${BASE}/pacientes/${plantillaId}?espacio=docente`, { waitUntil: "networkidle0" });
    await foto(movil, "movil-ficha-plantilla");
  } finally {
    client.release();
    await navegador.close();
    await pool.end();
  }
  console.log(`\n${mal === 0 ? "✓" : "✗"} ${ok} bien, ${mal} mal · capturas en ${DIR}`);
}
main().catch((e) => { console.error(e); process.exit(1); });

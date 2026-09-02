/**
 * #40 — Casos clínicos, de punta a punta.
 *
 * El profesor crea un caso, lo asigna a su clase; la alumna lo abre (y se le crea su paciente),
 * lo entrega; el profesor ve su trabajo y le pone nota. Lo que más se vigila: que el caso NO se
 * mezcle con los pacientes reales de nadie, y que la nota no se vea hasta que el profesor quiere.
 *
 *   1. npm run dev:desarrollo        (puerto 3001)
 *   2. DB=dev npx tsx scripts/probar-casos-clinicos.ts
 */
import "./_guard-solo-dev";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";
import puppeteer, { type Page, type Browser } from "puppeteer-core";
import { createClient } from "@supabase/supabase-js";

const BASE = "http://localhost:3001";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: false } });
const MARCA = "PRUEBACASO";
const DOMINIO = "pruebacaso.dev";
const PASS = "Casos_2026_Prueba";

let ok = 0, mal = 0;
const comprobar = (t: string, c: boolean, d = "") => { console.log(`  ${c ? "✓" : "✗"} ${t}${d ? ` — ${d}` : ""}`); c ? ok++ : mal++; };
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));
const texto = (page: Page) => page.evaluate(() => document.body.innerText);

async function pulsar(page: Page, tx: string, dentroDe?: string) {
  const hecho = await page.evaluate((t, ambito) => {
    const raiz = ambito ? document.querySelector(ambito) : document;
    if (!raiz) return false;
    const n = Array.from(raiz.querySelectorAll("button, a")).find((x) => x.textContent?.trim().startsWith(t));
    if (!n) return false;
    (n as HTMLElement).click();
    return true;
  }, tx, dentroDe ?? null);
  if (!hecho) throw new Error(`botón "${tx}" no encontrado`);
}

async function rellenar(page: Page, etiqueta: string, valor: string) {
  const hecho = await page.evaluate((tx, v) => {
    // Exacto primero: "Nombre" y "Nombre del caso" conviven en el mismo formulario, y buscar por
    // "empieza por" rellenaba el campo equivocado sin decir nada.
    const etiquetas = Array.from(document.querySelectorAll("label"));
    const l = etiquetas.find((x) => x.textContent?.trim() === tx)
      ?? etiquetas.find((x) => x.textContent?.trim().startsWith(tx));
    const c = (l?.parentElement?.querySelector("input, textarea, select")) as HTMLInputElement | null;
    if (!c) return false;
    const proto = c.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype
      : c.tagName === "SELECT" ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value")!.set!.call(c, v);
    c.dispatchEvent(new Event(c.tagName === "SELECT" ? "change" : "input", { bubbles: true }));
    return true;
  }, etiqueta, valor);
  if (!hecho) throw new Error(`campo "${etiqueta}" no encontrado`);
}

async function crearCuenta(client: pg.PoolClient, email: string, apellidos: string, extra: Record<string, unknown> = {}) {
  const { rows: u } = await client.query(
    `INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
       created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous,
       confirmation_token, recovery_token, email_change_token_new, email_change,
       email_change_token_current, reauthentication_token, phone_change, phone_change_token)
     VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
       $1, crypt($2, gen_salt('bf')), NOW(), NOW(), NOW(),
       '{"provider":"email","providers":["email"]}', '{}'::jsonb, false, false, '','','','','','','','')
     RETURNING id`, [email, PASS]);
  const authId = u[0].id as string;
  await client.query(
    `INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
     VALUES (gen_random_uuid(), $1::uuid, $1::text, 'email',
       jsonb_build_object('sub',$1::text,'email',$2::text,'email_verified',true,'provider','email'), NOW(), NOW(), NOW())`,
    [authId, email]);
  const campos = Object.keys(extra);
  const { rows } = await client.query(
    `INSERT INTO dietistas (id, "authId", email, nombre, apellidos, verificado, "createdAt", "updatedAt"${campos.map((c) => `, "${c}"`).join("")})
     VALUES (gen_random_uuid()::text, $1, $2, '${MARCA}', $3, true, NOW(), NOW()${campos.map((_, i) => `, $${4 + i}`).join("")}) RETURNING id`,
    [authId, email, apellidos, ...campos.map((c) => extra[c])]);
  return rows[0].id as string;
}

async function sesionDe(navegador: Browser, email: string): Promise<Page> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const sb = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
  const { data, error } = await sb.auth.signInWithPassword({ email, password: PASS });
  if (error) throw new Error(`login de ${email}: ${error.message}`);
  const page = await (await navegador.createBrowserContext()).newPage();
  await page.setViewport({ width: 1440, height: 950 });
  await page.evaluateOnNewDocument(() => { try { localStorage.setItem("annonia-welcome-dietista", "1"); } catch { /* ignore */ } });
  await page.setCookie({
    name: `sb-${url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1]}-auth-token`,
    value: "base64-" + Buffer.from(JSON.stringify(data.session)).toString("base64"),
    domain: "localhost", path: "/",
  });
  return page;
}

async function limpiar(client: pg.PoolClient) {
  await client.query(`DELETE FROM casos_clinicos WHERE nombre LIKE '${MARCA}%'`);
  await client.query(`DELETE FROM clases WHERE nombre LIKE '${MARCA}%'`);
  const { rows } = await client.query(`SELECT id FROM auth.users WHERE email LIKE '%@${DOMINIO}'`);
  for (const r of rows) {
    await client.query(`DELETE FROM dietistas WHERE "authId" = $1`, [r.id]);
    await client.query(`DELETE FROM auth.identities WHERE user_id = $1::uuid`, [r.id]);
    await client.query(`DELETE FROM auth.users WHERE id = $1::uuid`, [r.id]);
  }
  await client.query(`DELETE FROM licencias_docentes WHERE institucion LIKE '${MARCA}%'`);
}

async function main() {
  const client = await pool.connect();
  const navegador = await puppeteer.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true, args: ["--no-sandbox"],
  });
  try {
    await limpiar(client);
    const { rows: lic } = await client.query(
      `INSERT INTO licencias_docentes (id, institucion, "maxProfesores", "maxAlumnos", curso, "fechaFin", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, '${MARCA} Universidad', 3, 20, '2026/27', '2027-08-31', NOW(), NOW()) RETURNING id`);
    const licenciaId = lic[0].id as string;
    const profesorId = await crearCuenta(client, `profe@${DOMINIO}`, "Marín",
      { rolDocente: "PROFESOR", licenciaDocenteId: licenciaId });
    const { rows: cl } = await client.query(
      `INSERT INTO clases (id, "profesorId", "licenciaDocenteId", nombre, curso, "fechaFinCurso", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, '${MARCA} Dietoterapia', '2026/27', '2027-08-31', NOW(), NOW()) RETURNING id`,
      [profesorId, licenciaId]);
    const claseId = cl[0].id as string;
    await client.query(
      `INSERT INTO profesores_clase (id, "claseId", "profesorId", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, NOW(), NOW())`, [claseId, profesorId]);
    const alumnaId = await crearCuenta(client, `alumna@${DOMINIO}`, "Alonso",
      { rolDocente: "ALUMNO", licenciaDocenteId: licenciaId, cuentaDeClase: true });
    await client.query(
      `INSERT INTO alumnos_clase (id, "claseId", "alumnoId", "altaAt") VALUES (gen_random_uuid()::text, $1, $2, NOW())`,
      [claseId, alumnaId]);

    console.log("\n── El profesor crea el caso ──");
    const profe = await sesionDe(navegador, `profe@${DOMINIO}`);
    await profe.goto(`${BASE}/profesor/casos`, { waitUntil: "networkidle0" });
    await esperar(1200);
    comprobar("el estado vacío se explica", (await texto(profe)).includes("Todavía no has creado ningún caso"));
    await pulsar(profe, "Nuevo caso");
    await esperar(2000);
    await rellenar(profe, "Nombre del caso", `${MARCA} Mujer vegana con anemia`);
    await rellenar(profe, "Qué les pides", "Cubre el hierro con alimentos vegetales.");
    await rellenar(profe, "Nombre", "Marta");
    await rellenar(profe, "Apellidos", "Vegana");
    await rellenar(profe, "Peso", "58");
    await rellenar(profe, "Altura", "165");
    await rellenar(profe, "Historia y motivo", "Mujer de 28 años, vegana desde hace tres. Ferritina baja.");
    await rellenar(profe, "Patologías", "Anemia ferropénica");
    await pulsar(profe, "Crear el caso");
    await esperar(4000);
    const { rows: creado } = await client.query(
      `SELECT id, nombre, "pacienteNombre", peso, patologias, "profesorId" FROM casos_clinicos WHERE nombre LIKE '${MARCA}%'`);
    comprobar("se crea el caso", creado.length === 1, `${creado.length}`);
    comprobar("con su paciente inventado", creado[0]?.pacienteNombre === "Marta");
    comprobar("con sus datos", Number(creado[0]?.peso) === 58);
    comprobar("y sus patologías", creado[0]?.patologias?.[0] === "Anemia ferropénica");
    const casoId = creado[0].id as string;

    console.log("\n── Y NO aparece entre sus pacientes ──");
    await profe.goto(`${BASE}/pacientes`, { waitUntil: "networkidle0" });
    await esperar(1500);
    comprobar("el caso no está en la lista de pacientes del profesor",
      !(await texto(profe)).includes("Marta Vegana"));

    console.log("\n── Lo asigna a su clase ──");
    await profe.goto(`${BASE}/profesor/casos/${casoId}`, { waitUntil: "networkidle0" });
    await esperar(1500);
    await pulsar(profe, "Asignar a una clase");
    await esperar(600);
    await profe.evaluate(() => {
      const s = document.querySelector("select") as HTMLSelectElement | null;
      if (s && s.options.length > 1) {
        Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")!.set!.call(s, s.options[1].value);
        s.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
    await rellenar(profe, "Fecha límite", "2027-06-30");
    await pulsar(profe, "Asignar", "form");
    await esperar(4000);
    const { rows: asig } = await client.query(
      `SELECT id, "fechaLimite" FROM asignaciones_caso WHERE "casoId" = $1`, [casoId]);
    comprobar("queda asignado a la clase", asig.length === 1);
    comprobar("con su fecha límite", asig[0]?.fechaLimite !== null,
      String(asig[0]?.fechaLimite)?.slice(0, 10));

    console.log("\n── La alumna lo ve en su aula ──");
    const alumna = await sesionDe(navegador, `alumna@${DOMINIO}`);
    await alumna.goto(`${BASE}/aula`, { waitUntil: "networkidle0" });
    await esperar(1800);
    let visible = await texto(alumna);
    comprobar("le sale el caso", visible.includes("Mujer vegana con anemia"));
    comprobar("con el paciente y su clase", visible.includes("Marta Vegana") && visible.includes("Dietoterapia"));
    comprobar("y la fecha de entrega", /Entrega antes del/.test(visible));
    comprobar("todavía no tiene paciente creado",
      (await client.query(`SELECT COUNT(*)::int n FROM pacientes WHERE "dietistaId" = $1 AND "esDeClase" = true`, [alumnaId])).rows[0].n === 0);

    console.log("\n── Al empezarlo se le crea SU paciente ──");
    await pulsar(alumna, "Empezar el caso");
    await esperar(6000);
    const { rows: pac } = await client.query(
      `SELECT id, nombre, apellidos, peso, "esDeClase", notas FROM pacientes WHERE "dietistaId" = $1 AND "esDeClase" = true`,
      [alumnaId]);
    comprobar("se le crea el paciente", pac.length === 1, `${pac.length}`);
    comprobar("con los datos del caso", pac[0]?.nombre === "Marta" && Number(pac[0]?.peso) === 58);
    comprobar("marcado como de clase", pac[0]?.esDeClase === true);
    comprobar("con la historia que escribió el profesor", (pac[0]?.notas ?? "").includes("vegana"));
    comprobar("y se le lleva a su ficha", alumna.url().includes(`/pacientes/${pac[0]?.id}`), alumna.url());

    console.log("\n── En su lista de pacientes sale etiquetado ──");
    await alumna.goto(`${BASE}/pacientes`, { waitUntil: "networkidle0" });
    await esperar(1800);
    visible = await texto(alumna);
    comprobar("está entre sus pacientes", visible.includes("Marta"));
    comprobar("con el nombre de su clase como etiqueta", visible.includes("Dietoterapia"),
      visible.split("\n").filter((l) => l.includes("Marta")).join(" / "));
    comprobar("y hay un selector para separarlos", /Solo los de clase|Solo los míos|Todos/.test(visible));

    console.log("\n── Entrega ──");
    await alumna.goto(`${BASE}/aula`, { waitUntil: "networkidle0" });
    await esperar(1500);
    await pulsar(alumna, "Entregar");
    await esperar(4000);
    const { rows: entrega } = await client.query(
      `SELECT id, estado, "entregadaAt", "pacienteId" FROM entregas_caso WHERE "alumnoId" = $1`, [alumnaId]);
    comprobar("queda entregada", entrega[0]?.estado === "ENTREGADA");
    comprobar("con la fecha", entrega[0]?.entregadaAt !== null);
    comprobar("y apuntando a su paciente", entrega[0]?.pacienteId === pac[0]?.id);

    console.log("\n── El profesor ve su trabajo y le pone nota ──");
    await profe.goto(`${BASE}/profesor/casos/${casoId}/entregas/${asig[0].id}`, { waitUntil: "networkidle0" });
    await esperar(1800);
    visible = await texto(profe);
    comprobar("ve a la alumna en la lista", visible.includes(`${MARCA} Alonso`));
    comprobar("con su estado", visible.includes("Entregada"));
    await pulsar(profe, `${MARCA} Alonso`);
    await esperar(2500);
    visible = await texto(profe);
    comprobar("puede abrir su trabajo", visible.includes("Marta Vegana"), profe.url());
    comprobar("y se le avisa de que es solo lectura", /No puedes tocarlo/i.test(visible));
    await rellenar(profe, "Nota", "8,5");
    await rellenar(profe, "Comentario", "Bien planteado, revisa la vitamina B12.");
    await pulsar(profe, "Guardar la corrección");
    await esperar(4000);
    const { rows: corregida } = await client.query(
      `SELECT estado, nota, comentario, "visibleParaAlumno" FROM entregas_caso WHERE "alumnoId" = $1`, [alumnaId]);
    comprobar("queda corregida", corregida[0]?.estado === "CORREGIDA");
    comprobar("con su nota", Number(corregida[0]?.nota) === 8.5, String(corregida[0]?.nota));
    comprobar("y su comentario", (corregida[0]?.comentario ?? "").includes("B12"));
    comprobar("pero SIN enseñársela al alumno todavía", corregida[0]?.visibleParaAlumno === false);

    console.log("\n── La alumna no ve la nota hasta que el profesor quiere ──");
    await alumna.goto(`${BASE}/aula`, { waitUntil: "networkidle0" });
    await esperar(1800);
    visible = await texto(alumna);
    comprobar("no ve la nota", !visible.includes("8,5") && !visible.includes("8.5"));
    comprobar("ni el comentario", !visible.includes("B12"));

    await client.query(`UPDATE entregas_caso SET "visibleParaAlumno" = true WHERE "alumnoId" = $1`, [alumnaId]);
    await alumna.goto(`${BASE}/aula`, { waitUntil: "networkidle0" });
    await esperar(1800);
    visible = await texto(alumna);
    comprobar("y cuando la publica, sí", /8[.,]5/.test(visible), visible.split("\n").filter((l) => /8/.test(l)).slice(0, 2).join(" / "));
    comprobar("con el comentario", visible.includes("B12"));

    console.log("\n── Lo que la auditoría encontró, que no vuelva ──");
    // 1. El paciente de un caso no se borra: es el trabajo que hay que corregir.
    const { rows: sigue } = await client.query(
      `SELECT COUNT(*)::int n FROM pacientes WHERE id = $1`, [pac[0].id]);
    comprobar("el paciente del caso sigue existiendo", sigue[0].n === 1);
    await alumna.goto(`${BASE}/pacientes/${pac[0].id}?espacio=aula`, { waitUntil: "networkidle0" });
    await esperar(1800);
    visible = await texto(alumna);
    comprobar("trabajando el caso ve lo que le han pedido", visible.includes("Cubre el hierro"));
    comprobar("y hasta cuándo", /Entrega antes del|Se pasó la fecha/.test(visible));
    comprobar("sin perder su aula en el menú",
      (await alumna.evaluate(() => (document.querySelector("aside, nav") as HTMLElement | null)?.innerText ?? "")).includes("Mis clases"));

    // 2. Abrir otra vez un caso ya corregido no lo devuelve a "en marcha".
    await client.query(`UPDATE entregas_caso SET estado = 'CORREGIDA' WHERE "alumnoId" = $1`, [alumnaId]);
    await alumna.goto(`${BASE}/aula`, { waitUntil: "networkidle0" });
    await esperar(1500);
    await pulsar(alumna, "Abrir el paciente");
    await esperar(3000);
    const { rows: trasAbrir } = await client.query(
      `SELECT estado FROM entregas_caso WHERE "alumnoId" = $1`, [alumnaId]);
    comprobar("abrir un caso corregido no lo devuelve a en marcha", trasAbrir[0].estado === "CORREGIDA");

    // 3. Un caso archivado desaparece del aula.
    await client.query(`UPDATE casos_clinicos SET archivado = true WHERE id = $1`, [casoId]);
    await alumna.goto(`${BASE}/aula`, { waitUntil: "networkidle0" });
    await esperar(1800);
    comprobar("el caso archivado desaparece del aula", !(await texto(alumna)).includes("Mujer vegana con anemia"));
    await client.query(`UPDATE casos_clinicos SET archivado = false WHERE id = $1`, [casoId]);

    // 4. Al retirarle el acceso, su entrega sigue viéndose desde el lado del profesor.
    await client.query(`UPDATE alumnos_clase SET activa = false WHERE "alumnoId" = $1`, [alumnaId]);
    await profe.goto(`${BASE}/profesor/casos/${casoId}/entregas/${asig[0].id}`, { waitUntil: "networkidle0" });
    await esperar(1800);
    visible = await texto(profe);
    comprobar("el trabajo de un alumno retirado no se esconde", visible.includes(`${MARCA} Alonso`));
    comprobar("y se dice que ya no está en la clase", visible.includes("Ya no está en la clase"));
    await client.query(`UPDATE alumnos_clase SET activa = true WHERE "alumnoId" = $1`, [alumnaId]);

    // 5. El paciente de un caso no sale en el selector de citas.
    await alumna.goto(`${BASE}/agenda`, { waitUntil: "networkidle0" });
    await esperar(2000);
    comprobar("el paciente del caso no está en la agenda para citarle",
      !(await texto(alumna)).includes("Marta Vegana"));

    console.log("\n── El caso no cuenta como paciente real ──");
    const { rows: reales } = await client.query(
      `SELECT COUNT(*)::int n FROM pacientes WHERE "esDemo" = false AND "esDeClase" = false AND "dietistaId" = $1`,
      [alumnaId]);
    comprobar("el paciente del caso no cuenta en las cifras", reales[0].n === 0, `${reales[0].n} reales`);
  } finally {
    await limpiar(client);
    client.release();
    await navegador.close();
    await pool.end();
  }
  console.log(`\n${mal === 0 ? "✓" : "✗"} ${ok} bien, ${mal} mal`);
  process.exit(mal === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });

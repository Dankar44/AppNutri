/**
 * #39 — El aula del alumno: su espacio, con las mismas dos puertas que el profesor.
 *
 *   1. npm run dev:desarrollo        (puerto 3001)
 *   2. DB=dev npx tsx scripts/probar-aula-alumno.ts
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
const MARCA = "PRUEBAAULA";
const DOMINIO = "pruebaaula.dev";
const PASS = "Aula_2026_Prueba";

let ok = 0, mal = 0;
const comprobar = (t: string, c: boolean, d = "") => { console.log(`  ${c ? "✓" : "✗"} ${t}${d ? ` — ${d}` : ""}`); c ? ok++ : mal++; };
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));
const texto = (page: Page) => page.evaluate(() => document.body.innerText);
const menuDe = (page: Page) => page.evaluate(() => (document.querySelector("aside, nav") as HTMLElement | null)?.innerText ?? "");

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
    const segundoId = await crearCuenta(client, `profe2@${DOMINIO}`, "Solís",
      { rolDocente: "PROFESOR", licenciaDocenteId: licenciaId });
    const { rows: cl } = await client.query(
      `INSERT INTO clases (id, "profesorId", "licenciaDocenteId", nombre, curso, "fechaFinCurso", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, '${MARCA} Dietoterapia 3º A', '2026/27', '2027-08-31', NOW(), NOW()) RETURNING id`,
      [profesorId, licenciaId]);
    const claseId = cl[0].id as string;
    for (const p of [profesorId, segundoId]) {
      await client.query(
        `INSERT INTO profesores_clase (id, "claseId", "profesorId", "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::text, $1, $2, NOW(), NOW())`, [claseId, p]);
    }
    const alumnoId = await crearCuenta(client, `alumno@${DOMINIO}`, "Alonso",
      { rolDocente: "ALUMNO", licenciaDocenteId: licenciaId, cuentaDeClase: true });
    await client.query(
      `INSERT INTO alumnos_clase (id, "claseId", "alumnoId", "altaAt") VALUES (gen_random_uuid()::text, $1, $2, NOW())`,
      [claseId, alumnoId]);

    console.log("\n── El alumno aterriza en su aula ──");
    const alumno = await sesionDe(navegador, `alumno@${DOMINIO}`);
    await alumno.goto(`${BASE}/entrar`, { waitUntil: "networkidle0" });
    await esperar(1800);
    comprobar("al entrar va a su aula, no al panel", alumno.url().endsWith("/aula"), alumno.url());
    const visible = await texto(alumno);
    comprobar("ve su clase", visible.includes("Dietoterapia 3º A"));
    comprobar("y de qué facultad es", visible.includes(`${MARCA} Universidad`));
    comprobar("con SUS DOS profesores", visible.includes("Marín") && visible.includes("Solís"),
      visible.split("\n").find((l) => l.includes("Marín")) ?? "no salen");
    comprobar("y hasta cuándo dura", /Hasta el/.test(visible));

    console.log("\n── Su menú es el suyo ──");
    const menu = await menuDe(alumno);
    comprobar("tiene su aula", menu.includes("Mis clases"), menu.split("\n").slice(0, 12).join(" / "));
    comprobar("y el material", menu.includes("Alimentos") && menu.includes("Recetas"));
    // Pacientes SÍ, porque sus casos son pacientes suyos y es donde los trabaja. Lo que no tiene
    // que ver desde el aula es la parte de gestión de una consulta.
    comprobar("tiene sus pacientes a mano", menu.includes("Pacientes"));
    comprobar("pero no la gestión de una consulta", !menu.includes("Agenda") && !menu.includes("Pagos"),
      menu.split("\n").slice(0, 12).join(" / "));
    comprobar("pero tiene la puerta a su cuenta profesional", menu.includes("Mi cuenta profesional"));
    comprobar("y en el pie pone que es alumno", menu.includes("Alumno"));

    console.log("\n── Y puede pasar a su consulta y volver ──");
    await alumno.goto(`${BASE}/dashboard`, { waitUntil: "networkidle0" });
    await esperar(1500);
    const menuPro = await menuDe(alumno);
    comprobar("en su cuenta profesional tiene sus pacientes", menuPro.includes("Pacientes"));
    await alumno.goto(`${BASE}/alimentos?espacio=aula`, { waitUntil: "networkidle0" });
    await esperar(1500);
    comprobar("y el material desde el aula no le cambia el menú", (await menuDe(alumno)).includes("Mis clases"));

    console.log("\n── El aula no es de cualquiera ──");
    const profe = await sesionDe(navegador, `profe@${DOMINIO}`);
    await profe.goto(`${BASE}/entrar`, { waitUntil: "networkidle0" });
    await esperar(1800);
    comprobar("el profesor sigue aterrizando en su espacio docente", profe.url().endsWith("/profesor"), profe.url());
    await profe.goto(`${BASE}/aula`, { waitUntil: "networkidle0" });
    await esperar(1500);
    comprobar("y si abre el aula, no ve clases de alumno", !(await texto(profe)).includes("Dietoterapia 3º A"),
      (await texto(profe)).split("\n").slice(0, 3).join(" / "));

    console.log("\n── Al salir de la clase conserva su historial ──");
    await client.query(`UPDATE alumnos_clase SET activa = false WHERE "alumnoId" = $1`, [alumnoId]);
    const exalumno = await sesionDe(navegador, `alumno@${DOMINIO}`);
    await exalumno.goto(`${BASE}/dashboard`, { waitUntil: "networkidle0" });
    await esperar(1800);
    comprobar("ve el aviso de fin de curso", exalumno.url().includes("/curso-terminado"), exalumno.url());
    await exalumno.evaluate(() => {
      const b = Array.from(document.querySelectorAll("button")).find((x) => x.textContent?.includes("Entrar a mi cuenta"));
      (b as HTMLElement | undefined)?.click();
    });
    await esperar(3000);
    comprobar("y entra a su cuenta", exalumno.url().endsWith("/dashboard"), exalumno.url());
    await exalumno.goto(`${BASE}/aula`, { waitUntil: "networkidle0" });
    await esperar(1500);
    const aulaDespues = await texto(exalumno);
    comprobar("su clase pasada sigue en el historial", aulaDespues.includes("Dietoterapia 3º A"));
    comprobar("y se le dice que su trabajo sigue guardado", /sigue guardado/i.test(aulaDespues));
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

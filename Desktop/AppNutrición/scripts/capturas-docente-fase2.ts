/**
 * #39 — Capturas de todas las pantallas de la fase 2, para mirarlas de verdad.
 *
 *   1. npm run dev:desarrollo        (puerto 3001)
 *   2. DB=dev npx tsx scripts/capturas-docente-fase2.ts
 *
 * Deja los PNG en /tmp/annonia-fase2 y borra sus datos. Solo con DB=dev.
 */
import "./_guard-solo-dev";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";
import { mkdirSync } from "node:fs";
import { SignJWT } from "jose";
import puppeteer, { type Page, type Browser } from "puppeteer-core";
import { createClient } from "@supabase/supabase-js";

const BASE = "http://localhost:3001";
const DIR = "/tmp/annonia-fase2";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: false } });
const MARCA = "CAPTURA";
const DOMINIO = "capturafase2.dev";
const PASS = "Capturas_2026_X";

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

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
     VALUES (gen_random_uuid()::text, $1, $2, $3, $4, true, NOW(), NOW()${campos.map((_, i) => `, $${5 + i}`).join("")}) RETURNING id`,
    [authId, email, "Elena", apellidos, ...campos.map((c) => extra[c])]);
  return rows[0].id as string;
}

async function sesionDe(navegador: Browser, email: string, ancho = 1440): Promise<Page> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const sb = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
  const { data, error } = await sb.auth.signInWithPassword({ email, password: PASS });
  if (error) throw new Error(`login de ${email}: ${error.message}`);
  const page = await (await navegador.createBrowserContext()).newPage();
  await page.setViewport({ width: ancho, height: ancho < 500 ? 800 : 950 });
  await page.evaluateOnNewDocument(() => { try { localStorage.setItem("annonia-welcome-dietista", "1"); } catch { /* ignore */ } });
  await page.setCookie({
    name: `sb-${url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1]}-auth-token`,
    value: "base64-" + Buffer.from(JSON.stringify(data.session)).toString("base64"),
    domain: "localhost", path: "/",
  });
  return page;
}

async function limpiar(client: pg.PoolClient) {
  await client.query(`DELETE FROM invitaciones_docentes WHERE email LIKE '%@${DOMINIO}'`);
  await client.query(`DELETE FROM recetas WHERE nombre LIKE '${MARCA}%'`);
  await client.query(`DELETE FROM alimentos WHERE nombre LIKE '${MARCA}%'`);
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
  mkdirSync(DIR, { recursive: true });
  const client = await pool.connect();
  const navegador = await puppeteer.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true, args: ["--no-sandbox"],
  });
  const foto = async (page: Page, nombre: string) => {
    await esperar(1400);
    await page.screenshot({ path: `${DIR}/${nombre}.png` as `${string}.png`, fullPage: true });
    console.log(`  ✓ ${nombre}.png`);
  };

  try {
    await limpiar(client);
    const { rows: lic } = await client.query(
      `INSERT INTO licencias_docentes (id, institucion, "personaContacto", "maxProfesores", "maxAlumnos", curso, "fechaFin", "dominioEmail", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, '${MARCA} Universidad Rey Juan Carlos', 'Elena Marín', 3, 60, '2026/27',
               '2027-08-31', 'urjc.es,alumnos.urjc.es', NOW(), NOW()) RETURNING id`);
    const licenciaId = lic[0].id as string;
    const profesorId = await crearCuenta(client, `profe@${DOMINIO}`, "Marín",
      { rolDocente: "PROFESOR", licenciaDocenteId: licenciaId });

    console.log("\n── Profesor sin clases todavía ──");
    const profe = await sesionDe(navegador, `profe@${DOMINIO}`);
    await profe.goto(`${BASE}/profesor`, { waitUntil: "networkidle0" });
    await foto(profe, "01-profesor-sin-clases");

    const { rows: cl } = await client.query(
      `INSERT INTO clases (id, "profesorId", "licenciaDocenteId", nombre, curso, "fechaFinCurso", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, '${MARCA} Dietoterapia 3º A', '2026/27', '2027-08-31', NOW(), NOW()),
              (gen_random_uuid()::text, $1, $2, '${MARCA} Nutrición Clínica', '2026/27', '2027-06-30', NOW(), NOW())
       RETURNING id`, [profesorId, licenciaId]);
    const claseId = cl[0].id as string;

    // Tres alumnos: dos dentro y uno con el acceso retirado.
    for (const [i, apellidos] of [["1", "Alonso"], ["2", "Bermúdez"], ["3", "Cortés"]] as [string, string][]) {
      const alumnoId = await crearCuenta(client, `alumno${i}@${DOMINIO}`, apellidos,
        { rolDocente: "ALUMNO", licenciaDocenteId: licenciaId, cuentaDeClase: true });
      await client.query(
        `INSERT INTO alumnos_clase (id, "claseId", "alumnoId", activa, "altaAt", "bajaAt")
         VALUES (gen_random_uuid()::text, $1, $2, $3, NOW(), $4)`,
        [claseId, alumnoId, i !== "3", i === "3" ? new Date() : null]);
      if (i === "1") await client.query(`UPDATE dietistas SET "lastAccessAt" = NOW() WHERE id = $1`, [alumnoId]);
    }
    await client.query(
      `INSERT INTO invitaciones_docentes (id, token, email, rol, "claseId", "licenciaDocenteId", "invitadoPor", "expiraAt", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, 'capturatoken', 'nuevo@${DOMINIO}', 'ALUMNO', $1, $2, $3, NOW() + INTERVAL '30 days', NOW(), NOW())`,
      [claseId, licenciaId, profesorId]);

    console.log("\n── El profesor con sus clases ──");
    await profe.goto(`${BASE}/profesor`, { waitUntil: "networkidle0" });
    await foto(profe, "02-profesor-inicio");
    await profe.goto(`${BASE}/profesor/clases`, { waitUntil: "networkidle0" });
    await foto(profe, "03-profesor-clases");
    await profe.goto(`${BASE}/profesor/clases/${claseId}`, { waitUntil: "networkidle0" });
    await foto(profe, "04-clase-alta-por-correo");
    await profe.evaluate(() => {
      const b = Array.from(document.querySelectorAll("button")).find((x) => x.textContent?.includes("Con un enlace"));
      (b as HTMLElement | undefined)?.click();
    });
    await foto(profe, "05-clase-enlace-cerrado");
    await profe.evaluate(() => {
      const b = Array.from(document.querySelectorAll("button")).find((x) => x.textContent?.includes("Abrir el enlace"));
      (b as HTMLElement | undefined)?.click();
    });
    await esperar(3000);
    await profe.reload({ waitUntil: "networkidle0" });
    await profe.evaluate(() => {
      const b = Array.from(document.querySelectorAll("button")).find((x) => x.textContent?.includes("Con un enlace"));
      (b as HTMLElement | undefined)?.click();
    });
    await foto(profe, "06-clase-enlace-abierto");

    const { rows: tk } = await client.query(`SELECT "tokenInvitacion" FROM clases WHERE id = $1`, [claseId]);
    const anonimo = await (await navegador.createBrowserContext()).newPage();
    await anonimo.setViewport({ width: 1440, height: 950 });
    await anonimo.goto(`${BASE}/clase/${tk[0].tokenInvitacion}`, { waitUntil: "networkidle0" });
    await foto(anonimo, "07-alumno-enlace-de-clase");
    await anonimo.goto(`${BASE}/invitacion/capturatoken`, { waitUntil: "networkidle0" });
    await foto(anonimo, "08-alumno-invitacion-por-correo");

    console.log("\n── El curso que se acaba y el que ya acabó ──");
    await client.query(
      `UPDATE clases SET "fechaFinCurso" = CURRENT_DATE + 12 WHERE id = $1`, [claseId]);
    await profe.goto(`${BASE}/profesor/clases/${claseId}`, { waitUntil: "networkidle0" });
    await foto(profe, "09-clase-acaba-pronto");
    await client.query(`UPDATE clases SET "fechaFinCurso" = '2026-06-30' WHERE id = $1`, [claseId]);
    await profe.goto(`${BASE}/profesor/clases/${claseId}`, { waitUntil: "networkidle0" });
    await foto(profe, "10-clase-curso-terminado");

    const alumno = await sesionDe(navegador, `alumno1@${DOMINIO}`);
    await alumno.goto(`${BASE}/dashboard`, { waitUntil: "networkidle0" });
    await foto(alumno, "11-alumno-curso-terminado");

    console.log("\n── El alumno con el curso en marcha ──");
    await client.query(`UPDATE clases SET "fechaFinCurso" = '2027-08-31' WHERE id = $1`, [claseId]);
    const { rows: al } = await client.query(
      `INSERT INTO alimentos (id, nombre, "nombreNormalizado", categoria, calorias, proteinas, carbohidratos,
         grasas, fibra, porcion, unidad, origen, "dietistaId", compartido, "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, '${MARCA} tofu marinado', lower('${MARCA} tofu marinado'), 'LEGUMBRES',
         144, 15, 3, 8, 1, 100, 'GRAMOS', 'PERSONALIZADO', $1, true, NOW(), NOW()) RETURNING id`, [profesorId]);
    await client.query(
      `INSERT INTO recetas (id, nombre, "nombreNormalizado", descripcion, porciones, calorias, proteinas,
         carbohidratos, grasas, fibra, "dietistaId", compartido, "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, '${MARCA} Bowl de tofu', lower('${MARCA} bowl'),
         'Caso práctico 3: paciente vegana con anemia', 2, 520, 28, 60, 18, 9, $1, true, NOW(), NOW())`, [profesorId]);
    const alumno2 = await sesionDe(navegador, `alumno1@${DOMINIO}`);
    await alumno2.goto(`${BASE}/alimentos?busqueda=${MARCA}`, { waitUntil: "networkidle0" });
    await foto(alumno2, "12-alumno-alimentos-de-clase");
    await alumno2.goto(`${BASE}/recetas?tab=clase`, { waitUntil: "networkidle0" });
    await foto(alumno2, "13-alumno-recetas-compartidas");
    await alumno2.goto(`${BASE}/ajustes`, { waitUntil: "networkidle0" });
    await foto(alumno2, "14-alumno-ajustes");
    void al;

    console.log("\n── Administración ──");
    const admin = await (await navegador.createBrowserContext()).newPage();
    await admin.setViewport({ width: 1440, height: 950 });
    const emailAdmin = (process.env.ADMIN_EMAILS ?? "").split(",")[0].trim();
    const token = await new SignJWT({ email: emailAdmin, role: "admin" })
      .setProtectedHeader({ alg: "HS256" }).setExpirationTime("1d")
      .sign(new TextEncoder().encode(process.env.PATIENT_JWT_SECRET!));
    await admin.setCookie({ name: "annonia-admin-session", value: token, domain: "localhost", path: "/" });
    await admin.goto(`${BASE}/admin/alumnos`, { waitUntil: "networkidle0" });
    await foto(admin, "15-admin-alumnos");
    await admin.goto(`${BASE}/admin/universidades/${licenciaId}`, { waitUntil: "networkidle0" });
    await foto(admin, "16-admin-universidad");

    console.log("\n── En móvil ──");
    const movil = await sesionDe(navegador, `profe@${DOMINIO}`, 390);
    await movil.goto(`${BASE}/profesor`, { waitUntil: "networkidle0" });
    await foto(movil, "17-movil-profesor-inicio");
    await movil.goto(`${BASE}/profesor/clases/${claseId}`, { waitUntil: "networkidle0" });
    await foto(movil, "18-movil-clase");
    const movilAlumno = await (await navegador.createBrowserContext()).newPage();
    await movilAlumno.setViewport({ width: 390, height: 800 });
    await movilAlumno.goto(`${BASE}/clase/${tk[0].tokenInvitacion}`, { waitUntil: "networkidle0" });
    await foto(movilAlumno, "19-movil-enlace-de-clase");
  } finally {
    await limpiar(client);
    client.release();
    await navegador.close();
    await pool.end();
  }
  console.log(`\n✓ Capturas en ${DIR}`);
}

main().catch((e) => { console.error(e); process.exit(1); });

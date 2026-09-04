/**
 * #39 — Que no se ponga lento con una facultad de verdad.
 *
 * Crea una institución con 4 profesores, 8 clases y 200 alumnos (que es más de lo que tiene
 * ninguna de las universidades interesadas), mide lo que tardan las consultas y las pantallas, y
 * lo borra todo. Solo con DB=dev.
 *
 *   1. npm run dev:desarrollo        (puerto 3001)
 *   2. DB=dev npx tsx scripts/probar-carga-docente.ts
 */
import "./_guard-solo-dev";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";
import { SignJWT } from "jose";
import puppeteer, { type Page } from "puppeteer-core";
import { createClient } from "@supabase/supabase-js";

const BASE = "http://localhost:3001";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: false } });

const MARCA = "PRUEBACARGA";
const DOMINIO = "pruebacarga.dev";
const PASS = "Carga_2026_Prueba";
const ALUMNOS = 200, PROFES = 4, CLASES = 8;
const TOPE_MS = 2500;

let ok = 0, mal = 0;
const comprobar = (t: string, c: boolean, d = "") => { console.log(`  ${c ? "✓" : "✗"} ${t}${d ? ` — ${d}` : ""}`); c ? ok++ : mal++; };
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function cookieAdmin() {
  const email = (process.env.ADMIN_EMAILS ?? "").split(",")[0].trim();
  const token = await new SignJWT({ email, role: "admin" })
    .setProtectedHeader({ alg: "HS256" }).setExpirationTime("1d")
    .sign(new TextEncoder().encode(process.env.PATIENT_JWT_SECRET!));
  return { name: "annonia-admin-session", value: token, domain: "localhost", path: "/" };
}

async function limpiar(client: pg.PoolClient) {
  await client.query(`DELETE FROM alimentos WHERE nombre LIKE '${MARCA}%'`);
  await client.query(`DELETE FROM casos_clinicos WHERE nombre LIKE '${MARCA}%'`);
  await client.query(`DELETE FROM pacientes WHERE nombre = '${MARCA} Paciente'`);
  await client.query(`DELETE FROM clases WHERE nombre LIKE '${MARCA}%'`);
  const { rows } = await client.query(`SELECT id FROM auth.users WHERE email LIKE '%@${DOMINIO}'`);
  for (const r of rows) {
    await client.query(`DELETE FROM dietistas WHERE "authId" = $1`, [r.id]);
    await client.query(`DELETE FROM auth.identities WHERE user_id = $1::uuid`, [r.id]);
    await client.query(`DELETE FROM auth.users WHERE id = $1::uuid`, [r.id]);
  }
  await client.query(`DELETE FROM licencias_docentes WHERE institucion LIKE '${MARCA}%'`);
}

async function cronometrar<T>(etiqueta: string, fn: () => Promise<T>): Promise<T> {
  const t0 = Date.now();
  const r = await fn();
  const ms = Date.now() - t0;
  comprobar(etiqueta, ms < TOPE_MS, `${ms} ms`);
  return r;
}

async function main() {
  const client = await pool.connect();
  const navegador = await puppeteer.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true, args: ["--no-sandbox"],
  });
  try {
    await limpiar(client);
    console.log(`\n── Montando ${PROFES} profesores, ${CLASES} clases y ${ALUMNOS} alumnos ──`);
    const { rows: lic } = await client.query(
      `INSERT INTO licencias_docentes (id, institucion, "maxProfesores", "maxAlumnos", "fechaFin", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, '${MARCA} Universidad', $1, $2, '2027-08-31', NOW(), NOW()) RETURNING id`,
      [PROFES, ALUMNOS + 50]);
    const licenciaId = lic[0].id as string;

    // Un solo INSERT por tabla: montar 200 cuentas de una en una tardaría más que la prueba.
    await client.query(
      `INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
         created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous,
         confirmation_token, recovery_token, email_change_token_new, email_change,
         email_change_token_current, reauthentication_token, phone_change, phone_change_token)
       SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
         'a' || i || '@${DOMINIO}', crypt($1, gen_salt('bf')), NOW(), NOW(), NOW(),
         '{"provider":"email","providers":["email"]}', '{}'::jsonb, false, false, '','','','','','','',''
       FROM generate_series(1, $2) AS i`, [PASS, ALUMNOS + PROFES]);
    await client.query(
      `INSERT INTO dietistas (id, "authId", email, nombre, apellidos, verificado, "createdAt", "updatedAt", "rolDocente", "licenciaDocenteId", "cuentaDeClase")
       SELECT gen_random_uuid()::text, u.id, u.email, '${MARCA}', split_part(u.email, '@', 1), true, NOW(), NOW(),
              CASE WHEN split_part(u.email,'@',1) IN ('a1','a2','a3','a4') THEN 'PROFESOR'::"RolDocente" ELSE 'ALUMNO'::"RolDocente" END,
              $1,
              split_part(u.email,'@',1) NOT IN ('a1','a2','a3','a4')
         FROM auth.users u WHERE u.email LIKE '%@${DOMINIO}'`, [licenciaId]);

    const { rows: profes } = await client.query(
      `SELECT id FROM dietistas WHERE email LIKE '%@${DOMINIO}' AND "rolDocente" = 'PROFESOR' ORDER BY email`);
    for (let c = 0; c < CLASES; c++) {
      await client.query(
        `INSERT INTO clases (id, "profesorId", "licenciaDocenteId", nombre, "fechaFinCurso", "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::text, $1, $2, '${MARCA} clase ' || $3, '2027-08-31', NOW(), NOW())`,
        [profes[c % profes.length].id, licenciaId, c + 1]);
    }
    const { rows: clases } = await client.query(
      `SELECT id FROM clases WHERE nombre LIKE '${MARCA}%' ORDER BY nombre`);
    // Reparto en abanico, y 30 alumnos en dos clases a la vez: el caso que hay que contar bien.
    await client.query(
      `INSERT INTO alumnos_clase (id, "claseId", "alumnoId", "altaAt")
       SELECT gen_random_uuid()::text, c.id, d.id, NOW()
         FROM (SELECT id, row_number() OVER (ORDER BY email) rn FROM dietistas
                WHERE email LIKE '%@${DOMINIO}' AND "rolDocente" = 'ALUMNO') d
         JOIN (SELECT id, row_number() OVER (ORDER BY nombre) rn FROM clases WHERE nombre LIKE '${MARCA}%') c
           ON c.rn = ((d.rn - 1) % $1) + 1`, [CLASES]);
    await client.query(
      `INSERT INTO alumnos_clase (id, "claseId", "alumnoId", "altaAt")
       SELECT gen_random_uuid()::text, $1, d.id, NOW()
         FROM (SELECT id FROM dietistas WHERE email LIKE '%@${DOMINIO}' AND "rolDocente" = 'ALUMNO'
                ORDER BY email LIMIT 30) d
       ON CONFLICT DO NOTHING`, [clases[0].id]);
    // Material del profesor, para medir la lista del alumno con algo dentro.
    await client.query(
      `INSERT INTO alimentos (id, nombre, "nombreNormalizado", categoria, calorias, proteinas, carbohidratos,
         grasas, fibra, porcion, unidad, origen, "dietistaId", compartido, "createdAt", "updatedAt")
       SELECT gen_random_uuid()::text, '${MARCA} alimento ' || i, lower('${MARCA} alimento ' || i), 'OTROS',
         100, 10, 10, 5, 2, 100, 'GRAMOS', 'PERSONALIZADO', $1, true, NOW(), NOW()
       FROM generate_series(1, 120) AS i`, [profes[0].id]);

    // #40 — Casos y entregas: 20 casos, uno asignado a cada clase, con la mitad de los alumnos
    // habiendo abierto el suyo. Es lo que tendrá una asignatura al final de un cuatrimestre.
    // Cada caso apunta a un paciente plantilla del profesor, como en la aplicación.
    await client.query(
      `INSERT INTO pacientes (id, "dietistaId", nombre, apellidos, peso, altura, "esCasoDocente", "createdAt", "updatedAt")
       SELECT gen_random_uuid()::text, $1, '${MARCA} Paciente', 'Numero ' || i, 70, 170, true, NOW(), NOW()
       FROM generate_series(1, 20) AS i`, [profes[0].id]);
    await client.query(
      `INSERT INTO casos_clinicos (id, "profesorId", "licenciaDocenteId", nombre, consigna, "pacienteId", "createdAt", "updatedAt")
       SELECT gen_random_uuid()::text, $1, $2, '${MARCA} caso ' || p.rn, 'Haz el plan.', p.id, NOW(), NOW()
         FROM (SELECT id, row_number() OVER (ORDER BY apellidos) rn FROM pacientes
                WHERE "dietistaId" = $1 AND "esCasoDocente" = true AND nombre = '${MARCA} Paciente') p`,
      [profes[0].id, licenciaId]);
    await client.query(
      `INSERT INTO asignaciones_caso (id, "casoId", "claseId", "fechaLimite", "asignadoPor", "createdAt", "updatedAt")
       SELECT gen_random_uuid()::text, c.id, cl.id, CURRENT_DATE + 30, $1, NOW(), NOW()
         FROM (SELECT id, row_number() OVER (ORDER BY nombre) rn FROM casos_clinicos WHERE nombre LIKE '${MARCA}%') c
         JOIN (SELECT id, row_number() OVER (ORDER BY nombre) rn FROM clases WHERE nombre LIKE '${MARCA}%') cl
           ON cl.rn = ((c.rn - 1) % $2) + 1
       ON CONFLICT DO NOTHING`, [profes[0].id, CLASES]);
    await client.query(
      `INSERT INTO entregas_caso (id, "asignacionId", "alumnoId", estado, "abiertaAt", "createdAt", "updatedAt")
       SELECT gen_random_uuid()::text, a.id, ac."alumnoId", 'EN_MARCHA', NOW(), NOW(), NOW()
         FROM asignaciones_caso a
         JOIN alumnos_clase ac ON ac."claseId" = a."claseId" AND ac.activa
         JOIN clases c ON c.id = a."claseId"
        WHERE c.nombre LIKE '${MARCA}%' AND random() < 0.5
       ON CONFLICT DO NOTHING`);

    const { rows: cuenta } = await client.query(
      `SELECT (SELECT COUNT(*)::int FROM dietistas WHERE email LIKE '%@${DOMINIO}') d,
              (SELECT COUNT(*)::int FROM alumnos_clase ac JOIN clases c ON c.id = ac."claseId"
                WHERE c.nombre LIKE '${MARCA}%') m`);
    console.log(`  (${cuenta[0].d} cuentas, ${cuenta[0].m} matrículas)`);

    console.log("\n── Las consultas que se pagan en cada pantalla ──");
    await cronometrar("contar las plazas ocupadas de la bolsa", async () => {
      const { rows } = await client.query(
        `SELECT COUNT(DISTINCT ac."alumnoId")::int n FROM alumnos_clase ac JOIN clases c ON c.id = ac."claseId"
          WHERE ac.activa AND c."licenciaDocenteId" = $1 AND c.archivada = false`, [licenciaId]);
      comprobar("y cuenta alumnos distintos, no matrículas", rows[0].n === ALUMNOS, `${rows[0].n} de ${ALUMNOS}`);
    });

    const page = await (await navegador.createBrowserContext()).newPage();
    await page.setViewport({ width: 1440, height: 950 });
    await page.setCookie(await cookieAdmin());

    console.log("\n── Las pantallas ──");
    const medirPagina = async (etiqueta: string, url: string, p: Page = page) => {
      const t0 = Date.now();
      await p.goto(url, { waitUntil: "networkidle0" });
      const ms = Date.now() - t0;
      comprobar(etiqueta, ms < 6000, `${ms} ms`);
      return ms;
    };
    await medirPagina("administración: lista de alumnos", `${BASE}/admin/alumnos`);
    await medirPagina("administración: filtrada por institución", `${BASE}/admin/alumnos?licencia=${licenciaId}`);
    await medirPagina("administración: ficha de la universidad", `${BASE}/admin/universidades/${licenciaId}`);

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const sb = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
    const { data } = await sb.auth.signInWithPassword({ email: `a1@${DOMINIO}`, password: PASS });
    const profe = await (await navegador.createBrowserContext()).newPage();
    await profe.setViewport({ width: 1440, height: 950 });
    await profe.evaluateOnNewDocument(() => { try { localStorage.setItem("annonia-welcome-dietista", "1"); } catch { /* ignore */ } });
    await profe.setCookie({
      name: `sb-${url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1]}-auth-token`,
      value: "base64-" + Buffer.from(JSON.stringify(data.session)).toString("base64"),
      domain: "localhost", path: "/",
    });
    await medirPagina("profesor: sus clases", `${BASE}/profesor/clases`, profe);
    await medirPagina("profesor: una clase con sus alumnos", `${BASE}/profesor/clases/${clases[0].id}`, profe);
    await medirPagina("profesor: sus 20 casos", `${BASE}/profesor/casos`, profe);
    const { rows: unaAsignacion } = await client.query(
      `SELECT a.id FROM asignaciones_caso a JOIN clases c ON c.id = a."claseId"
        WHERE c.nombre LIKE '${MARCA}%' LIMIT 1`);
    const { rows: suCaso } = await client.query(
      `SELECT "casoId" FROM asignaciones_caso WHERE id = $1`, [unaAsignacion[0].id]);
    await medirPagina("profesor: el caso con las entregas de una clase entera",
      `${BASE}/profesor/casos/${suCaso[0].casoId}?clase=${unaAsignacion[0].id}`, profe);

    const { data: da } = await sb.auth.signInWithPassword({ email: `a50@${DOMINIO}`, password: PASS });
    const alumno = await (await navegador.createBrowserContext()).newPage();
    await alumno.setViewport({ width: 1440, height: 950 });
    await alumno.evaluateOnNewDocument(() => { try { localStorage.setItem("annonia-welcome-dietista", "1"); } catch { /* ignore */ } });
    await alumno.setCookie({
      name: `sb-${url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1]}-auth-token`,
      value: "base64-" + Buffer.from(JSON.stringify(da.session)).toString("base64"),
      domain: "localhost", path: "/",
    });
    await medirPagina("alumno: su panel", `${BASE}/dashboard`, alumno);
    await medirPagina("alumno: sus alimentos (con 120 del profesor)", `${BASE}/alimentos`, alumno);
    await medirPagina("alumno: su aula con sus casos", `${BASE}/aula`, alumno);
    await esperar(300);
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

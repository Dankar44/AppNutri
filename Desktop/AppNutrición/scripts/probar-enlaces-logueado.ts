/**
 * Qué ve cada tipo de cuenta al abrir los dos enlaces con la sesión ya puesta.
 *
 * Sale de un fallo real: un profesor que se había quedado sin universidad abría el enlace de
 * profesorado, leía «ya tienes acceso de profesor», pulsaba el botón y aterrizaba en «no estás en
 * ninguna universidad». El enlace no servía para nada y no había forma de entrar (Guillermo, 9 sep
 * 2026: "quiero mirar todos los ángulos posibles").
 *
 * Se recorre la matriz entera —seis situaciones por dos enlaces— porque el error no fue de código
 * sino de no haber listado los casos.
 *
 *   1. npm run dev:desarrollo        (puerto 3001)
 *   2. DB=dev npx tsx scripts/probar-enlaces-logueado.ts
 */
import "./_guard-solo-dev";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";
import { conexionResistente, type Conexion } from "./_conexion-viva";
import puppeteer, { type Page, type Browser } from "puppeteer-core";
import { createClient } from "@supabase/supabase-js";

const BASE = "http://localhost:3001";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const MARCA = "MATRIZ";
const DOMINIO = "matriz.dev";
const PASS = "Matriz2026";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: false } });

let ok = 0, mal = 0;
const comprobar = (t: string, c: boolean, d = "") => { console.log(`    ${c ? "✓" : "✗"} ${t}${d ? ` — ${d}` : ""}`); c ? ok++ : mal++; };
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));
const texto = (p: Page) => p.evaluate(() => document.body.innerText);
const anio = (hoy = new Date()) => (hoy.getUTCMonth() >= 8 ? hoy.getUTCFullYear() : hoy.getUTCFullYear() - 1);

async function cuenta(c: Conexion, email: string, rol: string | null, licenciaId: string | null) {
  const { rows: u } = await c.query(
    `INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
       created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous,
       confirmation_token, recovery_token, email_change_token_new, email_change,
       email_change_token_current, reauthentication_token, phone_change, phone_change_token)
     VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
       $1, crypt($2, gen_salt('bf')), NOW(), NOW(), NOW(),
       '{"provider":"email","providers":["email"]}', '{}'::jsonb, false, false, '','','','','','','','')
     RETURNING id`, [email, PASS]);
  const authId = u[0].id as string;
  await c.query(
    `INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
     VALUES (gen_random_uuid(), $1::uuid, $1::text, 'email',
       jsonb_build_object('sub',$1::text,'email',$2::text,'email_verified',true,'provider','email'), NOW(), NOW(), NOW())`,
    [authId, email]);
  const { rows } = await c.query(
    `INSERT INTO dietistas (id, "authId", email, nombre, apellidos, verificado, "rolDocente", "licenciaDocenteId", "createdAt", "updatedAt")
     VALUES (gen_random_uuid()::text, $1, $2, '${MARCA}', 'Prueba', true, $3::"RolDocente", $4, NOW(), NOW()) RETURNING id`,
    [authId, email, rol, licenciaId]);
  return rows[0].id as string;
}

async function sesionDe(nav: Browser, email: string): Promise<Page> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const sb = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
  const { data, error } = await sb.auth.signInWithPassword({ email, password: PASS });
  if (error) throw new Error(`login de ${email}: ${error.message}`);
  const page = await (await nav.createBrowserContext()).newPage();
  await page.setViewport({ width: 1280, height: 900 });
  page.setDefaultNavigationTimeout(90_000);
  await page.setCookie({
    name: `sb-${url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1]}-auth-token`,
    value: "base64-" + Buffer.from(JSON.stringify(data.session)).toString("base64"),
    domain: "localhost", path: "/",
  });
  return page;
}

async function limpiar(c: Conexion) {
  await c.query(`DELETE FROM clases WHERE nombre LIKE '${MARCA}%'`);
  await c.query(`DELETE FROM enlaces_profesores WHERE "creadoPor" = '${MARCA}'`);
  const { rows } = await c.query(`SELECT "authId" FROM dietistas WHERE email LIKE $1`, [`%@${DOMINIO}`]);
  await c.query(`DELETE FROM pacientes WHERE "dietistaId" IN (SELECT id FROM dietistas WHERE email LIKE $1)`, [`%@${DOMINIO}`]);
  await c.query(`DELETE FROM dietistas WHERE email LIKE $1`, [`%@${DOMINIO}`]);
  for (const r of rows) {
    if (!r.authId) continue;
    await c.query(`DELETE FROM auth.identities WHERE user_id = $1::uuid`, [r.authId]);
    await c.query(`DELETE FROM auth.users WHERE id = $1::uuid`, [r.authId]);
  }
  await c.query(`DELETE FROM licencias_docentes WHERE institucion LIKE '${MARCA}%'`);
}

async function main() {
  const client = conexionResistente(pool);
  const navegador = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] });
  try {
    await limpiar(client);

    // Dos universidades: la del enlace y otra cualquiera, para el profesor que ya está colocado.
    const nueva = async (nombre: string, profes: number) => (await client.query(
      `INSERT INTO licencias_docentes (id, institucion, "maxProfesores", "maxAlumnos", activa, "fechaInicio", "fechaFin", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, 20, true, $3::date, $4::date, NOW(), NOW()) RETURNING id`,
      [nombre, profes, `${anio()}-09-01`, `${anio() + 1}-08-31`])).rows[0].id as string;
    const laDelEnlace = await nueva(`${MARCA} La del enlace`, 8);
    const otra = await nueva(`${MARCA} Otra`, 3);

    const profeDeEsta = await cuenta(client, `profe.esta@${DOMINIO}`, "PROFESOR", laDelEnlace);
    await cuenta(client, `profe.otra@${DOMINIO}`, "PROFESOR", otra);
    const sinUni = await cuenta(client, `profe.sinuni@${DOMINIO}`, "PROFESOR", null);
    // Se fue de su facultad este curso: conserva el espacio docente hasta el 31 de agosto.
    await client.query(`UPDATE dietistas SET "docenciaHasta" = $2 WHERE id = $1`,
      [sinUni, new Date(Date.UTC(anio() + 1, 7, 31, 23, 59, 59))]);
    await cuenta(client, `nutri@${DOMINIO}`, null, null);
    const alumnoDentro = await cuenta(client, `alumno.dentro@${DOMINIO}`, "ALUMNO", laDelEnlace);
    await cuenta(client, `alumno.otra@${DOMINIO}`, "ALUMNO", otra);

    const { rows: cl } = await client.query(
      `INSERT INTO clases (id, "profesorId", "licenciaDocenteId", nombre, "fechaInicioCurso", "fechaFinCurso",
            "invitacionAbierta", "tokenInvitacion", "cupoEnlace", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, '${MARCA} Clase', CURRENT_DATE, $3::date, true,
            replace(gen_random_uuid()::text,'-',''), 20, NOW(), NOW())
       RETURNING id, "tokenInvitacion"`, [profeDeEsta, laDelEnlace, `${anio() + 1}-08-31`]);
    await client.query(
      `INSERT INTO profesores_clase (id, "claseId", "profesorId", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, NOW(), NOW())`, [cl[0].id, profeDeEsta]);
    await client.query(
      `INSERT INTO alumnos_clase (id, "claseId", "alumnoId", activa, "altaAt", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, true, NOW(), NOW(), NOW())`, [cl[0].id, alumnoDentro]);

    const { rows: enl } = await client.query(
      `INSERT INTO enlaces_profesores (id, "licenciaDocenteId", token, "cursoAnio", plazas, "creadoPor")
       VALUES (gen_random_uuid()::text, $1, replace(gen_random_uuid()::text,'-',''), $2, 6, '${MARCA}')
       RETURNING token`, [laDelEnlace, anio()]);
    const urlProfesorado = `${BASE}/profesorado/${enl[0].token}`;
    const urlClase = `${BASE}/clase/${cl[0].tokenInvitacion}`;

    /** Abre un enlace con una sesión (o sin ninguna) y devuelve lo que se lee en pantalla. */
    async function conLaCuenta(email: string | null, url: string): Promise<string> {
      const page = email
        ? await sesionDe(navegador, email)
        : await (await navegador.createBrowserContext()).newPage();
      if (!email) page.setDefaultNavigationTimeout(90_000);
      await page.goto(url, { waitUntil: "domcontentloaded" });
      await esperar(2500);
      const visible = await texto(page);
      await page.close();
      return visible;
    }

    console.log("\n═══ El enlace de PROFESORADO, con cada sesión ═══");

    console.log("\n  Sin sesión");
    let v = await conLaCuenta(null, urlProfesorado);
    comprobar("se le ofrece crear su cuenta de profesor", /Crear mi cuenta de profesor/i.test(v));
    // Las dos cosas están en pestañas desde el 9 sep 2026, no en un texto al pie.
    comprobar("y una pestaña para entrar con la que ya tenga", /Ya uso Annonia/i.test(v));

    console.log("\n  Nutricionista sin nada de docencia");
    v = await conLaCuenta(`nutri@${DOMINIO}`, urlProfesorado);
    comprobar("se le ofrece añadir el acceso de profesor", /Añadir el acceso de profesor/i.test(v));
    comprobar("y se le dice con qué cuenta está dentro", v.includes(`nutri@${DOMINIO}`));

    console.log("\n  Profesor de ESTA universidad");
    v = await conLaCuenta(`profe.esta@${DOMINIO}`, urlProfesorado);
    comprobar("se le dice que ya tiene acceso", /Ya tienes acceso de profesor/i.test(v));
    comprobar("y el botón lleva a su espacio docente", /Ir a mi espacio docente/i.test(v));

    console.log("\n  Profesor de OTRA universidad");
    v = await conLaCuenta(`profe.otra@${DOMINIO}`, urlProfesorado);
    comprobar("se le dice que no puede estar en dos a la vez", /no se puede estar en dos a la vez/i.test(v),
      v.split("\n").filter(Boolean).slice(3, 6).join(" · "));
    comprobar("y NO se le dice que ya tiene acceso a esta", !/Ya tienes acceso de profesor/i.test(v));

    console.log("\n  Profesor que se quedó SIN universidad");
    v = await conLaCuenta(`profe.sinuni@${DOMINIO}`, urlProfesorado);
    comprobar("se le ofrece entrar en esta universidad", /Unirme a esta universidad/i.test(v),
      v.split("\n").filter(Boolean).slice(3, 6).join(" · "));
    comprobar("y NO se le manda a un espacio docente que no existe", !/Ir a mi espacio docente/i.test(v));

    console.log("\n  Alumno");
    v = await conLaCuenta(`alumno.dentro@${DOMINIO}`, urlProfesorado);
    comprobar("se le dice que su cuenta es de alumno", /cuenta es de alumno/i.test(v));

    console.log("\n═══ El enlace de la CLASE, con cada sesión ═══");

    console.log("\n  Sin sesión");
    v = await conLaCuenta(null, urlClase);
    comprobar("se le ofrece crear su cuenta", /Crea tu cuenta/i.test(v));

    console.log("\n  Nutricionista sin nada de docencia");
    v = await conLaCuenta(`nutri@${DOMINIO}`, urlClase);
    comprobar("se le ofrece apuntarse con su cuenta", /Apuntarme a la clase con esta cuenta/i.test(v));

    console.log("\n  Alumno YA matriculado en esta clase");
    v = await conLaCuenta(`alumno.dentro@${DOMINIO}`, urlClase);
    comprobar("se le dice que ya está en esta clase", /Ya estás en esta clase/i.test(v),
      v.split("\n").filter(Boolean).slice(2, 5).join(" · "));
    comprobar("y se le lleva a su aula, no a apuntarse otra vez", /Ir a mi aula/i.test(v));

    console.log("\n  Alumno de otra facultad");
    v = await conLaCuenta(`alumno.otra@${DOMINIO}`, urlClase);
    comprobar("sí puede apuntarse: un alumno no está atado a una sola", /Apuntarme a la clase con esta cuenta/i.test(v));

    console.log("\n  Profesor de esta universidad");
    v = await conLaCuenta(`profe.esta@${DOMINIO}`, urlClase);
    comprobar("se le explica que el enlace es para sus alumnos", /Estás dentro como profesor/i.test(v));
    comprobar("y el botón le lleva a sus clases", /Ir a mis clases/i.test(v));

    console.log("\n  Profesor SIN universidad");
    v = await conLaCuenta(`profe.sinuni@${DOMINIO}`, urlClase);
    comprobar("no se le ofrece ir a unas clases que no tiene", !/Ir a mis clases/i.test(v),
      v.split("\n").filter(Boolean).slice(2, 6).join(" · "));
    comprobar("se le manda a su cuenta", /Ir a mi cuenta/i.test(v));

    await limpiar(client);
  } finally {
    await navegador.close();
    await pool.end();
  }
  console.log(`\n${mal === 0 ? "✓ TODO CORRECTO" : "✗ HAY FALLOS"} — ${ok} bien, ${mal} mal`);
  process.exit(mal === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });

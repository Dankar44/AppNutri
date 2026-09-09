/**
 * #39 — El curso se cierra solo (y lo que NO se cierra).
 *
 * En septiembre no hay nadie pendiente de nada: el acceso del alumno caduca con la fecha de fin
 * de su clase, y se comprueba al entrar. Aquí se vigila que caduque de verdad, que no arrastre a
 * quien no debe (al profesor no se le echa, y a quien ya era nutricionista tampoco) y, sobre
 * todo, que no se borre nada por el camino.
 *
 *   1. npm run dev:desarrollo        (puerto 3001)
 *   2. DB=dev npx tsx scripts/probar-ciclo-curso.ts
 *
 * Crea sus datos y los borra. Solo con DB=dev.
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
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: false } });

const MARCA = "PRUEBACICLO";
const DOMINIO = "pruebaciclo.dev";
const PASS = "Ciclo_2026_Prueba";

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

async function crearCuenta(client: Conexion, email: string, extra: Record<string, unknown> = {}) {
  const { rows } = await client.query(
    `INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
       created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous,
       confirmation_token, recovery_token, email_change_token_new, email_change,
       email_change_token_current, reauthentication_token, phone_change, phone_change_token)
     VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
       $1, crypt($2, gen_salt('bf')), NOW(), NOW(), NOW(),
       '{"provider":"email","providers":["email"]}', '{}'::jsonb, false, false, '','','','','','','','')
     RETURNING id`, [email, PASS]);
  const authId = rows[0].id as string;
  await client.query(
    `INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
     VALUES (gen_random_uuid(), $1::uuid, $1::text, 'email',
       jsonb_build_object('sub',$1::text,'email',$2::text,'email_verified',true,'provider','email'), NOW(), NOW(), NOW())`,
    [authId, email]);
  const campos = Object.keys(extra);
  const { rows: d } = await client.query(
    `INSERT INTO dietistas (id, "authId", email, nombre, apellidos, verificado, "createdAt", "updatedAt"${campos.map((c) => `, "${c}"`).join("")})
     VALUES (gen_random_uuid()::text, $1, $2, '${MARCA}', 'Prueba', true, NOW(), NOW()${campos.map((_, i) => `, $${3 + i}`).join("")}) RETURNING id`,
    [authId, email, ...campos.map((c) => extra[c])]);
  return d[0].id as string;
}

async function sesionDe(navegador: Browser, email: string): Promise<Page> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const sb = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
  const { data, error } = await sb.auth.signInWithPassword({ email, password: PASS });
  if (error) throw new Error(`login de ${email}: ${error.message}`);
  const ctx = await navegador.createBrowserContext();
  const page = await ctx.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.evaluateOnNewDocument(() => { try { localStorage.setItem("annonia-welcome-dietista", "1"); } catch { /* ignore */ } });
  await page.setCookie({
    name: `sb-${url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1]}-auth-token`,
    value: "base64-" + Buffer.from(JSON.stringify(data.session)).toString("base64"),
    domain: "localhost", path: "/",
  });
  return page;
}

// Con `altaAt` se decide hasta qué 31 de agosto es alumno: quien entró el curso pasado ya lo ha pasado.
async function matricular(client: Conexion, claseId: string, alumnoId: string, altaAt = "NOW()") {
  await client.query(
    `INSERT INTO alumnos_clase (id, "claseId", "alumnoId", "altaAt") VALUES (gen_random_uuid()::text, $1, $2, ${altaAt})`,
    [claseId, alumnoId]);
}

async function crearClase(client: Conexion, profesorId: string, licenciaId: string, nombre: string, fechaFin: string) {
  const { rows } = await client.query(
    `INSERT INTO clases (id, "profesorId", "licenciaDocenteId", nombre, "fechaFinCurso", "createdAt", "updatedAt")
     VALUES (gen_random_uuid()::text, $1, $2, $3, $4, NOW(), NOW()) RETURNING id`,
    [profesorId, licenciaId, nombre, fechaFin]);
  return rows[0].id as string;
}

async function limpiar(client: Conexion) {
  await client.query(`DELETE FROM invitaciones_docentes WHERE email LIKE '%@${DOMINIO}'`);
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
  const client = conexionResistente(pool);
  const navegador = await puppeteer.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true, args: ["--no-sandbox"],
  });
  try {
    await limpiar(client);
    const { rows: lic } = await client.query(
      `INSERT INTO licencias_docentes (id, institucion, "maxProfesores", "maxAlumnos", "fechaFin", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, '${MARCA} Facultad', 3, 50, '2027-08-31', NOW(), NOW()) RETURNING id`);
    const licenciaId = lic[0].id as string;

    const profesorId = await crearCuenta(client, `profe@${DOMINIO}`, { rolDocente: "PROFESOR", licenciaDocenteId: licenciaId });
    const claseViva = await crearClase(client, profesorId, licenciaId, `${MARCA} en marcha`, "2027-08-31");
    const clasePasada = await crearClase(client, profesorId, licenciaId, `${MARCA} del año pasado`, "2026-06-30");

    // Cinco personas distintas, cada una con un caso que hay que separar bien.
    const alDentro = await crearCuenta(client, `dentro@${DOMINIO}`, { rolDocente: "ALUMNO", licenciaDocenteId: licenciaId, cuentaDeClase: true });
    const alFuera = await crearCuenta(client, `fuera@${DOMINIO}`, { rolDocente: "ALUMNO", licenciaDocenteId: licenciaId, cuentaDeClase: true });
    const alNutri = await crearCuenta(client, `nutri@${DOMINIO}`, { rolDocente: "ALUMNO", licenciaDocenteId: licenciaId, cuentaDeClase: false });
    const alPaga = await crearCuenta(client, `paga@${DOMINIO}`, { rolDocente: "ALUMNO", licenciaDocenteId: licenciaId, cuentaDeClase: true });
    await matricular(client, claseViva, alDentro);
    await matricular(client, clasePasada, alFuera, "'2025-10-01'");
    await matricular(client, clasePasada, alNutri, "'2025-10-01'");
    await matricular(client, clasePasada, alPaga, "'2025-10-01'");
    await client.query(
      `INSERT INTO suscripciones (id, "dietistaId", plan, estado, "fechaInicio", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, 'PROFESIONAL', 'ACTIVA', NOW(), NOW(), NOW())`, [alPaga]);
    // Trabajo del alumno cuyo curso ya pasó: nada de esto puede desaparecer.
    await client.query(
      `INSERT INTO pacientes (id, "dietistaId", nombre, apellidos, "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, 'Caso', 'De practicas', NOW(), NOW())`, [alFuera]);

    console.log("\n── Con el curso en marcha se entra normal ──");
    let page = await sesionDe(navegador, `dentro@${DOMINIO}`);
    await page.goto(`${BASE}/entrar`, { waitUntil: "networkidle0" });
    await esperar(1500);
    comprobar("el alumno entra a su aula", page.url().endsWith("/aula"), page.url());

    console.log("\n── Ajustes de un alumno ──");
    await page.goto(`${BASE}/ajustes`, { waitUntil: "networkidle0" });
    await esperar(1500);
    let visible = await texto(page);
    comprobar("se le dice que su cuenta es de clase", visible.includes("Cuenta de clase"));
    comprobar("ve de qué clase viene", visible.includes(`${MARCA} en marcha`));
    comprobar("no se le ofrece cambiar de plan", !visible.includes("Plan PROFESIONAL"));
    comprobar("no puede borrarse la cuenta él solo", !/Eliminar (mi )?cuenta/i.test(visible.split("Zona")[1] ?? visible),
      (await page.evaluate(() => Array.from(document.querySelectorAll("button")).map((b) => b.textContent?.trim()).filter((x) => /elimin/i.test(x ?? "")).join(" | "))) || "sin botón de eliminar");
    const { rows: subs } = await client.query(`SELECT COUNT(*)::int n FROM suscripciones WHERE "dietistaId" = $1`, [alDentro]);
    comprobar("asomarse a ajustes NO le crea una suscripción", subs[0].n === 0, `${subs[0].n} suscripciones`);

    console.log("\n── Cuando el curso ya ha pasado: aviso, no puerta cerrada ──");
    page = await sesionDe(navegador, `fuera@${DOMINIO}`);
    await page.goto(`${BASE}/entrar`, { waitUntil: "networkidle0" });
    await esperar(1800);
    comprobar("se le enseña el aviso", page.url().includes("/curso-terminado"), page.url());
    visible = await texto(page);
    comprobar("se le explica que su año escolar terminó", visible.includes("Se ha acabado tu año escolar"));
    comprobar("se le dice que la cuenta se le queda", /la tienes gratis/i.test(visible));
    comprobar("y que no se ha borrado nada", visible.includes("No se ha borrado nada"));
    comprobar("puede entrar a su cuenta", visible.includes("Entrar a mi cuenta"));
    const { rows: yaNoEsAlumno } = await client.query(
      `SELECT "rolDocente", "exAlumnoDesde" FROM dietistas WHERE id = $1`, [alFuera]);
    comprobar("deja de ser alumno y pasa a cuenta normal", yaNoEsAlumno[0].rolDocente === null);
    comprobar("queda anotado desde cuándo", yaNoEsAlumno[0].exAlumnoDesde !== null);
    const { rows: suyo } = await client.query(`SELECT COUNT(*)::int n FROM pacientes WHERE "dietistaId" = $1`, [alFuera]);
    comprobar("su trabajo sigue en su sitio", suyo[0].n === 1);

    console.log("\n── Y al darle a entrar, usa la aplicación como cualquiera ──");
    await pulsar(page, "Entrar a mi cuenta");
    await esperar(3500);
    comprobar("entra al panel", page.url().endsWith("/dashboard"), page.url());
    await page.goto(`${BASE}/pacientes`, { waitUntil: "networkidle0" });
    await esperar(1500);
    comprobar("y a sus pacientes", page.url().endsWith("/pacientes"), page.url());
    const paginaPacientes = await texto(page);
    comprobar("con su caso de prácticas dentro", paginaPacientes.includes("Caso"),
      paginaPacientes.split("\n").slice(0, 4).join(" / "));
    await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle0" });
    await esperar(1500);
    comprobar("y el aviso ya no vuelve a salir", page.url().endsWith("/dashboard"), page.url());

    console.log("\n── A quien ya era nutricionista no se le cambia el rol ni se le avisa ──");
    page = await sesionDe(navegador, `nutri@${DOMINIO}`);
    await page.goto(`${BASE}/entrar`, { waitUntil: "networkidle0" });
    await esperar(1800);
    comprobar("entra directo, sin aviso ninguno", page.url().endsWith("/dashboard"), page.url());
    const { rows: nutriTrasCurso } = await client.query(
      `SELECT "rolDocente", "cuentaDeClase", "exAlumnoDesde" FROM dietistas WHERE id = $1`, [alNutri]);
    comprobar("y su cuenta sigue sin ser de clase", nutriTrasCurso[0].cuentaDeClase === false);
    comprobar("se le quita el rol de alumno, que ya no es", nutriTrasCurso[0].rolDocente === null);
    comprobar("pero sin marcarle como exalumno: nunca fue una cuenta de clase",
      nutriTrasCurso[0].exAlumnoDesde === null);

    console.log("\n── Y quien ya tenía suscripción propia, igual ──");
    page = await sesionDe(navegador, `paga@${DOMINIO}`);
    await page.goto(`${BASE}/entrar`, { waitUntil: "networkidle0" });
    await esperar(1800);
    // Nació en una clase, así que sí ve el aviso; lo que se comprueba es que después entra.
    comprobar("ve el aviso y luego entra", page.url().includes("/curso-terminado"), page.url());
    await pulsar(page, "Entrar a mi cuenta");
    await esperar(3000);
    comprobar("con su suscripción entra como cualquier cliente", page.url().endsWith("/dashboard"), page.url());

    console.log("\n── El aviso no le sale a quien sigue en clase ──");
    page = await sesionDe(navegador, `dentro@${DOMINIO}`);
    await page.goto(`${BASE}/curso-terminado`, { waitUntil: "networkidle0" });
    await esperar(1500);
    comprobar("al alumno con curso vivo se le devuelve al panel", page.url().endsWith("/dashboard"), page.url());

    console.log("\n── Al profesor no se le echa nunca ──");
    const profe = await sesionDe(navegador, `profe@${DOMINIO}`);
    await profe.goto(`${BASE}/entrar`, { waitUntil: "networkidle0" });
    await esperar(1800);
    comprobar("entra a su espacio docente", profe.url().includes("/profesor"), profe.url());
    await profe.goto(`${BASE}/profesor/clases/${clasePasada}`, { waitUntil: "networkidle0" });
    await esperar(1500);
    visible = await texto(profe);
    comprobar("ve la clase del curso pasado", visible.includes(`${MARCA} del año pasado`));
    comprobar("se le avisa de que ese curso terminó", visible.includes("Este curso ya ha terminado"));
    comprobar("y no se le deja dar altas ahí", (await profe.$("textarea")) === null);

    console.log("\n── Cerrar el curso de una clase ──");
    await profe.goto(`${BASE}/profesor/clases/${claseViva}`, { waitUntil: "networkidle0" });
    await esperar(1500);
    comprobar("aparece el botón de cerrar el curso", (await texto(profe)).includes("Cerrar el curso"));
    await pulsar(profe, "Cerrar el curso");
    await esperar(600);
    comprobar("avisa de que no se borra nada", /NO se borra nada/i.test(await texto(profe)));
    await pulsar(profe, "Cerrar el curso", "[role='dialog']");
    await esperar(3500);
    const { rows: tras } = await client.query(
      `SELECT activa, "bajaAt" FROM alumnos_clase WHERE "claseId" = $1`, [claseViva]);
    comprobar("todos los alumnos salen de golpe", tras.every((m) => m.activa === false), `${tras.length} matrículas`);
    comprobar("queda anotado cuándo", tras.every((m) => m.bajaAt !== null));
    comprobar("sus cuentas siguen existiendo",
      (await client.query(`SELECT COUNT(*)::int n FROM dietistas WHERE id = $1`, [alDentro])).rows[0].n === 1);

    console.log("\n── Y el que estaba dentro sigue siendo alumno hasta su 31 de agosto ──");
    // Entró este curso: le queda año escolar. No se le echa: entra a su aula, que le dice que ahora
    // mismo no está en ninguna clase (Guillermo, 4 sep 2026).
    page = await sesionDe(navegador, `dentro@${DOMINIO}`);
    await page.goto(`${BASE}/entrar`, { waitUntil: "networkidle0" });
    await esperar(1800);
    comprobar("al cerrarle el curso a mitad de año NO se le echa: entra a su aula", page.url().endsWith("/aula"), page.url());
    visible = await texto(page);
    comprobar("y el aula le dice que ahora no está en ninguna clase", visible.includes("No estás en ninguna clase ahora mismo"));
    comprobar("con la clase entre las anteriores", visible.includes(`${MARCA} en marcha`));
    comprobar("sigue siendo alumno en la base de datos",
      (await client.query(`SELECT "rolDocente" FROM dietistas WHERE id = $1`, [alDentro])).rows[0].rolDocente === "ALUMNO");

    console.log("\n── Archivar la clase tampoco le echa, y desarchivarla se la devuelve ──");
    await client.query(`UPDATE alumnos_clase SET activa = true, "bajaAt" = NULL WHERE "claseId" = $1`, [claseViva]);
    await client.query(`UPDATE clases SET archivada = true WHERE id = $1`, [claseViva]);
    page = await sesionDe(navegador, `dentro@${DOMINIO}`);
    await page.goto(`${BASE}/entrar`, { waitUntil: "networkidle0" });
    await esperar(1800);
    comprobar("con la clase archivada entra a su aula, sin aviso", page.url().endsWith("/aula") && (await texto(page)).includes("No estás en ninguna clase ahora mismo"), page.url());
    await client.query(`UPDATE clases SET archivada = false WHERE id = $1`, [claseViva]);
    await page.goto(`${BASE}/aula`, { waitUntil: "networkidle0" });
    await esperar(1500);
    comprobar("al desarchivarla la vuelve a tener", (await texto(page)).includes("Estás en 1 clase"));

    console.log("\n── Y una licencia caducada, igual: sigue en su aula ──");
    await client.query(`UPDATE licencias_docentes SET "fechaFin" = '2020-01-01' WHERE id = $1`, [licenciaId]);
    page = await sesionDe(navegador, `dentro@${DOMINIO}`);
    await page.goto(`${BASE}/entrar`, { waitUntil: "networkidle0" });
    await esperar(1800);
    comprobar("si la facultad no ha renovado, el alumno sigue en su aula hasta su 31 de agosto", page.url().endsWith("/aula"), page.url());
    const profe2 = await sesionDe(navegador, `profe@${DOMINIO}`);
    await profe2.goto(`${BASE}/profesor`, { waitUntil: "networkidle0" });
    await esperar(1500);
    // El profesor SÍ pierde el espacio cuando la facultad no renueva (cambiado el 8 sep 2026: antes
    // seguía entrando y usaba el módulo sin pagar). El alumno aguanta hasta su 31 de agosto.
    comprobar("y el profesor pierde el suyo hasta que renueven",
      profe2.url().includes("/docencia-terminada"), profe2.url());
    comprobar("con el aviso de que no se ha borrado nada",
      /no se ha borrado nada/i.test(await profe2.evaluate(() => document.body.innerText)));
  } finally {
    await limpiar(client);
    await navegador.close();
    await pool.end();
  }

  console.log(`\n${mal === 0 ? "✓" : "✗"} ${ok} bien, ${mal} mal`);
  process.exit(mal === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });

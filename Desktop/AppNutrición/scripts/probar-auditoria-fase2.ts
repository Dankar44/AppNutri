/**
 * #39 — Lo que encontró la auditoría de la fase 2, convertido en pruebas.
 *
 * Cada comprobación de aquí nació de un agujero real (1 sep 2026). Están juntas para que ninguno
 * pueda volver sin que salte algo: son las que cuestan dinero (bolsa) o datos (borrados ajenos).
 *
 *   1. npm run dev:desarrollo        (puerto 3001)
 *   2. DB=dev npx tsx scripts/probar-auditoria-fase2.ts
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

const MARCA = "PRUEBAAUD";
const DOMINIO = "pruebaaud.dev";
const PASS = "Auditoria_2026_X";

let ok = 0, mal = 0;
const comprobar = (t: string, c: boolean, d = "") => { console.log(`  ${c ? "✓" : "✗"} ${t}${d ? ` — ${d}` : ""}`); c ? ok++ : mal++; };
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));
const texto = (page: Page) => page.evaluate(() => document.body.innerText);

/** Los avisos se van solos: hay que mirarlos mientras salen, no cuando ya ha pasado la espera. */
async function esperarToast(page: Page, maxMs = 8000): Promise<string> {
  const hasta = Date.now() + maxMs;
  while (Date.now() < hasta) {
    const t = await page.evaluate(() =>
      Array.from(document.querySelectorAll("[data-sonner-toast]")).map((x) => x.textContent ?? "").join(" | "));
    if (t.trim()) return t;
    await esperar(200);
  }
  return "";
}

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

async function crearCuenta(client: pg.PoolClient, email: string, extra: Record<string, unknown> = {}) {
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
     VALUES (gen_random_uuid()::text, $1, $2, '${MARCA}', 'Prueba', true, NOW(), NOW()${campos.map((_, i) => `, $${3 + i}`).join("")}) RETURNING id`,
    [authId, email, ...campos.map((c) => extra[c])]);
  return rows[0].id as string;
}

async function sesionDe(navegador: Browser, email: string): Promise<Page> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const sb = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
  const { data, error } = await sb.auth.signInWithPassword({ email, password: PASS });
  if (error) throw new Error(`login de ${email}: ${error.message}`);
  const ctx = await navegador.createBrowserContext();
  const page = await ctx.newPage();
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

/** Las dos cuentas de la bolsa, en SQL, para poder comprobarlas desde fuera de Next. */
async function ocupadas(client: pg.PoolClient, licenciaId: string): Promise<number> {
  const { rows } = await client.query(
    `SELECT COUNT(DISTINCT ac."alumnoId")::int n FROM alumnos_clase ac JOIN clases c ON c.id = ac."claseId"
      WHERE ac.activa AND c."licenciaDocenteId" = $1 AND c.archivada = false
        AND (c."fechaFinCurso" IS NULL OR c."fechaFinCurso" >= CURRENT_DATE)`, [licenciaId]);
  return rows[0].n;
}

async function libres(client: pg.PoolClient, licenciaId: string): Promise<number> {
  const { rows } = await client.query(
    `SELECT GREATEST(0, l."maxAlumnos"
       - (SELECT COUNT(DISTINCT ac."alumnoId") FROM alumnos_clase ac JOIN clases c ON c.id = ac."claseId"
           WHERE ac.activa AND c."licenciaDocenteId" = l.id AND c.archivada = false
             AND (c."fechaFinCurso" IS NULL OR c."fechaFinCurso" >= CURRENT_DATE))
       - (SELECT COUNT(DISTINCT i.email) FROM invitaciones_docentes i JOIN clases c2 ON c2.id = i."claseId"
           WHERE i.rol = 'ALUMNO' AND i."aceptadaAt" IS NULL AND i."expiraAt" >= NOW()
             AND i."licenciaDocenteId" = l.id AND c2.archivada = false))::int AS n
       FROM licencias_docentes l WHERE l.id = $1`, [licenciaId]);
  return rows[0].n;
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
      `INSERT INTO licencias_docentes (id, institucion, "maxProfesores", "maxAlumnos", "fechaFin", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, '${MARCA} Universidad', 3, 3, '2027-08-31', NOW(), NOW()) RETURNING id`);
    const licenciaId = lic[0].id as string;
    const profesorId = await crearCuenta(client, `profe@${DOMINIO}`, { rolDocente: "PROFESOR", licenciaDocenteId: licenciaId });
    const crearClase = async (nombre: string) => {
      const { rows } = await client.query(
        `INSERT INTO clases (id, "profesorId", "licenciaDocenteId", nombre, "fechaFinCurso", "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::text, $1, $2, $3, '2027-08-31', NOW(), NOW()) RETURNING id`,
        [profesorId, licenciaId, `${MARCA} ${nombre}`]);
      return rows[0].id as string;
    };
    const claseA = await crearClase("clase A");
    const claseB = await crearClase("clase B");

    console.log("\n── La última plaza es de UNO, aunque lleguen cinco a la vez ──");
    // El fallo: la bolsa se contaba fuera de la transacción, así que varias altas simultáneas
    // leían todas "queda 1" y entraban todas. Ahora la fila de la licencia se bloquea mientras se
    // cuenta y se escribe, así que hacen cola. Se prueba por el camino real: el enlace de clase.
    await client.query(`UPDATE licencias_docentes SET "maxAlumnos" = 1 WHERE id = $1`, [licenciaId]);
    await client.query(
      `UPDATE clases SET "tokenInvitacion" = 'tokencarrera', "invitacionAbierta" = true WHERE id = $1`, [claseA]);

    const corredores = await Promise.all(
      Array.from({ length: 5 }, async (_, i) => {
        const p = await (await navegador.createBrowserContext()).newPage();
        await p.setViewport({ width: 1280, height: 900 });
        await p.goto(`${BASE}/clase/tokencarrera`, { waitUntil: "networkidle0" });
        // Sin declarar funciones dentro de evaluate: tsx inyecta un ayudante (`__name`) que no
        // existe en el navegador y revienta. Ya mordió una vez.
        await p.evaluate((n) => {
          const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
          const valores: [string, string][] = [
            ["input[type=text]", `Corredor${n}`],
            ["input[type=email]", `corredor${n}@pruebaaud.dev`],
            ["input[type=password]", "Carrera_2026_X"],
          ];
          for (const [selector, valor] of valores) {
            const c = document.querySelector(selector) as HTMLInputElement | null;
            if (c) {
              setter.call(c, valor);
              c.dispatchEvent(new Event("input", { bubbles: true }));
            }
          }
          const textos = Array.from(document.querySelectorAll('input[type="text"]'));
          if (textos[1]) {
            setter.call(textos[1] as HTMLInputElement, "Prueba");
            textos[1].dispatchEvent(new Event("input", { bubbles: true }));
          }
        }, i);
        return p;
      }),
    );
    // Todos pulsan a la vez: es el caso de una clase entera apuntándose al terminar la charla.
    await Promise.all(corredores.map((p) => p.evaluate(() => {
      const b = Array.from(document.querySelectorAll("button")).find((x) => x.textContent?.includes("Apuntarme"));
      (b as HTMLElement | undefined)?.click();
    })));
    await esperar(12000);

    const { rows: entraron } = await client.query(
      `SELECT COUNT(*)::int n FROM dietistas WHERE email LIKE 'corredor%@${DOMINIO}'`);
    comprobar("solo se crea una cuenta de las cinco", entraron[0].n === 1, `${entraron[0].n} cuentas`);
    comprobar("la bolsa queda en 1 de 1", (await ocupadas(client, licenciaId)) === 1);
    comprobar("sin plazas libres", (await libres(client, licenciaId)) === 0);
    comprobar("y ninguna cuenta se queda a medias en auth",
      (await client.query(
        `SELECT COUNT(*)::int n FROM auth.users u WHERE u.email LIKE 'corredor%@${DOMINIO}'
           AND NOT EXISTS (SELECT 1 FROM dietistas d WHERE d."authId" = u.id::text)`)).rows[0].n === 0);
    for (const p of corredores) await p.close();

    console.log("\n── Archivar y desarchivar no duplica la bolsa ──");
    await client.query(`UPDATE licencias_docentes SET "maxAlumnos" = 2 WHERE id = $1`, [licenciaId]);
    await client.query(`UPDATE clases SET archivada = true WHERE id = $1`, [claseA]);
    comprobar("archivada, su alumno deja de ocupar", (await ocupadas(client, licenciaId)) === 0);
    // Se llena la clase B con las 2 plazas y se intenta recuperar la A
    for (let i = 0; i < 2; i++) {
      const alumnoId = await crearCuenta(client, `relleno${i}@${DOMINIO}`,
        { rolDocente: "ALUMNO", licenciaDocenteId: licenciaId, cuentaDeClase: true });
      await client.query(
        `INSERT INTO alumnos_clase (id, "claseId", "alumnoId", "altaAt") VALUES (gen_random_uuid()::text, $1, $2, NOW())`,
        [claseB, alumnoId]);
    }
    comprobar("la clase B ocupa las dos plazas", (await ocupadas(client, licenciaId)) === 2);

    const profe = await sesionDe(navegador, `profe@${DOMINIO}`);
    await profe.goto(`${BASE}/profesor/clases/${claseA}`, { waitUntil: "networkidle0" });
    await esperar(1500);
    await pulsar(profe, "Desarchivar");
    await esperar(600);
    await pulsar(profe, "Desarchivar", "[role='dialog']");
    const avisoDesarchivar = await esperarToast(profe);
    await esperar(1500);
    const { rows: sigueArchivada } = await client.query(`SELECT archivada FROM clases WHERE id = $1`, [claseA]);
    comprobar("no deja desarchivar si no caben", sigueArchivada[0].archivada === true);
    comprobar("y se explica por qué", /no caben/i.test(avisoDesarchivar), avisoDesarchivar || "no dice nada");
    comprobar("la bolsa sigue en 2, no en 3", (await ocupadas(client, licenciaId)) === 2);

    console.log("\n── El cupo no se puede bajar por debajo de lo ya repartido ──");
    await client.query(`UPDATE licencias_docentes SET "maxAlumnos" = 10 WHERE id = $1`, [licenciaId]);
    await client.query(
      `INSERT INTO invitaciones_docentes (id, token, email, rol, "claseId", "licenciaDocenteId", "invitadoPor", "expiraAt", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, 'tokenaud1', 'invitado1@${DOMINIO}', 'ALUMNO', $1, $2, $3, NOW() + INTERVAL '30 days', NOW(), NOW()),
              (gen_random_uuid()::text, 'tokenaud2', 'invitado2@${DOMINIO}', 'ALUMNO', $1, $2, $3, NOW() + INTERVAL '30 days', NOW(), NOW())`,
      [claseB, licenciaId, profesorId]);
    comprobar("las invitaciones vivas reservan plaza", (await libres(client, licenciaId)) === 6,
      `${await libres(client, licenciaId)} libres de 10`);

    console.log("\n── Una invitación de hace un mes no vale si la clase ya no está ──");
    const { rows: invArch } = await client.query(
      `INSERT INTO invitaciones_docentes (id, token, email, rol, "claseId", "licenciaDocenteId", "invitadoPor", "expiraAt", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, 'tokenaud3', 'tarde@${DOMINIO}', 'ALUMNO', $1, $2, $3, NOW() + INTERVAL '30 days', NOW(), NOW())
       RETURNING token`, [claseA, licenciaId, profesorId]);
    const anonimo = await (await navegador.createBrowserContext()).newPage();
    await anonimo.goto(`${BASE}/invitacion/${invArch[0].token}`, { waitUntil: "networkidle0" });
    await esperar(900);
    const paginaInvitacion = await texto(anonimo);
    comprobar("la invitación a una clase archivada no deja crear cuenta",
      !paginaInvitacion.includes("Crear mi cuenta"), paginaInvitacion.split("\n").slice(0, 2).join(" / "));
    comprobar("y no le llama profesor a quien iba a ser alumno",
      !paginaInvitacion.includes("cuenta de profesor"), paginaInvitacion.split("\n")[0]);

    console.log("\n── Una licencia con la fecha pasada cierra el enlace público ──");
    const tokenClase = "tokenaudclase";
    await client.query(
      `UPDATE clases SET "tokenInvitacion" = $1, "invitacionAbierta" = true WHERE id = $2`, [tokenClase, claseB]);
    await anonimo.goto(`${BASE}/clase/${tokenClase}`, { waitUntil: "networkidle0" });
    await esperar(800);
    comprobar("con la licencia vigente el enlace funciona", (await texto(anonimo)).includes("clase B"));
    await client.query(`UPDATE licencias_docentes SET "fechaFin" = '2020-01-01' WHERE id = $1`, [licenciaId]);
    await anonimo.goto(`${BASE}/clase/${tokenClase}`, { waitUntil: "networkidle0" });
    await esperar(800);
    comprobar("caducada por fecha, ya no", !(await texto(anonimo)).includes("Apuntarme"));
    await client.query(`UPDATE licencias_docentes SET "fechaFin" = '2027-08-31' WHERE id = $1`, [licenciaId]);

    console.log("\n── El enlace de la clase cambia al reabrirlo ──");
    await profe.goto(`${BASE}/profesor/clases/${claseB}`, { waitUntil: "networkidle0" });
    await esperar(1500);
    await pulsar(profe, "Con un enlace");
    await esperar(400);
    await pulsar(profe, "Cerrar el enlace");
    await esperar(3000);
    await pulsar(profe, "Con un enlace");
    await esperar(400);
    await pulsar(profe, "Abrir el enlace");
    await esperar(3000);
    const { rows: nuevoToken } = await client.query(`SELECT "tokenInvitacion" FROM clases WHERE id = $1`, [claseB]);
    comprobar("al reabrirlo el enlace viejo deja de valer", nuevoToken[0].tokenInvitacion !== tokenClase,
      `${tokenClase} → ${nuevoToken[0].tokenInvitacion}`);

    console.log("\n── Nadie borra los ingredientes de la receta de otro ──");
    const { rows: al } = await client.query(
      `INSERT INTO alimentos (id, nombre, "nombreNormalizado", categoria, calorias, proteinas, carbohidratos,
         grasas, fibra, porcion, unidad, origen, "dietistaId", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, '${MARCA} arroz', '${MARCA.toLowerCase()} arroz', 'CEREALES', 350, 7, 78, 1, 1,
         100, 'GRAMOS', 'PERSONALIZADO', $1, NOW(), NOW()) RETURNING id`, [profesorId]);
    const { rows: rec } = await client.query(
      `INSERT INTO recetas (id, nombre, "nombreNormalizado", porciones, calorias, proteinas, carbohidratos,
         grasas, fibra, "dietistaId", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, '${MARCA} receta del profe', '${MARCA.toLowerCase()} receta', 2, 300, 10, 50, 5, 2,
         $1, NOW(), NOW()) RETURNING id`, [profesorId]);
    await client.query(
      `INSERT INTO receta_ingredientes (id, "recetaId", "alimentoId", cantidad, unidad)
       VALUES (gen_random_uuid()::text, $1, $2, 100, 'GRAMOS')`, [rec[0].id, al[0].id]);

    // Las acciones exigen sesión, así que aquí se comprueba lo que se puede sin ella: que el
    // borrado va DESPUÉS de la comprobación de propiedad. Se mira en el código, que es donde
    // estaba el fallo: el `deleteMany` iba primero y se confirmaba aunque el update fallase.
    const fuente = await import("node:fs").then((fs) =>
      fs.readFileSync("src/app/actions/recetas.ts", "utf8"));
    const posComprobacion = fuente.indexOf('const suya = await prisma.receta.findFirst');
    const posBorrado = fuente.indexOf('await prisma.recetaIngrediente.deleteMany');
    comprobar("la comprobación de propiedad va antes del borrado",
      posComprobacion > 0 && posComprobacion < posBorrado);
    comprobar("los ingredientes de la receta del profesor siguen ahí",
      (await client.query(`SELECT COUNT(*)::int n FROM receta_ingredientes WHERE "recetaId" = $1`, [rec[0].id])).rows[0].n === 1);

    console.log("\n── El menú docente no se cae al entrar en el material ──");
    // El fallo: Dietas/Alimentos/Recetas son rutas compartidas con la consulta, así que al pulsar
    // en ellas el menú volvía al de nutricionista y desaparecía "Clases".
    const menuDe = async (page: Page) =>
      page.evaluate(() => (document.querySelector("aside, nav") as HTMLElement | null)?.innerText ?? "");
    await profe.goto(`${BASE}/profesor`, { waitUntil: "networkidle0" });
    await esperar(1200);
    comprobar("en su inicio ve Clases", (await menuDe(profe)).includes("Clases"));
    await profe.goto(`${BASE}/alimentos?espacio=docente`, { waitUntil: "networkidle0" });
    await esperar(1500);
    const menuMaterial = await menuDe(profe);
    comprobar("y al entrar en Alimentos sigue viendo Clases", menuMaterial.includes("Clases"),
      menuMaterial.split("\n").slice(0, 10).join(" / "));
    comprobar("sin que aparezcan Pacientes ni Agenda", !menuMaterial.includes("Pacientes"));
    // El espacio es un modo (2 sep 2026): una ruta compartida SIN marca no le cambia el menú, que
    // es lo que pasaba al crear una dieta desde la ficha del paciente de un caso (/dietas/nuevo).
    await profe.goto(`${BASE}/alimentos`, { waitUntil: "networkidle0" });
    await esperar(1500);
    comprobar("y si sigue por el material sin la marca, el menú docente se queda", (await menuDe(profe)).includes("Clases"));
    await profe.goto(`${BASE}/dashboard`, { waitUntil: "networkidle0" });
    await esperar(1500);
    comprobar("al ir a su cuenta profesional, el menú es el de siempre", (await menuDe(profe)).includes("Pacientes"));
    await profe.goto(`${BASE}/alimentos`, { waitUntil: "networkidle0" });
    await esperar(1500);
    comprobar("y desde ahí el material ya es el de su consulta", (await menuDe(profe)).includes("Pacientes"));

    console.log("\n── Desde su inicio se llega a las clases ──");
    await profe.goto(`${BASE}/profesor`, { waitUntil: "networkidle0" });
    await esperar(1200);
    comprobar("hay un botón a las clases en la propia página",
      await profe.evaluate(() => Array.from(document.querySelectorAll("main a, a"))
        .some((a) => a.getAttribute("href") === "/profesor/clases")));
    comprobar("y no dice que las clases estén 'en preparación'",
      !(await texto(profe)).includes("Clases y alta de alumnos"));

    console.log("\n── Al alumno sin clase no se le echa: pasa a cuenta normal ──");
    const expulsado = await crearCuenta(client, `expulsado@${DOMINIO}`,
      { rolDocente: "ALUMNO", licenciaDocenteId: licenciaId, cuentaDeClase: true });
    const claseVieja = await crearClase("clase del curso pasado");
    await client.query(`UPDATE clases SET "fechaFinCurso" = '2025-06-30' WHERE id = $1`, [claseVieja]);
    await client.query(
      `INSERT INTO alumnos_clase (id, "claseId", "alumnoId", "altaAt") VALUES (gen_random_uuid()::text, $1, $2, NOW())`,
      [claseVieja, expulsado]);
    const suPagina = await sesionDe(navegador, `expulsado@${DOMINIO}`);
    await suPagina.goto(`${BASE}/dashboard`, { waitUntil: "networkidle0" });
    await esperar(1800);
    comprobar("se le enseña el aviso de fin de curso", suPagina.url().includes("/curso-terminado"), suPagina.url());
    const { rows: convertido } = await client.query(
      `SELECT "rolDocente", "exAlumnoDesde", "cuentaDeClase" FROM dietistas WHERE id = $1`, [expulsado]);
    comprobar("y pasa a cuenta normal", convertido[0].rolDocente === null);
    comprobar("marcado como exalumno", convertido[0].exAlumnoDesde !== null);
    comprobar("sin perder que su cuenta nació en un aula", convertido[0].cuentaDeClase === true);
    await pulsar(suPagina, "Entrar a mi cuenta");
    await esperar(3000);
    comprobar("y entra a su cuenta como cualquiera", suPagina.url().endsWith("/dashboard"), suPagina.url());
    comprobar("su plaza ya no la ocupa", (await ocupadas(client, licenciaId)) === 2,
      `${await ocupadas(client, licenciaId)} ocupadas`);
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

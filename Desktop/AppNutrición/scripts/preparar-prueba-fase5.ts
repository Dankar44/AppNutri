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
import puppeteer, { type Page, type Browser } from "puppeteer-core";
import { createClient } from "@supabase/supabase-js";
import { execFileSync } from "node:child_process";

const BASE = "http://localhost:3001";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PROFE = { email: "profesor.prueba@annonia.dev", pass: "ProfesorPrueba2026" };
const ALUMNA = { email: "alumna.prueba@annonia.dev", pass: "AlumnaPrueba2026" };
// Una segunda para que la comparativa y el acta tengan con qué comparar: con una sola alumna, la
// mediana de la clase es ella misma y no se ve para qué sirve.
const ALUMNA2 = { email: "alumno2.prueba@annonia.dev", pass: "AlumnaPrueba2026", nombre: "Diego", apellidos: "de prueba" };
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: false } });

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));
/** Pulsa por texto, sea botón o enlace: en el aula las clases son enlaces y los casos, botones. */
const pulsar = (page: Page, txt: string) => page.evaluate((t) => {
  const todos = Array.from(document.querySelectorAll("button, a"));
  const encontrados = todos.filter((x) => x.textContent?.trim().includes(t));
  (encontrados[encontrados.length - 1] as HTMLElement | undefined)?.click();
}, txt);

/**
 * Una alumna entera: entra, empieza el caso, se hace un plan con comida y entrega por la interfaz.
 *
 * La entrega va con clics a propósito: así la foto la construye la aplicación igual que en la vida
 * real, y no un INSERT que se parezca.
 */
async function hacerElCaso(
  navegador: Browser,
  client: pg.PoolClient,
  quien: { email: string; pass: string },
  alumnaId: string,
  kcalObjetivo: number,
  /** Cuánto se pasa (o se queda corto) respecto a su objetivo, en %. */
  desvio: number,
) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const sb = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
  const { data, error } = await sb.auth.signInWithPassword({ email: quien.email, password: quien.pass });
  if (error) throw new Error(`login de ${quien.email}: ${error.message}`);
  const page = await (await navegador.createBrowserContext()).newPage();
  await page.setViewport({ width: 1440, height: 950 });
  await page.evaluateOnNewDocument(() => { try { localStorage.setItem("annonia-welcome-dietista", "1"); } catch { /* ignore */ } });
  await page.setCookie({
    name: `sb-${url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1]}-auth-token`,
    value: "base64-" + Buffer.from(JSON.stringify(data.session)).toString("base64"),
    domain: "localhost", path: "/",
  });

  await page.goto(`${BASE}/aula`, { waitUntil: "networkidle0" });
  await esperar(1500);
  const clase = await page.evaluate(() =>
    (document.querySelector('a[href*="/aula/"]') as HTMLAnchorElement | null)?.getAttribute("href") ?? "");
  if (clase) {
    await page.goto(`${BASE}${clase}`, { waitUntil: "networkidle0" });
    await esperar(2000);
  }
  await pulsar(page, "Empezar el caso");
  await esperar(4500);

  const { rows: copia } = await client.query(
    `SELECT id FROM pacientes WHERE "dietistaId" = $1 AND "esDeClase" = true LIMIT 1`, [alumnaId]);
  if (!copia.length) throw new Error(`${quien.email} no llegó a empezar el caso`);
  const copiaId = copia[0].id as string;

  const { rows: plani } = await client.query(
    `INSERT INTO planificaciones (id, "pacienteId", "dietistaId", nombre, datos, "createdAt", "updatedAt")
     VALUES (gen_random_uuid()::text, $1, $2, 'Mi planificación', $3::jsonb, NOW(), NOW())
     RETURNING id`, [copiaId, alumnaId, JSON.stringify({ kcalObjetivo })]);
  const { rows: plan } = await client.query(
    `INSERT INTO planes_alimenticios (id, "pacienteId", "dietistaId", nombre, "planificacionIds",
            activo, "caloriasObjetivo", "createdAt", "updatedAt")
     VALUES (gen_random_uuid()::text, $1, $2, 'Plan del caso', ARRAY[$3]::text[], true, $4, NOW(), NOW())
     RETURNING id`, [copiaId, alumnaId, plani[0].id, kcalObjetivo]);
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
         SELECT gen_random_uuid()::text, $1, a.id, 100, 'GRAMOS', row_number() OVER ()
           FROM (SELECT id FROM alimentos WHERE calorias > 80 ORDER BY random() LIMIT 3) a`,
        [c[0].id]);
    }
  }

  // Las cantidades se ajustan para que el plan se acerque al objetivo: con gramos fijos y alimentos
  // al azar salían 5.480 kcal al día, que no se parece a nada. `desvio` es lo que se quiere que le
  // sobre o le falte, para que la comparativa enseñe un caso normal y otro claramente pasado.
  const { rows: real } = await client.query(
    `SELECT COALESCE(SUM(a.calorias * ac.cantidad / 100.0), 0) / 3 AS kcal_dia
       FROM alimentos_en_comida ac
       JOIN alimentos a ON a.id = ac."alimentoId"
       JOIN comidas_del_dia c ON c.id = ac."comidaId"
       JOIN dias_del_plan d ON d.id = c."diaId"
      WHERE d."planId" = $1`, [plan[0].id]);
  const kcalDia = Number(real[0].kcal_dia) || 1;
  const factor = (kcalObjetivo * (1 + desvio / 100)) / kcalDia;
  await client.query(
    `UPDATE alimentos_en_comida SET cantidad = GREATEST(5, ROUND((cantidad * $2)::numeric))
      WHERE "comidaId" IN (
        SELECT c.id FROM comidas_del_dia c JOIN dias_del_plan d ON d.id = c."diaId" WHERE d."planId" = $1)`,
    [plan[0].id, factor]);

  await page.goto(`${BASE}/pacientes/${copiaId}`, { waitUntil: "networkidle0" });
  await esperar(3000);
  await pulsar(page, "Entregar");
  await esperar(1500);
  await pulsar(page, "Entregar");
  await esperar(1200);
  await pulsar(page, "Entregar");
  await esperar(7000);
  await page.close();
}

/** La segunda alumna: cuenta verificada y matriculada en la clase que acaba de montarse. */
async function crearAlumna(
  client: pg.PoolClient,
  quien: { email: string; pass: string; nombre: string; apellidos: string },
): Promise<string> {
  // Repetible: lanzar esto dos veces tiene que funcionar. Se borra por EMAIL, no por authId, que si
  // queda un `dietistas` huérfano el alta siguiente choca con el email único sin decir por qué.
  await client.query(`DELETE FROM pacientes WHERE "dietistaId" IN (SELECT id FROM dietistas WHERE email = $1)`, [quien.email]);
  await client.query(`DELETE FROM dietistas WHERE email = $1`, [quien.email]);
  const { rows: viejos } = await client.query(`SELECT id FROM auth.users WHERE email = $1`, [quien.email]);
  for (const v of viejos) {
    await client.query(`DELETE FROM auth.identities WHERE user_id = $1::uuid`, [v.id]);
    await client.query(`DELETE FROM auth.users WHERE id = $1::uuid`, [v.id]);
  }

  const { rows: u } = await client.query(
    `INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
       created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous,
       confirmation_token, recovery_token, email_change_token_new, email_change,
       email_change_token_current, reauthentication_token, phone_change, phone_change_token)
     VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
       $1, crypt($2, gen_salt('bf')), NOW(), NOW(), NOW(),
       '{"provider":"email","providers":["email"]}', '{}'::jsonb, false, false, '','','','','','','','')
     RETURNING id`, [quien.email, quien.pass]);
  const authId = u[0].id as string;
  await client.query(
    `INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
     VALUES (gen_random_uuid(), $1::uuid, $1::text, 'email',
       jsonb_build_object('sub',$1::text,'email',$2::text,'email_verified',true,'provider','email'), NOW(), NOW(), NOW())`,
    [authId, quien.email]);
  const { rows: d } = await client.query(
    `INSERT INTO dietistas (id, "authId", email, nombre, apellidos, verificado, "rolDocente", "createdAt", "updatedAt")
     VALUES (gen_random_uuid()::text, $1, $2, $3, $4, true, 'ALUMNO', NOW(), NOW()) RETURNING id`,
    [authId, quien.email, quien.nombre, quien.apellidos]);
  await client.query(
    `INSERT INTO alumnos_clase (id, "claseId", "alumnoId", activa, "createdAt", "updatedAt")
     SELECT gen_random_uuid()::text, c.id, $1, true, NOW(), NOW() FROM clases c LIMIT 1`, [d[0].id]);
  return d[0].id as string;
}

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

    // La segunda alumna: cuenta nueva y matriculada en la misma clase.
    const alumna2Id = await crearAlumna(client, ALUMNA2);

    console.log("  La alumna 1 hace su caso y entrega…");
    await hacerElCaso(navegador, client, ALUMNA, alumnaId, 1900, -4);
    console.log("  La alumna 2 hace el suyo, con otras cifras…");
    await hacerElCaso(navegador, client, ALUMNA2, alumna2Id, 2200, 38);

    const { rows: entregas } = await client.query(
      `SELECT id, "alumnoId", "entregaSnapshot" IS NOT NULL AS foto FROM entregas_caso WHERE "asignacionId" = $1`,
      [asignacionId]);
    if (entregas.length < 2 || entregas.some((e) => !e.foto)) {
      throw new Error(`esperaba dos entregas con foto y hay ${entregas.length}`);
    }

    // A una se le pone nota SIN publicar (así se ve el botón de publicar y el acta trae datos) y la
    // otra se deja sin corregir, que es lo que hace saltar el aviso de «tienes entregas esperando».
    await client.query(
      `UPDATE entregas_caso SET estado = 'CORREGIDA', nota = 7.5,
              comentario = 'Bien planteado; ajusta el hierro en la cena.', "visibleParaAlumno" = false
        WHERE "alumnoId" = $1`, [alumnaId]);
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

  Las DOS alumnas han entregado. A una le has puesto un 7,5 sin publicar; la otra está sin corregir,
  y por eso al entrar el profesor le saltará «tienes 1 entrega por revisar» (el plazo venció ayer).
  También hay un aviso de su consulta, para comprobar que no se mezcla con los de docencia.
`);
  } finally {
    client.release();
    await navegador.close();
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });

/**
 * #40 — Que la limpieza borre lo pesado y NO lo que hace falta (Guillermo, 6 sep 2026: «no se va a
 * poder mantener siempre todos los PDF ahí»).
 *
 * Monta entregas de verdad con su PDF y su foto del trabajo, las envejece, pasa
 * `limpiar-docencia --ejecutar` y comprueba, una por una, qué se ha ido y qué se ha quedado.
 * Además mira que las pantallas no ofrezcan descargar un PDF que ya no está.
 *
 *   DB=dev npx tsx scripts/probar-limpieza-docencia.ts
 *
 * Crea sus datos y los borra. Solo con DB=dev.
 */
import "./_guard-solo-dev";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";
import { execFileSync } from "node:child_process";
import puppeteer, { type Browser, type Page } from "puppeteer-core";
import { createClient } from "@supabase/supabase-js";

const BASE = "http://localhost:3001";
const MARCA = "LIMPIEZA";
const PASS = "LimpiezaPrueba_1";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: false } });

let ok = 0, mal = 0;
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function sesionDe(navegador: Browser, email: string): Promise<Page> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const sb = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
  const { data, error } = await sb.auth.signInWithPassword({ email, password: PASS });
  if (error) throw new Error(`login de ${email}: ${error.message}`);
  const ref = url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1];
  const page = await (await navegador.createBrowserContext()).newPage();
  await page.setViewport({ width: 1440, height: 950 });
  await page.evaluateOnNewDocument(() => {
    try { localStorage.setItem("annonia-welcome-dietista", "1"); localStorage.setItem("annonia-cookie-consent", "rejected"); } catch { /* da igual */ }
  });
  await page.setCookie({
    name: `sb-${ref}-auth-token`,
    value: "base64-" + Buffer.from(JSON.stringify(data.session)).toString("base64"),
    domain: "localhost", path: "/",
  });
  return page;
}
const comprobar = (t: string, c: boolean, d = "") => { console.log(`  ${c ? "✓" : "✗"} ${t}${d ? ` — ${d}` : ""}`); c ? ok++ : mal++; };

async function limpiar(client: pg.PoolClient) {
  await client.query(`DELETE FROM clases WHERE nombre LIKE '${MARCA}%'`);
  await client.query(`DELETE FROM casos_clinicos WHERE nombre LIKE '${MARCA}%'`);
  for (const email of [`${MARCA}.profe@annonia.dev`, `${MARCA}.alumna@annonia.dev`]) {
    const { rows } = await client.query(`SELECT id FROM auth.users WHERE email = $1`, [email]);
    for (const r of rows) {
      await client.query(`DELETE FROM pacientes WHERE "dietistaId" IN (SELECT id FROM dietistas WHERE "authId" = $1)`, [r.id]);
      await client.query(`DELETE FROM dietistas WHERE "authId" = $1`, [r.id]);
      await client.query(`DELETE FROM auth.identities WHERE user_id = $1::uuid`, [r.id]);
      await client.query(`DELETE FROM auth.users WHERE id = $1::uuid`, [r.id]);
    }
  }
  await client.query(`DELETE FROM licencias_docentes WHERE institucion LIKE '${MARCA}%'`);
}

async function crearCuenta(client: pg.PoolClient, email: string, extra: Record<string, unknown>) {
  const { rows } = await client.query(
    `INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
       created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous,
       confirmation_token, recovery_token, email_change_token_new, email_change,
       email_change_token_current, reauthentication_token, phone_change, phone_change_token)
     VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
       $1, crypt('LimpiezaPrueba_1', gen_salt('bf')), NOW(), NOW(), NOW(),
       '{"provider":"email","providers":["email"]}', '{}'::jsonb, false, false, '','','','','','','','')
     RETURNING id`, [email]);
  const authId = rows[0].id as string;
  await client.query(
    `INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
     VALUES (gen_random_uuid(), $1::uuid, $1::text, 'email',
       jsonb_build_object('sub',$1::text,'email',$2::text,'email_verified',true,'provider','email'), NOW(), NOW(), NOW())`,
    [authId, email]);
  const campos = Object.keys(extra);
  const { rows: d } = await client.query(
    `INSERT INTO dietistas (id, "authId", email, nombre, apellidos, verificado, "createdAt", "updatedAt"${campos.map((c) => `, "${c}"`).join("")})
     VALUES (gen_random_uuid()::text, $1, $2, 'Prueba', 'Limpieza', true, NOW(), NOW()${campos.map((_, i) => `, $${3 + i}`).join("")})
     RETURNING id`, [authId, email, ...campos.map((c) => extra[c])]);
  return d[0].id as string;
}

async function main() {
  const client = await pool.connect();
  try {
    await limpiar(client);

    const { rows: lic } = await client.query(
      `INSERT INTO licencias_docentes (id, institucion, "maxProfesores", "maxAlumnos", "fechaFin", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, 2, 10, '2027-08-31', NOW(), NOW()) RETURNING id`, [`${MARCA} Uni`]);
    const licenciaId = lic[0].id as string;
    const profeId = await crearCuenta(client, `${MARCA}.profe@annonia.dev`, { rolDocente: "PROFESOR", licenciaDocenteId: licenciaId });
    const alumnaId = await crearCuenta(client, `${MARCA}.alumna@annonia.dev`, { rolDocente: "ALUMNO", licenciaDocenteId: licenciaId });

    // Tres clases: una en marcha, otra cuyo curso ya acabó, y una tercera para lo recién corregido.
    const crearClase = async (nombre: string, fin: string) => {
      const { rows } = await client.query(
        `INSERT INTO clases (id, "profesorId", "licenciaDocenteId", nombre, "fechaInicioCurso", "fechaFinCurso", "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::text, $1, $2, $3, NOW() - INTERVAL '300 days', $4, NOW(), NOW()) RETURNING id`,
        [profeId, licenciaId, nombre, fin]);
      await client.query(
        `INSERT INTO profesores_clase (id, "claseId", "profesorId", "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::text, $1, $2, NOW(), NOW())`, [rows[0].id, profeId]);
      return rows[0].id as string;
    };
    const enMarcha = await crearClase(`${MARCA} en marcha`, "2027-08-31");
    // Acabada hace nada: el profesor todavía puede estar corrigiendo, así que NO se toca.
    const recienAcabada = await crearClase(`${MARCA} recien acabada`, new Date(Date.now() - 10 * 86400000).toISOString().slice(0, 10));
    // Acabada hace más de dos meses: ya sí.
    const acabada = await crearClase(`${MARCA} curso acabado`, "2026-01-31");

    /** Una entrega con PDF de 200 KB y su foto del trabajo. Cada una lleva su propio caso: un
     *  mismo caso solo se puede poner una vez a la misma clase. */
    let nCaso = 0;
    const crearEntrega = async (claseId: string, corregidaHace: number | null) => {
      nCaso++;
      // Cada caso tiene su propio paciente plantilla: la relación es uno a uno.
      const { rows: suPaciente } = await client.query(
        `INSERT INTO pacientes (id, "dietistaId", nombre, apellidos, "esCasoDocente", "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::text, $1, 'Caso', $2, true, NOW(), NOW()) RETURNING id`,
        [profeId, `Limpieza ${nCaso}`]);
      const { rows: otro } = await client.query(
        `INSERT INTO casos_clinicos (id, "profesorId", "licenciaDocenteId", nombre, "pacienteId", "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, NOW(), NOW()) RETURNING id`,
        [profeId, licenciaId, `${MARCA} Caso ${nCaso}`, suPaciente[0].id]);
      const { rows: a } = await client.query(
        `INSERT INTO asignaciones_caso (id, "casoId", "claseId", "asignadoPor", "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::text, $1, $2, $3, NOW(), NOW()) RETURNING id`, [otro[0].id, claseId, profeId]);
      const { rows: e } = await client.query(
        `INSERT INTO entregas_caso (id, "asignacionId", "alumnoId", estado, "entregadaAt", "entregaSnapshot",
            "entregableNombre", "entregableBytes", "entregablePdf", nota, comentario, "corregidaAt", "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::text, $1, $2, $3, NOW() - INTERVAL '100 days',
            jsonb_build_object('v', 1, 'relleno', repeat('x', 20000)),
            'entregable.pdf', 204800, decode(repeat('00', 204800), 'hex'),
            $4, $5, $6, NOW(), NOW()) RETURNING id`,
        [a[0].id, alumnaId, corregidaHace === null ? "ENTREGADA" : "CORREGIDA",
         corregidaHace === null ? null : 8.5, corregidaHace === null ? null : "Bien",
         corregidaHace === null ? null : new Date(Date.now() - corregidaHace * 86400000)]);
      return e[0].id as string;
    };

    // Un paciente de prácticas suyo, que es lo que la regla 4 se lleva cuando deja de ser alumna.
    await client.query(
      `INSERT INTO pacientes (id, "dietistaId", nombre, apellidos, "esDeClase", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, 'Practica', 'De la alumna', true, NOW(), NOW())`, [alumnaId]);

    const recienCorregida = await crearEntrega(enMarcha, 3);      // se queda: solo 3 días
    const corregidaVieja = await crearEntrega(enMarcha, 40);      // se le va el PDF
    const sinCorregir = await crearEntrega(enMarcha, null);       // se queda entera
    const deCursoRecien = await crearEntrega(recienAcabada, 5);   // se conserva: margen para corregir
    const deCursoAcabado = await crearEntrega(acabada, 5);        // se le va la foto

    const { rows: antes } = await client.query(
      `SELECT pg_size_pretty(pg_total_relation_size('entregas_caso')) AS t`);
    console.log(`\n── Cuatro entregas de 200 KB cada una · la tabla ocupa ${antes[0].t} ──`);

    // ── La simulación no toca nada ──
    console.log("\n── Simular no borra nada ──");
    const salidaSimulada = execFileSync("npx", ["tsx", "scripts/limpiar-docencia.ts"],
      { encoding: "utf8", env: { ...process.env, DB: "dev" } });
    comprobar("dice qué se llevaría", /se irían:/.test(salidaSimulada),
      salidaSimulada.split("\n").filter((l) => l.includes("se irían")).length + " líneas");
    const { rows: intactas } = await client.query(
      `SELECT COUNT(*)::int AS n FROM entregas_caso WHERE "entregablePdf" IS NOT NULL AND id = ANY($1::text[])`,
      [[recienCorregida, corregidaVieja, sinCorregir, deCursoAcabado]]);
    comprobar("y no ha tocado ni un PDF", intactas[0].n === 4, `${intactas[0].n} de 4 siguen`);

    // ── La limpieza de verdad ──
    console.log("\n── Limpiar de verdad ──");
    const salida = execFileSync("npx", ["tsx", "scripts/limpiar-docencia.ts", "--ejecutar"],
      { encoding: "utf8", env: { ...process.env, DB: "dev" } });
    console.log(salida.split("\n").filter((l) => /fotos|invitaciones|pacientes de prácticas|La base ocupa/.test(l)).map((l) => `    ${l.trim()}`).join("\n"));

    const estado = async (id: string) => {
      const { rows } = await client.query(
        `SELECT "entregablePdf" IS NULL AS "sinPdf", "entregableBytes" IS NULL AS "sinBytes",
                "entregaSnapshot" IS NULL AS "sinFoto", nota, comentario, "entregableNombre", "entregadaAt"
           FROM entregas_caso WHERE id = $1`, [id]);
      return rows[0];
    };

    const a = await estado(recienCorregida);
    comprobar("mientras el curso vive, la entrega se queda entera", a.sinFoto === false && a.sinPdf === false);

    const b = await estado(corregidaVieja);
    comprobar("y la de un curso vivo también, por vieja que sea la corrección", b.sinFoto === false);
    comprobar("con su nota", Number(b.nota) === 8.5, String(b.nota));
    comprobar("el comentario", b.comentario === "Bien");
    comprobar("el nombre de lo que entregó", b.entregableNombre === "entregable.pdf");
    comprobar("la fecha de entrega", !!b.entregadaAt);
    comprobar("y la foto del trabajo, que el curso sigue vivo", b.sinFoto === false);

    const c = await estado(sinCorregir);
    comprobar("lo que aún no se ha corregido no se toca", c.sinPdf === false && c.sinFoto === false);

    const c2 = await estado(deCursoRecien);
    comprobar("de un curso recién acabado NO se toca: el profesor puede estar corrigiendo", c2.sinFoto === false);

    const d = await estado(deCursoAcabado);
    comprobar("del curso terminado hace meses se va la foto del trabajo", d.sinFoto === true);
    comprobar("pero la nota se queda para siempre", Number(d.nota) === 8.5);

    // ── Los pacientes de prácticas: se van con el alumno, no antes ──
    console.log("\n── El paciente de prácticas ──");
    const { rows: sigueVivo } = await client.query(
      `SELECT COUNT(*)::int n FROM pacientes WHERE "dietistaId" = $1 AND "esDeClase" = true`, [alumnaId]);
    comprobar("mientras es alumna, su paciente de prácticas se queda", sigueVivo[0].n === 1, `${sigueVivo[0].n}`);
    // Deja de ser alumna (su 31 de agosto ya pasó) y se vuelve a limpiar.
    await client.query(`UPDATE dietistas SET "rolDocente" = NULL WHERE id = $1`, [alumnaId]);
    execFileSync("npx", ["tsx", "scripts/limpiar-docencia.ts", "--ejecutar"],
      { encoding: "utf8", env: { ...process.env, DB: "dev" } });
    const { rows: yaNo } = await client.query(
      `SELECT COUNT(*)::int n FROM pacientes WHERE "dietistaId" = $1 AND "esDeClase" = true`, [alumnaId]);
    comprobar("cuando deja de serlo, se va con ella", yaNo[0].n === 0, `${yaNo[0].n}`);
    const { rows: sigueCuenta } = await client.query(`SELECT 1 FROM dietistas WHERE id = $1`, [alumnaId]);
    comprobar("pero su cuenta no se toca", sigueCuenta.length === 1);

    // ── Lo que de verdad hay que comprobar: que las pantallas aguanten después ──
    // Si el paciente del alumno ya no está, el PDF no se puede rehacer. La vista del profesor
    // tiene que decirlo, no reventar (revisión 7 sep 2026).
    console.log("\n── Tras la limpieza, el profesor sigue pudiendo abrir la entrega ──");
    const navegador = await puppeteer.launch({
      executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      headless: true, args: ["--no-sandbox"],
    });
    try {
      const profe = await sesionDe(navegador, `${MARCA}.profe@annonia.dev`);
      const { rows: donde } = await client.query(
        `SELECT e.id AS entrega, a.id AS asignacion, a."casoId" AS caso
           FROM entregas_caso e JOIN asignaciones_caso a ON a.id = e."asignacionId"
          WHERE e.id = $1`, [corregidaVieja]);
      await profe.goto(`${BASE}/profesor/casos/${donde[0].caso}/entregas/${donde[0].asignacion}/${donde[0].entrega}`,
        { waitUntil: "networkidle0" });
      await esperar(2500);
      const visible = await profe.evaluate(() => document.body.innerText);
      comprobar("la pantalla de la entrega no revienta", visible.includes("Corregir") || visible.includes("Entregable"),
        profe.url().replace(BASE, ""));
      // La nota se pinta en un campo, así que no está en el texto plano de la página.
      const enPantalla = await profe.evaluate(() =>
        Array.from(document.querySelectorAll("input, textarea")).map((c) => (c as HTMLInputElement).value).join(" | "));
      comprobar("y la nota que le puso sigue ahí", /8[,.]5/.test(enPantalla), enPantalla.slice(0, 80) || "sin campos");
      const pdf = await profe.evaluate(async (id) => (await fetch(`/api/entregas/${id}/pdf`)).status, donde[0].entrega as string);
      comprobar("y el PDF, que ya no se puede rehacer, da 404 limpio en vez de romper", pdf === 404, `HTTP ${pdf}`);
    } finally {
      await navegador.close();
    }

    const { rows: despues } = await client.query(
      `SELECT pg_size_pretty(pg_total_relation_size('entregas_caso')) AS t`);
    console.log(`\n  la tabla ocupa ahora ${despues[0].t}`);

    console.log(`\n${mal === 0 ? "✓ TODO CORRECTO" : "✗ HAY FALLOS"} — ${ok} bien, ${mal} mal`);
  } finally {
    await limpiar(client).catch(() => {});
    client.release();
    await pool.end();
  }
  if (mal > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });

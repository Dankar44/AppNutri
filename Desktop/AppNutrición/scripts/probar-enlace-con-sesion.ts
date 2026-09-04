/**
 * #39 — El enlace de la clase abierto con una sesión ya dentro: un clic y apuntado (Guillermo,
 * 4 sep 2026). Necesita el estado de `preparar-prueba-docente.ts`.
 */
import "./_guard-solo-dev";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";
import puppeteer, { type Page } from "puppeteer-core";
import { createClient } from "@supabase/supabase-js";

const BASE = "http://localhost:3001";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: false } });
const EMAIL = "nutri.con.sesion@annonia.dev";
const PASS = "SesionPrueba_2026";
let ok = 0, mal = 0;
const comprobar = (t: string, c: boolean, d = "") => { console.log(`  ${c ? "✓" : "✗"} ${t}${d ? ` — ${d}` : ""}`); c ? ok++ : mal++; };
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));
const texto = (p: Page) => p.evaluate(() => document.body.innerText);

async function limpiar(client: pg.PoolClient) {
  const { rows } = await client.query(`SELECT id FROM auth.users WHERE email = $1`, [EMAIL]);
  for (const r of rows) {
    await client.query(`DELETE FROM dietistas WHERE "authId" = $1`, [r.id]);
    await client.query(`DELETE FROM auth.identities WHERE user_id = $1::uuid`, [r.id]);
    await client.query(`DELETE FROM auth.users WHERE id = $1::uuid`, [r.id]);
  }
}

async function main() {
  const client = await pool.connect();
  const navegador = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true, args: ["--no-sandbox"] });
  try {
    await limpiar(client);
    // Un nutricionista normal, con cuenta propia
    const { rows: au } = await client.query(
      `INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at,
         raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous, confirmation_token, recovery_token,
         email_change_token_new, email_change, email_change_token_current, reauthentication_token, phone_change, phone_change_token)
       VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', $1,
         crypt($2, gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', false, false,
         '', '', '', '', '', '', '', '') RETURNING id`, [EMAIL, PASS]);
    const authId = au[0].id as string;
    await client.query(
      `INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
       VALUES (gen_random_uuid(), $1::uuid, $1::text, 'email', jsonb_build_object('sub',$1::text,'email',$2::text), NOW(), NOW(), NOW())`, [authId, EMAIL]);
    const { rows: d } = await client.query(
      `INSERT INTO dietistas (id, "authId", email, nombre, apellidos, verificado, "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, 'Nutri', 'Con sesión', true, NOW(), NOW()) RETURNING id`, [authId, EMAIL]);
    const nutriId = d[0].id as string;

    // La clase de prueba, con el enlace abierto
    const { rows: prof } = await client.query(`SELECT id FROM dietistas WHERE email = 'profesor.prueba@annonia.dev'`);
    const { rows: cl } = await client.query(`SELECT id, "tokenInvitacion" FROM clases WHERE "profesorId" = $1 AND nombre = 'Dietoterapia 3º A'`, [prof[0].id]);
    let token = cl[0].tokenInvitacion as string | null;
    if (!token) {
      token = "PRUEBASESION" + Math.random().toString(36).slice(2, 10);
      await client.query(`UPDATE clases SET "tokenInvitacion" = $1 WHERE id = $2`, [token, cl[0].id]);
    }
    await client.query(`UPDATE clases SET "invitacionAbierta" = true WHERE id = $1`, [cl[0].id]);

    // Con la sesión abierta en el navegador
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const sb = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
    const { data, error } = await sb.auth.signInWithPassword({ email: EMAIL, password: PASS });
    if (error) throw new Error(error.message);
    const p = await (await navegador.createBrowserContext()).newPage();
    await p.setViewport({ width: 1200, height: 900 });
    await p.evaluateOnNewDocument(() => { try { localStorage.setItem("annonia-welcome-dietista", "1"); localStorage.setItem("annonia-cookie-consent", "rejected"); } catch {} });
    await p.setCookie({ name: `sb-${url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1]}-auth-token`, value: "base64-" + Buffer.from(JSON.stringify(data.session)).toString("base64"), domain: "localhost", path: "/" });

    console.log("\n── El enlace de la clase con la sesión ya abierta ──");
    await p.goto(`${BASE}/clase/${token}`, { waitUntil: "networkidle0" });
    await esperar(1500);
    let v = await texto(p);
    comprobar("no sale el formulario de crear cuenta", !v.includes("Crea tu cuenta para hacer las prácticas"));
    comprobar("sino «ya estás dentro con la cuenta…» y un botón de apuntarse", v.includes(`Ya estás dentro con la cuenta ${EMAIL}`) && v.includes("Apuntarme a la clase con esta cuenta"));
    comprobar("y la salida por si no es su cuenta", v.includes("No soy yo"));
    await p.screenshot({ path: "/tmp/annonia-recorrido/enlace-con-sesion.png" });
    await p.evaluate(() => { const b = Array.from(document.querySelectorAll("button")).find((x) => x.textContent?.includes("Apuntarme a la clase con esta cuenta")); (b as HTMLElement | undefined)?.click(); });
    await esperar(4000);
    comprobar("un clic y aterriza en su aula", p.url().endsWith("/aula"), p.url());
    v = await texto(p);
    comprobar("con la clase dentro", v.includes("Dietoterapia 3º A") && v.includes("Estás en 1 clase"));
    const { rows: m } = await client.query(`SELECT activa FROM alumnos_clase WHERE "claseId" = $1 AND "alumnoId" = $2`, [cl[0].id, nutriId]);
    comprobar("queda matriculado", m[0]?.activa === true);
    const { rows: rol } = await client.query(`SELECT "rolDocente", "cuentaDeClase" FROM dietistas WHERE id = $1`, [nutriId]);
    comprobar("pasa a ser alumno, pero su cuenta sigue siendo suya", rol[0].rolDocente === "ALUMNO" && rol[0].cuentaDeClase === false);

    console.log("\n── Segunda vez: ya está ──");
    await p.goto(`${BASE}/clase/${token}`, { waitUntil: "networkidle0" });
    await esperar(1500);
    await p.evaluate(() => { const b = Array.from(document.querySelectorAll("button")).find((x) => x.textContent?.includes("Apuntarme a la clase con esta cuenta")); (b as HTMLElement | undefined)?.click(); });
    await esperar(3500);
    const { rows: m2 } = await client.query(`SELECT COUNT(*)::int n FROM alumnos_clase WHERE "claseId" = $1 AND "alumnoId" = $2`, [cl[0].id, nutriId]);
    comprobar("no se duplica la matrícula", m2[0].n === 1);

    console.log("\n── El profesor no puede apuntarse como alumno a su propia clase ──");
    const { data: dp } = await sb.auth.signInWithPassword({ email: "profesor.prueba@annonia.dev", password: "ProfesorPrueba2026" });
    const pp = await (await navegador.createBrowserContext()).newPage();
    await pp.setCookie({ name: `sb-${url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1]}-auth-token`, value: "base64-" + Buffer.from(JSON.stringify(dp!.session)).toString("base64"), domain: "localhost", path: "/" });
    await pp.goto(`${BASE}/clase/${token}`, { waitUntil: "networkidle0" });
    await esperar(1500);
    await pp.evaluate(() => { const b = Array.from(document.querySelectorAll("button")).find((x) => x.textContent?.includes("Apuntarme a la clase con esta cuenta")); (b as HTMLElement | undefined)?.click(); });
    await esperar(3000);
    const { rows: mp } = await client.query(`SELECT COUNT(*)::int n FROM alumnos_clase WHERE "claseId" = $1 AND "alumnoId" = $2`, [cl[0].id, prof[0].id]);
    comprobar("se le dice que es profesor y no se le matricula", mp[0].n === 0 && !pp.url().endsWith("/aula"), pp.url());
  } finally {
    await limpiar(client);
    client.release();
    await navegador.close();
    await pool.end();
  }
  console.log(`\n${mal === 0 ? "✓" : "✗"} ${ok} bien, ${mal} mal`);
}
main().catch((e) => { console.error(e); process.exit(1); });

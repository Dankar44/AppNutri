/** Capturas rápidas de lo que acabo de arreglar, para mirarlo antes de decir que está. */
import "./_guard-solo-dev";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";
import { mkdirSync } from "node:fs";
import puppeteer, { type Page } from "puppeteer-core";
import { createClient } from "@supabase/supabase-js";

const BASE = "http://localhost:3001";
const DIR = "/tmp/annonia-feedback";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: false } });
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  mkdirSync(DIR, { recursive: true });
  const client = await pool.connect();
  const navegador = await puppeteer.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true, args: ["--no-sandbox"],
  });
  const foto = async (p: Page, n: string) => {
    await esperar(1300);
    await p.screenshot({ path: `${DIR}/${n}.png` as `${string}.png`, fullPage: true });
    console.log(`  ✓ ${n}.png`);
  };
  try {
    const { rows: prof } = await client.query(
      `SELECT id FROM dietistas WHERE email = 'profesor.prueba@annonia.dev'`);
    const { rows: cl } = await client.query(
      `SELECT id FROM clases WHERE "profesorId" = $1 LIMIT 1`, [prof[0].id]);
    const claseId = cl[0].id as string;

    // Dos alumnos: uno dentro y uno retirado, para ver los dos bloques.
    for (const [n, activa] of [["dentro", true], ["retirado", false]] as [string, boolean][]) {
      const { rows: u } = await client.query(
        `INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
           created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous,
           confirmation_token, recovery_token, email_change_token_new, email_change,
           email_change_token_current, reauthentication_token, phone_change, phone_change_token)
         VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
           $1, crypt('Feedback_2026', gen_salt('bf')), NOW(), NOW(), NOW(),
           '{"provider":"email","providers":["email"]}', '{}'::jsonb, false, false, '','','','','','','','')
         RETURNING id`, [`${n}@feedback.dev`]);
      await client.query(
        `INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
         VALUES (gen_random_uuid(), $1::uuid, $1::text, 'email',
           jsonb_build_object('sub',$1::text,'email',$2::text,'email_verified',true,'provider','email'), NOW(), NOW(), NOW())`,
        [u[0].id, `${n}@feedback.dev`]);
      const { rows: d } = await client.query(
        `INSERT INTO dietistas (id, "authId", email, nombre, apellidos, verificado, "rolDocente",
           "licenciaDocenteId", "cuentaDeClase", "createdAt", "updatedAt")
         SELECT gen_random_uuid()::text, $1, $2, 'Alumno', $3, true, 'ALUMNO', c."licenciaDocenteId", true, NOW(), NOW()
           FROM clases c WHERE c.id = $4 RETURNING id`, [u[0].id, `${n}@feedback.dev`, n, claseId]);
      await client.query(
        `INSERT INTO alumnos_clase (id, "claseId", "alumnoId", activa, "altaAt", "bajaAt")
         VALUES (gen_random_uuid()::text, $1, $2, $3, NOW(), $4)`,
        [claseId, d[0].id, activa, activa ? null : new Date()]);
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const sb = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
    const entrar = async (email: string, pass: string) => {
      const { data, error } = await sb.auth.signInWithPassword({ email, password: pass });
      if (error) throw new Error(error.message);
      const p = await (await navegador.createBrowserContext()).newPage();
      await p.setViewport({ width: 1440, height: 950 });
      await p.evaluateOnNewDocument(() => { try { localStorage.setItem("annonia-welcome-dietista", "1"); } catch {} });
      await p.setCookie({
        name: `sb-${url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1]}-auth-token`,
        value: "base64-" + Buffer.from(JSON.stringify(data.session)).toString("base64"),
        domain: "localhost", path: "/",
      });
      return p;
    };

    const profe = await entrar("profesor.prueba@annonia.dev", "ProfesorPrueba2026");
    await profe.goto(`${BASE}/profesor/clases`, { waitUntil: "networkidle0" });
    await foto(profe, "01-menu-solo-clases-encendido");
    await profe.goto(`${BASE}/profesor/clases/${claseId}`, { waitUntil: "networkidle0" });
    await esperar(800);
    await profe.evaluate(() => {
      const b = Array.from(document.querySelectorAll("button")).find((x) => x.textContent?.includes("alumno retirado"));
      (b as HTMLElement | undefined)?.click();
    });
    await foto(profe, "02-clase-retirados-aparte");
    await profe.goto(`${BASE}/ajustes?espacio=docente`, { waitUntil: "networkidle0" });
    await foto(profe, "03-ajustes-sin-perder-el-menu");

    const alumno = await entrar("dentro@feedback.dev", "Feedback_2026");
    await alumno.goto(`${BASE}/dashboard`, { waitUntil: "networkidle0" });
    await foto(alumno, "04-alumno-pie-del-menu");

    // El enlace de invitación abierto con la sesión del profesor puesta
    const { rows: tk } = await client.query(
      `INSERT INTO invitaciones_docentes (id, token, email, rol, "claseId", "licenciaDocenteId", "invitadoPor", "expiraAt", "createdAt", "updatedAt")
       SELECT gen_random_uuid()::text, 'feedbacktoken', 'nuevo@feedback.dev', 'ALUMNO', c.id, c."licenciaDocenteId", c."profesorId", NOW() + INTERVAL '30 days', NOW(), NOW()
         FROM clases c WHERE c.id = $1 RETURNING token`, [claseId]);
    await profe.goto(`${BASE}/invitacion/${tk[0].token}`, { waitUntil: "networkidle0" });
    await foto(profe, "05-invitacion-con-otra-sesion");
  } finally {
    await client.query(`DELETE FROM invitaciones_docentes WHERE email LIKE '%@feedback.dev'`);
    const { rows } = await client.query(`SELECT id FROM auth.users WHERE email LIKE '%@feedback.dev'`);
    for (const r of rows) {
      await client.query(`DELETE FROM dietistas WHERE "authId" = $1`, [r.id]);
      await client.query(`DELETE FROM auth.identities WHERE user_id = $1::uuid`, [r.id]);
      await client.query(`DELETE FROM auth.users WHERE id = $1::uuid`, [r.id]);
    }
    client.release();
    await navegador.close();
    await pool.end();
  }
  console.log(`\n✓ ${DIR}`);
}
main().catch((e) => { console.error(e); process.exit(1); });

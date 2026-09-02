/** Capturas del flujo de casos, para mirarlo antes de darlo por bueno. */
import "./_guard-solo-dev";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";
import { mkdirSync } from "node:fs";
import puppeteer, { type Page } from "puppeteer-core";
import { createClient } from "@supabase/supabase-js";

const BASE = "http://localhost:3001";
const DIR = "/tmp/annonia-casos";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: false } });
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  mkdirSync(DIR, { recursive: true });
  const client = await pool.connect();
  const navegador = await puppeteer.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true, args: ["--no-sandbox"],
  });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const sb = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
  const abrir = async (email: string, pass: string, ancho = 1440) => {
    const { data, error } = await sb.auth.signInWithPassword({ email, password: pass });
    if (error) throw new Error(`${email}: ${error.message}`);
    const p = await (await navegador.createBrowserContext()).newPage();
    await p.setViewport({ width: ancho, height: ancho < 500 ? 800 : 950 });
    await p.evaluateOnNewDocument(() => { try { localStorage.setItem("annonia-welcome-dietista", "1"); } catch {} });
    await p.setCookie({
      name: `sb-${url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1]}-auth-token`,
      value: "base64-" + Buffer.from(JSON.stringify(data.session)).toString("base64"),
      domain: "localhost", path: "/",
    });
    return p;
  };
  const foto = async (p: Page, n: string) => {
    await esperar(1500);
    await p.screenshot({ path: `${DIR}/${n}.png` as `${string}.png`, fullPage: true });
    console.log(`  ✓ ${n}.png`);
  };

  try {
    // Un caso de ejemplo en la clase de prueba, asignado a la alumna.
    const { rows: prof } = await client.query(`SELECT id, "licenciaDocenteId" FROM dietistas WHERE email = 'profesor.prueba@annonia.dev'`);
    const { rows: cl } = await client.query(`SELECT id FROM clases WHERE "profesorId" = $1 LIMIT 1`, [prof[0].id]);
    await client.query(`DELETE FROM casos_clinicos WHERE "profesorId" = $1 AND nombre LIKE 'Caso 3%'`, [prof[0].id]);
    const { rows: caso } = await client.query(
      `INSERT INTO casos_clinicos (id, "profesorId", "licenciaDocenteId", nombre, consigna, "pacienteNombre",
         "pacienteApellidos", sexo, peso, altura, objetivo, "nivelActividad", patologias, notas, "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, 'Caso 3: mujer vegana con anemia',
         'Haz un plan semanal cubriendo el hierro con alimentos vegetales y explica la pauta de suplementación.',
         'Marta', 'Vegana', 'FEMENINO', 58, 165, 'PATOLOGIA', 'Sedentaria, camina 30 min al día',
         ARRAY['Anemia ferropénica'],
         'Mujer de 28 años, vegana desde hace tres. Acude por cansancio y analítica con ferritina baja (9 ng/ml).',
         NOW(), NOW()) RETURNING id`, [prof[0].id, prof[0].licenciaDocenteId]);
    const { rows: asig } = await client.query(
      `INSERT INTO asignaciones_caso (id, "casoId", "claseId", "fechaLimite", "asignadoPor", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, CURRENT_DATE + 10, $3, NOW(), NOW())
       ON CONFLICT ("casoId", "claseId") DO UPDATE SET "fechaLimite" = EXCLUDED."fechaLimite" RETURNING id`,
      [caso[0].id, cl[0].id, prof[0].id]);
    void asig;

    const profe = await abrir("profesor.prueba@annonia.dev", "ProfesorPrueba2026");
    await profe.goto(`${BASE}/profesor/casos`, { waitUntil: "networkidle0" });
    await foto(profe, "01-casos-del-profesor");
    await profe.goto(`${BASE}/profesor/casos/${caso[0].id}`, { waitUntil: "networkidle0" });
    await foto(profe, "02-ficha-del-caso");

    const alumna = await abrir("alumna.prueba@annonia.dev", "AlumnaPrueba2026");
    await alumna.goto(`${BASE}/aula`, { waitUntil: "networkidle0" });
    await foto(alumna, "03-el-caso-en-su-aula");
    const movil = await abrir("alumna.prueba@annonia.dev", "AlumnaPrueba2026", 390);
    await movil.goto(`${BASE}/aula`, { waitUntil: "networkidle0" });
    await foto(movil, "04-su-aula-en-movil");
  } finally {
    client.release();
    await navegador.close();
    await pool.end();
  }
  console.log(`\n✓ ${DIR}`);
}
main().catch((e) => { console.error(e); process.exit(1); });

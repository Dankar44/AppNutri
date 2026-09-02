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
    await p.evaluateOnNewDocument(() => {
      try {
        localStorage.setItem("annonia-welcome-dietista", "1");
        localStorage.setItem("annonia-cookie-consent", "rejected");
      } catch {}
    });
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
    const { rows: prof } = await client.query(`SELECT id FROM dietistas WHERE email = 'profesor.prueba@annonia.dev'`);
    const { rows: caso } = await client.query(
      `SELECT id, "pacienteId" FROM casos_clinicos WHERE "profesorId" = $1 ORDER BY "createdAt" DESC LIMIT 1`, [prof[0].id]);
    const { rows: cl } = await client.query(`SELECT id FROM clases WHERE "profesorId" = $1 LIMIT 1`, [prof[0].id]);

    const profe = await abrir("profesor.prueba@annonia.dev", "ProfesorPrueba2026");
    await profe.goto(`${BASE}/profesor/casos`, { waitUntil: "networkidle0" });
    await foto(profe, "01-casos-del-profesor");
    await profe.goto(`${BASE}/profesor/casos/${caso[0].id}`, { waitUntil: "networkidle0" });
    await foto(profe, "02-ficha-del-caso");
    await profe.goto(`${BASE}/pacientes/${caso[0].pacienteId}?espacio=docente`, { waitUntil: "networkidle0" });
    await foto(profe, "02b-el-paciente-del-caso-con-la-ficha-de-siempre");
    await profe.goto(`${BASE}/profesor/clases/${cl[0].id}`, { waitUntil: "networkidle0" });
    await foto(profe, "02c-la-clase-con-sus-casos");

    const alumna = await abrir("alumna.prueba@annonia.dev", "AlumnaPrueba2026");
    await alumna.goto(`${BASE}/aula`, { waitUntil: "networkidle0" });
    await foto(alumna, "03-su-aula-con-las-clases");
    await alumna.goto(`${BASE}/aula/${cl[0].id}`, { waitUntil: "networkidle0" });
    await foto(alumna, "03b-dentro-de-la-clase-el-caso");
    // Empezar el caso para ver la ficha del paciente con el aviso arriba
    await alumna.evaluate(() => {
      const b = Array.from(document.querySelectorAll("button")).find((x) => x.textContent?.includes("Empezar el caso"));
      (b as HTMLElement | undefined)?.click();
    });
    await esperar(6000);
    await foto(alumna, "04-trabajando-el-caso");
    // Entrega, con nota, para ver el lado del profesor con algo dentro
    await alumna.goto(`${BASE}/aula/${cl[0].id}`, { waitUntil: "networkidle0" });
    await esperar(1500);
    await alumna.evaluate(() => {
      const b = Array.from(document.querySelectorAll("button")).find((x) => x.textContent?.trim().startsWith("Entregar"));
      (b as HTMLElement | undefined)?.click();
    });
    await esperar(800);
    await alumna.evaluate(() => {
      const c = document.querySelector("textarea") as HTMLTextAreaElement | null;
      if (c) {
        Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(c, "He priorizado legumbres y vitamina C en cada comida.");
        c.dispatchEvent(new Event("input", { bubbles: true }));
      }
      const b = Array.from(document.querySelectorAll("form button")).find((x) => x.textContent?.trim().startsWith("Entregar"));
      (b as HTMLElement | undefined)?.click();
    });
    await esperar(4000);
    await foto(alumna, "04b-la-clase-tras-entregar");

    await profe.goto(`${BASE}/profesor/casos/${caso[0].id}`, { waitUntil: "networkidle0" });
    await foto(profe, "06-el-caso-con-la-clase-y-sus-entregas");
    await profe.evaluate(() => {
      const a = Array.from(document.querySelectorAll("a")).find((x) => x.textContent?.includes("Alumna de prueba"));
      (a as HTMLElement | undefined)?.click();
    });
    await esperar(3500);
    await foto(profe, "07-el-trabajo-de-la-alumna");
    await profe.goto(`${BASE}/pacientes/${caso[0].pacienteId}?espacio=docente&desde=clase:${cl[0].id}`, { waitUntil: "networkidle0" });
    await foto(profe, "08-la-ficha-desde-la-clase");

    const movil = await abrir("alumna.prueba@annonia.dev", "AlumnaPrueba2026", 390);
    await movil.goto(`${BASE}/aula/${cl[0].id}`, { waitUntil: "networkidle0" });
    await foto(movil, "05-la-clase-en-movil");
  } finally {
    client.release();
    await navegador.close();
    await pool.end();
  }
  console.log(`\n✓ ${DIR}`);
}
main().catch((e) => { console.error(e); process.exit(1); });

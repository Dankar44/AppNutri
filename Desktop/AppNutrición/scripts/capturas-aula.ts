/** Capturas del aula de la alumna de prueba, para mirarla antes de darla por buena. */
import "./_guard-solo-dev";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import { mkdirSync } from "node:fs";
import puppeteer, { type Page } from "puppeteer-core";
import { createClient } from "@supabase/supabase-js";

const BASE = "http://localhost:3001";
const DIR = "/tmp/annonia-aula";
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  mkdirSync(DIR, { recursive: true });
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
    await esperar(1400);
    await p.screenshot({ path: `${DIR}/${n}.png` as `${string}.png`, fullPage: true });
    console.log(`  ✓ ${n}.png`);
  };

  try {
    const alumna = await abrir("alumna.prueba@annonia.dev", "AlumnaPrueba2026");
    await alumna.goto(`${BASE}/entrar`, { waitUntil: "networkidle0" });
    await foto(alumna, "01-aula-de-la-alumna");
    await alumna.goto(`${BASE}/dashboard`, { waitUntil: "networkidle0" });
    await foto(alumna, "02-su-cuenta-profesional");

    const movil = await abrir("alumna.prueba@annonia.dev", "AlumnaPrueba2026", 390);
    await movil.goto(`${BASE}/aula`, { waitUntil: "networkidle0" });
    await foto(movil, "03-aula-en-movil");

    const profe = await abrir("profesor.prueba@annonia.dev", "ProfesorPrueba2026");
    await profe.goto(`${BASE}/profesor/clases`, { waitUntil: "networkidle0" });
    const clase = await profe.evaluate(() =>
      (Array.from(document.querySelectorAll("a")).find((a) => a.getAttribute("href")?.startsWith("/profesor/clases/"))
        ?.getAttribute("href")) ?? "");
    await profe.goto(`${BASE}${clase}`, { waitUntil: "networkidle0" });
    await foto(profe, "04-clase-con-profesores-y-alumna");
  } finally {
    await navegador.close();
  }
  console.log(`\n✓ ${DIR}`);
}
main().catch((e) => { console.error(e); process.exit(1); });

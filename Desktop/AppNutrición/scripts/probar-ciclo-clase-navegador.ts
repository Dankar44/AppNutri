/**
 * #39 — El ciclo de vida de una clase a clics, en un navegador de verdad: crearla con sus dos
 * fechas, archivarla (la alumna sigue siendo alumna y entra normal), desarchivarla (la recupera),
 * apuntarse desde el enlace con la sesión ya abierta, y eliminarla del todo.
 * Necesita el estado de `preparar-prueba-docente.ts`. Deja capturas en /tmp/annonia-ciclo-clase.
 */
import "./_guard-solo-dev";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";
import { conexionResistente, type Conexion } from "./_conexion-viva";
import { mkdirSync } from "node:fs";
import puppeteer, { type Page } from "puppeteer-core";
import { createClient } from "@supabase/supabase-js";

const BASE = "http://localhost:3001";
const DIR = "/tmp/annonia-ciclo-clase";
const NUEVA = "Optativa de prueba";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: false } });
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));
let ok = 0, mal = 0;
const comprobar = (t: string, c: boolean, d = "") => { console.log(`  ${c ? "✓" : "✗"} ${t}${d ? ` — ${d}` : ""}`); c ? ok++ : mal++; };
const texto = (p: Page) => p.evaluate(() => document.body.innerText);
const menu = (p: Page) => p.evaluate(() => (document.querySelector("aside") as HTMLElement | null)?.innerText ?? "");

/** Pulsa como una persona: si hay un diálogo encima, solo se puede clicar dentro de él. */
async function pulsar(p: Page, tx: string) {
  const hecho = await p.evaluate((t) => {
    const modales = Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"], .fixed.inset-0'));
    const raiz: ParentNode = modales.length > 0 ? modales[modales.length - 1] : document;
    const n = Array.from(raiz.querySelectorAll("button, a, summary")).find((x) => x.textContent?.trim().startsWith(t));
    if (!n) return false;
    (n as HTMLElement).click();
    return true;
  }, tx);
  if (!hecho) console.log(`  (no encontré «${tx}»)`);
  await esperar(900);
  return hecho;
}
/** El botón de enviar del formulario que esté abierto. */
async function enviarFormulario(p: Page) {
  const hecho = await p.evaluate(() => {
    const b = document.querySelector('form button[type="submit"]') as HTMLElement | null;
    if (!b) return false;
    b.click();
    return true;
  });
  if (!hecho) console.log("  (no encontré el botón de enviar)");
  await esperar(900);
  return hecho;
}
async function escribir(p: Page, selector: string, valor: string) {
  await p.evaluate((sel, v) => {
    const c = document.querySelector(sel) as HTMLInputElement | null;
    if (!c) return;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(c, v);
    c.dispatchEvent(new Event("input", { bubbles: true }));
    c.dispatchEvent(new Event("change", { bubbles: true }));
  }, selector, valor);
}

async function main() {
  mkdirSync(DIR, { recursive: true });
  const client = conexionResistente(pool);
  const navegador = await puppeteer.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true, args: ["--no-sandbox"],
  });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const sb = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
  const abrir = async (email: string, pass: string) => {
    const { data, error } = await sb.auth.signInWithPassword({ email, password: pass });
    if (error) throw new Error(`${email}: ${error.message}`);
    const p = await (await navegador.createBrowserContext()).newPage();
    await p.setViewport({ width: 1440, height: 950 });
    await p.evaluateOnNewDocument(() => {
      try { localStorage.setItem("annonia-welcome-dietista", "1"); localStorage.setItem("annonia-cookie-consent", "rejected"); } catch {}
    });
    await p.setCookie({
      name: `sb-${url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1]}-auth-token`,
      value: "base64-" + Buffer.from(JSON.stringify(data.session)).toString("base64"),
      domain: "localhost", path: "/",
    });
    return p;
  };
  let n = 0;
  const foto = async (p: Page, nombre: string) => {
    await esperar(1000);
    n++;
    await p.screenshot({ path: `${DIR}/${String(n).padStart(2, "0")}-${nombre}.png` as `${string}.png`, fullPage: true });
  };

  try {
    await client.query(`DELETE FROM clases WHERE nombre = $1`, [NUEVA]);
    const profe = await abrir("profesor.prueba@annonia.dev", "ProfesorPrueba2026");
    const alumna = await abrir("alumna.prueba@annonia.dev", "AlumnaPrueba2026");

    console.log("\n1. El profesor crea una clase con sus dos fechas");
    await profe.goto(`${BASE}/profesor/clases`, { waitUntil: "networkidle0" });
    const lista = await texto(profe);
    comprobar("la clase de siempre sale con sus fechas", /Del \d{2}\/\d{2}\/\d{4} al \d{2}\/\d{2}\/\d{4}/.test(lista), lista.match(/Del [^\n]+/)?.[0] ?? "");
    comprobar("y ya no hay rastro del texto «2026/27»", !/20\d\d\/\d\d/.test(lista));
    await pulsar(profe, "Nueva clase");
    const dialogo = await texto(profe);
    comprobar("el formulario pide inicio y fin del curso", dialogo.includes("Inicio del curso") && dialogo.includes("Fin del curso"));
    const nativos = await profe.evaluate(() => document.querySelectorAll('input[type="date"]').length);
    comprobar("con el calendario de la app, no el del navegador", nativos === 0, `inputs date nativos: ${nativos}`);
    await foto(profe, "nueva-clase");
    await escribir(profe, 'input[placeholder="Dietoterapia 3º A"]', NUEVA);
    await esperar(300);
    await enviarFormulario(profe);
    await profe.waitForNavigation({ waitUntil: "networkidle0" }).catch(() => {});
    await esperar(1500);
    const ficha = await texto(profe);
    comprobar("la clase se crea y aterriza en su ficha", ficha.includes(NUEVA), ficha.split("\n").find((l) => l.includes(NUEVA)) ?? "");
    comprobar("con las fechas del curso", /Del \d{2}\/\d{2}\/\d{4} al \d{2}\/\d{2}\/\d{4}/.test(ficha));
    const { rows: creada } = await client.query(`SELECT id, "tokenInvitacion", "fechaInicioCurso", "fechaFinCurso" FROM clases WHERE nombre = $1`, [NUEVA]);
    comprobar("y guardada con las dos fechas en la base de datos", creada.length === 1 && !!creada[0].fechaInicioCurso && !!creada[0].fechaFinCurso);
    comprobar("la clase nace sin enlace abierto", creada[0].tokenInvitacion === null);
    await foto(profe, "clase-creada");

    // El enlace no existe hasta que el profesor lo abre: es lo que hace falta para el paso 4.
    await pulsar(profe, "Con un enlace");
    await pulsar(profe, "Abrir el enlace");
    await esperar(2000);
    const { rows: conEnlace } = await client.query(`SELECT "tokenInvitacion", "invitacionAbierta" FROM clases WHERE id = $1`, [creada[0].id]);
    comprobar("y al abrirlo se genera su enlace", conEnlace[0].invitacionAbierta === true && !!conEnlace[0].tokenInvitacion);
    const token = conEnlace[0].tokenInvitacion as string;

    console.log("\n2. Se archiva la clase de la alumna: no la echa");
    const { rows: vieja } = await client.query(`SELECT id FROM clases WHERE nombre = 'Dietoterapia 3º A'`);
    await profe.goto(`${BASE}/profesor/clases/${vieja[0].id}`, { waitUntil: "networkidle0" });
    await pulsar(profe, "Archivar");
    await esperar(600);
    await pulsar(profe, "Archivar");
    await esperar(2000);
    const trasArchivar = await texto(profe);
    comprobar("la clase queda archivada", trasArchivar.includes("Esta clase está archivada"));
    await foto(profe, "clase-archivada");

    await alumna.goto(`${BASE}/aula`, { waitUntil: "networkidle0" });
    const aula = await texto(alumna);
    comprobar("la alumna sigue entrando en su aula", alumna.url().includes("/aula"), alumna.url().replace(BASE, ""));
    comprobar("y lee que no está en ninguna clase", aula.includes("No estás en ninguna clase") || aula.includes("Todavía no estás en ninguna clase"));
    const pie = await menu(alumna);
    comprobar("sigue marcada como alumna, no como nutricionista", pie.includes("Alumno") || pie.includes("Aula"), pie.split("\n").slice(-3).join(" / "));
    const { rows: rol } = await client.query(`SELECT "rolDocente", "exAlumnoDesde" FROM dietistas WHERE email = 'alumna.prueba@annonia.dev'`);
    comprobar("y en la base de datos sigue siendo ALUMNO", rol[0].rolDocente === "ALUMNO" && !rol[0].exAlumnoDesde, `rol=${rol[0].rolDocente} exAlumno=${rol[0].exAlumnoDesde ?? "no"}`);
    await foto(alumna, "alumna-sin-clase");

    console.log("\n3. Se desarchiva: la recupera");
    await profe.goto(`${BASE}/profesor/clases/${vieja[0].id}`, { waitUntil: "networkidle0" });
    await pulsar(profe, "Desarchivar");
    await esperar(600);
    await pulsar(profe, "Desarchivar");
    await esperar(2000);
    await alumna.goto(`${BASE}/aula`, { waitUntil: "networkidle0" });
    const aula2 = await texto(alumna);
    comprobar("la alumna vuelve a tener su clase", aula2.includes("Dietoterapia 3º A"));
    comprobar("con su caso todavía por entregar", /1 caso/.test(aula2), aula2.split("\n").find((l) => /caso/.test(l))?.trim() ?? "");
    await foto(alumna, "alumna-recupera-clase");
    await pulsar(alumna, "Dietoterapia 3º A");
    await esperar(2000);
    const dentroClase = await texto(alumna);
    comprobar("y al entrar sigue estando el caso del profesor", dentroClase.includes("mujer vegana"),
      dentroClase.split("\n").find((l) => /vegana/.test(l))?.trim() ?? alumna.url().replace(BASE, ""));
    await foto(alumna, "clase-recuperada-por-dentro");

    console.log("\n4. El enlace de la clase con la sesión ya abierta");
    await alumna.goto(`${BASE}/clase/${token}`, { waitUntil: "networkidle0" });
    const enlace = await texto(alumna);
    comprobar("le dice con qué cuenta está dentro", enlace.includes("alumna.prueba@annonia.dev"));
    comprobar("y ofrece apuntarse con un clic", /Apuntarme a la clase/i.test(enlace));
    comprobar("con la salida por si no es ella", /No soy yo/i.test(enlace));
    const formulario = await alumna.evaluate(() => document.querySelectorAll('input[type="password"]').length);
    comprobar("sin pedirle crear otra cuenta", formulario === 0);
    await foto(alumna, "enlace-con-sesion");
    await pulsar(alumna, "Apuntarme a la clase");
    await esperar(2500);
    const dentro = await texto(alumna);
    comprobar("un clic y está dentro de la clase nueva", dentro.includes(NUEVA), alumna.url().replace(BASE, ""));
    const { rows: mat } = await client.query(
      `SELECT 1 FROM alumnos_clase ac JOIN dietistas d ON d.id = ac."alumnoId" WHERE ac."claseId" = $1 AND d.email = 'alumna.prueba@annonia.dev'`, [creada[0].id]);
    comprobar("y matriculada de verdad", mat.length === 1);
    await foto(alumna, "apuntada-con-un-clic");

    console.log("\n5. El profesor no puede apuntarse como alumno a su clase");
    await profe.goto(`${BASE}/clase/${token}`, { waitUntil: "networkidle0" });
    const comoProfe = await texto(profe);
    comprobar("al profesor no se le ofrece apuntarse", !/Apuntarme a la clase/i.test(comoProfe), comoProfe.split("\n").filter(Boolean).slice(0, 3).join(" / "));
    comprobar("se le explica que el enlace es para sus alumnos", /Estás dentro como profesor/.test(comoProfe));
    comprobar("y se le ofrece ir a sus clases", /Ir a mis clases/.test(comoProfe));
    await foto(profe, "enlace-visto-por-el-profesor");

    console.log("\n6. Eliminar la clase la borra del todo");
    await profe.goto(`${BASE}/profesor/clases/${creada[0].id}`, { waitUntil: "networkidle0" });
    await pulsar(profe, "Eliminar");
    await esperar(700);
    const aviso = await texto(profe);
    comprobar("avisa de lo que se lleva por delante", /No se puede deshacer/i.test(aviso) && /Archivar/.test(aviso));
    comprobar("y cuenta a la alumna matriculada", /su alumno matriculado/.test(aviso), aviso.split("\n").find((l) => /Se borra la clase/.test(l))?.slice(0, 90) ?? "");
    // Confirmar un borrado irreversible con el botón verde de siempre invita a pulsarlo: tiene que ir en rojo.
    const rojo = await profe.evaluate(() => {
      const b = Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"] button')).find((x) => x.textContent?.trim() === "Eliminar");
      return b ? { clases: b.className, fondo: getComputedStyle(b).backgroundColor } : null;
    });
    comprobar("y el botón de confirmar va en rojo, no en verde", rojo !== null && /bg-red-/.test(rojo.clases), rojo?.fondo ?? "sin botón");
    await foto(profe, "confirmar-eliminar");
    await pulsar(profe, "Eliminar");
    await esperar(2500);
    const finLista = await texto(profe);
    comprobar("la clase desaparece de la lista", !finLista.includes(NUEVA), profe.url().replace(BASE, ""));
    const { rows: quedan } = await client.query(`SELECT 1 FROM clases WHERE nombre = $1`, [NUEVA]);
    comprobar("y no queda nada suyo en la base de datos", quedan.length === 0);
    const { rows: sigue } = await client.query(`SELECT "rolDocente" FROM dietistas WHERE email = 'alumna.prueba@annonia.dev'`);
    comprobar("la alumna conserva su cuenta", sigue.length === 1 && sigue[0].rolDocente === "ALUMNO");
    await alumna.goto(`${BASE}/aula`, { waitUntil: "networkidle0" });
    const aulaFin = await texto(alumna);
    comprobar("y en su aula solo le queda la clase de siempre", aulaFin.includes("Dietoterapia 3º A") && !aulaFin.includes(NUEVA));
    await foto(alumna, "aula-tras-eliminar");

    console.log(`\n${mal === 0 ? "✓ TODO CORRECTO" : "✗ HAY FALLOS"} — ${ok} bien, ${mal} mal`);
    console.log(`  capturas en ${DIR}`);
  } finally {
    await navegador.close();
    await pool.end();
  }
  if (mal > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });

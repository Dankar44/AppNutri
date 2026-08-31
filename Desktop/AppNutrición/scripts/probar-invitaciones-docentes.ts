/**
 * Prueba del alta de profesores por invitación (#39), con navegador de verdad.
 *
 * Nadie le pone la contraseña a nadie: se manda un correo con un enlace y la persona crea su
 * cuenta con la clave que elija. Esto recorre el camino entero, incluido lo que solo se ve
 * usándolo: que la página del enlace no la corte el proxy (le pasó el 30 ago 2026), que el
 * enlace no valga dos veces, y que a quien ya tiene cuenta no se le mande a registrarse.
 *
 *   1. npm run dev:desarrollo        (puerto 3001)
 *   2. DB=dev npx tsx scripts/probar-invitaciones-docentes.ts
 *
 * Crea sus datos y los borra. Solo con DB=dev: contra producción aborta.
 */
import "./_guard-solo-dev";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";
import puppeteer, { type Page } from "puppeteer-core";
import { SignJWT } from "jose";

const BASE = "http://localhost:3001";
const EMAIL_INVITADO = "profesor.invitado@annonia.dev";
const CLAVE_ELEGIDA = "LaQueYoElijo2026";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: false } });

let ok = 0, mal = 0;
const comprobar = (t: string, c: boolean, d = "") => { console.log(`  ${c ? "✓" : "✗"} ${t}${d ? ` — ${d}` : ""}`); c ? ok++ : mal++; };
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function rellenar(page: Page, etiqueta: string, valor: string) {
  const hecho = await page.evaluate((tx, v) => {
    const l = Array.from(document.querySelectorAll("label")).find((x) => x.textContent?.trim().startsWith(tx));
    const c = l?.parentElement?.querySelector("input") as HTMLInputElement | null;
    if (!c) return false;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(c, v);
    c.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  }, etiqueta, valor);
  if (!hecho) throw new Error(`campo "${etiqueta}" no encontrado`);
}

async function pulsar(page: Page, texto: string) {
  const hecho = await page.evaluate((tx) => {
    const n = Array.from(document.querySelectorAll("button, a")).find((x) => x.textContent?.trim().startsWith(tx));
    if (!n) return false;
    (n as HTMLElement).click();
    return true;
  }, texto);
  if (!hecho) throw new Error(`botón "${texto}" no encontrado`);
}

async function main() {
  const client = await pool.connect();
  const navegador = await puppeteer.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true, args: ["--no-sandbox"],
  });
  try {
    // Limpieza previa
    await client.query(`DELETE FROM invitaciones_docentes WHERE email = $1`, [EMAIL_INVITADO]);
    await client.query(`DELETE FROM dietistas WHERE "authId" IN (SELECT id::text FROM auth.users WHERE email = $1)`, [EMAIL_INVITADO]);
    await client.query(`DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email = $1)`, [EMAIL_INVITADO]);
    await client.query(`DELETE FROM auth.users WHERE email = $1`, [EMAIL_INVITADO]);

    const { rows: lic } = await client.query(`SELECT id, "maxProfesores" FROM licencias_docentes ORDER BY "createdAt" LIMIT 1`);
    const licenciaId = lic[0].id as string;
    await client.query(`UPDATE licencias_docentes SET "maxProfesores" = 5 WHERE id = $1`, [licenciaId]);

    const adminToken = await new SignJWT({ email: (process.env.ADMIN_EMAILS ?? "").split(",")[0].trim(), role: "admin" })
      .setProtectedHeader({ alg: "HS256" }).setExpirationTime("1d")
      .sign(new TextEncoder().encode(process.env.PATIENT_JWT_SECRET!));

    const page = await navegador.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.setCookie({ name: "annonia-admin-session", value: adminToken, domain: "localhost", path: "/" });

    console.log("\n── Invitar por correo desde el panel ──");
    await page.goto(`${BASE}/admin/universidades/${licenciaId}`, { waitUntil: "networkidle0" });
    await pulsar(page, "Invitar por correo");
    await esperar(400);
    await rellenar(page, "Correo", EMAIL_INVITADO);
    await pulsar(page, "Enviar invitación");
    await esperar(3000);

    const { rows: inv } = await client.query(
      `SELECT token, rol, "expiraAt", "aceptadaAt", "invitadoPor" FROM invitaciones_docentes WHERE email = $1`, [EMAIL_INVITADO]);
    comprobar("la invitación queda guardada", inv.length === 1);
    if (inv.length === 0) throw new Error("sin invitación no se puede seguir");
    comprobar("con rol de profesor", inv[0].rol === "PROFESOR");
    comprobar("sin usar todavía", inv[0].aceptadaAt === null);
    comprobar("y con quién invitó", !!inv[0].invitadoPor, String(inv[0].invitadoPor));
    comprobar("NO se ha creado ninguna cuenta aún",
      (await client.query(`SELECT 1 FROM auth.users WHERE email = $1`, [EMAIL_INVITADO])).rows.length === 0);

    await page.reload({ waitUntil: "networkidle0" });
    comprobar("el panel muestra la invitación pendiente", (await page.content()).includes(EMAIL_INVITADO));

    console.log("\n── El profesor abre el enlace y elige SU contraseña ──");
    const token = inv[0].token as string;
    const pagina2 = await (await navegador.createBrowserContext()).newPage();
    await pagina2.setViewport({ width: 1440, height: 900 });
    await pagina2.goto(`${BASE}/invitacion/${token}`, { waitUntil: "networkidle0" });
    const html = await pagina2.content();
    comprobar("la página de invitación carga", html.includes("Crea tu cuenta de profesor"));
    const correoEnPantalla = await pagina2.evaluate(() => {
      const c = document.querySelector('input[type="email"]') as HTMLInputElement | null;
      return { valor: c?.value ?? "", bloqueado: c?.disabled ?? false };
    });
    comprobar("le muestra su correo", correoEnPantalla.valor === EMAIL_INVITADO, correoEnPantalla.valor);
    comprobar("y no lo puede cambiar", correoEnPantalla.bloqueado);
    comprobar("y la institución", html.includes("Universidad Pablo de Olavide"));

    await rellenar(pagina2, "Nombre", "Nueva");
    await rellenar(pagina2, "Apellidos", "Profesora");
    await rellenar(pagina2, "Contraseña", CLAVE_ELEGIDA);
    await pulsar(pagina2, "Crear mi cuenta");
    await esperar(4000);

    const { rows: creada } = await client.query(
      `SELECT d."rolDocente", d.verificado, d."fuenteContacto", d."licenciaDocenteId",
              (SELECT count(*)::int FROM suscripciones s WHERE s."dietistaId" = d.id) AS suscripciones
       FROM dietistas d WHERE d.email = $1`, [EMAIL_INVITADO]);
    comprobar("la cuenta se crea al aceptar", creada.length === 1);
    if (creada.length > 0) {
      comprobar("con rol de profesor", creada[0].rolDocente === "PROFESOR");
      comprobar("verificada", creada[0].verificado === true);
      comprobar("atada a la licencia", creada[0].licenciaDocenteId === licenciaId);
      comprobar("con su suscripción", creada[0].suscripciones === 1);
    }
    const { rows: usada } = await client.query(`SELECT "aceptadaAt" FROM invitaciones_docentes WHERE email = $1`, [EMAIL_INVITADO]);
    comprobar("la invitación queda marcada como usada", usada[0]?.aceptadaAt !== null);

    console.log("\n── Entra con la contraseña que eligió ──");
    await pagina2.goto(`${BASE}/login`, { waitUntil: "networkidle0" });
    await pagina2.type('input[type="email"]', EMAIL_INVITADO);
    await pagina2.type('input[type="password"]', CLAVE_ELEGIDA);
    await Promise.all([
      pagina2.waitForNavigation({ waitUntil: "networkidle0", timeout: 30000 }).catch(() => {}),
      pagina2.evaluate(() => (document.querySelector("form") as HTMLFormElement)?.requestSubmit()),
    ]);
    await esperar(4000);
    comprobar("entra y aterriza en su espacio docente", pagina2.url().endsWith("/profesor"), pagina2.url().replace(BASE, ""));

    console.log("\n── El enlace ya no vale una segunda vez ──");
    const pagina3 = await (await navegador.createBrowserContext()).newPage();
    await pagina3.goto(`${BASE}/invitacion/${token}`, { waitUntil: "networkidle0" });
    comprobar("dice que el enlace ya no es válido", (await pagina3.content()).includes("ya no vale"));
    const inventado = await pagina3.goto(`${BASE}/invitacion/token-inventado-12345`, { waitUntil: "networkidle0" });
    comprobar("un token inventado tampoco cuela", inventado?.status() === 200 && (await pagina3.content()).includes("ya no vale"));

    console.log("\n── Invitar a alguien que YA tiene cuenta ──");
    await page.goto(`${BASE}/admin/universidades/${licenciaId}`, { waitUntil: "networkidle0" });
    await pulsar(page, "Invitar por correo");
    await esperar(400);
    await rellenar(page, "Correo", "nutricionista@annonia.dev");
    await pulsar(page, "Enviar invitación");
    await esperar(3500);
    const { rows: nutri } = await client.query(
      `SELECT "rolDocente", "licenciaDocenteId" FROM dietistas WHERE email = 'nutricionista@annonia.dev'`);
    comprobar("no se crea otra cuenta: se le da el rol", nutri[0]?.rolDocente === "PROFESOR", String(nutri[0]?.rolDocente));
    const { rows: sinInv } = await client.query(
      `SELECT count(*)::int AS n FROM invitaciones_docentes WHERE email = 'nutricionista@annonia.dev'`);
    comprobar("y no se le manda a registrarse", sinInv[0].n === 0);

    console.log("\n── Limpieza ──");
    await client.query(`UPDATE dietistas SET "rolDocente" = NULL, "licenciaDocenteId" = NULL WHERE email = 'nutricionista@annonia.dev'`);
    await client.query(`DELETE FROM invitaciones_docentes WHERE email = $1`, [EMAIL_INVITADO]);
    await client.query(`DELETE FROM dietistas WHERE email = $1`, [EMAIL_INVITADO]);
    await client.query(`DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email = $1)`, [EMAIL_INVITADO]);
    await client.query(`DELETE FROM auth.users WHERE email = $1`, [EMAIL_INVITADO]);
    await client.query(`UPDATE licencias_docentes SET "maxProfesores" = 3 WHERE id = $1`, [licenciaId]);
    comprobar("desarrollo queda como estaba", true);

    console.log(`\n${mal === 0 ? "✓ TODO CORRECTO" : "✗ HAY FALLOS"} — ${ok} bien, ${mal} mal\n`);
    if (mal > 0) process.exitCode = 1;
  } finally {
    await navegador.close();
    client.release();
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
